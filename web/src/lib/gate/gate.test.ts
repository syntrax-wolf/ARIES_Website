import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decideAdminGate,
  decideKerberosGate,
  decideSignup,
  mintSessionCookie,
  readSessionCookie,
} from "./gate.ts";

test("an Allowlisted Kerberos receives a Session", () => {
  const decision = decideKerberosGate("cs1230001", ["cs1230001", "cs1230002"]);
  assert.equal(decision.ok, true);
  if (decision.ok) {
    assert.equal(decision.session.kind, "kerberos");
    assert.equal(decision.session.kerberos, "cs1230001");
  }
});

test("a Kerberos not on the Allowlist is refused", () => {
  const decision = decideKerberosGate("stranger", ["cs1230001"]);
  assert.equal(decision.ok, false);
  if (!decision.ok) {
    assert.match(decision.error, /Allowlist/);
  }
});

test("the Admin password matching the secret mints an Admin Session", () => {
  const decision = decideAdminGate("admin", "correct-horse", "correct-horse");
  assert.equal(decision.ok, true);
  if (decision.ok) assert.equal(decision.session.kind, "admin");
});

test("any other email or password is refused", () => {
  assert.equal(decideAdminGate("admin", "wrong", "correct-horse").ok, false);
  assert.equal(decideAdminGate("blogger", "correct-horse", "correct-horse").ok, false);
  assert.equal(decideAdminGate("member", "secret", "correct-horse").ok, false);
});

test("a minted Session cookie round-trips", () => {
  const secret = "signing-secret";
  const cookie = mintSessionCookie({ kind: "kerberos", kerberos: "cs1230001" }, secret);
  const session = readSessionCookie(cookie, secret);
  assert.equal(session?.kind, "kerberos");
  assert.equal(session?.kerberos, "cs1230001");
  assert.equal(readSessionCookie(cookie, "other-secret"), null);
});

test("signup is refused", () => {
  const decision = decideSignup();
  assert.equal(decision.ok, false);
  if (!decision.ok) assert.match(decision.error, /no signup/i);
});
