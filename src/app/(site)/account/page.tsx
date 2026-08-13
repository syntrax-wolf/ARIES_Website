import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllMembers, getEvents, getProjects, getResources } from "@/lib/content";
import { AccountSection } from "frontend/pages/account/AccountSection";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [members, projects, events, resources] = await Promise.all([
    getAllMembers(),
    getProjects(),
    getEvents(),
    getResources(),
  ]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(175deg,#c4b2ee_0%,#b5a0ea_35%,#cabcee_70%,#b9a6ea_100%)]">
      <div className="mx-auto max-w-[1100px] px-6 py-12 md:px-10">
        <h1 className="text-3xl font-black text-[#140b3c]">Account</h1>
        <p className="mt-2 text-sm text-[#31217a]/70">
          Manage your public profile, send join requests, and review incoming requests. Finances and
          more will land here later.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-[#31217a]/70">Loading…</p>}>
            <AccountSection
              members={members}
              projects={projects}
              events={events}
              resources={resources}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
