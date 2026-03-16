# Calcs Final — Review of All Five Calculators

*Saved for later review. No code changes were made.*

Review dimensions: **Code quality/architecture**, **Functionality**, **UX/UI**, **Intuitiveness**, **Fitness for purpose**, and **Accessibility & standards**. For each category the **best** calculator is identified.

---

## 1. Code Quality / Architecture

| Calculator | Notes |
|------------|--------|
| **Load Calc Basic** | IIFE, strict mode, clear constants (`STORAGE_KEY`, `CONSTANTS`, `L_PER_GAL`). Equipment data is **inline** in `script.js` (~115 lines of EQUIPMENT), so data and logic are coupled. Helper pattern (`id()`, `$()`, `$$()` with optional ROOT/PREFIX). Validation and state (getState/applyState) are structured. Single large script (~965 lines). |
| **Load Calc Pro** | IIFE, strict mode. **Data separated**: `equipment-data.js` (111 lines). Same `$`/`$$` helpers. Validation (sidebar + equipment qty/kw/pf), recalc with peak kVA and motor logic. Clear separation of concerns; script ~909 lines. |
| **Water Calc** | IIFE, strict mode. **Config separated**: `water-data.js` (WATER_DEFAULTS). Single `g(id)` helper. Central `VALIDATION_RULES`, getState/applyState, mode helpers (supply/disposal). Well-commented; script ~727 lines. |
| **Consumables Calc** | IIFE, strict mode. **Heavy data separation**: `consumables-lists.js` (2,425 lines) + `consumables.js` (841). Uses `g(id)` with **`cons-` prefix** (`getElementById('cons-'+id)`). Validation only on days/beds/buffer. XLSX startup check. Duplicate “Scenarios are saved…” in HTML. |
| **Medicines Calc** | IIFE, strict mode. Mirrors Consumables pattern; `consumables-lists.js` is a small stub (6 lines). `g(id)` with **no** prefix. Same validation surface. Autosave keys, last-saved. Single main script ~750 lines. |

**Best in category: Load Calc Pro** — Clean separation of equipment data from logic, consistent helpers, validation on all critical inputs, and manageable script size.

---

## 2. Functionality

| Calculator | Notes |
|------------|--------|
| **Load Calc Basic** | Scenarios (save/load/delete/clear, import/export), sort (name/kW), search, generator + fuel sidebar, capacity check, fuel runtime, L/Gal. Reset qty vs full reset. **No** autosave. Scenario name/notes. |
| **Load Calc Pro** | Scenarios (full set), sort (name, kW, kVA peak), search, filter notice, kVA peak + motor start, capacity check, runtime, L/Gal. Add/delete custom rows. **No** autosave (by design). Scenario name/notes. |
| **Water Calc** | Scenarios (full set), L/Gal default, deployment + water use + **storage (containers)** + **supply/disposal mode** (self/mains/hybrid, sewer), mains flow check, 48h buffer recommendation. Validation on all inputs including mains. Reset to defaults. Help popovers. |
| **Consumables Calc** | Excel upload (Ward/ICU lists), scenarios (full set), deployment params, buffer, sort, search, UCD Ward/ICU buttons. **No** scenario name/notes in UI (name is in scenario meta but not clearly surfaced). XLSX from vendor. |
| **Medicines Calc** | Excel upload (pharma list), scenarios (full set), deployment params, buffer, sort, search. **No** scenario name/notes in scenario panel. Autosave + last-saved. CDN XLSX. |

**Best in category: Water Calc** — Broadest feature set for the domain: multiple supply/disposal modes, mains adequacy, buffer recommendation, validation everywhere, help popovers, and backward-compatible state.

---

## 3. UX/UI

| Calculator | Notes |
|------------|--------|
| **Load Calc Basic** | Suite banner, toolbar, scenario block, sort bar, search, main grid + sidebar cards. Consistent btn classes. Version in banner. Layout is clear. |
| **Load Calc Pro** | Same suite pattern; **table-note** (kW vs kVA, PF); **filter-notice** when search active. Sidebar with capacity/runtime. Version in footer. Slightly more polished. |
| **Water Calc** | Sections: deployment → water use (unit toggle) → storage → **supply & disposal** → results. Help icons and popovers on all major sections. Version in banner. Unit toggle, mains section show/hide. Result rows show/hide by mode. |
| **Consumables Calc** | Scenario block (name/notes first), deployment (help icon), inventory (help), sort, search. Footer disclaimer + last-saved + version. **Duplicate** storage note in HTML. No emoji on buttons. |
| **Medicines Calc** | Toolbar (Print, UCD, Upload, Clear), then scenarios, then deployment, then inventory. **Emoji** on buttons (Print, Upload, Clear, Save, Load, Delete). No help popovers. No scenario name/notes in panel. Uses `.container`; others use `.calc-app`. |

