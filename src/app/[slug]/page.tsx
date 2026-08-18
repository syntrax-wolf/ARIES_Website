import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getEvents, getMember, getMembers, getProjects, getResources } from "@/lib/content";
import { isVisitor } from "@/lib/supabase/env";
import { slugOnEvent, slugOnProject, slugOnResource } from "@/lib/entity-access";
import { EditableMemberProfile } from "frontend/shared/profile/EditableMemberProfile";

export const revalidate = 60;

export async function generateStaticParams() {
  const members = await getMembers();
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMember(slug);
  return { title: m ? m.name : "Profile" };
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await getMember(slug);
  if (!member || isVisitor(member.level)) notFound();

  const [projects, events, resources] = await Promise.all([
    getProjects(),
    getEvents(),
    getResources(),
  ]);
  const projectNames = Object.fromEntries(projects.map((p) => [p.slug, p.name]));
  const contributions = {
    projects: projects.filter((p) => slugOnProject(p, member.slug)),
    events: events.filter((e) => slugOnEvent(e, member.slug)),
    resources: resources.filter((r) => slugOnResource(r, member.slug)),
  };

  return (
    <Suspense>
      <EditableMemberProfile
        member={member}
        projectNames={projectNames}
        contributions={contributions}
      />
    </Suspense>
  );
}
