(function () {
  'use strict';

  const SUPPORTED = new Set(['ar', 'fr', 'es', 'it', 'en']);
  const ALLOWED_UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

  function normalize(value) {
    if (typeof value !== 'string') return 'en';
    const language = value.toLowerCase().split('-')[0];
    return SUPPORTED.has(language) ? language : 'en';
  }

  function preferredLanguage() {
    const nav = typeof navigator === 'object' ? navigator : {};
    const candidates = Array.isArray(nav.languages) && nav.languages.length
      ? nav.languages
      : [nav.language];
    for (const candidate of candidates) {
      const language = normalize(candidate);
      if (language !== 'en' || /^en(?:-|$)/i.test(candidate || '')) return language;
    }
    return 'en';
  }

  function allowedUtmQuery() {
    const current = new URLSearchParams(window.location.search);
    const safe = new URLSearchParams();
    ALLOWED_UTM_FIELDS.forEach(function (name) {
      const value = current.get(name);
      if (typeof value === 'string' && value.length > 0 && value.length <= 100 && !/[\u0000-\u001f\u007f]/.test(value)) {
        safe.set(name, value);
      }
    });
    const query = safe.toString();
    return query ? `?${query}` : '';
  }

  const targets = {
    '/start/': { en: '/', ar: '/ar/', fr: '/fr/', es: '/es/', it: '/it/' },
    '/get/': { en: '/download/', ar: '/ar/download/', fr: '/fr/download/', es: '/es/download/', it: '/it/download/' },
  };

  const route = targets[window.location.pathname];
  if (route) window.location.replace(route[preferredLanguage()] + allowedUtmQuery());
}());
