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
  sort_order:     number;
  is_featured:    number;          // 0 | 1 (SQLite boolean)
}
