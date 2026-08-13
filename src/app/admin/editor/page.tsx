import type { Metadata } from "next";
import { getEvents, getAllMembers, getProjects, getResources, getTeam } from "@/lib/content";
import { AdminTabs } from "frontend/pages/admin/AdminTabs";

export const metadata: Metadata = { title: "Editor" };

export default async function AdminEditorPage() {
  const [members, projects, events, resources, team] = await Promise.all([
    getAllMembers(),
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
          Add or edit members, projects, events and resources. Leadership (OC / Co-OC / Research Lead)
          can also manage alumni and full team photos. New images upload to Supabase Storage; existing{" "}
          <code className="text-xs">/images/</code> paths still work.
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
