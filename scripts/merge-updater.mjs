// Merges the per-target `latest.json` updater manifests produced by
// `tauri build --config '{ "bundle": { "createUpdaterArtifacts": "v1-compatible" } }'`
// into a single consolidated `latest.json` that the plugin-updater consumes at
// https://github.com/arsamadineh/karnameh/releases/latest/download/latest.json
//
// Each desktop target emits its own `latest.json` containing one platform entry.
// This script unions every platform entry and keeps a single coherent manifest.
//
// Usage: node scripts/merge-updater.mjs <path-to-partial.json> [ ... ]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const paths = process.argv.slice(2).filter(Boolean);
if (paths.length === 0) {
  console.error('[merge-updater] no partial latest.json files provided');
  process.exit(1);
}

const platforms = {};
let version = '';
let pubDate = '';

for (const p of paths) {
  if (!existsSync(p)) {
    console.warn(`[merge-updater] missing partial: ${p} — skipping`);
    continue;
  }
  const partial = JSON.parse(readFileSync(p, 'utf8'));
  version = partial.version || version;
  if (partial.pub_date && partial.pub_date > pubDate) pubDate = partial.pub_date;
  Object.assign(platforms, partial.platforms || {});
  console.log(`[merge-updater] merged ${Object.keys(partial.platforms || {}).join(', ')} from ${p}`);
}

if (Object.keys(platforms).length === 0) {
  console.error('[merge-updater] no platform entries found — aborting');
  process.exit(1);
}

const notes = `کارنامه نسخه ${version} — بهینه‌سازی نسخه موبایل، رفع باگ و بهبود سیستم بروزرسانی خودکار.`;

const manifest = {
  version,
  notes,
  pub_date: pubDate || new Date().toISOString(),
  platforms,
};

writeFileSync('latest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`[merge-updater] wrote latest.json with platforms: ${Object.keys(platforms).join(', ')}`);
