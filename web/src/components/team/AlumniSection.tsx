import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Alumnus } from "../../lib/types";
import { initialsOf } from "./PersonCard";
import { memberProfileSlug } from "../../lib/utils";

export function AlumniSection({ alumni }: { alumni: Alumnus[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return alumni;
    return alumni.filter((a) => `${a.name} ${a.role} ${a.org}`.toLowerCase().includes(q));
  }, [alumni, query]);

  return (
    <section className="mt-20 pb-16">
      <h2 className="text-4xl font-black text-ink">Alumni</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink/70">
          Our alumni are building, leading and inspiring across the world.
        </p>
        <label className="flex items-center gap-2 rounded-full border border-[#d9d1c0] bg-white px-4 py-2">
          <Search size={14} className="text-[#8a8daa]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alumni..."
            className="w-40 bg-transparent text-sm text-ink outline-none placeholder-[#8a8daa]"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-[#5b5e82]">No alumni match your search.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((a) => {
            const slug = memberProfileSlug(a);
            const card = (
              <article className="rounded-xl bg-white px-4 py-5 text-center shadow-card-sm transition-transform hover:-translate-y-1">
                {a.photo ? (
                  <span className="relative mx-auto block size-14 overflow-hidden rounded-full">
                    <img src={a.photo} alt={a.name} className="size-full object-cover" />
                  </span>
                ) : (
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-[linear-gradient(135deg,#7a50ff,#4711d9)] text-lg font-bold text-white">
                    {initialsOf(a.name)}
                  </span>
                )}
                <h3 className="mt-3 truncate text-sm font-bold text-ink">{a.name}</h3>
                <p className="mt-1 truncate text-xs text-ink/70">{a.role}</p>
                {a.org && <p className="truncate text-xs text-ink/50">{a.org}</p>}
              </article>
            );

            return slug ? (
              <a key={a.name} href={`/${slug}?from=team`}>
                {card}
              </a>
            ) : (
              <div key={a.name}>{card}</div>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#ece4fa] px-6 py-5">
        <p className="text-sm text-ink">
          <span className="font-bold">Are you an alumnus?</span> Update or add your
          profile — we&rsquo;d love to keep you featured and stay connected.
        </p>
        <a
          href="/admin"
          className="rounded-full border border-purple bg-white px-5 py-2 text-sm font-bold text-purple"
        >
          Sign in to update profile →
        </a>
      </div>
    </section>
  );
}
