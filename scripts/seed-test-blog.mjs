#!/usr/bin/env node
/**
 * Seed a test blog post into Sanity.
 *
 * Usage:
 *   SANITY_TOKEN=<write-token> node scripts/seed-test-blog.mjs
 *
 * Or just create it manually in /studio — this script is a convenience.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_TOKEN;

if (!projectId || !token) {
  console.error(
    "Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_TOKEN (write token from sanity.io/manage)."
  );
  process.exit(1);
}

const doc = {
  _id: "test-blog-post",
  _type: "post",
  title: "Welcome to ARIES Blogs",
  slug: { _type: "slug", current: "welcome-to-aries-blogs" },
  publishedAt: new Date().toISOString(),
  body: [
    {
      _type: "block",
      _key: "intro1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s1",
          text: "This is a test blog post created to verify the Sanity CMS integration with the ARIES website. Blog posts authored in Sanity Studio now appear seamlessly in the Resources section, wrapped in the familiar ARIES UI.",
        },
      ],
      markDefs: [],
    },
    {
      _type: "block",
      _key: "heading1",
      style: "h2",
      children: [
        { _type: "span", _key: "s2", text: "Why Sanity + ARIES?" },
      ],
      markDefs: [],
    },
    {
      _type: "block",
      _key: "body1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s3",
          text: "Sanity provides a powerful headless CMS with real-time collaborative editing, structured content, and a flexible Studio interface. By rendering blog content inside the ARIES design system, readers get a consistent experience across the entire website — no jarring UI switches.",
        },
      ],
      markDefs: [],
    },
    {
      _type: "block",
      _key: "heading2",
      style: "h2",
      children: [
        { _type: "span", _key: "s4", text: "What You Can Do" },
      ],
      markDefs: [],
    },
    {
      _type: "block",
      _key: "list1",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "s5",
          text: "Write rich blog posts with headings, lists, images, and code blocks",
        },
      ],
      markDefs: [],
    },
    {
      _type: "block",
      _key: "list2",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "s6",
          text: "Collaborate with other ARIES members in real-time on drafts",
        },
      ],
      markDefs: [],
    },
    {
      _type: "block",
      _key: "list3",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "s7",
          text: "Published posts automatically appear in the Resources section as Blog entries",
        },
      ],
      markDefs: [],
    },
    {
      _type: "block",
      _key: "list4",
      style: "normal",
      listItem: "bullet",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "s8",
          text: "Old /blog links redirect seamlessly to the new unified pages",
        },
      ],
      markDefs: [],
    },
    {
      _type: "block",
      _key: "closing",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s9",
          text: "Head over to ",
        },
        {
          _type: "span",
          _key: "s10",
          marks: ["strong"],
          text: "/studio",
        },
        {
          _type: "span",
          _key: "s11",
          text: " to start writing your next blog post!",
        },
      ],
      markDefs: [],
    },
  ],
};

const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    mutations: [{ createOrReplace: doc }],
  }),
});

if (!res.ok) {
  console.error("Failed:", res.status, await res.text());
  process.exit(1);
}

console.log("✓ Test blog post created: 'Welcome to ARIES Blogs'");
console.log("  → Will appear at /resources/blog-welcome-to-aries-blogs");
