import { canApprove } from "../permissions.ts";
import type { AriesEvent, Project, Resource } from "../types.ts";
import type { ChangeRequest, WritableContentStore } from "./d1.ts";
import {
  isListedOnEvent,
  isListedOnProject,
  type Actor,
  type PublishResult,
} from "./publish.ts";

export async function enqueueJoinRequest(
  store: WritableContentStore,
  actor: Actor,
  kind: "projects" | "events",
  slug: string,
  name: string,
): Promise<PublishResult> {
  if (!actor.memberSlug) {
    return { ok: false, error: "No profile is linked to this login" };
  }
  if (kind === "projects") {
    const project = await store.getProject(slug);
    if (!project) return { ok: false, error: "Project not found" };
    if (isListedOnProject(project, actor.memberSlug)) {
      return { ok: false, error: "You are already on this project" };
    }
  } else {
    const event = await store.getEvent(slug);
    if (!event) return { ok: false, error: "Event not found" };
    if (isListedOnEvent(event, actor.memberSlug)) {
      return { ok: false, error: "You are already on this event" };
    }
  }
  await store.enqueueChangeRequest({
    kind,
    slug,
    payload: { __kind: "join", slug: actor.memberSlug, name },
    submittedBy: actor.memberSlug,
  });
  return { ok: true, mode: "pending" };
}

export function actorMayReview(actor: Actor): boolean {
  return actor.session.kind === "admin" || canApprove(actor.level);
}

export async function rejectChangeRequest(
  store: WritableContentStore,
  actor: Actor,
  id: string,
): Promise<PublishResult> {
  if (!actorMayReview(actor)) return { ok: false, error: "Not allowed to review" };
  const pending = await store.getChangeRequest(id);
  if (!pending) return { ok: false, error: "Request not found" };
  await store.deleteChangeRequest(id);
  return { ok: true, mode: "direct" };
}

export async function approveChangeRequest(
  store: WritableContentStore,
  actor: Actor,
  id: string,
): Promise<PublishResult> {
  if (!actorMayReview(actor)) return { ok: false, error: "Not allowed to review" };
  const pending = await store.getChangeRequest(id);
  if (!pending) return { ok: false, error: "Request not found" };
  const applied = await applyChangeRequest(store, pending);
  if (!applied.ok) return applied;
  await store.deleteChangeRequest(id);
  return { ok: true, mode: "direct" };
}

async function applyChangeRequest(
  store: WritableContentStore,
  pending: ChangeRequest,
): Promise<PublishResult> {
  const payload = pending.payload ?? {};
  const kind = String(payload.__kind || "edit");

  if (kind === "join") {
    const joinSlug = String(payload.slug || "");
    const joinName = String(payload.name || joinSlug);
    if (!joinSlug) return { ok: false, error: "Missing joiner" };
    if (pending.kind === "projects") {
      const project = await store.getProject(pending.slug);
      if (!project) return { ok: false, error: "Project gone" };
      if (!isListedOnProject(project, joinSlug)) {
        await store.saveProject({
          ...project,
          contributors: [
            ...(project.contributors ?? []),
            { name: joinName, slug: joinSlug, kind: "member" },
          ],
        });
      }
      return { ok: true, mode: "direct" };
    }
    if (pending.kind === "events") {
      const event = await store.getEvent(pending.slug);
      if (!event) return { ok: false, error: "Event gone" };
      if (!isListedOnEvent(event, joinSlug)) {
        await store.saveEvent({
          ...event,
          contributors: [
            ...(event.contributors ?? []),
            { name: joinName, slug: joinSlug, kind: "member" },
          ],
        });
      }
      return { ok: true, mode: "direct" };
    }
    return { ok: false, error: "Unknown entity" };
  }

  const { __kind, __reviewers, __delete, ...clean } = payload;
  void __kind;
  void __reviewers;
  void __delete;

  if (pending.kind === "projects") {
    await store.saveProject({ ...(clean as unknown as Project), slug: pending.slug });
    return { ok: true, mode: "direct" };
  }
  if (pending.kind === "events") {
    await store.saveEvent({ ...(clean as unknown as AriesEvent), slug: pending.slug });
    return { ok: true, mode: "direct" };
  }
  if (pending.kind === "resources") {
    await store.saveResource({ ...(clean as unknown as Resource), slug: pending.slug });
    return { ok: true, mode: "direct" };
  }
  return { ok: false, error: "Unhandled request" };
}
