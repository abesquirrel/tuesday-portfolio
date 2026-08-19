/**
 * Shared Cloudinary Web API helper for Cloudflare Workers / Astro SSR.
 * Handles SHA-1 signing, slugification, and asset operations.
 */

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

/** SHA-1 of (paramsString + apiSecret) — Cloudinary's required signing method */
export async function cloudinarySign(paramsToSign: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign + apiSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface CloudinaryRenameResult {
  success: boolean;
  public_id: string;
  secure_url?: string;
  error?: string;
}

export async function moveCloudinaryAsset(
  fromPublicId: string,
  toPublicId: string,
  env?: any
): Promise<CloudinaryRenameResult> {
  if (!fromPublicId || !toPublicId || fromPublicId === toPublicId) {
    return { success: true, public_id: toPublicId };
  }

  const cloudName =
    env?.PUBLIC_CLOUDINARY_CLOUD_NAME ??
    (typeof process !== 'undefined' ? process.env?.PUBLIC_CLOUDINARY_CLOUD_NAME : undefined) ??
    import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey =
    env?.CLOUDINARY_API_KEY ??
    (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_KEY : undefined) ??
    import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret =
    env?.CLOUDINARY_API_SECRET ??
    (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_SECRET : undefined) ??
    import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || cloudName === 'your_cloud_name_here' || !apiKey || !apiSecret) {
    // Local / Demo mode without Cloudinary credentials
    return { success: true, public_id: toPublicId };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `from_public_id=${fromPublicId}&to_public_id=${toPublicId}&timestamp=${timestamp}`;
    const signature = await cloudinarySign(paramsToSign, apiSecret);

    const form = new FormData();
    form.append('from_public_id', fromPublicId);
    form.append('to_public_id', toPublicId);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('overwrite', 'true');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/rename`, {
      method: 'POST',
      body: form,
    });

    const data = (await res.json()) as any;
    if (res.ok && data?.public_id) {
      return {
        success: true,
        public_id: data.public_id,
        secure_url: data.secure_url,
      };
    } else {
      return {
        success: false,
        public_id: toPublicId,
        error: data?.error?.message || 'Failed to rename in Cloudinary',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      public_id: toPublicId,
      error: err?.message || 'Network error during Cloudinary rename',
    };
  }
}
