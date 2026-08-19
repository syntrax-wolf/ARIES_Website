const LEADERSHIP = new Set(["oc", "co_overall_coordinator", "research_lead"]);

export function isLeadership(level: string | null | undefined) {
  return LEADERSHIP.has(String(level ?? ""));
}

/** Direct-publish a Project or Event. Leadership: always. Coordinator: only when Listed. */
export function canDirectPublish(level: string | null | undefined, listed: boolean) {
  if (isLeadership(level)) return true;
  if (level === "coordinator") return listed;
  return false;
}

/** Enqueue a Change Request for a Project or Event. Executive: only when Listed. */
export function canEnqueueChangeRequest(level: string | null | undefined, listed: boolean) {
  return level === "executive" && listed;
}

/** Publish a Resource (blog, tutorial, course, featured link). */
export function canPublishResource(level: string | null | undefined) {
  return isLeadership(level) || level === "coordinator" || level === "blogger";
}

/** Approve or reject a Change Request. */
export function canApprove(level: string | null | undefined) {
  return isLeadership(level);
}

/** Edit Roster identity (name, Level, Kerberos, email, avatar). */
export function canManageRoster(level: string | null | undefined) {
  return isLeadership(level);
}

/** Add or remove Kerberos ids on the Allowlist. */
export function canManageAllowlist(level: string | null | undefined) {
  return isLeadership(level);
}
