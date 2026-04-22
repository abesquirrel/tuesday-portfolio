import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { execSync } from 'child_process';

/**
 * Migration script to upload placeholder images from external URLs to Cloudinary
 * and sync them with the remote Cloudflare D1 database.
 */

const cloud_name = process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
const api_key    = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
  console.error('❌ Error: Missing Cloudinary environment variables.');
  process.exit(1);
}

cloudinary.config({ cloud_name, api_key, api_secret });

const placeholders = [
  {
    id: "featured",
    publicId: "portfolio/featured/main",
    sourceUrl: "https://picsum.photos/id/10/1920/1080",
    title: "Somewhere on the 7 Train",
    caption: "The light came through just right. I almost missed it.",
    roll: "Roll 01",
    location: "Queens, NY",
    medium: "film",
    isFeatured: true,
    albumId: "brooklyn"
  },
  {
    id: "photo-01",
    publicId: "portfolio/grid/photo-01",
    sourceUrl: "https://picsum.photos/id/11/600/400",
    title: "Corner Store, 6am",
    caption: "Nobody was awake except the clerk and the neon.",
    roll: "Roll 01",
    location: "Brooklyn, NY",
    medium: "film",
    isFeatured: false,
    albumId: "brooklyn"
  },
  {
    id: "photo-02",
    publicId: "portfolio/grid/photo-02",
    sourceUrl: "https://picsum.photos/id/12/600/400",
    title: "The Long Platform",
    caption: "Shot on Tri-X pushed to 1600.",
    roll: "Roll 02",
    location: "Chicago, IL",
    medium: "film",
    isFeatured: false,
    albumId: "chicago"
  },
  {
    id: "photo-03",
    publicId: "portfolio/grid/photo-03",
    sourceUrl: "https://picsum.photos/id/13/600/400",
    title: "Between Shifts",
    caption: "She didn't notice me. That was the point.",
    roll: "Roll 02",
    location: "Chicago, IL",
    medium: "digital",
    simulation: "Classic Chrome",
    isFeatured: false,
    albumId: "chicago"
  },
  {
    id: "photo-04",
    publicId: "portfolio/grid/photo-04",
    sourceUrl: "https://picsum.photos/id/14/600/400",
    title: "Overpass, Late Summer",
    caption: "Everything was the same grey.",
    roll: "Roll 03",
    location: "Detroit, MI",
    medium: "digital",
    simulation: "Acros",
    isFeatured: false,
    albumId: "detroit"
  },
  {
    id: "photo-05",
    publicId: "portfolio/grid/photo-05",
    sourceUrl: "https://picsum.photos/id/15/600/400",
    title: "Diner Window",
    caption: "Condensation and the parking lot beyond.",
    roll: "Roll 03",
    location: "Detroit, MI",
    medium: "film",
    isFeatured: false,
    albumId: "detroit"
  },
  {
    id: "photo-06",
    publicId: "portfolio/grid/photo-06",
    sourceUrl: "https://picsum.photos/id/16/600/400",
    title: "The Last Bus",
    caption: "Ilford HP5. The grain felt right.",
    roll: "Roll 04",
    location: "Pittsburgh, PA",
    medium: "film",
    isFeatured: false,
    albumId: "pittsburgh"
  },
  {
    id: "photo-07",
    publicId: "portfolio/grid/photo-07",
    sourceUrl: "https://picsum.photos/id/17/600/400",
    title: "Rooftop, February",
    caption: "Cold enough that the camera almost wouldn't wind.",
    roll: "Roll 04",
    location: "Pittsburgh, PA",
    medium: "digital",
    simulation: "Eterna Cinema",
    isFeatured: false,
    albumId: "pittsburgh"
  },
  {
    id: "photo-08",
    publicId: "portfolio/grid/photo-08",
    sourceUrl: "https://picsum.photos/id/18/600/400",
    title: "After the Shift",
    caption: "He'd been standing there a while before I saw him.",
    roll: "Roll 05",
    location: "Cleveland, OH",
    medium: "film",
    isFeatured: false,
    albumId: "pittsburgh"
  },
  {
    id: "portrait",
    publicId: "portfolio/about/portrait",
    sourceUrl: "https://picsum.photos/id/64/600/750",
    title: "Portrait",
    caption: "",
    roll: "",
    location: "",
    medium: "",
    isFeatured: false,
    isPortrait: true
  }
];

async function migrate() {
  console.log('🚀 Starting placeholder migration to Cloudinary...');

  for (const p of placeholders) {
    console.log(`\n--- Processing: ${p.title || p.publicId} ---`);
    try {
      // 1. Upload to Cloudinary via URL
      const uploadResult = await cloudinary.uploader.upload(p.sourceUrl, {
        public_id: p.publicId,
        overwrite: true
      });
      console.log(`✅ Uploaded to Cloudinary: ${uploadResult.secure_url}`);

      // 2. Skip D1 if it's just the portrait asset (handled by settings)
      if (p.isPortrait) continue;

      // 3. Prepare SQL for D1
      const sql = `
        INSERT OR REPLACE INTO photos 
          (id, public_id, title, caption, roll, location, medium, simulation, album_id, is_featured, sort_order)
        VALUES (
          '${p.id}', 
          '${p.publicId}', 
          '${(p.title || "").replace(/'/g, "''")}', 
          '${(p.caption || "").replace(/'/g, "''")}', 
          '${(p.roll || "").replace(/'/g, "''")}', 
          '${(p.location || "").replace(/'/g, "''")}', 
          '${p.medium}', 
          ${p.simulation ? `'${p.simulation}'` : 'NULL'}, 
          ${p.albumId ? `'${p.albumId}'` : 'NULL'}, 
          ${p.isFeatured ? 1 : 0},
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM photos)
        );
      `.trim();

      // 4. Execute on remote D1
      console.log('Syncing with remote D1...');
      execSync(`npx wrangler d1 execute tuesday-photos --remote --command="${sql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log('✅ Remote D1 synced.');

    } catch (err) {
      console.error(`❌ Failed processing ${p.id}:`, err);
    }
  }

  // 5. Update settings to point to the new portrait
  console.log('\n--- Finalizing Settings ---');
  const settingsSql = `INSERT INTO site_settings (key, value) VALUES ('about_image_id', 'portfolio/about/portrait') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;
  execSync(`npx wrangler d1 execute tuesday-photos --remote --command="${settingsSql}"`, { stdio: 'inherit' });
  console.log('✅ Site settings updated.');

  console.log('\n✨ Migration complete! All placeholders are now real Cloudinary assets.');
}

migrate();
