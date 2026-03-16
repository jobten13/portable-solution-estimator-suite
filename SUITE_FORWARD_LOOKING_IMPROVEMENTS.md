# Suite Forward-Looking Improvements

**Date:** 2025-02-11  
**Scope:** Calcs Final (Load Calc Pro, Load Calc Basic, Consumables Calc, Medicines Calc, Water Calc)  
**Purpose:** New recommendations only — functionality, features, behaviour, tweaks, and fixes — **tiered by impact**.  
**Reference:** FHC Standardisation items are already implemented; see `FHC_STANDARDISATION_AUDIT.md`.

---

## High impact (fixes & material UX)

| # | Recommendation | Affects | Notes |
|---|----------------|--------|-------|
| H1 | **Scenario name & notes in UI** | Water, Consumables, Medicines | Load Pro and Load Basic expose scenario name + notes fields; Water/Consumables/Medicines only prompt on save or omit. Adding name/notes inputs (and persisting them in save/load/export) would align behaviour and improve traceability. |
| H2 | **Last-saved timestamp in footer** | Water, Load Basic, Medicines | Only Consumables and Load Pro show "Last autosaved: …" in the footer. Add equivalent footer element and update on save/load for Water, Load Basic, and Medicines so users see when state was last persisted. |
| H3 | **Search/filter indicator when totals are partial** | Load Pro, Load Basic | Totals are computed from visible rows only (`.equipment-row:not(.search-hidden)`). When the search box narrows the list, there is no on-screen note that totals reflect the filtered set. Add a short line (e.g. "Totals based on filtered list") near the summary when any row is hidden by search to avoid misinterpretation. |
| H4 | **Unify feedback mechanism** | All five | Load Pro uses `acknowledge(btnId, text)`; Load Basic uses `showToast` + `acknowledgeClick`; Water/Consumables/Medicines use `showFeedback(message, type)` in a dedicated div. For a future tabbed/single-shell experience, consider one pattern (e.g. toast + optional button acknowledge) and apply it consistently. |
| H5 | **Root container class for future shell** | All five | Root wrappers differ: Load Basic `.app`, Load Pro `.app-container`, Water/Consumables/Medicines `.container`. Standardising to a single class (e.g. `.app` or `.calc-app`) will simplify shared layout/CSS if calcs are later embedded in one tabbed app. |

---

## Medium impact (consistency & clarity)

| # | Recommendation | Affects | Notes |
|---|----------------|--------|-------|
| M1 | **Toolbar button label style** | Suite-wide | Consumables and Medicines use emoji in button labels (e.g. 📥 Load); Load Pro, Load Basic, and Water use text-only. Choose one convention (emoji vs no emoji) for a consistent suite feel. |
| M2 | **“Scenarios in this browser” disclaimer** | All with scenarios | Add a short footer or tooltip note that saved scenarios are stored in this browser/device only (e.g. "Scenarios saved locally in this browser"). Reduces confusion when moving between devices. |
| M3 | **Section/panel class names** | Medicines (and any future shared CSS) | Medicines uses `.scenarios-panel` / `.scenarios-heading`; others use `.scenario-section` / `.scenario-section-title` (or similar). Aligning names helps if shared styles are introduced later. |
| M4 | **Export/import prominence** | Consumables, Medicines, Water | For thumb-drive / offline workflows, making "Export scenario" and "Import" more visible (e.g. grouping with Save/Load or a small "Back up / restore" label) could improve discoverability. |
| M5 | **Version or build identifier** | All five | No version string in UI or HTML. Adding a small version label (e.g. in footer or meta) would help when users share or compare files across versions. |

---

## Polish (tweaks & accessibility)

| # | Recommendation | Affects | Notes |
|---|----------------|--------|-------|
| P1 | **Scenario & sort controls aria-labels** | All five | Ensure every scenario dropdown and sort select has an `aria-label` (e.g. "Choose scenario", "Sort inventory") where not already present for screen readers. |
| P2 | **Print output includes scenario name/notes** | Load Pro, Load Basic, Consumables, Medicines, Water | Where scenario name/notes exist, include them on the printed page (e.g. in a header or footer block) so printed sheets are self-describing. |
| P3 | **Water Calc footer** | Water | Water has no footer block; adding a simple footer (e.g. for last-saved and/or "Scenarios stored in this browser") would align with other calcs and support H2. |
| P4 | **Placeholder consistency** | All five | Some number inputs use `placeholder="0"`, others omit. Standardising placeholders for numeric fields (and any hint text) improves scanability. |
| P5 | **Error state for invalid import** | All with import | When import fails, ensure the same feedback type is used (e.g. `error`) and that the file input is cleared so the user can retry with another file without confusion. |
| P6 | **Maybe: category table density match (Basic -> Pro)** | Load Calc Basic | Optional UX polish: align Basic category/table inner spacing (row/header paddings and compactness) to Pro so both load calculators share the same visual density. Defer unless users report readability or scan-speed issues. |

---

## Summary

- **High:** 5 items — scenario name/notes parity, last-saved timestamp, search/filter indicator, unified feedback, root container class.  
- **Medium:** 5 items — button label style, browser-storage disclaimer, section class names, export/import prominence, version identifier.  
- **Polish:** 5 items — aria-labels, print scenario info, Water footer, placeholder consistency, import error/clear behaviour.

Implement in order of impact (High → Medium → Polish) unless project priorities dictate otherwise.
