/**
 * update-icons.js
 * Resizes docs/play-store/app_icon.png to all required sizes and copies
 * to every icon location in the project (web, PWA, Android, iOS).
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../docs/play-store/app_icon.png');
const ROOT = path.resolve(__dirname, '..');

async function resize(size, destPath) {
  await sharp(SRC)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(destPath);
  console.log(`  ✓ ${path.relative(ROOT, destPath)} (${size}x${size})`);
}

async function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  ✓ copied → ${path.relative(ROOT, dest)}`);
}

async function main() {
  console.log('\n🖼  Updating icons from docs/play-store/app_icon.png\n');

  // ── 1. Root icons/ folder (source for Capacitor & PWA) ──────────────────
  console.log('[ icons/ ]');
  await resize(1024, `${ROOT}/icons/icon-1024.png`);
  await resize(512,  `${ROOT}/icons/icon-512.png`);
  await resize(192,  `${ROOT}/icons/icon-192.png`);

  // ── 2. assets/ folder (source for @capacitor/assets generator) ──────────
  console.log('\n[ assets/ ]');
  await resize(1024, `${ROOT}/assets/icon-only.png`);
  await resize(1024, `${ROOT}/assets/icon-foreground.png`);

  // ── 3. Capacitor-synced web copies ───────────────────────────────────────
  const webCopyRoots = [
    `${ROOT}/.capacitor-web/icons`,
    `${ROOT}/android/app/src/main/assets/public/icons`,
    `${ROOT}/ios/App/App/public/icons`,
  ];
  for (const dir of webCopyRoots) {
    if (fs.existsSync(dir)) {
      console.log(`\n[ ${path.relative(ROOT, dir)} ]`);
      fs.mkdirSync(dir, { recursive: true });
      await resize(1024, `${dir}/icon-1024.png`);
      await resize(512,  `${dir}/icon-512.png`);
      await resize(192,  `${dir}/icon-192.png`);
    }
  }

  // ── 4. iOS AppIcon ───────────────────────────────────────────────────────
  const iosIconPath = `${ROOT}/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`;
  if (fs.existsSync(path.dirname(iosIconPath))) {
    console.log('\n[ iOS AppIcon ]');
    await resize(1024, iosIconPath);
  }

  // ── 5. favicon.svg → replaced with PNG favicon ──────────────────────────
  // We'll generate a 32x32 and 180x180 PNG favicon, and update the SVG
  // to embed the actual icon artwork as a data URI isn't practical for SVG,
  // so instead we write a favicon.png and update index.html reference.
  console.log('\n[ favicon ]');
  const faviconPng = `${ROOT}/favicon.png`;
  await resize(512, faviconPng);
  console.log('  ✓ favicon.png created (512x512, browser will downscale)');

  // Sync favicon copies to capacitor assets
  const faviconCopies = [
    `${ROOT}/.capacitor-web/favicon.png`,
    `${ROOT}/android/app/src/main/assets/public/favicon.png`,
    `${ROOT}/ios/App/App/public/favicon.png`,
  ];
  for (const dest of faviconCopies) {
    if (fs.existsSync(path.dirname(dest))) {
      fs.copyFileSync(faviconPng, dest);
      console.log(`  ✓ copied → ${path.relative(ROOT, dest)}`);
    }
  }

  console.log('\n✅ All icon sizes generated.');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npx @capacitor/assets generate --android --iconBackgroundColor \'#0d1b2a\'');
  console.log('   2. Update index.html favicon link from favicon.svg → favicon.png');
  console.log('   3. Rebuild & re-sync Capacitor: npx cap sync');
}

main().catch(err => { console.error(err); process.exit(1); });
