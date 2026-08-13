"use client";

import { Plus, Trash2 } from "lucide-react";
import type { SocialLink, SocialLinkKind } from "@/lib/types";

const STANDARD_SOCIALS: SocialLink[] = [
  { kind: "linkedin", label: "LinkedIn", url: "" },
  { kind: "github", label: "GitHub", url: "" },
  { kind: "website", label: "Website", url: "" },
];

export function inferSocialKind(link: SocialLink): SocialLinkKind {
  if (link.kind) return link.kind;
  const label = link.label.toLowerCase();
  const url = link.url.toLowerCase();
  if (label.includes("linkedin") || url.includes("linkedin.com")) return "linkedin";
  if (label.includes("github") || url.includes("github.com")) return "github";
  if (
    label.includes("website") ||
    label.includes("web") ||
    label.includes("portfolio") ||
    label.includes("personal")
  ) {
    return "website";
  }
  return "custom";
}

/** Editor state — always includes LinkedIn, GitHub, Website slots plus any custom links. */
export function normalizeSocialsForEdit(socials: SocialLink[] | undefined): SocialLink[] {
  const incoming = (socials ?? []).map((s) => ({ ...s, kind: inferSocialKind(s) }));
  const standard = STANDARD_SOCIALS.map((def) => {
    const match = incoming.find((s) => s.kind === def.kind);
    return { ...def, url: match?.url ?? "" };
  });
  const custom = incoming.filter((s) => s.kind === "custom");
  return [...standard, ...custom];
}

/** Persist only links with a URL. */
export function compactSocialsForSave(socials: SocialLink[]): SocialLink[] {
  return socials
    .map((s) => ({ ...s, kind: inferSocialKind(s), url: s.url.trim() }))
    .filter((s) => s.url.length > 0);
}

export function filledSocials(socials: SocialLink[] | undefined): SocialLink[] {
  return compactSocialsForSave(socials ?? []);
}

function customMonogram(label: string) {
  const ch = label.trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a-1.948 1.948 0 1 1 0-3.896 1.948 1.948 0 0 1 0 3.896zM6.969 20.452H3.555V9h3.414v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function WebsiteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function SocialLinkIcon({
  link,
  className = "size-4",
}: {
  link: SocialLink;
  className?: string;
}) {
  const kind = inferSocialKind(link);
  if (kind === "linkedin") return <LinkedInIcon className={className} />;
  if (kind === "github") return <GitHubIcon className={className} />;
  if (kind === "website") return <WebsiteIcon className={className} />;
  return (
    <span className={`grid place-items-center text-xs font-black ${className}`}>
      {customMonogram(link.label)}
    </span>
  );
}

export function SocialLinksDisplay({ socials }: { socials: SocialLink[] | undefined }) {
  const links = filledSocials(socials);
  if (links.length === 0) return null;

  return (
    <>
      {links.map((s) => (
        <a
          key={`${inferSocialKind(s)}-${s.url}`}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          title={s.label}
          className="grid size-10 place-items-center rounded-full bg-white/80 text-ink shadow-card-sm transition-transform hover:scale-110"
        >
          <SocialLinkIcon link={s} className="size-[18px]" />
        </a>
      ))}
    </>
  );
}

export function SocialLinksEditor({
  socials,
  onChange,
}: {
  socials: SocialLink[];
  onChange: (socials: SocialLink[]) => void;
}) {
  const normalized = normalizeSocialsForEdit(socials);
  const standard = normalized.filter((s) => inferSocialKind(s) !== "custom");
  const custom = normalized.filter((s) => inferSocialKind(s) === "custom");

  const updateStandard = (kind: SocialLinkKind, url: string) => {
    const next = normalizeSocialsForEdit(socials);
    const i = next.findIndex((s) => inferSocialKind(s) === kind);
    if (i >= 0) next[i] = { ...next[i], url };
    onChange(next);
  };

  const addCustom = () =>
    onChange([...normalizeSocialsForEdit(socials), { kind: "custom", label: "Link", url: "" }]);

  const removeCustom = (customIndex: number) => {
    const next = normalizeSocialsForEdit(socials);
    const customIndices = next
      .map((s, i) => (inferSocialKind(s) === "custom" ? i : -1))
      .filter((i) => i >= 0);
    next.splice(customIndices[customIndex], 1);
    onChange(next);
  };

  const updateCustom = (customIndex: number, patch: Partial<SocialLink>) => {
    const next = normalizeSocialsForEdit(socials);
    const customIndices = next
      .map((s, i) => (inferSocialKind(s) === "custom" ? i : -1))
      .filter((i) => i >= 0);
    const i = customIndices[customIndex];
    if (i === undefined) return;
    next[i] = { ...next[i], ...patch, kind: "custom" };
    onChange(next);
  };

  return (
    <div className="mt-5 rounded-2xl bg-white/90 p-4 shadow-card-sm">
      <p className="text-xs font-bold text-ink">Social links</p>
      <p className="mt-1 text-[11px] text-ink/55">
        LinkedIn, GitHub, and website appear on your page only when filled.
      </p>

      <div className="mt-4 space-y-3">
        {standard.map((s) => {
          const kind = inferSocialKind(s);
          return (
            <label key={kind} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f3eef8] text-ink">
                <SocialLinkIcon link={s} className="size-[18px]" />
              </span>
              <span className="w-20 shrink-0 text-xs font-semibold text-ink">{s.label}</span>
              <input
                value={s.url}
                onChange={(e) => updateStandard(kind, e.target.value)}
                placeholder={
                  kind === "linkedin"
                    ? "https://linkedin.com/in/…"
                    : kind === "github"
                      ? "https://github.com/…"
                      : "https://yoursite.com"
                }
                className="min-w-0 flex-1 rounded-lg bg-[#f3eef8] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple/40"
              />
            </label>
          );
        })}
      </div>

      {custom.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-ink/10 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Custom</p>
          {custom.map((s, i) => (
            <div key={i} className="flex gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f3eef8] text-ink">
                <SocialLinkIcon link={s} className="size-[18px]" />
              </span>
              <input
                value={s.label}
                onChange={(e) => updateCustom(i, { label: e.target.value })}
                placeholder="Label"
                className="w-28 rounded-lg bg-[#f3eef8] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple/40"
              />
              <input
                value={s.url}
                onChange={(e) => updateCustom(i, { url: e.target.value })}
                placeholder="https://…"
                className="min-w-0 flex-1 rounded-lg bg-[#f3eef8] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple/40"
              />
              <button
                type="button"
                onClick={() => removeCustom(i)}
                className="rounded-lg p-2 text-ink/40 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addCustom}
        className="mt-4 flex items-center gap-1 text-xs font-bold text-purple"
      >
        <Plus size={14} /> Add custom link
      </button>
    </div>
  );
}
