const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('download page has a complete, non-clickable coming-soon implementation', () => {
  const html = read('download/index.html');
  assert.match(html, /<title>Get Is This a Scam\? \| Soukai<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.getsoukai\.com\/download\/">/);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.equal((html.match(/<script src="\/assets\/js\/marketing\.js" defer><\/script>/g) || []).length, 1);
  assert.equal((html.match(/<script src="\/assets\/js\/download\.js" defer><\/script>/g) || []).length, 1);
  assert.match(html, /App Store/);
  assert.match(html, /Google Play/);
  const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/g), (match) => match[1]);
  assert.equal(hrefs.some((href) => href === '#' || /(?:apple\.com|googleplay|play\.google\.com)/i.test(href)), false);
  assert.doesNotMatch(html, /data-store=/);
});

test('download script only detects platform for local UI and has no store telemetry or persistence', () => {
  const source = read('assets/js/download.js');
  assert.match(source, /const APP_STORE_URL = null;/);
  assert.match(source, /const GOOGLE_PLAY_URL = null;/);
  assert.match(source, /navigator\.userAgent/);
  assert.doesNotMatch(source, /fetch\(|store_click|marketing_page_view|localStorage|sessionStorage|document\.cookie|indexedDB|sendBeacon|postMessage/);
  assert.doesNotMatch(source, /location\.(?:assign|replace|href)\s*=/);
});

function runDownload(language, userAgent) {
  const note = { textContent: '' };
  const context = {
    navigator: { userAgent },
    document: {
      documentElement: { lang: language },
      getElementById: (id) => (id === 'platform-note' ? note : null),
    },
  };
  vm.runInNewContext(read('assets/js/download.js'), context);
  return note.textContent;
}

test('download availability messages use the page language and retain platform detection', () => {
  assert.equal(runDownload('en', 'Mozilla/5.0 (iPhone)'), 'The App Store will be the right option when it is available.');
  assert.equal(runDownload('ar', 'Mozilla/5.0 (Linux; Android 14)'), 'سيكون Google Play الخيار المناسب عندما يصبح متاحًا.');
  assert.equal(runDownload('fr', 'Mozilla/5.0'), 'La disponibilité en boutique sera annoncée après approbation.');
  assert.equal(runDownload('es', 'Mozilla/5.0'), 'La disponibilidad en tiendas se anunciará tras la aprobación.');
  assert.equal(runDownload('it', 'Mozilla/5.0'), 'La disponibilità negli store sarà annunciata dopo l’approvazione.');
  assert.equal(runDownload('fr-CA', 'Mozilla/5.0 (iPad)'), 'L’App Store sera la bonne option lorsqu’il sera disponible.');
  assert.equal(runDownload('de', 'Mozilla/5.0'), 'Store availability will be announced after approval.');
});

function runCreatorRoute(pathname, language = 'en-US') {
  const calls = [];
  const status = { textContent: 'Opening the availability page.' };
  const context = {
    URL,
    navigator: { languages: [language], language },
    window: {
      location: {
        origin: 'https://www.getsoukai.com',
        pathname,
        replace(value) { calls.push(value); },
      },
    },
    document: { getElementById: () => status },
  };
  vm.runInNewContext(read('assets/js/creator-route.js'), context);
  return { calls, status };
}

test('creator routes accept only a bounded lower-case slug and build a fixed download destination', () => {
  for (const slug of ['alice', 'alice-smith', 'ugc_01']) {
    const { calls } = runCreatorRoute(`/r/${slug}/`);
    assert.deepEqual(calls, [`/download/?utm_source=ugc&utm_medium=creator&utm_campaign=launch&utm_content=${slug}`]);
  }
  for (const invalid of ['/r/ALICE/', '/r/a'.concat('a'.repeat(50)), '/r/../evil/', '/r/alice smith/', '/r/alice/extra/']) {
    const { calls, status } = runCreatorRoute(invalid);
    assert.equal(calls.length, 0, invalid);
    assert.equal(status.textContent, 'This campaign link is not available.');
  }
});

test('creator routing has no open redirect or analytics implementation', () => {
  const source = read('assets/js/creator-route.js');
  assert.ok(source.includes('const CREATOR_PATH = /^\\/r\\/([a-z0-9_-]{1,50})\\/?$/;'));
  assert.match(source, /new URL\(`\$\{prefix\}\/download\/`, window\.location\.origin\)/);
  assert.doesNotMatch(source, /fetch\(|marketing_page_view|store_click|localStorage|sessionStorage|document\.cookie|location\.href/);
});

test('sitemap includes download but never creator attribution routes', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /https:\/\/www\.getsoukai\.com\/download\//);
  assert.doesNotMatch(sitemap, /https:\/\/www\.getsoukai\.com\/r\//);
});
