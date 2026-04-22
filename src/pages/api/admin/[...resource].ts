// src/pages/api/admin/[...resource].ts
//
// REST API for the admin panel.
// All routes are session-protected (same cookie as the admin page).
//
// GET    /api/admin/photos           → all photos
// POST   /api/admin/photos           → insert photo
// PUT    /api/admin/photos/:id       → update photo
// DELETE /api/admin/photos/:id       → delete photo
// POST   /api/admin/photos/feature   → set one photo as featured
//
// GET    /api/admin/albums           → all albums
// POST   /api/admin/albums           → insert album
// PUT    /api/admin/albums/:id       → update album
// DELETE /api/admin/albums/:id       → delete album
//
// GET    /api/admin/settings         → all site_settings as object
// PUT    /api/admin/settings         → upsert multiple settings
//
// GET    /api/admin/social           → all social_links
// POST   /api/admin/social           → insert link
// PUT    /api/admin/social/:id       → update link
// DELETE /api/admin/social/:id       → delete link

import type { APIRoute } from 'astro';

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

function checkAuth(cookies: any, secret: string): boolean {
  const session = cookies.get('admin_session')?.value;
  return session === secret;
}

// ─── Main handler ──────────────────────────────────────────────────────────
export const ALL: APIRoute = async ({ params, request, locals, cookies }) => {
  const env      = (locals as any).runtime?.env;
  const db       = env?.DB;
  const SECRET   = env?.ADMIN_SECRET ?? import.meta.env.ADMIN_SECRET ?? 'change-me-in-cf-dashboard';

  if (!checkAuth(cookies, SECRET)) return unauthorized();
  if (!db) return json({ error: 'D1 binding not found. Check wrangler.toml' }, 503);

  const resource = (params.resource ?? '').replace(/^\//, '');
  const method   = request.method.toUpperCase();
  const parts    = resource.split('/');

  // ── photos ──────────────────────────────────────────────────────────────
  if (parts[0] === 'photos') {
    // POST /api/admin/photos/feature
    if (parts[1] === 'feature' && method === 'POST') {
      const { id } = await request.json() as { id: string };
      await db.prepare('UPDATE photos SET is_featured = 0').run();
      await db.prepare('UPDATE photos SET is_featured = 1 WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }

    // GET /api/admin/photos
    if (!parts[1] && method === 'GET') {
      const { results } = await db
        .prepare('SELECT p.*, a.title as album_title FROM photos p LEFT JOIN albums a ON p.album_id = a.id ORDER BY p.sort_order ASC')
        .all();
      return json(results);
    }

    // POST /api/admin/photos
    if (!parts[1] && method === 'POST') {
      const p = await request.json() as any;
      if (p.is_featured) {
        await db.prepare('UPDATE photos SET is_featured = 0').run();
      }
      await db.prepare(`
        INSERT OR REPLACE INTO photos
          (id, public_id, cloudinary_url, title, caption, roll, location, medium, simulation, camera, lens, film_stock, album_id, sort_order, is_featured)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
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

  // ── albums ──────────────────────────────────────────────────────────────
  if (parts[0] === 'albums') {
    if (!parts[1] && method === 'GET') {
      const { results } = await db.prepare('SELECT * FROM albums ORDER BY sort_order ASC').all();
      return json(results);
    }
    if (!parts[1] && method === 'POST') {
      const a = await request.json() as any;
      await db.prepare(
        'INSERT OR IGNORE INTO albums (id, title, description, sort_order) VALUES (?,?,?,?)'
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

  // ── settings ─────────────────────────────────────────────────────────────
  if (parts[0] === 'settings') {
    if (method === 'GET') {
      const { results } = await db.prepare('SELECT * FROM site_settings').all();
      const obj: Record<string, string> = {};
      (results as any[]).forEach(r => { obj[r.key] = r.value; });
      return json(obj);
    }
    if (method === 'PUT') {
      const updates = await request.json() as Record<string, string>;
      const stmts = Object.entries(updates).map(([k, v]) =>
        db.prepare(
          'INSERT INTO site_settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
        ).bind(k, v)
      );
      await db.batch(stmts);
      return json({ ok: true });
    }
  }

  // ── social ───────────────────────────────────────────────────────────────
  if (parts[0] === 'social') {
    if (!parts[1] && method === 'GET') {
      const { results } = await db
        .prepare('SELECT * FROM social_links ORDER BY sort_order ASC')
        .all();
      return json(results);
    }
    if (!parts[1] && method === 'POST') {
      const l = await request.json() as any;
      const { meta } = await db.prepare(
        'INSERT INTO social_links (label, url, sort_order) VALUES (?,?,?)'
      ).bind(l.label, l.url, l.sort_order ?? 0).run();
      return json({ ok: true, id: meta.last_row_id }, 201);
    }
    if (parts[1] && method === 'PUT') {
      const l = await request.json() as any;
      await db.prepare(
        'UPDATE social_links SET label = ?, url = ?, sort_order = ? WHERE id = ?'
      ).bind(l.label, l.url, l.sort_order ?? 0, parseInt(parts[1])).run();
      return json({ ok: true });
    }
    if (parts[1] && method === 'DELETE') {
      await db.prepare('DELETE FROM social_links WHERE id = ?').bind(parseInt(parts[1])).run();
      return json({ ok: true });
    }
  }

  return json({ error: 'Not found' }, 404);
};
