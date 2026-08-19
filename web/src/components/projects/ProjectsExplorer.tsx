import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Project } from "../../../../src/lib/types";
import { ProjectCard } from "./ProjectCard";

function blob(p: Project): string {
  const people = (p.contributors ?? []).map((c) =>
    typeof c === "string" ? c : [c.name, c.slug, c.kind].filter(Boolean).join(" "),
  );
  return [
    p.name,
    p.accent,
    p.tagline,
    p.description,
    p.category,
    p.about,
    ...(p.tags ?? []),
    ...(p.techStack ?? []),
    ...people,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => blob(p).includes(q));
  }, [projects, query]);

  return (
    <div className="pb-24">
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-[#d9d1c0] bg-white px-4 py-2.5">
          <Search size={16} className="text-[#8a8daa]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by name, tag, or description"
            className="w-full bg-transparent text-sm text-[#11154a] placeholder-[#8a8daa] outline-none"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#d9d1c0] bg-white/60 p-12 text-center text-sm text-[#5b5e82]">
          No projects match “{query}” — try a different name or tag.
        </div>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
