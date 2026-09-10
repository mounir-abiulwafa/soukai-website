(function () {
  'use strict';

  const APP_STORE_URL = 'https://apps.apple.com/us/app/is-this-a-scam-ai/id6808956595';
  const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.soukai.isthisascam';
  const AVAILABILITY_MESSAGES = {
    en: {
      ios: 'Available on the App Store.',
      android: 'Available on Google Play.',
      other: 'Available on the App Store and Google Play.',
    },
    ar: {
      ios: 'متاح على App Store.',
      android: 'متاح على Google Play.',
      other: 'متاح على App Store وGoogle Play.',
    },
    fr: {
      ios: 'Disponible sur l’App Store.',
      android: 'Disponible sur Google Play.',
      other: 'Disponible sur l’App Store et Google Play.',
    },
    es: {
      ios: 'Disponible en App Store.',
      android: 'Disponible en Google Play.',
      other: 'Disponible en App Store y Google Play.',
    },
    it: {
      ios: 'Disponibile su App Store.',
      android: 'Disponibile su Google Play.',
      other: 'Disponibile su App Store e Google Play.',
    },
  };

  function getPlatform() {
    const userAgent = navigator.userAgent || '';
    if (/android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    return 'other';
  }

  function updateAvailabilityNote(platform) {
    const note = document.getElementById('platform-note');
    if (!note) return;

    const language = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
    const messages = AVAILABILITY_MESSAGES[language] || AVAILABILITY_MESSAGES.en;
    note.textContent = messages[platform] || messages.other;
  }

  const platform = getPlatform();
  updateAvailabilityNote(platform);

  // Store links are rendered in static HTML so visitors deliberately choose a
  // marketplace. Do not redirect based on detected platform.
  if (APP_STORE_URL || GOOGLE_PLAY_URL) {
    // Constants are retained as the single verified source for this page.
  }
}());
