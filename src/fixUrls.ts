import OBR, { Image } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

async function fix(ready: boolean) {
  if (!ready) return;

  const items = (await OBR.scene.items.getItems<Image>())
    .filter((item) => item.metadata[getPluginId("metadata")])
    .filter((item) => !item.image.url.startsWith(window.origin));

  if (items.length === 0) return;

  OBR.scene.items.updateItems(items, (items) =>
    items.forEach((item) => {
      const url = item.image.url;
      const lastSlash = url.lastIndexOf("/");
      const fileName = url.substring(lastSlash + 1);
      item.image.url = `${window.origin}/images/${fileName}`;
    }),
  );
}

export function fixUrls() {
  OBR.scene.onReadyChange(fix);
  OBR.scene.isReady().then(fix);
}
