import { useState } from "react";
import { Save } from "lucide-react";
import { Input } from "./ProjectForm";

const CLUB_LEVELS = [
  { value: "oc", label: "OC" },
  { value: "co_overall_coordinator", label: "Co-Overall Coordinator" },
  { value: "research_lead", label: "Research Lead" },
  { value: "coordinator", label: "Coordinator" },
  { value: "executive", label: "Executive" },
  { value: "member", label: "Member" },
  { value: "alumni", label: "Alumni" },
  { value: "visitor", label: "Visitor" },
];

export function MemberForm({
  initial,
  onSaved,
}: {
  initial?: {
    slug?: string;
    name?: string;
    role?: string;
    tagline?: string;
    year?: string;
    location?: string;
    photo?: string;
    entryNumber?: string;
    email?: string;
    level?: string;
  };
  onSaved?: (slug: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const entryNumber = String(f.get("entryNumber") ?? "").trim().toLowerCase();
    const email = String(f.get("email") ?? "").trim().toLowerCase();

    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "members",
        action: "roster",
        slug,
        entryNumber: entryNumber || null,
        email: email || null,
        data: {
          slug,
          name,
          role: String(f.get("role") ?? ""),
          tagline: String(f.get("tagline") ?? ""),
          year: String(f.get("year") ?? "") || undefined,
          location: String(f.get("location") ?? "") || undefined,
          photo: String(f.get("photo") ?? "") || undefined,
          clubLevel: String(f.get("clubLevel") ?? "member"),
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(body.error ?? `Save failed (${res.status})`);
      return;
    }
    setStatus("saved");
    onSaved?.(slug);
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">
        {initial?.slug ? `Roster · ${initial.slug}` : "New roster row"}
      </h2>
      <p className="text-xs text-ink/55">Identity only. Profile Blocks are not overwritten.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Name *" required defaultValue={initial?.name} />
        <Input name="slug" label="Slug" defaultValue={initial?.slug} />
        <Input name="role" label="Public role" defaultValue={initial?.role} />
        <Input name="tagline" label="Tagline" defaultValue={initial?.tagline} />
        <Input name="year" label="Year / dept" defaultValue={initial?.year} />
        <Input name="location" label="Location" defaultValue={initial?.location} />
        <Input name="entryNumber" label="Kerberos" defaultValue={initial?.entryNumber} />
        <Input name="email" label="Email" defaultValue={initial?.email} />
        <Input name="photo" label="Avatar URL" defaultValue={initial?.photo} />
        <label className="block">
          <span className="text-xs font-semibold text-ink">Level</span>
          <select
            name="clubLevel"
            defaultValue={initial?.level ?? "member"}
            className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
          >
            {CLUB_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save roster"}
      </button>
      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
    </form>
  );
}
