/** Dump Excel roster → JSON for audit (no Supabase needed). */
import fs from "node:fs";
import XLSX from "xlsx";

const EXCEL = process.argv[2] || "d:/Downlod/ARIES '26-27 (1).xlsx";
const out = process.argv[3] || "scripts/.roster-audit.json";

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

const wb = XLSX.readFile(EXCEL);
const sheet = wb.Sheets["Team Details"] || wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const roster = [];
for (const row of rows) {
  const name = String(row.Name || row["Name"] || "").trim();
  if (!name) continue;
  const post = String(row.Post || row["Post"] || "").trim();
  const resolved = resolveIitd(row, name);
  roster.push({
    name,
    post,
    level: mapPostToLevel(post),
    kerberos: resolved?.kerberos || null,
    iitdEmail: resolved?.iitdEmail || null,
    cols: Object.keys(row),
  });
}

fs.writeFileSync(out, JSON.stringify({ sheets: wb.SheetNames, roster }, null, 2));
console.log("Wrote", out, "rows", roster.length);
console.log("Sample cols:", roster[0]?.cols);
console.log(
  "With kerberos:",
  roster.filter((r) => r.kerberos).length,
  "| without:",
  roster.filter((r) => !r.kerberos).length,
);
