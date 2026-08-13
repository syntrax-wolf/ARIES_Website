import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getMember, getMembers, getProjects } from "@/lib/content";
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
  if (!member) notFound();

  const projects = await getProjects();
  const projectNames = Object.fromEntries(projects.map((p) => [p.slug, p.name]));

  return (
    <Suspense>
      <EditableMemberProfile member={member} projectNames={projectNames} />
    </Suspense>
  );
}
