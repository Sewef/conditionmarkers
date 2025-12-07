import OBR, { Item, Math2, buildImage, buildText, isImage, isText } from "@owlbear-rodeo/sdk";
import type { Image, ImageGrid, Vector2, Text } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

export function isPlainObject(
  item: unknown
): item is Record<keyof any, unknown> {
  return (
    item !== null && typeof item === "object" && item.constructor === Object
  );
}

/** Update the selected state of the condition buttons */
export async function updateConditionButtons(items: Item[], selection?: string[]) {
  if (selection === undefined) selection = await OBR.player.getSelection();
  // Remove all previous selected states
  document.querySelectorAll(".selected-icon").forEach(element => element.classList.remove("visible"));
  // Get all the markers that are attached to our current selection
  for (const item of items) {
    const metadata = item.metadata[getPluginId("metadata")];
    if (isPlainObject(metadata) &&
      metadata.enabled &&
      isImage(item) &&
      item.attachedTo &&
      selection?.includes(item.attachedTo)) {
      // Add selected state to this marker
      const condition = item.name.replace("Condition Marker - ", "");
      document.getElementById(`${condition}Select`)?.classList.add("visible");
    }
  }
}

/**
 * Helper to build and position a marker to match
 * the input image's size
 */
export async function buildConditionMarker(
  name: String,
  attached: Image,
  attachedCount: number,
) {
  const sceneDpi = await OBR.scene.grid.getDpi();
  const imageUrl = `https://sewef-conditionmarkers.onrender.com/images/${name.toLowerCase().replace(/['-]/g, "").replace(/[ ]/g, "_")}.png`;
  // const imageUrl = `http://localhost:5173/images/${name.toLowerCase().replace(/['-]/g, "").replace(/[ ]/g, "_")}.png`;

  // Setup marker grid
  const CONDITION_DPI = sceneDpi;
  const markerImage = {
    width: CONDITION_DPI,
    height: CONDITION_DPI,
    mime: "image/jpg",
    url: imageUrl,
  }
  const desiredLength = sceneDpi * 0.25;
  const imageGrid: ImageGrid = {
    offset: { x: 0, y: CONDITION_DPI / 2 },
    dpi: (sceneDpi * CONDITION_DPI) / desiredLength,
  }

  const builtMarker = buildImage(markerImage, imageGrid)
    .position(getMarkerPosition(attached, attachedCount, sceneDpi))
    // Keep marker orientation fixed (do not inherit parent's rotation)
    .rotation(0)
    .scale(getMarkerScale(attached))
    .attachedTo(attached.id)
    .locked(true)
    .name(`Condition Marker - ${name}`)
    .metadata({ [getPluginId("metadata")]: { enabled: true } })
    .layer("ATTACHMENT")
    .disableHit(false)
    .visible(attached.visible)
    .build();

  return builtMarker;
}

/**
 * Gather the marker's position based on the image size and position and the
 * number of other markers on the image already
 */
function getMarkerPosition(imageItem: Image, count: number, sceneDpi: number) {
  // const MARKERS_PER_ROW = 5;

  // Arrange markers in a vertical column to the left of the token.
  // We reuse the existing grid cell spacing so vertical spacing stays proportional
  // to the token size. Place markers one column to the left (x = -1) and
  // stack them vertically by their index (`count`).
  // Place markers en colonne, espacement fixe
  const markerGridPosition = {
    x: -1,
    y: count,
  };

  // Espacement indépendant du token
  const gridCellSpacing = sceneDpi * 0.5;

  let position = Math2.multiply(markerGridPosition, gridCellSpacing);

  // Position relative au token
  position = Math2.subtract(position, imageItem.grid.offset);
  position = Math2.multiply(position, sceneDpi / imageItem.grid.dpi);

  // Éviter le mirroring
  const absScale = {
    x: Math.abs(imageItem.scale.x),
    y: Math.abs(imageItem.scale.y),
  };

  position = Math2.multiply(position, absScale);
  // Rotate the marker offset by the parent's rotation so markers stay
  // anchored to the same relative position on the parent even when the
  // parent is rotated. The marker image itself will remain unrotated
  // (we force marker.rotation = 0 when creating/updating the marker).
  position = Math2.rotate(position, { x: 0, y: 0 }, imageItem.rotation);

  // find position with respect to world
  position = Math2.add(position, imageItem.position);

  return position;
}

/**
 * Get number of grid cells that the parent items spans horizontally
 */
function getMarkerScale(imageItem: Image) {
  // Use absolute value of the parent's x scale to avoid mirroring the marker
  const absScale = { x: Math.abs(imageItem.scale.x), y: Math.abs(imageItem.scale.x) };
  const scale = Math2.multiply(absScale, imageItem.image.width / imageItem.grid.dpi);
  return scale;
}

