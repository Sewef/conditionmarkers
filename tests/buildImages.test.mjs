import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

function fixture(t, { missing = false, empty = false } = {}) {
  const base = resolve(tmpdir());
  const root = mkdtempSync(join(base, "conditionmarkers-images-"));
  t.after(() => {
    assert.ok(root.startsWith(`${base}${sep}conditionmarkers-images-`));
    rmSync(root, { recursive: true, force: true });
  });
  for (const directory of ["scripts", "images_src", "public/images", "src/images"]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  copyFileSync(new URL("../scripts/build-images.mjs", import.meta.url), join(root, "scripts/build-images.mjs"));
  writeFileSync(join(root, "images_src/wet.webp"), "original");
  writeFileSync(join(root, "public/images/wet.webp"), "generated");
  if (!missing) writeFileSync(join(root, "src/images/wet.webp"), empty ? "" : "generated");
  // An empty PATH proves this path never invokes ImageMagick.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "path"));
  return spawnSync(process.execPath, [join(root, "scripts/build-images.mjs")], {
    encoding: "utf8",
    env: { ...env, PATH: "", RENDER: "true" },
    timeout: 10000,
    windowsHide: true,
  });
}

test("Render uses generated images without ImageMagick", t => {
  const result = fixture(t);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /skipping ImageMagick/);
});

test("Render reports a missing generated image", t => {
  const result = fixture(t, { missing: true });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Run npm run images locally/);
  assert.match(result.stderr, /wet\.webp/);
});

test("Render rejects an empty generated image", t => {
  const result = fixture(t, { empty: true });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Generated images missing or empty/);
});
