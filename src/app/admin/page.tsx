"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canAccessEditor } from "@/lib/roles";

function afterLoginPathFor(level: string | undefined) {
  if (canAccessEditor(level) && (level === "blogger" || level === "oc" || level === "co_overall_coordinator" || level === "research_lead")) {
    return "/admin/editor";
  }
  return "/account";
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, session, loading } = useAuth();
  const [entryNumber, setEntryNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [submitting, setSubmitting] = useState(false);
  const [showStaff, setShowStaff] = useState(false);

  const afterLoginPath = afterLoginPathFor(session?.level);

  useEffect(() => {
    if (!loading && session) router.replace(afterLoginPath);
  }, [loading, session, router, afterLoginPath]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0b1035] px-6">
      <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-purple/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-sky/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 text-white/90">
          <Image
            src="/images/brand/logo-white.svg"
            alt="ARIES"
            width={40}
            height={48}
            className="h-12 w-auto"
          />
          <span className="text-sm font-bold tracking-[0.2em]">ARIES · IIT DELHI</span>
        </Link>

        <div className="rounded-3xl bg-[#fbf4ec] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <h1 className="text-center text-2xl font-black text-ink">Member Login</h1>
          <p className="mt-2 text-center text-xs leading-5 text-ink/55">
            Sign in with your IIT Delhi account (DevClub). Club role still comes from the ARIES roster.
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
            {showStaff ? "Hide staff login" : "Staff login (blogger / dual-run)"}
          </button>

          {showStaff && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setSubmitting(true);
                try {
                  const data = await signIn(entryNumber.trim(), password);
                  router.push(afterLoginPathFor(data.level));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "You're not a member");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="mt-4"
            >
              <label className="block">
                <span className="text-xs font-semibold text-ink">Username</span>
                <input
                  value={entryNumber}
                  onChange={(e) => setEntryNumber(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/35"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="mt-4 block">
                <span className="text-xs font-semibold text-ink">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/35"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink/80 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                <LogIn size={16} />
                {submitting ? "Signing in…" : "Staff sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
