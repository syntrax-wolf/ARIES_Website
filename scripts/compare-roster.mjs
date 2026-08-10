/**
 * Compare scripts/.roster-audit.json against scripts/.members-db.json
 * Writes scripts/.kerberos-fix-plan.json
 */
import fs from "node:fs";

const roster = JSON.parse(fs.readFileSync("scripts/.roster-audit.json", "utf8")).roster;
const members = JSON.parse(fs.readFileSync("scripts/.members-db.json", "utf8"));

function normName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findCandidates(name) {
  const n = normName(name);
  const exact = members.filter((m) => normName(m.name) === n);
  if (exact.length) return exact;
  const first = n.split(" ")[0];
  const firstHits = members.filter((m) => normName(m.name).split(" ")[0] === first);
  if (firstHits.length) return firstHits;
  return members.filter((m) => {
    const dn = normName(m.name);
    return dn.includes(n) || n.includes(dn);
  });
}

function pickMember(candidates, excelLevel, kerberos) {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  const byKerberos = candidates.find(
    (m) => m.entry_number === kerberos || m.username === kerberos,
  );
  if (byKerberos) return byKerberos;
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

const ok = [];
const mismatches = [];
const missing = [];
const ambiguous = [];
const noMail = [];

for (const row of roster) {
  if (!row.kerberos) {
    noMail.push(row);
    continue;
  }
  const candidates = findCandidates(row.name);
  const match = pickMember(candidates, row.level, row.kerberos);
  if (!match) {
    if (!candidates.length) missing.push(row);
    else
      ambiguous.push({
        ...row,
        candidates: candidates.map((c) => `${c.slug}/${c.level}/${c.entry_number || "—"}`),
      });
    continue;
  }
  const current = String(match.entry_number || match.username || "").toLowerCase();
  if (current === row.kerberos) {
    ok.push({ slug: match.slug, kerberos: row.kerberos, name: row.name });
  } else {
    mismatches.push({
      slug: match.slug,
      name: row.name,
      post: row.post,
      dbLevel: match.level,
      excelLevel: row.level,
      from: current || "(empty)",
      to: row.kerberos,
      email: row.iitdEmail,
    });
  }
}

const report = { ok: ok.length, mismatches, ambiguous, missing, noMail };
fs.writeFileSync("scripts/.kerberos-fix-plan.json", JSON.stringify(report, null, 2));
console.log("OK:", ok.length);
console.log("MISMATCHES:", mismatches.length);
for (const m of mismatches) {
  console.log(`  ${m.slug} [${m.dbLevel}] ${m.name}: ${m.from} → ${m.to}`);
}
console.log("AMBIGUOUS:", ambiguous.length);
for (const a of ambiguous) {
  console.log(`  ${a.name} (${a.post}) → ${a.kerberos}`);
  console.log(`    ${a.candidates.join(" | ")}`);
}
console.log("NO PROFILE:", missing.length);
for (const m of missing) console.log(`  ${m.name} (${m.post}) → ${m.kerberos}`);
console.log("NO MAIL:", noMail.length);
for (const m of noMail) console.log(`  ${m.name} (${m.post})`);
