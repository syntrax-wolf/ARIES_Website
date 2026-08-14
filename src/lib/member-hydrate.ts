import type { Member, ProjectContributor, TeamData, TeamMemberRef } from "@/lib/types";

type MemberIdentity = Pick<Member, "slug" | "name" | "avatar" | "role"> & {
  tagline?: string;
  level?: Member["level"];
};

/** Overlay live member name/photo onto a team roster entry when linked by slug. */
export function hydrateTeamMember(
  person: TeamMemberRef,
  bySlug: Map<string, MemberIdentity>,
): TeamMemberRef {
  const slug = person.slug?.trim();
  if (!slug) return person;
  const m = bySlug.get(slug);
  if (!m) return person;
  return {
    ...person,
    name: m.name || person.name,
    photo: m.avatar || person.photo,
    role: person.role || m.role || person.role,
  };
}

/** Overlay live member fields onto team years + alumni for public display. */
export function hydrateTeamData(team: TeamData, members: MemberIdentity[]): TeamData {
  const bySlug = new Map(members.map((m) => [m.slug, m]));
  const listedOnCurrent = new Set<string>();

  const years = (team.years ?? []).map((y, i) => {
    const coreTeam = (y.coreTeam ?? []).map((p) => hydrateTeamMember(p, bySlug));
    const coordinators = (y.coordinators ?? []).map((p) => hydrateTeamMember(p, bySlug));
    if (i === 0) {
      for (const p of [...coreTeam, ...coordinators]) {
        if (p.slug) listedOnCurrent.add(p.slug);
      }
    }
    return {
      ...y,
      coreTeam,
      coordinators,
      executives: (y.executives ?? []).map((g) => ({
        ...g,
        members: (g.members ?? []).map((p) => hydrateTeamMember(p, bySlug)),
      })),
    };
  });

  // Current-year coordinator grid = roster + anyone whose live level is coordinator.
  if (years[0]) {
    const extras: TeamMemberRef[] = members
      .filter((m) => m.level === "coordinator" && m.slug && !listedOnCurrent.has(m.slug))
      .map((m) => ({
        name: m.name,
        slug: m.slug,
        role: m.role || "Coordinator",
        photo: m.avatar,
      }));
    if (extras.length) {
      years[0] = {
        ...years[0],
        coordinators: [...years[0].coordinators, ...extras],
      };
    }
  }

  const alumni = (team.alumni ?? []).map((a) => {
    const slug = a.slug?.trim();
    if (!slug) return a;
    const m = bySlug.get(slug);
    if (!m) return a;
    const tagline = m.tagline?.trim();
    return {
      ...a,
      name: m.name || a.name,
      photo: m.avatar || a.photo,
      org: tagline || a.org,
    };
  });

  return { ...team, years, alumni };
}

/** Prefer live member names for contributor chips when a slug is present. */
export function hydrateContributor(
  c: ProjectContributor,
  bySlug: Map<string, MemberIdentity>,
): ProjectContributor {
  if (c.kind !== "member" || !c.slug) return c;
  const m = bySlug.get(c.slug);
  if (!m) return c;
  return { ...c, name: m.name || c.name };
}

export function hydrateContributors(
  list: ProjectContributor[] | undefined,
  members: MemberIdentity[],
): ProjectContributor[] {
  const bySlug = new Map(members.map((m) => [m.slug, m]));
  return (list ?? []).map((c) => hydrateContributor(c, bySlug));
}

/**
 * After a member profile save, rewrite denormalized copies (team roster, alumni,
 * project contributor names) so lists stay in sync without waiting for hydration.
 */
export function applyMemberIdentityToTeam(
  team: TeamData,
  slug: string,
  next: { name?: string; avatar?: string; tagline?: string },
): { team: TeamData; changed: boolean } {
  let changed = false;
  const patchPerson = (p: TeamMemberRef): TeamMemberRef => {
    if (p.slug !== slug) return p;
    const name = next.name?.trim() || p.name;
    const photo = next.avatar !== undefined ? next.avatar || undefined : p.photo;
    if (name === p.name && photo === p.photo) return p;
    changed = true;
    return { ...p, name, photo };
  };

  const years = (team.years ?? []).map((y) => ({
    ...y,
    coreTeam: (y.coreTeam ?? []).map(patchPerson),
    coordinators: (y.coordinators ?? []).map(patchPerson),
    executives: (y.executives ?? []).map((g) => ({
      ...g,
      members: (g.members ?? []).map(patchPerson),
    })),
  }));

  const alumni = (team.alumni ?? []).map((a) => {
    if (a.slug !== slug) return a;
    const name = next.name?.trim() || a.name;
    const photo = next.avatar !== undefined ? next.avatar || undefined : a.photo;
    const org =
      next.tagline !== undefined ? next.tagline.trim() || a.org : a.org;
    if (name === a.name && photo === a.photo && org === a.org) return a;
    changed = true;
    return { ...a, name, photo, org };
  });

  return { team: { ...team, years, alumni }, changed };
}

export function applyMemberIdentityToContributors(
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
