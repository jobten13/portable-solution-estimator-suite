# Field Hospital Calculator Suite – Shell

Single app shell for the five calculators: Consumables, Pharmaceuticals, Water, Load Basic, Load Pro (tab order left to right).

**This README and `version.json` in this folder are updated as we move through the integration process.** When a calc is integrated or a notable change is made, update the changelog in **`version.json`**. Suite version is shown in each panel footer (format: suite name · **v**_major.minor.patch_). **Do not** paste the current version number here — it lives only in **`version.json`** (see **[Version control](#version-control)**).

---

## Integration status (progress)

| Calc | Status | Notes |
|------|--------|--------|
| Load Basic | **Integrated** | HTML in panel, load- prefixed IDs; Basic CSS/JS linked; script scoped (ROOT, toast, help, export, guide). |
| Load Pro | **Integrated** | HTML in panel, load-pro- prefixed IDs; ROOT/PREFIX, g(), ROOT_OR_DOC; toast load-pro-toast-container; help popovers and guide modal scoped; Pro styles.css, equipment-data.js, script.js linked. |
| Water | **Integrated** | HTML in panel, water- prefixed IDs; Water CSS/JS + water-data.js linked; script has ROOT, PREFIX, g() prefix-aware; toast (water-toast-container), help, export, unit labels scoped to ROOT. |
| Consumables | **Integrated** | HTML in panel, cons- IDs throughout; ROOT + g() scoped when in shell; help popovers cons-help-popover-*, toast cons-toast-container; consumables-lists.js + consumables.js linked. |
| Pharmaceuticals | **Integrated** | HTML in panel, meds- prefixed IDs; ROOT/PREFIX, g() prefix-aware; help popovers meds-help-popover-*, toast meds-toast-container; Medicines styles.css, medications-data.js, script.js linked. |

---

## Contents

- **index.html** – Shell layout: header, nav tabs, five panels, footer, shell toast.
- **shell.js** – Panel switching; URL hash sync (`#consumables`, `#medicines`, `#water`, `#load-basic`, `#load-pro`); default panel Consumables.
- **shell.css** – Shell-only styles (header, nav, panels, footer, toast). Includes shared `.btn-ucd` (UC Davis blue/gold) for Consumables and Pharmaceuticals. Calc styles are loaded separately and scoped per panel.
- **version.json** – Suite version and changelog (see [Version control](#version-control)).
- **version-control.js** – Loads `version.json` and updates `meta[name="suite-version"]` and all `[data-suite-version]` elements.

## How to run

Open **Portable-Solution-Estimator-Suite/index.html** in Chrome or Edge (or use **`0_START_HERE_Click_to_Open_Calculator.html`** at the suite root). Use the nav buttons to switch between calculators. The URL hash updates so you can bookmark a specific calc.

**Operator note — three preservation paths:** Toolbar **Restore Autosave** (grey; restores the browser recovery slot for the current sheet) with **Autosaved: M/D h:mm AM/PM** when a timestamp exists, **Save / Load Scenario** (named list in this browser), and **Export / Import** (files on disk — export does not add a scenario row by itself). See **`../README.md`** and **`../_archive/PROJECT_TRACKER.md`** (*Suite concepts*).

## Version control

- **Display:** The suite name and version are shown in each calculator panel footer in the shell.
- **Source of truth:** **`version.json`** in this folder holds:
  - `suiteName` – product name string.
  - `version` – current suite version string (semver).
  - `lastUpdated` – ISO date of last change.
  - `changelog` – array of `{ version, date, changes }` entries (newest first).
- **Bump a release:** Edit **`version.json`**, or run **`create-version.ps1`** in this folder. No build step is required.
- **Full procedure, semver policy, testers, and `file://` note:** **`../VERSIONING.md`**.

## Integration

Progress is summarized in [Integration status](#integration-status-progress) above. Panel IDs and scoping contracts are documented in this README and in **`../README.md`**.

## Panel IDs (contract)

- `#panel-load-calc` – Load Calc Basic
- `#panel-load-pro` – Load Calc Pro  
- `#panel-water` – Water
- `#panel-consumables` – Consumables
- `#panel-medications` – Pharmaceuticals

Only one panel is visible at a time. Each panel has a class for CSS scoping (e.g. `.load-basic-calc`, `.load-pro-calc`).

## UCD list data (discrete scripts)

- **Consumables** Ward/ICU buttons (“Ward Consumables”, “ICU Consumables”) use **Consumables Calc/consumables-lists.js** only (`UCD_WARD_ITEMS`, `UCD_ICU_ITEMS`).
- **Pharmaceuticals** Ward/ICU buttons (“Ward Meds”, “ICU Meds”) use **Medicines Calc/medications-data.js** only (`PHARMA_ITEMS`, `PHARMA_ITEMS_SECONDARY`).
- Each calc loads its own list script; there is no shared list file between Consumables and Pharmaceuticals.
- UCD list buttons are styled in **UC Davis blue/gold** via the `.btn-ucd` class. In the shell, `.btn-ucd` is defined once in **shell.css** (shared by Consumables and Pharmaceuticals).

## Review packet (for external AI review)

If you need to share a minimal set of files with another AI for assessment, see the `Review_Packet/` (removed) folder at the project root. It contains the shell + spec + contract docs and a full “Load Calc Pro” sample.
