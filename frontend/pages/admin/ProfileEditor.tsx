"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import type { Member } from "@/lib/types";

/** Points members to edit their profile on their public page. */
export function ProfileEditor({
  member,
}: {
  member: Member;
  onSaved?: (member: Member) => void;
}) {
  return (
    <div className="max-w-2xl rounded-2xl bg-white p-8 shadow-card-sm">
      <h2 className="text-lg font-black text-ink">Edit your public profile</h2>
      <p className="mt-3 text-sm leading-6 text-ink/65">
        Profile content is edited directly on your public page — photo, tagline, social
        links, and all sections (experience, projects, etc.). Changes publish immediately
        when you save.
      </p>
      <Link
        href={`/${member.slug}?edit=1`}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple px-6 py-3 text-sm font-bold text-white shadow-cta"
      >
        <Pencil size={15} /> Edit on {member.slug}
        <ExternalLink size={14} />
      </Link>
      <p className="mt-4 text-xs text-ink/50">
        Tip: when signed in, you can also click <strong>Edit profile</strong> on your public
        page at any time.
      </p>
    </div>
  );
}
