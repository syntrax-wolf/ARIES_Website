"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronDown, Pencil, Plus, Search } from "lucide-react";
import type { AriesEvent } from "@/lib/types";
import { EventCard } from "frontend/shared/cards/EventCard";
import { EventForm } from "frontend/pages/admin/EventForm";
import { useAuth } from "@/context/AuthContext";
import { canDirectCreate, canSubmitForApproval, isLeadership } from "@/lib/roles";
import { slugOnEvent } from "@/lib/entity-access";
import { cn } from "@/lib/utils";

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

const isUpcoming = (e: AriesEvent) => {
  if (!e.date) return false;
  const d = new Date(e.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
};

const matchesQuery = (e: AriesEvent, q: string) => {
  if (!q) return true;
  return [e.title, e.type, e.description, e.body, e.venue, e.date]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
};

/** Filterable upcoming/past event grids + logged-in create/edit. */
export function EventsExplorer({
  upcoming: initialUpcoming,
  past: initialPast,
}: {
  upcoming: AriesEvent[];
  past: AriesEvent[];
}) {
  const router = useRouter();
  const { session } = useAuth();
  const canCreate =
    !!session && (canDirectCreate(session.level) || canSubmitForApproval(session.level));
  const canEditThis = (e: AriesEvent) => {
    if (!session) return false;
    if (isLeadership(session.level)) return true;
    if (session.level === "coordinator" || session.level === "executive") {
      return slugOnEvent(e, session.memberSlug);
    }
    return false;
  };
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Events");
  const [sortAsc, setSortAsc] = useState(true);
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [past, setPast] = useState(initialPast);
  const [editing, setEditing] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setUpcoming(initialUpcoming);
    setPast(initialPast);
  }, [initialUpcoming, initialPast]);

  const all = useMemo(() => [...upcoming, ...past], [upcoming, past]);
  const selected = editing ? all.find((e) => e.slug === editing) : undefined;

  const filteredUpcoming = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = upcoming.filter((e) => tabMatches(tab, e) && matchesQuery(e, q));
    return sortAsc ? list : [...list].reverse();
  }, [upcoming, tab, sortAsc, query]);
  const filteredPast = useMemo(() => {
    const q = query.trim().toLowerCase();
    return past.filter((e) => tabMatches(tab, e) && matchesQuery(e, q));
  }, [past, tab, query]);

  const openNew = () => {
    setEditing("");
    setFormKey((k) => k + 1);
  };

  const openEdit = (slug: string) => {
    setEditing(slug);
    setFormKey((k) => k + 1);
  };

  const upsertLocal = (event: AriesEvent) => {
    const nextUp = upcoming.filter((e) => e.slug !== event.slug);
    const nextPast = past.filter((e) => e.slug !== event.slug);
    if (isUpcoming(event)) {
      setUpcoming([...nextUp, event]);
      setPast(nextPast);
    } else {
      setPast([...nextPast, event]);
      setUpcoming(nextUp);
    }
  };

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
        {canCreate && (
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white"
          >
            <Plus size={14} /> New event
          </button>
        )}
        {!session && (
          <Link href="/admin" className="text-xs font-bold text-purple hover:underline">
            Sign in to create / edit events
          </Link>
        )}
      </div>

      {editing !== null && canCreate && (
        <div className="mt-6 rounded-2xl border border-purple/20 bg-white/90 p-4 shadow-card-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">
              {editing === "" ? "Create event" : `Edit · ${editing}`}
            </p>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs font-semibold text-ink/50 hover:text-ink"
            >
              Close
            </button>
          </div>
          <EventForm
            key={`${editing || "new"}-${formKey}`}
            initial={
              selected
                ? { ...selected, calendar: selected.links?.[0]?.url, video: selected.video }
                : undefined
            }
            onSaved={(event, mode) => {
              if (mode === "direct") upsertLocal(event);
              setEditing(null);
              setFormKey((k) => k + 1);
              router.refresh();
            }}
            onDeleted={(slug, mode) => {
              if (mode === "direct") {
                setUpcoming((prev) => prev.filter((e) => e.slug !== slug));
                setPast((prev) => prev.filter((e) => e.slug !== slug));
              }
              setEditing(null);
              setFormKey((k) => k + 1);
              router.refresh();
            }}
          />
        </div>
      )}

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
              {t === tab && (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded bg-[#07122d]" />
              )}
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
            No upcoming {tab === "All Events" ? "events" : tab.toLowerCase()} right now — check back
            soon or subscribe to the calendar below.
          </div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredUpcoming.map((e) => (
              <div key={e.slug} className="relative">
                <EventCard event={e} />
                {canEditThis(e) && (
                  <button
                    type="button"
                    onClick={() => openEdit(e.slug)}
                    className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#f4ecfb] px-6 py-4">
          <p className="text-sm text-[#081634]">
            <span className="font-bold">Don&rsquo;t miss out on any updates!</span> Subscribe to our
            calendar and stay in the loop.
          </p>
          <a
            href="#"
            className="flex items-center gap-2 rounded-full bg-navy-2 px-5 py-2.5 text-sm font-bold text-white shadow-cta"
          >
            <CalendarPlus size={16} /> Add to Calendar
          </a>
        </div>
      </section>

      <section className="mt-14 pb-20">
        <h2 className="text-base font-bold text-[#081634]">Past Events</h2>
        {filteredPast.length === 0 ? (
          <p className="mt-5 text-sm text-[#5b5e82]">No past events in this category yet.</p>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredPast.map((e) => (
              <div key={e.slug} className="relative">
                <EventCard event={e} variant="past" />
                {canEditThis(e) && (
                  <button
                    type="button"
                    onClick={() => openEdit(e.slug)}
                    className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
