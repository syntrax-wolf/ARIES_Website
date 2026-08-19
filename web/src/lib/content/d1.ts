import type { AriesEvent, Member, Project, Resource, TeamData } from "../../../../src/lib/types.ts";
import { createContentStore, isPublicMember, type ContentStore } from "./store.ts";

export const TEAM_SLUG = "_";

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS documents (
  kind TEXT NOT NULL,
  slug TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (kind, slug)
);

CREATE TABLE IF NOT EXISTS allowlist (
  kerberos TEXT PRIMARY KEY
);
`;

export type DocumentKind = "projects" | "events" | "resources" | "members" | "team";

export type DocumentDb = {
  get(kind: DocumentKind, slug: string): Promise<string | undefined>;
  list(kind: DocumentKind): Promise<{ slug: string; data: string }[]>;
  put(kind: DocumentKind, slug: string, data: string): Promise<void>;
  listAllowlist(): Promise<string[]>;
  addAllowlist(kerberos: string): Promise<void>;
  removeAllowlist(kerberos: string): Promise<void>;
};

export type ContentSeed = {
  projects?: Project[];
  events?: AriesEvent[];
  resources?: Resource[];
  members?: Member[];
  team?: TeamData;
  allowlist?: string[];
};

export type WritableContentStore = {
  listProjects(): Promise<Project[]>;
  getProject(slug: string): Promise<Project | undefined>;
  saveProject(project: Project): Promise<void>;
  listEvents(): Promise<AriesEvent[]>;
  getEvent(slug: string): Promise<AriesEvent | undefined>;
  saveEvent(event: AriesEvent): Promise<void>;
  listResources(): Promise<Resource[]>;
  getResource(slug: string): Promise<Resource | undefined>;
  saveResource(resource: Resource): Promise<void>;
  listPublicMembers(): Promise<Member[]>;
  getMember(slug: string): Promise<Member | undefined>;
  saveMember(member: Member): Promise<void>;
  getTeam(): Promise<TeamData>;
  saveTeam(team: TeamData): Promise<void>;
  listAllowlist(): Promise<string[]>;
  addAllowlist(kerberos: string): Promise<void>;
  removeAllowlist(kerberos: string): Promise<void>;
};

export function createMemoryDocumentDb(): DocumentDb {
  const docs = new Map<string, string>();
  const allow = new Set<string>();
  const key = (kind: DocumentKind, slug: string) => `${kind}:${slug}`;
  return {
    async get(kind, slug) {
      return docs.get(key(kind, slug));
    },
    async list(kind) {
      const prefix = `${kind}:`;
      return [...docs.entries()]
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, data]) => ({ slug: k.slice(prefix.length), data }))
        .sort((a, b) => a.slug.localeCompare(b.slug));
    },
    async put(kind, slug, data) {
      docs.set(key(kind, slug), data);
    },
    async listAllowlist() {
      return [...allow].sort();
    },
    async addAllowlist(kerberos) {
      allow.add(kerberos.trim().toLowerCase());
    },
    async removeAllowlist(kerberos) {
      allow.delete(kerberos.trim().toLowerCase());
    },
  };
}

function parse<T>(raw: string | undefined): T | undefined {
  if (!raw) return undefined;
  return JSON.parse(raw) as T;
}

export async function seedDocumentDb(db: DocumentDb, seed: ContentSeed): Promise<void> {
  for (const project of seed.projects ?? []) {
    await db.put("projects", project.slug, JSON.stringify(project));
  }
  for (const event of seed.events ?? []) {
    await db.put("events", event.slug, JSON.stringify(event));
  }
  for (const resource of seed.resources ?? []) {
    await db.put("resources", resource.slug, JSON.stringify(resource));
  }
  for (const member of seed.members ?? []) {
    await db.put("members", member.slug, JSON.stringify(member));
  }
  if (seed.team) {
    await db.put("team", TEAM_SLUG, JSON.stringify(seed.team));
  }
  for (const kerberos of seed.allowlist ?? []) {
    await db.addAllowlist(kerberos);
  }
}

export function createWritableStore(db: DocumentDb): WritableContentStore {
  return {
    async listProjects() {
      return (await db.list("projects")).map((row) => JSON.parse(row.data) as Project);
    },
    async getProject(slug) {
      return parse<Project>(await db.get("projects", slug));
    },
    async saveProject(project) {
      await db.put("projects", project.slug, JSON.stringify(project));
    },
    async listEvents() {
      return (await db.list("events")).map((row) => JSON.parse(row.data) as AriesEvent);
    },
    async getEvent(slug) {
      return parse<AriesEvent>(await db.get("events", slug));
    },
    async saveEvent(event) {
      await db.put("events", event.slug, JSON.stringify(event));
    },
    async listResources() {
      return (await db.list("resources")).map((row) => JSON.parse(row.data) as Resource);
    },
    async getResource(slug) {
      return parse<Resource>(await db.get("resources", slug));
    },
    async saveResource(resource) {
      await db.put("resources", resource.slug, JSON.stringify(resource));
    },
    async listPublicMembers() {
      return (await db.list("members"))
        .map((row) => JSON.parse(row.data) as Member)
        .filter(isPublicMember);
    },
    async getMember(slug) {
      return parse<Member>(await db.get("members", slug));
    },
    async saveMember(member) {
      await db.put("members", member.slug, JSON.stringify(member));
    },
    async getTeam() {
      return (
        parse<TeamData>(await db.get("team", TEAM_SLUG)) ?? { years: [], alumni: [] }
      );
    },
    async saveTeam(team) {
      await db.put("team", TEAM_SLUG, JSON.stringify(team));
    },
    async listAllowlist() {
      return db.listAllowlist();
    },
    async addAllowlist(kerberos) {
      await db.addAllowlist(kerberos);
    },
    async removeAllowlist(kerberos) {
      await db.removeAllowlist(kerberos);
    },
  };
}

export async function hydrateFromDocumentDb(db: DocumentDb): Promise<ContentStore> {
  const writable = createWritableStore(db);
  const [projects, events, resources, members, team] = await Promise.all([
    writable.listProjects(),
    writable.listEvents(),
    writable.listResources(),
    db.list("members").then((rows) => rows.map((row) => JSON.parse(row.data) as Member)),
    writable.getTeam(),
  ]);
  return createContentStore({ projects, events, resources, members, team });
}

type D1Prepared = {
  bind(...values: unknown[]): D1Prepared;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
};

type D1Like = {
  prepare(query: string): D1Prepared;
};

/** D1 binding adapter. Tests use createMemoryDocumentDb instead. */
export function createD1DocumentDb(d1: D1Like): DocumentDb {
  return {
    async get(kind, slug) {
      const row = await d1
        .prepare("SELECT data FROM documents WHERE kind = ? AND slug = ?")
        .bind(kind, slug)
        .first<{ data: string }>();
      return row?.data;
    },
    async list(kind) {
      const { results } = await d1
        .prepare("SELECT slug, data FROM documents WHERE kind = ? ORDER BY slug")
        .bind(kind)
        .all<{ slug: string; data: string }>();
      return results ?? [];
    },
    async put(kind, slug, data) {
      await d1
        .prepare(
          "INSERT INTO documents (kind, slug, data) VALUES (?, ?, ?) ON CONFLICT(kind, slug) DO UPDATE SET data = excluded.data",
        )
        .bind(kind, slug, data)
        .run();
    },
    async listAllowlist() {
      const { results } = await d1
        .prepare("SELECT kerberos FROM allowlist ORDER BY kerberos")
        .all<{ kerberos: string }>();
      return (results ?? []).map((row) => row.kerberos);
    },
    async addAllowlist(kerberos) {
      await d1
        .prepare("INSERT INTO allowlist (kerberos) VALUES (?) ON CONFLICT(kerberos) DO NOTHING")
        .bind(kerberos.trim().toLowerCase())
        .run();
    },
    async removeAllowlist(kerberos) {
      await d1
        .prepare("DELETE FROM allowlist WHERE kerberos = ?")
        .bind(kerberos.trim().toLowerCase())
        .run();
    },
  };
}
