(function () {
  'use strict';

  const APP_STORE_URL = null;
  const GOOGLE_PLAY_URL = null;

  function getPlatform() {
    const userAgent = navigator.userAgent || '';
    if (/android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    return 'other';
  }

  function updateAvailabilityNote(platform) {
    const note = document.getElementById('platform-note');
    if (!note) return;

    if (platform === 'ios') {
      note.textContent = 'The App Store will be the right option when it is available.';
    } else if (platform === 'android') {
      note.textContent = 'Google Play will be the right option when it is available.';
    } else {
      note.textContent = 'Store availability will be announced after approval.';
    }
  }

  const platform = getPlatform();
  updateAvailabilityNote(platform);

  // Store URLs intentionally remain null until official approval. Do not add a
  // redirect or click destination while either marketplace is unavailable.
  if (APP_STORE_URL || GOOGLE_PLAY_URL) {
    // Future store-routing logic belongs here after official URLs are approved.
  }
}());
