import type { MemberLevel } from "@/lib/supabase/env";

export type UiRole = "admin" | "coordinator" | "member" | "blogger" | "viewer";

export function levelToUiRole(level: string | null | undefined): UiRole {
  if (level === "oc" || level === "co_overall_coordinator" || level === "research_lead") {
    return "admin";
  }
  if (level === "coordinator") return "coordinator";
  if (level === "blogger") return "blogger";
  if (level === "executive" || level === "member") return "member";
  return "viewer";
}

/** OC / Co-Overall Coordinator / Research Lead */
export function isLeadership(level: string | null | undefined) {
  return (
    level === "oc" ||
    level === "co_overall_coordinator" ||
    level === "research_lead"
  );
}

/**
 * Direct create/edit of projects, events, team — leadership + coordinators.
 * Executives submit change_requests instead.
 */
export function canDirectPublish(level: string | null | undefined) {
  return isLeadership(level) || level === "coordinator";
}

export function canDirectCreate(level: string | null | undefined) {
  return canDirectPublish(level);
}

/** Approve/reject pending requests — leadership only. */
export function canApprove(level: string | null | undefined) {
  return isLeadership(level);
}

/** Alumni roster + full team photos — leadership (admin UI role) only. */
export function canManageTeamContent(level: string | null | undefined) {
  return isLeadership(level);
}

/** May submit project/event/team changes into the approval queue. */
export function canSubmitForApproval(level: string | null | undefined) {
  return level === "executive";
}

/** Can publish/edit resources (blogs, tutorials, courses, featured links). */
export function canPublishResource(level: string | null | undefined) {
  return canDirectPublish(level) || level === "blogger";
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
