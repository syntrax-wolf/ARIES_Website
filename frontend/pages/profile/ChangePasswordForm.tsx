"use client";

import { useState } from "react";
import { KeyRound, Save } from "lucide-react";
import { clubEmail } from "@/config/socials";

/** Change password form — current + new + confirm, with admin contact note. */
export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMsg(null);
    setStatus("idle");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(body.error ?? `Failed (${res.status})`);
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }
      setStatus("saved");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setStatus("idle");
        setOpen(false);
      }, 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to change password");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (!open) {
    return (
      <div className="rounded-2xl border border-[#e8dfd2] bg-white/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink">Password</p>
            <p className="mt-1 text-xs text-ink/55">
              Update the password you use to sign in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-purple"
          >
            <KeyRound size={15} />
            Change password
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-ink/55">
          Forgot your password? Contact admin at{" "}
          <a className="font-semibold text-purple underline" href={`mailto:${clubEmail}`}>
            {clubEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-4 rounded-2xl border border-[#e8dfd2] bg-white/80 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-ink">Change password</h3>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="text-xs font-semibold text-ink/50 hover:text-ink"
        >
          Cancel
        </button>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-ink">Current password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-ink">New password</span>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-ink">Confirm new password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save size={15} />
          {status === "saving"
            ? "Updating…"
            : status === "saved"
              ? "Updated ✓"
              : status === "error"
                ? "Failed"
                : "Update password"}
        </button>
      </div>

      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}

      <p className="text-xs leading-5 text-ink/55">
        Forgot your password? Contact admin at{" "}
        <a className="font-semibold text-purple underline" href={`mailto:${clubEmail}`}>
          {clubEmail}
        </a>
        .
      </p>
    </form>
  );
}
