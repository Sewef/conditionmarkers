const normalize = (s: string) =>
    s.toLowerCase().replace(/['-]/g, "").replace(/[ ]/g, "_");

const modules = import.meta.glob("./images/*.svg", { eager: true, import: "default" });

const images: Record<string, string> = {};

// Construction automatique des clés normalisées
for (const path in modules) {
    const fileName = path.split("/").pop()!.replace(".svg", "");
    images[normalize(fileName)] = modules[path] as string;
}

export function getImage(image: string) {
    const key = normalize(image);
    // Prefer PNGs from the `public/images` directory for condition icons (smaller, 150px assets)
    // Keep SVGs for UI/toolbar icons (left, right, close, error) which live in `src/images`.
    const svgIcons = new Set(["left", "right", "close", "error"]);

    if (svgIcons.has(key)) {
        // Use the bundled SVG if available, otherwise fall back to the 'error' SVG if present.
        return images[key] ?? images["error"] ?? null;
    }

    // For everything else return the PNG from public/images (Vite serves public at /)
    return `/images/${key}.png`;
}