/**
 * Field Hospital Calculator Suite — suite version (single source: version.json next to this file).
 * Updates: meta[name="suite-version"] and all [data-suite-version] (Calcs Shell panel footers + standalone calc pages).
 */
(function () {
  'use strict';

  function versionJsonUrl() {
    var s = document.currentScript;
    if (!s || !s.src) return 'version.json';
    return s.src.replace(/[^/]+$/, 'version.json');
  }

  function applyVersion(data) {
    if (!data || typeof data !== 'object') return;
    var v = data.version != null ? String(data.version).trim() : '';
    var suiteName = (data.suiteName && String(data.suiteName).trim()) || 'Field Hospital Calculator Suite';
    if (!v) return;

    var meta = document.querySelector('meta[name="suite-version"]');
    if (meta) meta.setAttribute('content', v);

    document.querySelectorAll('[data-suite-version]').forEach(function (el) {
      el.textContent = 'Suite v' + v;
      el.setAttribute('title', suiteName + ' — v' + v);
    });
  }

  function applyVersionUnavailable() {
    var tip =
      'Embedded suite version shown (e.g. file://). Open via http://localhost to load version.json and confirm the build.';
    document.querySelectorAll('[data-suite-version]').forEach(function (el) {
      el.setAttribute('title', tip);
    });
  }

  function load() {
    var url = versionJsonUrl();
    fetch(url)
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data) {
          applyVersion(data);
        } else {
          applyVersionUnavailable();
        }
      })
      .catch(function () {
        applyVersionUnavailable();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
