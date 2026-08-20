/**
 * Pull every Sanity `post` from the hosted Content Lake and write
 * content/sanity-export.json. Does not talk to D1.
 *
 * Blogs never lived in this git repo. On `main` they are documents in a
 * Sanity project (`NEXT_PUBLIC_SANITY_PROJECT_ID` + `NEXT_PUBLIC_SANITY_DATASET`),
 * queried with GROQ. Images are on cdn.sanity.io.
 *
 *   pnpm content:export-sanity
 *   pnpm content:export-sanity -- --download-images
 *
 * Then: pnpm content:ingest-sanity
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentRootFrom, envCandidates, loadEnvFiles } from "./lib-env.mjs";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFiles(envCandidates(webRoot));

const projectId = (
  process.env.SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  ""
).trim();
const dataset = (
  process.env.SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  "production"
).trim();
const apiVersion = (process.env.SANITY_API_VERSION || "2026-08-08").trim();
const token = (process.env.SANITY_TOKEN || process.env.SANITY_API_READ_TOKEN || "").trim();
const downloadImages = process.argv.includes("--download-images");

const QUERY = `*[_type == "post"] | order(publishedAt desc) {
  _id, title, slug, mainImage, publishedAt, body
}`;

function sanityImageRefToUrl(ref) {
  const match = /^image-(.+)-(\d+x\d+)-([a-z0-9]+)$/i.exec(ref ?? "");
  if (!match) return undefined;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${match[1]}-${match[2]}.${match[3]}`;
}

function spansToMarkdown(children, markDefs = []) {
  const defs = new Map((markDefs ?? []).map((d) => [d._key, d]));
  return (children ?? [])
    .map((child) => {
      if (child._type === "break") return "\n";
      let text = child.text ?? "";
      for (const mark of child.marks ?? []) {
        if (mark === "strong") text = `**${text}**`;
        else if (mark === "em") text = `*${text}*`;
        else if (mark === "code") text = `\`${text}\``;
        else {
          const def = defs.get(mark);
          if (def?._type === "link" && def.href) text = `[${text}](${def.href})`;
        }
      }
      return text;
    })
    .join("");
}

function portableTextToMarkdown(body, imageUrl) {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (!Array.isArray(body)) return "";
  const lines = [];
  let listBuf = null;
  const flushList = () => {
    if (!listBuf) return;
    listBuf.items.forEach((item, i) => {
      lines.push(listBuf.kind === "number" ? `${i + 1}. ${item}` : `- ${item}`);
    });
    lines.push("");
    listBuf = null;
  };
  for (const raw of body) {
    if (raw?._type === "image") {
      flushList();
      const url = raw.asset?._ref ? imageUrl(raw.asset._ref) : undefined;
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
    if (raw.style === "h1") lines.push(`# ${text}`, "");
    else if (raw.style === "h2") lines.push(`## ${text}`, "");
    else if (raw.style === "h3") lines.push(`### ${text}`, "");
    else if (raw.style === "h4") lines.push(`#### ${text}`, "");
    else if (raw.style === "blockquote") lines.push(`> ${text}`, "");
    else lines.push(text, "");
  }
  flushList();
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function excerptFromMarkdown(markdown, max = 200) {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function extOf(url) {
  const m = /\.([a-z0-9]+)(?:\?|$)/i.exec(url);
  return (m?.[1] ?? "jpg").toLowerCase();
}

if (!projectId) {
  console.error(
    "Missing SANITY_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID from the main-branch .env).",
  );
  process.exit(1);
}

const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
url.searchParams.set("query", QUERY);
const headers = { Accept: "application/json" };
if (token) headers.Authorization = `Bearer ${token}`;

const res = await fetch(url, { headers });
if (!res.ok) {
  console.error(`Sanity query failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const payload = await res.json();
const posts = payload.result ?? [];

const contentRoot = contentRootFrom(webRoot);
const publicRoot = fs.existsSync(path.join(webRoot, "..", "public"))
  ? path.join(webRoot, "..", "public")
  : path.join(webRoot, "public");
const mediaDir = path.join(publicRoot, "images", "resources");

const resources = [];
for (const post of posts) {
  const current = post.slug?.current;
  if (!current) continue;
  const slug = current.startsWith("blog-") ? current : `blog-${current}`;
  let cover = post.mainImage?.asset?._ref
    ? sanityImageRefToUrl(post.mainImage.asset._ref)
    : undefined;
  const bodyImages = new Map();
  const imageUrl = (ref) => {
    if (bodyImages.has(ref)) return bodyImages.get(ref);
    return sanityImageRefToUrl(ref);
  };

  if (downloadImages) {
    if (cover) {
      const file = `${slug}-cover.${extOf(cover)}`;
      await download(cover, path.join(mediaDir, file));
      cover = `/images/resources/${file}`;
    }
    let n = 0;
    for (const block of post.body ?? []) {
      const ref = block?._type === "image" ? block.asset?._ref : undefined;
      if (!ref) continue;
      const remote = sanityImageRefToUrl(ref);
      if (!remote) continue;
      n += 1;
      const file = `${slug}-${n}.${extOf(remote)}`;
      await download(remote, path.join(mediaDir, file));
      bodyImages.set(ref, `/images/resources/${file}`);
    }
  }

  const body = portableTextToMarkdown(post.body, imageUrl);
  resources.push({
    slug,
    title: post.title,
    description: excerptFromMarkdown(body),
    type: "Blog",
    addedOn: (post.publishedAt ?? "2024-01-01").slice(0, 10),
    body,
    featured: true,
    coverImage: cover,
    _sanity: true,
  });
}

fs.mkdirSync(contentRoot, { recursive: true });
const outFile = path.join(contentRoot, "sanity-export.json");
fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      projectId,
      dataset,
      count: resources.length,
      posts: resources,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Exported ${resources.length} Sanity posts → ${outFile}`);
if (downloadImages) console.log(`Cover/inline images under ${mediaDir}`);
console.log("Next: pnpm content:ingest-sanity");
