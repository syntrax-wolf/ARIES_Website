import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEvents, getAllMembers, getProjects, getResources, getTeam } from "@/lib/content";
import { getRosterMembers } from "@/lib/roster";
import { AdminTabs } from "frontend/pages/admin/AdminTabs";
import { getSessionInfo } from "@/lib/auth-session";
import { canAccessEditor, isLeadership } from "@/lib/roles";

export const metadata: Metadata = { title: "Editor" };
export const dynamic = "force-dynamic";

export default async function AdminEditorPage() {
  const session = await getSessionInfo();
  if (!session) redirect("/admin");
  if (!canAccessEditor(session.level)) redirect("/account");

  const leadership = isLeadership(session.level);
  const [members, projects, events, resources, team] = await Promise.all([
    leadership ? getRosterMembers() : getAllMembers(),
    getProjects(),
    getEvents(),
    getResources(),
    getTeam(),
  ]);

  return (
    <div className="min-h-screen bg-[#f4eff9]">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10">
        <h1 className="text-2xl font-black text-ink">Content editor</h1>
        <p className="mt-2 text-sm text-ink/60">
          Add or edit projects, events and resources. Leadership can manage the roster, alumni, and
          team photos. Members edit their own public profile — never someone else&rsquo;s.
        </p>
        <div className="mt-8">
          <AdminTabs
            members={members}
            projects={projects}
            events={events}
            resources={resources}
            team={team}
          />
        </div>
      </div>
    </div>
  );
}
