/** Club signup secret codes → allowed member levels */
export const SIGNUP_SECRETS: Record<string, string[]> = {
  TONY: ["oc", "co_overall_coordinator", "research_lead"],
  THOR: ["coordinator"],
  STEVE: ["executive"],
  ODIN: ["alumni"],
};

export function levelsForSecret(code: string): string[] | null {
  const key = code.trim().toUpperCase();
  return SIGNUP_SECRETS[key] ?? null;
}

export function secretLabel(code: string): string {
  const key = code.trim().toUpperCase();
  if (key === "TONY") return "OC / Co-Overall Coordinator / Research Lead";
  if (key === "THOR") return "Coordinator";
  if (key === "STEVE") return "Executive";
  if (key === "ODIN") return "Alumni";
  return "";
}
