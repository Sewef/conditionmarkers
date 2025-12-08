import OBR, { Image, isImage } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import { buildConditionMarker, isPlainObject, repositionConditionMarker, setConditionLabelForToken } from "./helpers";

let SELF_ID_PROMISE: Promise<string> | null = null;
async function getSelfId() {
  if (!SELF_ID_PROMISE) {
    SELF_ID_PROMISE = OBR.player.getId();
  }
  return SELF_ID_PROMISE;
}

// Name of the api request and response channels
const API_REQUEST_CHANNEL = "conditionmarkers.api.request";
const API_RESPONSE_CHANNEL = "conditionmarkers.api.response";

// --- Service ---
export function setupConditionMarkersApi() {
  OBR.broadcast.onMessage(API_REQUEST_CHANNEL, async (evt) => {
    const req = evt.data as any;
    if (!req || !req.callId || !req.requesterId) {
      console.warn("[API] Invalid request payload", req);
      return;
    }

    // Expect `condition` in requests
    const base = { callId: req.callId, requesterId: req.requesterId, tokenId: req.tokenId, condition: req.condition };

    try {
      if (!req.action || (req.action !== "add" && req.action !== "remove")) {
        await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { ...base, ok: false, error: "INVALID_ACTION" }, { destination: "ALL" });
        return;
      }

      const tokenId: string = req.tokenId;
      const conditionName: string = req.condition;
      const value: string | undefined = req.value;

      if (!tokenId || !conditionName) {
        await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { ...base, ok: false, error: "MISSING_TOKEN_OR_CONDITION" }, { destination: "ALL" });
        return;
      }

      // Find the token
      const targetItems = await OBR.scene.items.getItems<Image>((item) => item.id === tokenId);
      const target = targetItems[0];
      if (!target || !isImage(target)) {
        await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { ...base, ok: false, error: "TOKEN_NOT_FOUND" }, { destination: "ALL" });
        return;
      }

      // Get all condition markers on the scene
      const conditionMarkers = await OBR.scene.items.getItems<Image>((item) => {
        const metadata = item.metadata[getPluginId("metadata")];
        return Boolean(isPlainObject(metadata) && metadata.enabled);
      });

      if (req.action === "add") {
        // Check if marker already exists on token
        const attachedMarkers = conditionMarkers.filter((m) => m.attachedTo === tokenId && m.name === `Condition Marker - ${conditionName}`);
        if (attachedMarkers.length > 0) {
          // Already exists, respond success with an indication
          await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { ...base, ok: true, alreadyPresent: true, destination: "ALL" }, { destination: "ALL" });
          return;
        }

        // Build marker and add to scene
        const builtMarker = await buildConditionMarker(conditionName, target, conditionMarkers.filter(m => m.attachedTo === tokenId).length);
        await OBR.scene.items.addItems([builtMarker]);

        // If needed, we could fetch the created marker(s) here, but labels are handled by helper

        // If value provided, create or update text attached to the marker using helpers
        if (value) {
          await setConditionLabelForToken(tokenId, conditionName, value);
        }

        // Reposition markers attached to this token
        await repositionConditionMarker([target]);

        await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { ...base, ok: true, added: true, destination: "ALL" }, { destination: "ALL" });
        return;
      }

      if (req.action === "remove") {
        const attachedMarkers = conditionMarkers.filter((m) => m.attachedTo === tokenId && m.name === `Condition Marker - ${conditionName}`);
        if (attachedMarkers.length === 0) {
          await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { ...base, ok: true, deleted: 0, destination: "ALL" }, { destination: "ALL" });
          return;
        }
        const idsToDelete = attachedMarkers.map((m) => m.id);
        await OBR.scene.items.deleteItems(idsToDelete);
        await repositionConditionMarker([target]);
        await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { ...base, ok: true, deleted: idsToDelete.length, destination: "ALL" }, { destination: "ALL" });
        return;
      }
    } catch (e) {
      console.error("[API] Exception during marker request", e);
      await OBR.broadcast.sendMessage(API_RESPONSE_CHANNEL, { ...base, ok: false, error: String(e), destination: "ALL" }, { destination: "ALL" });
    }
  });
}

// --- Client ---
async function sendApiAction(action: "add" | "remove", tokenId: string, condition: string, value?: string, timeoutMs = 5000) {
  const requesterId = await getSelfId();
  const callId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let timeoutId: any;

  const waitResponse = new Promise((resolve) => {
    const handler = (evt: any) => {
      const res = evt.data;
      if (!res) return;
      if (res.callId !== callId || res.requesterId !== requesterId) return;
      clearTimeout(timeoutId);
      resolve(res);
    };
    OBR.broadcast.onMessage(API_RESPONSE_CHANNEL, handler);
  });

  await OBR.broadcast.sendMessage(API_REQUEST_CHANNEL, { callId, requesterId, action, tokenId, condition, value }, { destination: "ALL" });

  return new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      console.error("[API-CLIENT] Timeout waiting for response", { callId, tokenId, condition });
      reject(new Error("API_TIMEOUT"));
    }, timeoutMs);

    waitResponse.then(resolve).catch(reject);
  });
}

export async function addCondition(tokenId: string, condition: string, value?: string) {
  return sendApiAction("add", tokenId, condition, value);
}

export async function removeCondition(tokenId: string, condition: string) {
  return sendApiAction("remove", tokenId, condition);
}

export default {
  setupConditionMarkersApi,
  addCondition,
  removeCondition,
};
