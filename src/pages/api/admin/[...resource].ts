// src/pages/api/admin/[...resource].ts
//
// REST API for the admin panel.
// All routes are session-protected (same cookie as the admin page).
//
// GET    /api/admin/photos           -> all photos
// POST   /api/admin/photos           -> insert photo
// PUT    /api/admin/photos/:id       -> update photo
// DELETE /api/admin/photos/:id       -> delete photo
// POST   /api/admin/photos/feature   -> set one photo as featured
//
// GET    /api/admin/albums           -> all albums
// POST   /api/admin/albums           -> insert album
// PUT    /api/admin/albums/:id       -> update album
// DELETE /api/admin/albums/:id       -> delete album
//
// GET    /api/admin/settings         -> all site_settings as object
// PUT    /api/admin/settings         -> upsert multiple settings
//
// GET    /api/admin/social           -> all social_links
// POST   /api/admin/social           -> insert link
// PUT    /api/admin/social/:id       -> update link
// DELETE /api/admin/social/:id       -> delete link

import type { APIRoute } from 'astro';
import { isValidSession, getSettings, setSettings } from '../../../lib/db';

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { 'Content-Type': 'application/json' }
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}

// Validates the session cookie against the sessions table (not just presence).
async function checkAuth(cookies: any, db: any): Promise<boolean> {
  const session = cookies.get('admin_session')?.value;
  if (typeof session !== 'string' || session.length === 0) return false;
  try {
    return await isValidSession(db, session);
  } catch (e) {
    console.error('Session validation failed:', e);
    return false;
  }
}

