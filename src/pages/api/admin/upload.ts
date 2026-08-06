// src/pages/api/admin/upload.ts
//
// POST /api/admin/upload
//
// Accepts multipart/form-data with:
//   file        - the image file (required)
//   title       - photo title (optional, falls back to filename)
//   location    - location string
//   roll        - roll / date string
//   medium      - "film" | "digital"
//   camera      - camera name
//   lens        - lens name
//   film_stock  - film stock name
//   simulation  - fujifilm simulation
//   caption     - long caption text
//   album_id    - album slug (or empty for uncategorised)
//   is_featured - "1" to make featured
//
// Signs the Cloudinary upload server-side via SHA-1 + Web Crypto (no Node SDK).
// Inserts into D1 on success.

import type { APIRoute } from 'astro';

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { 'Content-Type': 'application/json' },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

/** SHA-1 of (paramsString + apiSecret) — Cloudinary's required signing method */
async function cloudinarySign(paramsToSign: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign + apiSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Slugify a string into a URL-safe ID */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const session = cookies.get('admin_session')?.value;
  if (!session || session.length === 0) return unauthorized();

  // ── Environment bindings ──────────────────────────────────────────────────
  const env = (locals as any).runtime?.env;
  const db = env?.DB || env?.tuesday_photos || env?.['tuesday-photos'];

  // Cloudinary credentials — prefer Workers env bindings over .env (edge compat)
  const cloudName  = env?.PUBLIC_CLOUDINARY_CLOUD_NAME  ?? import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey     = env?.CLOUDINARY_API_KEY            ?? import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret  = env?.CLOUDINARY_API_SECRET         ?? import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return json({
      error: 'Cloudinary not configured. Set PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment.',
    }, 503);
  }

  // ── Parse form data ───────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, 400);
  }

  const file = formData.get('file') as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return json({ error: 'No file provided or file is empty' }, 400);
  }

  // Metadata — all optional except title (falls back to filename)
  const rawTitle   = String(formData.get('title')    || '').trim();
  const title      = rawTitle || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  const location   = String(formData.get('location')  || '').trim();
  const roll       = String(formData.get('roll')       || '').trim();
  const medium     = String(formData.get('medium')     || 'film').trim();
  const camera     = String(formData.get('camera')     || '').trim() || null;
  const lens       = String(formData.get('lens')       || '').trim() || null;
  const filmStock  = String(formData.get('film_stock') || '').trim() || null;
  const simulation = String(formData.get('simulation') || '').trim() || null;
  const caption    = String(formData.get('caption')    || '').trim();
  const albumId    = String(formData.get('album_id')   || '').trim() || null;
  const isFeatured = formData.get('is_featured') === '1' ? 1 : 0;

  // Build a unique public_id
  const slug   = slugify(title) || 'photo';
  const suffix = Date.now().toString(36);
  const publicId = `${slug}-${suffix}`;
  const folder   = 'portfolio/grid';

  // ── Sign the Cloudinary upload ────────────────────────────────────────────
  const timestamp = Math.floor(Date.now() / 1000);
  // Parameters must be sorted alphabetically for signing
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = await cloudinarySign(paramsToSign, apiSecret);

  // ── Upload to Cloudinary ──────────────────────────────────────────────────
  const cloudForm = new FormData();
  cloudForm.append('file',       file);
  cloudForm.append('api_key',    apiKey);
  cloudForm.append('timestamp',  String(timestamp));
  cloudForm.append('signature',  signature);
  cloudForm.append('folder',     folder);
  cloudForm.append('public_id',  publicId);

  let uploadResult: any;
  try {
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: cloudForm }
    );
    uploadResult = await uploadRes.json() as any;
    if (!uploadRes.ok) {
      return json({
        error: `Cloudinary upload failed: ${uploadResult?.error?.message ?? 'Unknown error'}`,
      }, 502);
    }
  } catch (err) {
    return json({ error: `Network error uploading to Cloudinary: ${String(err)}` }, 502);
  }

  // ── Insert into D1 ───────────────────────────────────────────────────────
  const dbId = slugify(title) + '-' + suffix;

  if (db) {
    try {
      if (isFeatured) {
        await db.prepare('UPDATE photos SET is_featured = 0').run();
      }
      const countRow = await db.prepare('SELECT COUNT(*) as count FROM photos').first() as any;
      const sortOrder = countRow?.count ?? 99;

      await db.prepare(`
        INSERT OR REPLACE INTO photos
          (id, public_id, cloudinary_url, title, caption, roll, location, medium,
           simulation, camera, lens, film_stock, album_id, sort_order, is_featured)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        dbId,
        uploadResult.public_id,
        uploadResult.secure_url,
        title, caption, roll, location, medium,
        simulation, camera, lens, filmStock,
        albumId, sortOrder, isFeatured
      ).run();
    } catch (dbErr: any) {
      // Cloudinary succeeded — warn about DB but don't fail
      return json({
        ok: true,
        warning: `Photo uploaded to Cloudinary but DB insert failed: ${dbErr?.message}. Use "Add Photo Record" with public_id "${uploadResult.public_id}" to save it manually.`,
        id: dbId,
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        title,
      });
    }
  }

  return json({
    ok: true,
    id: dbId,
    public_id: uploadResult.public_id,
    secure_url: uploadResult.secure_url,
    title,
  }, 201);
};
