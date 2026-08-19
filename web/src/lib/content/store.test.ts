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

test("a Team Year with one core Member is returned by the reader", () => {
  const store = createContentStore({
    team: {
      years: [
        {
          year: "2026-27",
          coreTeam: [
            { name: "Ada Lovelace", role: "Overall Coordinator", slug: "ada-lovelace" },
          ],
          coordinators: [],
          executives: [],
        },
      ],
      alumni: [{ name: "Former Member", role: "Engineer", org: "Acme", slug: "former-member" }],
    },
  });

  const team = store.getTeam();
  assert.equal(team.years[0]?.year, "2026-27");
  assert.equal(team.years[0]?.coreTeam[0]?.name, "Ada Lovelace");
  assert.equal(team.years[0]?.coreTeam[0]?.slug, "ada-lovelace");
  assert.equal(team.alumni[0]?.name, "Former Member");
});

test("a past Event and a future Event land in the right lists", () => {
  const store = createContentStore({
    events: [
      {
        slug: "old-talk",
        title: "Old Talk",
        type: "Talk",
        date: "2024-01-15",
        description: "Already happened.",
        links: [],
      },
      {
        slug: "future-workshop",
        title: "Future Workshop",
        type: "Workshop",
        date: "2027-12-01",
        description: "Has not happened yet.",
        links: [],
      },
    ],
  });

  const { upcoming, past } = store.splitEvents(new Date("2026-08-19T12:00:00Z"));
  assert.deepEqual(
    upcoming.map((e) => e.slug),
    ["future-workshop"],
  );
  assert.deepEqual(
    past.map((e) => e.slug),
    ["old-talk"],
  );
  assert.equal(store.getEvent("old-talk")?.title, "Old Talk");
  assert.equal(store.getEvent("old-talk")?.type, "Talk");
  assert.equal(store.getEvent("missing"), undefined);
});

test("a fixture Resource is retrievable by slug", () => {
  const store = createContentStore({
    resources: [
      {
        slug: "intro-to-transformers-notes",
        title: "Intro to Transformers",
        description: "Club notes from the talk.",
        type: "Blog",
        addedOn: "2024-03-12",
        body: "Attention is all you need, in practice.",
      },
    ],
  });

  const resource = store.getResource("intro-to-transformers-notes");
  assert.equal(resource?.title, "Intro to Transformers");
  assert.equal(resource?.type, "Blog");
  assert.equal(store.getResource("missing"), undefined);
});

test("a Member with a text Block is retrievable and hidden Levels stay off the public list", () => {
  const store = createContentStore({
    members: [
      {
        slug: "ada-lovelace",
        name: "Ada Lovelace",
        role: "Overall Coordinator",
        tagline: "Notes on computing.",
        socials: [],
        blocks: [{ id: "about", type: "text", span: "full", title: "About", data: "I write programs." }],
        level: "oc",
      },
      {
        slug: "admin",
        name: "Bootstrap Admin",
        role: "Admin",
        tagline: "",
        socials: [],
        blocks: [],
      },
      {
        slug: "blogger",
        name: "Club Blogger",
        role: "Blogger",
        tagline: "",
        socials: [],
        blocks: [],
        level: "blogger",
      },
      {
        slug: "guest-speaker",
        name: "Guest Speaker",
        role: "Visitor",
        tagline: "",
        socials: [],
        blocks: [],
        level: "visitor",
      },
    ],
  });

  const member = store.getMember("ada-lovelace");
  assert.equal(member?.name, "Ada Lovelace");
  assert.equal(member?.blocks[0]?.type, "text");
  assert.deepEqual(
    store.listPublicMembers().map((m) => m.slug),
    ["ada-lovelace"],
  );
});
