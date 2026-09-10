const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const APP_STORE_URL = 'https://apps.apple.com/us/app/is-this-a-scam-ai/id6808956595';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.soukai.isthisascam';
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('download page presents two live, deliberate store choices', () => {
  const html = read('download/index.html');
  assert.match(html, /<title>Download Is This a Scam\? for iPhone &amp; Android \| Soukai<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.getsoukai\.com\/download\/">/);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.equal((html.match(/<script src="\/assets\/js\/marketing\.js" defer><\/script>/g) || []).length, 1);
  assert.equal((html.match(/<script src="\/assets\/js\/download\.js" defer><\/script>/g) || []).length, 1);
  assert.match(html, /App Store/);
  assert.match(html, /Google Play/);
  assert.match(html, new RegExp(`<a class="store-badge" href="${escapeRegExp(APP_STORE_URL)}" data-store="app_store"`));
  assert.match(html, new RegExp(`<a class="store-badge" href="${escapeRegExp(GOOGLE_PLAY_URL)}" data-store="google_play"`));
  assert.doesNotMatch(html, /aria-disabled/);
});

test('download script uses the approved store URLs without redirects, telemetry, or persistence', () => {
  const source = read('assets/js/download.js');
  assert.match(source, new RegExp(`const APP_STORE_URL = '${escapeRegExp(APP_STORE_URL)}';`));
  assert.match(source, new RegExp(`const GOOGLE_PLAY_URL = '${escapeRegExp(GOOGLE_PLAY_URL)}';`));
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
  assert.equal(runDownload('en', 'Mozilla/5.0 (iPhone)'), 'Available on the App Store.');
  assert.equal(runDownload('ar', 'Mozilla/5.0 (Linux; Android 14)'), 'متاح على Google Play.');
  assert.equal(runDownload('fr', 'Mozilla/5.0'), 'Disponible sur l’App Store et Google Play.');
  assert.equal(runDownload('es', 'Mozilla/5.0'), 'Disponible en App Store y Google Play.');
  assert.equal(runDownload('it', 'Mozilla/5.0'), 'Disponibile su App Store e Google Play.');
  assert.equal(runDownload('fr-CA', 'Mozilla/5.0 (iPad)'), 'Disponible sur l’App Store.');
  assert.equal(runDownload('de', 'Mozilla/5.0'), 'Available on the App Store and Google Play.');
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
