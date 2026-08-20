import assert from "node:assert/strict";
import { test } from "node:test";
import { createContentStore } from "./store.ts";
import {
  importSanityPosts,
  mergeSanityResources,
  portableTextToMarkdown,
  resourceFromSanityPost,
  sanityImageRefToUrl,
} from "./sanity-import.ts";

test("imported fixture post is returned as a Resource of type Blog", () => {
  const resources = importSanityPosts([
    {
      slug: "attention-is-all-you-need",
      title: "Attention is all you need (club notes)",
      description: "Folded from Studio.",
      publishedAt: "2023-11-02",
      body: "The transformer paper, for campus.",
    },
  ]);
  const store = createContentStore({ resources });
  const post = store.getResource("blog-attention-is-all-you-need");
  assert.equal(post?.type, "Blog");
  assert.equal(post?.title, "Attention is all you need (club notes)");
  assert.equal(post?._sanity, true);
});

test("portable text blocks become markdown and Sanity image refs become CDN URLs", () => {
  const md = portableTextToMarkdown(
    [
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Why transformers" }],
      },
      {
        _type: "block",
        style: "normal",
        markDefs: [{ _key: "l1", _type: "link", href: "https://example.com" }],
        children: [
          { _type: "span", text: "Read " },
          { _type: "span", text: "the paper", marks: ["strong", "l1"] },
        ],
      },
      {
        _type: "image",
        alt: "diagram",
        asset: { _ref: "image-abc123-800x450-png" },
      },
    ],
    (ref) => sanityImageRefToUrl(ref, "proj", "production"),
  );
  assert.match(md, /^## Why transformers/m);
  assert.match(md, /\*\*the paper\*\*/);
  assert.match(md, /\[.*\]\(https:\/\/example.com\)/);
  assert.match(md, /!\[diagram\]\(https:\/\/cdn.sanity.io\/images\/proj\/production\/abc123-800x450.png\)/);
});

test("merge replaces overlapping Sanity slugs and keeps other Resources", () => {
  const merged = mergeSanityResources(
    [
      { slug: "huggingface-course", title: "HF", description: "", type: "Course", addedOn: "2024-01-08" },
      { slug: "blog-old", title: "Stale", description: "", type: "Blog", addedOn: "2023-01-01" },
    ],
    [
      resourceFromSanityPost({
        slug: { current: "old" },
        title: "Fresh",
        publishedAt: "2024-06-01",
        body: "Updated body.",
      }),
    ],
  );
  assert.equal(merged.find((r) => r.slug === "huggingface-course")?.title, "HF");
  assert.equal(merged.find((r) => r.slug === "blog-old")?.title, "Fresh");
});
