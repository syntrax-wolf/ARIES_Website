"use client";

import { useState } from "react";
import Link from "next/link";
import type { Member, ProjectContributor } from "@/lib/types";
import { contributorLabel, isProfileLinked } from "@/lib/contributors";
import { isVisitor } from "@/lib/supabase/env";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Team chips — members (including visitor non-ARIES) link to profiles; alumni/external open a notice. */
export function ContributorList({
  contributors,
  projectSlug,
  members = [],
}: {
  contributors: ProjectContributor[];
  projectSlug: string;
  members?: Pick<Member, "slug" | "level">[];
}) {
  const [notice, setNotice] = useState<string | null>(null);

  if (contributors.length === 0) return null;

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-3">
        {contributors.map((c, i) => {
          const name = contributorLabel(c);
          const member = c.slug ? members.find((m) => m.slug === c.slug) : undefined;
          const visitor = isVisitor(member?.level);
          const hasProfile = isProfileLinked(c) && !!c.slug && !!member && !visitor;
          const chip = (
            <>
              <span className="grid size-9 place-items-center rounded-full bg-purple text-xs font-bold text-white">
                {initials(name) || "?"}
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                {name}
              </span>
            </>
          );

          if (hasProfile) {
            return (
              <Link
                key={`${c.slug}-${i}`}
                href={`/${c.slug}?from=project:${projectSlug}`}
                className="flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 shadow-card-sm transition-transform hover:-translate-y-0.5"
              >
                {chip}
              </Link>
            );
          }

          return (
            <button
              key={`${c.kind}-${name}-${i}`}
              type="button"
              onClick={() => setNotice(name)}
              className="flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 shadow-card-sm transition-transform hover:-translate-y-0.5"
            >
              {chip}
            </button>
          );
        })}
      </div>

      {notice && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="non-member-title"
          onClick={() => setNotice(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="non-member-title" className="text-base font-bold text-ink">
              Not an Aries member
            </h3>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              <span className="font-semibold text-ink">{notice}</span> isn’t listed as a current
              ARIES member, so there’s no profile page to open.
            </p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="mt-5 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
