-- ─── Photos table ────────────────────────────────────────────────────────────
-- Stores both the Cloudinary public_id (for runtime transforms)
-- and an optional cloudinary_url (pre-built override, e.g. from the API).
--
-- medium:     'film' | 'digital'
-- simulation: Fujifilm simulation name (digital shots only)
-- is_featured: 1 = hero / featured section, 0 = grid

CREATE TABLE IF NOT EXISTS photos (
  id             TEXT     PRIMARY KEY,
  public_id      TEXT     NOT NULL,
  cloudinary_url TEXT,                      -- optional: full pre-built URL
  title          TEXT     NOT NULL,
  caption        TEXT     DEFAULT '',
  roll           TEXT     DEFAULT '',
  location       TEXT     DEFAULT '',
  medium         TEXT     DEFAULT 'film',   -- 'film' | 'digital'
  simulation     TEXT,                      -- e.g. 'Classic Chrome'
  sort_order     INTEGER  DEFAULT 0,
  is_featured    INTEGER  DEFAULT 0         -- SQLite boolean: 0 | 1
);

CREATE INDEX IF NOT EXISTS idx_photos_featured   ON photos (is_featured);
CREATE INDEX IF NOT EXISTS idx_photos_sort_order ON photos (sort_order);
