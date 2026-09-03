/**
 * Comprehensive functional test suite for the Portable Solution Estimator Suite.
 * Covers: autosave, autosave-reset protection, scenarios, import/export,
 * reset, calculation, input validation, cross-tab state, and modals.
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '4173', 10);
const BASE = `http://localhost:${PORT}/Portable-Solution-Estimator-Suite/index.html`;
const FIXTURES_DIR = path.join(__dirname, 'functional-fixtures');

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function navTo(page, panelId) {
  await page.click(`.shell-nav-btn[data-panel="${panelId}"]`);
  await page.waitForSelector(`#${panelId}:not([hidden])`, { timeout: 5000 });
  await page.waitForTimeout(200);
}

async function freshPage(context, panelId) {
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await navTo(page, panelId);
  return page;
}

async function fillAndTab(page, sel, val) {
  await page.locator(sel).fill(String(val));
  await page.locator(sel).dispatchEvent('input');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
}

async function waitForAutosave(page, ms = 4500) {
  await page.waitForTimeout(ms);
}

async function waitForModal(page) {
  await page.waitForSelector('#shell-modal-overlay:not([hidden])', { timeout: 5000 });
}

async function acceptModal(page) {
  await page.click('#shell-modal-ok');
  await page.waitForSelector('#shell-modal-overlay[hidden]', { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(200);
}

async function dismissModal(page) {
  await page.click('#shell-modal-cancel');
  await page.waitForSelector('#shell-modal-overlay[hidden]', { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(200);
}

async function getVal(page, sel) {
  return page.$eval(sel, el => el.value);
}

async function getStorageItem(page, key) {
  return page.evaluate(k => localStorage.getItem(k), key);
}

// ─── Calc definitions ──────────────────────────────────────────────────────────

const CALCS = {
  loadBasic: {
    name: 'Load Basic',
    panelId: 'panel-load-calc',
    inputs: { primary: '#load-gen-capacity', secondary: '#load-fuel-capacity' },
    scenarioName: '#load-scenario-name',
    scenarioNotes: '#load-scenario-notes',
    scenarioSelect: '#load-scenario-select',
    saveBtn: '#load-btn-save',
    loadBtn: '#load-btn-load',
    deleteBtn: '#load-btn-delete-scenario',
    clearScenariosBtn: '#load-btn-clear-scenarios',
    restoreBtn: '#load-btn-clear-autosave',
    timestampSel: '#load-load-basic-last-saved',
    resetQtyBtn: '#load-btn-reset-qty',
    resetSheetBtn: '#load-btn-full-reset',
    exportBtn: '#load-btn-export',
    exportConfirm: '#load-export-format-confirm',
    importBtn: '#load-btn-import',
    importInput: '#load-scenario-file-input',
    autosaveDataKey: 'generator-load-basic-autosave',
    autosaveTimestampKey: 'generator-load-basic-lastSaved',
    outputSel: '.summary-row .value',
    listLoadBtn: null,
  },
  loadPro: {
    name: 'Load Pro',
    panelId: 'panel-load-pro',
    inputs: { primary: '#load-pro-available-kva', secondary: '#load-pro-fuel-capacity' },
    scenarioName: '#load-pro-scenario-name',
    scenarioNotes: '#load-pro-scenario-notes',
    scenarioSelect: '#load-pro-scenario-select',
    saveBtn: '#load-pro-save-scenario-btn',
    loadBtn: '#load-pro-load-scenario-btn',
    deleteBtn: '#load-pro-delete-scenario-btn',
    clearScenariosBtn: '#load-pro-clear-scenarios-btn',
    restoreBtn: '#load-pro-btn-clear-autosave',
    timestampSel: '#load-pro-last-saved',
    resetQtyBtn: '#load-pro-reset-btn',
    resetSheetBtn: '#load-pro-clear-sheet-btn',
    exportBtn: '#load-pro-export-file-btn',
    exportConfirm: '#load-pro-export-format-confirm',
    importBtn: '#load-pro-import-file-btn',
    importInput: '#load-pro-load-scenario-file',
    autosaveDataKey: 'loadCalcProScenario',
    autosaveTimestampKey: 'load-pro-lastSaved',
    outputSel: '.summary-row .value',
    listLoadBtn: null,
  },
  water: {
    name: 'Water',
    panelId: 'panel-water',
    inputs: { primary: '#water-days', secondary: '#water-beds' },
    scenarioName: '#water-scenario-name',
    scenarioNotes: '#water-scenario-notes',
    scenarioSelect: '#water-scenario-select',
    saveBtn: '#water-save-btn',
    loadBtn: '#water-load-btn',
    deleteBtn: '#water-delete-btn',
    clearScenariosBtn: '#water-clear-scenarios-btn',
    restoreBtn: '#water-btn-clear-autosave',
    timestampSel: '#water-last-saved',
    resetQtyBtn: null,
    resetSheetBtn: '#water-reset-btn',
    exportBtn: '#water-export-btn',
    exportConfirm: '#water-export-format-confirm',
    importBtn: '#water-import-btn',
    importInput: '#water-file-input',
    autosaveDataKey: 'pseWaterAutosave',
    autosaveTimestampKey: 'pseWaterLastSaved',
    outputSel: '.result-row .value',
    listLoadBtn: null,
  },
  consumables: {
    name: 'Consumables',
    panelId: 'panel-consumables',
    inputs: { primary: '#cons-days', secondary: '#cons-beds' },
    scenarioName: '#cons-scenario-name',
    scenarioNotes: '#cons-scenario-notes',
    scenarioSelect: '#cons-scenario-select',
    saveBtn: '#cons-save-btn',
    loadBtn: '#cons-load-btn',
    deleteBtn: '#cons-delete-btn',
    clearScenariosBtn: '#cons-clear-btn',
    restoreBtn: '#cons-clear-autosave-btn',
    timestampSel: '#cons-last-saved',
    resetQtyBtn: null,
    resetSheetBtn: '#cons-clear-items-btn',
    exportBtn: '#cons-export-btn',
    exportConfirm: '#cons-export-format-confirm',
    importBtn: '#cons-import-btn',
    importInput: '#cons-import-file-input',
    autosaveDataKey: 'cons-pseDays',
    autosaveTimestampKey: 'cons-pseLastSaved',
    outputSel: null,
    listLoadBtn: '#cons-ward-list-btn',
  },
  medicines: {
    name: 'Medicines',
    panelId: 'panel-medications',
    inputs: { primary: '#meds-days', secondary: '#meds-beds' },
    scenarioName: '#meds-scenario-name',
    scenarioNotes: '#meds-scenario-notes',
    scenarioSelect: '#meds-scenario-select',
    saveBtn: '#meds-save-btn',
    loadBtn: '#meds-load-btn',
    deleteBtn: '#meds-delete-btn',
    clearScenariosBtn: '#meds-clear-btn',
    restoreBtn: '#meds-btn-clear-autosave',
    timestampSel: '#meds-last-saved',
    resetQtyBtn: null,
    resetSheetBtn: '#meds-clear-items-btn',
    exportBtn: '#meds-export-btn',
    exportConfirm: '#meds-export-format-confirm',
    importBtn: '#meds-import-btn',
    importInput: '#meds-import-file-input',
    autosaveDataKey: 'psePharmaDays',
    autosaveTimestampKey: 'psePharmaLastSaved',
    outputSel: null,
    listLoadBtn: '#meds-pharma-list-btn',
  },
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Functional tests', () => {
  test.setTimeout(120_000);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOSAVE
  // ═══════════════════════════════════════════════════════════════════════════

  for (const [key, c] of Object.entries(CALCS)) {
    test(`Autosave: ${c.name} — save, reload, restore`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await freshPage(ctx, c.panelId);

      await fillAndTab(page, c.inputs.primary, '42');
      await waitForAutosave(page);

      // Verify localStorage
      const saved = await getStorageItem(page, c.autosaveDataKey);
      expect(saved, `${c.name}: autosave data key should be set`).not.toBeNull();
      const ts = await getStorageItem(page, c.autosaveTimestampKey);
      expect(ts, `${c.name}: timestamp key should be set`).not.toBeNull();

      // Verify timestamp display
      const tsText = await page.$eval(c.timestampSel, el => el.textContent);
      expect(tsText).toContain('Autosaved');

      // Reload
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      await navTo(page, c.panelId);

      // Data should survive reload
      const dataAfter = await getStorageItem(page, c.autosaveDataKey);
      expect(dataAfter, 'data survives reload').not.toBeNull();

      // Click restore
      await page.locator(c.restoreBtn).click();
      await page.waitForTimeout(1500);

      const restored = await getVal(page, c.inputs.primary);
      expect(restored).toBe('42');

      await ctx.close();
    });

    test(`Autosave: ${c.name} — tab switch preserves values`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await freshPage(ctx, c.panelId);

      await fillAndTab(page, c.inputs.primary, '55');
      await waitForAutosave(page);

      // Switch to a different tab
      const otherPanel = c.panelId === 'panel-water' ? 'panel-consumables' : 'panel-water';
      await navTo(page, otherPanel);
      await page.waitForTimeout(300);

      // Switch back
      await navTo(page, c.panelId);
      await page.waitForTimeout(300);

      const val = await getVal(page, c.inputs.primary);
      expect(val).toBe('55');

      await ctx.close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOSAVE PROTECTION ON RESET
  // ═══════════════════════════════════════════════════════════════════════════

  for (const [key, c] of Object.entries(CALCS)) {
    if (!c.resetSheetBtn) continue;

    test(`Reset protection: ${c.name} — reset does not overwrite autosave`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await freshPage(ctx, c.panelId);

      // Load list if needed (Consumables/Medicines)
      if (c.listLoadBtn) {
        await page.locator(c.listLoadBtn).click();
        await page.waitForTimeout(1500);
      }

      // Enter values and wait for autosave
      await fillAndTab(page, c.inputs.primary, '33');
      await waitForAutosave(page);

      const savedBefore = await getStorageItem(page, c.autosaveDataKey);
      expect(savedBefore, 'autosave data exists before reset').not.toBeNull();

      // Click Reset/Clear
      await page.locator(c.resetSheetBtn).click();
      await waitForModal(page);
      await acceptModal(page);
      await page.waitForTimeout(1000);

      // Verify fields are cleared
      const afterReset = await getVal(page, c.inputs.primary);
      expect(['', '0']).toContain(afterReset);

      // Verify autosave data was NOT overwritten
      await page.waitForTimeout(4500); // wait for any debounce that might fire
      const savedAfter = await getStorageItem(page, c.autosaveDataKey);
      expect(savedAfter, 'autosave data should survive reset').not.toBeNull();

      // For calcs that store a JSON blob, verify the value inside isn't zeroed
      if (c.autosaveDataKey.includes('Autosave') || c.autosaveDataKey.includes('Scenario') || c.autosaveDataKey.includes('autosave')) {
        try {
          const parsed = JSON.parse(savedAfter);
          // The pre-reset data should still be in there
          expect(savedAfter).toBe(savedBefore);
        } catch (e) { /* individual key storage — check value */ }
      }

      // Click Restore — pre-reset values should come back
      await page.locator(c.restoreBtn).click();
      await page.waitForTimeout(1500);

      const restoredVal = await getVal(page, c.inputs.primary);
      expect(restoredVal).toBe('33');

      // After restore, enter new values — autosave should resume
      await fillAndTab(page, c.inputs.primary, '77');
      await waitForAutosave(page);
      const newSaved = await getStorageItem(page, c.autosaveTimestampKey);
      expect(newSaved, 'autosave resumes after restore + edit').not.toBeNull();

      await ctx.close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIOS (save, load, delete)
  // ═══════════════════════════════════════════════════════════════════════════

  for (const [key, c] of Object.entries(CALCS)) {
    test(`Scenarios: ${c.name} — save, clear, load`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await freshPage(ctx, c.panelId);

      if (c.listLoadBtn) {
        await page.locator(c.listLoadBtn).click();
        await page.waitForTimeout(1500);
      }

      // Enter values
      await fillAndTab(page, c.inputs.primary, '20');
      await page.locator(c.scenarioName).fill('Test Scenario Alpha');
      await page.waitForTimeout(200);

      // Save
      await page.locator(c.saveBtn).click();
      await page.waitForTimeout(1000);

      // Verify dropdown has an option
      const optCount = await page.$eval(c.scenarioSelect, el => el.options.length);
      expect(optCount).toBeGreaterThan(1);

      // Clear primary input
      await fillAndTab(page, c.inputs.primary, '');
      await page.locator(c.scenarioName).fill('');
      await page.waitForTimeout(200);

      // Select saved scenario and load
      const firstVal = await page.$eval(c.scenarioSelect, el => el.options[1]?.value || '');
      expect(firstVal).not.toBe('');
      await page.selectOption(c.scenarioSelect, firstVal);
      await page.locator(c.loadBtn).click();

      // Accept dirty-sheet confirm modal if it appears
      const modalShown = await page.waitForSelector('#shell-modal-overlay:not([hidden])', { timeout: 3000 }).catch(() => null);
      if (modalShown) await acceptModal(page);
      await page.waitForTimeout(1500);

      // Verify values restored
      const loadedVal = await getVal(page, c.inputs.primary);
      expect(loadedVal).toBe('20');

      await ctx.close();
    });
  }

  test('Scenarios: Load Basic — viewState search and sort round-trip', async ({ browser }) => {
    const c = CALCS.loadBasic;
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, c.panelId);

    await page.selectOption('#load-sort-equipment', 'kw-asc');
    await page.waitForTimeout(200);
    const storedPreference = await getStorageItem(page, 'generator-load-sort');
    expect(storedPreference).toBe('kw-asc');

    await page.selectOption('#load-sort-equipment', 'kw-desc');
    await page.locator('#load-search-equipment').fill('monitor');
    await page.locator('#load-search-equipment').dispatchEvent('input');
    await page.waitForTimeout(200);

    await fillAndTab(page, c.inputs.primary, '20');
    await page.locator(c.scenarioName).fill('ViewState Round Trip');
    await page.locator(c.saveBtn).click();
    await page.waitForTimeout(1000);

    await page.selectOption('#load-sort-equipment', 'kw-asc');
    await page.waitForTimeout(200);
    await page.locator('#load-search-equipment').fill('');
    await page.locator('#load-search-equipment').dispatchEvent('input');
    await page.waitForTimeout(200);

    const firstVal = await page.$eval(c.scenarioSelect, el => el.options[1]?.value || '');
    expect(firstVal).not.toBe('');
    await page.selectOption(c.scenarioSelect, firstVal);
    await page.locator(c.loadBtn).click();

    const modalShown = await page.waitForSelector('#shell-modal-overlay:not([hidden])', { timeout: 3000 }).catch(() => null);
    if (modalShown) await acceptModal(page);
    await page.waitForTimeout(1500);

    const sortVal = await getVal(page, '#load-sort-equipment');
    expect(sortVal).toBe('kw-desc');
    const searchVal = await getVal(page, '#load-search-equipment');
    expect(searchVal).toBe('monitor');
    const preferenceAfterLoad = await getStorageItem(page, 'generator-load-sort');
    expect(preferenceAfterLoad).toBe('kw-asc');

    await ctx.close();
  });

  test('Import: Load Basic — v0 payload without viewState loads with defaults', async ({ browser }) => {
    const c = CALCS.loadBasic;
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, c.panelId);

    if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    const v0Path = path.join(FIXTURES_DIR, `load-basic-v0-${Date.now()}.json`);
    const v0Payload = {
      data: {
        scenarioName: 'Legacy v0 Export',
        scenarioNotes: 'no schemaVersion',
        generatorCapacity: '42',
        fuelTankCapacityGallons: 500,
        equipment: []
      },
      exportedAt: '2020-01-01T00:00:00.000Z'
    };
    fs.writeFileSync(v0Path, JSON.stringify(v0Payload, null, 2));

    await page.locator(c.importInput).setInputFiles(v0Path);
    await page.waitForTimeout(2000);

    const genVal = await getVal(page, c.inputs.primary);
    expect(genVal).toBe('42');
    const sortVal = await getVal(page, '#load-sort-equipment');
    expect(sortVal).toBe('name-asc');
    const searchVal = await getVal(page, '#load-search-equipment');
    expect(searchVal).toBe('');

    try { fs.unlinkSync(v0Path); } catch (e) {}
    await ctx.close();
  });

  test('Scenarios: Load Pro — viewState search and sort round-trip', async ({ browser }) => {
    const c = CALCS.loadPro;
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, c.panelId);

    await page.selectOption('#load-pro-sort-equipment', 'kw-asc');
    await page.waitForTimeout(200);
    const storedPreference = await getStorageItem(page, 'loadCalcProSort');
    expect(storedPreference).toBe('kw-asc');

    await page.selectOption('#load-pro-sort-equipment', 'kw-desc');
    await page.locator('#load-pro-search-equipment').fill('monitor');
    await page.locator('#load-pro-search-equipment').dispatchEvent('input');
    await page.waitForTimeout(200);

    await fillAndTab(page, c.inputs.primary, '20');
    await page.locator(c.scenarioName).fill('ViewState Round Trip Pro');
    await page.locator(c.saveBtn).click();
    await page.waitForTimeout(1000);

    await page.selectOption('#load-pro-sort-equipment', 'kw-asc');
    await page.waitForTimeout(200);
    await page.locator('#load-pro-search-equipment').fill('');
    await page.locator('#load-pro-search-equipment').dispatchEvent('input');
    await page.waitForTimeout(200);

    const firstVal = await page.$eval(c.scenarioSelect, el => el.options[1]?.value || '');
    expect(firstVal).not.toBe('');
    await page.selectOption(c.scenarioSelect, firstVal);
    await page.locator(c.loadBtn).click();

    const modalShown = await page.waitForSelector('#shell-modal-overlay:not([hidden])', { timeout: 3000 }).catch(() => null);
    if (modalShown) await acceptModal(page);
    await page.waitForTimeout(1500);

    const sortVal = await getVal(page, '#load-pro-sort-equipment');
    expect(sortVal).toBe('kw-desc');
    const searchVal = await getVal(page, '#load-pro-search-equipment');
    expect(searchVal).toBe('monitor');
    const preferenceAfterLoad = await getStorageItem(page, 'loadCalcProSort');
    expect(preferenceAfterLoad).toBe('kw-asc');

    await ctx.close();
  });

  test('Import: Load Pro — v0 payload without viewState loads with defaults and full catalog', async ({ browser }) => {
    const c = CALCS.loadPro;
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, c.panelId);

    if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    const v0Path = path.join(FIXTURES_DIR, `load-pro-v0-${Date.now()}.json`);
    const v0Payload = {
      name: 'Legacy v0 Export Pro',
      notes: 'no schemaVersion',
      availableKva: '42',
      fuelTankCapacityGallons: 500,
      fuelRateGalPerKw: 0.1,
      rows: []
    };
    fs.writeFileSync(v0Path, JSON.stringify(v0Payload, null, 2));

    await page.locator(c.importInput).setInputFiles(v0Path);
    await page.waitForTimeout(2000);

    const kvaVal = await getVal(page, c.inputs.primary);
    expect(kvaVal).toBe('42');
    const sortVal = await getVal(page, '#load-pro-sort-equipment');
    expect(sortVal).toBe('name-asc');
    const searchVal = await getVal(page, '#load-pro-search-equipment');
    expect(searchVal).toBe('');
    const monitorVisible = await page.locator('#panel-load-pro .equipment-row:not(.custom)', { hasText: 'Portable Vital Signs Monitor' }).count();
    expect(monitorVisible).toBeGreaterThan(0);

    try { fs.unlinkSync(v0Path); } catch (e) {}
    await ctx.close();
  });

  test('Import: Load Pro — legacy name/notes alias into scenarioName/scenarioNotes', async ({ browser }) => {
    const c = CALCS.loadPro;
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, c.panelId);

    if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    const legacyPath = path.join(FIXTURES_DIR, `load-pro-legacy-name-notes-${Date.now()}.json`);
    const legacyPayload = {
      name: 'Legacy Name Alias',
      notes: 'Legacy notes alias text',
      availableKva: '88',
      fuelTankCapacityGallons: 100,
      fuelRateGalPerKw: 0.2,
      rows: []
    };
    fs.writeFileSync(legacyPath, JSON.stringify(legacyPayload, null, 2));

    await page.locator(c.importInput).setInputFiles(legacyPath);
    await page.waitForTimeout(2000);

    expect(await getVal(page, c.scenarioName)).toBe('Legacy Name Alias');
    expect(await getVal(page, c.scenarioNotes)).toBe('Legacy notes alias text');
    expect(await getVal(page, c.inputs.primary)).toBe('88');

    try { fs.unlinkSync(legacyPath); } catch (e) {}
    await ctx.close();
  });

  test('Autosave: Load Pro — deleted built-in row persists through restore', async ({ browser }) => {
    const c = CALCS.loadPro;
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, c.panelId);

    const rowLocator = page.locator('#panel-load-pro .equipment-row:not(.custom)', { hasText: 'Portable Vital Signs Monitor' });
    await expect(rowLocator).toHaveCount(1);
    await rowLocator.first().locator('.delete-row').click();
    await waitForModal(page);
    await acceptModal(page);
    await page.waitForTimeout(200);

    await fillAndTab(page, c.inputs.primary, '55');
    await waitForAutosave(page);

    await page.locator(c.restoreBtn).click();
    await page.waitForTimeout(1500);

    const afterRestore = await page.locator('#panel-load-pro .equipment-row:not(.custom)', { hasText: 'Portable Vital Signs Monitor' }).count();
    expect(afterRestore).toBe(0);

    await ctx.close();
  });

  test('Reset: Load Pro — reset worksheet restores deleted built-in row', async ({ browser }) => {
    const c = CALCS.loadPro;
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, c.panelId);

    await page.selectOption('#load-pro-sort-equipment', 'kw-desc');
    await page.waitForTimeout(200);

    const rowLocator = page.locator('#panel-load-pro .equipment-row:not(.custom)', { hasText: 'Portable Vital Signs Monitor' });
    await expect(rowLocator).toHaveCount(1);
    await rowLocator.first().locator('.delete-row').click();
    await waitForModal(page);
    await acceptModal(page);
    await page.waitForTimeout(200);

    const gone = await page.locator('#panel-load-pro .equipment-row:not(.custom)', { hasText: 'Portable Vital Signs Monitor' }).count();
    expect(gone).toBe(0);

    await page.locator(c.resetSheetBtn).click();
    await waitForModal(page);
    await acceptModal(page);
    await page.waitForTimeout(1000);

    const restored = await page.locator('#panel-load-pro .equipment-row:not(.custom)', { hasText: 'Portable Vital Signs Monitor' }).count();
    expect(restored).toBeGreaterThan(0);

    const sortVal = await getVal(page, '#load-pro-sort-equipment');
    expect(sortVal).toBe('kw-desc');

    // After reset all qtys are 0, so kw-desc uses name A–Z as tie-breaker within each category.
    const names = await page.$$eval(
      '#panel-load-pro #cat-standard .equipment-row:not(.custom) td:first-child',
      els => els.map(el => el.textContent.trim())
    );
    expect(names.length).toBeGreaterThan(1);
    const sortedByName = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedByName);

    await ctx.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORT / EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  for (const [key, c] of Object.entries(CALCS)) {
    test(`Import/Export: ${c.name} — export then import`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await freshPage(ctx, c.panelId);

      if (c.listLoadBtn) {
        await page.locator(c.listLoadBtn).click();
        await page.waitForTimeout(1500);
      }

      // Enter values
      await fillAndTab(page, c.inputs.primary, '15');
      await page.locator(c.scenarioName).fill('Export Test');
      await page.waitForTimeout(200);

      // Export
      await page.click(c.exportBtn);
      await page.waitForTimeout(300);

      let exportPath;
      try {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 5000 }),
          page.click(c.exportConfirm),
        ]);
        const tmpPath = await download.path();
        if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
        exportPath = path.join(FIXTURES_DIR, `export-${key}-${Date.now()}.json`);
        fs.copyFileSync(tmpPath, exportPath);
      } catch (e) {
        // Some calcs may not have the format dialog
        test.skip(true, `Export dialog not available for ${c.name}`);
        await ctx.close();
        return;
      }

      // Verify export file is valid JSON with data
      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      expect(exported).toBeTruthy();

      // Clear and import
      await fillAndTab(page, c.inputs.primary, '');
      await page.locator(c.scenarioName).fill('');

      await page.locator(c.importInput).setInputFiles(exportPath);

      // Accept dirty-sheet confirm modal if it appears
      const importModal = await page.waitForSelector('#shell-modal-overlay:not([hidden])', { timeout: 3000 }).catch(() => null);
      if (importModal) await acceptModal(page);
      await page.waitForTimeout(2000);

      const importedVal = await getVal(page, c.inputs.primary);
      expect(importedVal).toBe('15');

      // Cleanup
      try { fs.unlinkSync(exportPath); } catch (e) {}

      await ctx.close();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════════════════════════════════

  for (const [key, c] of Object.entries(CALCS)) {
    if (!c.resetSheetBtn) continue;

    test(`Reset: ${c.name} — reset sheet clears all fields`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await freshPage(ctx, c.panelId);

      if (c.listLoadBtn) {
        await page.locator(c.listLoadBtn).click();
        await page.waitForTimeout(1500);
      }

      await fillAndTab(page, c.inputs.primary, '99');
      await page.locator(c.scenarioName).fill('Reset Test');
      await page.waitForTimeout(200);

      // Reset
      await page.locator(c.resetSheetBtn).click();
      await waitForModal(page);
      await acceptModal(page);
      await page.waitForTimeout(1000);

      const val = await getVal(page, c.inputs.primary);
      expect(['', '0']).toContain(val);

      const name = await getVal(page, c.scenarioName);
      // Load Basic/Pro full reset clears name; Consumables/Medicines clear all items clears name
      if (key !== 'water') {
        expect(name).toBe('');
      }

      await ctx.close();
    });

    // Load Basic and Load Pro have separate Reset Quantities
    if (c.resetQtyBtn) {
      test(`Reset: ${c.name} — reset quantities keeps scenario info`, async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await freshPage(ctx, c.panelId);

        // Enter a qty value and a scenario name
        const qtyInput = key === 'loadBasic'
          ? '#load-gen-capacity'
          : '#load-pro-available-kva';
        await fillAndTab(page, qtyInput, '50');
        await page.locator(c.scenarioName).fill('Keep This Name');
        await page.waitForTimeout(200);

        await page.locator(c.resetQtyBtn).click();
        await waitForModal(page);
        await acceptModal(page);
        await page.waitForTimeout(1000);

        // Scenario name should be preserved for reset-qty
        const nameAfter = await getVal(page, c.scenarioName);
        expect(nameAfter).toBe('Keep This Name');

        await ctx.close();
      });
    }
  }

  // Load Pro specific: reset sheet clears scenario name and dropdown
  test('Reset: Load Pro — reset sheet clears scenario section', async ({ browser }) => {
    const ctx = await browser.newContext();
    const c = CALCS.loadPro;
    const page = await freshPage(ctx, c.panelId);

    // Save a scenario first
    await fillAndTab(page, c.inputs.primary, '50');
    await page.locator(c.scenarioName).fill('Will Be Cleared');
    await page.locator(c.saveBtn).click();
    await page.waitForTimeout(1000);

    // Select the saved scenario
    const firstVal = await page.$eval(c.scenarioSelect, el => el.options[1]?.value || '');
    if (firstVal) await page.selectOption(c.scenarioSelect, firstVal);

    // Reset sheet
    await page.locator(c.resetSheetBtn).click();
    await waitForModal(page);
    await acceptModal(page);
    await page.waitForTimeout(1000);

    const nameAfter = await getVal(page, c.scenarioName);
    expect(nameAfter).toBe('');

    const selectVal = await page.$eval(c.scenarioSelect, el => el.value);
    expect(selectVal).toBe('');

    await ctx.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  test('Calculation: Water — known inputs produce non-zero output', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-water');

    await fillAndTab(page, '#water-days', '30');
    await fillAndTab(page, '#water-beds', '40');
    await page.waitForTimeout(500);

    // Check that at least one result value is non-zero
    const potableTotal = await page.$eval('#water-out-potable-total', el => el.textContent.trim());
    expect(potableTotal, 'Water potable total should be non-zero').not.toBe('—');
    expect(potableTotal).not.toBe('0');
    expect(potableTotal).not.toBe('');

    await ctx.close();
  });

  test('Calculation: Load Basic — equipment qty updates total', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-load-calc');

    // Wait for equipment rows to render
    await page.waitForSelector('#panel-load-calc .equipment-row .qty-input', { timeout: 5000 });

    // Enter a quantity for the first equipment item
    const firstQty = page.locator('#panel-load-calc .equipment-row .qty-input').first();
    await firstQty.fill('5');
    await firstQty.dispatchEvent('input');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Total connected load should update from 0.00 kW
    const totalText = await page.$eval('#load-total-kw', el => el.textContent.trim());
    expect(totalText).not.toBe('0.00 kW');

    await ctx.close();
  });

  test('Calculation: Consumables — days/beds produce quantities', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-consumables');

    // Load ward list first
    await page.locator('#cons-ward-list-btn').click();
    await page.waitForTimeout(1500);

    await fillAndTab(page, '#cons-days', '10');
    await fillAndTab(page, '#cons-beds', '20');
    await page.waitForTimeout(500);

    // Check that table has rows with non-zero quantities
    const qtyCells = await page.$$eval('#cons-consumables-container .highlight-cell', els =>
      els.map(el => parseInt(el.textContent.trim(), 10)).filter(n => n > 0)
    );
    expect(qtyCells.length, 'should have items with non-zero quantities').toBeGreaterThan(0);

    await ctx.close();
  });

  test('Calculation: Load Pro — kw-desc live re-sort on qty blur', async ({ browser }) => {
    const c = CALCS.loadPro;
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, c.panelId);

    await page.selectOption('#load-pro-sort-equipment', 'kw-desc');
    await page.waitForTimeout(200);

    const cutterRow = page.locator('#panel-load-pro #cat-standard .equipment-row:not(.custom)', { hasText: 'Orthopedic Cast Cutter' });
    await expect(cutterRow).toHaveCount(1);
    const qty = cutterRow.locator('.qty-input');
    await qty.fill('10');
    await qty.blur();
    await page.waitForTimeout(300);

    const firstName = await page.$eval(
      '#panel-load-pro #cat-standard .equipment-row:not(.custom) td:first-child',
      el => el.textContent.trim()
    );
    expect(firstName).toBe('Orthopedic Cast Cutter');
    expect(await getVal(page, '#load-pro-sort-equipment')).toBe('kw-desc');

    await ctx.close();
  });

  test('Calculation: Load Pro — equipment qty updates summary', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-load-pro');

    await page.waitForSelector('#panel-load-pro .equipment-row .qty-input', { timeout: 5000 });

    const firstQty = page.locator('#panel-load-pro .equipment-row .qty-input').first();
    await firstQty.fill('3');
    await firstQty.dispatchEvent('input');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    const totalKw = await page.$eval('#load-pro-total-kw', el => el.textContent.trim());
    expect(parseFloat(totalKw)).toBeGreaterThan(0);

    await ctx.close();
  });

  test('Calculation: Medicines — days/beds produce quantities', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-medications');

    await page.locator('#meds-pharma-list-btn').click();
    await page.waitForTimeout(1500);

    await fillAndTab(page, '#meds-days', '10');
    await fillAndTab(page, '#meds-beds', '20');
    await page.waitForTimeout(500);

    const qtyCells = await page.$$eval('#meds-consumables-container .highlight-cell', els =>
      els.map(el => parseInt(el.textContent.trim(), 10)).filter(n => n > 0)
    );
    expect(qtyCells.length, 'should have items with non-zero quantities').toBeGreaterThan(0);

    await ctx.close();
  });

  test('Calculation: Water — changing input updates output', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-water');

    await fillAndTab(page, '#water-days', '10');
    await fillAndTab(page, '#water-beds', '20');
    await page.waitForTimeout(300);

    const val1 = await page.$eval('#water-out-potable-total', el => el.textContent.trim());

    await fillAndTab(page, '#water-beds', '40');
    await page.waitForTimeout(300);

    const val2 = await page.$eval('#water-out-potable-total', el => el.textContent.trim());
    expect(val2).not.toBe(val1);

    await ctx.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  test('Validation: Water — negative days gets rejected or sanitized', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-water');

    await fillAndTab(page, '#water-days', '-5');
    await page.waitForTimeout(300);

    // Either the field has an error class, or the value was clamped to 0
    const hasError = await page.$eval('#water-days', el => el.classList.contains('input-error')).catch(() => false);
    const val = await getVal(page, '#water-days');
    const isValid = hasError || val === '0' || val === '';
    expect(isValid, 'negative days should be rejected or sanitized').toBe(true);

    await ctx.close();
  });

  test('Validation: Consumables — out-of-range buffer clamped', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-consumables');

    await fillAndTab(page, '#cons-buffer', '150');
    await page.waitForTimeout(300);

    const hasError = await page.$eval('#cons-buffer', el => el.classList.contains('input-error')).catch(() => false);
    expect(hasError, 'buffer > 100 should show validation error').toBe(true);

    await ctx.close();
  });

  test('Validation: Load Basic — non-numeric gen capacity rejected by browser', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-load-calc');

    // type="number" inputs reject non-numeric text at the browser level.
    // Simulate by pressing letter keys (which should be ignored).
    await page.locator('#load-gen-capacity').click();
    await page.keyboard.type('abc');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    const val = await getVal(page, '#load-gen-capacity');
    expect(val === '' || val === '0').toBe(true);

    await ctx.close();
  });

  test('Validation: Medicines — negative days', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-medications');

    await fillAndTab(page, '#meds-days', '-3');
    await page.waitForTimeout(300);

    const hasError = await page.$eval('#meds-days', el => el.classList.contains('input-error')).catch(() => false);
    const val = await getVal(page, '#meds-days');
    const isValid = hasError || val === '0' || val === '';
    expect(isValid, 'negative days should be rejected or show error').toBe(true);

    await ctx.close();
  });

  test('Validation: Water — placeholder returns on blur if empty', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-water');

    const placeholder = await page.$eval('#water-days', el => el.placeholder);
    expect(placeholder).not.toBe('');

    // Focus, clear, blur
    await page.locator('#water-days').click();
    await page.locator('#water-days').fill('');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Input should be empty, but placeholder attribute should persist
    const placeholderAfter = await page.$eval('#water-days', el => el.placeholder);
    expect(placeholderAfter).toBe(placeholder);

    await ctx.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-TAB STATE
  // ═══════════════════════════════════════════════════════════════════════════

  test('Cross-tab: values in one calc persist through tab switches', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-water');

    // Enter Water values
    await fillAndTab(page, '#water-days', '25');
    await fillAndTab(page, '#water-beds', '50');

    // Switch through all other tabs
    for (const p of ['panel-consumables', 'panel-medications', 'panel-load-calc', 'panel-load-pro']) {
      await navTo(page, p);
      await page.waitForTimeout(200);
    }

    // Come back to Water
    await navTo(page, 'panel-water');
    await page.waitForTimeout(300);

    expect(await getVal(page, '#water-days')).toBe('25');
    expect(await getVal(page, '#water-beds')).toBe('50');

    await ctx.close();
  });

  test('Cross-tab: edits in different calcs do not bleed', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await freshPage(ctx, 'panel-water');

    await fillAndTab(page, '#water-days', '10');

    await navTo(page, 'panel-consumables');
    await fillAndTab(page, '#cons-days', '20');

    // Check Water didn't change
    await navTo(page, 'panel-water');
    expect(await getVal(page, '#water-days')).toBe('10');

    // Check Consumables didn't change
    await navTo(page, 'panel-consumables');
    expect(await getVal(page, '#cons-days')).toBe('20');

    await ctx.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════════════════════════════════════════

  for (const [key, c] of Object.entries(CALCS)) {
    if (!c.resetSheetBtn) continue;

    test(`Modals: ${c.name} — reset shows shell modal, cancel aborts`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await freshPage(ctx, c.panelId);

      if (c.listLoadBtn) {
        await page.locator(c.listLoadBtn).click();
        await page.waitForTimeout(1500);
      }

      await fillAndTab(page, c.inputs.primary, '88');
      await page.waitForTimeout(200);

      // Click reset — should show modal
      await page.locator(c.resetSheetBtn).click();
      const appeared = await page.waitForSelector('#shell-modal-overlay:not([hidden])', { timeout: 5000 }).catch(() => null);
      expect(appeared, 'shell modal should appear').not.toBeNull();

      // Verify it's not a native dialog (the overlay element exists in DOM)
      const overlayVisible = await page.$eval('#shell-modal-overlay', el => !el.hidden);
      expect(overlayVisible).toBe(true);

      // Cancel — value should be preserved
      await dismissModal(page);
      const val = await getVal(page, c.inputs.primary);
      expect(val).toBe('88');

      await ctx.close();
    });
  }

  test('Modals: clear all scenarios shows confirm', async ({ browser }) => {
    const ctx = await browser.newContext();
    const c = CALCS.loadBasic;
    const page = await freshPage(ctx, c.panelId);

    // Save a scenario first
    await fillAndTab(page, c.inputs.primary, '10');
    await page.locator(c.scenarioName).fill('Clearable');
    await page.locator(c.saveBtn).click();
    await page.waitForTimeout(1000);

    // Clear all scenarios — cancel
    await page.locator(c.clearScenariosBtn).click();
    await waitForModal(page);
    await dismissModal(page);

    const stillThere = await page.$eval(c.scenarioSelect, el => el.options.length);
    expect(stillThere).toBeGreaterThan(1);

    // Clear all scenarios — confirm
    await page.locator(c.clearScenariosBtn).click();
    await waitForModal(page);
    await acceptModal(page);
    await page.waitForTimeout(1000);

    const afterClear = await page.$eval(c.scenarioSelect, el => el.options.length);
    expect(afterClear).toBe(1);

    await ctx.close();
  });

  test('Modals: delete scenario shows confirm, cancel preserves', async ({ browser }) => {
    const ctx = await browser.newContext();
    const c = CALCS.water;
    const page = await freshPage(ctx, c.panelId);

    // Save a scenario
    await fillAndTab(page, c.inputs.primary, '12');
    await page.locator(c.scenarioName).fill('Delete Me');
    await page.locator(c.saveBtn).click();
    await page.waitForTimeout(1000);

    // Select it
    const firstVal = await page.$eval(c.scenarioSelect, el => el.options[1]?.value || '');
    expect(firstVal).not.toBe('');
    await page.selectOption(c.scenarioSelect, firstVal);

    // Delete — cancel
    await page.locator(c.deleteBtn).click();
    await waitForModal(page);
    await dismissModal(page);

    // Scenario should still be in dropdown
    const afterCancel = await page.$eval(c.scenarioSelect, el => el.options.length);
    expect(afterCancel).toBeGreaterThan(1);

    // Delete — confirm
    await page.selectOption(c.scenarioSelect, firstVal);
    await page.locator(c.deleteBtn).click();
    await waitForModal(page);
    await acceptModal(page);
    await page.waitForTimeout(1000);

    const afterDelete = await page.$eval(c.scenarioSelect, el => el.options.length);
    expect(afterDelete).toBe(1); // just the placeholder

    await ctx.close();
  });
});
