-- Migration: add sessions table for proper server-side session validation.
-- Previously, auth was checked by cookie presence alone; this table backs
-- the isValidSession() / createSession() / deleteSession() functions in db.ts.
--
-- Run via Cloudflare Dashboard → D1 → tuesday-photos → Console,
-- or via CLI:
--   npx wrangler d1 execute DB --file=db/migrations/002_add_sessions.sql          (local)
--   npx wrangler d1 execute DB --file=db/migrations/002_add_sessions.sql --remote  (production)

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT     PRIMARY KEY,
  expires_at  INTEGER  NOT NULL,
  created_at  INTEGER  NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
