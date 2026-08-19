import assert from "node:assert/strict";
import { test } from "node:test";
import { createContentStore } from "./store.ts";

test("a known Project slug returns that name and tagline", () => {
  const store = createContentStore({
    projects: [
      {
        slug: "alpha-bot",
        name: "Alpha",
        tagline: "Voice agents for campus",
        description: "A club Project.",
        category: "AI / ML",
        tags: ["nlp"],
      },
    ],
  });

  const project = store.getProject("alpha-bot");
  assert.equal(project?.name, "Alpha");
  assert.equal(project?.tagline, "Voice agents for campus");
});

test("a missing Project slug is empty", () => {
  const store = createContentStore({
    projects: [
      {
        slug: "alpha-bot",
        name: "Alpha",
        tagline: "Voice agents for campus",
        description: "A club Project.",
        category: "AI / ML",
        tags: ["nlp"],
      },
    ],
  });

  assert.equal(store.getProject("missing"), undefined);
});
