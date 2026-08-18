"use client";

import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import type { Member, Project, ProjectContributor } from "@/lib/types";
import { normalizeContributors } from "@/lib/contributors";
import { MediaField } from "./ImageField";
import { MultiImageField } from "./MultiImageField";
import { TagPicker } from "./TagPicker";
import { PeoplePicker } from "./PeoplePicker";

/**
 * Simplified project create/edit — cover + gallery images + short video.
 */
export function ProjectForm({
  initial,
  onSaved,
  onDeleted,
  members = [],
  knownTags = [],
}: {
  initial?: Partial<Project> & { slug?: string };
  /** Called after a successful direct publish (not pending approval). */
  onSaved?: (project: Project, mode: "direct" | "pending") => void;
  onDeleted?: (slug: string, mode: "direct" | "pending") => void;
  members?: Pick<Member, "slug" | "name" | "level">[];
  knownTags?: string[];
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "deleting">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [image, setImage] = useState(initial?.image ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [video, setVideo] = useState(initial?.video ?? "");
  const [featured, setFeatured] = useState(!!initial?.featured);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
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
    const name = String(f.get("name") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const csv = (key: string) =>
      String(f.get(key) ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const github = String(f.get("github") ?? "").trim();
    const demo = String(f.get("demo") ?? "").trim();

    const data: Project = {
      slug,
      name,
      accent: initial?.accent,
      tagline: String(f.get("tagline") ?? ""),
      description: String(f.get("description") ?? ""),
      about: String(f.get("about") ?? ""),
      category: String(f.get("category") ?? "Project"),
      tags,
      techStack: csv("techStack"),
      contributors,
      features: initial?.features,
      highlights: initial?.highlights,
      screenshots: initial?.screenshots,
      image: image || undefined,
      images: images.length ? images : undefined,
      video: video || undefined,
      featured,
      links: [
        github && { label: "GitHub", url: github },
        demo && { label: "Live Demo", url: demo },
      ].filter(Boolean) as { label: string; url: string }[],
    };

    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "projects", slug, data }),
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
    if (mode === "pending") {
      alert("Submitted for approval (OC / Co-Overall Coordinator / Research Lead).");
    }
    onSaved?.(data, mode);

    if (!initial?.slug && mode === "direct") {
      form.reset();
      setImage("");
      setImages([]);
      setVideo("");
      setFeatured(false);
      setTags([]);
      setContributors([]);
    }
    setTimeout(() => setStatus("idle"), 2500);
  };

  const remove = async () => {
    if (!initial?.slug) return;
    if (!confirm(`Delete project “${initial.name || initial.slug}”? This cannot be undone.`)) return;
    setStatus("deleting");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "projects", slug: initial.slug, action: "delete" }),
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

  const linkUrl = (label: string) =>
    initial?.links?.find((l) => l.label.toLowerCase().includes(label))?.url ?? "";

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">
        {initial?.slug ? `Edit project · ${initial.slug}` : "New project"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Project name *" required defaultValue={initial?.name} />
        <Input name="slug" label="Slug (optional)" defaultValue={initial?.slug} />
        <Input
          name="category"
          label="Category *"
          required
          defaultValue={initial?.category}
          placeholder="Hackathon, Research, Industry…"
        />
        <Input name="tagline" label="Tagline *" required defaultValue={initial?.tagline} />
      </div>
      <TextArea name="description" label="Short description (cards) *" rows={2} required defaultValue={initial?.description} />
      <TextArea name="about" label="About (detail page)" rows={4} defaultValue={initial?.about} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TagPicker
          label="Tags"
          value={tags}
          onChange={setTags}
          suggestions={knownTags}
          placeholder="Search or add a tag…"
        />
        <Input name="techStack" label="Tech stack (comma separated)" defaultValue={initial?.techStack?.join(", ")} />
        <PeoplePicker
          label="Contributors"
          value={contributors}
          onChange={setContributors}
          members={people}
          onEnsureMember={ensureMember}
          onMemberCreated={(m) => setPeople((prev) => (prev.some((x) => x.slug === m.slug) ? prev : [...prev, m]))}
          factory={(name, slug): ProjectContributor => ({ name, slug, kind: "member" })}
          placeholder="Search by name or slug…"
        />
        <Input name="github" label="GitHub URL" defaultValue={linkUrl("git")} />
        <Input name="demo" label="Demo / paper URL" defaultValue={linkUrl("demo") || linkUrl("arxiv")} />
      </div>

      <div className="space-y-4 rounded-xl border border-[#eee4d6] bg-[#fbf8ff] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Media</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaField
            label="Cover image (1)"
            kind="projects"
            value={image}
            onChange={setImage}
            accept="image"
          />
          <MediaField
            label="Short video (optional, max ~40MB)"
            kind="projects"
            value={video}
            onChange={setVideo}
            accept="video"
          />
        </div>
        <MultiImageField
          label="Gallery images"
          kind="projects"
          value={images}
          onChange={setImages}
          hint="Multiple photos shown on the project page (separate from the cover)."
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Featured on projects page
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={status === "saving" || status === "deleting"}
          className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save size={15} />
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Failed" : "Save project"}
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

export function Input({
  label,
  name,
  required,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  rows,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  rows: number;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
      />
    </label>
  );
}
