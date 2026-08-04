# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-08-04

### ✨ New Features

#### Admin Panel Enhancements
- **Drag-and-Drop Sorting**: Reorder albums and social links by dragging the handle icon
- **In-Browser Photo Upload**: Direct browser-to-Cloudinary uploads with drag-and-drop support
- **Image Thumbnails**: Photo cards now display thumbnail previews from Cloudinary
- **Pagination**: Photos are now paginated at 24 per page with navigation controls
- **Toast Notifications**: Success and error messages appear in the bottom-right corner
- **Loading States**: Spinners and loading indicators on all async operations
- **Form Validation**: Client-side validation with helpful error messages

#### Security Improvements
- **bcrypt-wasm Password Hashing**: Secure password hashing in the browser using bcrypt (cost factor 10)
- **CSRF Protection**: All forms and API calls now validate CSRF tokens
- **Secure Session Tokens**: Random session tokens (not password-derived) stored in httpOnly cookies
- **Enhanced Cookie Security**: All auth cookies use `httpOnly`, `secure`, and `sameSite: strict` flags

### 📡 API Changes

#### New Endpoints
- `POST /api/admin/photos/upload` - Direct browser-to-Cloudinary upload with automatic DB insertion
- `POST /api/admin/albums/reorder` - Reorder albums via drag-and-drop
- `POST /api/admin/social/reorder` - Reorder social links via drag-and-drop

#### Updated Endpoints
- `GET /api/admin/photos` - Now supports pagination (`page` and `limit` query parameters)

### 🔧 Configuration Changes

#### Environment Variables
- **Added**: `ADMIN_PASSWORD_HASH` - bcrypt-hashed admin password (replaces `ADMIN_SECRET`)
- **Added**: `CLOUDINARY_UPLOAD_PRESET` - Unsigned Cloudinary upload preset name
- **Deprecated**: `ADMIN_SECRET` - Use `ADMIN_PASSWORD_HASH` instead (auto-migration available)

### 📦 Dependencies

#### Added
- `bcrypt-wasm` ^4.0.0 - Password hashing in the browser
- `cloudinary` ^2.2.0 - Cloudinary SDK for direct uploads

### 🐛 Bug Fixes
- Fixed session persistence issues with proper cookie settings
- Fixed form submission race conditions with loading states

### 📝 Migration Notes

#### From v0.1.0 to v0.2.0

1. **Password Hash Migration**:
   - Generate a bcrypt hash from your existing `ADMIN_SECRET`:
     ```bash
     npx bcrypt-wasm hash 'your-existing-password' 10
     ```
   - Set the resulting hash as `ADMIN_PASSWORD_HASH` in your environment variables
   - Remove `ADMIN_SECRET` (or keep it temporarily for auto-migration)

2. **Cloudinary Preset Setup**:
   - Create an **unsigned** upload preset in Cloudinary
   - Set `CLOUDINARY_UPLOAD_PRESET` environment variable to your preset name
   - Example preset name: `tuesday-portfolio-uploads`

3. **Update Dependencies**:
   ```bash
   npm install
   ```

4. **No Database Migration Required**: All new features use existing table structures.

---

## [0.1.0] - 2026-07-XX

### Initial Release

- Basic portfolio site with Astro 4 and Cloudflare Pages
- Admin panel with photo, album, and settings management
- Cloudinary integration for image hosting
- Cloudflare D1 database for data storage
- CLI upload tool for photo management