/**
 * Reposition a marker after one was deleted, always hug the upper left corner
 */
export async function repositionConditionMarker(imageItems: Image[]) {
  //Grab all condition markers on the scene
  const conditionMarkers = await OBR.scene.items.getItems<Image>(item => {
    const metadata = item.metadata[getPluginId("metadata")];
    return Boolean(isPlainObject(metadata) && metadata.enabled);
  });

  let attachedMarkers: Image[] = [];
  let newMarker: { id: string; position: Vector2; scale: { x: number; y: number } }[] = [];
  for (const imageItem of imageItems) {
    // Find all markers attached to this item
    attachedMarkers = conditionMarkers.filter(
      marker => marker.attachedTo === imageItem.id
    );

    // Get this marker's new position given it's new position in the grid
    const sceneDpi = await OBR.scene.grid.getDpi();
    for (let i = 0; i < attachedMarkers.length; i++) {
      newMarker.push({
        id: attachedMarkers[i].id,
        position: getMarkerPosition(imageItem, i, sceneDpi),
        scale: getMarkerScale(imageItem),
      });
    }
  }

  // Reposition the markers in the scene based on their new grid positions
  await OBR.scene.items.updateItems(
    newMarker.map(marker => marker.id),
    images => {
      for (let i = 0; i < images.length; i++) {
        if (images[i].id !== newMarker[i].id) {
          console.error("Condition marker ID mismatch, skipping item.");
        } else {
          images[i].position = newMarker[i].position;
          // Ensure markers keep a fixed orientation and correct size when they are repositioned
          images[i].rotation = 0;
          images[i].scale = newMarker[i].scale;
        }
      }
    }
  );
}

export async function setConditionMarkerNumber(
  conditionName: string,
  labelText: string
) {
  const selection = await OBR.player.getSelection();
  if (!selection || selection.length === 0) return;

  // On récupère les markers de cette condition sur la sélection
  const conditionMarkers = await OBR.scene.items.getItems<Image>(
    (item): item is Image => {
      const metadata = item.metadata[getPluginId("metadata")];
      return (
        isImage(item) &&
        !!item.attachedTo &&
        selection.includes(item.attachedTo) &&
        item.name === `Condition Marker - ${conditionName}` &&
        isPlainObject(metadata) &&
        (metadata as any).enabled === true
      );
    }
  );

  if (conditionMarkers.length === 0) return;

  const markerIds = conditionMarkers.map((m) => m.id);
  
  const labelMetadataKey = getPluginId("label");

  // Text déjà attachés par l'extension - on cherche dans toute la scène
  const existingTexts = await OBR.scene.items.getItems<Text>(
    (item): item is Text =>
      isText(item) &&
      !!item.attachedTo &&
      markerIds.includes(item.attachedTo) &&
      isPlainObject(item.metadata[labelMetadataKey])
  );

  const existingByMarkerId = new Map<string, Text>();
  for (const txt of existingTexts) {
    if (txt.attachedTo && !existingByMarkerId.has(txt.attachedTo)) {
      existingByMarkerId.set(txt.attachedTo, txt);
    }
  }

  const toUpdate: Text[] = [];
  const toCreate: Text[] = [];

  for (const marker of conditionMarkers) {
    const existing = existingByMarkerId.get(marker.id);
    if (existing) {
      toUpdate.push(existing);
    } else {
      // Nouveau Text attaché au marker
      const textItem = buildText()
        .plainText(labelText)
        .textType("PLAIN")
        .position(marker.position)
        .attachedTo(marker.id)
        .layer("ATTACHMENT")
        .fontSize(18)              // petit de base
        .textAlign("CENTER")
        .textAlignVertical("MIDDLE")
        .fillColor("#ffffff")
        .strokeColor("#000000")
        .strokeWidth(4)
        .metadata({
          [labelMetadataKey]: { condition: conditionName },
        })
        .build();

      toCreate.push(textItem);
    }
  }

  if (toUpdate.length > 0) {
    await OBR.scene.items.updateItems(toUpdate, (items) => {
      for (const item of items) {
        if (!isText(item)) continue;
        if (item.text && item.text.type === "PLAIN") {
          item.text.plainText = labelText;
        }

        const prevMeta = isPlainObject(item.metadata[labelMetadataKey])
          ? (item.metadata[labelMetadataKey] as Record<string, unknown>)
          : {};
        item.metadata[labelMetadataKey] = {
          ...prevMeta,
          condition: conditionName,
        };
      }
    });
  }

  if (toCreate.length > 0) {
    await OBR.scene.items.addItems(toCreate);
  }
}
