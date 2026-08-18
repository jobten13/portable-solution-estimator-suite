/**
 * Portable Solution Estimator Suite – Shared modal dialogs.
 * Replaces native confirm() / prompt() / alert() with styled, accessible modals.
 *
 * API (all return Promises):
 *   shellConfirm(message)                → true | false
 *   shellPrompt(message, defaultValue)   → string | null
 *   shellAlert(message)                  → undefined
 */
(function () {
  'use strict';

  var overlay = document.getElementById('shell-modal-overlay');
  var panel   = overlay && overlay.querySelector('.shell-modal-panel');
  var titleEl = document.getElementById('shell-modal-title');
  var msgEl   = document.getElementById('shell-modal-message');
  var inputEl = document.getElementById('shell-modal-input');
  var okBtn   = document.getElementById('shell-modal-ok');
  var cancelBtn = document.getElementById('shell-modal-cancel');

  var activeResolve = null;
  var activeMode    = null;   // 'confirm' | 'prompt' | 'alert'
  var previousFocus = null;
  var queue         = [];

  function getFocusableEls() {
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(
      'button:not([hidden]):not([disabled]), input:not([hidden]):not([disabled])'
    ));
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var els = getFocusableEls();
    if (!els.length) return;
    var first = els[0];
    var last  = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      dismiss();
    }
    trapFocus(e);
  }

  function onBackdropClick(e) {
    if (e.target === overlay) dismiss();
  }

  function dismiss() {
    if (!activeResolve) return;
    var resolve = activeResolve;
    var mode = activeMode;
    close();
    if (mode === 'confirm')     resolve(false);
    else if (mode === 'prompt') resolve(null);
    else                        resolve(undefined);
  }

  function accept() {
    if (!activeResolve) return;
    var resolve = activeResolve;
    var mode = activeMode;
    var value = inputEl ? inputEl.value : '';
    close();
    if (mode === 'confirm')     resolve(true);
    else if (mode === 'prompt') resolve(value);
    else                        resolve(undefined);
  }

  function close() {
    activeResolve = null;
    activeMode = null;
    if (overlay) {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.removeEventListener('keydown', onKeydown, true);
    if (overlay) overlay.removeEventListener('click', onBackdropClick);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
    previousFocus = null;
    if (queue.length) {
      var next = queue.shift();
      next();
    }
  }

  function show(mode, message, defaultValue) {
    return new Promise(function (resolve) {
      function doShow() {
        activeResolve = resolve;
        activeMode = mode;
        previousFocus = document.activeElement;

        if (titleEl) {
          titleEl.textContent =
            mode === 'confirm' ? 'Confirm' :
            mode === 'prompt'  ? 'Input' : 'Notice';
        }
        if (msgEl) msgEl.textContent = message || '';

        if (inputEl) {
          if (mode === 'prompt') {
            inputEl.hidden = false;
            inputEl.value = defaultValue || '';
          } else {
            inputEl.hidden = true;
            inputEl.value = '';
          }
        }

        if (cancelBtn) {
          cancelBtn.hidden = (mode === 'alert');
        }

        if (overlay) {
          overlay.hidden = false;
          overlay.setAttribute('aria-hidden', 'false');
        }

        document.addEventListener('keydown', onKeydown, true);
        if (overlay) overlay.addEventListener('click', onBackdropClick);

        if (mode === 'prompt' && inputEl) {
          inputEl.focus();
          inputEl.select();
        } else if (okBtn) {
          okBtn.focus();
        }
      }

      if (activeResolve) {
        queue.push(doShow);
      } else {
        doShow();
      }
    });
  }

  if (okBtn)     okBtn.addEventListener('click', accept);
  if (cancelBtn) cancelBtn.addEventListener('click', dismiss);
  if (inputEl) {
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); accept(); }
    });
  }

  window.shellConfirm = function (message) {
    return show('confirm', message);
  };

  window.shellPrompt = function (message, defaultValue) {
    return show('prompt', message, defaultValue);
  };

  window.shellAlert = function (message) {
    return show('alert', message);
  };
})();
