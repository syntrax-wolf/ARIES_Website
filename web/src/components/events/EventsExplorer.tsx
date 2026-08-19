import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { AriesEvent } from "../../../../src/lib/types";
import { cn } from "../../../../src/lib/utils";
import { EventCard } from "./EventCard";

const TABS = ["All Events", "Workshops", "Talks", "Hackathons", "Externals"] as const;

const tabMatches = (tab: (typeof TABS)[number], e: AriesEvent) => {
  switch (tab) {
    case "Workshops":
      return e.type === "Workshop";
    case "Talks":
      return e.type === "Talk";
    case "Hackathons":
      return e.type === "Hackathon";
    case "Externals":
      return e.type === "External";
    default:
      return true;
  }
};

const matchesQuery = (e: AriesEvent, q: string) => {
  if (!q) return true;
  return [e.title, e.type, e.description, e.body, e.venue, e.date]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
};

export function EventsExplorer({
  upcoming,
  past,
}: {
  upcoming: AriesEvent[];
  past: AriesEvent[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Events");
  const [sortAsc, setSortAsc] = useState(true);
  const [query, setQuery] = useState("");

  const filteredUpcoming = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = upcoming.filter((e) => tabMatches(tab, e) && matchesQuery(e, q));
    return sortAsc ? list : [...list].reverse();
  }, [upcoming, tab, sortAsc, query]);
  const filteredPast = useMemo(() => {
    const q = query.trim().toLowerCase();
    return past.filter((e) => tabMatches(tab, e) && matchesQuery(e, q));
  }, [past, tab, query]);

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-[#d9d1c0] bg-white px-4 py-2.5">
          <Search size={16} className="text-[#8a8daa]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events by title, type, or venue"
            className="w-full bg-transparent text-sm text-[#11154a] placeholder-[#8a8daa] outline-none"
          />
        </label>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#d9d1c6] pb-0">
        <div className="no-scrollbar flex items-center overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative shrink-0 border-r border-[#d9d1c6] px-7 pb-3 text-sm last:border-r-0",
                t === tab ? "font-bold text-[#081634]" : "text-[#081634]/80",
              )}
            >
              {t}
              {t === tab && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded bg-[#07122d]" />}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="mb-2 flex items-center gap-6 rounded-lg border border-[#eadfd3] bg-[#fff9f2] px-4 py-2.5 text-sm text-[#081634]"
        >
          Sort by: {sortAsc ? "Upcoming" : "Latest first"}
          <ChevronDown size={16} />
        </button>
      </div>

      <section className="mt-10">
        <h2 className="text-base font-bold text-[#081634]">Upcoming Events</h2>
        {filteredUpcoming.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#d9d1c6] bg-white/50 p-10 text-center text-sm text-[#5b5e82]">
            No upcoming {tab === "All Events" ? "events" : tab.toLowerCase()} right now — check back soon.
          </div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredUpcoming.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14 pb-24">
        <h2 className="text-base font-bold text-[#081634]">Past Events</h2>
        {filteredPast.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#d9d1c6] bg-white/50 p-10 text-center text-sm text-[#5b5e82]">
            No past {tab === "All Events" ? "events" : tab.toLowerCase()} in the backup yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredPast.map((e) => (
              <EventCard key={e.slug} event={e} variant="past" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
