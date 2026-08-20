import { useState } from "react";
import { Save } from "lucide-react";
import type { Resource, ResourceAuthor } from "../../lib/types";
import { Input, TextArea } from "./ProjectForm";

const RESOURCE_TYPES: Resource["type"][] = ["Blog", "Tutorial", "Course", "Featured"];

export function ResourceForm({
  initial,
  onSaved,
}: {
  initial?: Resource;
  onSaved?: (resource: Resource, mode: "direct" | "pending") => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [featured, setFeatured] = useState(!!initial?.featured);
  const [type, setType] = useState<Resource["type"]>(initial?.type ?? "Blog");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const title = String(f.get("title") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const authors: ResourceAuthor[] = String(f.get("authors") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((slugOrName) => ({ name: slugOrName, slug: slugOrName, kind: "member" }));

    const data: Resource = {
      slug,
      title,
      description: String(f.get("description") ?? ""),
      type,
      url: String(f.get("url") ?? "").trim() || undefined,
      addedOn: String(f.get("addedOn") ?? ""),
      authors: authors.length ? authors : undefined,
      body: String(f.get("body") ?? ""),
      featured,
      coverImage: String(f.get("coverImage") ?? "").trim() || undefined,
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
    setTimeout(() => setStatus("idle"), 2500);
  };

  const authorValue = (initial?.authors ?? [])
    .map((a) => a.slug || a.name)
    .filter(Boolean)
    .join(", ");

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
        <Input name="url" label="Resource URL" defaultValue={initial?.url} />
        <Input name="authors" label="Author slugs (comma separated)" defaultValue={authorValue} />
        <Input name="coverImage" label="Cover image URL" defaultValue={initial?.coverImage} />
      </div>
      <TextArea
        name="description"
        label="Short description (cards) *"
        rows={2}
        required
        defaultValue={initial?.description}
      />
      <TextArea name="body" label="Body (markdown detail page)" rows={10} defaultValue={initial?.body} />
      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Feature on the resources page
      </label>
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Failed" : "Save resource"}
      </button>
      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
    </form>
  );
}
