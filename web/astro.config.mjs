import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Astro's defineConfig is identity — a callback is never invoked, so
// integrations (including React) never register. Gate the adapter with argv.
const isBuild = process.argv.includes("build");

export default defineConfig({
  publicDir: "../public",
  session: false,
  // workerd's Vite runner crashes on `require` during `astro dev`.
  // Local preview is Node; the Workers adapter is only for `astro build`.
  adapter: isBuild
    ? cloudflare({
        imageService: { build: "compile", runtime: "passthrough" },
        prerenderEnvironment: "node",
      })
    : undefined,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
