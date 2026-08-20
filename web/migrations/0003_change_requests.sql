-- Migration number: 0003 	 2026-08-19T17:10:00.000Z

CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  slug TEXT NOT NULL,
  payload TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
