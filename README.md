# I Think It Was Tuesday

Film photography portfolio — [tuesday.paulrojas.quest](https://tuesday.paulrojas.quest)

Built with **Astro 4**, **Bootstrap 5**, **Cloudinary**, and deployed on **Cloudflare Pages**.

---

## Local development

```bash
npm install
npm run dev
```

Site runs at `http://localhost:4321`.

---

## Adding photos

All photo metadata lives in `src/data/photos.json`. Each entry:

```json
{
  "id":         "unique-slug",
  "publicId":   "portfolio/roll-01/frame-05",
  "title":      "Corner Store, 6am",
  "caption":    "Nobody was awake except the clerk and the neon.",
  "roll":       "Roll 01",
  "location":   "Brooklyn, NY",
  "isFeatured": false
}
```

`publicId` is the path inside your Cloudinary account (no leading slash, no file extension).
Only one entry should have `"isFeatured": true` — that drives the hero and featured section.

---

## Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Upload your photos into a folder structure like `portfolio/roll-01/`, `portfolio/grid/`, etc.
3. Copy your **Cloud name** from the Cloudinary dashboard
4. Add it to `.env`:

```env
PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
```

Without this, the site falls back to picsum.photos placeholders — perfect for development.

---

## Cloudflare Pages deployment

1. Push this repo to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) → Create a project → Connect GitHub
3. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add environment variable:
   - `PUBLIC_CLOUDINARY_CLOUD_NAME` = your Cloudinary cloud name
5. Deploy

### Custom domain

In Cloudflare Pages → Custom domains → Add `tuesday.paulrojas.quest`.
Since your domain is already on Cloudflare, the DNS CNAME is added automatically.

---

## Updating contact links

Edit `src/components/Contact.astro` — the `links` array at the top of the file.

## Updating the About text

Edit `src/components/About.astro` directly — the copy is in the component body.

---

## Tech stack

| | |
|---|---|
| Framework | Astro 4 (static output) |
| Styles | Bootstrap 5 + custom SCSS (warm darkroom theme) |
| Images | Cloudinary (auto format, auto quality, responsive) |
| Hosting | Cloudflare Pages |
| Domain | `tuesday.paulrojas.quest` |
| Camera | Nikkormat FTn |
