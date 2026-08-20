import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

function loadDevVars() {
  const file = fileURLToPath(new URL("./.dev.vars", import.meta.url));
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") process.env[key] = value;
  }
}
loadDevVars();

// workerd's Vite runner crashes on CJS `require` during `astro dev`
// (openid-client / React). Official adapter option `prerenderEnvironment: "node"`
// is used at build. Dev stays Node Vite; the adapter is only attached for `astro build`.
const isBuild = process.argv.includes("build");
const site = process.env.PUBLIC_SITE_URL ?? "https://aries-website.devansh-654.workers.dev";

export default defineConfig({
  site,
  publicDir: "../public",
  session: false,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  adapter: isBuild
    ? cloudflare({
        imageService: { build: "compile", runtime: "passthrough" },
        prerenderEnvironment: "node",
      })
    : undefined,
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes("/admin") && !page.includes("/account") && !page.includes("/api/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: isBuild
        ? {}
        : {
            "cloudflare:workers": fileURLToPath(
              new URL("./src/lib/cloudflare-workers-stub.ts", import.meta.url),
            ),
          },
    },
  },
});
