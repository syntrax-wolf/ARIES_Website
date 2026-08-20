import { canPublishResource, isLeadership } from "../permissions.ts";
import type { AriesEvent, Project, Resource } from "../types.ts";
import type { GateSession } from "../gate/gate.ts";
import type { WritableContentStore } from "./d1.ts";
import { isListedOnEvent, isListedOnProject, type Actor } from "./publish.ts";

export async function resolveActor(
  store: WritableContentStore,
  session: GateSession,
): Promise<Actor> {
  if (session.kind === "admin") {
    return { session, level: "oc", memberSlug: "admin" };
  }
  const kerberos = (session.kerberos ?? "").trim().toLowerCase();
  const members = await store.listMembers();
  const member = members.find(
    (m) => m.entryNumber?.trim().toLowerCase() === kerberos || m.slug === kerberos,
  );
  return {
    session,
    level: member?.level ?? "visitor",
    memberSlug: member?.slug ?? "",
  };
}

export function projectsEditableBy(actor: Actor, projects: Project[]): Project[] {
  if (actor.session.kind === "admin" || isLeadership(actor.level)) return projects;
  if (actor.level === "coordinator" || actor.level === "executive") {
    return projects.filter((p) => isListedOnProject(p, actor.memberSlug));
  }
  return [];
}

export function eventsEditableBy(actor: Actor, events: AriesEvent[]): AriesEvent[] {
  if (actor.session.kind === "admin" || isLeadership(actor.level)) return events;
  if (actor.level === "coordinator" || actor.level === "executive") {
    return events.filter((e) => isListedOnEvent(e, actor.memberSlug));
  }
  return [];
}

export function resourcesEditableBy(actor: Actor, resources: Resource[]): Resource[] {
  if (actor.session.kind === "admin" || canPublishResource(actor.level)) return resources;
  return [];
}
