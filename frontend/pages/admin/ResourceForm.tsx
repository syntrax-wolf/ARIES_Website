"use client";

import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import type { Member, Resource, ResourceAuthor } from "@/lib/types";
import { Input, TextArea } from "./ProjectForm";
import { MediaField } from "./ImageField";
import { PeoplePicker } from "./PeoplePicker";

const RESOURCE_TYPES: Resource["type"][] = ["Blog", "Tutorial", "Course", "Featured"];

/** Create/edit a resource — blog-style detail page with title, authors and markdown body. */
export function ResourceForm({
  initial,
  members = [],
  onSaved,
  onDeleted,
}: {
  initial?: Resource;
  members?: Pick<Member, "slug" | "name" | "level">[];
  onSaved?: (resource: Resource, mode: "direct" | "pending") => void;
  onDeleted?: (slug: string, mode: "direct" | "pending") => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "deleting">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [featured, setFeatured] = useState(!!initial?.featured);
  const [authors, setAuthors] = useState<Resource["authors"]>(initial?.authors ?? []);
  const [type, setType] = useState<Resource["type"]>(initial?.type ?? "Blog");
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

    const data: Resource = {
      slug,
      title,
      description: String(f.get("description") ?? ""),
      type,
      url: String(f.get("url") ?? "").trim() || undefined,
      addedOn: String(f.get("addedOn") ?? ""),
      authors: authors && authors.length > 0 ? authors : undefined,
      body: String(f.get("body") ?? ""),
      featured,
      coverImage: coverImage || undefined,
    };

    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "resources", slug, data }),
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
      setCoverImage("");
      setFeatured(false);
      setAuthors([]);
      setType("Blog");
    }
    setTimeout(() => setStatus("idle"), 2500);
  };

  const remove = async () => {
    if (!initial?.slug) return;
    if (!confirm(`Delete resource “${initial.title || initial.slug}”? This cannot be undone.`)) return;
    setStatus("deleting");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "resources", slug: initial.slug, action: "delete" }),
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
        {initial?.slug ? `Edit resource · ${initial.slug}` : "New resource"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="title" label="Title *" required defaultValue={initial?.title} />
        <Input name="slug" label="Slug (optional)" defaultValue={initial?.slug} />
        <label className="block">
          <span className="text-xs font-semibold text-ink">Type *</span>
          <select
            name="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as Resource["type"])}
            className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <Input name="addedOn" label="Added on *" type="date" required defaultValue={initial?.addedOn} />
        <Input
          name="url"
          label={type === "Featured" ? "Featured URL" : "Resource URL"}
          defaultValue={initial?.url}
        />
      </div>
      <TextArea
        name="description"
        label="Short description (cards) *"
        rows={2}
        required
        defaultValue={initial?.description}
      />
      <PeoplePicker<ResourceAuthor>
        label="Authors"
        value={authors ?? []}
        onChange={setAuthors}
        members={people}
        onEnsureMember={ensureMember}
        onMemberCreated={(m) => setPeople((prev) => (prev.some((x) => x.slug === m.slug) ? prev : [...prev, m]))}
        factory={(name, slug): ResourceAuthor => ({ name, slug, kind: "member" })}
        placeholder="Search by name or slug…"
      />
      <TextArea
        name="body"
        label="Body (markdown detail page)"
        rows={10}
        defaultValue={initial?.body}
      />
      <MediaField label="Cover image" kind="misc" value={coverImage} onChange={setCoverImage} accept="image" />
      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Feature on the resources page
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={status === "saving" || status === "deleting"}
          className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save size={15} />
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Failed" : "Save resource"}
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
