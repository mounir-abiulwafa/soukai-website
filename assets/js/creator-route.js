(function () {
  'use strict';

  const CREATOR_PATH = /^\/r\/([a-z0-9_-]{1,50})\/?$/;
  const CAMPAIGN = {
    utm_source: 'ugc',
    utm_medium: 'creator',
    utm_campaign: 'launch',
  };
  const SUPPORTED = new Set(['ar', 'fr', 'es', 'it', 'en']);

  function preferredLanguage() {
    const nav = typeof navigator === 'object' ? navigator : {};
    const candidates = Array.isArray(nav.languages) && nav.languages.length
      ? nav.languages
      : [nav.language];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const language = candidate.toLowerCase().split('-')[0];
      if (SUPPORTED.has(language)) return language;
    }
    return 'en';
  }

  function getCreatorSlug(pathname) {
    const match = CREATOR_PATH.exec(pathname);
    return match ? match[1] : null;
  }

  function getDownloadDestination(slug, language) {
    const prefix = language === 'en' ? '' : `/${language}`;
    const destination = new URL(`${prefix}/download/`, window.location.origin);
    Object.keys(CAMPAIGN).forEach(function (name) {
      destination.searchParams.set(name, CAMPAIGN[name]);
    });
    destination.searchParams.set('utm_content', slug);
    return destination.pathname + destination.search;
  }

  const slug = getCreatorSlug(window.location.pathname);
  if (slug) {
    window.location.replace(getDownloadDestination(slug, preferredLanguage()));
  } else {
    const status = document.getElementById('creator-route-status');
    if (status) status.textContent = 'This campaign link is not available.';
  }
}());
