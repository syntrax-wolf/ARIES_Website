import {
  Wrench,
  Trophy,
  FolderKanban,
  BookOpen,
  Sparkles,
  Briefcase,
  FlaskConical,
  FileText,
  ExternalLink,
} from "lucide-react";
import type {
  Achievement,
  CourseworkItem,
  InternshipItem,
  ProfileBlock,
  ProfileProject,
} from "../../lib/types";
import { Tag } from "../ui/Tag";

export function ProfileBlockView({ block }: { block: ProfileBlock }) {
  switch (block.type) {
    case "tools":
      return (
        <Card icon={<Wrench size={15} />} title={block.title ?? "Tools"}>
          <div className="flex flex-wrap gap-2">
            {(block.data as string[]).map((t) => (
              <Tag key={t} className="border border-[#e6def5] bg-white px-4 py-1.5 text-[13px]">
                {t}
              </Tag>
            ))}
          </div>
        </Card>
      );
    case "achievements":
      return (
        <Card icon={<Trophy size={15} />} title={block.title ?? "Achievements"}>
          <ol className="relative ml-2 space-y-7 border-l border-[#e3daf3] pl-6">
            {(block.data as Achievement[]).map((a) => (
              <li key={a.title + a.year} className="relative">
                <span className="absolute -left-[31px] top-0.5 grid size-3 place-items-center rounded-full bg-purple" />
                <span className="inline-block rounded bg-lilac px-2 py-0.5 text-[11px] font-bold text-purple">
                  {a.year}
                </span>
                <h4 className="mt-1.5 text-sm font-bold text-ink">{a.title}</h4>
                <p className="text-xs text-ink/50">{a.org}</p>
                <p className="mt-1 text-[13px] leading-6 text-ink/75">{a.description}</p>
              </li>
            ))}
          </ol>
        </Card>
      );
    case "projects":
      return (
        <Card icon={<FolderKanban size={15} />} title={block.title ?? "Projects"}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {(block.data as ProfileProject[]).map((p) => (
              <article
                key={p.name}
                className="flex flex-col overflow-hidden rounded-xl border border-[#eee8f8] bg-white shadow-card-sm"
              >
                <div className="h-24 bg-[linear-gradient(135deg,#191249,#2b1e6b)]" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h4 className="text-sm font-bold text-ink">{p.name}</h4>
                  <p className="text-xs leading-5 text-ink/70">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.tags.map((t) => (
                      <Tag key={t} className="px-2.5 py-0.5 text-[11px]">
                        {t}
                      </Tag>
                    ))}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3 pt-2">
                    {p.links.map((l) => (
                      <a
                        key={l.label}
                        href={l.url}
                        className="flex items-center gap-1 text-xs font-semibold text-purple hover:underline"
                      >
                        <ExternalLink size={11} /> {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Card>
      );
    case "coursework":
      return (
        <Card icon={<BookOpen size={15} />} title={block.title ?? "Coursework"}>
          <ul className="divide-y divide-[#f1ecf9]">
            {(block.data as CourseworkItem[]).map((c) => (
              <li key={c.name} className="grid gap-1 py-3 md:grid-cols-[220px_1fr] md:gap-6">
                <span className="text-sm font-bold text-ink">{c.name}</span>
                <span className="text-[13px] leading-6 text-ink/70">{c.topics}</span>
              </li>
            ))}
          </ul>
        </Card>
      );
    case "hobbies":
      return (
        <Card icon={<Sparkles size={15} />} title={block.title ?? "Hobbies & Interests"}>
          <div className="flex flex-wrap gap-2">
            {(block.data as string[]).map((h) => (
              <Tag key={h} className="border border-[#e6def5] bg-white px-4 py-1.5 text-[13px]">
                {h}
              </Tag>
            ))}
          </div>
        </Card>
      );
    case "internships":
      return (
        <Card icon={<Briefcase size={15} />} title={block.title ?? "Internships"}>
          <ul className="divide-y divide-[#f1ecf9]">
            {(block.data as InternshipItem[]).map((it) => (
              <li key={it.role} className="grid gap-1 py-3 md:grid-cols-[220px_1fr] md:gap-6">
                <span className="text-sm font-bold text-ink">
                  {it.role}
                  {it.org && <span className="block text-xs font-normal text-ink/50">{it.org}</span>}
                </span>
                <span className="text-[13px] leading-6 text-ink/70">{it.description}</span>
              </li>
            ))}
          </ul>
        </Card>
      );
    case "research":
      return (
        <Card icon={<FlaskConical size={15} />} title={block.title ?? "Research Interests"}>
          <div className="space-y-4 text-[13px] leading-6 text-ink/75">
            {(block.data as string).split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Card>
      );
    case "text":
      return (
        <Card icon={<FileText size={15} />} title={block.title ?? "About"}>
          <div className="space-y-4 text-[13px] leading-6 text-ink/75">
            {(block.data as string).split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Card>
      );
    default:
      return null;
  }
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/95 p-6 shadow-card-sm md:p-7">
      <h3 className="flex items-center gap-2.5 text-[15px] font-bold text-ink">
        <span className="grid size-7 place-items-center rounded-md bg-lilac text-purple">{icon}</span>
        {title}
      </h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}
