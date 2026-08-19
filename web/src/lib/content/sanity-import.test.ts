import assert from "node:assert/strict";
import { test } from "node:test";
import { createContentStore } from "./store.ts";
import { importSanityPosts } from "./sanity-import.ts";

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
});
