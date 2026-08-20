import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = fs.existsSync(path.join(root, "content"))
  ? path.join(root, "content")
  : path.join(root, "..", "content");

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insertDocument(kind, slug, data) {
  return `INSERT INTO documents (kind, slug, data) VALUES (${sqlString(kind)}, ${sqlString(slug)}, ${sqlString(JSON.stringify(data))}) ON CONFLICT(kind, slug) DO UPDATE SET data = excluded.data;`;
}

function readDir(kind) {
  const dir = path.join(contentRoot, kind);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
}

function readFile(name, fallback) {
  const file = path.join(contentRoot, name);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const statements = [];
for (const project of readDir("projects")) {
  statements.push(insertDocument("projects", project.slug, project));
}
for (const event of readDir("events")) {
  statements.push(insertDocument("events", event.slug, event));
}
for (const member of readDir("members")) {
  statements.push(insertDocument("members", member.slug, member));
}
const resources = readFile("resources.json", []);
for (const resource of resources) {
  statements.push(insertDocument("resources", resource.slug, resource));
}
const team = readFile("team.json", { years: [], alumni: [] });
statements.push(insertDocument("team", "_", team));
const allowlist = readFile("allowlist.json", []);
for (const kerberos of allowlist) {
  const id = String(kerberos).trim().toLowerCase();
  if (!id) continue;
  statements.push(
    `INSERT INTO allowlist (kerberos) VALUES (${sqlString(id)}) ON CONFLICT(kerberos) DO NOTHING;`,
  );
}

const seedFile = path.join(root, ".seed.sql");
fs.writeFileSync(seedFile, statements.join("\n") + "\n");

const remote = process.argv.includes("--remote");

const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const wranglerBin = fs.existsSync(wrangler)
  ? wrangler
  : path.join(root, "..", "node_modules", "wrangler", "bin", "wrangler.js");

function run(args) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["d1", "migrations", "apply", "aries-content", remote ? "--remote" : "--local"]);
run(["d1", "execute", "aries-content", remote ? "--remote" : "--local", "--file", seedFile]);
console.log(`Seeded ${remote ? "remote" : "local"} D1 from ${contentRoot}`);
