import { canDirectPublish } from "../../../../src/lib/permissions.ts";
import type { Project, ProjectContributor } from "../../../../src/lib/types.ts";
import type { GateSession } from "../gate/gate.ts";
import type { WritableContentStore } from "./d1.ts";

export type Actor = {
  session: GateSession;
  level: string;
  memberSlug: string;
};

export type PublishResult =
  | { ok: true; mode: "direct" }
  | { ok: false; error: string };

export function isListedOnProject(project: Project, memberSlug: string): boolean {
  if (!memberSlug) return false;
  return (project.contributors ?? []).some((c) => contributorSlug(c) === memberSlug);
}

function contributorSlug(c: string | ProjectContributor) {
  return typeof c === "string" ? c : c.slug;
}

export function actorMayDirectPublish(actor: Actor, listed: boolean): boolean {
  if (actor.session.kind === "admin") return true;
  return canDirectPublish(actor.level, listed);
}

export async function publishProject(
  store: WritableContentStore,
  actor: Actor,
  project: Project,
): Promise<PublishResult> {
  const listed = isListedOnProject(project, actor.memberSlug);
  if (!actorMayDirectPublish(actor, listed)) {
    return { ok: false, error: "Not allowed to direct-publish this Project" };
  }
  const before = await store.getProject(project.slug);
  await store.saveProject(project);
  await store.appendChangeLog({
    kind: "projects",
    slug: project.slug,
    actor: actor.session.kind === "admin" ? "admin" : actor.memberSlug,
    summary: before ? "Updated Project" : "Created Project",
  });
  return { ok: true, mode: "direct" };
}
