"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canManageTeamContent } from "@/lib/roles";

type Mode = "login" | "signup";

function afterLoginPathFor(level: string | undefined) {
  if (level === "blogger" || canManageTeamContent(level)) return "/admin/editor";
  return "/account";
}

/**
 * Member login + signup. Bootstrap CMS: sign in with username `admin` + password.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [entryNumber, setEntryNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
          <div className="mb-6 flex gap-1 rounded-full bg-white p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 rounded-full py-2 text-[11px] font-bold ${mode === "login" ? "bg-navy text-white" : "text-ink/60"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 rounded-full py-2 text-[11px] font-bold ${mode === "signup" ? "bg-navy text-white" : "text-ink/60"}`}
            >
              Sign up
            </button>
          </div>

          <h1 className="text-center text-2xl font-black text-ink">
            {mode === "login" ? "Member Login" : "Create account"}
          </h1>
          <p className="mt-2 text-center text-xs leading-5 text-ink/55">
            {mode === "login"
              ? "Kerberos ID or username + password."
              : "Enter your secret code, Kerberos ID, and password."}
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setSubmitting(true);
              try {
                if (mode === "signup") {
                  const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      secret,
                      kerberos: entryNumber.trim(),
                      password,
                      confirmPassword,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? "Signup failed");
                  if (data.ok && !data.message?.includes("sign in")) {
                    window.location.href = "/account";
                    return;
                  }
                  setMode("login");
                  setError(null);
                  alert(data.message ?? "Account created — please sign in.");
                } else {
                  const data = await signIn(entryNumber.trim(), password);
                  router.push(afterLoginPathFor(data.level));
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "You're not a member");
              } finally {
                setSubmitting(false);
              }
            }}
            className="mt-6"
          >
            {mode === "signup" && (
              <label className="block">
                <span className="text-xs font-semibold text-ink">Secret code</span>
                <input
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/35"
                  autoComplete="off"
                  required
                />
              </label>
            )}

            <label className={`block ${mode === "signup" ? "mt-4" : ""}`}>
              <span className="text-xs font-semibold text-ink">
                {mode === "signup" ? "Kerberos ID" : "Kerberos / username"}
              </span>
              <input
                value={entryNumber}
                onChange={(e) => setEntryNumber(e.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/35"
                placeholder={mode === "signup" ? "mt1251690" : "kerberos or username"}
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
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
              />
            </label>

            {mode === "signup" && (
              <label className="mt-4 block">
                <span className="text-xs font-semibold text-ink">Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/35"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3.5 text-sm font-bold text-white transition hover:bg-purple disabled:opacity-60"
            >
              {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
              {submitting
                ? mode === "signup"
                  ? "Creating…"
                  : "Signing in…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
