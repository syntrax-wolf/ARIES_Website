import type { TeamData, TeamYear } from "@/lib/types";

/** Calendar year the academic label starts in (e.g. "26-27" → 2026). */
export function teamYearStart(label: string): number {
  const s = label.trim();
  const four = s.match(/^(\d{4})-(\d{2,4})$/);
  if (four) return Number(four[1]);
  const two = s.match(/^(\d{2})-(\d{2})$/);
  if (two) return 2000 + Number(two[1]);
  const lead = s.match(/^(\d+)/);
  if (lead) {
    const n = Number(lead[1]);
    return n < 100 ? 2000 + n : n;
  }
  return 0;
}

/** Newest academic year first (26-27 before 25-26 before 24-25). */
export function compareTeamYearsDesc(a: { year: string }, b: { year: string }): number {
  const diff = teamYearStart(b.year) - teamYearStart(a.year);
  return diff !== 0 ? diff : b.year.localeCompare(a.year);
}

export function sortTeamYears<T extends { year: string }>(years: T[]): T[] {
  return [...years].sort(compareTeamYearsDesc);
}

/** Live roster year — always the newest entry after sorting. */
export function currentTeamYear<T extends TeamYear>(years: T[]): T | undefined {
  return sortTeamYears(years)[0];
}

export function normalizeTeamData(team: TeamData): TeamData {
  return { ...team, years: sortTeamYears(team.years ?? []) };
}
