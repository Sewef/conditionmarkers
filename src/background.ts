import OBR, { AttachmentBehavior, Image, Item, isImage } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import { getMarkerPosition, getMarkerScale, isPlainObject } from "./helpers";

import icon from "./icon.svg";
import { setupConditionMarkersApi } from "./api";
import { fixUrls } from "./fixUrls";

/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the condition markers.
 */

OBR.onReady(() => {
  setupConditionMarkersApi();

  fixUrls();

  OBR.contextMenu.create({
    id: getPluginId("menu"),
    icons: [
      {
        icon,
        label: "Condition Markers",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER", coordinator: "||" },
            { key: "layer", value: "MOUNT" },
            { key: "type", value: "IMAGE" },
          ],
          permissions: ["UPDATE"],
        },
      },
    ],
    onClick(_, elementId) {
      OBR.popover.open({
        id: getPluginId("condition-markers"),
        url: "/",
        height: 260,
        width: 260,
        anchorElementId: elementId,
      });
    },
    shortcut: "Shift + C"
  });

  setupMarkerUpdates();
});

type ItemsApi = Pick<typeof OBR.scene.items, "updateItems">;

/** Consume complete scene snapshots, with at most one write in flight. */
export function createMarkerUpdater(
  itemsApi: ItemsApi,
  getDpi: () => Promise<number>,
  onError: (error: unknown) => void = console.error,
) {
  let pending: Item[] | undefined;
  let running = false;
  let generation = 0;
  let signatures = new Map<string, string>();

  async function drain() {
    running = true;
    try {
      while (pending) {
        const items = pending;
        pending = undefined;
        const currentGeneration = generation;
        const dpi = await getDpi();
        // A newer snapshot supersedes this one while the grid is being read.
        if (currentGeneration !== generation || pending) continue;

        const markersByToken = new Map<string, Image[]>();
        for (const item of items) {
          const metadata = item.metadata[getPluginId("metadata")];
          if (!isImage(item) || !item.attachedTo ||
              !isPlainObject(metadata) || metadata.enabled !== true) continue;
          const markers = markersByToken.get(item.attachedTo) ?? [];
          markers.push(item);
          markersByToken.set(item.attachedTo, markers);
        }

        const nextSignatures = new Map<string, string>();
        const updates = new Map<string, {
          tokenId: string;
          position: { x: number; y: number };
          scale: { x: number; y: number };
        }>();
        for (const token of items) {
          if (!isImage(token) ||
              (token.layer !== "CHARACTER" && token.layer !== "MOUNT")) continue;
          const markers = markersByToken.get(token.id);
          if (!markers?.length) continue;
          // Scene array order is not a marker slot. Keep it stable across clients.
          markers.sort((a, b) => a.id.localeCompare(b.id));
          const signature = JSON.stringify([
            dpi, token.position.x, token.position.y, token.scale.x, token.scale.y, token.rotation,
            token.image.width, token.grid.dpi, token.grid.offset.x, token.grid.offset.y,
            markers.map(marker => marker.id),
          ]);
          nextSignatures.set(token.id, signature);
          // Ignore visibility, metadata, and our own marker updates.
          if (signatures.get(token.id) === signature) continue;
          markers.forEach((marker, index) => updates.set(marker.id, {
            tokenId: token.id,
            position: getMarkerPosition(token, index, dpi),
            scale: getMarkerScale(token),
          }));
        }
        // Record before writing: updateItems itself emits an onChange event.
        signatures = nextSignatures;
        if (updates.size === 0) continue;
        await itemsApi.updateItems([...updates.keys()], markers => {
          for (const marker of markers) {
            const update = updates.get(marker.id);
            if (!update || !isImage(marker) || marker.attachedTo !== update.tokenId) continue;
            const differs = (a: number, b: number) => Math.abs(a - b) > 1e-6;
            if (differs(marker.position.x, update.position.x) ||
                differs(marker.position.y, update.position.y)) {
              marker.position = update.position;
            }
            if (differs(marker.scale.x, update.scale.x) ||
                differs(marker.scale.y, update.scale.y)) {
              marker.scale = update.scale;
            }
            if (marker.rotation !== 0) marker.rotation = 0;
            // Preserve any attachment options set by other extensions.
            const disabled = marker.disableAttachmentBehavior ?? [];
            if (!disabled.includes("ROTATION") || !disabled.includes("SCALE")) {
              marker.disableAttachmentBehavior = [
                ...new Set<AttachmentBehavior>([...disabled, "ROTATION", "SCALE"]),
              ];
            }
          }
        });
      }
    } catch (error) {
      signatures.clear();
      onError(error);
    } finally {
      running = false;
      if (pending) void drain();
    }
  }

  return {
    update(items: Item[]) {
      pending = items;
      if (!running) void drain();
    },
    reset() {
      generation++;
      pending = undefined;
      signatures.clear();
    },
  };
}

export function setupMarkerUpdates() {
  const updater = createMarkerUpdater(OBR.scene.items, () => OBR.scene.grid.getDpi());
  let unsubscribe: (() => void) | undefined;
  let latestItems: Item[] | undefined;
  let generation = 0;
  async function ready(ready: boolean) {
    const currentGeneration = ++generation;
    unsubscribe?.();
    unsubscribe = undefined;
    latestItems = undefined;
    updater.reset();
    if (!ready) return;
    let receivedSnapshot = false;
    unsubscribe = OBR.scene.items.onChange(items => {
      receivedSnapshot = true;
      latestItems = items;
      updater.update(items);
    });
    try {
      const items = await OBR.scene.items.getItems();
      if (generation === currentGeneration && !receivedSnapshot) {
        latestItems = items;
        updater.update(items);
      }
    } catch (error) {
      console.error("Could not initialize condition marker updates", error);
    }
  }
  OBR.scene.onReadyChange(ready);
  const initialGeneration = generation;
  void OBR.scene.isReady().then(value => {
    if (generation === initialGeneration) void ready(value);
  });
  OBR.scene.grid.onChange(() => {
    // DPI is part of the layout signature; other grid changes are harmless.
    if (latestItems) updater.update(latestItems);
  });
}

