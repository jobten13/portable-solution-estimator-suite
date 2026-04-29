/**
 * Standalone DOM probe: Water Calc — delete Water autosave keys, fill quota, then edit #water-beds.
 * Matches harness: remove fieldHospitalWater* keys before fill so save must insert new keys against full store.
 * Requires: `node serve.js` on PORT 4173.
 */
const { chromium } = require('@playwright/test');

const WATER_AUTOSAVE_KEY = 'fieldHospitalWaterAutosave';
const WATER_LAST_SAVED_KEY = 'fieldHospitalWaterLastSaved';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({ type: 'console', text: msg.text(), location: msg.location() });
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push({ type: 'pageerror', message: err.message, stack: err.stack });
  });

  await page.goto('http://localhost:4173/Water%20Calc/index.html');
  await page.waitForLoadState('domcontentloaded');

  // Harness-aligned: remove Water autosave keys before fill (forces insert on next save, not update-in-place)
  const keyDeleteResult = await page.evaluate(
    ({ k1, k2 }) => {
      const before1 = localStorage.getItem(k1);
      const before2 = localStorage.getItem(k2);
      localStorage.removeItem(k1);
      localStorage.removeItem(k2);
      return {
        before: { [k1]: before1 != null, [k2]: before2 != null },
        afterRemove: { [k1]: localStorage.getItem(k1), [k2]: localStorage.getItem(k2) }
      };
    },
    { k1: WATER_AUTOSAVE_KEY, k2: WATER_LAST_SAVED_KEY }
  );
  console.log('Key deletion (before fill):', JSON.stringify(keyDeleteResult, null, 2));

  // Fill localStorage to quota
  const fillResult = await page.evaluate(() => {
    let i = 0;
    try {
      while (true) {
        localStorage.setItem('fill_' + i, 'x'.repeat(10000));
        i++;
      }
    } catch (e) {
      return { threw: true, i, error: e.message };
    }
    return { threw: false, i };
  });
  console.log('\n(1) Fill result — did setItem throw?', fillResult.threw === true ? 'YES' : 'NO');
  console.log('Fill result detail:', fillResult);

  await page.locator('#water-beds').click();
  await page.fill('#water-beds', '10');
  await page.locator('header.banner').click();

  console.log('\nWaiting 15s (capturing console errors + page errors)…');
  await page.waitForTimeout(15_000);

  if (consoleErrors.length) {
    console.log('\nBrowser console.error during wait:', JSON.stringify(consoleErrors, null, 2));
  } else {
    console.log('\nBrowser console.error during wait: (none)');
  }
  if (pageErrors.length) {
    console.log('Uncaught page errors during wait:', JSON.stringify(pageErrors, null, 2));
  } else {
    console.log('Uncaught page errors during wait: (none)');
  }

  const toastState = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('.toast').forEach((el) => {
      results.push({
        selector: '.toast',
        text: el.textContent,
        visible: el.offsetParent !== null,
        classes: el.className
      });
    });
    const shellToast = document.getElementById('shell-toast');
    if (shellToast) {
      results.push({
        selector: '#shell-toast',
        text: shellToast.textContent,
        hidden: shellToast.hidden
      });
    }
    document.querySelectorAll('.toast-container').forEach((el) => {
      results.push({
        selector: '.toast-container',
        children: el.children.length,
        parent: el.parentElement?.id || el.parentElement?.className
      });
    });
    return results;
  });

  const hasToast =
    toastState.some((row) => row.selector === '.toast' && (row.text || '').trim().length > 0);
  console.log('\n(2) Toast in DOM after 15s?', hasToast ? 'YES (see .toast entries)' : 'NO');
  console.log('Toast state:', JSON.stringify(toastState, null, 2));

  const storageSnapshot = await page.evaluate(
    ({ autosaveKey, lastSavedKey }) => {
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        allKeys.push(localStorage.key(i));
      }
      allKeys.sort();
      return {
        waterAutosavePresent: localStorage.getItem(autosaveKey) !== null,
        waterLastSavedPresent: localStorage.getItem(lastSavedKey) !== null,
        waterAutosavePreview: localStorage.getItem(autosaveKey)?.slice(0, 400) ?? null,
        waterLastSavedValue: localStorage.getItem(lastSavedKey)
      };
    },
    { autosaveKey: WATER_AUTOSAVE_KEY, lastSavedKey: WATER_LAST_SAVED_KEY }
  );
  console.log('localStorage Water keys after:', JSON.stringify(storageSnapshot, null, 2));

  await browser.close();
})();
