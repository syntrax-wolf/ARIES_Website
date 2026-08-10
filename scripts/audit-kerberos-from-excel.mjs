/**
 * Audit + fix Kerberos mapping from Excel against Supabase members.
 * Matches by name + role when names collide (e.g. two Manasvis).
 * Usage: node scripts/audit-kerberos-from-excel.mjs [path] [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const EXCEL = process.argv[2] || "d:/Downlod/ARIES '26-27 (1).xlsx";
const APPLY = process.argv.includes("--apply");

const OVERRIDES = {
  "amey chaudhari": { kerberos: "mt1251690", iitdEmail: "mt1251690@maths.iitd.ac.in" },
  sanidhya: { kerberos: "ee3230694", iitdEmail: "ee3230694@ee.iitd.ac.in" },
  "sanidhya sharma": { kerberos: "ee3230694", iitdEmail: "ee3230694@ee.iitd.ac.in" },
};

function normName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isIitd(s) {
  return /@[\w.-]*iitd\.ac\.in$/i.test(String(s || "").trim());
}

function resolveIitd(row, name) {
  const override = OVERRIDES[normName(name)];
  if (override) return override;
  const iitdCol = String(row["IITD Email"] || "").trim().toLowerCase();
  const emailCol = String(row["Email"] || "").trim().toLowerCase();
  const iitd = isIitd(iitdCol) ? iitdCol : isIitd(emailCol) ? emailCol : "";
  if (!iitd) return null;
  return { kerberos: iitd.split("@")[0].toLowerCase(), iitdEmail: iitd };
}

function mapPostToLevel(post) {
  const r = String(post || "").trim().toLowerCase();
  if (r === "oc") return "oc";
  if (r.includes("co-oc") || r.includes("co overall") || r.includes("co-overall")) {
    return "co_overall_coordinator";
  }
  if (r.includes("research lead")) return "research_lead";
  if (r.includes("coordinator")) return "coordinator";
  if (r.includes("executive")) return "executive";
  if (r.includes("alumni") || r.includes("alumn")) return "alumni";
  return "executive";
}

function sameLevelFamily(a, b) {
  if (a === b) return true;
  // research coordinator still maps to coordinator in DB for some people
  if (
    (a === "coordinator" || a === "research_lead") &&
    (b === "coordinator" || b === "research_lead")
  ) {
    return false;
  }
  return false;
}

function findCandidates(members, name) {
  const n = normName(name);
  const exact = members.filter((m) => normName(m.data?.name) === n);
  if (exact.length) return exact;

  const first = n.split(" ")[0];
  const firstHits = members.filter((m) => normName(m.data?.name).split(" ")[0] === first);
  if (firstHits.length) return firstHits;

  return members.filter((m) => {
    const dn = normName(m.data?.name);
    return dn.includes(n) || n.includes(dn);
  });
}

function pickMember(candidates, excelLevel, kerberos) {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  // Prefer already-correct kerberos
  const byKerberos = candidates.find(
    (m) => m.entry_number === kerberos || m.username === kerberos,
  );
  if (byKerberos) return byKerberos;

  // Prefer matching level
  const byLevel = candidates.filter((m) => m.level === excelLevel);
  if (byLevel.length === 1) return byLevel[0];

  // Prefer slug suffix for role (e.g. manasvi-executive)
  if (excelLevel === "executive") {
    const execSlug = candidates.find((m) => /-executive$/.test(m.slug) || /executive/.test(m.slug));
    if (execSlug) return execSlug;
  }
  if (excelLevel === "coordinator") {
    const coord = candidates.find((m) => !/-executive$/.test(m.slug));
    if (coord && byLevel.length === 0) {
      const coords = candidates.filter((m) => m.level === "coordinator");
      if (coords.length === 1) return coords[0];
    }
  }

  if (byLevel.length > 1) return null; // ambiguous
  return null;
}

async function main() {
  if (!fs.existsSync(EXCEL)) {
    console.error("Excel not found:", EXCEL);
    process.exit(1);
  }

  const wb = XLSX.readFile(EXCEL);
  console.log("Sheets:", wb.SheetNames.join(", "));
  const sheet = wb.Sheets["Team Details"] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  console.log("Excel rows:", rows.length, "| apply:", APPLY);

  const { data: members, error } = await sb
    .from("members")
    .select("slug, data, entry_number, username, email, level");
  if (error) throw error;

  const ok = [];
  const mismatches = [];
  const missingProfile = [];
  const noMail = [];
  const ambiguous = [];
  const planned = []; // { slug, kerberos, iitdEmail, from, name, level }

  // First pass: build intended (slug → kerberos) carefully
  for (const row of rows) {
    const name = String(row.Name || row["Name"] || "").trim();
    if (!name) continue;
    const post = String(row.Post || row["Post"] || "").trim();
    const excelLevel = mapPostToLevel(post);
    const resolved = resolveIitd(row, name);
    if (!resolved) {
      noMail.push(`${name} (${post || "—"})`);
      continue;
    }

    const candidates = findCandidates(members ?? [], name);
    const match = pickMember(candidates, excelLevel, resolved.kerberos);

    if (!match) {
      if (!candidates.length) {
        missingProfile.push(`${name} (${post}) → ${resolved.kerberos}`);
      } else {
        ambiguous.push({
          name,
          post,
          kerberos: resolved.kerberos,
          candidates: candidates.map((c) => `${c.slug}/${c.level}/${c.entry_number || "—"}`),
        });
      }
      continue;
    }

    const current = String(match.entry_number || match.username || "").toLowerCase();
    if (current === resolved.kerberos) {
      ok.push(`${match.slug} ← ${resolved.kerberos}`);
    } else {
      mismatches.push({
        slug: match.slug,
        name,
        post,
        level: match.level,
        excelLevel,
        from: current || "(empty)",
        to: resolved.kerberos,
        email: resolved.iitdEmail,
      });
      planned.push({
        slug: match.slug,
        kerberos: resolved.kerberos,
        iitdEmail: resolved.iitdEmail,
        from: current || "(empty)",
        name,
        level: match.level,
      });
    }
  }

  console.log("\n=== OK (already correct) ===", ok.length);
  console.log("=== MISMATCHES ===", mismatches.length);
  for (const m of mismatches) {
    console.log(
      `  ${m.slug} [${m.level}] ${m.name} (${m.post}): ${m.from} → ${m.to}`,
    );
  }
  console.log("=== AMBIGUOUS (need manual) ===", ambiguous.length);
  for (const a of ambiguous) {
    console.log(`  ${a.name} (${a.post}) → ${a.kerberos}`);
    console.log(`    candidates: ${a.candidates.join(" | ")}`);
  }
  console.log("=== NO PROFILE ===", missingProfile.length);
  for (const line of missingProfile) console.log("  -", line);
  console.log("=== NO IITD MAIL IN EXCEL ===", noMail.length);
  for (const line of noMail) console.log("  -", line);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write fixes.");
    return;
  }

  // Apply with temp swap to avoid unique conflicts when two rows exchange IDs
  const used = new Set();
  for (const p of planned) {
    if (used.has(p.kerberos)) {
      console.warn("SKIP duplicate target kerberos", p.kerberos, p.slug);
      continue;
    }
    used.add(p.kerberos);
  }

  // Clear targets that will be overwritten (move current owners aside if needed)
  for (const p of planned) {
    const holders = (members ?? []).filter(
      (m) =>
        m.slug !== p.slug &&
        (m.entry_number === p.kerberos || m.username === p.kerberos),
    );
    for (const h of holders) {
      const tmp = `tmp-${h.slug}-${Date.now().toString(36)}`.slice(0, 40);
      const { error: e1 } = await sb
        .from("members")
        .update({
          entry_number: tmp,
          username: tmp,
          email: `${tmp}@ariesiitd.com`,
        })
        .eq("slug", h.slug);
      if (e1) console.error("TEMP FAIL", h.slug, e1.message);
      else console.log("TEMP clear", h.slug, "was", h.entry_number);
    }
  }

  let fixed = 0;
  for (const p of planned) {
    const { error: e2 } = await sb
      .from("members")
      .update({
        entry_number: p.kerberos,
        username: p.kerberos,
        email: p.iitdEmail,
      })
      .eq("slug", p.slug);
    if (e2) console.error("FIX FAIL", p.slug, e2.message);
    else {
      fixed++;
      console.log("FIXED", p.slug, p.from, "→", p.kerberos);
    }
  }

  console.log(`\nApplied ${fixed}/${planned.length} fixes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
