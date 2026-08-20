import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import type { Member, ProfileBlock } from "../../lib/types";
import { Input, TextArea } from "./ProjectForm";

export function ProfileForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved?: (member: Member) => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ProfileBlock[]>(member.blocks ?? []);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...blocks];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap]!, next[index]!];
    setBlocks(next);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data: Member = {
      ...member,
      name: String(f.get("name") ?? member.name),
      role: String(f.get("role") ?? member.role),
      tagline: String(f.get("tagline") ?? member.tagline),
      year: String(f.get("year") ?? "") || undefined,
      location: String(f.get("location") ?? "") || undefined,
      avatar: String(f.get("avatar") ?? "") || undefined,
      resumeUrl: String(f.get("resumeUrl") ?? "") || undefined,
      blocks: blocks.map((b, i) => ({
        ...b,
        title: String(f.get(`block-title-${i}`) ?? b.title ?? ""),
        data: b.type === "text" ? String(f.get(`block-data-${i}`) ?? b.data ?? "") : b.data,
      })),
    };
    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "members", slug: member.slug, data }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(body.error ?? `Save failed (${res.status})`);
      return;
    }
    setStatus("saved");
    onSaved?.(data);
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">Profile · {member.slug}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Name" defaultValue={member.name} />
        <Input name="role" label="Role" defaultValue={member.role} />
        <Input name="tagline" label="Tagline" defaultValue={member.tagline} />
        <Input name="year" label="Year" defaultValue={member.year} />
        <Input name="location" label="Location" defaultValue={member.location} />
        <Input name="avatar" label="Avatar URL" defaultValue={member.avatar} />
        <Input name="resumeUrl" label="Resume URL" defaultValue={member.resumeUrl} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Blocks</p>
          <button
            type="button"
            onClick={() =>
              setBlocks((prev) => [
                ...prev,
                {
                  id: `block-${Date.now()}`,
                  type: "text",
                  span: "full",
                  title: "About",
                  data: "",
                },
              ])
            }
            className="flex items-center gap-1 text-xs font-bold text-purple"
          >
            <Plus size={12} /> Add text Block
          </button>
        </div>
        {blocks.map((block, i) => (
          <div key={block.id} className="rounded-xl border border-ink/10 p-3">
            <div className="mb-2 flex gap-2">
              <button type="button" onClick={() => move(i, -1)} className="rounded bg-lilac p-1">
                <ArrowUp size={12} />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="rounded bg-lilac p-1">
                <ArrowDown size={12} />
              </button>
              <button
                type="button"
                onClick={() => setBlocks((prev) => prev.filter((_, j) => j !== i))}
                className="ml-auto rounded bg-red-50 p-1 text-red-600"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <Input name={`block-title-${i}`} label="Title" defaultValue={block.title} />
            {block.type === "text" && (
              <TextArea
                name={`block-data-${i}`}
                label="Text"
                rows={4}
                defaultValue={typeof block.data === "string" ? block.data : ""}
              />
            )}
            {block.type !== "text" && (
              <p className="mt-2 text-xs text-ink/50">{block.type} Block (kept as-is on save)</p>
            )}
          </div>
        ))}
      </div>
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save profile"}
      </button>
      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
    </form>
  );
}
