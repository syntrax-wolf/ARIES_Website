import { canManageAllowlist } from "../../../../src/lib/permissions.ts";
import { decideKerberosGate } from "../gate/gate.ts";
import type { WritableContentStore } from "./d1.ts";
import type { Actor, PublishResult } from "./publish.ts";

export async function addAllowlistKerberos(
  store: WritableContentStore,
  actor: Actor,
  kerberos: string,
): Promise<PublishResult> {
  if (actor.session.kind !== "admin" && !canManageAllowlist(actor.level)) {
    return { ok: false, error: "Only Leadership can change the Allowlist" };
  }
  const id = kerberos.trim().toLowerCase();
  if (!id) return { ok: false, error: "Kerberos is required" };
  await store.addAllowlist(id);
  return { ok: true, mode: "direct" };
}

export async function removeAllowlistKerberos(
  store: WritableContentStore,
  actor: Actor,
  kerberos: string,
): Promise<PublishResult> {
  if (actor.session.kind !== "admin" && !canManageAllowlist(actor.level)) {
    return { ok: false, error: "Only Leadership can change the Allowlist" };
  }
  await store.removeAllowlist(kerberos);
  return { ok: true, mode: "direct" };
}

export async function gateForKerberos(store: WritableContentStore, kerberos: string) {
  return decideKerberosGate(kerberos, await store.listAllowlist());
}
