import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canDirectPublish,
  canEnqueueChangeRequest,
  canManageAllowlist,
  canManageRoster,
  canPublishResource,
} from "./permissions.ts";

const LEADERSHIP = ["oc", "co_overall_coordinator", "research_lead"] as const;

test("Leadership may direct-publish any Project or Event", () => {
  for (const level of LEADERSHIP) {
    assert.equal(canDirectPublish(level, false), true);
    assert.equal(canDirectPublish(level, true), true);
  }
});

test("a Coordinator may direct-publish only when Listed", () => {
  assert.equal(canDirectPublish("coordinator", true), true);
  assert.equal(canDirectPublish("coordinator", false), false);
});

test("an Executive may only enqueue a Change Request, and only when Listed", () => {
  assert.equal(canDirectPublish("executive", true), false);
  assert.equal(canDirectPublish("executive", false), false);
  assert.equal(canEnqueueChangeRequest("executive", true), true);
  assert.equal(canEnqueueChangeRequest("executive", false), false);
});

test("a Blogger may publish a Resource and not a Project", () => {
  assert.equal(canPublishResource("blogger"), true);
  assert.equal(canDirectPublish("blogger", true), false);
  assert.equal(canEnqueueChangeRequest("blogger", true), false);
});

test("Leadership may manage the Roster and Allowlist; others may not", () => {
  for (const level of LEADERSHIP) {
    assert.equal(canManageRoster(level), true);
    assert.equal(canManageAllowlist(level), true);
  }
  for (const level of ["coordinator", "executive", "blogger", "member", "alumni", "visitor"]) {
    assert.equal(canManageRoster(level), false);
    assert.equal(canManageAllowlist(level), false);
  }
});
