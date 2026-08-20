/**
 * Dump live Supabase Postgres into content/*.json for D1 seed.
 *
 * On `main`, records live in tables `members`, `projects`, `events`,
 * `resources` (id=1), `team` (id=1). JSON documents sit in `data`; Level,
 * Kerberos, and email sit in columns and must be copied onto each Member.
 *
 *   pnpm content:export-postgres
 *
 * Then: pnpm content:ingest-sanity && pnpm db:seed
 * Remote D1: pnpm db:seed -- --remote
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentRootFrom, envCandidates, loadEnvFiles } from "./lib-env.mjs";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFiles(envCandidates(webRoot));

const base = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).replace(/\/$/, "");
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!base || !key) {
  console.error(
    "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and a key (prefer SUPABASE_SERVICE_ROLE_KEY).",
  );
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: "application/json",
};

async function rest(pathname, search = "") {
  const rows = [];
  const page = 1000;
  let from = 0;
  while (true) {
    const url = new URL(`${base}/rest/v1/${pathname}`);
    if (search) url.search = search.startsWith("?") ? search.slice(1) : search;
    const res = await fetch(url, {
      headers: {
        ...headers,
        Range: `${from}-${from + page - 1}`,
        Prefer: "count=exact",
      },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${pathname}: ${await res.text()}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch)) return batch;
    rows.push(...batch);
    if (batch.length < page) break;
    from += page;
  }
  return rows;
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function replaceDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

const contentRoot = contentRootFrom(webRoot);

const memberRows = await rest("members", "select=slug,data,level,entry_number,email&slug=neq.admin");
replaceDir(path.join(contentRoot, "members"));
for (const row of memberRows) {
  const data = row.data && typeof row.data === "object" ? row.data : {};
  const doc = {
    ...data,
    slug: row.slug,
    level: row.level ?? data.level,
    entryNumber: row.entry_number ?? data.entryNumber,
    email: row.email ?? data.email,
  };
  writeJson(path.join(contentRoot, "members", `${row.slug}.json`), doc);
}

const projectRows = await rest("projects", "select=slug,data");
replaceDir(path.join(contentRoot, "projects"));
for (const row of projectRows) {
  const data = row.data && typeof row.data === "object" ? row.data : {};
  writeJson(path.join(contentRoot, "projects", `${row.slug}.json`), { ...data, slug: row.slug });
}

const eventRows = await rest("events", "select=slug,data");
replaceDir(path.join(contentRoot, "events"));
for (const row of eventRows) {
  const data = row.data && typeof row.data === "object" ? row.data : {};
  writeJson(path.join(contentRoot, "events", `${row.slug}.json`), { ...data, slug: row.slug });
}

const resourceRow = await rest("resources", "select=data&id=eq.1");
const resources = Array.isArray(resourceRow)
  ? (resourceRow[0]?.data ?? [])
  : (resourceRow?.data ?? []);
writeJson(path.join(contentRoot, "resources.json"), resources);

const teamRow = await rest("team", "select=data&id=eq.1");
const team = Array.isArray(teamRow)
  ? (teamRow[0]?.data ?? { years: [], alumni: [] })
  : (teamRow?.data ?? { years: [], alumni: [] });
writeJson(path.join(contentRoot, "team.json"), team);

const allowlist = [
  ...new Set(
    memberRows
      .map((row) => String(row.entry_number ?? "").trim().toLowerCase())
      .filter(Boolean),
  ),
].sort();
writeJson(path.join(contentRoot, "allowlist.json"), allowlist);

console.log(
  `Exported ${memberRows.length} members, ${projectRows.length} projects, ${eventRows.length} events, ${resources.length} resources, ${allowlist.length} allowlist ids → ${contentRoot}`,
);
console.log("Next: pnpm content:ingest-sanity && pnpm db:seed");
console.log("Remote D1: pnpm db:seed -- --remote");
