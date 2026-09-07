(function () {
  'use strict';

  const ENDPOINT = 'https://scam.getsoukai.com/marketing-event';
  const ALLOWED_UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  const ALLOWED_STORES = new Set(['app_store', 'google_play']);
  const SOUKAI_HOSTS = new Set(['www.getsoukai.com', 'getsoukai.com']);

  function normalizeUtm(value) {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed && trimmed.length <= 100 ? trimmed : undefined;
  }

  function getUtmParameters() {
    const search = new URLSearchParams(window.location.search);
    const values = {};

    ALLOWED_UTM_FIELDS.forEach(function (name) {
      const value = normalizeUtm(search.get(name));
      if (value !== undefined) values[name] = value;
    });

    return values;
  }

  function getReferrerHost() {
    if (!document.referrer) return undefined;

    try {
      const hostname = new URL(document.referrer).hostname;
      return hostname && hostname.length <= 120 ? hostname : undefined;
    } catch (_) {
      return undefined;
    }
  }

  function sendEvent(event, store) {
    const payload = {
      event: event,
      landing_path: window.location.pathname,
    };
    const referrerHost = getReferrerHost();
    const utmParameters = getUtmParameters();

    if (referrerHost !== undefined) payload.referrer_host = referrerHost;
    ALLOWED_UTM_FIELDS.forEach(function (name) {
      if (utmParameters[name] !== undefined) payload[name] = utmParameters[name];
    });
    if (store !== undefined) payload.store = store;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      keepalive: true,
      body: JSON.stringify(payload),
    }).catch(function () {
      // Analytics must never affect navigation or page rendering.
    });
  }

  function decorateInternalLinks(utmParameters) {
    if (Object.keys(utmParameters).length === 0) return;

    document.querySelectorAll('a[href]').forEach(function (link) {
      const originalHref = link.getAttribute('href');
      if (!originalHref || originalHref.charAt(0) === '#') return;

      let target;
      try {
        target = new URL(originalHref, window.location.origin);
      } catch (_) {
        return;
      }

      if ((target.protocol !== 'https:' && target.protocol !== 'http:')
        || !SOUKAI_HOSTS.has(target.hostname)
        || target.hostname === 'scam.getsoukai.com') {
        return;
      }

      ALLOWED_UTM_FIELDS.forEach(function (name) {
        if (utmParameters[name] !== undefined && !target.searchParams.has(name)) {
          target.searchParams.set(name, utmParameters[name]);
        }
      });

      link.setAttribute('href', target.href);
    });
  }

  function bindStoreClicks() {
    document.querySelectorAll('[data-store]').forEach(function (element) {
      const store = element.getAttribute('data-store');
      if (!ALLOWED_STORES.has(store)) return;

      element.addEventListener('click', function () {
        sendEvent('store_click', store);
      });
    });
  }

  const utmParameters = getUtmParameters();
  decorateInternalLinks(utmParameters);
  bindStoreClicks();
  sendEvent('marketing_page_view');
}());
