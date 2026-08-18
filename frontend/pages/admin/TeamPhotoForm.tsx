"use client";

import { useEffect, useState } from "react";
import type { TeamData, TeamYear } from "@/lib/types";
import { sortTeamYears } from "@/lib/team-years";
import { yearPhotos, withYearPhotos } from "@/lib/team-photos";
import { MultiImageField } from "./MultiImageField";

/** Add / change multiple full-team group photos per year (admin only). */
export function TeamPhotoForm({
  team,
  onSaved,
}: {
  team: TeamData;
  onSaved?: (next: TeamData) => void;
}) {
  const [yearLabel, setYearLabel] = useState(team.years[0]?.year ?? "");
  const [photos, setPhotos] = useState<string[]>(() => yearPhotos(team.years[0]));
  const [newYear, setNewYear] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!team.years.length) return;
    const y = team.years.find((x) => x.year === yearLabel) ?? team.years[0];
    setYearLabel(y.year);
    setPhotos(yearPhotos(y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  const selectYear = (year: string) => {
    setYearLabel(year);
    const y = team.years.find((x) => x.year === year);
    setPhotos(yearPhotos(y));
    setStatus("idle");
    setErrorMsg(null);
  };

  const persist = async (years: TeamYear[]) => {
    const next: TeamData = { ...team, years: sortTeamYears(years) };
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "team", slug: "team", data: next }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? `Save failed (${res.status})`);
    onSaved?.(next);
    return next;
  };

  const savePhotos = async () => {
    if (!yearLabel) return;
    setStatus("saving");
    setErrorMsg(null);
    try {
      if (!team.years.some((y) => y.year === yearLabel)) {
        throw new Error("Unknown year — add it first");
      }
      const years = team.years.map((y) =>
        y.year === yearLabel ? withYearPhotos(y, photos) : y,
      );
      await persist(years);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const addYear = async () => {
    const label = newYear.trim();
    if (!label) return;
    if (team.years.some((y) => y.year === label)) {
      setErrorMsg(`Year “${label}” already exists`);
      return;
    }
    setStatus("saving");
    setErrorMsg(null);
    try {
      const blank: TeamYear = {
        year: label,
        photo: undefined,
        photos: undefined,
        coreTeam: [],
        coordinators: [],
        executives: [],
      };
      await persist([...team.years, blank]);
      setNewYear("");
      selectYear(label);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">Full team photos</h2>
      <p className="text-xs text-ink/55">
        Upload one or more group shots for the selected year. Years sort automatically
        (newest left in the carousel). Only the newest year&apos;s roster is shown on /team.
      </p>

      <label className="block text-xs font-semibold text-ink">
        Year
        <select
          value={yearLabel}
          onChange={(e) => selectYear(e.target.value)}
          className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
        >
          {team.years.map((y) => {
            const n = yearPhotos(y).length;
            return (
              <option key={y.year} value={y.year}>
                {y.year}
                {n ? ` (${n} photo${n === 1 ? "" : "s"})` : " (no photos yet)"}
              </option>
            );
          })}
        </select>
      </label>

      <MultiImageField
        label="Team photos"
        kind="team"
        value={photos}
        onChange={setPhotos}
        hint="Add multiple images — first one is the primary cover for this year."
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void savePhotos()}
          disabled={status === "saving" || !yearLabel}
          className="rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved ✓"
              : status === "error"
                ? "Failed"
                : "Save team photos"}
        </button>
      </div>

      <div className="border-t border-[#eee4d6] pt-4">
        <p className="text-xs font-semibold text-ink">
          Add a year (e.g. 2027-28 — sorts to the front when it&apos;s the newest)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            placeholder="e.g. 2025-26"
            className="min-w-[10rem] flex-1 rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
          />
          <button
            type="button"
            onClick={() => void addYear()}
            disabled={status === "saving" || !newYear.trim()}
            className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Add year
          </button>
        </div>
      </div>

      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
    </div>
  );
}
