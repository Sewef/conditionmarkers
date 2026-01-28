import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import { isImage } from "@owlbear-rodeo/sdk";
import type { Image } from "@owlbear-rodeo/sdk";

import icon from "./icon.svg";
import { setupConditionMarkersApi } from "./api";

/**
 * This file represents the background script run when the plugin loads.
 * It creates the context menu item for the condition markers.
 */

OBR.onReady(() => {
  // Setup API listener in the background so other plugins can call it
  setupConditionMarkersApi();
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

  // Listen for token changes and reposition markers
  OBR.scene.items.onChange(async (items) => {
    // Find tokens that have changed
    const changedTokens = items.filter((item): item is Image =>
      isImage(item) &&
      (item.layer === "CHARACTER" || item.layer === "MOUNT")
    );

    if (changedTokens.length === 0) return;

    // Get all condition markers
    const allItems = await OBR.scene.items.getItems();
    const conditionMarkers = allItems.filter((item): item is Image => {
      if (!isImage(item)) return false;
      const metadata = item.metadata[getPluginId("metadata")];
      return !!(metadata && typeof metadata === "object" &&
        Object.prototype.hasOwnProperty.call(metadata, "enabled") &&
        (metadata as any).enabled === true);
    });

    // Find markers attached to changed tokens
    const markersToUpdate: Array<{ id: string; position: { x: number; y: number }; scale: { x: number; y: number } }> = [];
    const sceneDpi = await OBR.scene.grid.getDpi();

    for (const token of changedTokens) {
      const attachedMarkers = conditionMarkers.filter(m => m.attachedTo === token.id);

      for (let i = 0; i < attachedMarkers.length; i++) {
        const marker = attachedMarkers[i];
        const newPosition = getMarkerPosition(token, i, sceneDpi);
        const newScale = getMarkerScale(token);

        // Only update if position or scale changed
        if (
          marker.position.x !== newPosition.x ||
          marker.position.y !== newPosition.y ||
          marker.scale.x !== newScale.x ||
          marker.scale.y !== newScale.y
        ) {
          markersToUpdate.push({
            id: marker.id,
            position: newPosition,
            scale: newScale
          });
        }
      }
    }

    // Update markers if needed
    if (markersToUpdate.length > 0) {
      await OBR.scene.items.updateItems(
        markersToUpdate.map(m => m.id),
        (markers) => {
          for (let i = 0; i < markers.length; i++) {
            if (isImage(markers[i])) {
              markers[i].position = markersToUpdate[i].position;
              markers[i].scale = markersToUpdate[i].scale;
              markers[i].rotation = 0;
              markers[i].disableAttachmentBehavior = ["ROTATION", "SCALE"];
            }
          }
        }
      );
    }
  });
});

// Helper functions (duplicated from helpers.ts for background script)
function getMarkerPosition(imageItem: Image, count: number, sceneDpi: number) {
  const markerGridPosition = {
    x: -1,
    y: count,
  };

  const MARKERS_PER_ROW = 5;
  const tokenGridCellWidth = imageItem.image.width / MARKERS_PER_ROW;
  const gridCellSpacing = tokenGridCellWidth;
  let position = {
    x: markerGridPosition.x * gridCellSpacing,
    y: markerGridPosition.y * gridCellSpacing
  };

  position = {
    x: position.x - imageItem.grid.offset.x,
    y: position.y - imageItem.grid.offset.y
  };

  position = {
    x: position.x * (sceneDpi / imageItem.grid.dpi),
    y: position.y * (sceneDpi / imageItem.grid.dpi)
  };

  const absScale = {
    x: Math.abs(imageItem.scale.x),
    y: Math.abs(imageItem.scale.y),
  };

  position = {
    x: position.x * absScale.x,
    y: position.y * absScale.y
  };

  position = {
    x: position.x + imageItem.position.x,
    y: position.y + imageItem.position.y
  };

  return position;
}

function getMarkerScale(imageItem: Image) {
  const absScale = {
    x: Math.abs(imageItem.scale.x),
    y: Math.abs(imageItem.scale.y),
  };
  const imageWidthGrid = imageItem.image.width / imageItem.grid.dpi;
  const scaleX = absScale.x * imageWidthGrid;
  const scaleY = absScale.y * imageWidthGrid;
  return { x: scaleX, y: scaleY };
}

