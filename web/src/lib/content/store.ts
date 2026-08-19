import fs from "node:fs";
import path from "node:path";
import type { AriesEvent, Member, Project, Resource, TeamData } from "../../../../src/lib/types.ts";

const EMPTY_TEAM: TeamData = { years: [], alumni: [] };

export type ContentStore = {
  listProjects(): Project[];
  getProject(slug: string): Project | undefined;
  listEvents(): AriesEvent[];
  getEvent(slug: string): AriesEvent | undefined;
  splitEvents(now?: Date): { upcoming: AriesEvent[]; past: AriesEvent[] };
  getTeam(): TeamData;
  listResources(): Resource[];
  getResource(slug: string): Resource | undefined;
  listPublicMembers(): Member[];
  getMember(slug: string): Member | undefined;
};

export function createContentStore(seed: {
  projects?: Project[];
  events?: AriesEvent[];
  team?: TeamData;
  resources?: Resource[];
  members?: Member[];
}): ContentStore {
  const projects = [...(seed.projects ?? [])];
  const events = [...(seed.events ?? [])];
  const resources = [...(seed.resources ?? [])];
  const members = [...(seed.members ?? [])];
  const team: TeamData = {
    years: [...(seed.team?.years ?? [])].sort((a, b) => b.year.localeCompare(a.year)),
    alumni: [...(seed.team?.alumni ?? [])],
  };
  const projectsBySlug = new Map(projects.map((p) => [p.slug, p]));
  const eventsBySlug = new Map(events.map((e) => [e.slug, e]));
  const resourcesBySlug = new Map(resources.map((r) => [r.slug, r]));
  const membersBySlug = new Map(members.map((m) => [m.slug, m]));
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
    listResources: () => resources,
    getResource: (slug) => resourcesBySlug.get(slug),
    listPublicMembers: () => members.filter(isPublicMember),
    getMember: (slug) => membersBySlug.get(slug),
  };
}

export const RESERVED_MEMBER_SLUGS = new Set([
  "events",
  "projects",
  "team",
  "resources",
  "contact",
  "admin",
  "account",
  "studio",
  "blog",
  "api",
]);

export function isPublicMember(member: Member): boolean {
  if (member.slug === "admin" || member.slug === "blogger") return false;
  return member.level !== "visitor";
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

export function loadResourcesFromJsonFile(file: string): Resource[] {
  if (!fs.existsSync(file)) return [];
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(parsed) ? (parsed as Resource[]) : [];
}

export function loadMembersFromJsonDir(dir: string): Member[] {
  return readJsonDir<Member>(dir);
}

/** Public reader over the JSON backup in `content/`. */
export function loadJsonBackupStore(): ContentStore {
  const root = contentRoot();
  return createContentStore({
    projects: loadProjectsFromJsonDir(path.join(root, "projects")),
    events: loadEventsFromJsonDir(path.join(root, "events")),
    team: loadTeamFromJsonFile(path.join(root, "team.json")),
    resources: loadResourcesFromJsonFile(path.join(root, "resources.json")),
    members: loadMembersFromJsonDir(path.join(root, "members")),
  });
}

let buildStore: ContentStore | undefined;

/** Build-time reader: D1 when ARIES_CONTENT_SOURCE=d1, otherwise JSON backup. */
export async function loadBuildStore(): Promise<ContentStore> {
  if (buildStore) return buildStore;
  if (process.env.ARIES_CONTENT_SOURCE !== "d1") {
    buildStore = loadJsonBackupStore();
    return buildStore;
  }
  const { createD1DocumentDb, hydrateFromDocumentDb } = await import("./d1.ts");
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  try {
    const db = (proxy.env as { DB: Parameters<typeof createD1DocumentDb>[0] }).DB;
    buildStore = await hydrateFromDocumentDb(createD1DocumentDb(db));
    return buildStore;
  } finally {
    await proxy.dispose();
  }
}
