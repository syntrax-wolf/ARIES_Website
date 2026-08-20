import type { Project } from "../../lib/types";
import { CategoryBadge } from "../ui/CategoryBadge";
import { Tag } from "../ui/Tag";

function contributorLabel(c: string | { name?: string; slug?: string }): string {
  if (typeof c === "string") return c;
  return c.name?.trim() || c.slug || "Unknown";
}

export function ProjectCard({ project }: { project: Project }) {
  const contributors = project.contributors ?? [];
  return (
    <a
      href={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#d9d1c0] bg-white transition-transform hover:-translate-y-1 hover:shadow-card"
    >
      <div
        className="relative h-48 shrink-0"
        style={
          project.image
            ? undefined
            : {
                backgroundImage:
                  "radial-gradient(260px 200px at 20% 85%, rgba(125,91,184,1), transparent 55%), linear-gradient(90deg, #080d24, #10172b)",
              }
        }
      >
        {project.image ? (
          <img src={project.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-end p-4">
            <span className="rounded-md bg-[#fffaf4]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#081634]">
              {project.category || "Project"}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        <div>
          <CategoryBadge label={project.category} />
        </div>
        <h3 className="text-base font-semibold text-[#11154a]">
          {project.name}
          {project.accent ? ` ${project.accent}` : ""}
        </h3>
        {contributors.length > 0 && (
          <p className="text-xs italic text-[#8a8daa]">
            with {contributors.map(contributorLabel).join(", ")}
          </p>
        )}
        <p className="line-clamp-2 text-sm leading-6 text-[#5b5e82]">{project.description}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {(project.tags ?? []).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
    </a>
  );
}
