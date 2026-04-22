import type { Photo, SiteSetting, SocialLink, Album } from '../types/photo';

const FALLBACK_PHOTO: Photo = {
  id: 'welcome',
  public_id: 'sample',
  cloudinary_url: null,
  title: 'Welcome to your Portfolio',
  caption: 'Get started by uploading your first photo using the CLI tool.',
  roll: 'None',
  location: 'Everywhere',
  medium: 'digital',
  simulation: null,
  camera: 'Nikkormat FTn',
  lens: 'Nikkor 50mm f/1.4',
  film_stock: null,
  album_id: null,
  sort_order: 0,
  is_featured: 1,
};

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

  return photos;
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
