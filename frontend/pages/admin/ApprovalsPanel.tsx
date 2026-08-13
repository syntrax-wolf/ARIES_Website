"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardList, X } from "lucide-react";

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

export function ApprovalsPanel() {
  const router = useRouter();
  const [inbox, setInbox] = useState<ChangeRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/requests", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setInbox(data.inbox ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (requestId: string, approve: boolean) => {
    setBusy(requestId);
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
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-card-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <ClipboardList size={16} /> Pending requests
        </h2>
        <p className="mt-1 text-xs text-ink/55">
          One approve or reject is final. The other copy is deleted — nothing is archived.
        </p>
        <ul className="mt-4 space-y-3">
          {inbox.length === 0 && (
            <li className="text-sm text-ink/50">No pending requests.</li>
          )}
          {inbox.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/5 bg-[#f8f4fc] px-4 py-3"
            >
              <div>
                <p className="text-sm font-bold text-ink">{labelFor(r)}</p>
                <p className="text-xs text-ink/55">
                  by {r.submitted_by} · {new Date(r.created_at).toLocaleString()}
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
      </section>
    </div>
  );
}
