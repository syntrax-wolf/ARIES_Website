import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMemoryDocumentDb,
  createWritableStore,
  seedDocumentDb,
} from "./d1.ts";

const project = {
  slug: "alpha-bot",
  name: "Alpha",
  tagline: "Voice agents for campus",
  description: "A club Project.",
  category: "AI / ML",
  tags: ["nlp"],
};

test("seed fixture then getProject returns that name", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { projects: [project] });
  const store = createWritableStore(db);

  const found = await store.getProject("alpha-bot");
  assert.equal(found?.name, "Alpha");
  assert.equal(found?.tagline, "Voice agents for campus");
  assert.deepEqual(await store.listAllowlist(), []);
});

test("save a Project then getProject shows the new tagline", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { projects: [project] });
  const store = createWritableStore(db);

  await store.saveProject({ ...project, tagline: "Campus voice, rewritten" });
  const found = await store.getProject("alpha-bot");
  assert.equal(found?.name, "Alpha");
  assert.equal(found?.tagline, "Campus voice, rewritten");
});
