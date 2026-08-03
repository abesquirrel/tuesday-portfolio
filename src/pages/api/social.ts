---
// src/pages/api/social.ts
import type { APIRoute } from 'astro';

const ADMIN_SECRET = import.meta.env.ADMIN_SECRET || 'change-me-in-cf-dashboard';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const cookie = request.headers.get('cookie') || '';
    const sessionCookie = cookie.split(';').find(c => c.trim().startsWith('admin_session='))?.split('=')[1];
    if (!sessionCookie || sessionCookie !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const env = (locals as any).runtime?.env;
    const db = env?.DB || env?.tuesday_photos || env?.['tuesday-photos'];
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    const socialResult = await db.prepare('SELECT * FROM social_links ORDER BY sort_order ASC').all();
    const socialLinks = socialResult.results || [];

    return new Response(JSON.stringify({ socialLinks }), {
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

    if (action === 'create') {
      const label = formData.get('label') as string;
      const url = formData.get('url') as string;
      const sortOrder = parseInt(formData.get('sort_order') as string || '0');

      await db.prepare('INSERT INTO social_links (label, url, sort_order) VALUES (?, ?, ?)')
        .bind(label, url, sortOrder).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update') {
      const id = parseInt(formData.get('id') as string);
      const updates = [];
      const params = [];
      const fields = ['label', 'url', 'sort_order'];
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
      await db.prepare('UPDATE social_links SET ' + updates.join(', ') + ' WHERE id = ?').bind(...params).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete') {
      const id = parseInt(formData.get('id') as string);
      await db.prepare('DELETE FROM social_links WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};