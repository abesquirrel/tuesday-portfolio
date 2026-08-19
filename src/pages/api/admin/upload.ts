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
import { isValidSession } from '../../../lib/db';
import { CUSTOM_ERROR_THUMBNAIL } from '../../../utils/cloudinary';
import { slugify, cloudinarySign } from '../../../lib/cloudinaryApi';

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

export const GET: APIRoute = async () => {
  return json({
    ok: true,
    message: 'Upload endpoint ready. Send POST request with multipart/form-data to upload photos.',
  });
};

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  // ── Environment bindings ──────────────────────────────────────────────────
  const env = (locals as any).runtime?.env;
  const db = env?.DB || env?.tuesday_photos || env?.['tuesday-photos'];

  if (!db) {
    return json({ error: 'D1 database binding not available' }, 503);
  }

  // ── Auth guard: validate against sessions table ────────────────────────────
  const session = cookies.get('admin_session')?.value;
  if (!session || !(await isValidSession(db, session))) {
    return unauthorized();
  }

  // Cloudinary credentials — check Workers env, process.env, and import.meta.env
  const cloudName  = env?.PUBLIC_CLOUDINARY_CLOUD_NAME  ?? (typeof process !== 'undefined' ? process.env?.PUBLIC_CLOUDINARY_CLOUD_NAME : undefined) ?? import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey     = env?.CLOUDINARY_API_KEY            ?? (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_KEY : undefined)            ?? import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret  = env?.CLOUDINARY_API_SECRET         ?? (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_SECRET : undefined)         ?? import.meta.env.CLOUDINARY_API_SECRET;

  const isPlaceholderCloud = !cloudName || cloudName === 'your_cloud_name_here';

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

  // Build a unique public_id and dynamic folder path (portfolio/<album> or portfolio/unsorted)
  const slug        = slugify(title) || 'photo';
  const suffix      = Date.now().toString(36);
  const publicId    = `${slug}-${suffix}`;
  const albumFolder = albumId ? slugify(albumId) : 'unsorted';
  const folder      = `portfolio/${albumFolder}`;

  let uploadResult: { public_id: string; secure_url: string };

  if (isPlaceholderCloud || !apiKey || !apiSecret) {
    // Demo / Local Fallback mode when Cloudinary credentials are not configured or using placeholder cloud
    uploadResult = {
      public_id: publicId,
      secure_url: CUSTOM_ERROR_THUMBNAIL,
    };
  } else {
    // ── Sign and Upload to Cloudinary ──────────────────────────────────────────
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
      const signature = await cloudinarySign(paramsToSign, apiSecret);

      const cloudForm = new FormData();
      cloudForm.append('file',       file);
      cloudForm.append('api_key',    apiKey);
      cloudForm.append('timestamp',  String(timestamp));
      cloudForm.append('signature',  signature);
      cloudForm.append('folder',     folder);
      cloudForm.append('public_id',  publicId);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: cloudForm }
      );
      const cloudData = await uploadRes.json() as any;
      if (uploadRes.ok && cloudData?.secure_url) {
        uploadResult = {
          public_id: cloudData.public_id || publicId,
          secure_url: cloudData.secure_url,
        };
      } else {
        const errMsg = cloudData?.error?.message || `Cloudinary API returned HTTP ${uploadRes.status}`;
        return json({ error: `Cloudinary upload failed: ${errMsg}` }, 400);
      }
    } catch (err: any) {
      return json({ error: `Network error uploading to Cloudinary: ${err?.message || 'Upload failed'}` }, 502);
    }
  }

  // ── Insert into D1 ───────────────────────────────────────────────────────
  const dbId = `${slug}-${suffix}`;

  try {
    const existing = await db.prepare('SELECT id FROM photos WHERE id = ?').bind(dbId).first();
    if (existing) {
      return json({ error: `Photo ID conflict: "${dbId}" already exists.` }, 409);
    }

    if (isFeatured) {
      await db.prepare('UPDATE photos SET is_featured = 0').run();
    }
    const countRow = await db.prepare('SELECT COUNT(*) as count FROM photos').first() as any;
    const sortOrder = countRow?.count ?? 99;

    await db.prepare(`
      INSERT INTO photos
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
    return json({
      ok: true,
      warning: `Photo uploaded to Cloudinary but DB insert failed: ${dbErr?.message}. Use "Add Photo Record" with public_id "${uploadResult.public_id}" to save it manually.`,
      id: dbId,
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      title,
    });
  }

  return json({
    ok: true,
    id: dbId,
    public_id: uploadResult.public_id,
    secure_url: uploadResult.secure_url,
    title,
  }, 201);
};
