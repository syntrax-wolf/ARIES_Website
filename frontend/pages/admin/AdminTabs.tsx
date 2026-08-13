"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  FolderPlus,
  CalendarPlus,
  BookOpen,
  Users,
  LogOut,
  ExternalLink,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react";
import type { AriesEvent, Member, Project, Resource, TeamData } from "@/lib/types";
import { ProfileEditor } from "./ProfileEditor";
import { ProjectForm } from "./ProjectForm";
import { EventForm } from "./EventForm";
import { ResourceForm } from "./ResourceForm";
import { MemberForm } from "./MemberForm";
import { AlumniForm } from "./AlumniForm";
import { TeamPhotoForm } from "./TeamPhotoForm";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { ChangePasswordForm } from "frontend/pages/profile/ChangePasswordForm";
import { useAuth } from "@/context/AuthContext";
import { canApprove, canManageTeamContent, canPublishResource } from "@/lib/roles";
import { slugOnEvent, slugOnProject, slugOnResource } from "@/lib/entity-access";
import { isVisitor } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const BASE_TABS = [
  { id: "members", label: "Members", icon: Users, leadershipOnly: true },
  { id: "team", label: "Team", icon: ImageIcon, adminOnly: true },
  { id: "projects", label: "Projects", icon: FolderPlus },
  { id: "events", label: "Events", icon: CalendarPlus },
  { id: "resources", label: "Resources", icon: BookOpen, publisherOnly: true },
  { id: "profile", label: "Account", icon: UserRound },
  { id: "approvals", label: "Approvals", icon: ClipboardList, adminOnly: true },
] as const;

type TabId = (typeof BASE_TABS)[number]["id"];

/**
 * Full CMS shell — create/edit members, projects, events, team photos/alumni.
 * Team tab (photos + alumni) is leadership (admin) only.
 */
