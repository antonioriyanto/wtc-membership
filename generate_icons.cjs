const sharp = require('sharp');
const fs = require('fs');

const svgCode = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0f172a" rx="112" ry="112" />
  <text x="256" y="270" font-family="Arial, sans-serif" font-weight="bold" font-size="280" fill="white" text-anchor="middle" dominant-baseline="middle">W</text>
</svg>
`;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

sharp(Buffer.from(svgCode))
  .resize(192, 192)
  .png()
  .toFile('public/pwa-192x192.png');

sharp(Buffer.from(svgCode))
  .resize(512, 512)
  .png()
  .toFile('public/pwa-512x512.png');

sharp(Buffer.from(svgCode))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png');
