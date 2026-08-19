/**
 * Spotify Embed Helper
 * Converts Spotify URLs (track, album, playlist) to dark-mode embed iframe URLs.
 */

export interface SpotifyInfo {
  type: 'track' | 'album' | 'playlist' | 'episode' | 'show';
  id: string;
}

export function parseSpotifyUrl(url?: string): SpotifyInfo | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // Spotify URI format: spotify:track:4cOdK2wGLETKBW3PvgPWqT
  if (cleanUrl.startsWith('spotify:')) {
    const parts = cleanUrl.split(':');
    if (parts.length >= 3) {
      const type = parts[1] as SpotifyInfo['type'];
      const id = parts[2];
      return { type, id };
    }
  }

  // Web URL format: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=...
  try {
    const parsed = new URL(cleanUrl);
    if (parsed.hostname.includes('spotify.com')) {
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const typeIdx = pathSegments.findIndex((s) =>
        ['track', 'album', 'playlist', 'episode', 'show'].includes(s)
      );
      if (typeIdx !== -1 && pathSegments[typeIdx + 1]) {
        const type = pathSegments[typeIdx] as SpotifyInfo['type'];
        const id = pathSegments[typeIdx + 1];
        return { type, id };
      }
    }
  } catch (e) {
    return null;
  }

  return null;
}

export function getSpotifyEmbedUrl(url?: string): string | null {
  const info = parseSpotifyUrl(url);
  if (!info) return null;
  return `https://open.spotify.com/embed/${info.type}/${info.id}?utm_source=generator&theme=0`;
}
