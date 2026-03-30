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
  // 1. Try D1 if binding exists
  if (db) {
    try {
      const result = await db
        .prepare('SELECT p.*, a.title as album_title FROM photos p LEFT JOIN albums a ON p.album_id = a.id ORDER BY p.sort_order ASC')
        .all();
      return result.results as Photo[];
    } catch (e) {
      console.error('D1 query failed, falling back to JSON:', e);
    }
  }

  // 2. Fallback to local JSON (allows development without Wrangler)
  try {
    // Dynamic import to avoid bundling the JSON into production SSR builds if possible
    const { default: json } = await import('../data/photos.json');
    
    return (json as any[]).map((p, i) => ({
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
    return [];
  }
}

/**
 * Fetches site settings (bio, gear notes, etc.)
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
 * Fetches social links
 */
export async function getSocialLinks(db?: any): Promise<SocialLink[]> {
  if (db) {
    try {
      const result = await db
        .prepare('SELECT * FROM social_links ORDER BY sort_order ASC')
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
