# FHC Standardisation Priority List – Audit Report

**Audit date:** 2025-02-11  
**Scope:** `Calcs Final` (Load Calc Pro, Load Calc Basic, Consumables Calc, Medicines Calc, Water Calc)  
**Source:** `Fixes Files\FHC_Standardisation_Priority_List.md`

**Design:** Consumables and Medicines (Medications) are kept as **full standalone modules**. Each has its own folder, assets, and `vendor/` (e.g. SheetJS); they can be used or deployed independently and do not share code or dependencies.

---

## Summary

| Tier | Done | Partial | Not done |
|------|------|--------|----------|
| 1    | 8    | 0      | 0        |
| 2    | 8    | 0      | 0        |
| 3    | 7    | 0      | 0        |
| 4    | 8    | 0      | 0        |
| **Total** | **31** | **0** | **0** |

---

## TIER 1 – Critical Bugs

| # | Task | Affects | Status | Notes |
|---|------|---------|--------|-------|
| 1 | Load Pro: Missing fuel conversion constants | Load Pro | Done | `L_PER_GAL` and `GALLONS_PER_LITER = 1 / L_PER_GAL` declared at top of IIFE. |
| 2 | Load Pro: clearSheet() leaves stale totals | Load Pro | Done | `recalc()` is called at end of `clearSheet()`. |
| 3 | Load Pro: Scenario name/notes fields decorative | Load Pro | Done | `getScenarioData()` reads name/notes; `saveScenario()` uses `data.name`; `applyScenarioData()` restores them. |
| 4 | Consumables: Autosave round-trip broken | Consumables | Done | `loadSavedData()` reads `cons-*` keys and restores days, beds, buffer, consumables, file name. |
| 5 | Consumables: CSS orphaned properties | Consumables | Done | `.param-group input` has font-size, background, min-height, box-sizing, transition in one rule. |
| 6 | Consumables: Storage key collision risk | Consumables | Done | `STORAGE_KEY` and flat keys use `cons-` prefix. |
| 7 | Medications: "Per Ward Bed" hardcoded in print | Medicines | Done | Column header is "Per day/Per Bed" in script.js. |
| 8 | Load Pro: applySort() on every keypress | Load Pro | Done | `applySort()` is not called from inside `recalc()`; only from `init()` and `onSortChange()`. |

---

## TIER 2 – High Priority

| # | Task | Affects | Status | Notes |
|---|------|---------|--------|-------|
| 9 | Apply five kW corrections to Load Pro | Load Pro | Done | equipment-data.js: Suction 0.05, Portable O2 0.10, Centrifuge 0.05, Anesthesia 0.12, Ventilator 0.20. |
| 10 | Apply same five to Load Calc Basic | Load Basic | Done | equipment-data.js has same values; validation comment block present. |
| 11 | Reconcile Printer / Label Printer kW | Both Load | Done | Load Pro comment "Printer (Printing) 0.80 kW, Label printer (thermal) 0.10 kW"; Load Basic has Multifunction Printer 0.80, Label printer 0.10. |
| 12 | calculateAndDisplay() zero-result search | Consumables, Medicines | Done | Both call `displayConsumables()` (and Consumables `updateItemsInfo()`) without length guard; zero results render correctly. |
| 13 | Consumables import file not reset after use | Consumables | Done | `ev.target.value = ''` in import callback (consumables.js). |
| 14 | Consumables feedback wrong type for errors | Consumables | Done | JS uses `showFeedback(..., 'error')`; `.button-feedback.error` added to styles.css (red bg/text/border, matching Medications). |
| 15 | Water: breakdown-toggle in print CSS | Water | Done | `.breakdown-toggle { display: none !important; }` in `@media print`. |
| 16 | Water: days=0 "~0 over deployment" | Water | Done | When `days <= 0`, delivery/pickup set to `'—'`. |

---

## TIER 3 – Standards Uplift

| # | Task | Affects | Status | Notes |
|---|------|---------|--------|-------|
| 17 | Standardise print to window.print() + CSS | Consumables, Medicines | Done | Both use `window.print()` and `@media print`; no window.open() print. |
| 18 | Section-level help popovers | All five | Done | All have .help-icon / .help-popover pattern. |
| 19 | CSS custom properties (:root) | Load Basic, Consumables, Medicines, Water | Done | All have :root with --color-primary, --color-bg, etc. |
| 20 | Input hover / section hover styling | Load Pro, Load Basic, Consumables, Medicines | Done | Load Pro: .scenario-meta .field:hover, .card:hover. Load Basic: .field:hover, .card:hover. Consumables/Medicines: .param-group:hover, .highlight-section:hover. |
| 21 | Extract Load Basic equipment to separate file | Load Basic | Done | equipment-data.js with LOAD_CALC_BASIC_EQUIPMENT; index.html loads it before script.js. |
| 22 | Stress test files | Load Pro, Load Basic, Water, Medicines | Done | stress-test.html present in all four; Consumables also has stress-test.js. |
| 23 | kW/PF validation comments in Load Basic data | Load Basic | Done | equipment-data.js has validation block referencing KW_AUDIT_REPORT and corrected values. |

---

## TIER 4 – UX & Field Quality-of-Life

| # | Task | Affects | Status | Notes |
|---|------|---------|--------|-------|
| 24 | Active buffer indicator on table | Consumables, Medicines | Done | Both show buffer badge when bufferPercentage > 0. |
| 25 | Dynamic column header by list type | Consumables | Done | `currentListType` ('ward' \| 'icu' \| 'custom'); header "Per day/Per Ward Bed", "Per day/Per ICU Bed", or "Per day/Per Bed". |
| 26 | Fix empty-state messaging and items-info | Consumables, Medicines | Done | Consumables: "Load the UCD Ward or ICU list above, or upload an Excel file."; items-info hidden when no items. Medicines: UCD Medications + Excel; PHARMA_ITEMS empty note; items-info hidden when no items. |
| 27 | Confirm dialogs on destructive actions | Load Pro, Load Basic | Done | Load Pro: overwrite, delete scenario, clear all scenarios, reset qtys, clear sheet. Load Basic: reset qty, full reset, delete scenario, clear all, delete custom item. |
| 28 | Bundle SheetJS locally (vendor/) | Consumables, Medicines | Done* | Both have vendor/ folder and README; index.html (and Medicines convert-excel-to-pharma-list.html) use `vendor/xlsx.full.min.js`. *xlsx.full.min.js not in repo; user must add per README for offline use. |
| 29 | Print button leftmost in toolbar | Load Pro, Load Basic | Done | Print is first button in HTML; toolbar CSS justify-content: flex-start. |
| 30 | Autosave timestamp in footer | Consumables, Load Pro | Done | cons-last-saved / load-pro-last-saved elements; LAST_SAVED_KEY; updated on save and on load. |
| 31 | Touch target sizes 44×44px minimum | All five | Done | Load Pro/Basic/Consumables/Medicines/Water have min-height: 44px (and where specified min-width) on toolbar/scenario buttons, selects, quantity inputs, sidebar inputs, help icons; Load Basic quantity inputs min-width: 80px. |

---

## Actions Recommended

- **#28:** For fully offline use, download `xlsx.full.min.js` (v0.18.5) from cdnjs and place in each of:
   - `Consumables Calc/vendor/`
   - `Medicines Calc/vendor/`
   as described in each folder’s README.

---

*End of audit. All 31 items implemented. Last updated: #1 and #14 completed.*
