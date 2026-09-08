const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const routes = ['', 'products/', 'products/is-this-a-scam/', 'download/', 'scam-checker/', 'check-scam-message/', 'is-this-link-safe/', 'guides/', 'guides/delivery-scam-text/', 'guides/fake-bank-message/', 'guides/fake-job-offer/', 'about/', 'contact/', 'privacy/'];
const languages = ['en', 'ar', 'fr', 'es', 'it'];
const base = 'https://www.getsoukai.com';
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pageFile = (language, route) => path.join(language === 'en' ? '' : language, route, 'index.html');
const pagePath = (language, route) => language === 'en' ? `/${route}` : `/${language}/${route}`;

function runLanguage({ pathname, search = '', hash = '', languages: preferred = [], language = 'en-US' }) {
  const calls = [];
  const window = {
    location: { pathname, search, hash, replace(value) { calls.push(value); } },
  };
  const context = {
    window,
    navigator: { languages: preferred, language },
    URLSearchParams,
    document: { querySelectorAll: () => [] },
  };
  vm.runInNewContext(read('assets/js/language.js'), context);
  return { calls, redirecting: window.__SOUKAI_LANGUAGE_REDIRECTING__ === true };
}

test('normal indexable pages never redirect based on browser language', () => {
  for (const pathname of routes.map((route) => `/${route}`)) {
    assert.deepEqual(runLanguage({ pathname, languages: ['fr-FR'] }).calls, [], pathname);
  }
  for (const language of languages.filter((item) => item !== 'en')) {
    for (const route of routes) assert.deepEqual(runLanguage({ pathname: `/${language}/${route}`, languages: ['ar-MA'] }).calls, []);
  }
});

test('/start and /get route only through approved language mapping and UTM parameters', () => {
  const expectedHome = { 'ar-MA': '/ar/', 'fr-FR': '/fr/', 'fr-CA': '/fr/', 'es-ES': '/es/', 'it-IT': '/it/', 'en-US': '/', 'de-DE': '/' };
  const expectedGet = { 'ar-MA': '/ar/download/', 'fr-FR': '/fr/download/', 'fr-CA': '/fr/download/', 'es-ES': '/es/download/', 'it-IT': '/it/download/', 'en-US': '/download/', 'de-DE': '/download/' };
  for (const [input, target] of Object.entries(expectedHome)) assert.deepEqual(runLanguage({ pathname: '/start/', languages: [input] }).calls, [target]);
  for (const [input, target] of Object.entries(expectedGet)) assert.deepEqual(runLanguage({ pathname: '/get/', languages: [input] }).calls, [target]);
  const suffix = runLanguage({ pathname: '/get/', search: '?utm_source=ugc&unsafe=value&utm_content=alice&utm_campaign=launch', hash: '#drop-me', languages: ['fr-FR'] });
  assert.deepEqual(suffix.calls, ['/fr/download/?utm_source=ugc&utm_campaign=launch&utm_content=alice']);
  assert.deepEqual(runLanguage({ pathname: '/r/alice/', languages: ['fr-FR'] }).calls, []);
  assert.deepEqual(runLanguage({ pathname: '/missing/', languages: ['fr-FR'] }).calls, []);
  assert.deepEqual(runLanguage({ pathname: '/start/', languages: [], language: 'fr-CA' }).calls, ['/fr/']);
});

