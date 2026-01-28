import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

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
});
