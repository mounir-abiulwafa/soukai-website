const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const base = 'https://www.getsoukai.com';
const guides = [
  {
    route: 'guides/usps-text-scam/',
    title: 'Is This USPS Text a Scam? How to Check Before You Click | Soukai',
    description: 'Learn how to check a suspicious USPS text, spot fake tracking and redelivery links, and respond safely if you clicked or entered payment details.',
  },
  {
    route: 'guides/unpaid-toll-text-scam/',
    title: 'Unpaid Toll Text Scam: Is That Toll Message Real? | Soukai',
    description: 'Learn how to spot an unpaid toll text scam, verify a toll notice safely, and act quickly if you clicked a fake payment link or entered card details.',
  },
  {
    route: 'guides/job-offer-text-scam/',
    title: 'Is This Job Offer Text a Scam? Warning Signs to Check | Soukai',
    description: 'Learn how to spot a job offer text scam, verify a recruiter independently, and respond safely if you sent money or personal information.',
  },
  {
    route: 'guides/fake-bank-fraud-alert/',
    title: 'Fake Bank Fraud Alert Text: How to Tell If It’s Real | Soukai',
    description: 'Learn how to check a fake bank fraud alert text, verify suspicious account warnings safely, and respond if you shared a code, card, or banking details.',
  },
  {
    route: 'guides/wrong-number-text-scam/',
    title: 'Wrong Number Text Scam: Should You Reply? | Soukai',
    description: 'Learn how to spot a wrong number text scam, recognize trust-building and investment tactics, and respond safely if you already replied or shared information.',
  },
  {
    route: 'guides/amazon-fraud-alert-scam/',
    title: 'Is This Amazon Fraud Alert Real? How to Check Safely | Soukai',
    description: 'Learn how to check a suspicious Amazon fraud alert, purchase text, or support message safely, and what to do if you clicked, paid, or shared account details.',
  },
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('English SEO guides have complete, safe, indexable article structure', () => {
  for (const guide of guides) {
    const file = `${guide.route}index.html`;
    const html = read(file);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, file);
    assert.equal((html.match(/<title>/g) || []).length, 1, file);
    assert.equal((html.match(/<meta name="description"/g) || []).length, 1, file);
    assert.match(html, new RegExp(`<title>${guide.title.replace(/[?]/g, '\\$&')}</title>`), file);
    assert.match(html, new RegExp(`<meta name="description" content="${guide.description.replace(/[?]/g, '\\$&')}">`), file);
    assert.match(html, new RegExp(`<link rel="canonical" href="${base}/${guide.route}">`), file);
    assert.match(html, /"@type":"Article"/, file);
    assert.match(html, /"@type":"FAQPage"/, file);
    assert.match(html, /<strong>Fictional (?:example|conversation)<\/strong>/, file);
    assert.match(html, /<em>[a-z0-9-]+\.example<\/em>|<strong>Fictional conversation<\/strong>/i, file);
    assert.doesNotMatch(html, /<a\b[^>]*href="https?:\/\//i, file);
    for (const target of ['/scam-checker/', '/check-scam-message/', '/is-this-link-safe/', '/guides/', '/download/']) {
      assert.match(html, new RegExp(`href="${target.replace(/[/?]/g, '\\$&')}"`), `${file}: ${target}`);
    }
  }
});

test('English-only SEO guides are discoverable without inventing untranslated alternates', () => {
  const sitemap = read('sitemap.xml');
  const index = read('guides/index.html');
  for (const guide of guides) {
    const url = `${base}/${guide.route}`;
    assert.equal((sitemap.match(new RegExp(`<loc>${url}</loc>`, 'g')) || []).length, 1);
    assert.match(index, new RegExp(`href="/${guide.route}"`));
  }
});
