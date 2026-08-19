import { canDirectPublish, canEnqueueChangeRequest, canManageRoster, canPublishResource, isLeadership } from "../../../../src/lib/permissions.ts";
import type { Member, ProjectContributor, TeamData } from "../../../../src/lib/types.ts";
import type { WritableContentStore } from "./d1.ts";
import type { Actor, PublishResult } from "./publish.ts";

const EMPTY_MEMBER: Omit<Member, "slug" | "name"> = {
  role: "",
  tagline: "",
  socials: [],
  blocks: [],
};

function mayWriteRoster(actor: Actor) {
  return actor.session.kind === "admin" || canManageRoster(actor.level);
}

function mayWriteTeam(actor: Actor) {
  return mayWriteRoster(actor);
}

function mayCreateVisitor(actor: Actor) {
  if (actor.session.kind === "admin") return true;
  return (
    canDirectPublish(actor.level, true) ||
    canEnqueueChangeRequest(actor.level, true) ||
    canPublishResource(actor.level)
  );
}

export async function mergeRoster(
  store: WritableContentStore,
  actor: Actor,
  patch: {
    slug: string;
    name: string;
    role?: string;
    tagline?: string;
    year?: string;
    location?: string;
    avatar?: string;
    entryNumber?: string;
    email?: string;
    level?: string;
  },
): Promise<PublishResult> {
  if (!mayWriteRoster(actor)) {
    return { ok: false, error: "Roster edits are Leadership-only" };
  }
  const prev = (await store.getMember(patch.slug)) ?? {
    ...EMPTY_MEMBER,
    slug: patch.slug,
    name: patch.name,
  };
  const next: Member = {
    ...prev,
    slug: patch.slug,
    name: patch.name,
    role: patch.role ?? prev.role,
    tagline: patch.tagline ?? prev.tagline,
    year: patch.year ?? prev.year,
    location: patch.location ?? prev.location,
    avatar: patch.avatar ?? prev.avatar,
    entryNumber: patch.entryNumber ?? prev.entryNumber,
    email: patch.email ?? prev.email,
    level: (patch.level as Member["level"]) ?? prev.level,
    blocks: prev.blocks ?? [],
    socials: prev.socials ?? [],
  };
  await store.saveMember(next);
  await store.appendChangeLog({
    kind: "members",
    slug: next.slug,
    actor: actor.session.kind === "admin" ? "admin" : actor.memberSlug,
    summary: "Merged Roster identity",
  });
  return { ok: true, mode: "direct" };
}

export async function saveProfile(
  store: WritableContentStore,
  actor: Actor,
  member: Member,
): Promise<PublishResult> {
  const own = actor.memberSlug === member.slug;
  const leadership = actor.session.kind === "admin" || isLeadership(actor.level);
  if (!own && !leadership) {
    return { ok: false, error: "Not allowed to edit this Profile" };
  }
  const prev = await store.getMember(member.slug);
  if (!prev && !leadership) {
    return { ok: false, error: "Profile not found" };
  }
  const next: Member = {
    ...(prev ?? { ...EMPTY_MEMBER, slug: member.slug, name: member.name }),
    ...member,
    slug: member.slug,
    blocks: member.blocks ?? prev?.blocks ?? [],
  };
  if (!leadership) {
    next.level = prev?.level;
    next.entryNumber = prev?.entryNumber;
    next.email = prev?.email;
  }
  await store.saveMember(next);
  if (next.name) {
    const projects = await store.listProjects();
    for (const project of projects) {
      const { contributors, changed } = applyName(project.contributors, next.slug, next.name);
      if (changed) await store.saveProject({ ...project, contributors });
    }
  }
  await store.appendChangeLog({
    kind: "members",
    slug: next.slug,
    actor: actor.session.kind === "admin" ? "admin" : actor.memberSlug,
    summary: "Updated Profile",
  });
  return { ok: true, mode: "direct" };
}

export async function saveTeamData(
  store: WritableContentStore,
  actor: Actor,
  team: TeamData,
): Promise<PublishResult> {
  if (!mayWriteTeam(actor)) {
    return { ok: false, error: "Team photos and Alumni are Leadership-only" };
  }
  await store.saveTeam(team);
  await store.appendChangeLog({
    kind: "team",
    slug: "_",
    actor: actor.session.kind === "admin" ? "admin" : actor.memberSlug,
    summary: "Updated Team",
  });
  return { ok: true, mode: "direct" };
}

export async function ensureVisitor(
  store: WritableContentStore,
  actor: Actor,
  input: { slug: string; name: string },
): Promise<PublishResult & { slug?: string }> {
  if (!mayCreateVisitor(actor)) {
    return { ok: false, error: "Not allowed to create a Visitor" };
  }
  const slug = input.slug.trim();
  const existing = await store.getMember(slug);
  if (existing && existing.level !== "visitor") {
    return { ok: false, error: `${slug} is already a club member` };
  }
  await store.saveMember({
    slug,
    name: input.name.trim(),
    role: "Visitor",
    tagline: "",
    socials: [],
    blocks: [],
    level: "visitor",
  });
  return { ok: true, mode: "direct", slug };
}

function applyName(
  contributors: Array<string | ProjectContributor> | undefined,
  slug: string,
  name: string,
): { contributors: Array<string | ProjectContributor>; changed: boolean } {
  let changed = false;
  const next = (contributors ?? []).map((c) => {
    if (typeof c === "string") {
      if (c === slug) {
        changed = true;
        return { slug, name, kind: "member" as const };
      }
      return c;
    }
    if (c.kind === "member" && c.slug === slug && c.name !== name) {
      changed = true;
      return { ...c, name };
    }
    return c;
  });
  return { contributors: next, changed };
}