// --- Main handler ---
export const ALL: APIRoute = async ({ params, request, locals, cookies }) => {
  const env = (locals as any).runtime?.env;
  const db = env?.DB || env?.tuesday_photos || env?.['tuesday-photos'];

  // DB must exist before we can validate a session against it.
  if (!db) return json({ error: 'D1 database not available. Run: npx wrangler pages dev -- npx astro dev' }, 503);
  if (!(await checkAuth(cookies, db))) return unauthorized();

  try {
    const resource = (params.resource ?? '').replace(/^\//, '');
    const method = request.method.toUpperCase();
    const parts = resource.split('/');

    // --- photos ---
    if (parts[0] === 'photos') {
      // POST /api/admin/photos/feature
      if (parts[1] === 'feature' && method === 'POST') {
        const { id } = await request.json() as { id: string };
        if (!id) return json({ error: 'id is required' }, 400);
        await db.prepare('UPDATE photos SET is_featured = 0').run();
        await db.prepare('UPDATE photos SET is_featured = 1 WHERE id = ?').bind(id).run();
        return json({ ok: true });
      }

      // GET /api/admin/photos
      // Pagination is opt-in: only kicks in if ?page or ?limit is present.
      // The admin panel's boot() calls this with no params and expects everything back.
      if (!parts[1] && method === 'GET') {
        const url = new URL(request.url);
        const hasPagination = url.searchParams.has('page') || url.searchParams.has('limit');

        if (hasPagination) {
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = parseInt(url.searchParams.get('limit') || '24');
          const offset = (page - 1) * limit;

          const { results } = await db
            .prepare('SELECT p.*, a.title as album_title FROM photos p LEFT JOIN albums a ON p.album_id = a.id ORDER BY p.sort_order ASC LIMIT ? OFFSET ?')
            .bind(limit, offset)
            .all();

          const { count } = await db
            .prepare('SELECT COUNT(*) as count FROM photos')
            .first();

          return json({
            photos: results,
            pagination: {
              page,
              limit,
              total: count,
              totalPages: Math.ceil(count / limit)
            }
          });
        }

        // No pagination params — return everything.
        const { results } = await db
          .prepare('SELECT p.*, a.title as album_title FROM photos p LEFT JOIN albums a ON p.album_id = a.id ORDER BY p.sort_order ASC')
          .all();
        return json({ photos: results });
      }

      // POST /api/admin/photos
      if (!parts[1] && method === 'POST') {
        const p = await request.json() as any;

        if (!p.id || !p.public_id || !p.title) {
          return json({ error: 'id, public_id, and title are required' }, 400);
        }

        const existing = await db.prepare('SELECT id FROM photos WHERE id = ?').bind(p.id).first();
        if (existing) {
          return json({ error: `A photo with id "${p.id}" already exists.` }, 409);
        }

        if (p.is_featured) {
          await db.prepare('UPDATE photos SET is_featured = 0').run();
        }
        await db.prepare(`
          INSERT INTO photos
            (id, public_id, cloudinary_url, title, caption, roll, location, medium, simulation, camera, lens, film_stock, album_id, sort_order, is_featured)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `)
          .bind(
            p.id, p.public_id, p.cloudinary_url ?? null, p.title,
            p.caption ?? '', p.roll ?? '', p.location ?? '',
            p.medium ?? 'film', p.simulation ?? null,
            p.camera ?? null, p.lens ?? null, p.film_stock ?? null,
            p.album_id ?? null, p.sort_order ?? 99, p.is_featured ?? 0
          ).run();
        return json({ ok: true, id: p.id }, 201);
      }

      // PUT /api/admin/photos/:id
      if (parts[1] && method === 'PUT') {
        const p = await request.json() as any;
        if (p.is_featured) {
          await db.prepare('UPDATE photos SET is_featured = 0').run();
        }
        await db.prepare(`
          UPDATE photos SET
            public_id = ?, cloudinary_url = ?, title = ?, caption = ?,
            roll = ?, location = ?, medium = ?, simulation = ?,
            camera = ?, lens = ?, film_stock = ?, album_id = ?,
            sort_order = ?, is_featured = ?
          WHERE id = ?
        `).bind(
          p.public_id, p.cloudinary_url ?? null, p.title,
          p.caption ?? '', p.roll ?? '', p.location ?? '',
          p.medium ?? 'film', p.simulation ?? null,
          p.camera ?? null, p.lens ?? null, p.film_stock ?? null,
          p.album_id ?? null, p.sort_order ?? 99, p.is_featured ?? 0,
          parts[1]
        ).run();
        return json({ ok: true });
      }

      // DELETE /api/admin/photos/:id
      if (parts[1] && method === 'DELETE') {
        await db.prepare('DELETE FROM photos WHERE id = ?').bind(parts[1]).run();
        return json({ ok: true });
      }
    }

    // --- albums ---
    if (parts[0] === 'albums') {
      if (!parts[1] && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM albums ORDER BY sort_order ASC').all();
        return json(results);
      }

      if (!parts[1] && method === 'POST') {
        const a = await request.json() as any;

        if (!a.id || !a.title) {
          return json({ error: 'id and title are required' }, 400);
        }

        const existing = await db.prepare('SELECT id FROM albums WHERE id = ?').bind(a.id).first();
        if (existing) {
          return json({ error: `An album with id "${a.id}" already exists.` }, 409);
        }

        await db.prepare(
          'INSERT INTO albums (id, title, description, sort_order) VALUES (?,?,?,?)'
        ).bind(a.id, a.title, a.description ?? '', a.sort_order ?? 0).run();
        return json({ ok: true, id: a.id }, 201);
      }

      if (parts[1] && method === 'PUT') {
        const a = await request.json() as any;
        await db.prepare(
          'UPDATE albums SET title = ?, description = ?, sort_order = ? WHERE id = ?'
        ).bind(a.title, a.description ?? '', a.sort_order ?? 0, parts[1]).run();
        return json({ ok: true });
      }

      if (parts[1] && method === 'DELETE') {
        // Uncategorise photos in this album first
        await db.prepare('UPDATE photos SET album_id = NULL WHERE album_id = ?').bind(parts[1]).run();
        await db.prepare('DELETE FROM albums WHERE id = ?').bind(parts[1]).run();
        return json({ ok: true });
      }
    }

    // --- settings ---
    if (parts[0] === 'settings') {
      if (method === 'GET') {
        const settings = await getSettings(db);
        return json(settings);
      }
      if (method === 'PUT') {
        const updates = await request.json() as Record<string, string>;
        await setSettings(db, updates);
        return json({ ok: true });
      }
    }

    // --- social ---
    if (parts[0] === 'social') {
      if (!parts[1] && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM social_links ORDER BY sort_order ASC')
          .all();
        return json(results);
      }

      if (!parts[1] && method === 'POST') {
        const l = await request.json() as any;
        if (!l.label || !l.url) {
          return json({ error: 'label and url are required' }, 400);
        }
        const { meta } = await db.prepare(
          'INSERT INTO social_links (label, url, sort_order, icon) VALUES (?,?,?,?)'
        ).bind(l.label, l.url, l.sort_order ?? 0, l.icon ?? null).run();
        return json({ ok: true, id: meta.last_row_id }, 201);
      }

      if (parts[1] && method === 'PUT') {
        const id = parseInt(parts[1]);
        if (Number.isNaN(id)) return json({ error: 'Invalid social link id' }, 400);
        const l = await request.json() as any;
        await db.prepare(
          'UPDATE social_links SET label = ?, url = ?, sort_order = ?, icon = ? WHERE id = ?'
        ).bind(l.label, l.url, l.sort_order ?? 0, l.icon ?? null, id).run();
        return json({ ok: true });
      }

      if (parts[1] && method === 'DELETE') {
        const id = parseInt(parts[1]);
        if (Number.isNaN(id)) return json({ error: 'Invalid social link id' }, 400);
        await db.prepare('DELETE FROM social_links WHERE id = ?').bind(id).run();
        return json({ ok: true });
      }
    }

    return json({ error: 'Not found' }, 404);
  } catch (e: any) {
    console.error(`API error on ${request.method} ${params.resource}:`, e);
    return json({ error: e?.message || 'Internal server error' }, 500);
  }
};