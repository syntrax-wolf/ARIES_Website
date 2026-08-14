"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Input, TextArea } from "./ProjectForm";
import { ImageField } from "./ImageField";
import { mapTeamRoleToLevel } from "@/lib/roles";

const MEMBER_ROLES = [
  "Research Coordinator",
  "Coordinator",
  "Executive",
  "Research Executive",
  "Panelist",
  "Alumni",
] as const;

/** Create / update a member profile JSON (+ optional Kerberos for leadership). */
export function MemberForm({
  initial,
  canSetKerberos = false,
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
    about?: string;
    entryNumber?: string;
    email?: string;
    level?: string;
  };
  /** OC / Co-OC / Research Lead can set Kerberos so the person can sign up. */
  canSetKerberos?: boolean;
  onSaved?: (slug: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photo, setPhoto] = useState(initial?.photo ?? "");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const about = String(f.get("about") ?? "").trim();
    const entryNumber = String(f.get("entryNumber") ?? "").trim().toLowerCase();
    const email = String(f.get("email") ?? "").trim().toLowerCase();

    const role = String(f.get("role") ?? "");
    const mappedLevel = mapTeamRoleToLevel(role);

    const data = {
      slug,
      name,
      role,
      tagline: String(f.get("tagline") ?? ""),
      year: String(f.get("year") ?? "") || undefined,
      location: String(f.get("location") ?? "") || "IIT Delhi",
      avatar: photo || undefined,
      socials: [],
      blocks: about
        ? [{ id: "about", type: "text" as const, span: "full" as const, title: "About", data: about }]
        : [],
    };

    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "members",
        slug,
        data,
        ...(canSetKerberos
          ? {
              entryNumber: entryNumber || null,
              email: email || null,
              level: mappedLevel || initial?.level || null,
            }
          : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(body.error ?? `Save failed (${res.status})`);
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }
    setStatus("saved");
    onSaved?.(slug);
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">
        {initial?.slug ? `Edit member · ${initial.slug}` : "New member"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Name *" required defaultValue={initial?.name} />
        <Input name="slug" label="Slug" placeholder="auto from name" defaultValue={initial?.slug} />
        <label className="block">
          <span className="text-xs font-semibold text-ink">Role *</span>
          <select
            name="role"
            required
            defaultValue={initial?.role ?? ""}
            className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
          >
            <option value="" disabled>
              Select role…
            </option>
            {initial?.role &&
              !(MEMBER_ROLES as readonly string[]).includes(initial.role) && (
                <option value={initial.role}>{initial.role}</option>
              )}
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <Input name="year" label="Year / branch" defaultValue={initial?.year} placeholder="3rd Year, CSE" />
        <Input name="location" label="Location" defaultValue={initial?.location ?? "IIT Delhi"} />
        <Input name="tagline" label="Tagline" defaultValue={initial?.tagline} />
      </div>
      {canSetKerberos && (
        <div className="grid gap-4 rounded-xl border border-[#eee4d6] bg-[#fbf8ff] p-4 sm:grid-cols-2">
          <Input
            name="entryNumber"
            label="Kerberos / entry number (signup ID)"
            placeholder="cs1240559"
            defaultValue={initial?.entryNumber}
          />
          <Input
            name="email"
            label="IITD email"
            placeholder="cs1240559@iitd.ac.in"
            defaultValue={initial?.email}
          />
          <p className="sm:col-span-2 text-[11px] text-ink/55">
            Required for signup. Use the part before @ in their IITD mail (e.g.{" "}
            <code>cs1240559</code>). Without this, signup shows “not on the roster”.
          </p>
        </div>
      )}
      <ImageField label="Profile photo" kind="members" value={photo} onChange={setPhoto} />
      <TextArea name="about" label="About" rows={4} defaultValue={initial?.about} />
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Failed" : "Save member"}
      </button>
      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
    </form>
  );
}
