const normalize = (s: string) =>
    s.toLowerCase().replace(/['-]/g, "").replace(/[ ]/g, "_");

const modules = import.meta.glob("./images/*.webp", { eager: true, import: "default" });

const images: Record<string, string> = {};

// Construction automatique des clés normalisées
for (const path in modules) {
    const fileName = path.split("/").pop()!.replace(".webp", "");
    images[normalize(fileName)] = modules[path] as string;
}

export function getImage(image: string) {
    const key = normalize(image);
    // Use WebP files for all UI/toolbar icons (left, right, close, error) which live in `src/images`.
    const webpIcons = new Set(["left", "right", "close", "error"]);

    if (webpIcons.has(key)) {
        // Use the bundled WebP if available, otherwise fall back to the 'error' WebP if present.
        return images[key] ?? images["error"] ?? null;
    }

    // For everything else return the PNG from public/images (Vite serves public at /)
    return `/images/${key}.webp`;
}