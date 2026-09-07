(function () {
  'use strict';

  const CREATOR_PATH = /^\/r\/([a-z0-9_-]{1,50})\/?$/;
  const CAMPAIGN = {
    utm_source: 'ugc',
    utm_medium: 'creator',
    utm_campaign: 'launch',
  };

  function getCreatorSlug(pathname) {
    const match = CREATOR_PATH.exec(pathname);
    return match ? match[1] : null;
  }

  function getDownloadDestination(slug) {
    const destination = new URL('/download/', window.location.origin);
    Object.keys(CAMPAIGN).forEach(function (name) {
      destination.searchParams.set(name, CAMPAIGN[name]);
    });
    destination.searchParams.set('utm_content', slug);
    return destination.pathname + destination.search;
  }

  const slug = getCreatorSlug(window.location.pathname);
  if (slug) {
    window.location.replace(getDownloadDestination(slug));
  } else {
    const status = document.getElementById('creator-route-status');
    if (status) status.textContent = 'This campaign link is not available.';
  }
}());
