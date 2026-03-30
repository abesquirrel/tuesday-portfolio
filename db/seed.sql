-- ─── Seed data ────────────────────────────────────────────────────────────────
-- Mirrors src/data/photos.json — safe to re-run (INSERT OR IGNORE).
-- public_id values match the Cloudinary folder structure used in cloudinary.ts.
-- Add cloudinary_url when you have real Cloudinary URLs to persist.

-- ─── Albums ──────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO albums (id, title, description, sort_order) VALUES
  ('brooklyn', 'Brooklyn Streets', 'Morning light and neon signs in the borough.', 0),
  ('chicago', 'The L & Lake Michigan', 'Chicago pushed to the edge.', 1),
  ('detroit', 'Motor City Stillness', 'Industrial quiet and concrete grey.', 2),
  ('pittsburgh', 'Steel & Mist', 'Iron bridges and heavy grain.', 3);

-- ─── Photos ──────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO photos
  (id, public_id, title, caption, roll, location, medium, simulation, camera, lens, film_stock, album_id, sort_order, is_featured)
VALUES
  (
    'featured',
    'portfolio/featured/main',
    'Somewhere on the 7 Train',
    'The light came through just right. I almost missed it.',
    'Roll 01', 'Queens, NY', 'film', NULL, 'Nikkormat FT2', 'Nikon 50mm f/1.4', 'Kodak Color 200', 'brooklyn', 0, 1
  ),
  (
    'photo-01',
    'portfolio/grid/photo-01',
    'Corner Store, 6am',
    'Nobody was awake except the clerk and the neon.',
    'Roll 01', 'Brooklyn, NY', 'film', NULL, 'Nikkormat FT2', 'Nikon 50mm f/1.4', 'Kodak Color 200', 'brooklyn', 1, 0
  ),
  (
    'photo-02',
    'portfolio/grid/photo-02',
    'The Long Platform',
    'Shot on Tri-X pushed to 1600.',
    'Roll 02', 'Chicago, IL', 'film', NULL, 'Nikkormat FT2', 'Nikon 28mm f/2.8', 'Kodak Tri-X 400', 'chicago', 2, 0
  ),
  (
    'photo-03',
    'portfolio/grid/photo-03',
    'Between Shifts',
    'She didn''t notice me. That was the point.',
    'Roll 02', 'Chicago, IL', 'digital', 'Classic Chrome', 'Fujifilm X-T20', 'Fujifilm 35mm f/2', NULL, 'chicago', 3, 0
  ),
  (
    'photo-04',
    'portfolio/grid/photo-04',
    'Overpass, Late Summer',
    'Everything was the same grey.',
    'Roll 03', 'Detroit, MI', 'digital', 'Acros', 'Fujifilm X-T20', 'Fujifilm 35mm f/2', NULL, 'detroit', 4, 0
  ),
  (
    'photo-05',
    'portfolio/grid/photo-05',
    'Diner Window',
    'Condensation and the parking lot beyond.',
    'Roll 03', 'Detroit, MI', 'film', NULL, 'Nikkormat FT2', 'Nikon 50mm f/1.4', 'Kodak Portra 400', 'detroit', 5, 0
  ),
  (
    'photo-06',
    'portfolio/grid/photo-06',
    'The Last Bus',
    'Ilford HP5. The grain felt right.',
    'Roll 04', 'Pittsburgh, PA', 'film', NULL, 'Nikkormat FT2', 'Nikon 50mm f/1.4', 'Ilford HP5 Plus', 'pittsburgh', 6, 0
  ),
  (
    'photo-07',
    'portfolio/grid/photo-07',
    'Rooftop, February',
    'Cold enough that the camera almost wouldn''t wind.',
    'Roll 04', 'Pittsburgh, PA', 'digital', 'Eterna Cinema', 'Fujifilm X-T20', 'Fujifilm 23mm f/2', NULL, 'pittsburgh', 7, 0
  ),
  (
    'photo-08',
    'portfolio/grid/photo-08',
    'After the Shift',
    'He''d been standing there a while before I saw him.',
    'Roll 05', 'Cleveland, OH', 'film', NULL, 'Nikkormat FT2', 'Nikon 50mm f/1.4', 'Kodak Gold 200', 'pittsburgh', 8, 0
  );

-- ─── Site Settings ────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('about_bio', 'My name is Paul Rojas. I shoot film — mostly street, mostly in places where nobody''s watching. The name of this site isn''t a mystery: most of my best rolls happen on completely unremarkable days that I only remember because I had a camera.'),
  ('about_currently_shooting', 'Nikkormat FT2 · Nikon 50mm f/1.4 AI · Konica 100 VX / Kodak Color 200'),
  ('about_developing', 'HC-110 (Dilution B) · D-76 1:1'),
  ('about_also_shooting', 'Fujifilm X-T20 · Classic Chrome · Acros · Eterna Cinema');

-- ─── Social Links ─────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO social_links (label, url, sort_order) VALUES
  ('Email', 'mailto:paul@paulrojas.quest', 0),
  ('Instagram', 'https://instagram.com/', 1),
  ('Flickr', 'https://flickr.com/', 2),
  ('VSCO', 'https://vsco.co/', 3);
