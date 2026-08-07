export const CUSTOM_ERROR_THUMBNAIL = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="none">
  <rect width="600" height="600" fill="#1a1916"/>
  <rect x="20" y="20" width="560" height="560" stroke="#3a3935" stroke-width="2" stroke-dasharray="6 6"/>
  <path d="M 30 50 L 30 30 L 50 30" stroke="#c8a96e" stroke-width="2" fill="none" opacity="0.7"/>
  <path d="M 550 30 L 570 30 L 570 50" stroke="#c8a96e" stroke-width="2" fill="none" opacity="0.7"/>
  <path d="M 570 550 L 570 570 L 550 570" stroke="#c8a96e" stroke-width="2" fill="none" opacity="0.7"/>
  <path d="M 50 570 L 30 570 L 30 550" stroke="#c8a96e" stroke-width="2" fill="none" opacity="0.7"/>
  <g transform="translate(268, 220)">
    <path d="M 4 16 C 4 13.8 5.8 12 8 12 L 20 12 L 24 6 L 40 6 L 44 12 L 56 12 C 58.2 12 60 13.8 60 16 L 60 48 C 60 50.2 58.2 52 56 52 L 8 52 C 5.8 52 4 50.2 4 48 Z" stroke="#c8a96e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="32" cy="32" r="12" stroke="#c8a96e" stroke-width="2.5" fill="none"/>
    <line x1="8" y1="50" x2="56" y2="8" stroke="#c8a96e" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <text x="300" y="335" fill="#c8c4bc" font-family="'Courier New', Courier, monospace" font-size="14" font-weight="600" letter-spacing="3" text-anchor="middle">IMAGE UNAVAILABLE</text>
  <text x="300" y="360" fill="#7a7671" font-family="'Courier New', Courier, monospace" font-size="11" letter-spacing="1.5" text-anchor="middle">ERROR LOADING ASSET</text>
</svg>`)}`;

import type { Photo } from '../types/photo';

const DEFAULT_CLOUD_NAME = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME 
                       ?? (typeof process !== 'undefined' ? process.env.PUBLIC_CLOUDINARY_CLOUD_NAME : undefined);

function isPlaceholderCloud(cloud?: string): boolean {
  return !cloud || cloud === 'your_cloud_name_here';
}

export function transformCloudinaryUrl(url: string, transforms: string): string {
  if (!url) return CUSTOM_ERROR_THUMBNAIL;
  if (url.startsWith('data:')) return url;
  if (url.includes('/image/upload/')) {
    return url.replace(
      /\/image\/upload\/(?:(?:c_[^/]+|w_[^/]+|h_[^/]+|f_[^/]+|q_[^/]+|g_[^/]+|dpr_[^/]+|b_[^/]+|e_[^/]+|r_[^/]+|ar_[^/]+)[^/]*\/)?/,
      `/image/upload/${transforms}/`
    );
  }
  return url;
}

export function cloudinaryUrl(
  publicIdOrUrl: string,
  transforms: string = 'f_auto,q_auto,w_1200',
  cloudName?: string
): string {
  if (!publicIdOrUrl) return CUSTOM_ERROR_THUMBNAIL;
  if (publicIdOrUrl.startsWith('http') || publicIdOrUrl.startsWith('data:')) {
    return transformCloudinaryUrl(publicIdOrUrl, transforms);
  }
  
  const activeCloud = cloudName || DEFAULT_CLOUD_NAME;
  
  if (isPlaceholderCloud(activeCloud)) {
    return CUSTOM_ERROR_THUMBNAIL;
  }
  return `https://res.cloudinary.com/${activeCloud}/image/upload/${transforms}/${publicIdOrUrl.replace(/^\//, '')}`;
}

export function cloudinaryThumb(
  photoOrPublicId?: Pick<Photo, 'public_id' | 'cloudinary_url'> | string,
  cloudName?: string
): string {
  const defaultTransforms = 'f_auto,q_auto,w_600,h_600,c_fill,g_auto';
  if (!photoOrPublicId) return CUSTOM_ERROR_THUMBNAIL;

  if (typeof photoOrPublicId === 'object' && photoOrPublicId !== null) {
    return cloudinaryFromRow(photoOrPublicId, defaultTransforms, cloudName);
  }

  if (typeof photoOrPublicId === 'string') {
    if (photoOrPublicId.startsWith('http') || photoOrPublicId.startsWith('data:')) {
      return transformCloudinaryUrl(photoOrPublicId, defaultTransforms);
    }
    return cloudinaryUrl(photoOrPublicId, defaultTransforms, cloudName);
  }

  return CUSTOM_ERROR_THUMBNAIL;
}

export function cloudinaryHero(publicId: string, cloudName?: string): string {
  return cloudinaryUrl(publicId, 'f_auto,q_auto,w_1920,h_1080,c_fill,g_auto', cloudName);
}

/**
 * Returns the best available URL for a DB photo row with requested transforms applied.
 */
export function cloudinaryFromRow(
  photo: Pick<Photo, 'public_id' | 'cloudinary_url'>,
  transforms: string = 'f_auto,q_auto,w_1200',
  cloudName?: string
): string {
  if (!photo) return CUSTOM_ERROR_THUMBNAIL;
  if (photo.cloudinary_url) {
    return transformCloudinaryUrl(photo.cloudinary_url, transforms);
  }
  if (photo.public_id) {
    return cloudinaryUrl(photo.public_id, transforms, cloudName);
  }
  return CUSTOM_ERROR_THUMBNAIL;
}

