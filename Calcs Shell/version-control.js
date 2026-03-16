/**
 * Suite version control.
 * Loads version from version.json and updates the element with id="shell-version".
 */
(function () {
  'use strict';

  const VERSION_FILE = 'version.json';
  let currentVersion = '1.0.9';

  function updateVersionDisplay() {
    const el = document.getElementById('shell-version');
    if (el) el.textContent = 'Version ' + currentVersion;
  }

  function loadVersion() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', VERSION_FILE, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data && data.version) {
              currentVersion = data.version;
            }
          } catch (e) { /* use default */ }
        }
        updateVersionDisplay();
      }
    };
    xhr.send();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVersion);
  } else {
    loadVersion();
  }
})();