test('all public language equivalents have self canonical, reciprocal hreflang, and one complete head', () => {
  for (const route of routes) {
    for (const language of languages) {
      const file = pageFile(language, route);
      const html = read(file);
      const current = `${base}${pagePath(language, route)}`;
      assert.equal((html.match(/<title[ >]/g) || []).length, 1, file);
      assert.equal((html.match(/<meta name="description"/g) || []).length, 1, file);
      assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1, file);
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1, file);
      assert.match(html, new RegExp(`<link rel="canonical" href="${current}">`), file);
      assert.match(html, new RegExp(`<html lang="${language}"${language === 'ar' ? ' dir="rtl"' : ''}`), file);
      for (const alternate of languages) {
        assert.match(html, new RegExp(`hreflang="${alternate}" href="${base}${pagePath(alternate, route)}"`), file);
      }
      assert.match(html, new RegExp(`hreflang="x-default" href="${base}${pagePath('en', route)}"`), file);
      assert.equal((html.match(/<script src="\/assets\/js\/language\.js" defer><\/script>/g) || []).length, 0, file);
      assert.equal((html.match(/<details class="language-selector">/g) || []).length, 1, file);
      for (const targetLanguage of languages) {
        assert.match(html, new RegExp(`data-language-path="${pagePath(targetLanguage, route)}" href="${pagePath(targetLanguage, route)}"`), file);
      }
    }
  }
});

test('localized links, download behavior, privacy exclusion, and product icon remain safe', () => {
  for (const language of languages.filter((item) => item !== 'en')) {
    for (const route of routes) {
      const file = pageFile(language, route);
      const html = read(file);
      const links = Array.from(html.matchAll(/<a\b([^>]*?)href="([^"]+)"/g), (match) => ({ attributes: match[1], href: match[2] }));
      for (const link of links) {
        if (link.attributes.includes('data-language-path') || !link.href.startsWith('/')) continue;
        assert.ok(link.href.startsWith(`/${language}/`), `${file}: ${link.href}`);
      }
      const marketingCount = (html.match(/<script src="\/assets\/js\/marketing\.js" defer><\/script>/g) || []).length;
      assert.equal(marketingCount, route === 'privacy/' ? 0 : 1, file);
    }
    const download = read(pageFile(language, 'download/'));
    assert.equal((download.match(/<script src="\/assets\/js\/download\.js" defer><\/script>/g) || []).length, 1);
    assert.doesNotMatch(download, /(?:apple\.com|play\.google\.com|data-store=)/i);
    assert.match(download, /assets\/images\/is-this-a-scam-icon\.png|product-mark/);
  }
});

test('sitemap has exactly every indexable localized page and excludes routing utilities', () => {
  const sitemap = read('sitemap.xml');
  const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
  assert.equal(locations.length, routes.length * languages.length);
  assert.equal(new Set(locations).size, locations.length);
  assert.ok(locations.every((item) => item.startsWith(base)));
  assert.ok(locations.every((item) => !item.includes('/r/') && !item.includes('/start/') && !item.includes('/get/')));
  for (const language of languages) for (const route of routes) assert.ok(locations.includes(`${base}${pagePath(language, route)}`));
});

