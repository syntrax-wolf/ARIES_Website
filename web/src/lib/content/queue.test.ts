import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryDocumentDb, createWritableStore, seedDocumentDb } from "./d1.ts";
import { publishProject, type Actor } from "./publish.ts";
import { approveChangeRequest, enqueueJoinRequest, rejectChangeRequest } from "./queue.ts";

const project = {
  slug: "alpha-bot",
  name: "Alpha",
  tagline: "Voice agents for campus",
  description: "A club Project.",
  category: "AI / ML",
  tags: ["nlp"],
  contributors: [{ name: "Eve Exec", slug: "eve-exec", kind: "member" as const }],
};

function executive(): Actor {
  return {
    session: { kind: "kerberos", kerberos: "exec1", exp: 0 },
    level: "executive",
    memberSlug: "eve-exec",
  };
}

function leadership(): Actor {
  return {
    session: { kind: "kerberos", kerberos: "oc1", exp: 0 },
    level: "oc",
    memberSlug: "ada-lovelace",
  };
}

test("Executive enqueue leaves the public Project unchanged until approve", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { projects: [project] });
  const store = createWritableStore(db);

  const queued = await publishProject(store, executive(), {
    ...project,
    tagline: "Queued rewrite",
  });
  assert.equal(queued.ok, true);
  if (queued.ok) assert.equal(queued.mode, "pending");
  assert.equal((await store.getProject("alpha-bot"))?.tagline, "Voice agents for campus");
  const inbox = await store.listChangeRequests();
  assert.equal(inbox.length, 1);

  const approved = await approveChangeRequest(store, leadership(), inbox[0]!.id);
  assert.equal(approved.ok, true);
  assert.equal((await store.getProject("alpha-bot"))?.tagline, "Queued rewrite");
  assert.equal((await store.listChangeRequests()).length, 0);
});

test("reject deletes the request and leaves the public Project unchanged", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { projects: [project] });
  const store = createWritableStore(db);

  await publishProject(store, executive(), { ...project, tagline: "Should bounce" });
  const inbox = await store.listChangeRequests();
  const rejected = await rejectChangeRequest(store, leadership(), inbox[0]!.id);
  assert.equal(rejected.ok, true);
  assert.equal((await store.getProject("alpha-bot"))?.tagline, "Voice agents for campus");
  assert.equal((await store.listChangeRequests()).length, 0);
});

test("join-request approve adds the Member as Contributor", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, {
    projects: [{ ...project, contributors: [{ name: "Ada", slug: "ada-lovelace", kind: "member" }] }],
  });
  const store = createWritableStore(db);
  const joiner: Actor = {
    session: { kind: "kerberos", kerberos: "exec1", exp: 0 },
    level: "executive",
    memberSlug: "eve-exec",
  };

  const queued = await enqueueJoinRequest(store, joiner, "projects", "alpha-bot", "Eve Exec");
  assert.equal(queued.ok, true);
  const inbox = await store.listChangeRequests();
  const approved = await approveChangeRequest(store, leadership(), inbox[0]!.id);
  assert.equal(approved.ok, true);
  const people = (await store.getProject("alpha-bot"))?.contributors ?? [];
  assert.equal(
    people.some((c) => (typeof c === "string" ? c : c.slug) === "eve-exec"),
    true,
  );
});
