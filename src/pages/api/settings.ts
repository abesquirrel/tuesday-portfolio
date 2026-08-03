---
// src/pages/api/settings.ts
import type { APIRoute } from 'astro';
import { getSettings } from '../../lib/db';

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
    const settings = await getSettings(db);

    return new Response(JSON.stringify({ settings }), {
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
    const env = (locals as any).runtime?.env;
    const db = env?.DB || env?.tuesday_photos || env?.['tuesday-photos'];
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    const entries = Object.fromEntries(formData.entries());
    for (const [key, value] of Object.entries(entries)) {
      if (key && value !== null && value !== undefined) {
        await db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')
          .bind(key, String(value)).run();
      }
    }

    const updatedSettings = await getSettings(db);
    return new Response(JSON.stringify({ settings: updatedSettings }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};