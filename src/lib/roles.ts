import type { MemberLevel } from "@/lib/supabase/env";
import {
  canApprove,
  canDirectPublish as canDirectPublishWhenListed,
  canEnqueueChangeRequest,
  canPublishResource,
  isLeadership,
} from "./permissions";

export { canApprove, canPublishResource, isLeadership };

export type UiRole = "admin" | "coordinator" | "member" | "blogger" | "viewer";

export function levelToUiRole(level: string | null | undefined): UiRole {
  if (isLeadership(level)) return "admin";
  if (level === "coordinator") return "coordinator";
  if (level === "blogger") return "blogger";
  if (level === "executive" || level === "member") return "member";
  return "viewer";
}

/**
 * Direct create/edit of projects, events, team — leadership + coordinators.
 * Executives submit change_requests instead.
 */
export function canDirectPublish(level: string | null | undefined) {
  return canDirectPublishWhenListed(level, true);
}

export function canDirectCreate(level: string | null | undefined) {
  return canDirectPublish(level);
}

/** Alumni roster + full team photos — leadership (admin UI role) only. */
export function canManageTeamContent(level: string | null | undefined) {
  return isLeadership(level);
}

/** May submit project/event/team changes into the approval queue. */
export function canSubmitForApproval(level: string | null | undefined) {
  return canEnqueueChangeRequest(level, true);
}

export function canAccessEditor(level: string | null | undefined) {
  return canDirectPublish(level) || canSubmitForApproval(level) || canPublishResource(level);
}

export function canUploadKind(level: string | null | undefined, kind: string) {
  if (kind === "team") return canManageTeamContent(level);
  if (kind === "projects" || kind === "events") {
    return canDirectPublish(level) || canSubmitForApproval(level);
  }
  if (kind === "members" || kind === "misc") return Boolean(level);
  return false;
}

export function mapTeamRoleToLevel(role: string): MemberLevel | null {
  const r = role.trim().toLowerCase();
  if (r === "oc") return "oc";
  if (r === "co-overall coordinator" || r === "co overall coordinator") {
    return "co_overall_coordinator";
  }
  if (r === "research lead") return "research_lead";
  if (r.includes("coordinator")) return "coordinator";
  if (r.includes("executive")) return "executive";
  if (r.includes("alumni") || r.includes("alumn")) return "alumni";
  if (r.includes("panel")) return "member";
  return null;
}
