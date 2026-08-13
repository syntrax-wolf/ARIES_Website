"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Inbox, Send, X } from "lucide-react";
import type { AriesEvent, Project, Resource } from "@/lib/types";
import { slugOnEvent, slugOnProject, slugOnResource } from "@/lib/entity-access";

type ChangeRequest = {
  id: string;
  entity_type: string;
  entity_slug: string;
  payload: Record<string, unknown>;
  submitted_by: string;
  created_at: string;
};

function labelFor(r: ChangeRequest) {
  const kind = String(r.payload?.__kind || "edit");
  if (kind === "join") return `Join ${r.entity_type} · ${r.entity_slug}`;
  if (r.payload?.__delete) return `Delete ${r.entity_type} · ${r.entity_slug}`;
  return `${kind} ${r.entity_type} · ${r.entity_slug}`;
}

export function RequestPanels({
  memberSlug,
  projects,
  events,
  resources,
  canReview,
}: {
  memberSlug: string;
  projects: Project[];
  events: AriesEvent[];
  resources: Resource[];
  canReview: boolean;
}) {
  const [mine, setMine] = useState<ChangeRequest[]>([]);
  const [inbox, setInbox] = useState<ChangeRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [joinType, setJoinType] = useState<"project" | "event" | "resource">("project");
  const [joinSlug, setJoinSlug] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/requests", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setMine(data.mine ?? []);
      setInbox(data.inbox ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const joinOptions = useMemo(() => {
    if (joinType === "project") {
      return projects
        .filter((p) => !slugOnProject(p, memberSlug))
        .map((p) => ({ slug: p.slug, label: p.name }));
    }
    if (joinType === "event") {
      return events
        .filter((e) => !slugOnEvent(e, memberSlug))
        .map((e) => ({ slug: e.slug, label: e.title }));
    }
    return resources
      .filter((r) => !r._sanity && !slugOnResource(r, memberSlug))
      .map((r) => ({ slug: r.slug, label: r.title }));
  }, [joinType, projects, events, resources, memberSlug]);

  const sendJoin = async () => {
    if (!joinSlug) return;
    setBusy("join");
    setError(null);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", entityType: joinType, entitySlug: joinSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send");
      setJoinSlug("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send");
    } finally {
      setBusy(null);
    }
  };

  const review = async (requestId: string, approve: boolean) => {
    setBusy(requestId);
    setError(null);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", requestId, approve }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Review failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {error && (
        <p className="lg:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-2xl bg-white/85 p-6 shadow-card-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Send size={16} /> Send request
        </h2>
        <p className="mt-1 text-xs text-ink/55">
          Ask to be added as a contributor. Executives who are not listed on a project, event, or
          resource cannot edit it until this is approved.
        </p>
        <div className="mt-4 space-y-3">
          <select
            value={joinType}
            onChange={(e) => {
              setJoinType(e.target.value as typeof joinType);
              setJoinSlug("");
            }}
            className="w-full rounded-lg bg-[#f3eef8] px-3 py-2.5 text-sm"
          >
            <option value="project">Project</option>
            <option value="event">Event</option>
            <option value="resource">Resource</option>
          </select>
          <select
            value={joinSlug}
            onChange={(e) => setJoinSlug(e.target.value)}
            className="w-full rounded-lg bg-[#f3eef8] px-3 py-2.5 text-sm"
          >
            <option value="">— pick one —</option>
            {joinOptions.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!joinSlug || busy === "join"}
            onClick={() => void sendJoin()}
            className="rounded-lg bg-purple px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy === "join" ? "Sending…" : "Request to join"}
          </button>
        </div>
        {mine.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-ink/5 pt-4">
            {mine.map((r) => (
              <li key={r.id} className="text-xs text-ink/70">
                Pending: {labelFor(r)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white/85 p-6 shadow-card-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Inbox size={16} /> Review requests
        </h2>
        <p className="mt-1 text-xs text-ink/55">
          Core team sees every request. Coordinators listed on an item also see requests for that
          item. One approve or reject is final — the other copy is deleted.
        </p>
        {!canReview && inbox.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">Nothing waiting on you.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {inbox.length === 0 && <li className="text-sm text-ink/50">No pending requests.</li>}
            {inbox.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/5 bg-[#f8f4fc] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-ink">{labelFor(r)}</p>
                  <p className="text-xs text-ink/55">
                    by {r.submitted_by}
                    {r.payload?.name ? ` (${String(r.payload.name)})` : ""} ·{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => void review(r.id, true)}
                    className="flex items-center gap-1 rounded-lg bg-purple px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => void review(r.id, false)}
                    className="flex items-center gap-1 rounded-lg bg-lilac px-3 py-1.5 text-xs font-bold text-ink"
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
