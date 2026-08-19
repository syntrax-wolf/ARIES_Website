import fs from "node:fs";
import path from "node:path";
import type { AriesEvent, Project } from "../../../../src/lib/types.ts";

export type ContentStore = {
  listProjects(): Project[];
  getProject(slug: string): Project | undefined;
  listEvents(): AriesEvent[];
  getEvent(slug: string): AriesEvent | undefined;
  splitEvents(now?: Date): { upcoming: AriesEvent[]; past: AriesEvent[] };
};

export function createContentStore(seed: {
  projects?: Project[];
  events?: AriesEvent[];
}): ContentStore {
  const projects = [...(seed.projects ?? [])];
  const events = [...(seed.events ?? [])];
  const projectsBySlug = new Map(projects.map((p) => [p.slug, p]));
  const eventsBySlug = new Map(events.map((e) => [e.slug, e]));
  return {
    listProjects: () => projects,
    getProject: (slug) => projectsBySlug.get(slug),
    listEvents: () => events,
    getEvent: (slug) => eventsBySlug.get(slug),
    splitEvents: (now = new Date()) => {
      const today = now.toISOString().slice(0, 10);
      return {
        upcoming: events
          .filter((e) => e.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date)),
        past: events.filter((e) => e.date < today),
      };
    },
  };
}

function readJsonDir<T>(dir: string): T[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) as T)
    .sort((a, b) => String((a as { slug?: string }).slug).localeCompare(String((b as { slug?: string }).slug)));
}

export function loadProjectsFromJsonDir(dir: string): Project[] {
  return readJsonDir<Project>(dir);
}

export function loadEventsFromJsonDir(dir: string): AriesEvent[] {
  return readJsonDir<AriesEvent>(dir);
}

function jsonDir(kind: "projects" | "events"): string {
  const candidates = [
    path.join(process.cwd(), "content", kind),
    path.join(process.cwd(), "..", "content", kind),
  ];
  return candidates.find((dir) => fs.existsSync(dir)) ?? candidates[0];
}

/** Public reader over the JSON backup in `content/`. */
export function loadJsonBackupStore(): ContentStore {
  return createContentStore({
    projects: loadProjectsFromJsonDir(jsonDir("projects")),
    events: loadEventsFromJsonDir(jsonDir("events")),
  });
}
