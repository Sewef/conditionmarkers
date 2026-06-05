import OBR, { Image, isImage } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import { conditions } from "./conditions";
import { buildConditionMarker, isPlainObject, repositionConditionMarker } from "./helpers";

const API_REQUEST_CHANNEL = getPluginId("api.request");
const API_RESPONSE_CHANNEL = getPluginId("api.response");

function isConditionMarker(item: any): boolean {
  if (!isImage(item)) return false;
  const metadata = item.metadata[getPluginId("metadata")];
  return Boolean(isPlainObject(metadata) && metadata?.enabled);
}

export function setupConditionMarkersApi() {
  OBR.broadcast.onMessage(API_REQUEST_CHANNEL, async (evt) => {
    const { action, parameters } = evt.data as any;
    if (!action) return;

    switch (action) {
      case "addCondition": {
        const { tokenId, condition } = parameters as { tokenId: string; condition: string; };
        await addCondition(tokenId, condition);
        break;
      }
      case "removeCondition": {
        const { tokenId, condition } = parameters as { tokenId: string; condition: string; };
        await removeCondition(tokenId, condition);
        break;
      }
      case "removeAllConditions": {
        const { tokenId } = parameters as { tokenId: string; };
        await removeAllConditions(tokenId);
        break;
      }
      case "getTokenConditions": {
        const { tokenId } = parameters as { tokenId: string; };
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
  const markers = await OBR.scene.items.getItems<Image>(isConditionMarker);

  const conditionsList = conditions.map((item) => item.replace(/['-]/g, "").replace(/[_]/g, " "));
  if (!conditionsList.includes(condition)) {
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "addCondition", data: { tokenId, condition, response: { success: false, message: "Invalid condition" } } }, { destination: "LOCAL" });
    return;
  }

  const exists = markers.some((m) => m.attachedTo === tokenId && m.name === `Condition Marker - ${condition}`);
  if (exists) {
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "addCondition", data: { tokenId, condition, response: { success: false, message: "Condition already exists on token" } } }, { destination: "LOCAL" });
    return;
  }

  const targetItems = await OBR.scene.items.getItems<Image>((item) => item.id === tokenId);
  const target = targetItems[0];

  if (!target) {
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "addCondition", data: { tokenId, condition, response: { success: false, message: "Token not found" } } }, { destination: "LOCAL" });
    return;
  }

  const builtMarker = await buildConditionMarker(condition, target, markers.filter(m => m.attachedTo === tokenId).length);
  await OBR.scene.items.addItems([builtMarker]);
  await repositionConditionMarker([target]);
}

async function removeCondition(tokenId: string, condition: string) {
  const markers = await OBR.scene.items.getItems<Image>(isConditionMarker);

  const conditionsList = conditions.map((item) => item.replace(/['-]/g, "").replace(/[_]/g, " "));
  if (!conditionsList.includes(condition)) {
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "removeCondition", data: { tokenId, condition, response: { success: false, message: "Invalid condition" } } }, { destination: "LOCAL" });
    return;
  }

  const toDelete = markers.filter((m) => m.attachedTo === tokenId && m.name === `Condition Marker - ${condition}`);

  const targetItems = await OBR.scene.items.getItems<Image>((item) => item.id === tokenId);
  const target = targetItems[0];

  if (!target) {
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "removeCondition", data: { tokenId, condition, response: { success: false, message: "Token not found" } } }, { destination: "LOCAL" });
    return;
  }

  if (toDelete.length > 0) {
    await OBR.scene.items.deleteItems(toDelete.map((m) => m.id));
    await repositionConditionMarker([target]);
  }
  else {
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "removeCondition", data: { tokenId, condition, response: { success: false, message: "Condition not found on token" } } }, { destination: "LOCAL" });
  }
}

async function removeAllConditions(tokenId: string) {
  const markers = await OBR.scene.items.getItems<Image>(isConditionMarker);
  const toDelete = markers.filter((m) => m.attachedTo === tokenId);
  const targetItems = await OBR.scene.items.getItems<Image>((item) => item.id === tokenId);
  const target = targetItems[0];
  if (!target) {
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "removeAllConditions", data: { tokenId, response: { success: false, message: "Token not found" } } }, { destination: "LOCAL" });
    return;
  }
  if (toDelete.length > 0) {
    await OBR.scene.items.deleteItems(toDelete.map((m) => m.id));
    await repositionConditionMarker([target]);
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "removeAllConditions", data: { tokenId, response: { success: true } } }, { destination: "LOCAL" });
  }
  else {
    OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "removeAllConditions", data: { tokenId, response: { success: false, message: "No conditions found on token" } } }, { destination: "LOCAL" });
  }
}

async function getTokenConditions(tokenId: string) {
  const markers = await OBR.scene.items.getItems<Image>(isConditionMarker);
  const tokenMarkers = markers.filter((m) => m.attachedTo === tokenId);
  const tokenConditions = tokenMarkers.map((m) => m.name.replace("Condition Marker - ", ""));
  await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "getTokenConditions", data: tokenConditions }, { destination: "LOCAL" });
}

async function getAvailableConditions() {
  const conditionsList = conditions.map((item) => item.replace(/['-]/g, "").replace(/[_]/g, " "));
  await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { action: "getAvailableConditions", data: conditionsList }, { destination: "LOCAL" });
}