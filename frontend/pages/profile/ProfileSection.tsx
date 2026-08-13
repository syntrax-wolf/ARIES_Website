"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import type { Member } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { canApprove, canManageTeamContent } from "@/lib/roles";
import { ProfileEditor } from "frontend/pages/admin/ProfileEditor";
import { ApprovalsPanel } from "frontend/pages/admin/ApprovalsPanel";
import { ChangePasswordForm } from "frontend/pages/profile/ChangePasswordForm";
import { cn } from "@/lib/utils";

export function ProfileSection({ members }: { members: Member[] }) {
  const router = useRouter();
  const { session, loading, refreshSession } = useAuth();
  const params = useSearchParams();
  const showApprovals = canApprove(session?.level);
  const showTeamEditor = canManageTeamContent(session?.level);
  const initialTab =
    params.get("tab") === "approvals" && showApprovals ? "approvals" : "profile";
  const [tab, setTab] = useState<"profile" | "approvals">(initialTab);
  const [localMembers, setLocalMembers] = useState(members);

  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  const member = useMemo(
    () => localMembers.find((m) => m.slug === session?.memberSlug) ?? null,
    [localMembers, session?.memberSlug],
  );

  if (loading) {
    return <p className="text-sm text-[#31217a]/70">Loading…</p>;
  }
  if (!session) {
    return (
      <p className="rounded-2xl bg-white/70 px-5 py-4 text-sm text-[#31217a]">
        Please <a className="font-bold text-purple underline" href="/admin">sign in</a> to edit your
        profile.
      </p>
    );
  }

  return (
    <div>
      {showTeamEditor && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 px-5 py-4 shadow-[0_12px_28px_rgba(35,24,100,0.1)]">
          <div>
            <p className="text-sm font-bold text-[#140b3c]">Team photos &amp; alumni</p>
            <p className="mt-0.5 text-xs text-[#31217a]/70">
              Upload full-team images and add or edit alumni profiles (OC / Co-OC / Research Lead).
            </p>
          </div>
          <Link
            href="/admin/editor"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#140b3c] px-4 py-2.5 text-xs font-bold text-white"
          >
            Open content editor <ExternalLink size={12} />
          </Link>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("profile")}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-bold",
            tab === "profile" ? "bg-[#140b3c] text-white" : "bg-white/70 text-[#140b3c]",
          )}
        >
          My profile
        </button>
        {showApprovals && (
          <button
            type="button"
            onClick={() => setTab("approvals")}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-bold",
              tab === "approvals" ? "bg-[#140b3c] text-white" : "bg-white/70 text-[#140b3c]",
            )}
          >
            Approvals
          </button>
        )}
        {showTeamEditor && (
          <Link
            href="/admin/editor"
            className="rounded-full bg-white/70 px-5 py-2.5 text-sm font-bold text-[#140b3c] hover:bg-white"
          >
            Content editor
          </Link>
        )}
      </div>

      {tab === "profile" && member && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white/85 p-4 shadow-[0_18px_40px_rgba(35,24,100,0.12)] backdrop-blur md:p-6">
            <ProfileEditor
              member={member}
              onSaved={(updated) => {
                setLocalMembers((prev) =>
                  prev.map((m) => (m.slug === updated.slug ? updated : m)),
                );
                void refreshSession();
                router.refresh();
              }}
            />
          </div>
          <ChangePasswordForm />
        </div>
      )}
      {tab === "profile" && !member && (
        <div className="space-y-6">
          <p className="rounded-2xl bg-white/70 px-5 py-4 text-sm text-[#31217a]">
            No profile is linked to this login yet. Sign up with your Kerberos ID after your IITD mail
            is on the roster.
          </p>
          <ChangePasswordForm />
        </div>
      )}
      {tab === "approvals" && showApprovals && (
        <div className="rounded-3xl bg-white/85 p-4 shadow-[0_18px_40px_rgba(35,24,100,0.12)] backdrop-blur md:p-6">
          <p className="mb-4 text-sm text-[#31217a]/75">
            Review executive submissions. Approving applies the change immediately.
          </p>
          <ApprovalsPanel />
        </div>
      )}
    </div>
  );
}
