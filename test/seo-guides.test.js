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
  {
    route: 'guides/fake-delivery-fee-scam/',
    title: 'Package Delivery Fee Text: Scam or Real? | Soukai',
    description: 'Learn how to spot a package delivery fee text scam, verify a delivery independently, and respond safely if you clicked or entered payment or personal details.',
  },
  {
    route: 'guides/qr-code-scam/',
    title: 'Is This QR Code Safe? How to Spot a QR Code Scam | Soukai',
    description: 'Learn how to spot a QR code scam or quishing attempt, inspect a destination safely, and respond if you entered login or payment information after scanning.',
  },
  {
    route: 'guides/phishing-link-checker/',
    title: 'How to Check a Suspicious Link Before You Click | Soukai',
    description: 'Learn how to check a suspicious link before you click, spot phishing URLs and fake login pages, and respond safely if you entered credentials or payment details.',
  },
  {
    route: 'guides/scam-screenshot-checker/',
    title: 'How to Check a Scam Screenshot With AI | Soukai',
    description: 'Use an AI-assisted scam screenshot checker to review suspicious messages, emails, payment requests, and account alerts before you click, reply, or pay.',
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

test('QR guide does not claim unsupported dedicated QR decoding', () => {
  const qrGuide = read('guides/qr-code-scam/index.html');
  assert.match(qrGuide, /does not claim dedicated QR-code decoding/i);
  assert.doesNotMatch(qrGuide, /Is This a Scam\? AI (?:can|will) (?:decode|scan) (?:a )?QR/i);
});

test('screenshot checker describes the supported screenshot workflow without guarantees', () => {
  const screenshotGuide = read('guides/scam-screenshot-checker/index.html');
  const visibleFaqs = [
    'Can AI tell if a screenshot is a scam?',
    'Can I check a text-message or WhatsApp screenshot?',
    'Can I check a suspicious email screenshot?',
    'Is it safe to upload a screenshot?',
    'What should I do if I already clicked the link?',
    'Can the app guarantee a screenshot is fraudulent?',
  ];
  assert.match(screenshotGuide, /screenshot.*AI-assisted risk assessment/i);
  assert.match(screenshotGuide, /risk level, reasons, and a recommended next action/i);
  assert.match(screenshotGuide, /Screenshot analysis is AI-assisted, not a guarantee/i);
  assert.match(screenshotGuide, /removing information you do not need for the assessment, such as passwords, verification codes, full card numbers/i);
  assert.match(screenshotGuide, /<source srcset="\/assets\/images\/visuals\/is-this-a-scam-workflow\.webp"/);
  assert.doesNotMatch(screenshotGuide, /app guarantees (?:that )?a screenshot/i);
  for (const question of visibleFaqs) {
    assert.match(screenshotGuide, new RegExp(`<h3>${question.replace(/[?]/g, '\\$&')}</h3>`));
    assert.match(screenshotGuide, new RegExp(`"name":"${question.replace(/[?]/g, '\\$&')}"`));
  }
});
