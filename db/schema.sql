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
  camera         TEXT,                      -- e.g. 'Nikkormat FT2'
  lens           TEXT,                      -- e.g. 'Nikon 50mm f/1.4'
  film_stock     TEXT,                      -- e.g. 'Kodak Gold 200'
  album_id       TEXT,                      -- foreign key to albums.id
  sort_order     INTEGER  DEFAULT 0,
  is_featured    INTEGER  DEFAULT 0         -- SQLite boolean: 0 | 1
);

-- ─── Albums table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS albums (
  id             TEXT     PRIMARY KEY,
  title          TEXT     NOT NULL,
  description    TEXT     DEFAULT '',
  sort_order     INTEGER  DEFAULT 0
);

-- ─── Site Settings table ──────────────────────────────────────────────────────
-- Key-value store for bio, currently shooting details, etc.
CREATE TABLE IF NOT EXISTS site_settings (
  key            TEXT     PRIMARY KEY,
  value          TEXT     NOT NULL
);

-- ─── Social Links table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_links (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  label          TEXT     NOT NULL,
  url            TEXT     NOT NULL,
  sort_order     INTEGER  DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_photos_featured   ON photos (is_featured);
CREATE INDEX IF NOT EXISTS idx_photos_sort_order ON photos (sort_order);
