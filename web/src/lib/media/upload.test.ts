import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryR2, IMAGE_MAX, planUpload, storeUpload, VIDEO_MAX } from "./upload.ts";

test("reject a huge image before store", () => {
  const plan = planUpload({
    filename: "hero.jpg",
    size: IMAGE_MAX + 1,
    kind: "projects",
    level: "oc",
  });
  assert.equal(plan.ok, false);
});

test("reject an executable", () => {
  const plan = planUpload({
    filename: "payload.exe",
    size: 12,
    kind: "projects",
    level: "oc",
  });
  assert.equal(plan.ok, false);
});

test("accept jpeg and return two WebP object keys", async () => {
  const plan = planUpload({
    filename: "hero.jpg",
    size: 80_000,
    kind: "projects",
    level: "oc",
  });
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.ok(plan.keys.small?.endsWith(".webp"));
  assert.ok(plan.keys.large?.endsWith(".webp"));
  const r2 = createMemoryR2();
  await storeUpload(r2, plan, {
    small: new Uint8Array([1, 2, 3]),
    large: new Uint8Array([4, 5, 6]),
  });
  assert.deepEqual(r2.keys(), [plan.keys.large, plan.keys.small].sort());
});

test("reject a video over the clip cap", () => {
  const plan = planUpload({
    filename: "clip.mp4",
    size: VIDEO_MAX + 1,
    kind: "events",
    level: "coordinator",
  });
  assert.equal(plan.ok, false);
});
