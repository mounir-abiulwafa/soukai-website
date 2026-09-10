/* Applies the live-store copy and official store badges without rewriting page
 * structure, navigation, SEO architecture, or locale routing. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appStoreUrl = 'https://apps.apple.com/us/app/is-this-a-scam-ai/id6808956595';
const googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.soukai.isthisascam';

const locales = {
  en: {
    file: 'download/index.html',
    title: 'Download Is This a Scam? for iPhone &amp; Android | Soukai',
    description: 'Download Is This a Scam? for AI-assisted scam checks of suspicious messages, links, and screenshots on iPhone and Android.',
    social: 'Download Is This a Scam? on the App Store or Google Play. Check Before You Trust.',
    availability: 'Available on the App Store and Google Play.',
    platformNote: 'Choose the store that matches your device.',
    storeIntro: 'Download on:',
    appStoreLabel: 'Download on the App Store',
    googlePlayLabel: 'Get it on Google Play',
  },
  ar: {
    file: 'ar/download/index.html',
    title: 'حمّل هل هذه عملية احتيال؟ | Soukai',
    description: 'حمّل تطبيق هل هذه عملية احتيال؟ لفحص الرسائل والروابط ولقطات الشاشة بمساعدة الذكاء الاصطناعي على App Store وGoogle Play.',
    social: 'حمّل هل هذه عملية احتيال؟ من App Store أو Google Play. تحقّق قبل أن تثق.',
    availability: 'متاح على App Store وGoogle Play.',
    platformNote: 'اختر المتجر المناسب لجهازك.',
    storeIntro: 'نزّل التطبيق من:',
    appStoreLabel: 'نزّل من App Store',
    googlePlayLabel: 'نزّله من Google Play',
  },
  fr: {
    file: 'fr/download/index.html',
    title: 'Télécharger Is This a Scam? sur iPhone et Android | Soukai',
    description: 'Téléchargez Is This a Scam? pour vérifier messages, liens et captures d’écran avec une évaluation du risque assistée par IA.',
    social: 'Téléchargez Is This a Scam? sur l’App Store ou Google Play. Vérifiez avant de faire confiance.',
    availability: 'Disponible sur l’App Store et Google Play.',
    platformNote: 'Choisissez la boutique adaptée à votre appareil.',
    storeIntro: 'Télécharger sur :',
    appStoreLabel: 'Télécharger sur l’App Store',
    googlePlayLabel: 'Disponible sur Google Play',
  },
  es: {
    file: 'es/download/index.html',
    title: 'Descarga Is This a Scam? para iPhone y Android | Soukai',
    description: 'Descarga Is This a Scam? para comprobar mensajes, enlaces y capturas con una evaluación de riesgo asistida por IA.',
    social: 'Descarga Is This a Scam? en App Store o Google Play. Comprueba antes de confiar.',
    availability: 'Disponible en App Store y Google Play.',
    platformNote: 'Elige la tienda adecuada para tu dispositivo.',
    storeIntro: 'Descargar en:',
    appStoreLabel: 'Descargar en App Store',
    googlePlayLabel: 'Disponible en Google Play',
  },
  it: {
    file: 'it/download/index.html',
    title: 'Scarica Is This a Scam? per iPhone e Android | Soukai',
    description: 'Scarica Is This a Scam? per controllare messaggi, link e schermate con una valutazione del rischio assistita dall’IA.',
    social: 'Scarica Is This a Scam? da App Store o Google Play. Verifica prima di fidarti.',
    availability: 'Disponibile su App Store e Google Play.',
    platformNote: 'Scegli lo store adatto al tuo dispositivo.',
    storeIntro: 'Scarica da:',
    appStoreLabel: 'Scarica da App Store',
    googlePlayLabel: 'Disponibile su Google Play',
  },
};

const replacements = [
  ['Coming soon on iOS and Android', 'Available on the App Store and Google Play'],
  ['Coming soon on iPhone and Android', 'Available on the App Store and Google Play'],
  ['coming soon for iPhone and Android', 'available on the App Store and Google Play'],
  ['designed for iPhone and Android and is coming soon', 'available on the App Store and Google Play'],
  ['a coming-soon iPhone and Android app', 'an app available on the App Store and Google Play'],
  ['قريبًا على ‎iPhone‎ و‎Android‎', 'متاح على App Store وGoogle Play'],
  ['Bientôt sur iPhone et Android', 'Disponible sur l’App Store et Google Play'],
  ['Próximamente en iPhone y Android', 'Disponible en App Store y Google Play'],
  ['Prossimamente su iPhone e Android', 'Disponibile su App Store e Google Play'],
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && entry.name === 'index.html' ? [file] : [];
  });
}

function replaceTag(html, expression, value) {
  if (!expression.test(html)) throw new Error(`Missing expected tag: ${expression}`);
  return html.replace(expression, value);
}

function badges(locale) {
  return `<div class="store-badges" aria-label="${locale.availability}"><a class="store-badge" href="${appStoreUrl}" data-store="app_store" aria-label="${locale.appStoreLabel}"><strong>App Store</strong><span>App Store</span><em>${locale.appStoreLabel}</em></a><a class="store-badge" href="${googlePlayUrl}" data-store="google_play" aria-label="${locale.googlePlayLabel}"><strong>Google Play</strong><span>Google Play</span><em>${locale.googlePlayLabel}</em></a></div>`;
}

for (const file of walk(root)) {
  const original = fs.readFileSync(file, 'utf8');
  let html = original;
  for (const [from, to] of replacements) html = html.split(from).join(to);
  if (file === path.join(root, 'privacy/index.html')) {
    html = html.replace('a store-click destination when store links become available', 'a store-click destination when a visitor selects an official store link');
  }
  if (html !== original) fs.writeFileSync(file, html);
}

for (const locale of Object.values(locales)) {
  const file = path.join(root, locale.file);
  const original = fs.readFileSync(file, 'utf8');
  let html = original;
  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${locale.title}</title>`);
  html = replaceTag(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${locale.description}">`);
  html = replaceTag(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${locale.social}">`);
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${locale.social}">`);
  html = replaceTag(html, /<p id="platform-note" role="status">[\s\S]*?<\/p>/, `<p id="platform-note" role="status">${locale.platformNote}</p>`);
  html = replaceTag(html, /<p class="store-intro">[\s\S]*?<\/p>/, `<p class="store-intro">${locale.storeIntro}</p>`);
  html = replaceTag(html, /<p class="status">[\s\S]*?<\/p>/, `<p class="status">${locale.availability}</p>`);
  html = replaceTag(html, /<div class="store-badges"[\s\S]*?<\/div>/, badges(locale));
  if (html !== original) fs.writeFileSync(file, html);
}
