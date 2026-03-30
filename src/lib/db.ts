import type { Photo } from '../types/photo';

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
        .prepare('SELECT * FROM photos ORDER BY sort_order ASC')
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
      simulation:     p.simulation ?? null, // optional Fujifilm sim
      sort_order:     i,
      is_featured:    p.isFeatured ? 1 : 0,
    }));
  } catch (e) {
    console.error('Local JSON fallback failed:', e);
    return [];
  }
}
