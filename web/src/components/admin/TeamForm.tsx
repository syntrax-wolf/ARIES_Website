import { useState } from "react";
import { Save } from "lucide-react";
import type { TeamData } from "../../lib/types";
import { Input, TextArea } from "./ProjectForm";

export function TeamForm({
  team,
  onSaved,
}: {
  team: TeamData;
  onSaved?: (team: TeamData) => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const year = String(f.get("year") ?? team.years[0]?.year ?? "2026-27");
    const photos = String(f.get("photos") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const alumniRows = String(f.get("alumni") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, role, org, slug] = line.split("|").map((s) => s.trim());
        return { name: name || "", role: role || "", org: org || "", slug: slug || undefined };
      });
    const existing = team.years.find((y) => y.year === year) ?? team.years[0];
    const years = existing
      ? team.years.map((y) => (y.year === year ? { ...y, photos, photo: photos[0] } : y))
      : [
          ...team.years,
          { year, photos, photo: photos[0], coreTeam: [], coordinators: [], executives: [] },
        ];
    const next: TeamData = { years, alumni: alumniRows };
    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "team", data: next }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(body.error ?? `Save failed (${res.status})`);
      return;
    }
    setStatus("saved");
    onSaved?.(next);
    setTimeout(() => setStatus("idle"), 2000);
  };

  const year = team.years[0];
  const alumniText = (team.alumni ?? [])
    .map((a) => [a.name, a.role, a.org, a.slug].filter(Boolean).join(" | "))
    .join("\n");

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">Team photos and Alumni</h2>
      <p className="text-xs text-ink/55">Leadership only. Alumni lines: name | role | org | slug</p>
      <Input name="year" label="Year label" defaultValue={year?.year ?? "2026-27"} />
      <Input
        name="photos"
        label="Year photos (comma-separated URLs)"
        defaultValue={(year?.photos ?? (year?.photo ? [year.photo] : [])).join(", ")}
      />
      <TextArea name="alumni" label="Alumni" rows={6} defaultValue={alumniText} />
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save team"}
      </button>
      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
    </form>
  );
}
