import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { execSync } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';

/**
 * CLI Tool to upload photos to Cloudinary and insert them into Cloudflare D1.
 * 
 * Usage:
 *   npx ts-node scripts/upload.ts path/to/photo.jpg
 */

const cloud_name = process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
const api_key    = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
  console.error('❌ Error: Missing Cloudinary environment variables (PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
  process.exit(1);
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => 
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx ts-node scripts/upload.ts <file_path>');
    process.exit(1);
  }

  const fileName = path.basename(filePath, path.extname(filePath));

  console.log(`\n--- Uploading: ${filePath} ---`);

  // 1. Gather Metadata
  const title     = await question(`Title [${fileName}]: `) || fileName;
  const album     = await question('Album ID (brooklyn, chicago, detroit, pittsburgh): ');
  const location  = await question('Location: ');
  const roll      = await question('Roll / Date: ');
  const camera    = await question('Camera: ');
  const lens      = await question('Lens: ');
  const filmStock = await question('Film Stock: ');
  const medium    = await question('Medium (film / digital) [film]: ') || 'film';
  const caption   = await question('Caption (optional): ');
  const featured  = await question('Is Featured? (y/n) [n]: ').then(r => r.toLowerCase() === 'y');

  const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // 2. Upload to Cloudinary
  console.log('\nUploading to Cloudinary...');
  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `portfolio/grid`,
      public_id: id,
    });

    console.log('✅ Uploaded to Cloudinary:', uploadResult.secure_url);

    // 3. Prepare SQL
    const sql = `
      INSERT INTO photos 
        (id, public_id, title, caption, roll, location, medium, camera, lens, film_stock, album_id, is_featured, sort_order)
      VALUES (
        '${id}', 
        '${uploadResult.public_id}', 
        '${title}', 
        '${caption}', 
        '${roll}', 
        '${location}', 
        '${medium}', 
        '${camera}', 
        '${lens}', 
        '${filmStock}', 
        '${album}', 
        ${featured ? 1 : 0},
        (SELECT COUNT(*) FROM photos)
      );
    `.trim();

    console.log('\nPrepared SQL:');
    console.log(sql);

    // 4. Execute SQL
    const confirm = await question('\nExecute on local D1? (y/n) [y]: ') || 'y';
    if (confirm.toLowerCase() === 'y') {
      console.log('Updating local D1 database...');
      execSync(`npx wrangler d1 execute tuesday-photos --local --command="${sql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log('✅ Database updated successfully.');
    }
    
    console.log('\nTo update remote production DB, run:');
    console.log(`npx wrangler d1 execute tuesday-photos --remote --command="${sql.replace(/"/g, '\\"')}"`);

  } catch (err) {
    console.error('❌ Upload failed:', err);
  } finally {
    rl.close();
  }
}

main();
