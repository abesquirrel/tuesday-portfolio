# I Think It Was Tuesday

Film photography portfolio — [tuesday.paulrojas.quest](https://tuesday.paulrojas.quest)

Built with **Astro 4**, **Bootstrap 5**, **Cloudinary**, and **Cloudflare D1**.

---

## Technical Architecture

This site is built as a **Hybrid/SSR** application on Cloudflare Pages.
- **Data Source**: Cloudflare D1 (SQLite-based edge database).
  - Tables: `photos`, `albums`, `site_settings`, `social_links`.
- **Images**: Cloudinary (auto-format, auto-quality, responsive).
- **Framework**: Astro 4 with the Cloudflare adapter.

---

## Local Development

### 1. Prerequisites
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally or via `npm`.
- A Cloudinary account (optional, falls back to placeholders).

### 2. Setup
```bash
npm install
```

### 3. Database Initialization (Local)
To populate your local D1 instance (stored in `.wrangler/`):
```bash
npx wrangler d1 execute tuesday-photos --local --file=./db/schema.sql
npx wrangler d1 execute tuesday-photos --local --file=./db/seed.sql
```

### 4. Running the Dev Server
```bash
# Standard Astro dev (uses src/data/photos.json as a fallback)
npm run dev

# Wrangler dev (tests true D1 integration locally)
npx wrangler pages dev
```

---

## Production Setup (Cloudflare D1)

### 1. Create the Database
```bash
npx wrangler d1 create tuesday-photos
```
Copy the `database_id` from the output and paste it into `wrangler.toml` (or `wrangler.jsonc`).

### 2. Initialize Production Schema
```bash
npx wrangler d1 execute tuesday-photos --remote --file=./db/schema.sql
```

### 3. Seed Production Data
```bash
npx wrangler d1 execute tuesday-photos --remote --file=./db/seed.sql
```

---

## Adding & Managing Photos

### 1. The CLI Upload Tool (Recommended)
The project includes a specialized script to handle Cloudinary uploads and D1 record insertion in one step.

```bash
# Upload a local image
npm run upload -- path/to/your/photo.jpg
```

The script will prompt you for:
- **Title**, **Album**, **Location**, and **Roll**.
- **Metadata** (Camera, Lens, Film Stock).
- **Medium** (Film vs Digital).

### 2. Manual SQL
Alternatively, you can run a SQL `INSERT` via Wrangler:
- `id`: unique-slug
- `public_id`: Cloudinary path (e.g., `portfolio/roll-01/frame-05`)
- `album_id`: Links to a record in the `albums` table.
- `is_featured`: Set to `1` for the hero image.

---

## Album Management

Photos are automatically grouped by album in the Gallery.
- **Create an Album**: Add a row to the `albums` table via Wrangler or the Cloudflare Dashboard.
- **Empty Albums**: Albums with no photos are automatically hidden from the UI.
- **Uncategorized**: Photos without an `album_id` appear in the "Other Moments" section.

---

## Cloudinary & Environment Variables

Add these to your `.env` (local) and Cloudflare Pages (production):
- `PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Required for the upload script.
- `CLOUDINARY_API_SECRET`: Required for the upload script.

Without `PUBLIC_CLOUDINARY_CLOUD_NAME`, the site falls back to `picsum.photos` placeholders.

---

## Tech Stack

| | |
|---|---|
| Framework | Astro 4 (Hybrid/SSR) |
| Database | Cloudflare D1 (SQLite) |
| Styles | Bootstrap 5 + custom SCSS |
| Images | Cloudinary |
| Hosting | Cloudflare Pages |
| Domain | `tuesday.paulrojas.quest` |
| Camera | Nikkormat FTn |