test('creator routing remains bounded and selects a localized download destination directly', () => {
  const source = read('assets/js/creator-route.js');
  assert.ok(source.includes('const CREATOR_PATH = /^\\/r\\/([a-z0-9_-]{1,50})\\/?$/;'));
  assert.match(source, /const prefix = language === 'en' \? '' : `\/\$\{language\}`/);
  assert.doesNotMatch(source, /location\.search|location\.hash|fetch\(|localStorage|sessionStorage/);
});

function runCreator(pathname, language) {
  const calls = [];
  const context = { URL, navigator: { languages: [language], language }, window: { location: { origin: base, pathname, replace(value) { calls.push(value); } } }, document: { getElementById: () => ({}) } };
  vm.runInNewContext(read('assets/js/creator-route.js'), context);
  return calls;
}

test('creator links discard incoming data and use direct localized download destinations', () => {
  const suffix = '?utm_source=ugc&utm_medium=creator&utm_campaign=launch&utm_content=alice';
  for (const [language, target] of [['en-US', '/download/'], ['ar-MA', '/ar/download/'], ['fr-FR', '/fr/download/'], ['es-ES', '/es/download/'], ['it-IT', '/it/download/'], ['de-DE', '/download/']]) {
    assert.deepEqual(runCreator('/r/alice/', language), [target + suffix]);
  }
});

test('/start and /get are noindex, static-fallback-only routing pages without marketing', () => {
  for (const [file, destination] of [['start/index.html', '/ar/'], ['get/index.html', '/ar/download/']]) {
    const html = read(file);
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
    assert.equal((html.match(/assets\/js\/marketing\.js/g) || []).length, 0);
    assert.equal((html.match(/assets\/js\/language\.js/g) || []).length, 1);
    assert.match(html, new RegExp(`href="${destination}"`));
  }
});

test('the shared product mark uses the approved authoritative app-icon asset', () => {
  const css = read('assets/css/site.css');
  const websiteIcon = fs.readFileSync(path.join(root, 'assets/images/is-this-a-scam-icon.png'));
  const appIcon = fs.readFileSync('/Users/moniraboulouafa/Documents/GitHub/is-this-a-scam/mobile/assets/icon.png');
  assert.match(css, /\.product-mark[\s\S]*is-this-a-scam-icon\.png/);
  assert.equal(crypto.createHash('sha256').update(websiteIcon).digest('hex'), crypto.createHash('sha256').update(appIcon).digest('hex'));
});

test('Arabic brand lockups are directionally isolated and every product hero displays the official app icon', () => {
  const css = read('assets/css/site.css');
  assert.match(css, /\.brand \{[\s\S]*direction: ltr;[\s\S]*unicode-bidi: isolate;/);
  assert.match(css, /\.product-mark[\s\S]*is-this-a-scam-icon\.png/);
  for (const language of languages) {
    const html = read(pageFile(language, 'products/is-this-a-scam/'));
    assert.match(html, /class="hero app-hero product-conversion-hero"/);
    assert.match(html, /class="product-mark"/);
  }
  const arabicDownload = read(pageFile('ar', 'download/'));
  assert.match(arabicDownload, /iPhone\u200e و\u200eAndroid\u200e/);
});

test('conversion surfaces keep localized app visuals and safe download calls to action', () => {
  for (const language of languages) {
    const prefix = language === 'en' ? '' : `/${language}`;
    for (const route of ['', 'products/is-this-a-scam/', 'download/']) {
      const html = read(pageFile(language, route));
      assert.match(html, /is-this-a-scam-(?:hero|download)\.webp/, `${language}/${route}`);
      assert.match(html, /width="(?:2400|2752)" height="(?:1792|1536)"/, `${language}/${route}`);
    }
    const home = read(pageFile(language, ''));
    const product = read(pageFile(language, 'products/is-this-a-scam/'));
    const download = read(pageFile(language, 'download/'));
    assert.match(home, /is-this-a-scam-workflow\.webp/);
    assert.match(product, /is-this-a-scam-workflow\.webp/);
    assert.match(home, new RegExp(`href="${prefix}/download/"`.replace('//', '/')));
    assert.doesNotMatch(download, /(?:apple\.com|play\.google\.com|data-store=)/i);
  }
});

test('conversion copy resolves in every locale without visible placeholder values', () => {
  const contacts = { en: 'Contact us', ar: 'تواصل معنا', fr: 'Nous contacter', es: 'Contáctanos', it: 'Contattaci' };
  const proofLabels = { en: 'Clear reasons + recommended next step', ar: 'أسباب واضحة وخطوة تالية مقترحة', fr: 'Raisons claires et prochaine étape recommandée', es: 'Motivos claros y siguiente paso recomendado', it: 'Motivazioni chiare e passo successivo consigliato' };
  for (const language of languages) {
    const prefix = language === 'en' ? '' : `/${language}`;
    const home = read(pageFile(language, ''));
    assert.match(home, new RegExp(`href="${prefix}/contact/"`.replace('//', '/')));
    assert.ok(home.includes(contacts[language]));
    assert.ok(home.includes(proofLabels[language]));
    for (const route of routes) {
      const html = read(pageFile(language, route));
      assert.doesNotMatch(html, /(?:>|")\s*(?:undefined|null|NaN|\[object Object\])\s*(?:<|")/i, `${language}/${route}`);
    }
  }
});
