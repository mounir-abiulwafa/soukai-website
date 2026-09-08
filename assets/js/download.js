(function () {
  'use strict';

  const APP_STORE_URL = null;
  const GOOGLE_PLAY_URL = null;
  const AVAILABILITY_MESSAGES = {
    en: {
      ios: 'The App Store will be the right option when it is available.',
      android: 'Google Play will be the right option when it is available.',
      other: 'Store availability will be announced after approval.',
    },
    ar: {
      ios: 'سيكون App Store الخيار المناسب عندما يصبح متاحًا.',
      android: 'سيكون Google Play الخيار المناسب عندما يصبح متاحًا.',
      other: 'سيُعلن توفر المتاجر بعد الموافقة.',
    },
    fr: {
      ios: 'L’App Store sera la bonne option lorsqu’il sera disponible.',
      android: 'Google Play sera la bonne option lorsqu’il sera disponible.',
      other: 'La disponibilité en boutique sera annoncée après approbation.',
    },
    es: {
      ios: 'App Store será la opción adecuada cuando esté disponible.',
      android: 'Google Play será la opción adecuada cuando esté disponible.',
      other: 'La disponibilidad en tiendas se anunciará tras la aprobación.',
    },
    it: {
      ios: 'App Store sarà l’opzione giusta quando sarà disponibile.',
      android: 'Google Play sarà l’opzione giusta quando sarà disponibile.',
      other: 'La disponibilità negli store sarà annunciata dopo l’approvazione.',
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

  // Store URLs intentionally remain null until official approval. Do not add a
  // redirect or click destination while either marketplace is unavailable.
  if (APP_STORE_URL || GOOGLE_PLAY_URL) {
    // Future store-routing logic belongs here after official URLs are approved.
  }
}());
