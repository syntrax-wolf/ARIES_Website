"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Wrench,
  BookOpen,
  GraduationCap,
  Link2,
  ExternalLink,
  Bookmark,
  ChevronDown,
} from "lucide-react";
import type { Resource } from "@/lib/types";
import { CategoryBadge } from "frontend/shared/ui/CategoryBadge";
import { cn } from "@/lib/utils";
import { authorLabel } from "@/lib/contributors";
import Link from "next/link";

const TYPES = [
  { label: "Blog", type: "Blog", icon: BookOpen },
  { label: "Tutorial", type: "Tutorial", icon: Wrench },
  { label: "Course", type: "Course", icon: GraduationCap },
  { label: "Featured", type: "Featured", icon: Link2 },
] as const;

/** Resources page body: type tabs, featured cards, all-resources table. */
export function ResourcesExplorer({ resources }: { resources: Resource[] }) {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);

  const visible = useMemo(() => {
    let list = resources;
    if (activeType) list = list.filter((r) => r.type === activeType);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => `${r.title} ${r.description} ${r.type}`.toLowerCase().includes(q));
    return [...list].sort((a, b) =>
      newestFirst ? b.addedOn.localeCompare(a.addedOn) : a.addedOn.localeCompare(b.addedOn),
    );
  }, [resources, activeType, query, newestFirst]);

  const featured = resources.filter((r) => r.featured);

  return (
    <div className="pb-20">
      {/* Heading + search */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-ink md:text-5xl">Learning Resources</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink/70">
            Curated blogs, tutorials, courses and featured finds from the ARIES community.
          </p>
        </div>
        <label className="flex w-full max-w-sm items-center gap-2 rounded-full border border-[#e3dacb] bg-white px-5 py-3 shadow-card-sm">
          <Search size={16} className="text-[#8a8daa]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder-[#8a8daa]"
          />
        </label>
      </div>

      {/* Type tabs */}
      <div className="no-scrollbar mt-8 flex gap-3 overflow-x-auto">
        {TYPES.map((t) => {
          const active = activeType === t.type;
          return (
            <button
              key={t.type}
              onClick={() => setActiveType(active ? null : t.type)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-colors",
                active
                  ? "border-purple bg-white text-purple shadow-card-sm"
                  : "border-transparent bg-white/70 text-ink hover:bg-white",
              )}
            >
              <t.icon size={16} className="text-purple" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Featured */}
      {!activeType && !query && featured.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">✦ Featured Resources</h2>
          </div>
          <div className="no-scrollbar mt-5 flex gap-5 overflow-x-auto pb-2">
            {featured.map((r) => (
              <Link
                key={r.slug}
                href={`/resources/${r.slug}`}
                className="group w-60 shrink-0 rounded-2xl bg-white p-4 shadow-card-sm transition-transform hover:-translate-y-1"
              >
                {r.coverImage ? (
                  <div className="h-28 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.coverImage}
                      alt=""
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="grid h-28 place-items-center rounded-xl bg-[linear-gradient(135deg,#ece5f8,#d9ccf4)] text-purple">
                    <FeaturedIcon type={r.type} />
                  </div>
                )}
                <div className="mt-4">
                  <CategoryBadge>{r.type}</CategoryBadge>
                </div>
                <h3 className="mt-2 text-sm font-bold text-ink">{r.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-ink/70">
                  {r.description}
                </p>
                {r.url && (
                  <ExternalLink size={14} className="mt-3 text-purple opacity-60 group-hover:opacity-100" />
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All resources table */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">All resources</h2>
          <button
            onClick={() => setNewestFirst((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-[#e3dacb] bg-white px-4 py-2 text-xs font-semibold text-ink"
          >
            {newestFirst ? "Newest First" : "Oldest First"} <ChevronDown size={14} />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card-sm">
          <div className="hidden grid-cols-[1fr_120px_120px_40px] gap-4 border-b border-[#f0e8dc] px-6 py-3 text-xs font-semibold text-ink/50 md:grid">
            <span>Resource</span>
            <span>Type</span>
            <span>Added On</span>
            <span />
          </div>
          {visible.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-[#5b5e82]">
              Nothing here yet — try clearing the search or filters.
            </p>
          ) : (
            visible.map((r) => (
              <Link
                key={r.slug}
                href={`/resources/${r.slug}`}
                className="grid grid-cols-1 gap-2 border-b border-[#f6f0e6] px-6 py-4 transition-colors last:border-0 hover:bg-[#faf6ef] md:grid-cols-[1fr_120px_120px_40px] md:items-center md:gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-ink">{r.title}</h3>
                  <p className="mt-0.5 text-xs text-ink/60">
                    {r.authors && r.authors.length > 0
                      ? `By ${r.authors.map(authorLabel).join(", ")}`
                      : r.description}
                  </p>
                </div>
                <span>
                  <CategoryBadge>{r.type}</CategoryBadge>
                </span>
                <span className="text-xs text-ink/60">
                  {new Date(r.addedOn + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <Bookmark size={16} className="hidden text-ink/30 md:block" />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function FeaturedIcon({ type }: { type: Resource["type"] }) {
  switch (type) {
    case "Tutorial":
      return <Wrench size={34} strokeWidth={1.4} />;
    case "Course":
      return <GraduationCap size={34} strokeWidth={1.4} />;
    case "Featured":
      return <Link2 size={34} strokeWidth={1.4} />;
    case "Blog":
    default:
      return <BookOpen size={34} strokeWidth={1.4} />;
  }
}
