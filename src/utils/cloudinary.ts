// Custom error thumbnail — base64-encoded SVG matching the darkroom theme.
// Base64 avoids any character-encoding or newline issues when embedded in JS attributes.
export const CUSTOM_ERROR_THUMBNAIL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgNjAwIDYwMCIgZmlsbD0ibm9uZSI+CiAgPHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMxYTE5MTYiLz4KICA8cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSI1NjAiIGhlaWdodD0iNTYwIiBzdHJva2U9IiMzYTM5MzUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNiA2Ii8+CiAgPHBhdGggZD0iTSAzMCA1MCBMIDMwIDMwIEwgNTAgMzAiIHN0cm9rZT0iI2M4YTk2ZSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjciLz4KICA8cGF0aCBkPSJNIDU1MCAzMCBMIDU3MCAzMCBMIDU3MCA1MCIgc3Ryb2tlPSIjYzhhOTZlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuNyIvPgogIDxwYXRoIGQ9Ik0gNTcwIDU1MCBMIDU3MCA1NzAgTCA1NTAgNTcwIiBzdHJva2U9IiNjOGE5NmUiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iMC43Ii8+CiAgPHBhdGggZD0iTSA1MCA1NzAgTCAzMCA1NzAgTCAzMCA1NTAiIHN0cm9rZT0iI2M4YTk2ZSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjciLz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNjgsIDIyMCkiPgogICAgPHBhdGggZD0iTSA0IDE2IEMgNCAxMy44IDUuOCAxMiA4IDEyIEwgMjAgMTIgTCAyNCA2IEwgNDAgNiBMIDQ0IDEyIEwgNTYgMTIgQyA1OC4yIDEyIDYwIDEzLjggNjAgMTYgTCA2MCA0OCBDIDYwIDUwLjIgNTguMiA1MiA1NiA1MiBMIDggNTIgQyA1LjggNTIgNCA1MC4yIDQgNDggWiIgc3Ryb2tlPSIjYzhhOTZlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+CiAgICA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIxMiIgc3Ryb2tlPSIjYzhhOTZlIiBzdHJva2Utd2lkdGg9IjIuNSIgZmlsbD0ibm9uZSIvPgogICAgPGxpbmUgeDE9IjgiIHkxPSI1MCIgeDI9IjU2IiB5Mj0iOCIgc3Ryb2tlPSIjYzhhOTZlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPC9nPgogIDx0ZXh0IHg9IjMwMCIgeT0iMzM1IiBmaWxsPSIjYzhjNGJjIiBmb250LWZhbWlseT0iJ0NvdXJpZXIgTmV3JywgQ291cmllciwgbW9ub3NwYWNlIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNjAwIiBsZXR0ZXItc3BhY2luZz0iMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SU1BR0UgVU5BVkFJTEFCTEU8L3RleHQ+CiAgPHRleHQgeD0iMzAwIiB5PSIzNjAiIGZpbGw9IiM3YTc2NzEiIGZvbnQtZmFtaWx5PSInQ291cmllciBOZXcnLCBDb3VyaWVyLCBtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTEiIGxldHRlci1zcGFjaW5nPSIxLjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVSUk9SIExPQURJTkcgQVNTRVQ8L3RleHQ+Cjwvc3ZnPg==';

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
      /\/image\/upload\/(?:(?:v_[^/]+|s_[^/]+|c_[^/]+|w_[^/]+|h_[^/]+|f_[^/]+|q_[^/]+|g_[^/]+|dpr_[^/]+|b_[^/]+|e_[^/]+|r_[^/]+|ar_[^/]+)[^/]*\/)*/,
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

