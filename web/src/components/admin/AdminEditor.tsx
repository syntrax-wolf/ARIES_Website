import { useMemo, useState } from "react";
import { BookOpen, CalendarPlus, ClipboardList, FolderPlus, Image as ImageIcon, LogOut, Shield, UserRound, Users } from "lucide-react";
import type { AriesEvent, Member, Project, Resource, TeamData } from "../../lib/types";
import { ProjectForm } from "./ProjectForm";
import { EventForm } from "./EventForm";
import { ResourceForm } from "./ResourceForm";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { MemberForm } from "./MemberForm";
import { ProfileForm } from "./ProfileForm";
import { TeamForm } from "./TeamForm";

import { AllowlistForm } from "./AllowlistForm";

type TabId = "members" | "team" | "projects" | "events" | "resources" | "profile" | "approvals" | "allowlist";

export function AdminEditor({
  projects: initialProjects,
  events: initialEvents,
  resources: initialResources,
  members: initialMembers,
  team: initialTeam,
  profileSlug,
  label,
  tabs,
}: {
  projects: Project[];
  events: AriesEvent[];
  resources: Resource[];
  members: Member[];
  team: TeamData;
  profileSlug: string;
  label: string;
  tabs: TabId[];
}) {
  const visibleTabs = tabs.length ? tabs : (["projects"] as TabId[]);
  const [tab, setTab] = useState<TabId>(visibleTabs[0] ?? "projects");
  const [projects, setProjects] = useState(initialProjects);
  const [events, setEvents] = useState(initialEvents);
  const [resources, setResources] = useState(initialResources);
  const [members, setMembers] = useState(initialMembers);
  const [team, setTeam] = useState(initialTeam);
  const [editMember, setEditMember] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editEvent, setEditEvent] = useState("");
  const [editResource, setEditResource] = useState("");
  const [projectKey, setProjectKey] = useState(0);
  const [eventKey, setEventKey] = useState(0);
  const [resourceKey, setResourceKey] = useState(0);

  const selectedProject = useMemo(
    () => projects.find((p) => p.slug === editProject),
    [projects, editProject],
  );
  const selectedEvent = useMemo(
    () => events.find((e) => e.slug === editEvent),
    [events, editEvent],
  );
  const selectedResource = useMemo(
    () => resources.find((r) => r.slug === editResource),
    [resources, editResource],
  );

  const tabMeta: Record<TabId, { label: string; icon: typeof FolderPlus }> = {
    members: { label: "Members", icon: Users },
    team: { label: "Team", icon: ImageIcon },
    projects: { label: "Projects", icon: FolderPlus },
    events: { label: "Events", icon: CalendarPlus },
    resources: { label: "Resources", icon: BookOpen },
    profile: { label: "Account", icon: UserRound },
    approvals: { label: "Approvals", icon: ClipboardList },
    allowlist: { label: "Allowlist", icon: Shield },
  };

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
        {visibleTabs.map((id) => {
          const Icon = tabMeta[id].icon;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                tab === id
                  ? "flex items-center gap-2 rounded-full bg-purple px-5 py-2.5 text-sm font-bold text-white shadow-cta"
                  : "flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-lilac"
              }
            >
              <Icon size={15} /> {tabMeta[id].label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-6">
        {tab === "members" && (
          <>
            <label className="block max-w-md text-xs font-semibold text-ink">
              Edit roster entry
              <select
                value={editMember}
                onChange={(e) => setEditMember(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new roster row —</option>
                {members.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name} ({m.slug})
                  </option>
                ))}
              </select>
            </label>
            <MemberForm
              key={editMember || "new-member"}
              initial={
                members.find((m) => m.slug === editMember)
                  ? {
                      slug: members.find((m) => m.slug === editMember)?.slug,
                      name: members.find((m) => m.slug === editMember)?.name,
                      role: members.find((m) => m.slug === editMember)?.role,
                      tagline: members.find((m) => m.slug === editMember)?.tagline,
                      year: members.find((m) => m.slug === editMember)?.year,
                      location: members.find((m) => m.slug === editMember)?.location,
                      photo: members.find((m) => m.slug === editMember)?.avatar,
                      entryNumber: members.find((m) => m.slug === editMember)?.entryNumber,
                      email: members.find((m) => m.slug === editMember)?.email,
                      level: members.find((m) => m.slug === editMember)?.level,
                    }
                  : undefined
              }
              onSaved={(slug) => setEditMember(slug)}
            />
          </>
        )}

        {tab === "team" && <TeamForm team={team} onSaved={setTeam} />}

        {tab === "profile" && profileSlug && members.find((m) => m.slug === profileSlug) && (
          <ProfileForm
            member={members.find((m) => m.slug === profileSlug)!}
            onSaved={(updated) =>
              setMembers((prev) => prev.map((m) => (m.slug === updated.slug ? updated : m)))
            }
          />
        )}
        {tab === "profile" && !profileSlug && (
          <div className="max-w-2xl rounded-2xl bg-white p-6 shadow-card-sm">
            <p className="text-sm font-bold text-ink">No public profile for this login</p>
            <p className="mt-2 text-sm text-ink/60">
              The Admin account is CMS-only. Use Members to edit someone else, or sign in with Kerberos.
            </p>
          </div>
        )}

        {tab === "projects" && (
          <>
            <label className="block max-w-md text-xs font-semibold text-ink">
              Edit existing project
              <select
                value={editProject}
                onChange={(e) => {
                  setEditProject(e.target.value);
                  setProjectKey((k) => k + 1);
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
              key={`${editProject || "new-project"}-${projectKey}`}
              initial={selectedProject}
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
                setProjectKey((k) => k + 1);
              }}
            />
          </>
        )}

        {tab === "events" && (
          <>
            <label className="block max-w-md text-xs font-semibold text-ink">
              Edit existing event
              <select
                value={editEvent}
                onChange={(e) => {
                  setEditEvent(e.target.value);
                  setEventKey((k) => k + 1);
                }}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {events.map((ev) => (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </label>
            <EventForm
              key={`${editEvent || "new-event"}-${eventKey}`}
              initial={selectedEvent}
              onSaved={(event, mode) => {
                if (mode === "direct") {
                  setEvents((prev) => {
                    const i = prev.findIndex((e) => e.slug === event.slug);
                    if (i >= 0) {
                      const next = [...prev];
                      next[i] = { ...prev[i], ...event };
                      return next;
                    }
                    return [...prev, event];
                  });
                  setEditEvent(event.slug);
                }
                setEventKey((k) => k + 1);
              }}
            />
          </>
        )}

        {tab === "resources" && (
          <>
            <label className="block max-w-md text-xs font-semibold text-ink">
              Edit existing resource
              <select
                value={editResource}
                onChange={(e) => {
                  setEditResource(e.target.value);
                  setResourceKey((k) => k + 1);
                }}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {resources.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
            <ResourceForm
              key={`${editResource || "new-resource"}-${resourceKey}`}
              initial={selectedResource}
              onSaved={(resource, mode) => {
                if (mode === "direct") {
                  setResources((prev) => {
                    const i = prev.findIndex((r) => r.slug === resource.slug);
                    if (i >= 0) {
                      const next = [...prev];
                      next[i] = resource;
                      return next;
                    }
                    return [...prev, resource];
                  });
                  setEditResource(resource.slug);
                }
                setResourceKey((k) => k + 1);
              }}
            />
          </>
        )}

        {tab === "approvals" && <ApprovalsPanel />}
        {tab === "allowlist" && <AllowlistForm />}
      </div>
    </div>
  );
}
