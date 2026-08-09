-- ─── Journal Entries table ───────────────────────────────────────────────────
-- Stores Field Journal / Blog entries for the public portfolio.
--
-- status: 'draft' | 'published'
-- cover_public_id: optional Cloudinary public_id for a cover image

CREATE TABLE IF NOT EXISTS journal_entries (
  id            TEXT     PRIMARY KEY,
  title         TEXT     NOT NULL,
  body          TEXT     DEFAULT '',
  location      TEXT     DEFAULT '',
  shoot_date    TEXT     DEFAULT '',       -- freeform display date, e.g. "March 2024"
  cover_public_id TEXT   DEFAULT '',
  status        TEXT     DEFAULT 'published', -- 'draft' | 'published'
  sort_order    INTEGER  DEFAULT 0,
  created_at    INTEGER  NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_journal_status     ON journal_entries (status);
CREATE INDEX IF NOT EXISTS idx_journal_sort_order ON journal_entries (sort_order);
