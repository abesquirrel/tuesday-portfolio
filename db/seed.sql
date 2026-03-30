-- ─── Seed data ────────────────────────────────────────────────────────────────
-- Mirrors src/data/photos.json — safe to re-run (INSERT OR IGNORE).
-- public_id values match the Cloudinary folder structure used in cloudinary.ts.
-- Add cloudinary_url when you have real Cloudinary URLs to persist.

INSERT OR IGNORE INTO photos
  (id, public_id, title, caption, roll, location, medium, simulation, sort_order, is_featured)
VALUES
  (
    'featured',
    'portfolio/featured/main',
    'Somewhere on the 7 Train',
    'The light came through just right. I almost missed it.',
    'Roll 01', 'Queens, NY', 'film', NULL, 0, 1
  ),
  (
    'photo-01',
    'portfolio/grid/photo-01',
    'Corner Store, 6am',
    'Nobody was awake except the clerk and the neon.',
    'Roll 01', 'Brooklyn, NY', 'film', NULL, 1, 0
  ),
  (
    'photo-02',
    'portfolio/grid/photo-02',
    'The Long Platform',
    'Shot on Tri-X pushed to 1600.',
    'Roll 02', 'Chicago, IL', 'film', NULL, 2, 0
  ),
  (
    'photo-03',
    'portfolio/grid/photo-03',
    'Between Shifts',
    'She didn''t notice me. That was the point.',
    'Roll 02', 'Chicago, IL', 'digital', 'Classic Chrome', 3, 0
  ),
  (
    'photo-04',
    'portfolio/grid/photo-04',
    'Overpass, Late Summer',
    'Everything was the same grey.',
    'Roll 03', 'Detroit, MI', 'digital', 'Acros', 4, 0
  ),
  (
    'photo-05',
    'portfolio/grid/photo-05',
    'Diner Window',
    'Condensation and the parking lot beyond.',
    'Roll 03', 'Detroit, MI', 'film', NULL, 5, 0
  ),
  (
    'photo-06',
    'portfolio/grid/photo-06',
    'The Last Bus',
    'Ilford HP5. The grain felt right.',
    'Roll 04', 'Pittsburgh, PA', 'film', NULL, 6, 0
  ),
  (
    'photo-07',
    'portfolio/grid/photo-07',
    'Rooftop, February',
    'Cold enough that the camera almost wouldn''t wind.',
    'Roll 04', 'Pittsburgh, PA', 'digital', 'Eterna Cinema', 7, 0
  ),
  (
    'photo-08',
    'portfolio/grid/photo-08',
    'After the Shift',
    'He''d been standing there a while before I saw him.',
    'Roll 05', 'Cleveland, OH', 'film', NULL, 8, 0
  );
