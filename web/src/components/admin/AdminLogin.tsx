import { useState } from "react";
import { LogIn } from "lucide-react";

export function AdminLogin() {
  const [showStaff, setShowStaff] = useState(false);
  const [entryNumber, setEntryNumber] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error");
  });
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0b1035] px-6">
      <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-purple/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-sky/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <a href="/" className="mb-8 flex items-center justify-center gap-3 text-white/90">
          <img src="/images/brand/logo-white.svg" alt="" width={40} height={48} className="h-12 w-auto" />
          <span className="text-sm font-bold tracking-[0.2em]">ARIES · IIT DELHI</span>
        </a>

        <div className="rounded-3xl bg-[#fbf4ec] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <h1 className="text-center text-2xl font-black text-ink">Member Login</h1>
          <p className="mt-2 text-center text-xs leading-5 text-ink/55">
            Sign in with your IIT Delhi account (DevClub). Only Kerberos IDs on the Allowlist receive a
            Session.
          </p>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <a
            href="/api/auth/devclub"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3.5 text-sm font-bold text-white transition hover:bg-purple"
          >
            Sign in with IIT Delhi
          </a>

          <button
            type="button"
            onClick={() => setShowStaff((v) => !v)}
            className="mt-4 w-full text-center text-[11px] font-semibold text-ink/45 hover:text-ink/70"
          >
            {showStaff ? "Hide Admin login" : "Admin password login"}
          </button>

          {showStaff && (
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setError(null);
                const res = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ entryNumber, password }),
                });
                const body = await res.json().catch(() => ({}));
                setSubmitting(false);
                if (!res.ok) {
                  setError(String(body.error ?? "Could not sign in"));
                  return;
                }
                window.location.href = "/account";
              }}
            >
              <input
                value={entryNumber}
                onChange={(e) => setEntryNumber(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl bg-white px-4 py-3 text-sm text-ink outline-none ring-1 ring-[#e3dacb] focus:ring-2 focus:ring-purple/40"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full rounded-xl bg-white px-4 py-3 text-sm text-ink outline-none ring-1 ring-[#e3dacb] focus:ring-2 focus:ring-purple/40"
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple px-6 py-3 text-sm font-bold text-white"
              >
                <LogIn size={16} /> {submitting ? "Signing in…" : "Sign in as Admin"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
