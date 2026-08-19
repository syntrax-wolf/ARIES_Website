import { useMemo, useState } from "react";
import { FolderPlus, LogOut } from "lucide-react";
import type { Project } from "../../../../src/lib/types";
import { ProjectForm } from "./ProjectForm";

export function AdminEditor({
  projects: initialProjects,
  label,
}: {
  projects: Project[];
  label: string;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [editProject, setEditProject] = useState("");
  const [formKey, setFormKey] = useState(0);
  const selected = useMemo(
    () => projects.find((p) => p.slug === editProject),
    [projects, editProject],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-card-sm">
        <div>
          <p className="text-sm font-bold text-ink">{label}</p>
          <p className="text-xs text-ink/50">Signed in · editor</p>
        </div>
        <form method="post" action="/api/auth/logout">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full bg-lilac px-3 py-1.5 text-xs font-bold text-ink"
          >
            <LogOut size={13} /> Sign out
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-2 rounded-full bg-purple px-5 py-2.5 text-sm font-bold text-white shadow-cta">
          <FolderPlus size={15} /> Projects
        </span>
      </div>

      <div className="mt-8 space-y-6">
        <label className="block max-w-md text-xs font-semibold text-ink">
          Edit existing project
          <select
            value={editProject}
            onChange={(e) => {
              setEditProject(e.target.value);
              setFormKey((k) => k + 1);
            }}
            className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
          >
            <option value="">— create new —</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <ProjectForm
          key={`${editProject || "new-project"}-${formKey}`}
          initial={selected}
          onSaved={(project, mode) => {
            if (mode === "direct") {
              setProjects((prev) => {
                const i = prev.findIndex((p) => p.slug === project.slug);
                if (i >= 0) {
                  const next = [...prev];
                  next[i] = { ...prev[i], ...project };
                  return next;
                }
                return [...prev, project];
              });
              setEditProject(project.slug);
            }
            setFormKey((k) => k + 1);
          }}
        />
      </div>
    </div>
  );
}
