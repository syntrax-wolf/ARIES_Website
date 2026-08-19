import type { AriesEvent, Member, Project, ProjectContributor, Resource } from "@/lib/types";
import { canDirectPublish, canEnqueueChangeRequest, isLeadership } from "@/lib/permissions";
import { isVisitor } from "@/lib/supabase/env";
import { normalizeContributors } from "@/lib/contributors";

type Roster = { slug: string; level?: string | null };

export const CORE_LEVELS = new Set(["oc", "co_overall_coordinator", "research_lead"]);

export function isCoreTeam(level: string | null | undefined) {
  return CORE_LEVELS.has(String(level ?? ""));
}

export function clubMembers(members: Member[]): Member[] {
  return members.filter((m) => m.slug !== "admin" && m.slug !== "blogger" && !isVisitor(m.level));
}

export function coreTeamSlugs(members: Roster[]): string[] {
  return members.filter((m) => isCoreTeam(m.level)).map((m) => m.slug);
}

export function projectPeople(project: Project | undefined): ProjectContributor[] {
  if (!project) return [];
  return normalizeContributors(project.contributors);
}

export function eventPeople(event: AriesEvent | undefined): ProjectContributor[] {
  if (!event) return [];
  return normalizeContributors(event.contributors);
}

export function resourcePeople(resource: Resource | undefined): { name: string; slug?: string }[] {
  return resource?.authors ?? [];
}

export function slugOnProject(project: Project | undefined, slug: string): boolean {
  return projectPeople(project).some((c) => c.slug === slug);
}

export function slugOnEvent(event: AriesEvent | undefined, slug: string): boolean {
  return eventPeople(event).some((c) => c.slug === slug);
}

export function slugOnResource(resource: Resource | undefined, slug: string): boolean {
  return resourcePeople(resource).some((a) => a.slug === slug);
}

function coordinatorSlugsOn(people: { slug?: string }[], members: Roster[]): string[] {
  const bySlug = new Map(members.map((m) => [m.slug, m.level]));
  return people
    .map((p) => p.slug)
    .filter((s): s is string => !!s && bySlug.get(s) === "coordinator");
}

/** Core team always; plus coordinators already listed on the entity. */
export function reviewerSlugsForPeople(people: { slug?: string }[], members: Roster[]): string[] {
  const reviewers = new Set(coreTeamSlugs(members));
  for (const slug of coordinatorSlugsOn(people, members)) reviewers.add(slug);
  return [...reviewers];
}

export function reviewerSlugsForProject(project: Project | undefined, members: Roster[]): string[] {
  return reviewerSlugsForPeople(projectPeople(project), members);
}

export function reviewerSlugsForEvent(event: AriesEvent | undefined, members: Roster[]): string[] {
  return reviewerSlugsForPeople(eventPeople(event), members);
}

export function reviewerSlugsForResource(
  resource: Resource | undefined,
  members: Roster[],
): string[] {
  return reviewerSlugsForPeople(resourcePeople(resource), members);
}

/** Leadership: any entity. Coordinators/executives: only ones they are listed on. */
export function canEditEntity(level: string | null | undefined, onEntity: boolean): boolean {
  return canDirectPublish(level, onEntity) || canEnqueueChangeRequest(level, onEntity);
}

export function listedOnly<T>(
  items: T[],
  level: string | null | undefined,
  memberSlug: string | undefined,
  isOn: (item: T, slug: string) => boolean,
): T[] {
  if (isLeadership(level)) return items;
  if (!memberSlug) return [];
  return items.filter((item) => isOn(item, memberSlug));
}
