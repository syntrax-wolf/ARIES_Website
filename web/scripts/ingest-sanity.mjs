/**
 * Merge content/sanity-export.json into content/resources.json.
 * Existing Resources whose slugs are not in the dump stay put.
 *
 *   pnpm content:ingest-sanity
 *   pnpm content:ingest-sanity -- --seed        # then load local D1
 *   pnpm content:ingest-sanity -- --seed --remote
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { contentRootFrom } from "./lib-env.mjs";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = contentRootFrom(webRoot);
const dumpFile = path.join(contentRoot, "sanity-export.json");
const resourcesFile = path.join(contentRoot, "resources.json");

if (!fs.existsSync(dumpFile)) {
  console.error(`Missing ${dumpFile}. Run: pnpm content:export-sanity`);
  process.exit(1);
}

const dump = JSON.parse(fs.readFileSync(dumpFile, "utf8"));
const imported = dump.posts ?? dump;
if (!Array.isArray(imported)) {
  console.error("sanity-export.json must be { posts: Resource[] } or a Resource array.");
  process.exit(1);
}

const existing = fs.existsSync(resourcesFile)
  ? JSON.parse(fs.readFileSync(resourcesFile, "utf8"))
  : [];
const incoming = new Map(imported.map((r) => [r.slug, r]));
const kept = existing.filter((r) => !incoming.has(r.slug));
const merged = [...kept, ...imported].sort(
  (a, b) => b.addedOn.localeCompare(a.addedOn) || a.slug.localeCompare(b.slug),
);

fs.writeFileSync(resourcesFile, JSON.stringify(merged, null, 2) + "\n");
console.log(
  `Ingested ${imported.length} Sanity blogs into ${resourcesFile} (${merged.length} resources total).`,
);

const seed = process.argv.includes("--seed");
if (!seed) {
  console.log("Next: pnpm db:seed   (or pnpm content:ingest-sanity -- --seed)");
  process.exit(0);
}

const remote = process.argv.includes("--remote");
const seedScript = path.join(webRoot, "scripts", "seed-d1.mjs");
const result = spawnSync(process.execPath, [seedScript, ...(remote ? ["--remote"] : [])], {
  cwd: webRoot,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
