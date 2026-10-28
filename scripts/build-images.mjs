import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = join(root, "images_src");
// Keep the scene size in sync with imageDimensions in src/helpers.ts.
const outputs = [
  { directory: join(root, "public", "images"), size: 128 },
  { directory: join(root, "src", "images"), size: 150 },
];

function magick(args) {
  const result = spawnSync("magick", args, { encoding: "utf8", windowsHide: true });
  if (result.error) {
    throw new Error(`Cannot run ImageMagick. Install ImageMagick 7 and add magick to PATH. ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`ImageMagick failed: ${result.stderr || result.signal || result.status}`);
  }
}

try {
  const files = readdirSync(source, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.webp$/i.test(entry.name))
    .map(entry => entry.name)
    .sort();
  if (files.length === 0) throw new Error("No WebP originals found in images_src.");
  magick(["-version"]);

  for (const { directory, size } of outputs) {
    mkdirSync(directory, { recursive: true });
    for (const file of files) {
      // Always resample the original, never a previously generated image.
      // Fit non-square sources without cropping, with transparent padding.
      magick([
        join(source, file),
        "-filter", "Lanczos",
        "-resize", `${size}x${size}`,
        "-background", "none",
        "-gravity", "center",
        "-extent", `${size}x${size}`,
        "-define", "webp:lossless=true",
        join(directory, file),
      ]);
    }
    console.log(`Generated ${files.length} WebP images at ${size}x${size} in ${directory}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
