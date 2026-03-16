# Field Hospital Calculator Suite – Shell

Single app shell for the five calculators: Consumables, Medicines, Water, Load Basic, Load Pro (tab order left to right).

**This README and `version.json` are updated as we move through the integration process.** When a calc is integrated or a notable change is made, both files are updated. Latest restore point: **RestorePoints/2026-02-11** (suite v1.0.9).

---

## Integration status (progress)

| Calc | Status | Notes |
|------|--------|--------|
| Load Basic | **Integrated** | HTML in panel, load- prefixed IDs; Basic CSS/JS linked; script scoped (ROOT, toast, help, export, guide). |
| Load Pro | **Integrated** | HTML in panel, load-pro- prefixed IDs; ROOT/PREFIX, g(), ROOT_OR_DOC; toast load-pro-toast-container; help popovers and guide modal scoped; Pro styles.css, guide-content.js, equipment-data.js, script.js linked. |
| Water | **Integrated** | HTML in panel, water- prefixed IDs; Water CSS/JS + water-data.js linked; script has ROOT, PREFIX, g() prefix-aware; toast (water-toast-container), help, export, unit labels scoped to ROOT. |
| Consumables | **Integrated** | HTML in panel, cons- IDs throughout; ROOT + g() scoped when in shell; help popovers cons-help-popover-*, toast cons-toast-container; consumables-lists.js + consumables.js linked. |
| Medicines | **Integrated** | HTML in panel, meds- prefixed IDs; ROOT/PREFIX, g() prefix-aware; help popovers meds-help-popover-*, toast meds-toast-container; Medicines styles.css, pharma-lists.js, script.js linked. |

---

## Contents

- **index.html** – Shell layout: header, nav tabs, five panels, footer, shell toast.
- **shell.js** – Panel switching; URL hash sync (`#consumables`, `#medicines`, `#water`, `#load-basic`, `#load-pro`); default panel Consumables; `window.ShellAPI = { showToast }`.
- **shell.css** – Shell-only styles (header, nav, panels, footer, toast). Includes shared `.btn-ucd` (UC Davis blue/gold) for Consumables and Medicines. Calc styles are loaded separately and scoped per panel.
- **version.json** – Suite version and changelog (see [Version control](#version-control)).
- **version-control.js** – Loads `version.json` and sets the footer text to “Version X.Y.Z”.

## How to run

Open **index.html** in a browser from the folder that contains both **Calcs Shell** and **RestorePoints** (the project root), so relative paths to Load Calc Basic assets resolve. Use the nav to switch panels. The URL hash updates so you can bookmark or share a specific calc.

## Version control

- **Display:** The suite version is shown in the shell footer (e.g. “Version 1.0.9”). It is read from **version.json** when the page loads.
- **version.json** holds:
  - `version` – current version string (e.g. `"1.0.9"`).
  - `lastUpdated` – ISO date of last change.
  - `changelog` – array of `{ version, date, changes }` entries.
- To bump the version: edit **version.json** (update `version` and `lastUpdated`, and add a new `changelog` entry). No build step is required.
- For project-wide versioning and scripts (e.g. create-version.ps1), see **README-VERSIONING.md** in the project root.

## Integration

See **INTEGRATION_ASSESSMENT.md** in the project root for what each calc needs (ROOT/PREFIX, scoped IDs, toast container, CSS scoping). Progress is summarized in [Integration status](#integration-status-progress) above.

## Panel IDs (contract)

- `#panel-load-calc` – Load Calc Basic
- `#panel-load-pro` – Load Calc Pro  
- `#panel-water` – Water
- `#panel-consumables` – Consumables
- `#panel-medications` – Medicines

Only one panel is visible at a time. Each panel has a class for CSS scoping (e.g. `.load-basic-calc`, `.load-pro-calc`).

## UCD list data (discrete scripts)

- **Consumables** UCD buttons (“UCD Ward List”, “UCD ICU List”) use **Consumables Calc/consumables-lists.js** only (`UCD_WARD_ITEMS`, `UCD_ICU_ITEMS`).
- **Medicines** UCD buttons (“UCD Ward Meds”, “UCD ICU Meds”) use **Medicines Calc/pharma-lists.js** only (`PHARMA_ITEMS`, `PHARMA_ITEMS_SECONDARY`).
- Each calc loads its own list script; there is no shared list file between Consumables and Medicines.
- UCD list buttons are styled in **UC Davis blue/gold** via the `.btn-ucd` class. In the shell, `.btn-ucd` is defined once in **shell.css** (shared by Consumables and Medicines); RestorePoint calc styles may also define it for standalone use’s.

## Review packet (for external AI review)

If you need to share a minimal set of files with another AI for assessment, see the `Review_Packet/` folder at the project root. It contains the shell + spec + contract docs and a full “Load Calc Pro” sample.
