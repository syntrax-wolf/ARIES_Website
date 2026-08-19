import { useCallback, useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Input } from "./ProjectForm";

export function AllowlistForm() {
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/allowlist", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load Allowlist");
      return;
    }
    setIds(data.allowlist ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const kerberos = String(new FormData(e.currentTarget).get("kerberos") ?? "").trim();
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/admin/allowlist", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", kerberos }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Add failed");
    else {
      setIds(data.allowlist ?? []);
      e.currentTarget.reset();
    }
    setStatus("idle");
  };

  const remove = async (kerberos: string) => {
    const res = await fetch("/api/admin/allowlist", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", kerberos }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Remove failed");
    else setIds(data.allowlist ?? []);
  };

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">Allowlist</h2>
      <p className="text-xs text-ink/55">
        Only these Kerberos ids may pass the Gate. An empty list means Admin password only.
      </p>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input name="kerberos" label="Kerberos" placeholder="cs1230001" required />
        </div>
        <button
          disabled={status === "saving"}
          className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white"
        >
          <Save size={15} /> Add
        </button>
      </form>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <ul className="space-y-2">
        {ids.length === 0 && <li className="text-sm text-ink/50">Empty — Admin only.</li>}
        {ids.map((id) => (
          <li key={id} className="flex items-center justify-between rounded-lg bg-[#f8f4fc] px-3 py-2 text-sm">
            <span className="font-semibold">{id}</span>
            <button type="button" onClick={() => void remove(id)} className="text-red-600">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
