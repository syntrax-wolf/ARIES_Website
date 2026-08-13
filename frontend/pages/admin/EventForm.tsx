"use client";

import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import type { AriesEvent, Member, ProjectContributor } from "@/lib/types";
import { normalizeContributors } from "@/lib/contributors";
import { Input, TextArea } from "./ProjectForm";
import { MediaField } from "./ImageField";
import { MultiImageField } from "./MultiImageField";
import { PeoplePicker } from "./PeoplePicker";

/** Create/edit an event with cover image, gallery images, and optional video. */
export function EventForm({
  initial,
  members = [],
  onSaved,
  onDeleted,
}: {
  initial?: Partial<AriesEvent> & { slug?: string; calendar?: string };
  members?: Pick<Member, "slug" | "name" | "level">[];
  onSaved?: (event: AriesEvent, mode: "direct" | "pending") => void;
  onDeleted?: (slug: string, mode: "direct" | "pending") => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "deleting">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [image, setImage] = useState(initial?.image ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [video, setVideo] = useState(initial?.video ?? "");
  const [contributors, setContributors] = useState<ProjectContributor[]>(() =>
    normalizeContributors(initial?.contributors, members),
  );
  const [people, setPeople] = useState(members);

  useEffect(() => {
    setPeople(members);
  }, [members]);

  const ensureMember = async (slug: string, name: string) => {
    const res = await fetch("/api/admin/ensure-member", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? `Could not register member (${res.status})`);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const title = String(f.get("title") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const calendar = String(f.get("calendar") ?? "").trim();

    const data: AriesEvent = {
      slug,
      title,
      type: String(f.get("type") ?? "Workshop") as AriesEvent["type"],
      date: String(f.get("date") ?? ""),
      startTime: String(f.get("startTime") ?? "") || undefined,
      endTime: String(f.get("endTime") ?? "") || undefined,
      venue: String(f.get("venue") ?? "") || undefined,
      description: String(f.get("description") ?? ""),
      body: String(f.get("body") ?? ""),
      image: image || undefined,
      images: images.length ? images : undefined,
      video: video || undefined,
      links: calendar ? [{ label: "Save to Google Calendar", url: calendar }] : [],
      contributors,
    };

    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "events", slug, data }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(body.error ?? `Save failed (${res.status})`);
      setTimeout(() => setStatus("idle"), 2500);
      return;
    }

    const mode = body.mode === "pending" ? "pending" : "direct";
    setStatus("saved");
    if (mode === "pending") alert("Submitted for approval.");
    onSaved?.(data, mode);

    if (!initial?.slug && mode === "direct") {
      form.reset();
      setImage("");
      setImages([]);
      setVideo("");
    }
    setTimeout(() => setStatus("idle"), 2500);
  };

  const remove = async () => {
    if (!initial?.slug) return;
    if (!confirm(`Delete event “${initial.title || initial.slug}”? This cannot be undone.`)) return;
    setStatus("deleting");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "events", slug: initial.slug, action: "delete" }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(body.error ?? `Delete failed (${res.status})`);
      setTimeout(() => setStatus("idle"), 2500);
      return;
    }
    const mode = body.mode === "pending" ? "pending" : "direct";
    if (mode === "pending") alert("Delete submitted for approval.");
    onDeleted?.(initial.slug, mode);
    setStatus("idle");
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">
        {initial?.slug ? `Edit event · ${initial.slug}` : "New event"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="title" label="Event title *" required defaultValue={initial?.title} />
        <Input name="slug" label="Slug (optional)" defaultValue={initial?.slug} />
        <label className="block">
          <span className="text-xs font-semibold text-ink">Type *</span>
          <select
            name="type"
            required
            defaultValue={initial?.type ?? "Workshop"}
            className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
          >
            <option>Workshop</option>
            <option>Talk</option>
            <option>Hackathon</option>
            <option>External</option>
          </select>
        </label>
        <Input name="date" label="Date *" type="date" required defaultValue={initial?.date} />
        <Input name="startTime" label="Start time" placeholder="11:00 AM" defaultValue={initial?.startTime} />
        <Input name="endTime" label="End time" placeholder="01:00 PM" defaultValue={initial?.endTime} />
        <Input name="venue" label="Venue" placeholder="LH 114, IIT Delhi" defaultValue={initial?.venue} />
        <Input name="calendar" label="Google Calendar link" defaultValue={initial?.calendar} />
      </div>
      <PeoplePicker
        label="Organizers / contributors"
        value={contributors}
        onChange={setContributors}
        members={people}
        onEnsureMember={ensureMember}
        onMemberCreated={(m) =>
          setPeople((prev) => (prev.some((x) => x.slug === m.slug) ? prev : [...prev, m]))
        }
        factory={(name, slug): ProjectContributor => ({ name, slug, kind: "member" })}
        placeholder="Search by name or slug…"
      />
      <TextArea name="description" label="Short description (cards) *" rows={2} required defaultValue={initial?.description} />
      <TextArea name="body" label="Full description (detail page)" rows={5} defaultValue={initial?.body} />

      <div className="space-y-4 rounded-xl border border-[#eee4d6] bg-[#fbf8ff] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Media</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaField
            label="Cover image (1)"
            kind="events"
            value={image}
            onChange={setImage}
            accept="image"
          />
          <MediaField
            label="Short video (optional, max ~40MB)"
            kind="events"
            value={video}
            onChange={setVideo}
            accept="video"
          />
        </div>
        <MultiImageField
          label="Gallery images"
          kind="events"
          value={images}
          onChange={setImages}
          hint="Multiple photos shown on the event page (separate from the cover)."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={status === "saving" || status === "deleting"}
          className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save size={15} />
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Failed" : "Save event"}
        </button>
        {initial?.slug && (
          <button
            type="button"
            disabled={status === "saving" || status === "deleting"}
            onClick={() => void remove()}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={15} />
            {status === "deleting" ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
    </form>
  );
}
