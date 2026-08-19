import fs from "node:fs";
import path from "node:path";
import type { AriesEvent, Project, TeamData } from "../../../../src/lib/types.ts";

const EMPTY_TEAM: TeamData = { years: [], alumni: [] };

export type ContentStore = {
  listProjects(): Project[];
  getProject(slug: string): Project | undefined;
  listEvents(): AriesEvent[];
  getEvent(slug: string): AriesEvent | undefined;
  splitEvents(now?: Date): { upcoming: AriesEvent[]; past: AriesEvent[] };
  getTeam(): TeamData;
};

export function createContentStore(seed: {
  projects?: Project[];
  events?: AriesEvent[];
  team?: TeamData;
}): ContentStore {
  const projects = [...(seed.projects ?? [])];
  const events = [...(seed.events ?? [])];
  const team: TeamData = {
    years: [...(seed.team?.years ?? [])].sort((a, b) => b.year.localeCompare(a.year)),
    alumni: [...(seed.team?.alumni ?? [])],
  };
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
    getTeam: () => team,
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

function contentRoot(): string {
  const candidates = [
    path.join(process.cwd(), "content"),
    path.join(process.cwd(), "..", "content"),
  ];
  return candidates.find((dir) => fs.existsSync(dir)) ?? candidates[0];
}

export function loadTeamFromJsonFile(file: string): TeamData {
  if (!fs.existsSync(file)) return EMPTY_TEAM;
  return JSON.parse(fs.readFileSync(file, "utf8")) as TeamData;
}

/** Public reader over the JSON backup in `content/`. */
export function loadJsonBackupStore(): ContentStore {
  const root = contentRoot();
  return createContentStore({
    projects: loadProjectsFromJsonDir(path.join(root, "projects")),
    events: loadEventsFromJsonDir(path.join(root, "events")),
    team: loadTeamFromJsonFile(path.join(root, "team.json")),
  });
}
