import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: path.resolve(root, "index.html"),
        superAdmin: path.resolve(root, "super-admin/index.html"),
        admin: path.resolve(root, "admin/index.html"),
        user: path.resolve(root, "user/index.html"),
      },
    },
  },
});
