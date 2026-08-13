"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  GraduationCap,
  MapPin,
  Pencil,
  Save,
  ShieldAlert,
  X,
} from "lucide-react";
import type { Member } from "@/lib/types";
import { isVisitor } from "@/lib/supabase/env";
import { BlockGrid } from "frontend/shared/profile/BlockGrid";
import { BackToSource } from "frontend/shared/profile/BackToSource";
import { ProfileBlocksManager } from "frontend/shared/profile/ProfileBlockEditor";
import {
  compactSocialsForSave,
  normalizeSocialsForEdit,
  SocialLinksDisplay,
  SocialLinksEditor,
} from "frontend/shared/profile/SocialLinks";
import { initialsOf } from "frontend/shared/cards/PersonCard";
import { MediaField } from "frontend/pages/admin/ImageField";
import { useAuth } from "@/context/AuthContext";

function normalizeMember(member: Member): Member {
  return {
    ...member,
    slug: member.slug,
    socials: normalizeSocialsForEdit(member.socials),
    blocks: member.blocks ?? [],
  };
}

async function saveProfile(member: Member) {
  const res = await fetch("/api/admin/save", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "members", slug: member.slug, data: member }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Save failed (${res.status})`);
}

/**
 * Public member profile with inline editing when the signed-in user owns the page.
 */
export function EditableMemberProfile({
  member,
  projectNames,
}: {
  member: Member;
  projectNames: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading, refreshSession } = useAuth();
  const canEdit = !loading && session?.memberSlug === member.slug;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => normalizeMember(member));
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(normalizeMember(member));
  }, [member, editing]);

  useEffect(() => {
    if (canEdit && searchParams.get("edit") === "1") setEditing(true);
  }, [canEdit, searchParams]);

  const display = editing ? draft : member;

  const startEditing = () => {
    setDraft(normalizeMember(member));
    setEditingBlockId(null);
    setEditing(true);
    setErrorMsg(null);
  };

  const cancelEditing = () => {
    setDraft(normalizeMember(member));
    setEditingBlockId(null);
    setEditing(false);
    setErrorMsg(null);
    if (searchParams.get("edit") === "1") {
      router.replace(`/${member.slug}`, { scroll: false });
    }
  };

  const save = async () => {
    setStatus("saving");
    setErrorMsg(null);
    try {
      const payload = {
        ...draft,
        slug: member.slug,
        socials: compactSocialsForSave(draft.socials),
      };
      await saveProfile(payload);
      setStatus("saved");
      setEditing(false);
      setEditingBlockId(null);
      await refreshSession();
      router.refresh();
      if (searchParams.get("edit") === "1") {
        router.replace(`/${member.slug}`, { scroll: false });
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const setField =
    (key: keyof Member) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-[linear-gradient(175deg,#c4b2ee_0%,#b5a0ea_35%,#cabcee_70%,#b9a6ea_100%)]">
      {editing && (
        <div className="sticky top-0 z-30 border-b border-white/30 bg-[#2b1e6b]/90 px-4 py-3 text-white backdrop-blur md:px-10">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">Editing your profile</p>
            <div className="flex flex-wrap items-center gap-2">
              {errorMsg && <span className="text-xs text-red-200">{errorMsg}</span>}
              <button
                type="button"
                onClick={cancelEditing}
                className="flex items-center gap-1.5 rounded-full border border-white/40 px-4 py-2 text-xs font-bold"
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={status === "saving"}
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#2b1e6b] disabled:opacity-60"
              >
                <Save size={14} />
                {status === "saving"
                  ? "Saving…"
                  : status === "saved"
                    ? "Saved ✓"
                    : status === "error"
                      ? "Retry save"
                      : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 pt-6 md:px-10">
        <Link href="/" aria-label="ARIES home" className="flex items-center gap-3">
          <Image
            src="/images/brand/logo-white.svg"
            alt=""
            width={40}
            height={47}
            className="h-10 w-auto"
          />
          <span className="leading-none text-white">
            <span className="block text-[15px] font-bold tracking-[0.4em]">ARIES</span>
            <span className="mt-1 block text-[10px] font-bold tracking-[0.28em]">IIT DELHI</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {canEdit && !editing && (
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-[#2b1e6b] shadow-sm transition hover:bg-white"
            >
              <Pencil size={14} /> Edit profile
            </button>
          )}
          <BackToSource projectNames={projectNames} />
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 pb-20 md:px-10">
        <section className="grid items-center gap-10 pt-12 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-[#31217a]">Hello, I&rsquo;m</p>
            {editing ? (
              <input
                value={draft.name}
                onChange={setField("name")}
                className="mt-2 w-full rounded-xl border border-white/50 bg-white/80 px-4 py-2 text-3xl font-black text-[#140b3c] outline-none focus:ring-2 focus:ring-purple/40 md:text-4xl"
              />
            ) : (
              <h1 className="mt-2 text-4xl font-black text-[#140b3c] md:text-5xl">
                {display.name}
              </h1>
            )}

            {isVisitor(display.level) ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3.5 py-1.5 text-sm font-bold text-[#140b3c] shadow-sm backdrop-blur">
                <ShieldAlert size={15} className="text-purple" /> Not an ARIES member
              </div>
            ) : editing ? (
              <input
                value={draft.role}
                onChange={setField("role")}
                placeholder="Role (e.g. Alumni, ARIES · Coordinator)"
                className="mt-3 w-full rounded-xl border border-white/50 bg-white/80 px-4 py-2 text-lg font-bold text-purple-2 outline-none focus:ring-2 focus:ring-purple/40"
              />
            ) : (
              display.role && (
                <p className="mt-3 text-lg font-bold text-purple-2">{display.role}</p>
              )
            )}

            {editing ? (
              <textarea
                value={draft.tagline}
                onChange={setField("tagline")}
                rows={3}
                placeholder="Short tagline — shown here and on the Team page"
                className="mt-4 w-full max-w-md rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-[15px] leading-7 text-[#2c2359] outline-none focus:ring-2 focus:ring-purple/40"
              />
            ) : (
              display.tagline && (
                <p className="mt-4 max-w-md text-[15px] leading-7 text-[#2c2359]">
                  {display.tagline}
                </p>
              )
            )}

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#2c2359]">
              {editing ? (
                <>
                  <label className="flex min-w-[180px] flex-1 items-center gap-2">
                    <GraduationCap size={16} />
                    <input
                      value={draft.year ?? ""}
                      onChange={setField("year")}
                      placeholder="Year / program"
                      className="w-full rounded-lg border border-white/50 bg-white/80 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
                    />
                  </label>
                  <label className="flex min-w-[180px] flex-1 items-center gap-2">
                    <MapPin size={16} />
                    <input
                      value={draft.location ?? ""}
                      onChange={setField("location")}
                      placeholder="Location"
                      className="w-full rounded-lg border border-white/50 bg-white/80 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
                    />
                  </label>
                </>
              ) : (
                <>
                  {display.year && (
                    <span className="flex items-center gap-2">
                      <GraduationCap size={16} /> {display.year}
                    </span>
                  )}
                  {display.location && (
                    <span className="flex items-center gap-2">
                      <MapPin size={16} /> {display.location}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {editing ? (
                <input
                  value={draft.resumeUrl ?? ""}
                  onChange={setField("resumeUrl")}
                  placeholder="Resume URL"
                  className="min-w-[220px] flex-1 rounded-full border border-white/50 bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
                />
              ) : (
                display.resumeUrl && (
                  <a
                    href={display.resumeUrl}
                    className="flex items-center gap-2 rounded-full bg-navy-2 px-6 py-2.5 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
                  >
                    Resume <Download size={15} />
                  </a>
                )
              )}

              {!editing && <SocialLinksDisplay socials={display.socials} />}
            </div>

            {editing && (
              <SocialLinksEditor
                socials={draft.socials}
                onChange={(socials) => setDraft((d) => ({ ...d, socials }))}
              />
            )}
          </div>

          <div className="relative mx-auto w-full max-w-[224px]">
            {editing ? (
              <div className="rounded-2xl bg-white/90 p-4 shadow-card-sm">
                <MediaField
                  label="Profile photo"
                  kind="members"
                  value={draft.avatar}
                  onChange={(url) => setDraft((d) => ({ ...d, avatar: url }))}
                  accept="image"
                />
              </div>
            ) : (
              <div className="relative mx-auto grid size-48 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#7a50ff,#4711d9)] shadow-[0px_30px_60px_rgba(40,20,120,0.35)] md:size-56">
                {display.avatar ? (
                  <Image
                    src={display.avatar}
                    alt={display.name}
                    fill
                    sizes="224px"
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-6xl font-black text-white">
                    {initialsOf(display.name)}
                  </span>
                )}
              </div>
            )}
            {!editing && (
              <span className="absolute -right-2 top-4 size-10 rounded-full border-2 border-white/50" />
            )}
          </div>
        </section>

        <div className="mt-12 space-y-8">
          {editing ? (
            <>
              <ProfileBlocksManager
                blocks={draft.blocks}
                onChange={(blocks) => setDraft((d) => ({ ...d, blocks }))}
                editingBlockId={editingBlockId}
                onEditingBlockIdChange={setEditingBlockId}
                variant="profile"
              />
              {draft.blocks.length > 0 && (
                <div>
                  <p className="mb-4 text-xs font-bold uppercase tracking-wide text-[#31217a]/70">
                    Preview
                  </p>
                  <BlockGrid blocks={draft.blocks} />
                </div>
              )}
            </>
          ) : (
            <BlockGrid blocks={display.blocks} />
          )}
        </div>
      </div>
    </div>
  );
}
