const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'assets/js/marketing.js');
const trackedPages = [
  'index.html',
  'about/index.html',
  'contact/index.html',
  'products/index.html',
  'products/is-this-a-scam/index.html',
  'download/index.html',
  'scam-checker/index.html',
  'check-scam-message/index.html',
  'is-this-link-safe/index.html',
  'guides/index.html',
  'guides/delivery-scam-text/index.html',
  'guides/fake-bank-message/index.html',
  'guides/fake-job-offer/index.html',
];

test('marketing script is privacy-constrained and uses the fixed endpoint', () => {
  const source = fs.readFileSync(scriptPath, 'utf8');
  assert.match(source, /const ENDPOINT = 'https:\/\/scam\.getsoukai\.com\/marketing-event';/);
  assert.match(source, /\['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'\]/);
  assert.match(source, /document\.referrer/);
  assert.match(source, /new URL\(document\.referrer\)\.hostname/);
  assert.match(source, /window\.location\.pathname/);
  assert.match(source, /credentials: 'omit'/);
  assert.match(source, /keepalive: true/);
  assert.match(source, /\['app_store', 'google_play'\]/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|identify\(|userAgent|screen\.width|screen\.height|location\.href|innerHTML|document\.write|eval\(/);
  assert.doesNotMatch(source, /appstore\.com|play\.google\.com/i);
});

test('required public pages load marketing.js exactly once', () => {
  for (const page of trackedPages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const matches = html.match(/<script src="\/assets\/js\/marketing\.js" defer><\/script>/g) || [];
    assert.equal(matches.length, 1, `${page} should load marketing.js once`);
  }
});
