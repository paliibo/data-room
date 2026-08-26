import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * GitHub Pages serves a project site from a subpath, so the base is injected at
 * build time. The router reads the same value through import.meta.env.BASE_URL,
 * which keeps share links correct on a subpath and on a custom domain alike.
 */
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

/**
 * Static hosts with no rewrite rules — GitHub Pages among them — return 404 for
 * a deep link like /d/:id/analytics. Copying the built shell to 404.html makes
 * the host hand those requests back to the SPA router instead.
 */
function spaFallback(): Plugin {
  return {
    name: "spa-fallback-html",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const index = path.join(outDir, "index.html");
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.join(outDir, "404.html"));
      }
    },
  };
}