export function AdminTabs({
  members: initialMembers,
  projects: initialProjects,
  events: initialEvents,
  resources: initialResources,
  team: initialTeam,
}: {
  members: Member[];
  projects: Project[];
  events: AriesEvent[];
  resources: Resource[];
  team: TeamData;
}) {
  const router = useRouter();
  const { session, signOut, role, refreshSession } = useAuth();
  const isAdmin = canManageTeamContent(session?.level);
  const showApprovals = canApprove(session?.level);
  const isBlogger = session?.level === "blogger";
  const canUseResources = canPublishResource(session?.level);

  const TABS = useMemo(
    () =>
      BASE_TABS.filter((t) => {
        if ("leadershipOnly" in t && t.leadershipOnly) return isAdmin;
        if ("adminOnly" in t && t.adminOnly) return isAdmin;
        if ("publisherOnly" in t && t.publisherOnly) return canUseResources;
        if (isBlogger) return t.id === "resources" || t.id === "profile";
        return true;
      }),
    [isAdmin, canUseResources, isBlogger],
  );

  const [tab, setTab] = useState<TabId>("projects");
  const [members, setMembers] = useState(initialMembers);
  const [projects, setProjects] = useState(initialProjects);
  const [events, setEvents] = useState(initialEvents);
  const [resources, setResources] = useState(initialResources);
  const [teamData, setTeamData] = useState(initialTeam);
  const [editMember, setEditMember] = useState<string>("");
  const [editProject, setEditProject] = useState<string>("");
  const [editEvent, setEditEvent] = useState<string>("");
  const [editResource, setEditResource] = useState<string>("");
  const [projectFormKey, setProjectFormKey] = useState(0);
  const [eventFormKey, setEventFormKey] = useState(0);
  const [resourceFormKey, setResourceFormKey] = useState(0);

  useEffect(() => {
    setMembers(initialMembers);
    setProjects(initialProjects);
    setEvents(initialEvents);
    setResources(initialResources);
    setTeamData(initialTeam);
  }, [initialMembers, initialProjects, initialEvents, initialResources, initialTeam]);

  useEffect(() => {
    if (!TABS.some((t) => t.id === tab)) setTab(TABS[0]?.id ?? "projects");
  }, [TABS, tab]);

  // Only the signed-in person's own profile — never fall back to another member
  const member = useMemo(() => {
    const slug = session?.memberSlug;
    if (!slug) return undefined;
    return members.find((m) => m.slug === slug);
  }, [members, session?.memberSlug]);

  const selectedMember = members.find((m) => m.slug === editMember);
  const editableProjects = useMemo(() => {
    if (session?.level !== "executive" || !session.memberSlug) return projects;
    return projects.filter((p) => slugOnProject(p, session.memberSlug));
  }, [projects, session?.level, session?.memberSlug]);
  const editableEvents = useMemo(() => {
    if (session?.level !== "executive" || !session.memberSlug) return events;
    return events.filter((e) => slugOnEvent(e, session.memberSlug));
  }, [events, session?.level, session?.memberSlug]);
  const editableResources = useMemo(() => {
    if (session?.level !== "executive" || !session.memberSlug) return resources;
    return resources.filter((r) => slugOnResource(r, session.memberSlug));
  }, [resources, session?.level, session?.memberSlug]);
  const selectedProject = editableProjects.find((p) => p.slug === editProject);
  const knownTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      for (const t of p.tags ?? []) if (t.trim()) set.add(t.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [projects]);
  const selectedEvent = editableEvents.find((e) => e.slug === editEvent);
  const selectedResource = editableResources.find((r) => r.slug === editResource);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-card-sm">
        <div>
          <p className="text-sm font-bold text-ink">{session?.name ?? "Editor"}</p>
          <p className="text-xs text-ink/50">
            Signed in · role {role}
            {session?.email ? ` · ${session.email}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {member && (
            <Link
              href={`/${member.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-semibold text-purple hover:underline"
            >
              Public profile <ExternalLink size={12} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOut().then(() => (window.location.href = "/admin"))}
            className="flex items-center gap-1.5 rounded-full bg-lilac px-3 py-1.5 text-xs font-bold text-ink"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
              tab === t.id ? "bg-purple text-white shadow-cta" : "bg-white text-ink hover:bg-lilac",
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {tab === "members" && isAdmin && (
          <>
            <label className="block max-w-md text-xs font-semibold text-ink">
              Edit existing member
              <select
                value={editMember}
                onChange={(e) => setEditMember(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {members.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name} ({m.slug})
                    {isVisitor(m.level) ? " — Non-ARIES" : ""}
                  </option>
                ))}
              </select>
            </label>
            <MemberForm
              key={editMember || "new-member"}
              canSetKerberos={isAdmin}
              initial={
                selectedMember
                  ? {
                      slug: selectedMember.slug,
                      name: selectedMember.name,
                      role: selectedMember.role,
                      tagline: selectedMember.tagline,
                      year: selectedMember.year,
                      location: selectedMember.location,
                      photo: selectedMember.avatar,
                      entryNumber: selectedMember.entryNumber,
                      email: selectedMember.email,
                      about:
                        typeof selectedMember.blocks.find((b) => b.type === "text")?.data === "string"
                          ? (selectedMember.blocks.find((b) => b.type === "text")?.data as string)
                          : "",
                    }
                  : undefined
              }
              onSaved={(slug) => {
                setEditMember(slug);
                void refreshSession();
                router.refresh();
              }}
            />
          </>
        )}

        {tab === "team" && isAdmin && (
          <div className="space-y-10">
            <TeamPhotoForm
              team={teamData}
              onSaved={(next) => {
                setTeamData(next);
                router.refresh();
              }}
            />
            <div>
              <h2 className="mb-4 text-lg font-black text-ink">Alumni profiles</h2>
              <AlumniForm
                team={teamData}
                onSaved={(next) => {
                  setTeamData(next);
                  router.refresh();
                }}
              />
            </div>
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
                  setProjectFormKey((k) => k + 1);
                }}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {editableProjects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <ProjectForm
              key={`${editProject || "new-project"}-${projectFormKey}`}
              initial={selectedProject}
              members={members}
              knownTags={knownTags}
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
                setProjectFormKey((k) => k + 1);
                router.refresh();
              }}
              onDeleted={(slug, mode) => {
                if (mode === "direct") {
                  setProjects((prev) => prev.filter((p) => p.slug !== slug));
                  setEditProject("");
                }
                setProjectFormKey((k) => k + 1);
                router.refresh();
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
                  setEventFormKey((k) => k + 1);
                }}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {editableEvents.map((ev) => (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </label>
            <EventForm
              key={`${editEvent || "new-event"}-${eventFormKey}`}
              members={members}
              initial={
                selectedEvent
                  ? {
                      ...selectedEvent,
                      calendar: selectedEvent.links?.[0]?.url,
                    }
                  : undefined
              }
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
                setEventFormKey((k) => k + 1);
                router.refresh();
              }}
              onDeleted={(slug, mode) => {
                if (mode === "direct") {
                  setEvents((prev) => prev.filter((e) => e.slug !== slug));
                  setEditEvent("");
                }
                setEventFormKey((k) => k + 1);
                router.refresh();
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
                  setResourceFormKey((k) => k + 1);
                }}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {editableResources.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
            <ResourceForm
              key={`${editResource || "new-resource"}-${resourceFormKey}`}
              initial={selectedResource}
              members={members}
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
                setResourceFormKey((k) => k + 1);
                router.refresh();
              }}
              onDeleted={(slug, mode) => {
                if (mode === "direct") {
                  setResources((prev) => prev.filter((r) => r.slug !== slug));
                  setEditResource("");
                }
                setResourceFormKey((k) => k + 1);
                router.refresh();
              }}
            />
          </>
        )}

        {tab === "profile" && member && (
          <div className="space-y-6">
            <ProfileEditor
              member={member}
              onSaved={(updated) => {
                setMembers((prev) => prev.map((m) => (m.slug === updated.slug ? updated : m)));
                void refreshSession();
                router.refresh();
              }}
            />
            <ChangePasswordForm />
          </div>
        )}
        {tab === "profile" && !member && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-card-sm">
              <p className="text-sm font-bold text-ink">No public profile for this login</p>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                The <code className="text-xs">admin</code> account is a CMS-only login, so it has no
                member page to edit. Use the Members tab to edit someone&rsquo;s profile, or sign in
                with a personal Kerberos account to edit your own.
              </p>
            </div>
            <ChangePasswordForm />
          </div>
        )}

        {tab === "approvals" && showApprovals && <ApprovalsPanel />}
      </div>
    </div>
  );
}
