/**
 * Field Hospital Calculator Suite – Shell.
 * Panel switching, URL hash sync, optional shell toast.
 */
(function () {
  'use strict';

  const TOAST_DURATION_MS = 4000;
  let toastTimeout = null;

  const HASH_TO_PANEL = {
    'load-basic': 'panel-load-calc',
    'load-pro': 'panel-load-pro',
    'water': 'panel-water',
    'consumables': 'panel-consumables',
    'medicines': 'panel-medications'
  };

  const PANEL_TO_HASH = {
    'panel-load-calc': 'load-basic',
    'panel-load-pro': 'load-pro',
    'panel-water': 'water',
    'panel-consumables': 'consumables',
    'panel-medications': 'medicines'
  };

  function showPanel(panelId) {
    if (!panelId) return;
    document.querySelectorAll('.calc-panel').forEach(function (p) {
      p.hidden = true;
    });
    var panel = document.getElementById(panelId);
    if (panel) {
      panel.hidden = false;
    }

    document.querySelectorAll('.shell-nav-btn').forEach(function (btn) {
      var target = btn.getAttribute('data-panel');
      btn.classList.toggle('active', target === panelId);
    });

    var hash = PANEL_TO_HASH[panelId];
    if (hash && window.location.hash !== '#' + hash) {
      try {
        history.replaceState(null, '', '#' + hash);
      } catch (e) { /* ignore */ }
    }
  }

  function getPanelFromHash() {
    var hash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
    return HASH_TO_PANEL[hash] || null;
  }

  function applyHash() {
    var panelId = getPanelFromHash();
    if (panelId && document.getElementById(panelId)) {
      showPanel(panelId);
      return;
    }
    showPanel('panel-consumables');
  }

  function showShellToast(message, type) {
    type = type || 'info';
    var el = document.getElementById('shell-toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'shell-toast shell-toast--' + type;
    el.hidden = false;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      el.hidden = true;
      toastTimeout = null;
    }, TOAST_DURATION_MS);
  }

  window.ShellAPI = { showToast: showShellToast };

  document.querySelectorAll('.shell-nav-btn[data-panel]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showPanel(btn.getAttribute('data-panel'));
    });
  });

  window.addEventListener('hashchange', applyHash);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyHash);
  } else {
    applyHash();
  }
})();
