import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryDocumentDb, createWritableStore, seedDocumentDb } from "./d1.ts";
import { ensureVisitor, mergeRoster, saveProfile, saveTeamData } from "./roster.ts";
import type { Actor } from "./publish.ts";

const ada = {
  slug: "ada-lovelace",
  name: "Ada Lovelace",
  role: "Overall Coordinator",
  tagline: "Notes",
  socials: [],
  level: "oc" as const,
  blocks: [
    {
      id: "about",
      type: "text" as const,
      span: "full" as const,
      title: "About",
      data: "Keep this Block.",
    },
  ],
};

const grace = {
  slug: "grace-hopper",
  name: "Grace Hopper",
  role: "Coordinator",
  tagline: "Compilers",
  socials: [],
  level: "coordinator" as const,
  blocks: [],
};

function oc(): Actor {
  return {
    session: { kind: "kerberos", kerberos: "oc1", exp: 0 },
    level: "oc",
    memberSlug: "ada-lovelace",
  };
}

function coordinator(): Actor {
  return {
    session: { kind: "kerberos", kerberos: "coord1", exp: 0 },
    level: "coordinator",
    memberSlug: "grace-hopper",
  };
}

test("own Profile save is allowed", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { members: [grace] });
  const store = createWritableStore(db);
  const result = await saveProfile(store, coordinator(), {
    ...grace,
    tagline: "Compilers, then community.",
  });
  assert.equal(result.ok, true);
  assert.equal((await store.getMember("grace-hopper"))?.tagline, "Compilers, then community.");
});

test("other Profile save is denied unless Leadership", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { members: [ada, grace] });
  const store = createWritableStore(db);
  const denied = await saveProfile(store, coordinator(), { ...ada, tagline: "Nope" });
  assert.equal(denied.ok, false);
  assert.equal((await store.getMember("ada-lovelace"))?.tagline, "Notes");

  const allowed = await saveProfile(store, oc(), { ...grace, tagline: "Leadership edit" });
  assert.equal(allowed.ok, true);
  assert.equal((await store.getMember("grace-hopper"))?.tagline, "Leadership edit");
});

test("Roster merge preserves Profile Blocks", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { members: [ada] });
  const store = createWritableStore(db);
  const result = await mergeRoster(store, oc(), {
    slug: "ada-lovelace",
    name: "Ada L.",
    role: "OC",
    tagline: "New tagline",
  });
  assert.equal(result.ok, true);
  const saved = await store.getMember("ada-lovelace");
  assert.equal(saved?.name, "Ada L.");
  assert.equal(saved?.blocks?.[0]?.id, "about");
  assert.equal(saved?.blocks?.[0]?.data, "Keep this Block.");
});

test("Team Year photos and Alumni are Leadership-only", async () => {
  const db = createMemoryDocumentDb();
  await seedDocumentDb(db, { team: { years: [], alumni: [] } });
  const store = createWritableStore(db);
  const denied = await saveTeamData(store, coordinator(), {
    years: [],
    alumni: [{ name: "Alum", role: "SWE", org: "Lab" }],
  });
  assert.equal(denied.ok, false);
  const allowed = await saveTeamData(store, oc(), {
    years: [{ year: "2026-27", coreTeam: [], coordinators: [], executives: [], photos: ["/team.jpg"] }],
    alumni: [{ name: "Alum", role: "SWE", org: "Lab" }],
  });
  assert.equal(allowed.ok, true);
  assert.equal((await store.getTeam()).alumni[0]?.name, "Alum");
});

test("Visitor create from the people picker still works", async () => {
  const db = createMemoryDocumentDb();
  const store = createWritableStore(db);
  const result = await ensureVisitor(store, oc(), { slug: "guest-speaker", name: "Guest Speaker" });
  assert.equal(result.ok, true);
  const guest = await store.getMember("guest-speaker");
  assert.equal(guest?.level, "visitor");
  assert.equal(guest?.name, "Guest Speaker");
});
