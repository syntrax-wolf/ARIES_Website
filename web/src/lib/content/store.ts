import fs from "node:fs";
import path from "node:path";
import type { Project } from "../../../../src/lib/types.ts";

export type ContentStore = {
  listProjects(): Project[];
  getProject(slug: string): Project | undefined;
};

export function createContentStore(seed: { projects?: Project[] }): ContentStore {
  const projects = [...(seed.projects ?? [])];
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  return {
    listProjects: () => projects,
    getProject: (slug) => bySlug.get(slug),
  };
}

export function loadProjectsFromJsonDir(dir: string): Project[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) as Project)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function jsonProjectsDir(): string {
  const candidates = [
    path.join(process.cwd(), "content", "projects"),
    path.join(process.cwd(), "..", "content", "projects"),
  ];
  return candidates.find((dir) => fs.existsSync(dir)) ?? candidates[0];
}

/** Public reader over the JSON backup in `content/`. */
export function loadJsonBackupStore(): ContentStore {
  return createContentStore({
    projects: loadProjectsFromJsonDir(jsonProjectsDir()),
  });
}
