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
  const imageUrl = `${__API_BASE_URL__}/images/${name.toLowerCase().replace(/['-]/g, "").replace(/[ ]/g, "_")}.webp`;

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
    .disableAttachmentBehavior(["ROTATION", "SCALE"])
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
 * Calculate the marker's position based on the token's position
 * and the number of other markers already attached
 */
function getMarkerPosition(imageItem: Image, count: number, sceneDpi: number) {
  // Arrange markers in a vertical column to the left of the token
  const markerGridPosition = {
    x: -1,
    y: count,
  };

    // Grid spacing should be proportional to token image width so markers
    // stay correctly positioned when the token image (and its dpi) changes.
    const MARKERS_PER_ROW = 5;
    // width of one cell in image-grid units
    const tokenGridCellWidth = imageItem.image.width / MARKERS_PER_ROW;
    // spacing in image grid units (we'll convert to scene units later)
    const gridCellSpacing = tokenGridCellWidth;

  let position = Math2.multiply(markerGridPosition, gridCellSpacing);

  // Position relative to token
  position = Math2.subtract(position, imageItem.grid.offset);
  position = Math2.multiply(position, sceneDpi / imageItem.grid.dpi);

  // Use absolute scale to avoid mirroring
  const absScale = {
    x: Math.abs(imageItem.scale.x),
    y: Math.abs(imageItem.scale.y),
  };

  position = Math2.multiply(position, absScale);

  // Convert to world position
  position = Math2.add(position, imageItem.position);

  return position;
}

/**
 * Calculate the marker's scale based on the token's size
 */
function getMarkerScale(imageItem: Image) {
  // Use absolute value of the parent's scales to avoid mirroring the marker
  const absScale = { x: Math.abs(imageItem.scale.x), y: Math.abs(imageItem.scale.y) };
  const imageWidthGrid = imageItem.image.width / imageItem.grid.dpi; // width in grid units -> convert to scene when used
  const scale = Math2.multiply(absScale, imageWidthGrid);
  return scale;
}

/**
 * Reposition markers after adding or removing conditions
 */
export async function repositionConditionMarker(imageItems: Image[]) {
  // Grab all condition markers on the scene
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
          // Disable rotation and scale inheritance from parent
          if (isImage(images[i])) {
            images[i].disableAttachmentBehavior = ["ROTATION", "SCALE"];
          }
        }
      }
    }
  );
}

/**
 * Calculate the appropriate font size for a condition marker label
 * based on the marker's actual displayed size in the scene
 */
function getMarkerLabelFontSize(marker: Image): number {
  // The marker's actual size in grid units is: (image.width / grid.dpi) * scale
  // We use the average of x and y scale to get a representative scale factor
  const avgScale = (Math.abs(marker.scale.x) + Math.abs(marker.scale.y)) / 2;
  const markerGridSize = (marker.image.width / marker.grid.dpi) * avgScale;
  
  // Scale font size proportionally to the marker's actual displayed grid size
  // At 0.25 grid units (standard marker size on a standard token), use 18pt
  const BASELINE_GRID_SIZE = 0.25;
  const BASELINE_FONT_SIZE = 18;
  
  return (markerGridSize / BASELINE_GRID_SIZE) * BASELINE_FONT_SIZE;
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
      const fontSize = getMarkerLabelFontSize(marker);
      const textItem = buildText()
        .plainText(String(labelText))
        .textType("PLAIN")
        .position(marker.position)
        .attachedTo(marker.id)
        .layer("ATTACHMENT")
        .fontSize(fontSize)
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

/**
 * Set or update a label (text) for markers of a given condition attached to a specific token.
 * Creates a new text item if none exists, otherwise updates the existing one.
 */
export async function setConditionLabelForToken(
  tokenId: string,
  conditionName: string,
  labelText: string
) {
  if (!tokenId) {
    console.log(`[setConditionLabelForToken] No tokenId provided, abort.`);
    return;
  }

  // Get condition markers attached to the provided token
  const conditionMarkers = await OBR.scene.items.getItems<Image>(
    (item): item is Image => {
      const metadata = item.metadata[getPluginId("metadata")];
      return (
        isImage(item) &&
        !!item.attachedTo &&
        item.attachedTo === tokenId &&
        item.name === `Condition Marker - ${conditionName}` &&
        isPlainObject(metadata) &&
        (metadata as any).enabled === true
      );
    }
  );

  console.log(`[setConditionLabelForToken] Found ${conditionMarkers.length} condition markers for tokenId=${tokenId}, conditionName=${conditionName}`);
  if (conditionMarkers.length === 0) {
    console.log(`[setConditionLabelForToken] No condition marker found for tokenId=${tokenId}, conditionName=${conditionName}`);
    return;
  }

  const markerIds = conditionMarkers.map((m) => m.id);
  const labelMetadataKey = getPluginId("label");

  // Get existing texts attached to the markers for this condition
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
      // New Text attached to the marker
      // Use the builder to ensure all required fields are present
      const fontSize = getMarkerLabelFontSize(marker);
      const textItem = buildText()
        .plainText(String(labelText))
        .textType("PLAIN")
        .position(marker.position)
        .attachedTo(marker.id)
        .layer("ATTACHMENT")
        .fontSize(fontSize)
        .textAlign("CENTER")
        .textAlignVertical("MIDDLE")
        .fillColor("#ffffff")
        .strokeColor("#000000")
        .strokeWidth(4)
        .metadata({
          [labelMetadataKey]: { condition: conditionName },
        })
        .build();
      console.log('[setConditionLabelForToken] Built text label (full):', JSON.stringify(textItem, null, 2));
      console.log('[setConditionLabelForToken] Built text label (type):', textItem.type);
      toCreate.push(textItem);
    }
  }

  if (toUpdate.length > 0) {
    console.log('[setConditionLabelForToken] Updating text labels:', toUpdate);
    await OBR.scene.items.updateItems(
      toUpdate.map(item => item.id),
      (items) => {
        for (const item of items) {
          if (!isText(item)) continue;
          if (item.text && item.text.type === "PLAIN") {
            item.text.plainText = String(labelText);
          }

          const prevMeta = isPlainObject(item.metadata[labelMetadataKey])
            ? (item.metadata[labelMetadataKey] as Record<string, unknown>)
            : {};
          item.metadata[labelMetadataKey] = {
            ...prevMeta,
            condition: conditionName,
          };
        }
      }
    );
  }

  if (toCreate.length > 0) {
    console.log('[setConditionLabelForToken] Adding new text labels:', toCreate);
    await OBR.scene.items.addItems(toCreate);
  }
}
