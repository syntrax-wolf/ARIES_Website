import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryDocumentDb, createWritableStore } from "./d1.ts";
import { addAllowlistKerberos, gateForKerberos, removeAllowlistKerberos } from "./allowlist.ts";
import type { Actor } from "./publish.ts";

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

test("add then Gate allows; remove then Gate denies", async () => {
  const store = createWritableStore(createMemoryDocumentDb());
  assert.equal((await gateForKerberos(store, "cs1230001")).ok, false);

  const added = await addAllowlistKerberos(store, oc(), "cs1230001");
  assert.equal(added.ok, true);
  assert.equal((await gateForKerberos(store, "cs1230001")).ok, true);

  const removed = await removeAllowlistKerberos(store, oc(), "cs1230001");
  assert.equal(removed.ok, true);
  assert.equal((await gateForKerberos(store, "cs1230001")).ok, false);
});

test("a Coordinator cannot write the Allowlist", async () => {
  const store = createWritableStore(createMemoryDocumentDb());
  const result = await addAllowlistKerberos(store, coordinator(), "cs1230001");
  assert.equal(result.ok, false);
  assert.equal((await gateForKerberos(store, "cs1230001")).ok, false);
});

test("an empty Allowlist means only Admin password works", async () => {
  const store = createWritableStore(createMemoryDocumentDb());
  assert.deepEqual(await store.listAllowlist(), []);
  assert.equal((await gateForKerberos(store, "anyone")).ok, false);
});
