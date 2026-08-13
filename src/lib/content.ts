/**
 * Content readers. Source of truth: Supabase (ARIES_Website project).
 * content/*.json is retained as a backup; refresh with `npm run content:export`.
 * Blog posts come from Sanity CMS and are surfaced as Resources.
 */
import type {
  AriesEvent,
  Member,
  Project,
  Resource,
  SanityBlogResource,
  TeamData,
} from "./types";
import { createClient } from "@supabase/supabase-js";
import { getClient } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

function taggedFetch(tags: string[]) {
  return (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      cache: "force-cache",
      next: { revalidate: 30, tags: ["content", ...tags] },
    });
}

function supabaseTagged(tags: string[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // ISR-friendly caching (no-store breaks generateStaticParams for /[slug]).
    // Tags are busted via revalidateTag in revalidateContent after CMS writes.
    global: { fetch: taggedFetch(tags) },
  });
}

/* Members */
export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabaseTagged(["members"])
    .from("members")
    .select("slug, data, level, entry_number, email")
    .neq("slug", "admin")
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const raw = (row.data ?? {}) as Partial<Member>;
    return {
      ...raw,
      slug: row.slug as string,
      name: raw.name ?? (row.slug as string),
      role: raw.role ?? "",
      tagline: raw.tagline ?? "",
      socials: raw.socials ?? [],
      blocks: raw.blocks ?? [],
      level: row.level as Member["level"],
      entryNumber: (row.entry_number as string | null) ?? undefined,
      email: (row.email as string | null) ?? undefined,
    };
  });
}

export async function getMember(slug: string): Promise<Member | undefined> {
  const { data, error } = await supabaseTagged(["members"])
    .from("members")
    .select("slug, data, level")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const raw = (data.data ?? {}) as Partial<Member>;
  return {
    ...raw,
    slug: data.slug as string,
    name: raw.name ?? (data.slug as string),
    role: raw.role ?? "",
    tagline: raw.tagline ?? "",
    socials: raw.socials ?? [],
    blocks: raw.blocks ?? [],
    level: data.level as Member["level"],
  };
}

/* Projects */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabaseTagged(["projects"])
    .from("projects")
    .select("data")
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => row.data as Project);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const { data, error } = await supabaseTagged(["projects"])
    .from("projects")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.data as Project | undefined;
}

/* Events */
export async function getEvents(): Promise<AriesEvent[]> {
  const { data, error } = await supabaseTagged(["events"])
    .from("events")
    .select("data")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as AriesEvent);
}

export async function getEvent(slug: string): Promise<AriesEvent | undefined> {
  const { data, error } = await supabaseTagged(["events"])
    .from("events")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.data as AriesEvent | undefined;
}

export async function splitEvents(now = new Date()) {
  const all = await getEvents();
  const today = now.toISOString().slice(0, 10);
  return {
    upcoming: all.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    past: all.filter((e) => e.date < today),
  };
}

/* Resources */
export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabaseTagged(["resources"])
    .from("resources")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as Resource[]) ?? [];
}

export async function getResource(slug: string): Promise<Resource | undefined> {
  const all = await getResources();
  return all.find((r) => r.slug === slug);
}

/* Sanity blog posts → Resources */

interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: any;
  publishedAt: string;
  body?: any[];
}

const BLOG_QUERY = `*[_type == "post"] | order(publishedAt desc) {
  _id, title, slug, mainImage, publishedAt, body
}`;

function extractExcerpt(body: any[] = []): string {
  const text = body
    .filter((b) => b._type === "block")
    .map((b) => b.children?.map((c: any) => c.text).join("") ?? "")
    .join(" ");
  return text.length > 200 ? text.slice(0, 197) + "…" : text;
}

function sanityPostToResource(post: SanityPost): SanityBlogResource {
  let coverImage: string | undefined;
  try {
    if (post.mainImage?.asset) {
      coverImage = urlFor(post.mainImage).width(800).height(450).url();
    }
  } catch { /* ignore missing images */ }

  return {
    slug: `blog-${post.slug.current}`,
    title: post.title,
    description: extractExcerpt(post.body),
    type: "Blog",
    addedOn: post.publishedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    featured: true,
    coverImage,
    _sanity: true,
    _sanitySlug: post.slug.current,
    _portableTextBody: post.body,
    _mainImage: post.mainImage,
  };
}

export async function getSanityBlogs(): Promise<SanityBlogResource[]> {
  try {
    const posts: SanityPost[] = await getClient().fetch(
      BLOG_QUERY,
      {},
      { next: { revalidate: 60 } },
    );
    return posts.map(sanityPostToResource);
  } catch {
    return [];
  }
}

export async function getSanityBlog(
  sanitySlug: string,
): Promise<SanityBlogResource | undefined> {
  try {
    const post: SanityPost | null = await getClient().fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        _id, title, slug, mainImage, publishedAt, body
      }`,
      { slug: sanitySlug },
      { next: { revalidate: 60 } },
    );
    if (!post) return undefined;
    return sanityPostToResource(post);
  } catch {
    return undefined;
  }
}

/** Fetch all resources (Supabase + Sanity blogs merged). */
export async function getAllResources(): Promise<Resource[]> {
  const [supabase, sanity] = await Promise.all([
    getResources(),
    getSanityBlogs(),
  ]);
  return [...supabase, ...sanity];
}

/* Team */
export async function getTeam(): Promise<TeamData> {
  const { data, error } = await supabaseTagged(["team"])
    .from("team")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as TeamData) ?? { years: [], alumni: [] };
}
