---
// src/pages/api/photos.ts
import type { APIRoute } from 'astro';

const ADMIN_SECRET = import.meta.env.ADMIN_SECRET || 'change-me-in-cf-dashboard';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const cookie = request.headers.get('cookie') || '';
    const sessionCookie = cookie.split(';').find(c => c.trim().startsWith('admin_session='))?.split('=')[1];
    if (!sessionCookie || sessionCookie !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const album = url.searchParams.get('album') || undefined;
    const medium = url.searchParams.get('medium') || undefined;
    const featured = url.searchParams.get('featured') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const env = (locals as any).runtime?.env;
    const db = env?.DB || env?.tuesday_photos || env?.['tuesday-photos'];
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    let query = 'SELECT p.*, a.title as album_title FROM photos p LEFT JOIN albums a ON p.album_id = a.id';
    const conditions = [];
    const params = [];

    if (album) { conditions.push('p.album_id = ?'); params.push(album); }
    if (medium) { conditions.push('p.medium = ?'); params.push(medium); }
    if (featured) { conditions.push('p.is_featured = ?'); params.push(featured === '1' ? 1 : 0); }
    if (search) {
      conditions.push('(p.title LIKE ? OR p.caption LIKE ? OR p.location LIKE ?)');
      params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY p.sort_order ASC';
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const photosResult = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as count FROM photos p').first();
    const photos = photosResult.results || [];
    const total = countResult.results?.[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return new Response(JSON.stringify({
      photos,
      pagination: { page, limit, total, totalPages }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const cookie = request.headers.get('cookie') || '';
    const sessionCookie = cookie.split(';').find(c => c.trim().startsWith('admin_session='))?.split('=')[1];
    if (!sessionCookie || sessionCookie !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const formData = await request.formData();
    const action = formData.get('action') as string;
    const env = (locals as any).runtime?.env;
    const db = env?.DB || env?.tuesday_photos || env?.['tuesday-photos'];
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    if (action === 'update') {
      const id = formData.get('id') as string;
      const updates = [];
      const params = [];
      const fields = ['title', 'caption', 'roll', 'location', 'medium', 'camera', 'lens', 'film_stock', 'album_id', 'is_featured', 'sort_order'];
      fields.forEach(field => {
        const value = formData.get(field);
        if (value !== null && value !== undefined) {
          updates.push(field + ' = ?');
          params.push(value);
        }
      });
      if (updates.length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });
      }
      params.push(id);
      await db.prepare('UPDATE photos SET ' + updates.join(', ') + ' WHERE id = ?').bind(...params).run();
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'delete') {
      const id = formData.get('id') as string;
      await db.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};