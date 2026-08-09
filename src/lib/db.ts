import type { Photo, SiteSetting, SocialLink, Album } from '../types/photo';

/**
 * Unified data fetcher for the portfolio.
 * 
 * Works in both Cloudflare D1 (production/preview) and 
 * local JSON fallback (standard `npm run dev`).
 * 
 * @param db The D1 binding from `Astro.locals.runtime.env.DB`
 */
export async function getPhotos(db?: any): Promise<Photo[]> {
  let photos: Photo[] = [];

  // 1. Try D1 if binding exists
  if (db) {
    try {
      const result = await db
        .prepare('SELECT p.*, a.title as album_title FROM photos p LEFT JOIN albums a ON p.album_id = a.id ORDER BY p.sort_order ASC')
        .all();
      photos = result.results as Photo[] || [];
    } catch (e) {
      console.error('D1 query failed:', e);
    }
  }

  // 2. Fallback to local JSON if D1 is empty OR has no photos
  if (photos.length === 0) {
    try {
      const { default: json } = await import('../data/photos.json');
      photos = (json as any[]).map((p, i) => ({
        id:             p.id,
        public_id:      p.publicId,
        cloudinary_url: null,
        title:          p.title,
        caption:        p.caption ?? '',
        roll:           p.roll ?? '',
        location:       p.location ?? '',
        medium:         p.medium ?? 'film',
        simulation:     p.simulation ?? null,
        camera:         p.camera ?? null,
        lens:           p.lens ?? null,
        film_stock:     p.filmStock ?? null,
        album_id:       p.albumId ?? null,
        sort_order:     i,
        is_featured:    p.isFeatured ? 1 : 0,
      }));
    } catch (e) {
      console.error('Local JSON fallback failed:', e);
    }
  }

  return photos;
}

/**
 * Fetches site settings (bio, gear notes, etc.) as a flat key→value object.
 */
export async function getSettings(db?: any): Promise<Record<string, string>> {
  if (db) {
    try {
      const result = await db.prepare('SELECT * FROM site_settings').all();
      const settings: Record<string, string> = {};
      (result.results as SiteSetting[]).forEach((row) => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (e) {
      console.error('D1 settings query failed:', e);
    }
  }
  return {};
}

/**
 * Upserts one site_settings row per key.
 * null values are coerced to '' (the row is kept, not deleted).
 */
export async function setSettings(db: any, updates: Record<string, string | null>): Promise<void> {
  if (!db) return;
  const stmts = Object.entries(updates).map(([key, value]) =>
    db
      .prepare(
        `INSERT INTO site_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .bind(key, value == null ? '' : String(value))
  );
  if (stmts.length > 0) await db.batch(stmts);
}

/**
 * Fetches social links
 */
export async function getSocialLinks(db?: any): Promise<SocialLink[]> {
  if (db) {
    try {
      const result = await db
        .prepare('SELECT id, label, url, sort_order, icon FROM social_links ORDER BY sort_order ASC')
        .all();
      return result.results as SocialLink[];
    } catch (e) {
      console.error('D1 social_links query failed:', e);
    }
  }
  return [];
}

/**
 * Fetches all albums
 */
export async function getAlbums(db?: any): Promise<Album[]> {
  if (db) {
    try {
      const result = await db
        .prepare('SELECT * FROM albums ORDER BY sort_order ASC')
        .all();
      return result.results as Album[];
    } catch (e) {
      console.error('D1 albums query failed:', e);
    }
  }
  return [];
}

// ─── Session management ───────────────────────────────────────────────────────

/**
 * Persists a new session token with a TTL.
 * Called immediately after a successful password check on login.
 */
export async function createSession(
  db: any,
  token: string,
  ttlSeconds = 60 * 60 * 24 * 7 // 7 days
): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  await db
    .prepare('INSERT INTO sessions (token, expires_at) VALUES (?, ?)')
    .bind(token, expiresAt)
    .run();
}

/**
 * Returns true if the token exists in the sessions table and has not expired.
 * Fails closed (returns false) on any DB error.
 */
export async function isValidSession(db: any, token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const row = await db
      .prepare('SELECT expires_at FROM sessions WHERE token = ?')
      .bind(token)
      .first();
    if (!row) return false;
    return (row.expires_at as number) > Date.now();
  } catch (e) {
    console.error('isValidSession failed:', e);
    return false; // fail closed
  }
}

/**
 * Deletes a session token. Called on logout.
 */
export async function deleteSession(db: any, token: string): Promise<void> {
  if (!token) return;
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

/**
 * Deletes all expired sessions. Run opportunistically (e.g., on login).
 */
export async function pruneExpiredSessions(db: any): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE expires_at <= ?')
    .bind(Date.now())
    .run();
}
