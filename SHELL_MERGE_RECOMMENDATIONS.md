# Shell Merge – Tiered Recommendations & Pre-Merge Upgrades

**Purpose:** Recommended actions to prepare all five calcs for merging into one shell. No implementation yet—planning only.  
**Restore points created:** 2025-02-11 for Consumables, Medicines, Water, Load Calc Basic, Load Calc Pro.

---

## Pre–shell-merge upgrades (by calc)

These are improvements to make **inside each calc** before or in parallel with shell work, so the shell merge is cleaner.

| Calc | Upgrade | Why |
|------|--------|-----|
| **Medicines** | Add a **consistent ID prefix** (e.g. `med-` or `pharma-`) for all elements the script touches, and use `g(id)` → `getElementById(prefix + id)`. | Consumables already uses `cons-`; Medicines uses raw IDs. In one shell, multiple calcs can’t share the same IDs (e.g. `scenario-select`, `print-btn`). Prefixing avoids clashes and matches Consumables’ pattern. |
| **Medicines** | Align **root container class** with others: use `.calc-app` (or the shell’s chosen class) instead of `.container`. | Load Pro / Consumables use `.calc-app`; Medicines and Water use `.container`. One shell will likely use one wrapper class for “calc view.” |
| **Water** | Align **root container class** with others (e.g. `.calc-app`). | Same as Medicines—consistency for shell layout. |
| **Load Calc Basic** | Already has **ROOT + PREFIX** when `#panel-load-calc` exists (`load-` prefix). Document that the shell must inject a wrapper with `id="panel-load-calc"` so IDs stay namespaced. | No change required if shell provides the panel; just document the contract. |
| **Load Calc Pro** | Introduce an optional **root/prefix** pattern (like Basic) so the shell can wrap Pro in a panel and all selectors are scoped. | Pro uses `$('#id')` without a prefix; in a shell, duplicate IDs (e.g. `scenario-select`) would clash. Either add a configurable root/prefix or ensure Pro’s IDs are unique (e.g. `load-pro-scenario-select`). |
| **All** | Ensure **toast container** and **last-saved** element IDs are unique per calc (e.g. `cons-toast-container`, `medicines-last-saved`). | Medicines/Water already use calc-specific IDs for last-saved; Consumables uses `cons-last-saved`. Load Basic/Pro use `toast-container` and their own last-saved IDs. One shared shell page may only have one `toast-container`—shell may own toasts and calcs call a shared API. |
| **Consumables / Medicines** | **Ward/ICU shared module** (optional but recommended): when building the shell, extract `listTypeFromFileName`, `getRateColumnLabel`, `getRatePlaceholder` (and constants like list names) into a small shared script so both calcs use one source of truth. | Reduces duplication and keeps labels/behavior identical. |

---

## Tier 1 – Prerequisites (do first)

| # | Action | Notes |
|---|--------|--------|
| 1 | **Document the shell contract** | One doc (or section in DESIGN_GOALS): how the shell loads a calc (iframe, div + script, or single SPA), what root element/ID the shell provides (e.g. `panel-load-calc`, `panel-medicines`), and how navigation/switching works. |
| 2 | **Unify root container and wrapper class** | Decide one wrapper class (e.g. `.calc-app`) and apply it to all five calcs’ root div so shell CSS/layout can target “the active calc” consistently. |
| 3 | **Ensure every calc has namespaced storage keys** | Confirm: Consumables `cons-*`, Medicines `fieldHospitalPharma*`, Water `fieldHospitalWater*`, Load Basic `generator-load-*`, Load Pro `loadCalcPro*`. No overlaps. Document in one place. |
| 4 | **Resolve ID clashes** | Either (a) give each calc a prefix for all interactive IDs (Medicines, Water, Load Pro if not already), or (b) have the shell load each calc in a separate document (iframe) so IDs don’t share a DOM. Decision drives the rest. |

---

## Tier 2 – Shared shell assets and patterns

| # | Action | Notes |
|---|--------|--------|
| 5 | **Create the shell app** | Single entry HTML (e.g. `index.html`) with shell layout, nav (tabs or sidebar) for the five calcs, and a content area where the active calc is shown. |
| 6 | **Shared styles** | One (or a small set of) CSS file(s) for shell: nav, layout, typography, and any shared components (toast, modals). Calcs can keep their own `styles.css` for calc-specific UI, or gradually migrate shared bits (e.g. buttons, help popovers) into shell CSS. |
| 7 | **Shared script pattern** | How does the shell load a calc? Options: (A) iframe per calc (each calc’s full HTML loaded; no ID clash; more isolation). (B) Single page: shell fetches/injects calc HTML fragment + runs calc JS with a “root” or “prefix” so selectors are scoped. (C) Single SPA: calcs as modules, shell mounts one at a time. Document choice and implement the minimal version. |
| 8 | **Ward/ICU shared module (Consumables + Medicines)** | Extract `listTypeFromFileName`, `getRateColumnLabel`, `getRatePlaceholder`, and list-name constants into a small shared script (e.g. `ward-icu-labels.js`) loaded by the shell or by both calc pages. Consumables and Medicines then use this module instead of their local copies. |
| 9 | **Toast and “last saved”** | Decide: (1) Shell owns one toast container and one “last saved” area; calcs call a shell API (e.g. `window.fieldHospitalToast?.(message, type)`). Or (2) Each calc keeps its own toast/last-saved but with unique IDs so only the active calc’s elements are visible. Implement the chosen approach. |

---

## Tier 3 – Consistency and UX in the shell

| # | Action | Notes |
|---|--------|--------|
| 10 | **Navigation and deep links** | If the shell uses URLs (e.g. `#water`, `#medicines`), ensure switching calc updates the URL and that reload or shared link opens the correct calc. |
| 11 | **Document title and focus** | When switching calcs, set `document.title` to the active calc (or shell + calc name). Optional: move focus to the active calc’s main heading or first control for accessibility. |
| 12 | **Version and “last saved” in shell** | If each calc has a version or “last saved” in the toolbar, decide whether the shell shows one global “last saved” (for the active calc) or each calc’s toolbar remains visible when that calc is active. |

---

## Tier 4 – PWA and polish (after shell works)

| # | Action | Notes |
|---|--------|--------|
| 13 | **Single manifest and service worker** | One `manifest.json` and one service worker for the whole app; no calc-specific manifests or workers. DESIGN_GOALS already states this. |
| 14 | **Offline and caching** | Service worker caches shell + active calc (and optionally other calcs). Strategy defined at shell level. |

---

## Summary

- **Restore points:** Created for all five calcs (2025-02-11).
- **Pre-merge upgrades:** Medicines (ID prefix + container class), Water (container class), Load Pro (optional root/prefix or unique IDs), all (toast/last-saved uniqueness or shell-owned API); optional shared Ward/ICU module for Consumables + Medicines.
- **Tier 1:** Shell contract, unified root class, namespaced storage, resolve ID clashes.
- **Tier 2:** Shell app, shared styles/script pattern, Ward/ICU module, toast/last-saved strategy.
- **Tier 3:** Nav, title/focus, version/last-saved in shell.
- **Tier 4:** PWA (manifest + service worker), offline/caching.

No implementation was done; this is the recommended plan only.
