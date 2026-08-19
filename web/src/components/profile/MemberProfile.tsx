import { Download, GraduationCap, MapPin } from "lucide-react";
import type { AriesEvent, Member, Project, Resource } from "../../../../src/lib/types";
import { BlockGrid } from "./BlockGrid";
import { BackToSource } from "./BackToSource";
import { SocialLinksDisplay } from "./SocialLinks";
import { initialsOf } from "../team/PersonCard";

export function MemberProfile({
  member,
  projectNames,
  contributions,
}: {
  member: Member;
  projectNames: Record<string, string>;
  contributions?: {
    projects: Project[];
    events: AriesEvent[];
    resources: Resource[];
  };
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#efe9f7_0%,#e8def6_40%,#f8f1e7_41%,#fbf4ec_100%)] pt-24">
      <div className="mx-auto max-w-[1100px] px-6 pb-20 md:px-12">
        <div className="pt-6">
          <BackToSource projectNames={projectNames} />
        </div>

        <section className="grid items-center gap-10 pt-12 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-[#31217a]">Hello, I&rsquo;m</p>
            <h1 className="mt-2 text-4xl font-black text-[#140b3c] md:text-5xl">{member.name}</h1>
            {member.role && <p className="mt-3 text-lg font-bold text-purple-2">{member.role}</p>}
            {member.tagline && (
              <p className="mt-4 max-w-md text-[15px] leading-7 text-[#2c2359]">{member.tagline}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#2c2359]">
              {member.year && (
                <span className="flex items-center gap-2">
                  <GraduationCap size={16} /> {member.year}
                </span>
              )}
              {member.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={16} /> {member.location}
                </span>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {member.resumeUrl && (
                <a
                  href={member.resumeUrl}
                  className="flex items-center gap-2 rounded-full bg-navy-2 px-6 py-2.5 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
                >
                  Resume <Download size={15} />
                </a>
              )}
              <SocialLinksDisplay socials={member.socials} />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[224px]">
            <div className="relative mx-auto grid size-48 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_30%,#7a50ff,#4711d9)] shadow-[0px_30px_60px_rgba(40,20,120,0.35)] md:size-56">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="absolute inset-0 size-full rounded-full object-cover"
                />
              ) : (
                <span className="text-6xl font-black text-white">{initialsOf(member.name)}</span>
              )}
            </div>
            <span className="absolute -right-2 top-4 size-10 rounded-full border-2 border-white/50" />
          </div>
        </section>

        <div className="mt-12 space-y-8">
          <BlockGrid blocks={member.blocks ?? []} />

          {contributions && (
            <section className="rounded-2xl bg-white/95 p-6 shadow-card-sm md:p-7">
              <h3 className="text-[15px] font-bold text-ink">Contributions</h3>
              <p className="mt-1 text-xs text-ink/55">
                Projects, events, and resources this person is listed on.
              </p>
              <div className="mt-5 grid gap-6 md:grid-cols-3">
                <ContributionColumn
                  title="Projects"
                  empty="No projects listed yet."
                  items={contributions.projects.map((p) => ({
                    href: `/projects/${p.slug}`,
                    label: p.name,
                  }))}
                />
                <ContributionColumn
                  title="Events"
                  empty="No events listed yet."
                  items={contributions.events.map((e) => ({
                    href: `/events/${e.slug}`,
                    label: e.title,
                  }))}
                />
                <ContributionColumn
                  title="Resources"
                  empty="No resources listed yet."
                  items={contributions.resources.map((r) => ({
                    href: `/resources/${r.slug}`,
                    label: r.title,
                  }))}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function ContributionColumn({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-ink/50">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-ink/50">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-sm font-semibold text-purple hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
