import OBR, { Image, isImage } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import { conditions } from "./conditions";
import { buildConditionMarker, isPlainObject, repositionConditionMarker } from "./helpers";

const API_REQUEST_CHANNEL = getPluginId("api.request");
const API_RESPONSE_CHANNEL = getPluginId("api.response");

type requestMessage = {
  action: string;
  data?: Record<string, string>;
};

type responseMessage = {
  action: string;
  success: boolean;
  message?: string;
  data?: string[];
};

const conditionsList = conditions.map((item) => item.replace(/['-]/g, "").replace(/[_]/g, " "));

async function sendApiResponse(message: responseMessage): Promise<void> {
  await OBR.broadcast.sendMessage(
    API_RESPONSE_CHANNEL,
    message,
    { destination: "LOCAL" }
  );
}

function isConditionMarker(item: any): boolean {
  if (!isImage(item)) return false;
  const metadata = item.metadata[getPluginId("metadata")];
  return Boolean(isPlainObject(metadata) && metadata?.enabled);
}

export function setupConditionMarkersApi() {
  OBR.broadcast.onMessage(API_REQUEST_CHANNEL, async (evt) => {
    const { action, data } = evt.data as requestMessage;
    if (!action) return;

    switch (action) {
      case "addCondition": {
        const { tokenId, condition } = data as { tokenId: string; condition: string; };
        await addCondition(tokenId, condition);
        break;
      }
      case "removeCondition": {
        const { tokenId, condition } = data as { tokenId: string; condition: string; };
        await removeCondition(tokenId, condition);
        break;
      }
      case "removeAllConditions": {
        const { tokenId } = data as { tokenId: string; };
        await removeAllConditions(tokenId);
        break;
      }
      case "getTokenConditions": {
        const { tokenId } = data as { tokenId: string; };
        await getTokenConditions(tokenId);
        break;
      }
      case "getAvailableConditions": {
        await getAvailableConditions();
        break;
      }
    }
  });
}

async function addCondition(tokenId: string, condition: string) {
  if (!conditionsList.includes(condition)) {
    await sendApiResponse({
      action: "addCondition",
      success: false,
      message: "Invalid condition",
      data: [tokenId, condition]
    });
    return;
  }

  const allItems = await OBR.scene.items.getItems<Image>();
  const target = allItems.find((item) => item.id === tokenId);
  const markers = allItems.filter(isConditionMarker);

  if (!target) {
    await sendApiResponse({
      action: "addCondition",
      success: false,
      message: "Token not found",
      data: [tokenId, condition]
    });
    return;
  }

  const exists = markers.some((m) => m.attachedTo === tokenId && m.name === `Condition Marker - ${condition}`);
  if (exists) {
    await sendApiResponse({
      action: "addCondition",
      success: false,
      message: "Condition already exists on token",
      data: [tokenId, condition]
    });
    return;
  }

  const builtMarker = await buildConditionMarker(condition, target, markers.filter(m => m.attachedTo === tokenId).length);
  await OBR.scene.items.addItems([builtMarker]);
  await repositionConditionMarker([target]);

  await sendApiResponse({
    action: "addCondition",
    success: true,
    data: [tokenId, condition]
  });
}

async function removeCondition(tokenId: string, condition: string) {
  if (!conditionsList.includes(condition)) {
    await sendApiResponse({
      action: "removeCondition",
      success: false,
      message: "Invalid condition",
      data: [tokenId, condition]
    });
    return;
  }

  const allItems = await OBR.scene.items.getItems<Image>();
  const target = allItems.find((item) => item.id === tokenId);
  const markers = allItems.filter(isConditionMarker);
  const toDelete = markers.filter((m) => m.attachedTo === tokenId && m.name === `Condition Marker - ${condition}`);

  if (!target) {
    await sendApiResponse({
      action: "removeCondition",
      success: false,
      message: "Token not found",
      data: [tokenId, condition]
    });
    return;
  }

  if (toDelete.length == 0) {
    await sendApiResponse({
      action: "removeCondition",
      success: false,
      message: "Condition not found on token",
      data: [tokenId, condition]
    });
    return;
  }

  await OBR.scene.items.deleteItems(toDelete.map((m) => m.id));
  await repositionConditionMarker([target]);
  await sendApiResponse({
    action: "removeCondition",
    success: true,
    data: [tokenId, condition]
  });
}

async function removeAllConditions(tokenId: string) {
  const allItems = await OBR.scene.items.getItems<Image>();
  const target = allItems.find((item) => item.id === tokenId);
  const markers = allItems.filter(isConditionMarker);
  const toDelete = markers.filter((m) => m.attachedTo === tokenId);

  if (!target) {
    await sendApiResponse({
      action: "removeAllConditions",
      success: false,
      message: "Token not found",
      data: [tokenId]
    });
    return;
  }

  if (toDelete.length == 0) {
    await sendApiResponse({
      action: "removeAllConditions",
      success: false,
      message: "No conditions found on token",
      data: [tokenId]
    });
    return;
  }

  await OBR.scene.items.deleteItems(toDelete.map((m) => m.id));
  await repositionConditionMarker([target]);
  await sendApiResponse({
    action: "removeAllConditions",
    success: true,
    data: [tokenId]
  });
}

async function getTokenConditions(tokenId: string) {
  const markers = await OBR.scene.items.getItems<Image>(isConditionMarker);
  const tokenMarkers = markers.filter((m) => m.attachedTo === tokenId);
  const tokenConditions = tokenMarkers.map((m) => m.name.replace("Condition Marker - ", ""));

  await sendApiResponse({
    action: "getTokenConditions",
    success: true,
    data: tokenConditions
  });
}

async function getAvailableConditions() {
  await sendApiResponse({
    action: "getAvailableConditions",
    success: true,
    data: conditionsList
  });
}