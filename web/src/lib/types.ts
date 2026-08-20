/**
 * Content schemas. All site data in /content conforms to these types.
 * Agents: update here first if adding fields, then the JSON, then the UI.
 */

export type MemberLevel =
  | "oc"
  | "co_overall_coordinator"
  | "research_lead"
  | "coordinator"
  | "executive"
  | "member"
  | "blogger"
  | "alumni"
  | "visitor";

/* ---------- Members / profiles ---------- */

export type ProfileBlockType =
  | "tools"
  | "achievements"
  | "projects"
  | "coursework"
  | "hobbies"
  | "internships"
  | "research"
  | "text";

export type ProfileBlock = {
  id: string;
  type: ProfileBlockType;
  /** "full" = spans whole row; "half" = packs 2-up on desktop */
  span: "full" | "half";
  title?: string;
  data: unknown;
};

export type Achievement = {
  year: string;
  title: string;
  org: string;
  description: string;
};

export type ProfileProject = {
  name: string;
  description: string;
  tags: string[];
  links: { label: string; url: string }[];
  image?: string;
};

export type CourseworkItem = { name: string; topics: string };
export type InternshipItem = { role: string; org?: string; description: string };

export type SocialLinkKind = "linkedin" | "github" | "website" | "custom";

export type SocialLink = {
  label: string;
  url: string;
  kind?: SocialLinkKind;
};

export type Member = {
  slug: string;
  name: string;
  role: string; // e.g. "Executive, ARIES"
  tagline: string;
  year?: string; // e.g. "3rd Year, MAE"
  location?: string; // e.g. "IIT Delhi"
  avatar?: string; // image path; falls back to initials
  resumeUrl?: string;
  socials: SocialLink[];
  blocks: ProfileBlock[];
  /** Club tier from the members table (e.g. visitor, executive). Backup JSON omits this. */
  level?: MemberLevel;
  /** Kerberos / entry number used for signup (from members.entry_number). */
  entryNumber?: string;
  email?: string;
};

/* ---------- Projects ---------- */

/** Contributor on a project — member slug, alumni, or external (non-ARIES). */
export type ProjectContributor = {
  name: string;
  kind: "member" | "alumni" | "external";
  /** Present when kind is "member" (and optionally for alumni with a known slug). */
  slug?: string;
};

export type Project = {
  slug: string;
  name: string;
  accent?: string; // accent word in the title, e.g. "Call AI"
  tagline: string;
  description: string;
  category: string; // e.g. "AI / ML", "Hackathon", "Publication"
  tags: string[];
  techStack?: string[];
  features?: { title: string; description: string }[];
  highlights?: { title: string; description: string }[];
  screenshots?: { title: string; description: string; image?: string }[];
  links?: { label: string; url: string }[];
  /** Member slugs (legacy) or rich contributor refs. */
  contributors?: Array<string | ProjectContributor>;
  /** Cover / card image (single). */
  image?: string;
  /** Extra photos shown in the project gallery. */
  images?: string[];
  video?: string; // short clip URL (mp4/webm)
  featured?: boolean;
  about?: string; // long-form "About the Project" text
};

/* ---------- Events ---------- */

export type AriesEvent = {
  slug: string;
  title: string;
  type: "Talk" | "Workshop" | "Hackathon" | "External";
  date: string; // ISO date
  startTime?: string;
  endTime?: string;
  venue?: string;
  description: string;
  body?: string; // long description for the detail page
  /** Cover / hero image (single). */
  image?: string;
  /** Extra photos shown on the event detail page. */
  images?: string[];
  video?: string; // short clip URL (mp4/webm)
  links: { label: string; url: string }[];
  /** Organizers / people listed on the event (same shape as project contributors). */
  contributors?: Array<string | ProjectContributor>;
};

/* ---------- Resources ---------- */

export type ResourceAuthor = {
  name: string;
  slug?: string;
  kind?: "member" | "external";
};

export type Resource = {
  slug: string;
  title: string;
  description: string;
  type: "Blog" | "Tutorial" | "Course" | "Featured";
  url?: string;
  addedOn: string; // ISO date
  authors?: ResourceAuthor[];
  body?: string; // long-form markdown content
  featured?: boolean;
  coverImage?: string;
  /** True when the resource originates from Sanity CMS. */
  _sanity?: boolean;
};

/* ---------- Team ---------- */

export type TeamMemberRef = {
  name: string;
  role: string;
  slug?: string; // links to /:slug profile when present
  photo?: string;
};

export type TeamYear = {
  year: string; // "2026-27"
  /** Cover / first group photo (kept for older readers). */
  photo?: string;
  /** Extra full-team photos for this year (carousel). */
  photos?: string[];
  coreTeam: TeamMemberRef[];
  coordinators: TeamMemberRef[];
  executives: { group: string; members: TeamMemberRef[] }[];
};

export type Alumnus = {
  name: string;
  role: string; // current role
  org: string;
  photo?: string;
  slug?: string;
};

export type TeamData = {
  years: TeamYear[];
  alumni: Alumnus[];
};
