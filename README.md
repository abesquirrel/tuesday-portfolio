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
| **Photos** | Edit metadata, move between albums, toggle "Featured" status, drag-and-drop upload. |
| **Albums** | Create, rename, reorder (drag-and-drop), or delete albums. |
| **Featured Photo** | One-click promote any photo to the hero section. |
| **About / Bio** | Edit bio paragraph, gear notes, and **About Portrait ID**. |
| **Site Images** | Explicitly set **Hero Image ID** and **About Image ID** via Cloudinary IDs. |
| **Social Links** | Manage contact links in the footer with drag-and-drop reordering. |

### Accessing the Admin:
1. URL: `https://your-domain.com/admin`
2. Password: Set via the `ADMIN_PASSWORD_HASH` environment variable (bcrypt-hashed).

---

## 🚀 Photo Workflow

### Option A: In-Browser Drag-and-Drop Upload (Recommended)
The admin panel now supports direct browser-to-Cloudinary uploads with drag-and-drop:

1. Navigate to **Admin → Photos**
2. Click "Upload Photos" or drag images directly onto the upload area
3. Images upload directly to Cloudinary using your unsigned preset
4. Automatically inserted into your D1 database
5. Changes appear instantly across your site

### Option B: CLI Upload Tool
For bulk uploads or advanced metadata:
```bash
# Single image
npm run upload -- path/to/your/photo.jpg

# Bulk directory
npm run upload -- path/to/album_folder/
```

---

## 🔐 Security Features

### Authentication
- **bcrypt-wasm**: Password hashing in the browser using bcrypt (cost factor 10)
- **Secure Sessions**: Random session tokens stored in httpOnly cookies
- **No Password Storage**: Session tokens are random strings, not derived from passwords

### Protection
- **CSRF Tokens**: All forms and API calls require valid CSRF tokens
- **Secure Cookies**: `httpOnly`, `secure`, `sameSite: strict` flags on all auth cookies
- **Admin Privacy**: The `/admin` route is hidden from search engines (`robots: noindex`)
- **Recommended**: Add Cloudflare Access (Zero Trust) in front of `/admin` for SSO protection

---

## 📁 Environment Variables

Add these in **Cloudflare Dashboard → Pages → Settings → Environment Variables**:

