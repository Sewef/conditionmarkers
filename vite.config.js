import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || "http://localhost:5173"),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "background.html"),
      },
    },
  },
});
