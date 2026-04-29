# Shell merge — progress checklist

**Daily pickup / current backlog:** use **`../PROJECT_TRACKER.md`** (suite root). This file is the **original phase plan** and is often **out of date** vs the repo—verify before treating unchecked items as real work.

Per **cursor-implementation-guide.md**. Do not begin a phase until the previous phase is verified.

**Versioning:** Bump the **suite** version in **`../version.json`** **on phase completion** or **whenever a new version is warranted** (see **[`../VERSIONING.md`](../VERSIONING.md)**). Use `.\create-version.ps1 -VersionType minor -Changes "Phase N: ..."` from this folder, or edit **`../version.json`** manually. Minor = phase complete or significant milestone; patch = small fixes.

---

## Phase 0 — Data fixes (standalone, before any shell work)

- [x] 0.1 — Rename shared filenames (cons → consumables-data.js, meds → medications-data.js); update script tags
- [x] 0.2 — Fix Medications data (line endings CRLF → LF now; **leave both AmLODIPine entries in place until end of project**, then human confirms which to remove)
- [x] 0.3 — Fix Consumables data (typo IRRIGTATION → IRRIGATION; confirm/renumber Ward id 176)
- [x] 0.4 — Apply kW audit corrections to Load Calc Basic (equipment-data-basic.js + any hardcoded kW in script.js)
- [x] 0.5 — Update placeholder dates in all five version.json files
- [ ] **Phase 0 verification:** Each standalone index.html opens, no console errors, data correct; Basic shows corrected kW

---

## Phase 1 — Build the shell skeleton

- [x] 1.1 — Shell file structure (index.html, shell.js, shell.css, version-control.js)
- [x] 1.2 — shell/index.html (nav, five panel divs with IDs + CSS classes, version-info, shell-toast)
- [x] 1.3 — Script loading strategy (calc scripts added in Phase 2+; order: data before logic per README path map)
- [x] 1.4 — shell.js (panel show/hide, showShellToast, ShellAPI)
- [x] 1.5 — shell.css (layout, .calc-panel[hidden], shared tokens)
- [x] 1.6 — version-control.js in shell; version.json in shell; calc dirs keep their copy for standalone
- [ ] **Phase 1 verification:** shell/index.html opens, nav switches panels, no errors, no calc content yet, shell toast works
- [ ] **After Phase 1 verified:** Bump version to 1.1.0 when starting Phase 2 completion

---

## Phase 2 — Integrate Load Calc Basic

- [x] 2.1 — Verify Basic in shell, catalogue console/visual issues (Basic HTML/scripts added to shell)
- [x] 2.2 — Scope Basic CSS under .load-basic-calc
- [x] 2.3 — Fix three ROOT-bypass call sites (help popovers, guide modal, export dialog)
- [x] 2.4 — Prefix Basic toast container (lb-toast-container)
- [x] 2.5 — Shell contract check (panel-load-calc present)
- [ ] **Phase 2 verification:** Basic panel fully functional in shell; all features work; no regression; switch away/back OK
- [ ] **After Phase 2 verified:** Update version (e.g. 1.1.0) + changelog in version.json

---

## Phase 3 — Integrate Load Calc Pro

- [ ] 3.1 — Add ROOT/PREFIX to Pro; **audit every $/$$ call before proceeding** (list each, confirm which need document scope)
- [ ] 3.2 — Fix explicit document bypasses (filter-notice, toast, export dialog, initHelpPopovers)
- [ ] 3.3 — Prefix Pro element IDs (load-pro-*), update all lookups
- [ ] 3.4 — Prefix Pro toast container
- [ ] 3.5 — Namespace Pro data (LoadCalcProData.equipment)
- [ ] 3.6 — Scope Pro CSS under .load-pro-calc; move :root vars into scope
- [ ] **Phase 3 verification:** Basic + Pro both work; switch between them; no state corruption; help/guide scoped
- [ ] **After Phase 3 verified:** Update version + changelog

---

## Phase 4 — Integrate Consumables

