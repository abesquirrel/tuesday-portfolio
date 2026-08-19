/**
 * Shared Photo type used across components and pages.
 * Mirrors the D1 `photos` table — camelCase aliases for JS convenience.
 */
export interface Photo {
  id:             string;
  public_id:      string;          // Cloudinary public ID
  cloudinary_url: string | null;   // optional pre-built URL
  title:          string;
  caption:        string;
  roll:           string;
  location:       string;
  medium:         'film' | 'digital';
  simulation:     string | null;   // Fujifilm sim name
  camera:         string | null;
  lens:           string | null;
  film_stock:     string | null;
  album_id:       string | null;   // link to album
  sort_order:     number;
  is_featured:    number;          // 0 | 1 (SQLite boolean)
  spotify_url?:   string | null;   // optional Spotify link
}

export interface SiteSetting {
  key:   string;
  value: string;
}

export interface SocialLink {
  id:         number;
  label:      string;
  url:        string;
  sort_order: number;
  icon?:      string;  // Optional icon identifier (e.g., 'instagram', 'twitter', 'email')
}

export interface Album {
  id:          string;
  title:       string;
  description: string;
  sort_order:  number;
  spotify_url?: string | null;     // optional Spotify link
}

export interface JournalEntry {
  id:              string;
  title:           string;
  body:            string;
  location:        string;
  shoot_date:      string;
  cover_public_id: string;
  status:          'draft' | 'published';
  sort_order:      number;
  created_at?:     number;
}

