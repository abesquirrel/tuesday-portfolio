/**
 * Cloudinary URL builder
 *
 * Usage:
 *   cloudinaryUrl('portfolio/roll-01/frame-03', 'w_1200,f_auto,q_auto')
 *
 * When you set up Cloudinary, set PUBLIC_CLOUDINARY_CLOUD_NAME in .env
 * and in your Cloudflare Pages environment variables.
 *
 * In placeholder mode (no cloud name), returns a picsum URL instead.
 */

import type { Photo } from '../types/photo';

const CLOUD_NAME = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;

export function cloudinaryUrl(
  publicId: string,
  transforms: string = 'f_auto,q_auto,w_1200',
): string {
  if (!CLOUD_NAME || CLOUD_NAME === 'your_cloud_name_here') {
    // Placeholder: derive a stable seed from the publicId string
    const seed = publicId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return `https://picsum.photos/seed/${seed}/1200/800`;
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

export function cloudinaryThumb(publicId: string): string {
  return cloudinaryUrl(publicId, 'f_auto,q_auto,w_600,h_400,c_fill,g_auto');
}

export function cloudinaryHero(publicId: string): string {
  return cloudinaryUrl(publicId, 'f_auto,q_auto,w_1920,h_1080,c_fill,g_auto');
}

/**
 * Returns the best available URL for a DB photo row.
 * Prefers the pre-built `cloudinary_url` column if present,
 * otherwise builds from `public_id` using the specified transforms.
 */
export function cloudinaryFromRow(
  photo: Pick<Photo, 'public_id' | 'cloudinary_url'>,
  transforms: string = 'f_auto,q_auto,w_1200',
): string {
  return photo.cloudinary_url ?? cloudinaryUrl(photo.public_id, transforms);
}
