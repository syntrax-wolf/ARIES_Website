import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryDocumentDb, createWritableStore, seedDocumentDb } from "./d1.ts";
import { publishProject, type Actor } from "./publish.ts";

const project = {
  slug: "alpha-bot",
  name: "Alpha",
  tagline: "Voice agents for campus",
  description: "A club Project.",
  category: "AI / ML",
  tags: ["nlp"],
  contributors: [{ name: "Grace Hopper", slug: "grace-hopper", kind: "member" as const }],
};

function leadership(): Actor {
  return {
    session: { kind: "kerberos", kerberos: "oc1", exp: 0 },
    level: "oc",
    memberSlug: "ada-lovelace",
  };
}

test("Leadership save then getProject shows the new tagline", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { projects: [project] });
  const store = createWritableStore(db);

  const result = await publishProject(store, leadership(), {
    ...project,
    tagline: "Campus voice, rewritten",
  });
  assert.equal(result.ok, true);
  assert.equal((await store.getProject("alpha-bot"))?.tagline, "Campus voice, rewritten");
  const log = await store.listChangeLog("projects", "alpha-bot");
  assert.equal(log.length, 1);
  assert.equal(log[0]?.actor, "ada-lovelace");
});

test("a Coordinator not Listed is refused", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { projects: [project] });
  const store = createWritableStore(db);
  const coordinator: Actor = {
    session: { kind: "kerberos", kerberos: "coord1", exp: 0 },
    level: "coordinator",
    memberSlug: "not-on-the-project",
  };

  const result = await publishProject(store, coordinator, {
    ...project,
    tagline: "Should not stick",
  });
  assert.equal(result.ok, false);
  assert.equal((await store.getProject("alpha-bot"))?.tagline, "Voice agents for campus");
});