### Required
| Variable | Description |
|---|---|
| `ADMIN_PASSWORD_HASH` | bcrypt-hashed admin password (use `npx bcrypt-wasm hash 'password' 10` to generate) |
| `PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset name (e.g., `tuesday-portfolio-uploads`) |

### For CLI Upload (Optional)
| Variable | Description |
|---|---|
| `CLOUDINARY_API_KEY` | Required for CLI upload script |
| `CLOUDINARY_API_SECRET` | Required for CLI upload script |

### Database
Your D1 database binding is automatically configured via `wrangler.toml`.

---

## 🛠️ Local Development

### 1. Prerequisites
- Node.js >= 18.0.0
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- A Cloudinary account with an unsigned upload preset

### 2. Setup
```bash
npm install
```

### 3. Create .env file
```bash
cp .env.example .env
```

Edit `.env` with your Cloudinary credentials and admin password hash.

### 4. Generate Password Hash
```bash
# Install bcrypt-wasm globally or use the project dependency
npx bcrypt-wasm hash 'your-password-here' 10
```

Copy the resulting hash into `ADMIN_PASSWORD_HASH`.

### 5. Database Initialization (Local)
```bash
npx wrangler d1 execute tuesday-photos --local --file=./db/schema.sql
npx wrangler d1 execute tuesday-photos --local --file=./db/seed.sql
```

### 6. Running the Dev Server
```bash
# Wrangler dev (tests true D1 integration locally)
npx wrangler pages dev -- npx astro dev
```

---

## 🌐 Production Setup (Cloudflare)

### 1. Create D1 Database
```bash
npx wrangler d1 create tuesday-photos
```
Copy the `database_id` into `wrangler.toml`.

### 2. Deploy Schema & Seed Data
```bash
npx wrangler d1 execute tuesday-photos --remote --file=./db/schema.sql
npx wrangler d1 execute tuesday-photos --remote --file=./db/seed.sql
```

### 3. Configure Environment Variables
In Cloudflare Dashboard → Pages → Settings → Environment Variables:
- `ADMIN_PASSWORD_HASH`: Your bcrypt-hashed password
- `PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_UPLOAD_PRESET`: Your unsigned preset name (e.g., `tuesday-portfolio-uploads`)

### 4. Deploy
```bash
npm run deploy
```

---

## 📡 API Endpoints

All endpoints require valid session authentication and CSRF tokens.

### Photos
- `GET    /api/admin/photos` - List all photos (paginated, 24/page)
- `POST   /api/admin/photos` - Create photo
- `PUT    /api/admin/photos/:id` - Update photo
- `DELETE /api/admin/photos/:id` - Delete photo
- `POST   /api/admin/photos/feature` - Set featured photo
- `POST   /api/admin/photos/upload` - Direct browser upload to Cloudinary

### Albums
- `GET    /api/admin/albums` - List all albums
- `POST   /api/admin/albums` - Create album
- `PUT    /api/admin/albums/:id` - Update album
- `DELETE /api/admin/albums/:id` - Delete album
- `POST   /api/admin/albums/reorder` - Reorder albums (drag-and-drop)

### Social Links
- `GET    /api/admin/social` - List all social links
- `POST   /api/admin/social` - Create social link
- `PUT    /api/admin/social/:id` - Update social link
- `DELETE /api/admin/social/:id` - Delete social link
- `POST   /api/admin/social/reorder` - Reorder social links (drag-and-drop)

### Settings
- `GET    /api/admin/settings` - Get all site settings
- `PUT    /api/admin/settings` - Update site settings

---

## ✨ New Features (v0.2.0)

### Drag-and-Drop Functionality
- **Albums**: Reorder albums by dragging the handle icon in the Albums table
- **Social Links**: Reorder social links by dragging the handle icon in the Social Links table
- **Photo Upload**: Drag and drop images directly into the upload area

### User Experience Improvements
- **Loading States**: Spinners and loading indicators on all async operations
- **Toast Notifications**: Success/error messages appear in the bottom-right corner
- **Image Thumbnails**: Photo cards now display thumbnail previews
- **Form Validation**: Client-side validation with helpful error messages
- **Pagination**: Photos are paginated at 24 per page with navigation controls

### Security Enhancements
- **bcrypt-wasm**: Password hashing in the browser (no server-side dependency)
- **CSRF Protection**: All forms and API calls validate CSRF tokens
- **Secure Sessions**: Random session tokens with httpOnly, secure, sameSite cookies

---

## 📊 Free Tier Usage Estimate
- **Workers/Pages**: ~100k requests/day (Free)
- **D1 Database**: 25M row reads/day (Free)
- **Cloudinary**: 25 Credits/month (Free)

A personal portfolio will comfortably remain within these free limits forever.

---

## 🆘 Troubleshooting

### "Invalid request. Please refresh the page and try again."
Your CSRF token may have expired. Refresh the page and try again.

### "Admin password not configured."
Ensure `ADMIN_PASSWORD_HASH` is set in your environment variables. Generate it with:
```bash
npx bcrypt-wasm hash 'your-password' 10
```

### Uploads failing with "Signature required"
Your Cloudinary preset must be **unsigned**. Create an unsigned preset in Cloudinary and set `CLOUDINARY_UPLOAD_PRESET`.

### Images not appearing
Verify your `PUBLIC_CLOUDINARY_CLOUD_NAME` is correct. Check Cloudinary dashboard for the upload.

### Session not persisting
Ensure your site is served over HTTPS. Secure cookies require HTTPS in production.

---

## 📜 Migration Guide

### From v0.1.0 to v0.2.0

1. **Password Hash**: Replace `ADMIN_SECRET` with `ADMIN_PASSWORD_HASH`:
   ```bash
   # Generate hash from your existing password
   npx bcrypt-wasm hash '$ADMIN_SECRET' 10
   ```

2. **Cloudinary Preset**: Create an unsigned upload preset in Cloudinary named `tuesday-portfolio-uploads` (or any name you prefer), then set `CLOUDINARY_UPLOAD_PRESET` environment variable.

3. **Dependencies**: Run `npm install` to add new dependencies:
   - bcrypt-wasm (^4.0.0)
   - cloudinary (^2.2.0)

4. **Database**: No schema changes required. All new features use existing tables.

---

## 📚 Dependencies

### Core
- Astro 4.8.0+
- @astrojs/cloudflare 11.2.0+
- Bootstrap 5.3.3

### New in v0.2.0
- **bcrypt-wasm** ^4.0.0 - Password hashing
- **cloudinary** ^2.2.0 - Cloudinary SDK for direct uploads

### Development
- Wrangler 4.78.0+
- TypeScript 5.9.3+
- tsx 4.21.0+

---

## 🎨 Project Structure

```
tuesday-portfolio/
├── src/
│   ├── pages/
│   │   ├── admin.astro          # Admin panel with all CMS functionality
│   │   └── api/
│   │       └── admin/
│   │           └── [...resource].ts  # REST API for admin operations
│   └── lib/
│       └── db.ts               # Database helpers
├── db/
│   ├── schema.sql              # Database schema
│   └── seed.sql                # Sample data
├── scripts/
│   └── upload.ts               # CLI upload tool
├── package.json
├── wrangler.toml
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT
