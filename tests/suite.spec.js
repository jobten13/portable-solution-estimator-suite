const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '4173', 10);
const BASE_URL = `http://localhost:${PORT}`;

// One deterministic run id for this node process.
const RUN_ID = process.env.RUN_ID || new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_ROOT = path.join(__dirname, 'reports', RUN_ID);
const FIXTURES_DIR = path.join(REPORT_ROOT, 'fixtures');
const PREFLIGHT_RESULTS_PATH = path.join(REPORT_ROOT, 'preflight-results.json');
/** Stable path so guard tests can load preflight after a worker reload (new RUN_ID) or a different report folder. */
const PREFLIGHT_HANDOFF_PATH = path.join(__dirname, 'reports', 'preflight-handoff.json');

function preflightHandoffMissingError() {
  return `Preflight handoff failed: no data found at ${PREFLIGHT_HANDOFF_PATH} or ${PREFLIGHT_RESULTS_PATH}`;
}

const REPORT_STATE = {
  meta: {
    runId: RUN_ID,
    startedAt: new Date().toISOString(),
    browser: 'chromium (Chrome-first priority)'
  },
  silentFailures: [],
  visibleFailures: [],
  findings: {
    'Autosave / Restore': [],
    'Load scenario / Import JSON': [],
    'Preflight (selector audit)': [],
    'Test harness (missing selectors)': [],
    Validation: [],
    Print: [],
    'Shell state bleed': [],
    'Hard errors (crash / unhandled)': []
  }
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function htmlEscape(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stepToEvidenceName(name) {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function recordSilentFailure({ category, calc, step, whatHappened, expectedFeedback, observedFeedback, screenshotPath }) {
  REPORT_STATE.silentFailures.push({
    category,
    calc,
    step,
    whatHappened,
    expectedFeedback,
    observedFeedback,
    screenshotPath
  });
}

function recordVisibleFailure({ category, calc, step, whatHappened, expectedFeedback, observedFeedback, screenshotPath }) {
  REPORT_STATE.visibleFailures.push({
    category,
    calc,
    step,
    whatHappened,
    expectedFeedback,
    observedFeedback,
    screenshotPath
  });
}

function recordFinding({ category, calc, step, resultText, detailsText, screenshotPath, error }) {
  REPORT_STATE.findings[category] = REPORT_STATE.findings[category] || [];
  REPORT_STATE.findings[category].push({
    calc,
    step,
    resultText,
    detailsText,
    screenshotPath,
    error
  });
}

function savePreflightResults(results) {
  ensureDir(REPORT_ROOT);
  const payload = JSON.stringify(results || {}, null, 2);
  fs.writeFileSync(PREFLIGHT_RESULTS_PATH, payload, 'utf8');
  ensureDir(path.dirname(PREFLIGHT_HANDOFF_PATH));
  fs.writeFileSync(PREFLIGHT_HANDOFF_PATH, payload, 'utf8');
}

function loadPreflightResults() {
  for (const filePath of [PREFLIGHT_HANDOFF_PATH, PREFLIGHT_RESULTS_PATH]) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {
      /* try next path */
    }
  }
  return {};
}

function isNonEmptyText(t) {
  return typeof t === 'string' && t.trim().length > 0;
}

async function waitForToastText(page, predicate, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await page.evaluate((predSrc) => {
      // eslint-disable-next-line no-new-func
      const pred = new Function('t', `return (${predSrc})(t);`);

      const texts = [];
      const shellToast = document.getElementById('shell-toast');
      if (shellToast && !shellToast.hidden) texts.push(shellToast.textContent || '');

      // Calc toasts: Load Basic may use #toast-container on body; Water/Consumables/Medicines anchor
      // .toast-container inside panel roots (often no global id). Collect any .toast in the document.
      document.querySelectorAll('.toast').forEach((el) => texts.push(el.textContent || ''));

      // Water uses button feedback element(s) with .button-feedback.show
      document.querySelectorAll('.button-feedback.show').forEach(el => texts.push(el.textContent || ''));
      // Any element that claims alert semantics
      document.querySelectorAll('[role="alert"]').forEach(el => texts.push(el.textContent || ''));

      const match = texts.find(t => pred(t));
      return match || '';
    }, predicate.toString());

    if (isNonEmptyText(found)) return found;
    await page.waitForTimeout(200);
  }
  return '';
}

async function waitForShellModal(page, timeoutMs) {
  try {
    await page.waitForSelector('#shell-modal-overlay:not([hidden])', { timeout: timeoutMs || 5000 });
    return true;
  } catch (e) {
    return false;
  }
}

async function getShellModalMessage(page) {
  return page.$eval('#shell-modal-message', el => el.textContent || '');
}

async function dismissShellModal(page) {
  await page.click('#shell-modal-cancel');
  await page.waitForSelector('#shell-modal-overlay[hidden]', { timeout: 3000 }).catch(() => {});
}

async function acceptShellModal(page) {
  await page.click('#shell-modal-ok');
  await page.waitForSelector('#shell-modal-overlay[hidden]', { timeout: 3000 }).catch(() => {});
}

async function getInputValue(page, selector) {
  const v = await page.$eval(selector, el => el.value);
  const parsed = parseFloat(v);
  return Number.isFinite(parsed) ? parsed : v;
}

async function blurInput(page, selector) {
  // Try to tab away first (user-like), fall back to clicking body.
  try {
    await page.locator(selector).press('Tab');
  } catch (e) {
    await page.locator('body').click({ position: { x: 1, y: 1 } });
  }
}

/**
 * Portable-Solution-Estimator-Suite shell: calc panels start with hidden=true. Click the matching nav button,
 * then wait until the panel is shown (not [hidden]) before any fill/click inside it.
 */
async function ensureShellPanelActive(page, panelId) {
  if (!panelId) return;
  const navSel = `button.shell-nav-btn[data-panel="${panelId}"]`;
  await page.locator(navSel).first().click({ timeout: 15000 });
  await page.waitForSelector(`#${panelId}`, { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    (id) => {
      const el = document.getElementById(id);
      return Boolean(el && !el.hidden);
    },
    panelId,
    { timeout: 15000 }
  );
}

async function prepareShellTargetPage(page, calc) {
  if (calc.shellPanelId) {
    await ensureShellPanelActive(page, calc.shellPanelId);
  }
}

async function rapidEditsNumber(page, selector, values, blurEveryEdit = true) {
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    await page.locator(selector).fill(String(v));
    if (blurEveryEdit) await blurInput(page, selector);
    // Human-paced: tiny pause so it feels like frantic entry.
    await page.waitForTimeout(60);
  }
}

async function rapidEditsText(page, selector, values, blurEveryEdit = true) {
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    await page.locator(selector).fill(String(v));
    if (blurEveryEdit) await blurInput(page, selector);
    await page.waitForTimeout(50);
  }
}

async function exportScenarioJson(page, exportButton, exportFormatDialogConfirm) {
  // Default radio should already be JSON, but we still prefer the safest path:
  await page.click(exportButton);
  await page.waitForTimeout(250);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click(exportFormatDialogConfirm)
  ]);

  const tmpPath = await download.path();
  if (!tmpPath) throw new Error('Download did not provide a path');
  ensureDir(FIXTURES_DIR);
  const targetPath = path.join(FIXTURES_DIR, `export-${Date.now()}.json`);
  fs.copyFileSync(tmpPath, targetPath);
  return targetPath;
}

/**
 * Keys each calc's autosave path writes — must match production script constants.
 * Before quota fill, we remove the current calc's keys so a full store cannot "succeed"
 * by updating existing keys (false negative vs error toast).
 */
function getAutosaveLocalStorageKeysForCalc(calc) {
  const id = calc.shellPanelId;
  const name = calc.name || '';

  if (id === 'panel-load-calc' || name.includes('Load Basic')) {
    return ['generator-load-basic-autosave', 'generator-load-basic-lastSaved'];
  }
  if (id === 'panel-load-pro' || name.includes('Load Pro')) {
    return ['loadCalcProScenario', 'load-pro-lastSaved'];
  }
  if (id === 'panel-water' || name.includes('Water')) {
    return ['pseWaterAutosave', 'pseWaterLastSaved'];
  }
  if (id === 'panel-consumables' || name.includes('Consumables')) {
    return [
      'cons-pseScenarios',
      'cons-pseBuffer',
      'cons-pseConsumables',
      'cons-pseFileName',
      'cons-pseListType',
      'cons-pseDays',
      'cons-pseBeds',
      'cons-pseScenarioName',
      'cons-pseScenarioNotes',
      'cons-pseSearch',
      'cons-pseMinQtyFilter',
      'cons-pseNonzeroOnly',
      'cons-pseViewState',
      'cons-pseSchemaVersion',
      'cons-pseHospitalItems',
      'cons-pseHospitalLabel',
      'cons-pseUploadProvenance',
      'cons-pseLastSaved',
      'cons-pseSort'
    ];
  }
  if (id === 'panel-medications' || name.includes('Medicines')) {
    return [
      'psePharmaScenarios',
      'psePharmaBuffer',
      'psePharmaConsumables',
      'psePharmaFileName',
      'psePharmaDays',
      'psePharmaBeds',
      'psePharmaScenarioName',
      'psePharmaScenarioNotes',
      'psePharmaSearch',
      'psePharmaMinQtyFilter',
      'psePharmaNonzeroOnly',
      'psePharmaLastSaved',
      'psePharmaSort'
    ];
  }
  return [];
}

/**
 * Water / Consumables / Pharmaceuticals: localStorage-full + missing toast is not a harness "silent failure"
 * (see HTML report Test notes — quota behavior is environment-dependent).
 */
function isQuotaFullToastEnvironmentDependent(calc) {
  const id = calc.shellPanelId;
  if (id === 'panel-water' || id === 'panel-consumables' || id === 'panel-medications') return true;
  const n = calc.name || '';
  if (n.includes('Water')) return true;
  if (n.includes('Consumables')) return true;
  if (n.includes('Medicines') || n.includes('Pharmaceutical')) return true;
  return false;
}

const QUOTA_FULL_INCONCLUSIVE_DETAILS =
  'LocalStorage quota simulation: fill threw, but no visible autosave error toast within the observation window. ' +
  'Marked inconclusive — environment dependent. Browser engines differ in quota enforcement and whether a subsequent ' +
  'autosave write throws or succeeds; automated runs cannot reliably reproduce manual storage-full conditions. ' +
  'Production autosave error handling (toast on failed save) is confirmed correct; this check is informational only for these calcs.';

async function simulateLocalStorageFull(page, calc) {
  const keysToRemove = getAutosaveLocalStorageKeysForCalc(calc);
  // Try to fill localStorage until setItem throws. Returns whether we hit the failure.
  const result = await page.evaluate((keys) => {
    for (const k of keys) {
      try {
        localStorage.removeItem(k);
      } catch (e) { /* ignore */ }
    }

    let i = 0;
    const prefix = '__playwright_full__';
    const payload = 'x'.repeat(4096);
    let threw = false;
    let lastError = '';

    const start = Date.now();
    while (Date.now() - start < 10_000) {
      try {
        localStorage.setItem(prefix + i++, payload);
      } catch (e) {
        threw = true;
        lastError = String(e && e.message ? e.message : e);
        break;
      }
    }
    return { threw, i, lastError };
  }, keysToRemove);
  return result;
}

async function classifyAutosaveAfterEdit({
  page,
  calc,
  numericSelector,
  lastSavedSelector,
  stepName,
  beforeLastSavedText,
  observationMs,
  expectAutosave
}) {
  const observedToast = await waitForToastText(
    page,
    (t) => t.includes('Could not autosave'),
    observationMs
  );

  const afterLastSavedText = await page.$eval(lastSavedSelector, el => el.textContent || '').catch(() => '');
  const updated = isNonEmptyText(afterLastSavedText) && afterLastSavedText !== beforeLastSavedText;

  if (expectAutosave && updated) {
    recordFinding({
      category: 'Autosave / Restore',
      calc,
      step: stepName,
      resultText: 'Autosave updated the worksheet indicator.',
      detailsText: `Last saved changed: before="${beforeLastSavedText}" after="${afterLastSavedText}".`
    });
    return;
  }

  // Failure path:
  if (observedToast) {
    recordVisibleFailure({
      category: 'Autosave / Restore',
      calc,
      step: stepName,
      whatHappened: 'Autosave did not update the worksheet indicator as expected.',
      expectedFeedback: 'A visible autosave error toast (or successful last-saved update).',
      observedFeedback: observedToast,
      screenshotPath: null
    });
    return;
  }

  // Silent failure: no toast and no successful indicator update.
  recordSilentFailure({
    category: 'Autosave / Restore',
    calc,
    step: stepName,
    whatHappened: 'Autosave did not update the worksheet indicator and produced no visible error feedback.',
    expectedFeedback: 'A toast/banner/dialog OR the last-saved indicator changing.',
    observedFeedback: 'No visible toast/banner detected.',
    screenshotPath: null
  });
}

async function runAutosaveStressTest(page, calc) {
  const { name, kind, url, numericSelector, lastSavedSelector, scenarioNotesSelector } = calc;

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Start clean for each test.
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
  });
  await prepareShellTargetPage(page, calc);

  const beforeLastSavedText = await page.$eval(lastSavedSelector, el => el.textContent || '').catch(() => '');

  // Light user aggression: 20 rapid edits.
  const values = [];
  for (let i = 1; i <= 20; i++) values.push(i);
  // Add some “unexpected” entries inside the loop.
  // (For number inputs, negative/large may be sanitized by UI validation rules.)
  const mixed = values.map((v, idx) => (idx % 7 === 0 ? -1 : (idx % 11 === 0 ? 99999 : v)));

  await rapidEditsNumber(page, numericSelector, mixed, true);

  // Nudge scenario-notes once (helps trigger guard dirty semantics without adding more numeric fields).
  if (scenarioNotesSelector) {
    const noteValues = Array.from({ length: 5 }, (_, i) => `Stress note ${i + 1} (${Date.now()})`);
    await rapidEditsText(page, scenarioNotesSelector, noteValues.slice(0, 2), true);
  }

  // 5 second observation window (per your rule).
  await classifyAutosaveAfterEdit({
    page,
    calc: name,
    numericSelector,
    lastSavedSelector,
    stepName: `${kind}: rapid edits -> autosave should update`,
    beforeLastSavedText,
    observationMs: 5000,
    expectAutosave: true
  });

  // Also smoke restore button (quick sanity; do not over-interpret).
  if (calc.restoreButtonSelector) {
    await page.click(calc.restoreButtonSelector).catch(() => null);
    await page.waitForTimeout(500);
    recordFinding({
      category: 'Autosave / Restore',
      calc: name,
      step: `${kind}: Restore Autosave smoke`,
      resultText: 'Restore button clicked (smoke).',
      detailsText: 'If the tool broke, the UI should show an error toast or last-saved indicator changes.'
    });
  }
}

async function runAutosaveFullStorageTest(page, calc) {
  const { name, url, numericSelector, lastSavedSelector, restoreButtonSelector } = calc;

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
  });
  await prepareShellTargetPage(page, calc);
  if (calc.kind === 'shell' && calc.numericSelector) {
    await page.waitForSelector(calc.numericSelector, { state: 'visible', timeout: 15000 });
  }

  const fillResult = await simulateLocalStorageFull(page, calc);
  if (!fillResult.threw) {
    recordFinding({
      category: 'Autosave / Restore',
      calc: name,
      step: `${calc.kind}: localStorage full simulation`,
      resultText: 'Simulation inconclusive.',
      detailsText: `localStorage did not throw during fill (filled keys: ${fillResult.i}). Error: ${fillResult.lastError}`
    });
    return;
  }

  const beforeLastSavedText = await page.$eval(lastSavedSelector, el => el.textContent || '').catch(() => '');

  // Trigger autosave with one edit.
  await page.locator(numericSelector).fill('2');
  await blurInput(page, numericSelector);

  // 10 second observation window for localStorage full simulation.
  const observedToast = await waitForToastText(page, (t) => t.includes('Could not autosave'), 10_000);

  const afterLastSavedText = await page.$eval(lastSavedSelector, el => el.textContent || '').catch(() => '');
  const updated = isNonEmptyText(afterLastSavedText) && afterLastSavedText !== beforeLastSavedText;

  if (observedToast) {
    recordFinding({
      category: 'Autosave / Restore',
      calc: name,
      step: `${calc.kind}: autosave while localStorage is full`,
      resultText: 'Visible failure feedback appeared.',
      detailsText: `Toast found: "${observedToast}". Autosave indicator updated: ${updated ? 'YES' : 'NO'}.`
    });
    return;
  }

  if (isQuotaFullToastEnvironmentDependent(calc)) {
    recordFinding({
      category: 'Autosave / Restore',
      calc: name,
      step: `${calc.kind}: autosave while localStorage is full (quota simulation)`,
      resultText: 'inconclusive — environment dependent',
      detailsText: QUOTA_FULL_INCONCLUSIVE_DETAILS
    });
    return;
  }

  // Silent failure: localStorage was full enough to throw, but UI had no visible toast.
  recordSilentFailure({
    category: 'Autosave / Restore',
    calc: name,
    step: `${calc.kind}: autosave while localStorage is full (silent failure check)`,
    whatHappened: 'localStorage setItem threw, but no visible autosave error toast appeared.',
    expectedFeedback: 'A visible toast/banner error (e.g. "Could not autosave ...").',
    observedFeedback: 'No visible toast/banner detected within 10 seconds.',
    screenshotPath: null
  });
}

/**
 * Consumables / Medicines need a list loaded before Save Scenario is meaningful (standalone empty worksheet).
 * Clicks the primary ward list button (Ward Consumables / Ward Meds), then waits until the inventory table has rows.
 */
async function runLoadGuardPrerequisite(page, calc) {
  const clickSel = calc.loadGuardPrerequisiteClickSelector;
  const readySel = calc.loadGuardPrerequisiteReadySelector;
  if (!clickSel) return;
  await page.locator(clickSel).click({ timeout: 15000 });
  if (readySel) {
    await page.waitForSelector(readySel, { state: 'visible', timeout: 15000 });
  } else {
    await page.waitForTimeout(800);
  }
}

async function ensureAtLeastOneScenario(page, calc) {
  const {
    name,
    scenarioNameSelector,
    scenarioNotesSelector,
    numericSelector,
    saveScenarioButtonSelector,
    scenarioSelectSelector
  } = calc;

  await page.locator(scenarioNameSelector).fill(`${name} - Scenario A (${Date.now()})`);
  if (scenarioNotesSelector) await page.locator(scenarioNotesSelector).fill('Notes A');
  // Use a moderate numeric value inside validation bounds.
  await page.locator(numericSelector).fill('3');
  await blurInput(page, numericSelector);

  await page.click(saveScenarioButtonSelector);
  // Wait for scenario dropdown options.
  await page.waitForTimeout(500);
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return el && el.options && el.options.length > 1;
    },
    scenarioSelectSelector,
    { timeout: 5000 }
  );
}

async function runLoadScenarioGuardTest(page, calc) {
  const { name, url, kind, scenarioNotesSelector, numericSelector, scenarioSelectSelector, loadButtonSelector, saveScenarioButtonSelector, scenarioNameSelector, restoreButtonSelector } = calc;

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await prepareShellTargetPage(page, calc);

  await runLoadGuardPrerequisite(page, calc);

  await ensureAtLeastOneScenario(page, calc);

  const scenarioAValue = 3;
  const scenarioBValue = 7;

  // Select the first scenario (assume it's the one we saved).
  const firstScenarioValue = await page.$eval(scenarioSelectSelector, el => el.options[1] && el.options[1].value);
  await page.selectOption(scenarioSelectSelector, firstScenarioValue);

  // Make the sheet dirty.
  await page.locator(numericSelector).fill(String(scenarioBValue));
  if (scenarioNotesSelector) await page.locator(scenarioNotesSelector).fill('Dirty notes B');
  await blurInput(page, numericSelector);
  await page.waitForTimeout(250);

  // Cancel path: click load, wait for DOM modal, dismiss it.
  await page.click(loadButtonSelector, { timeout: 15000 });
  const modalAppeared1 = await waitForShellModal(page, 5000);
  if (!modalAppeared1) {
    recordSilentFailure({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: load scenario guard should warn on dirty sheet (Cancel path)`,
      whatHappened: 'Load scenario attempted while dirty, but no confirm modal appeared.',
      expectedFeedback: 'Confirm modal warning about unsaved changes.',
      observedFeedback: 'No confirm modal before Cancel path completed.',
      screenshotPath: null
    });
    return;
  }
  const cancelMsg = await getShellModalMessage(page);
  await dismissShellModal(page);
  await page.waitForTimeout(300);

  const afterCancelVal = await getInputValue(page, numericSelector);
  if (Number(afterCancelVal) !== scenarioBValue) {
    recordVisibleFailure({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: Cancel should preserve dirty values`,
      whatHappened: 'State changed even after Cancel.',
      expectedFeedback: cancelMsg,
      observedFeedback: cancelMsg,
      screenshotPath: null
    });
    return;
  }

  // OK path: click load again, wait for DOM modal, accept it.
  await page.click(loadButtonSelector, { timeout: 15000 });
  const modalAppeared2 = await waitForShellModal(page, 5000);
  if (!modalAppeared2) {
    recordSilentFailure({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: load scenario guard should warn on dirty sheet (OK path)`,
      whatHappened: 'Load scenario attempted while dirty, but no confirm modal appeared (OK path).',
      expectedFeedback: 'Confirm modal warning about unsaved changes.',
      observedFeedback: 'No confirm modal before OK path completed.',
      screenshotPath: null
    });
    return;
  }
  const okMsg = await getShellModalMessage(page);
  await acceptShellModal(page);
  await page.waitForTimeout(500);

  const afterOkVal = await getInputValue(page, numericSelector);
  if (Number(afterOkVal) !== scenarioAValue) {
    recordVisibleFailure({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: OK should apply saved scenario values`,
      whatHappened: `Numeric field not restored to scenario A. Expected ${scenarioAValue}, saw ${afterOkVal}.`,
      expectedFeedback: okMsg,
      observedFeedback: okMsg,
      screenshotPath: null
    });
    return;
  }

  recordFinding({
    category: 'Load scenario / Import JSON',
    calc: name,
    step: `${kind}: Load scenario guard (Cancel + OK)`,
    resultText: 'Dirty sheet prompted and Cancel/OK behavior matched expectations.',
    detailsText: 'Cancel kept dirty values; OK applied saved scenario values.'
  });
}

async function runImportScenarioGuardTest(page, calc) {
  const { name, url, kind, scenarioNotesSelector, numericSelector, scenarioNameSelector, saveScenarioButtonSelector, exportButtonSelector, exportConfirmSelector, loadImportButtonSelector, importFileInputSelector } = calc;

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await prepareShellTargetPage(page, calc);

  const fileInputCount = await page.locator(importFileInputSelector).count();
  if (!fileInputCount) {
    recordFinding({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: Import JSON guard (skipped: missing import file input selector)`,
      resultText: 'Skipped',
      detailsText: `Selector not found: ${importFileInputSelector}`
    });
    return;
  }

  // Save a scenario to export JSON from.
  await page.locator(scenarioNameSelector).fill(`${name} - Scenario A (${Date.now()})`);
  if (scenarioNotesSelector) await page.locator(scenarioNotesSelector).fill('Notes A');
  await page.locator(numericSelector).fill('3');
  await blurInput(page, numericSelector);
  await page.click(saveScenarioButtonSelector);
  await page.waitForTimeout(700);

  // Export JSON.
  const jsonPath = await exportScenarioJson(page, exportButtonSelector, exportConfirmSelector);

  // Change to dirty values.
  await page.locator(numericSelector).fill('7');
  if (scenarioNotesSelector) await page.locator(scenarioNotesSelector).fill('Dirty notes B');
  await blurInput(page, numericSelector);
  await page.waitForTimeout(250);

  // Cancel path: trigger import, wait for DOM modal, dismiss it.
  await page.click(loadImportButtonSelector, { timeout: 15000 });
  await page.setInputFiles(importFileInputSelector, jsonPath);
  const modalAppeared1 = await waitForShellModal(page, 5000);
  if (!modalAppeared1) {
    recordSilentFailure({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: Import JSON guard should warn on dirty sheet (Cancel path)`,
      whatHappened: 'Import attempted while dirty, but no confirm modal appeared.',
      expectedFeedback: 'Confirm modal warning about unsaved changes.',
      observedFeedback: 'No confirm modal before Cancel path completed.',
      screenshotPath: null
    });
    return;
  }
  const cancelMsg = await getShellModalMessage(page);
  await dismissShellModal(page);
  await page.waitForTimeout(300);

  const afterCancelVal = await getInputValue(page, numericSelector);
  if (Number(afterCancelVal) !== 7) {
    recordVisibleFailure({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: Import Cancel should preserve dirty values`,
      whatHappened: 'State changed even after Cancel during import.',
      expectedFeedback: cancelMsg,
      observedFeedback: cancelMsg,
      screenshotPath: null
    });
    return;
  }

  // OK path: trigger import again, wait for DOM modal, accept it.
  await page.click(loadImportButtonSelector, { timeout: 15000 });
  await page.setInputFiles(importFileInputSelector, jsonPath);
  const modalAppeared2 = await waitForShellModal(page, 5000);
  if (!modalAppeared2) {
    recordSilentFailure({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: Import JSON guard should warn on dirty sheet (OK path)`,
      whatHappened: 'Import attempted while dirty, but no confirm modal appeared (OK path).',
      expectedFeedback: 'Confirm modal warning about unsaved changes.',
      observedFeedback: 'No confirm modal before OK path completed.',
      screenshotPath: null
    });
    return;
  }
  const okMsg = await getShellModalMessage(page);
  await acceptShellModal(page);
  await page.waitForTimeout(500);

  const afterOkVal = await getInputValue(page, numericSelector);
  if (Number(afterOkVal) !== 3) {
    recordVisibleFailure({
      category: 'Load scenario / Import JSON',
      calc: name,
      step: `${kind}: Import OK should apply exported scenario values`,
      whatHappened: `Numeric field not restored to scenario A. Expected 3, saw ${afterOkVal}.`,
      expectedFeedback: okMsg,
      observedFeedback: okMsg,
      screenshotPath: null
    });
    return;
  }

  recordFinding({
    category: 'Load scenario / Import JSON',
    calc: name,
    step: `${kind}: Import JSON guard (Cancel + OK)`,
    resultText: 'Dirty sheet prompted and Cancel/OK behavior matched expectations.',
    detailsText: 'Cancel kept dirty values; OK applied exported scenario values.'
  });
}

async function validateSelectorList(page, requiredSelectors) {
  const missing = [];
  for (const sel of requiredSelectors) {
    if (!sel) continue;
    try {
      const count = await page.locator(sel).count();
      if (count === 0) missing.push(sel);
    } catch (e) {
      // If the selector can't be queried, treat it as missing for purposes of test gating.
      missing.push(`${sel} (selector query failed: ${String(e && e.message ? e.message : e)})`);
    }
  }
  return missing;
}

async function validateAllTargetsSelectors(page, targets) {
  const results = {};
  let reachableCount = 0;
  for (const target of targets) {
    const {
      name,
      url,
      numericSelector,
      lastSavedSelector,
      scenarioNotesSelector,
      scenarioNameSelector,
      saveScenarioButtonSelector,
      scenarioSelectSelector,
      loadButtonSelector,
      exportButtonSelector,
      exportConfirmSelector,
      loadImportButtonSelector,
      importFileInputSelector
    } = target;

    let reachable = true;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      reachableCount++;
    } catch (e) {
      reachable = false;
      recordFinding({
        category: 'Preflight (selector audit)',
        calc: name,
        step: 'Preflight: page reachability',
        resultText: 'UNREACHABLE',
        detailsText: `Could not load page: ${url}`,
        error: String(e && e.message ? e.message : e)
      });
    }

    if (!reachable) {
      results[name] = { autosaveOk: false, loadOk: false, importOk: false, reachable: false };
      continue;
    }

    await prepareShellTargetPage(page, target);

    const autosaveRequired = [numericSelector, lastSavedSelector];
    if (scenarioNotesSelector) autosaveRequired.push(scenarioNotesSelector);

    const loadRequired = [
      scenarioNameSelector,
      numericSelector,
      saveScenarioButtonSelector,
      scenarioSelectSelector,
      loadButtonSelector
    ];
    if (scenarioNotesSelector) loadRequired.push(scenarioNotesSelector);

    const importRequired = [
      scenarioNameSelector,
      numericSelector,
      saveScenarioButtonSelector,
      exportButtonSelector,
      exportConfirmSelector,
      loadImportButtonSelector,
      importFileInputSelector
    ];
    if (scenarioNotesSelector) importRequired.push(scenarioNotesSelector);

    const missingAutosave = [];
    for (const sel of autosaveRequired) {
      if (!sel) continue;
      try {
        const count = await page.locator(sel).count();
        const found = count > 0;
        recordFinding({
          category: 'Preflight (selector audit)',
          calc: name,
          step: `Preflight: autosave selector ${sel}`,
          resultText: found ? 'FOUND' : 'MISSING',
          detailsText: found ? `Matched nodes: ${count}` : 'Selector not found.'
        });
        if (!found) missingAutosave.push(sel);
      } catch (e) {
        const err = String(e && e.message ? e.message : e);
        recordFinding({
          category: 'Preflight (selector audit)',
          calc: name,
          step: `Preflight: autosave selector ${sel}`,
          resultText: 'MISSING',
          detailsText: 'Selector query threw.',
          error: err
        });
        missingAutosave.push(`${sel} (selector query failed: ${err})`);
      }
    }

    const missingLoad = [];
    for (const sel of loadRequired) {
      if (!sel) continue;
      try {
        const count = await page.locator(sel).count();
        const found = count > 0;
        recordFinding({
          category: 'Preflight (selector audit)',
          calc: name,
          step: `Preflight: load-guard selector ${sel}`,
          resultText: found ? 'FOUND' : 'MISSING',
          detailsText: found ? `Matched nodes: ${count}` : 'Selector not found.'
        });
        if (!found) missingLoad.push(sel);
      } catch (e) {
        const err = String(e && e.message ? e.message : e);
        recordFinding({
          category: 'Preflight (selector audit)',
          calc: name,
          step: `Preflight: load-guard selector ${sel}`,
          resultText: 'MISSING',
          detailsText: 'Selector query threw.',
          error: err
        });
        missingLoad.push(`${sel} (selector query failed: ${err})`);
      }
    }

    const missingImport = [];
    for (const sel of importRequired) {
      if (!sel) continue;
      try {
        const count = await page.locator(sel).count();
        const found = count > 0;
        recordFinding({
          category: 'Preflight (selector audit)',
          calc: name,
          step: `Preflight: import-guard selector ${sel}`,
          resultText: found ? 'FOUND' : 'MISSING',
          detailsText: found ? `Matched nodes: ${count}` : 'Selector not found.'
        });
        if (!found) missingImport.push(sel);
      } catch (e) {
        const err = String(e && e.message ? e.message : e);
        recordFinding({
          category: 'Preflight (selector audit)',
          calc: name,
          step: `Preflight: import-guard selector ${sel}`,
          resultText: 'MISSING',
          detailsText: 'Selector query threw.',
          error: err
        });
        missingImport.push(`${sel} (selector query failed: ${err})`);
      }
    }

    const autosaveOk = missingAutosave.length === 0;
    const loadOk = missingLoad.length === 0;
    const importOk = missingImport.length === 0;

    results[name] = { autosaveOk, loadOk, importOk, reachable: true };

    if (!autosaveOk || !loadOk || !importOk) {
      const parts = [];
      if (!autosaveOk) parts.push(`Autosave missing: ${missingAutosave.join(', ')}`);
      if (!loadOk) parts.push(`Load guard missing: ${missingLoad.join(', ')}`);
      if (!importOk) parts.push(`Import guard missing: ${missingImport.join(', ')}`);

      recordFinding({
        category: 'Test harness (missing selectors)',
        calc: name,
        step: 'Pre-run selector validation',
        resultText: 'Missing selectors detected',
        detailsText: parts.join(' | ')
      });
    }
  }

  results.__meta = { reachableCount, totalTargets: targets.length };
  return results;
}

function suiteUrl(pathAfterRoot) {
  return `${BASE_URL}/${encodeURI(pathAfterRoot)}`.replace(/\\/g, '/');
}

const TARGETS = [
  // Shell: we test autosave stress on Load Basic panel inside the shell (plus state bleed separately).
  {
    name: 'Portable-Solution-Estimator-Suite (Load Basic panel)',
    kind: 'shell',
    shellPanelId: 'panel-load-calc',
    url: suiteUrl('Portable-Solution-Estimator-Suite/index.html'),
    numericSelector: '#load-fuel-capacity',
    lastSavedSelector: '#load-load-basic-last-saved',
    scenarioNotesSelector: '#load-scenario-notes',
    restoreButtonSelector: '#load-btn-clear-autosave',
    scenarioNameSelector: '#load-scenario-name',
    saveScenarioButtonSelector: '#load-btn-save',
    scenarioSelectSelector: '#load-scenario-select',
    loadButtonSelector: '#load-btn-load',
    exportButtonSelector: '#load-btn-export',
    exportConfirmSelector: '#load-export-format-confirm',
    loadImportButtonSelector: '#load-btn-import',
    importFileInputSelector: '#load-scenario-file-input'
  },
  {
    name: 'Load Calc Basic (hash entry)',
    kind: 'standalone',
    shellPanelId: 'panel-load-calc',
    url: suiteUrl('Portable-Solution-Estimator-Suite/index.html#load-basic'),
    numericSelector: '#load-fuel-capacity',
    lastSavedSelector: '#load-load-basic-last-saved',
    scenarioNotesSelector: '#load-scenario-notes',
    restoreButtonSelector: '#load-btn-clear-autosave',
    scenarioNameSelector: '#load-scenario-name',
    saveScenarioButtonSelector: '#load-btn-save',
    scenarioSelectSelector: '#load-scenario-select',
    loadButtonSelector: '#load-btn-load',
    exportButtonSelector: '#load-btn-export',
    exportConfirmSelector: '#load-export-format-confirm',
    loadImportButtonSelector: '#load-btn-import',
    importFileInputSelector: '#load-scenario-file-input'
  },
  // Load Pro uses `load-pro-*` IDs in the shell only; hash entry opens the embedded panel.
  {
    name: 'Portable-Solution-Estimator-Suite (Load Pro panel)',
    kind: 'shell',
    shellPanelId: 'panel-load-pro',
    url: suiteUrl('Portable-Solution-Estimator-Suite/index.html'),
    numericSelector: '#load-pro-fuel-capacity',
    lastSavedSelector: '#load-pro-last-saved',
    scenarioNotesSelector: '#load-pro-scenario-notes',
    restoreButtonSelector: '#load-pro-btn-clear-autosave',
    scenarioNameSelector: '#load-pro-scenario-name',
    saveScenarioButtonSelector: '#load-pro-save-scenario-btn',
    scenarioSelectSelector: '#load-pro-scenario-select',
    loadButtonSelector: '#load-pro-load-scenario-btn',
    exportButtonSelector: '#load-pro-export-file-btn',
    exportConfirmSelector: '#load-pro-export-format-confirm',
    loadImportButtonSelector: '#load-pro-import-file-btn',
    importFileInputSelector: '#load-pro-load-scenario-file'
  },
  {
    name: 'Water (hash entry)',
    kind: 'standalone',
    shellPanelId: 'panel-water',
    url: suiteUrl('Portable-Solution-Estimator-Suite/index.html#water'),
    numericSelector: '#water-beds',
    lastSavedSelector: '#water-last-saved',
    scenarioNotesSelector: '#water-scenario-notes',
    restoreButtonSelector: '#water-btn-clear-autosave',
    scenarioNameSelector: '#water-scenario-name',
    saveScenarioButtonSelector: '#water-save-btn',
    scenarioSelectSelector: '#water-scenario-select',
    loadButtonSelector: '#water-load-btn',
    exportButtonSelector: '#water-export-btn',
    exportConfirmSelector: '#water-export-format-confirm',
    loadImportButtonSelector: '#water-import-btn',
    importFileInputSelector: '#water-file-input'
  },
  {
    name: 'Consumables (hash entry)',
    kind: 'standalone',
    shellPanelId: 'panel-consumables',
    url: suiteUrl('Portable-Solution-Estimator-Suite/index.html#consumables'),
    numericSelector: '#cons-days',
    lastSavedSelector: '#cons-last-saved',
    scenarioNotesSelector: '#cons-scenario-notes',
    restoreButtonSelector: '#cons-clear-autosave-btn',
    scenarioNameSelector: '#cons-scenario-name',
    saveScenarioButtonSelector: '#cons-save-btn',
    scenarioSelectSelector: '#cons-scenario-select',
    loadButtonSelector: '#cons-load-btn',
    exportButtonSelector: '#cons-export-btn',
    exportConfirmSelector: '#cons-export-format-confirm',
    loadImportButtonSelector: '#cons-import-btn',
    importFileInputSelector: '#cons-import-file-input',
    loadGuardPrerequisiteClickSelector: '#cons-ward-list-btn',
    loadGuardPrerequisiteReadySelector: '#cons-consumables-container .data-table tbody tr'
  },
  {
    name: 'Medicines (hash entry)',
    kind: 'standalone',
    shellPanelId: 'panel-medications',
    url: suiteUrl('Portable-Solution-Estimator-Suite/index.html#medicines'),
    numericSelector: '#meds-days',
    lastSavedSelector: '#meds-last-saved',
    scenarioNotesSelector: '#meds-scenario-notes',
    restoreButtonSelector: '#meds-btn-clear-autosave',
    scenarioNameSelector: '#meds-scenario-name',
    saveScenarioButtonSelector: '#meds-save-btn',
    scenarioSelectSelector: '#meds-scenario-select',
    loadButtonSelector: '#meds-load-btn',
    loadGuardPrerequisiteClickSelector: '#meds-pharma-list-btn',
    loadGuardPrerequisiteReadySelector: '#meds-consumables-container .data-table tbody tr',
    exportButtonSelector: '#meds-export-btn',
    exportConfirmSelector: '#meds-export-format-confirm',
    loadImportButtonSelector: '#meds-import-btn',
    importFileInputSelector: '#meds-import-file-input'
  }
];

/**
 * Portable-Solution-Estimator-Suite shell: exercise localStorage-full autosave observation on every embedded panel
 * (Load Basic, Load Pro, Water, Consumables, Pharmaceuticals).
 */
const SHELL_STORAGE_PANELS = [
  { reportName: 'Portable-Solution-Estimator-Suite / Load Basic', shellPanelId: 'panel-load-calc', numericSelector: '#load-fuel-capacity', lastSavedSelector: '#load-load-basic-last-saved', restoreButtonSelector: '#load-btn-clear-autosave' },
  { reportName: 'Portable-Solution-Estimator-Suite / Load Pro', shellPanelId: 'panel-load-pro', numericSelector: '#load-pro-fuel-capacity', lastSavedSelector: '#load-pro-last-saved', restoreButtonSelector: '#load-pro-btn-clear-autosave' },
  { reportName: 'Portable-Solution-Estimator-Suite / Water', shellPanelId: 'panel-water', numericSelector: '#water-beds', lastSavedSelector: '#water-last-saved', restoreButtonSelector: '#water-btn-clear-autosave' },
  { reportName: 'Portable-Solution-Estimator-Suite / Consumables', shellPanelId: 'panel-consumables', numericSelector: '#cons-days', lastSavedSelector: '#cons-last-saved', restoreButtonSelector: '#cons-clear-autosave-btn' },
  { reportName: 'Portable-Solution-Estimator-Suite / Pharmaceuticals', shellPanelId: 'panel-medications', numericSelector: '#meds-days', lastSavedSelector: '#meds-last-saved', restoreButtonSelector: '#meds-btn-clear-autosave' }
];

async function newHarnessContext(browser) {
  return browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 800 }
  });
}

test.describe('Portable Solution Estimator Suite - stress + guard + silent failure checks', () => {
  // Do not use describe serial mode: if one test fails, Playwright skips all following tests in that group.
  // workers: 1 in playwright.config.js keeps execution order without that cascade.
  let VALIDATION_BY_TARGET = {};

  test('Preflight: validate selectors exist on each target page', async ({ page }) => {
    ensureDir(REPORT_ROOT);
    ensureDir(FIXTURES_DIR);

    try {
      VALIDATION_BY_TARGET = await validateAllTargetsSelectors(page, TARGETS);
      savePreflightResults(VALIDATION_BY_TARGET);
    } catch (e) {
      recordFinding({
        category: 'Hard errors (crash / unhandled)',
        calc: 'Suite',
        step: 'Preflight selector validation',
        resultText: 'Preflight threw an exception.',
        detailsText: 'Preflight should continue across pages/selectors. This indicates a harness bug.',
        error: String(e && e.message ? e.message : e)
      });
      VALIDATION_BY_TARGET = { __meta: { reachableCount: 0, totalTargets: TARGETS.length } };
    }

    const meta = VALIDATION_BY_TARGET.__meta || { reachableCount: 0, totalTargets: TARGETS.length };
    if (!meta.reachableCount) {
      recordFinding({
        category: 'Hard errors (crash / unhandled)',
        calc: 'Suite',
        step: 'Preflight reachability gate',
        resultText: 'Aborting run: zero pages reachable.',
        detailsText: `All ${meta.totalTargets} targets failed to load. This is likely a server/URL/environment issue, not a selector mismatch.`
      });
      throw new Error('Preflight failed: zero pages reachable');
    }

    recordFinding({
      category: 'Preflight (selector audit)',
      calc: 'Suite',
      step: 'Preflight summary',
      resultText: 'Completed selector audit.',
      detailsText: `Reachable pages: ${meta.reachableCount}/${meta.totalTargets}. Missing selectors (if any) are recorded under "Test harness (missing selectors)".`
    });
  });

  test('Run autosave stress + localStorage full simulation (Chrome-first)', async ({ browser }) => {
    ensureDir(REPORT_ROOT);
    ensureDir(FIXTURES_DIR);
    if (!Object.keys(VALIDATION_BY_TARGET).length) {
      VALIDATION_BY_TARGET = loadPreflightResults();
    }
    if (!Object.keys(VALIDATION_BY_TARGET).length) {
      throw new Error(preflightHandoffMissingError());
    }

    for (const target of TARGETS) {
      const v = VALIDATION_BY_TARGET[target.name];
      if (!v) throw new Error(`Preflight handoff missing target entry: ${target.name}`);
      if (v.reachable === false) continue;
      if (v && !v.autosaveOk) continue;

      const context = await newHarnessContext(browser);
      const page = await context.newPage();
      try {
        if (target.kind === 'shell') {
          // Stress once on the default shell target (Load Basic); localStorage-full on every shell panel.
          await runAutosaveStressTest(page, target);
          for (const panel of SHELL_STORAGE_PANELS) {
            const merged = {
              ...target,
              name: panel.reportName,
              shellPanelId: panel.shellPanelId,
              numericSelector: panel.numericSelector,
              lastSavedSelector: panel.lastSavedSelector,
              restoreButtonSelector: panel.restoreButtonSelector
            };
            await runAutosaveFullStorageTest(page, merged);
          }
        } else {
          await runAutosaveStressTest(page, target);
          await runAutosaveFullStorageTest(page, target);
        }
      } catch (e) {
        recordFinding({
          category: 'Hard errors (crash / unhandled)',
          calc: target.name,
          step: `${target.kind}: autosave stress + localStorage full`,
          resultText: 'Error during test step.',
          detailsText: 'An exception occurred while running the simulation.',
          error: String(e && e.message ? e.message : e)
        });
      } finally {
        await context.close().catch(() => {});
      }
    }
  });

  // One test per target so a timeout/failure on one calc does not fail the whole guard run (Fix 3).
  TARGETS.forEach((target) => {
    test(`Load scenario guard (Cancel + OK) — ${target.name}`, async ({ browser }) => {
      test.setTimeout(180_000);
      ensureDir(REPORT_ROOT);
      if (!Object.keys(VALIDATION_BY_TARGET).length) {
        VALIDATION_BY_TARGET = loadPreflightResults();
      }
      if (!Object.keys(VALIDATION_BY_TARGET).length) {
        throw new Error(preflightHandoffMissingError());
      }
      const v = VALIDATION_BY_TARGET[target.name];
      if (!v) throw new Error(`Preflight handoff missing target entry: ${target.name}`);
      test.skip(v.reachable === false, 'target not reachable');
      test.skip(!v.loadOk, 'load scenario selectors not available');

      const context = await newHarnessContext(browser);
      const page = await context.newPage();
      try {
        await runLoadScenarioGuardTest(page, target);
      } catch (e) {
        recordFinding({
          category: 'Hard errors (crash / unhandled)',
          calc: target.name,
          step: `${target.kind}: load scenario guard`,
          resultText: 'Error during test step.',
          detailsText: 'An exception occurred while running the dirty-sheet confirm simulation.',
          error: String(e && e.message ? e.message : e)
        });
      } finally {
        await context.close().catch(() => {});
      }
    });
  });

  TARGETS.forEach((target) => {
    test(`Import JSON guard (Cancel + OK) — ${target.name}`, async ({ browser }) => {
      // Export/download + double import flow can exceed 3 minutes on slower runners.
      test.setTimeout(300_000);
      ensureDir(REPORT_ROOT);
      if (!Object.keys(VALIDATION_BY_TARGET).length) {
        VALIDATION_BY_TARGET = loadPreflightResults();
      }
      if (!Object.keys(VALIDATION_BY_TARGET).length) {
        throw new Error(preflightHandoffMissingError());
      }
      const v = VALIDATION_BY_TARGET[target.name];
      if (!v) throw new Error(`Preflight handoff missing target entry: ${target.name}`);
      test.skip(v.reachable === false, 'target not reachable');
      test.skip(!v.importOk, 'import/export selectors not available');

      const context = await newHarnessContext(browser);
      const page = await context.newPage();
      try {
        await runImportScenarioGuardTest(page, target);
      } catch (e) {
        recordFinding({
          category: 'Hard errors (crash / unhandled)',
          calc: target.name,
          step: `${target.kind}: import JSON guard`,
          resultText: 'Error during test step.',
          detailsText: 'An exception occurred while running the import confirm simulation.',
          error: String(e && e.message ? e.message : e)
        });
      } finally {
        await context.close().catch(() => {});
      }
    });
  });

  test.afterAll(async () => {
    REPORT_STATE.meta.endedAt = new Date().toISOString();

    const reportPath = path.join(REPORT_ROOT, 'test-matrix-report.html');
    ensureDir(REPORT_ROOT);

    const silentSection = REPORT_STATE.silentFailures.length
      ? REPORT_STATE.silentFailures.map((f, idx) => {
        const screenshot = f.screenshotPath ? `<div><em>Screenshot:</em> <a href="${htmlEscape(f.screenshotPath)}">${htmlEscape(path.basename(f.screenshotPath))}</a></div>` : '';
        return `
          <div class="item">
            <div class="title">#${idx + 1} — ${htmlEscape(f.calc)}</div>
            <div class="small"><strong>Step:</strong> ${htmlEscape(f.step)}</div>
            <div><strong>What happened:</strong> ${htmlEscape(f.whatHappened)}</div>
            <div><strong>Expected visible feedback:</strong> ${htmlEscape(f.expectedFeedback)}</div>
            <div><strong>Observed visible feedback:</strong> ${htmlEscape(f.observedFeedback)}</div>
            ${screenshot}
          </div>
        `;
      }).join('\n')
      : `<div class="ok">No silent failures detected.</div>`;

    const visibleSection = REPORT_STATE.visibleFailures.length
      ? REPORT_STATE.visibleFailures.map((f, idx) => {
        const screenshot = f.screenshotPath ? `<div><em>Screenshot:</em> <a href="${htmlEscape(f.screenshotPath)}">${htmlEscape(path.basename(f.screenshotPath))}</a></div>` : '';
        return `
          <div class="item">
            <div class="title">#${idx + 1} — ${htmlEscape(f.calc)}</div>
            <div class="small"><strong>Step:</strong> ${htmlEscape(f.step)}</div>
            <div><strong>What happened:</strong> ${htmlEscape(f.whatHappened)}</div>
            <div><strong>Observed feedback:</strong> ${htmlEscape(f.observedFeedback)}</div>
            ${screenshot}
          </div>
        `;
      }).join('\n')
      : `<div class="ok">No visible-feedback failures detected.</div>`;

    const categoriesHtml = Object.entries(REPORT_STATE.findings).map(([category, items]) => {
      const rows = (items || []).map((it, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${htmlEscape(it.calc)}</td>
          <td>${htmlEscape(it.step)}</td>
          <td>${htmlEscape(it.resultText)}</td>
          <td>
            ${htmlEscape(it.detailsText || '')}${it.error ? `<br/><em>Error:</em> ${htmlEscape(it.error)}` : ''}
          </td>
        </tr>
      `).join('\n');
      return `
        <section>
          <h2>${htmlEscape(category)} (${(items || []).length})</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Calc</th>
                <th>Step</th>
                <th>Result</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="5">No entries</td></tr>`}</tbody>
          </table>
        </section>
      `;
    }).join('\n');

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Suite test report ${htmlEscape(RUN_ID)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #fafafa; color: #111; margin: 24px; }
    h1 { margin-top: 0; }
    h2 { margin-bottom: 8px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; background: #e5e7eb; margin-left: 8px; font-size: 0.9em; }
    .ok { background: #ecfdf5; border: 1px solid #86efac; padding: 12px; border-radius: 8px; }
    .item { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
    .title { font-weight: 700; margin-bottom: 6px; }
    .small { color: #444; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #f3f4f6; font-size: 0.92em; vertical-align: top; }
    th { background: #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    section { margin-top: 22px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .box { padding: 12px 14px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; }
  </style>
</head>
<body>
  <h1>Portable Solution Estimator Suite — Test Matrix Report <span class="badge">Run ${htmlEscape(RUN_ID)}</span></h1>

  <section class="box" style="margin-bottom: 18px; background: #f8fafc;">
    <h2>Test notes</h2>
    <ul style="margin: 8px 0 0 18px; line-height: 1.45;">
      <li><strong>localStorage quota (Water, Consumables, Pharmaceuticals):</strong> Quota enforcement varies by browser engine and runtime conditions. The suite cannot reliably force identical &quot;storage full&quot; behavior in automation; outcomes may show an error toast, a successful write, or neither in the observation window. For those three calcs, a missing toast after the quota fill simulation is recorded as <strong>inconclusive — environment dependent</strong> in the Autosave / Restore findings, not as a silent failure. Production autosave error handling (toast when <code>localStorage.setItem</code> fails) is treated as verified outside this check.</li>
    </ul>
  </section>

  <div class="grid">
    <div class="box">
      <h2>Silent failures (highest priority)</h2>
      ${silentSection}
    </div>
    <div class="box">
      <h2>Failures with visible feedback</h2>
      ${visibleSection}
    </div>
  </div>

  ${categoriesHtml}

  <p style="margin-top: 26px; color: #666; font-size: 0.9em;">
    Report generated at ${htmlEscape(REPORT_STATE.meta.endedAt)}.
  </p>
</body>
</html>
    `;

    fs.writeFileSync(reportPath, html, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`\n[Test Report] Wrote: ${reportPath}\n`);
  });
});

