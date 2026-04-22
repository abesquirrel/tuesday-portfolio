# I Think It Was Tuesday

Film photography portfolio — [tuesday.paulrojas.quest](https://tuesday.paulrojas.quest)

Built with **Astro 4**, **Bootstrap 5**, **Cloudinary**, and **Cloudflare D1**. Fits entirely within the Cloudflare **free tier**.

---

## 🏗 Technical Architecture

This site is built as a **Hybrid/SSR** application on Cloudflare Pages.
- **Data Source**: Cloudflare D1 (SQLite-based edge database).
  - Tables: `photos`, `albums`, `site_settings`, `social_links`.
- **Images**: Cloudinary (auto-format, auto-quality, responsive).
- **Framework**: Astro 4 with the Cloudflare adapter.

---

## 🛠 Admin Panel (The CMS)

The admin panel provides a professional interface to manage your portfolio metadata and site settings without touching code.

### What it manages:
| Section | Action |
|---|---|
| **Photos** | Edit metadata, move between albums, toggle "Featured" status. |
| **Albums** | Create, rename, reorder, or delete albums. |
| **Featured Photo** | One-click promote any photo to the hero section. |
| **About / Bio** | Edit bio paragraph, gear notes, and **About Portrait ID**. |
| **Site Images** | Explicitly set **Hero Image ID** and **About Image ID** via Cloudinary IDs. |
| **Social Links** | Manage contact links in the footer. |

### Accessing the Admin:
1. URL: `https://your-domain.com/admin`
2. Password: Set via the `ADMIN_SECRET` environment variable.

---

## 🚀 Photo Workflow

```
┌─────────────────────────────────────────────────────────┐
│  New Photo Workflow                                     │
│                                                         │
│  1. npm run upload photo.jpg                           │
│     ↓ Prompts for metadata                             │
│     ↓ Uploads to Cloudinary → gets public_id           │
│     ↓ Inserts row into D1 photos table                 │
│                                                         │
│  2. /admin → Photos panel                              │
│     ↓ See the new photo card instantly                 │
│     ↓ Refine metadata or promote to "Featured"         │
│                                                         │
│  3. Changes are LIVE immediately                       │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Local Development

### 1. Prerequisites
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed.
- A Cloudinary account.

### 2. Setup
```bash
npm install
```

### 3. Database Initialization (Local)
```bash
npx wrangler d1 execute tuesday-photos --local --file=./db/schema.sql
npx wrangler d1 execute tuesday-photos --local --file=./db/seed.sql
```

### 4. Running the Dev Server
```bash
# Wrangler dev (tests true D1 integration locally)
npx wrangler pages dev -- npx astro dev
```

---

## 🌐 Production Setup (Cloudflare)

### 1. Database Creation
```bash
npx wrangler d1 create tuesday-photos
```
Copy the `database_id` into `wrangler.toml`.

### 2. Schema & Seed
```bash
npx wrangler d1 execute tuesday-photos --remote --file=./db/schema.sql
npx wrangler d1 execute tuesday-photos --remote --file=./db/seed.sql
```

### 3. Environment Variables
Add these in `Cloudflare Dashboard → Pages → Settings → Environment Variables`:
- `ADMIN_SECRET`: Your admin password.
- `PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Required for CLI upload.
- `CLOUDINARY_API_SECRET`: Required for CLI upload.

---

## 🔧 CLI Upload Tool Reference
The project includes a specialized script to handle optimization and database sync:
```bash
# Single image
npm run upload -- path/to/your/photo.jpg

# Bulk directory
npm run upload -- path/to/album_folder/
```

---

## 🔒 Security
- **Admin Privacy:** The `/admin` route is hidden from search engines (`robots: noindex`).
- **Secure Sessions:** Cookie-based auth with `httpOnly`, `secure`, and `sameSite: strict`.
- **Extra Layer:** We recommend adding **Cloudflare Access** (Zero Trust) in front of `/admin` for SSO protection.

---

## 📊 Free Tier Usage Estimate
- **Workers/Pages:** ~100k requests/day (Free)
- **D1 Database:** 25M row reads/day (Free)
- **Cloudinary:** 25 Credits/month (Free)

A personal portfolio will comfortably remain within these free limits forever.