- [ ] 4.1 — Namespace Consumables data (ConsumablesData.wardItems / icuItems)
- [ ] 4.2 — Add ROOT/PREFIX to Consumables; replace document calls with ROOT-scoped
- [ ] 4.3 — Scope Consumables CSS under .cons-calc
- [ ] 4.4 — Prefix Consumables toast container
- [ ] **Phase 4 verification:** Basic, Pro, Consumables all functional; Ward/ICU list, save/load, export, print
- [ ] **After Phase 4 verified:** Update version + changelog

---

## Phase 5 — Integrate Medications

- [ ] 5.1 — Namespace Medications data (MedicationsData.wardItems / icuItems)
- [ ] 5.2 — Add ROOT/PREFIX to Medications
- [ ] 5.3 — Prefix all Medications element IDs (meds-*)
- [ ] 5.4 — Fix Medications print (window.print() instead of window.open())
- [ ] 5.5 — Scope Medications CSS under .meds-calc; fix focus-visible
- [ ] **Phase 5 verification:** All four panels work; Meds/Consumables no naming collisions
- [ ] **After Phase 5 verified:** Update version + changelog

---

## Phase 6 — Integrate Water

- [ ] 6.1 — Namespace Water data (WaterData.defaults)
- [ ] 6.2 — Add ROOT/PREFIX to Water; prefix generic IDs (water-days, water-beds, etc.)
- [ ] 6.3 — Scope Water CSS under .water-calc
- [ ] **Phase 6 verification:** All five panels functional; full user journey per calc; zero console errors
- [ ] **After Phase 6 verified:** Update version + changelog

---

## Phase 7 — Logic bug fixes

- [ ] 7.1 — Suite-wide: clearAutosavedState() resets live UI (all five calcs)
- [ ] 7.2 — Suite-wide: Wire calcs to ShellAPI.showToast (**decide: real toast UI or console fallback**); add notify() fallback for standalone
- [ ] 7.3 — Consumables: saveData() persist deploymentDays, deploymentBeds
- [ ] 7.4 — Consumables: listType resolution (loadSelectedScenario, onImportFileSelected)
- [ ] 7.5 — Medications: saveData() persist deploymentDays, deploymentBeds
- [ ] 7.6 — Medications: active list button on scenario load
- [ ] 7.7 — Medications: empty state (remove early return in calculateAndDisplay)
- [ ] 7.8 — Medications: import file name field (baseName/displayName)
- [ ] 7.9 — Water: default values (0 → null/placeholder)
- [ ] 7.10 — Water: remove silent potable-rate default
- [ ] 7.11 — Water: applyState() without triggering validation on load
- [ ] 7.12 — Water: container capacity unit (store in litres)
- [ ] 7.13 — Water: scenario deduplication (baseName)
- [ ] 7.14 — Pro: explicit recalc() at end of loadSelectedScenario()
- [ ] 7.15 — Pro: clearSheet() / init() — single place for [data-reset-target] listeners
- [ ] **Phase 7 verification:** Bug fixes verified in shell; scenario save/load round-trips; empty states; Water units
- [ ] **After Phase 7 verified:** Update version + changelog

---

## Phase 8 — Print strategy

- [ ] 8.1 — Shell print CSS (hide nav; hide non-active panels; show active)
- [ ] 8.2 — Per-calc print CSS (unchanged, scoped)
- [ ] 8.3 — Verify Medications print in shell
- [ ] **Phase 8 verification:** Each calc prints correctly from shell; only active panel in output
- [ ] **After Phase 8 verified:** Update version + changelog

---

## Phase 9 — Polish (low priority, last)

- [ ] 9.1 — Pro: equipment list section heading
- [ ] 9.2 — Pro: saveScenario baseName
- [ ] 9.3 — Meds: help button on Deployment Parameters
- [ ] 9.4 — Water: remove inline style (mains-flow-section)
- [ ] 9.5 — Consumables: currentFileName on custom item add
- [ ] 9.6 — acknowledge() signature alignment (Basic vs Pro)
- [ ] 9.7 — Update READMEs (cons, meds — shell context; medications-data.js)
- [ ] **After Phase 9 + AmLODIPine resolved:** Final version bump + changelog (e.g. 1.9.0 or 2.0.0)

---

**Human decisions:**
- [ ] Shell toast (Phase 7.2): chosen real UI vs console fallback
- [ ] AmLODIPine duplicate (**at end of project**): domain owner confirms which rate to keep → remove the other entry
