import assert from "node:assert/strict";
import { test } from "node:test";
import { triggerRebuild } from "./rebuild.ts";

test("a missing hook URL is skipped so local saves still succeed", async () => {
  const result = await triggerRebuild(undefined, async () => {
    throw new Error("should not fetch");
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.skipped, true);
});

test("a failing hook surfaces the error after the write already happened", async () => {
  const result = await triggerRebuild("https://example.test/rebuild", async () => {
    return new Response("no", { status: 500 });
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /500/);
});
