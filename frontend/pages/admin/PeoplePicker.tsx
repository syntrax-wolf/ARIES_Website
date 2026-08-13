"use client";

import { useMemo, useRef, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Member } from "@/lib/types";
import { slugifyName } from "@/lib/utils";
import { isVisitor } from "@/lib/supabase/env";

export type PeopleRef = {
  name: string;
  slug?: string;
  kind?: string;
};

/**
 * Searchable people picker — pick from existing members, or register a new slug
 * as a non-ARIES visitor member with a profile page.
 */
export function PeoplePicker<T extends PeopleRef>({
  label,
  value,
  onChange,
  members,
  factory,
  onEnsureMember,
  onMemberCreated,
  placeholder = "Search members by name or slug…",
}: {
  label: string;
  value: T[];
  onChange: (next: T[]) => void;
  members: Pick<Member, "slug" | "name" | "level">[];
  factory: (name: string, slug: string) => T;
  onEnsureMember?: (slug: string, name: string) => Promise<void>;
  onMemberCreated?: (member: Pick<Member, "slug" | "name" | "level">) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{ name: string; slug: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSlugs = useMemo(
    () => new Set(value.filter((c) => c.slug).map((c) => c.slug!)),
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !selectedSlugs.has(m.slug))
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [members, selectedSlugs, query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return (
      members.find(
        (m) =>
          !selectedSlugs.has(m.slug) &&
          (m.slug.toLowerCase() === q || m.name.toLowerCase() === q),
      ) ?? null
    );
  }, [members, selectedSlugs, query]);

  const canAddNew =
    query.trim().length > 0 && !exactMatch && !selectedSlugs.has(slugifyName(query.trim()));

  const addExisting = (m: Pick<Member, "slug" | "name">) => {
    if (selectedSlugs.has(m.slug)) return;
    onChange([...value, factory(m.name, m.slug)]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const openCreateDialog = () => {
    const raw = query.trim();
    if (!raw) return;
    setPending({
      name: raw,
      slug: slugifyName(raw),
    });
    setError(null);
  };

  const confirmCreate = async () => {
    if (!pending || !onEnsureMember) return;
    const slug = pending.slug.trim();
    const name = pending.name.trim();
    if (!slug || !name) return;
    if (selectedSlugs.has(slug)) {
      setError("This person is already selected.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onEnsureMember(slug, name);
      onMemberCreated?.({ slug, name, level: "visitor" });
      onChange([...value, factory(name, slug)]);
      setPending(null);
      setQuery("");
      setOpen(false);
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register member");
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const chipLabel = (c: T) => c.name?.trim() || c.slug || "Unknown";

  const chipBadge = (c: T) => {
    if (!c.slug) return "No profile";
    const level = members.find((m) => m.slug === c.slug)?.level;
    if (isVisitor(level)) return "Non-ARIES";
    return null;
  };

  return (
    <div className="block sm:col-span-2">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="relative mt-1.5">
        <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg bg-[#f3eef8] px-2.5 py-2 focus-within:ring-2 focus-within:ring-purple/40">
          {value.map((c, i) => {
            const badge = chipBadge(c);
            return (
              <span
                key={`${c.slug ?? c.name}-${i}`}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm"
              >
                {chipLabel(c)}
                {badge && (
                  <span className="rounded bg-[#efe9fb] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple">
                    {badge}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="text-ink/40 hover:text-ink"
                  aria-label={`Remove ${chipLabel(c)}`}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (exactMatch) {
                  addExisting(exactMatch);
                } else if (filtered.length === 1) {
                  addExisting(filtered[0]);
                } else if (canAddNew) {
                  openCreateDialog();
                }
              } else if (e.key === "Backspace" && !query && value.length) {
                removeAt(value.length - 1);
              } else if (e.key === "Escape") {
                setPending(null);
                setOpen(false);
              }
            }}
            placeholder={value.length ? "" : placeholder}
            className="min-w-[10rem] flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
        </div>

        {open && (filtered.length > 0 || canAddNew) && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#e4dcf3] bg-white py-1 shadow-lg">
            {filtered.length === 0 && !canAddNew && (
              <li className="px-3 py-2 text-sm text-ink/50">No matches</li>
            )}
            {filtered.map((m) => (
              <li key={m.slug}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addExisting(m)}
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-[#f3eef8]"
                >
                  <span className="text-sm font-semibold text-ink">
                    {isVisitor(m.level) && (
                      <em className="mr-1.5 font-normal not-italic text-ink/50">(non-aries)</em>
                    )}
                    <span className={isVisitor(m.level) ? "italic" : ""}>{m.name}</span>
                  </span>
                  <span className="text-xs text-ink/50">{m.slug}</span>
                </button>
              </li>
            ))}
            {canAddNew && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={openCreateDialog}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-purple hover:bg-[#f3eef8]"
                >
                  <AlertTriangle size={14} />
                  Add “{query.trim()}” as a non-ARIES member…
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="people-pending-title"
          onClick={() => !busy && setPending(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="people-pending-title" className="flex items-center gap-2 text-base font-bold text-ink">
              <AlertTriangle size={18} className="text-amber-500" /> Register non-ARIES member
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Are you sure; this slug is not present and this name will be registered as a
              non-ARIES member.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink">Display name</span>
                <input
                  value={pending.name}
                  onChange={(e) => setPending((p) => (p ? { ...p, name: e.target.value } : p))}
                  className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Profile slug</span>
                <input
                  value={pending.slug}
                  onChange={(e) => setPending((p) => (p ? { ...p, slug: slugifyName(e.target.value) } : p))}
                  className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
                />
                <p className="mt-1 text-xs text-ink/50">
                  Used for the public profile URL: ariesiitd.com/{pending.slug}
                </p>
              </label>
            </div>
            {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void confirmCreate()}
                disabled={busy || !pending.name.trim() || !pending.slug.trim()}
                className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Registering…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={busy}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink/60 hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
