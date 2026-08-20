import type { Resource } from "../types.ts";

export type SanityPostInput = {
  slug: string | { current?: string };
  title: string;
  description?: string;
  publishedAt?: string;
  body?: string | unknown[];
  coverImage?: string;
  mainImage?: { asset?: { _ref?: string; url?: string } };
  featured?: boolean;
};

type PortableSpan = {
  _type?: string;
  text?: string;
  marks?: string[];
};

type PortableBlock = {
  _type?: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  children?: PortableSpan[];
  markDefs?: Array<{ _key: string; _type?: string; href?: string }>;
  asset?: { _ref?: string };
  alt?: string;
  caption?: string;
};

/** Sanity asset `_ref` → `cdn.sanity.io` URL. */
export function sanityImageRefToUrl(
  ref: string,
  projectId: string,
  dataset: string,
): string | undefined {
  const match = /^image-(.+)-(\d+x\d+)-([a-z0-9]+)$/i.exec(ref);
  if (!match) return undefined;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${match[1]}-${match[2]}.${match[3]}`;
}

function spansToMarkdown(
  children: PortableSpan[] | undefined,
  markDefs: PortableBlock["markDefs"] = [],
): string {
  const defs = new Map((markDefs ?? []).map((d) => [d._key, d]));
  return (children ?? [])
    .map((child) => {
      if (child._type === "break") return "\n";
      let text = child.text ?? "";
      for (const mark of child.marks ?? []) {
        if (mark === "strong") text = `**${text}**`;
        else if (mark === "em") text = `*${text}*`;
        else if (mark === "code") text = `\`${text}\``;
        else if (mark === "underline") text = text;
        else {
          const def = defs.get(mark);
          if (def?._type === "link" && def.href) text = `[${text}](${def.href})`;
        }
      }
      return text;
    })
    .join("");
}

function excerptFromMarkdown(markdown: string, max = 200): string {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Convert Sanity Portable Text (or a markdown string) into markdown for Resource.body.
 * `imageUrl` rewrites image blocks; otherwise image blocks are dropped.
 */
export function portableTextToMarkdown(
  body: string | unknown[] | undefined,
  imageUrl?: (ref: string) => string | undefined,
): string {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (!Array.isArray(body)) return "";

  const lines: string[] = [];
  let listBuf: { kind: "bullet" | "number"; items: string[] } | null = null;

  const flushList = () => {
    if (!listBuf) return;
    listBuf.items.forEach((item, i) => {
      lines.push(listBuf!.kind === "number" ? `${i + 1}. ${item}` : `- ${item}`);
    });
    lines.push("");
    listBuf = null;
  };

  for (const raw of body as PortableBlock[]) {
    if (raw?._type === "image") {
      flushList();
      const ref = raw.asset?._ref;
      const url = ref && imageUrl ? imageUrl(ref) : undefined;
      if (url) {
        const alt = raw.alt || raw.caption || "";
        lines.push(`![${alt}](${url})`);
        if (raw.caption) lines.push(`*${raw.caption}*`);
        lines.push("");
      }
      continue;
    }
    if (raw?._type && raw._type !== "block") continue;

    const text = spansToMarkdown(raw.children, raw.markDefs).trim();
    if (raw.listItem) {
      if (!listBuf || listBuf.kind !== raw.listItem) {
        flushList();
        listBuf = { kind: raw.listItem, items: [] };
      }
      listBuf.items.push(text);
      continue;
    }
    flushList();
    if (!text) {
      lines.push("");
      continue;
    }
    switch (raw.style) {
      case "h1":
        lines.push(`# ${text}`, "");
        break;
      case "h2":
        lines.push(`## ${text}`, "");
        break;
      case "h3":
        lines.push(`### ${text}`, "");
        break;
      case "h4":
        lines.push(`#### ${text}`, "");
        break;
      case "blockquote":
        lines.push(`> ${text}`, "");
        break;
      default:
        lines.push(text, "");
    }
  }
  flushList();
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function slugOf(post: SanityPostInput): string {
  const raw = typeof post.slug === "string" ? post.slug : (post.slug?.current ?? "");
  return raw.startsWith("blog-") ? raw : `blog-${raw}`;
}

function coverOf(
  post: SanityPostInput,
  imageUrl?: (ref: string) => string | undefined,
): string | undefined {
  if (post.coverImage) return post.coverImage;
  const ref = post.mainImage?.asset?._ref;
  if (ref && imageUrl) return imageUrl(ref);
  return post.mainImage?.asset?.url;
}

/** Map a former Sanity post JSON dump onto a Resource. No Sanity client. */
export function resourceFromSanityPost(
  post: SanityPostInput,
  imageUrl?: (ref: string) => string | undefined,
): Resource {
  const body = portableTextToMarkdown(post.body, imageUrl);
  return {
    slug: slugOf(post),
    title: post.title,
    description: post.description?.trim() || excerptFromMarkdown(body),
    type: "Blog",
    addedOn: (post.publishedAt ?? "2024-01-01").slice(0, 10),
    body,
    featured: post.featured ?? true,
    coverImage: coverOf(post, imageUrl),
    _sanity: true,
  };
}

export function importSanityPosts(
  posts: SanityPostInput[],
  imageUrl?: (ref: string) => string | undefined,
): Resource[] {
  return posts.filter((p) => slugOf(p) !== "blog-").map((p) => resourceFromSanityPost(p, imageUrl));
}

/** Upsert imported Sanity blogs by slug; leave non-overlapping Resources in place. */
export function mergeSanityResources(existing: Resource[], imported: Resource[]): Resource[] {
  const incoming = new Map(imported.map((r) => [r.slug, r]));
  const kept = existing.filter((r) => !incoming.has(r.slug));
  return [...kept, ...imported].sort(
    (a, b) => b.addedOn.localeCompare(a.addedOn) || a.slug.localeCompare(b.slug),
  );
}
