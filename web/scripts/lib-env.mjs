import fs from "node:fs";
import path from "node:path";

export function loadEnvFiles(files) {
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
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
}

export function contentRootFrom(webRoot) {
  const here = path.join(webRoot, "content");
  if (fs.existsSync(here)) return here;
  return path.join(webRoot, "..", "content");
}

export function envCandidates(webRoot) {
  const repo = path.join(webRoot, "..");
  return [
    path.join(webRoot, ".dev.vars"),
    path.join(webRoot, ".env"),
    path.join(repo, ".dev.vars"),
    path.join(repo, ".env"),
    path.join(repo, ".env.local"),
  ];
}