**Best in category: Water Calc** — Sectioned flow, contextual help everywhere, mode-based UI (mains vs containers), and consistent suite styling without duplication or emoji.

---

## 4. Intuitiveness

| Calculator | Notes |
|------------|--------|
| **Load Calc Basic** | “Sort equipment”, “Search equipment”, sidebar “Load Summary & Generator Sizing”. Scenario name/notes before load. Reset vs full reset is a bit technical but labeled. |
| **Load Calc Pro** | “Running kW… PF… Peak kVA” note; filter notice when list is filtered. Scenario name/notes, storage note. Add row / delete row clear. |
| **Water Calc** | “Supply & disposal mode” with plain-language options (self-supplied, mains, hybrid, sewer). Help popovers explain each block. “Enter deployment length and number of beds” when inputs missing. Mains “typical field supply” hint. |
| **Consumables Calc** | “UCD Ward List” / “UCD ICU List” assume domain knowledge. Scenario name/notes at top. Help on params and inventory. Duplicate storage note can confuse. |
| **Medicines Calc** | “UCD Medications List” same as above. Scenario panel is **actions only** (no name/notes), so “Save scenario” is less clear. Emoji aid recognition but are inconsistent with other calcs. |

**Best in category: Water Calc** — Mode choices and copy are task-focused; help is where users need it; empty-state and mains hints guide next steps.

---

## 5. Fitness for Purpose

| Calculator | Notes |
|------------|--------|
| **Load Calc Basic** | Fits “quick generator + fuel estimate” from fixed equipment list. 80% rule, fuel tiers, runtime. Good for field planning without custom equipment. |
| **Load Calc Pro** | Fits “detailed sizing with custom kit and motor start”. kVA peak, PF, add/remove rows. Better for engineers and variable equipment sets. |
| **Water Calc** | Fits “water planning across delivery, mains, hybrid, and sewer”. Per‑bed rates, containers, mains flow check, 48h buffer. Aligns with field + semi-fixed supply. |
| **Consumables Calc** | Fits “consumables list from Excel + scenarios”. Ward/ICU lists, buffer, days/beds. Depends on correct Excel format and vendor/XLSX for offline. |
| **Medicines Calc** | Same as Consumables for medications list. Autosave helps “work in progress”. CDN XLSX hurts offline; no scenario name/notes weakens multi-scenario use. |

**Best in category: Water Calc** — Covers the widest range of real-world situations (self-supplied, mains, hybrid, sewer) and documents assumptions (e.g. 16 h/day, 125% adequacy) without overcomplicating the UI.

---

## 6. Accessibility & Standards

| Calculator | Notes |
|------------|--------|
| **Load Calc Basic** | Some `aria-label` (e.g. scenario select, sort, search). No `role` on popovers. Version in banner. |
| **Load Calc Pro** | Same: aria-labels on select and search. Scenario storage note. No help popover `role`. Version in footer. |
| **Water Calc** | **Best**: `aria-label` on help buttons, `role="tooltip"` and `hidden` on help popovers. Unit toggle `role="group"` and `aria-label`. Section structure and labels support screen readers. |
| **Consumables Calc** | `aria-label` on help icons; help popovers with `role="tooltip"` and `hidden`. `aria-live="polite"` on last-saved. Duplicate storage note is redundant for AT. |
| **Medicines Calc** | Only one `aria-label` (sort). No help popovers. No `role` on tooltips. Version in banner. Weakest of the five. |

**Best in category: Water Calc** — Consistent use of `aria-label`, `role="tooltip"`, and `role="group"` where it matters; help and unit toggle are accessible.

---

## Summary: Best per Category

| Category | Best Calculator | Reason (short) |
|----------|-----------------|----------------|
| **Code quality/architecture** | **Load Calc Pro** | Data in separate file, clear validation and recalc, no data/logic mixing. |
| **Functionality** | **Water Calc** | Modes, mains check, validation, help, backward compatibility. |
| **UX/UI** | **Water Calc** | Sectioned flow, help everywhere, mode-based result UI, no duplication. |
| **Intuitiveness** | **Water Calc** | Plain-language modes and messages, contextual help, good empty states. |
| **Fitness for purpose** | **Water Calc** | Covers self-supplied, mains, hybrid, sewer; documented assumptions. |
| **Accessibility & standards** | **Water Calc** | aria-labels, tooltip roles, group role on unit toggle. |

**Overall:** Water Calc leads on five of six categories; Load Calc Pro leads on code/architecture. Load Calc Basic is solid and simple for “fixed list + generator + fuel.” Consumables Calc is strong on data separation and help but has duplicate copy and no scenario name/notes in the main flow. Medicines Calc is the weakest on accessibility, consistency (emoji, no help, no scenario name/notes in panel), and offline (CDN XLSX).

---

*Review completed without making any changes to calculator files.*
