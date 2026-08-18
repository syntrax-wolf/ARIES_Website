/**
 * Seed Supabase from content/*.json.
 * Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) + creates bootstrap admin auth user.
 *
 * Usage:
 *   set env from .env.local then: npm run db:seed:supabase
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m || m[1].startsWith("#")) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvFiles();

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminUser = (process.env.ADMIN_USER || "admin").toLowerCase();
const adminPass = process.env.ADMIN_PASSWORD;
const bloggerUser = (process.env.BLOGGER_USER || "blogger").toLowerCase();
const bloggerPass = process.env.BLOGGER_PASSWORD;

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!adminPass || adminPass === "password") {
  console.error("Set a strong ADMIN_PASSWORD in .env.local (do not use the default 'password').");
  process.exit(1);
}
if (!bloggerPass || bloggerPass === "blog1234") {
  console.error("Set a strong BLOGGER_PASSWORD in .env.local.");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readDir(dir) {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(full, f)));
}

function mapTeamRoleToLevel(role) {
  const r = String(role || "")
    .trim()
    .toLowerCase();
  if (r === "oc") return "oc";
  if (r === "co-overall coordinator" || r === "co overall coordinator") {
    return "co_overall_coordinator";
  }
  if (r === "research lead") return "research_lead";
  if (r.includes("coordinator")) return "coordinator";
  if (r.includes("executive")) return "executive";
  if (r.includes("alumni") || r.includes("alumn")) return "alumni";
  return null;
}

function buildLevelMap(team) {
  const levels = new Map();
  const year = team.years?.[0];
  if (!year) return levels;

  for (const m of year.coreTeam ?? []) {
    const lvl = mapTeamRoleToLevel(m.role);
    if (m.slug && lvl) levels.set(m.slug, lvl);
  }
  for (const m of year.coordinators ?? []) {
    if (m.slug) levels.set(m.slug, mapTeamRoleToLevel(m.role) || "coordinator");
  }
  for (const g of year.executives ?? []) {
    for (const m of g.members ?? []) {
      if (m.slug) levels.set(m.slug, "executive");
    }
  }
  for (const m of team.alumni ?? []) {
    if (m.slug) levels.set(m.slug, levels.get(m.slug) || "alumni");
  }
  return levels;
}

async function ensureAdmin() {
  const email = `${adminUser}@ariesiitd.com`;
  const { data: listed } = await sb.auth.admin.listUsers({ perPage: 200 });
  let user = listed?.users?.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: adminPass,
      email_confirm: true,
      app_metadata: { level: "oc", member_slug: "admin" },
      user_metadata: { name: "ARIES Admin" },
    });
    if (error) throw error;
    user = data.user;
    console.log("Created auth user", email);
  } else {
    const { error } = await sb.auth.admin.updateUserById(user.id, {
      password: adminPass,
      app_metadata: { level: "oc", member_slug: "admin" },
      email_confirm: true,
    });
    if (error) throw error;
    console.log("Updated auth user", email);
  }

  const { error } = await sb.from("members").upsert({
    slug: "admin",
    data: {
      slug: "admin",
      name: "ARIES Admin",
      role: "OC",
      tagline: "Bootstrap admin",
      socials: [],
      blocks: [],
    },
    username: adminUser,
    entry_number: null,
    email,
    level: "oc",
    auth_user_id: user.id,
  });
  if (error) throw error;
}

async function ensureBlogger() {
  const email = `${bloggerUser}@ariesiitd.com`;
  const { data: listed } = await sb.auth.admin.listUsers({ perPage: 200 });
  let user = listed?.users?.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: bloggerPass,
      email_confirm: true,
      app_metadata: { level: "blogger", member_slug: bloggerUser },
      user_metadata: { name: "ARIES Blogger" },
    });
    if (error) throw error;
    user = data.user;
    console.log("Created auth user", email);
  } else {
    const { error } = await sb.auth.admin.updateUserById(user.id, {
      password: bloggerPass,
      app_metadata: { level: "blogger", member_slug: bloggerUser },
      email_confirm: true,
    });
    if (error) throw error;
    console.log("Updated auth user", email);
  }

  // Store the blogger row as "member" so it passes the members_level_check constraint.
  // The API still treats this login as level "blogger" because it reads app_metadata first.
  const { error } = await sb.from("members").upsert({
    slug: bloggerUser,
    data: {
      slug: bloggerUser,
      name: "ARIES Blogger",
      role: "Blogger",
      tagline: "Blog author",
      socials: [],
      blocks: [],
    },
    username: bloggerUser,
    entry_number: null,
    email,
    level: "member",
    auth_user_id: user.id,
  });
  if (error) throw error;
}

async function main() {
  const team = readJson(path.join(CONTENT, "team.json"));
  const levels = buildLevelMap(team);
  const members = readDir("members");
  const projects = readDir("projects");
  const events = readDir("events");
  const resources = readJson(path.join(CONTENT, "resources.json"));

  console.log(
    `Seeding ${members.length} members, ${projects.length} projects, ${events.length} events…`,
  );

  for (const m of members) {
    const level = levels.get(m.slug) || "member";
    const { error } = await sb.from("members").upsert({
      slug: m.slug,
      data: m,
      level,
      email: null,
      username: null,
      entry_number: null,
    });
    if (error) throw new Error(`member ${m.slug}: ${error.message}`);
  }

  for (const p of projects) {
    const { error } = await sb.from("projects").upsert({
      slug: p.slug,
      data: p,
      featured: !!p.featured,
    });
    if (error) throw new Error(`project ${p.slug}: ${error.message}`);
  }

  for (const e of events) {
    const { error } = await sb.from("events").upsert({
      slug: e.slug,
      data: e,
      date: e.date || null,
    });
    if (error) throw new Error(`event ${e.slug}: ${error.message}`);
  }

  {
    const { error } = await sb.from("resources").upsert({ id: 1, data: resources });
    if (error) throw error;
  }
  {
    const { error } = await sb.from("team").upsert({ id: 1, data: team });
    if (error) throw error;
  }

  await ensureAdmin();
  await ensureBlogger();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
