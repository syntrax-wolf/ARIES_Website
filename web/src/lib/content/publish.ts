import { canDirectPublish, canEnqueueChangeRequest, canPublishResource } from "../permissions.ts";
import type { AriesEvent, Project, ProjectContributor, Resource } from "../types.ts";
import type { GateSession } from "../gate/gate.ts";
import type { WritableContentStore } from "./d1.ts";

export type Actor = {
  session: GateSession;
  level: string;
  memberSlug: string;
};

export type PublishResult =
  | { ok: true; mode: "direct" | "pending" }
  | { ok: false; error: string };

export function isListedOnProject(project: Project, memberSlug: string): boolean {
  return isListedOnContributors(project.contributors, memberSlug);
}

export function isListedOnEvent(event: AriesEvent, memberSlug: string): boolean {
  return isListedOnContributors(event.contributors, memberSlug);
}

function isListedOnContributors(
  contributors: Array<string | ProjectContributor> | undefined,
  memberSlug: string,
): boolean {
  if (!memberSlug) return false;
  return (contributors ?? []).some((c) => contributorSlug(c) === memberSlug);
}

function contributorSlug(c: string | ProjectContributor) {
  return typeof c === "string" ? c : c.slug;
}

export function actorMayDirectPublish(actor: Actor, listed: boolean): boolean {
  if (actor.session.kind === "admin") return true;
  return canDirectPublish(actor.level, listed);
}

export function actorMayPublishResource(actor: Actor): boolean {
  if (actor.session.kind === "admin") return true;
  return canPublishResource(actor.level);
}

function logActor(actor: Actor) {
  return actor.session.kind === "admin" ? "admin" : actor.memberSlug;
}

export async function publishProject(
  store: WritableContentStore,
  actor: Actor,
  project: Project,
): Promise<PublishResult> {
  const existing = await store.getProject(project.slug);
  const listed = isListedOnProject(existing ?? project, actor.memberSlug);
  if (actorMayDirectPublish(actor, listed)) {
    const before = existing;
    await store.saveProject(project);
    await store.appendChangeLog({
      kind: "projects",
      slug: project.slug,
      actor: logActor(actor),
      summary: before ? "Updated Project" : "Created Project",
    });
    return { ok: true, mode: "direct" };
  }
  if (canEnqueueChangeRequest(actor.level, listed)) {
    await store.enqueueChangeRequest({
      kind: "projects",
      slug: project.slug,
      payload: { ...project, __kind: "edit" },
      submittedBy: actor.memberSlug,
    });
    return { ok: true, mode: "pending" };
  }
  return { ok: false, error: "Not allowed to direct-publish this Project" };
}

export async function publishEvent(
  store: WritableContentStore,
  actor: Actor,
  event: AriesEvent,
): Promise<PublishResult> {
  const existing = await store.getEvent(event.slug);
  const listed = isListedOnEvent(existing ?? event, actor.memberSlug);
  if (actorMayDirectPublish(actor, listed)) {
    const before = existing;
    await store.saveEvent(event);
    await store.appendChangeLog({
      kind: "events",
      slug: event.slug,
      actor: logActor(actor),
      summary: before ? "Updated Event" : "Created Event",
    });
    return { ok: true, mode: "direct" };
  }
  if (canEnqueueChangeRequest(actor.level, listed)) {
    await store.enqueueChangeRequest({
      kind: "events",
      slug: event.slug,
      payload: { ...event, __kind: "edit" },
      submittedBy: actor.memberSlug,
    });
    return { ok: true, mode: "pending" };
  }
  return { ok: false, error: "Not allowed to direct-publish this Event" };
}

export async function publishResource(
  store: WritableContentStore,
  actor: Actor,
  resource: Resource,
): Promise<PublishResult> {
  if (!actorMayPublishResource(actor)) {
    return { ok: false, error: "Not allowed to publish a Resource" };
  }
  const before = await store.getResource(resource.slug);
  await store.saveResource(resource);
  await store.appendChangeLog({
    kind: "resources",
    slug: resource.slug,
    actor: logActor(actor),
    summary: before ? "Updated Resource" : "Created Resource",
  });
  return { ok: true, mode: "direct" };
}
