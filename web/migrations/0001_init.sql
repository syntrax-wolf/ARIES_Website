-- Migration number: 0001 	 2026-08-19T16:00:00.000Z

CREATE TABLE IF NOT EXISTS documents (
  kind TEXT NOT NULL,
  slug TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (kind, slug)
);

CREATE TABLE IF NOT EXISTS allowlist (
  kerberos TEXT PRIMARY KEY
);
