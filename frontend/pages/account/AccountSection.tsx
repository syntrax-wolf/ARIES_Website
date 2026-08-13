"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import type { AriesEvent, Member, Project, Resource } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { canManageTeamContent, isLeadership } from "@/lib/roles";
import { isCoreTeam } from "@/lib/entity-access";
import { ProfileEditor } from "frontend/pages/admin/ProfileEditor";
import { RequestPanels } from "frontend/pages/account/RequestPanels";

export function AccountSection({
  members,
  projects,
  events,
  resources,
}: {
  members: Member[];
  projects: Project[];
  events: AriesEvent[];
  resources: Resource[];
}) {
  const { session, loading } = useAuth();
  const showTeamEditor = canManageTeamContent(session?.level);
  const canReview = isLeadership(session?.level) || isCoreTeam(session?.level) || session?.level === "coordinator";

  const member = useMemo(
    () => members.find((m) => m.slug === session?.memberSlug) ?? null,
    [members, session?.memberSlug],
  );

  if (loading) {
    return <p className="text-sm text-[#31217a]/70">Loading…</p>;
  }
  if (!session) {
    return (
      <p className="rounded-2xl bg-white/70 px-5 py-4 text-sm text-[#31217a]">
        Please <a className="font-bold text-purple underline" href="/admin">sign in</a> to open your
        account.
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

      {member ? (
        <div className="rounded-3xl bg-white/85 p-4 shadow-[0_18px_40px_rgba(35,24,100,0.12)] backdrop-blur md:p-6">
          <ProfileEditor member={member} />
        </div>
      ) : (
        <p className="rounded-2xl bg-white/70 px-5 py-4 text-sm text-[#31217a]">
          No profile is linked to this login yet. Sign up with your Kerberos ID after your IITD mail
          is on the roster.
        </p>
      )}

      <RequestPanels
        memberSlug={session.memberSlug}
        projects={projects}
        events={events}
        resources={resources}
        canReview={!!canReview}
      />
    </div>
  );
}
