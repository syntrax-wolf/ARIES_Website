/**
 * Seed kerberos (entry_number) + IITD email onto members from Excel.
 * Also creates stub member profiles for Excel rows that have IITD mail but no site profile.
 * Usage: node scripts/seed-kerberos-from-excel.mjs [path-to-xlsx]
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
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const EXCEL = process.argv[2] || "d:/Downlod/ARIES '26-27.xlsx";

const OVERRIDES = {
  "amey chaudhari": {
    kerberos: "mt1251690",
    iitdEmail: "mt1251690@maths.iitd.ac.in",
  },
  sanidhya: {
    kerberos: "ee3230694",
    iitdEmail: "ee3230694@ee.iitd.ac.in",
  },
  "sanidhya sharma": {
    kerberos: "ee3230694",
    iitdEmail: "ee3230694@ee.iitd.ac.in",
  },
};

function normName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugifyName(name) {
  return normName(name).replace(/\s+/g, "-");
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

function findMember(members, name, excelLevel, kerberos) {
  const n = normName(name);
  const exact = members.filter((m) => normName(m.data?.name) === n);
  const candidates =
    exact.length > 0
      ? exact
      : (() => {
          const first = n.split(" ")[0];
          const firstHits = members.filter(
            (m) => normName(m.data?.name).split(" ")[0] === first,
          );
          if (firstHits.length) return firstHits;
          return members.filter((m) => {
            const dn = normName(m.data?.name);
            return dn.includes(n) || n.includes(dn);
          });
        })();

  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  // Prefer already-correct kerberos (idempotent re-runs)
  const byKerberos = candidates.find(
    (m) => m.entry_number === kerberos || m.username === kerberos,
  );
  if (byKerberos) return byKerberos;

  // Disambiguate duplicate names (e.g. two Manasvis) by club level / slug
  const byLevel = candidates.filter((m) => m.level === excelLevel);
  if (byLevel.length === 1) return byLevel[0];
  if (excelLevel === "executive") {
    const execSlug = candidates.find((m) => /-executive$/.test(m.slug));
    if (execSlug) return execSlug;
  }
  if (excelLevel === "coordinator") {
    const coords = candidates.filter((m) => m.level === "coordinator");
    if (coords.length === 1) return coords[0];
  }
  return null;
}

async function main() {
  const wb = XLSX.readFile(EXCEL);
  const sheet = wb.Sheets["Team Details"] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const { data: members, error } = await sb
    .from("members")
    .select("slug, data, entry_number, username, email, level");
  if (error) throw error;

  let updated = 0;
  let created = 0;
  let skippedNoMail = 0;
  let unmatched = [];
  const blockedNoMail = [];

  for (const row of rows) {
    const name = String(row["Name"] || "").trim();
    if (!name) continue;
    const post = String(row["Post"] || "").trim();
    const resolved = resolveIitd(row, name);
    if (!resolved) {
      skippedNoMail++;
      blockedNoMail.push(`${name} (${post || "—"})`);
      continue;
    }

    const { kerberos, iitdEmail } = resolved;
    const excelLevel = mapPostToLevel(post);
    let match = findMember(members ?? [], name, excelLevel, kerberos);

    if (!match) {
      const slug =
        excelLevel === "executive" &&
        (members ?? []).some((m) => normName(m.data?.name) === normName(name))
          ? `${slugifyName(name)}-executive`
          : slugifyName(name);
      const level = excelLevel;
      const data = {
        slug,
        name,
        role: post || "Member, ARIES",
        tagline: "",
        location: "IIT Delhi",
        socials: [],
        blocks: [],
      };
      const { error: cErr } = await sb.from("members").upsert(
        {
          slug,
          data,
          level,
          entry_number: kerberos,
          username: kerberos,
          email: iitdEmail,
        },
        { onConflict: "slug" },
      );
      if (cErr) {
        console.warn("CREATE FAIL", name, cErr.message);
        unmatched.push(`${name} → ${kerberos}`);
      } else {
        created++;
        console.log("CREATED", slug, "←", kerberos, level);
        members.push({ slug, data, entry_number: kerberos, username: kerberos, email: iitdEmail, level });
      }
      continue;
    }

    const { error: uErr } = await sb
      .from("members")
      .update({
        entry_number: kerberos,
        email: iitdEmail,
        username: kerberos,
      })
      .eq("slug", match.slug);
    if (uErr) console.error(match.slug, uErr.message);
    else {
      updated++;
      console.log("OK", match.slug, "←", kerberos);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Updated existing: ${updated}`);
  console.log(`Created stubs:    ${created}`);
  console.log(`Skipped (no IITD mail in Excel): ${skippedNoMail}`);
  if (blockedNoMail.length) {
    console.log("Needs IITD email before signup:");
    for (const line of blockedNoMail) console.log("  -", line);
  }
  if (unmatched.length) {
    console.log("Failed to create:");
    for (const line of unmatched) console.log("  -", line);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
