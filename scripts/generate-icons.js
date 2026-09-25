import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const svgPath = path.resolve('public/chuvadi-logo.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PWA icons from', svgPath);

  // 1. pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 2. pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 3. apple-touch-icon.png (180x180 with solid dark background for iOS Safari)
  const resizedForApple = await sharp(svgBuffer)
    .resize(144, 144)
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 11, g: 15, b: 20, alpha: 1 } // #0b0f14
    }
  })
    .composite([{ input: resizedForApple, top: 18, left: 18 }])
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 4. pwa-maskable-512x512.png (512x512 with safe margin padding 15% on each side)
  // Safe zone for maskable icons is the center 80% circle
  const innerSize = Math.round(512 * 0.72); // ~368px
  const offset = Math.round((512 - innerSize) / 2); // ~72px

  const resizedInner = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 11, g: 15, b: 20, alpha: 1 } // #0b0f14
    }
  })
    .composite([{ input: resizedInner, top: offset, left: offset }])
    .png()
    .toFile(path.resolve('public/pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // 5. favicon.png (64x64)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.resolve('public/favicon.png'));
  console.log('Created favicon.png');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
