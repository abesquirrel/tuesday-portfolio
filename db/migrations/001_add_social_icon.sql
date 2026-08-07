-- Migration: add icon column to social_links
-- Run this against your Cloudflare D1 database to fix the 500 error on social link saves.
--
-- Via Wrangler CLI (replace DB_NAME with your binding name, e.g. tuesday_photos or DB):
--   npx wrangler d1 execute DB_NAME --file=db/migrations/001_add_social_icon.sql
--
-- Or paste into the D1 console in the Cloudflare dashboard.

ALTER TABLE social_links ADD COLUMN icon TEXT;
