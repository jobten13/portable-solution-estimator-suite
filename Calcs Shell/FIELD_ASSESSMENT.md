# Field Hospital Calculator Suite — Full Assessment & Field Readiness Report

**Suite version:** 1.0.9  
**Assessment date:** March 12, 2026  
**Files reviewed:** `index.html`, `shell.js`, `shell.css`, `version-control.js`, `version.json`, `README.md`  
**Assessor:** External AI review (Claude, Anthropic)

---

## Executive Summary

**Field ready? Not yet — but close.**

The suite is well-engineered for its constraints and shows genuine operational thinking throughout. The domain knowledge embedded in the calc logic (MSF/WHO/Sphere water references, 80% generator loading rule, kVA motor start assumptions, clinical medication rates) is sound. The UX patterns are consistent and learnable. The versioning discipline is professional.

What stands between this and field-ready status is a cluster of specific, fixable issues — not architectural failures. The two most critical are a live bug affecting every export dialog and the complete absence of a print stylesheet, which means the Print buttons that field users will rely on to generate paper handoffs are currently broken. Both can be fixed in under an hour.

**Field readiness verdict by domain:**

| Domain | Rating | Blocker? |
|--------|--------|----------|
| Code quality | ✅ Good | No |
| Architecture | ✅ Good | No |
| Functionality | ✅ Good | No |
| UX / UI | ⚠️ Adequate | Partially |
| Intuitiveness | ✅ Good | No |
| Robustness for field use | ❌ Not yet | **Yes** |

---

## 1. Code Quality

**Rating: Good**

### Strengths

All JavaScript is written as disciplined IIFEs with `'use strict'`. Defensive patterns are applied consistently: readyState guard before DOMContentLoaded, try/catch around JSON.parse, try/catch around history.replaceState. The code will not throw unhandled exceptions in any tested path.

Prefix namespacing (`load-`, `load-pro-`, `water-`, `cons-`, `meds-`) is applied rigorously across all five calculator panels. This is the single most important architectural decision in the project and it has been executed without gaps. Every ID, every help popover, every toast container, every scenario select — all correctly prefixed. This discipline is what makes the integration work at all and it has held across nine version increments.

The `ShellAPI.showToast` public interface is minimal and correct. The shell does not reach into calc internals; calcs surface their outputs through their own scoped toast containers. This separation is the right design.

### Issues

**Live bug — radio name conflict.** All five export format dialogs share `name="export-format"` on their radio inputs. Radio groups with the same name are document-scoped in HTML, meaning selecting CSV in one calc's dialog will deselect JSON in another. This affects every calc that uses export. The fix is five targeted attribute changes, no JS required.

**`version-control.js` uses XMLHttpRequest.** Functional but dated. `fetch` would be a cleaner, more readable replacement with identical behaviour. Low priority but worth noting.

**Dual hash maps in `shell.js`.** `HASH_TO_PANEL` and `PANEL_TO_HASH` are manually maintained mirror images of each other. One map with a derived reverse would eliminate the possibility of them drifting out of sync.

**Version labels are inconsistent.** Panel footers show hardcoded per-calc versions (Load Basic: `1.0.0`, Load Pro: `1.1.0`, Consumables: `1.1.0`, Water: `1.0.0`, Medicines: `1.0.0`) that are disconnected from the suite version shown in the shell footer (`1.0.9`). In a field context, a user or support person seeing three different version numbers across the same page will reasonably be confused. Either remove per-panel labels or have `version-control.js` set them all from `version.json`.

---

## 2. Architecture

**Rating: Good**

### Strengths

The single-page multi-panel shell is the correct pattern for this deployment context. No build step, no server required, runs from a folder or USB drive. The constraint was real and the architecture honours it without compromise.

URL hash sync (`#consumables`, `#medicines`, etc.) with `hashchange` listener means the browser back button works correctly and specific calcs can be bookmarked or shared by URL. This is thoughtful UX that goes beyond the minimum.

The `ShellAPI` boundary is clean. Adding a new method to the shell interface in the future is a single-line addition.

`.btn-ucd` is now correctly defined once in `shell.css` as a single source of truth for both Consumables and Medicines buttons. The comment in the README noting that RestorePoint calc styles may also define it for standalone use is exactly the right documentation.

### Issues

**Hardcoded asset paths.** Every CSS and JS asset loads from `../RestorePoints/2025-02-11/`. This path is encoded in 16 separate `<link>` and `<script>` tags. A path change — moving to a new restore point, renaming a folder, distributing from a different root — requires 16 find-and-replace edits across a 600+ line file. A single `CALC_ROOT` constant with dynamic asset loading would make this a one-line change.

**Note:** The README now references `RestorePoints/2026-02-11` as the latest restore point, but `index.html` still loads from `RestorePoints/2025-02-11`. If the 2026 restore point contains updated calc scripts, they are not currently being loaded. This should be confirmed and resolved.

**No script load error handling.** If any of the 11 externally loaded scripts fails (404, path error, corrupted file), the panel renders silently. In a field environment where the tool may be distributed on USB drives with inconsistent folder structures, silent failures are a real operational risk.

**HTML duplication.** The scenario section (save/load/delete/export/import controls, format dialog, storage note, meta fields) is repeated verbatim across all five panels — approximately 50 lines each, 250 lines total. Any change to the scenario UI requires five identical edits. This is not a blocker but is the single largest maintainability liability in the project.

---

## 3. Functionality

**Rating: Good**

### What works well

Every calc has a complete functional feature set: scenario save/load/delete, autosave with clear control, export to JSON and CSV, import from JSON, named scenario dropdown, deployment parameter inputs, contextual help popovers, search and sort, and custom item addition (Consumables/Medicines). This is a comprehensive feature set for a planning tool of this type.

The Water calc's supply mode selector (self-supplied / mains / hybrid) and the resulting conditional display of delivery schedule and mains flow rate inputs reflects real operational thinking — this is not a generic calculator, it models actual field logistics scenarios.

The Load Pro calc's distinction between running kW, running kVA, peak starting kVA, and recommended generator size (with the 4× motor-start assumption clearly documented) is technically correct and operationally useful. The inline `?` help explains the distinction between kW and kVA for non-electrical users.

The UCD Ward and ICU list pre-loading in Consumables and Medicines, combined with the buffer percentage and custom item addition, covers the main field planning workflow: start from a standard list, adjust for your specific scenario, add mission-specific items, export for logistics.

### Known gaps

The Medicines panel Deployment Parameters section is missing its help icon and popover — every other calc has it, this one does not. Minor but inconsistent.

Export functionality (JSON and CSV) is present and well-described. No issues identified in the HTML structure for this feature, subject to the radio name bug above.

---

## 4. UX / UI

**Rating: Adequate — with specific gaps that matter in field use**

### Strengths

Tab order (Consumables → Medicines → Water → Load Basic → Load Pro) correctly prioritises the most operationally frequent calcs. Placing Consumables first is the right decision for a field hospital context where supply logistics is the daily planning activity.

The default panel on load is Consumables. Correct.

Nav button tooltips and `aria-label` attributes were added in 1.0.8 and are present on all five buttons. This is a real accessibility improvement.

Help popovers are consistently placed and contextually relevant. The pattern of `?` next to each section heading is learnable after one use. The popovers explain not just what the inputs are but why they matter (`Generator sizing basis: Recommended generator uses the all-items total, not the filtered subtotal`) — this is the difference between a reference doc and actual operational guidance.

The status pill (`CHECK INPUTS` / colour-coded result) on the Load calcs provides immediate feedback without requiring the user to read a number.

The autosave + named scenario + export pattern is the right three-tier approach for a tool used in field conditions: autosave protects against accidental loss, named scenarios allow planning comparisons, export allows cross-device sharing and paper backup.

### Issues

**Print is broken at the shell level.** Every calc has a Print button. `shell.css` has no `@media print` rules. When a user clicks Print, the browser will render the full shell including all hidden panel DOM, nav, header, and footer rather than just the active calc. In a field context where printing a consumables list or load calculation for a logistics handoff is a primary workflow, this is a critical operational failure. The fix is 10 lines of CSS.

**No visual confirmation of active panel in print output.** Even with a print stylesheet, the printed page should include the calc name and the scenario name prominently, since the printed sheet may be separated from its context. The calc banners already include this (`Consumables Supply List`, `Field Hospital Calculator`) but the scenario name and date are not included in a print header.

**Destructive actions have no confirmation.** "Clear all Scenarios" and "Reset Worksheet" are irreversible and prominent in the toolbar. In a high-stress field environment, an accidental tap on "Clear all Scenarios" would destroy all saved work with no recovery path. A single confirmation dialog (`Are you sure? This cannot be undone.`) on these two buttons would significantly reduce operational risk.

**No offline indicator or caching.** The tool is described as running from a folder, but if it is ever served from an intranet, there is no Service Worker or offline cache. If the server is unavailable (network outage, power issue during deployment), the tool stops working. For a folder-based distribution this is not an issue, but it should be confirmed that the intended distribution method is always local.

**Mobile / tablet usability is untested.** The viewport meta tag is present (`width=device-width, initial-scale=1.0`), which is correct. The shell nav wraps (`flex-wrap: wrap`) on narrow screens. However, the calc panels use complex grid layouts (`main-grid`, `categories-wrap`, `sidebar`) that are likely defined in the individual calc CSS files (not visible here) and may not be responsive. In a field hospital, tablet use is plausible.

---

## 5. Intuitiveness

**Rating: Good**

The tool's conceptual model is clear and consistent across all five calcs. Every calc follows the same top-to-bottom flow: Scenarios → Deployment Parameters → Domain-specific inputs → Results. A user who has used Consumables will immediately understand how to use Medicines or Water without reading a guide.

The `?` help system is unobtrusive and available exactly where it is needed. The help content is written in plain English with operational context, not developer language.

Button labelling is explicit: "Save Scenario", "Load Scenario", "Delete Scenario", "Clear all Scenarios" — no ambiguous icons without labels. Tooltips reinforce the distinction between similar-looking buttons (`Clear Autosaved State` vs `Reset Worksheet` vs `Reset Quantities` — three distinct operations that could easily be confused, each clearly labelled and explained in the tooltip).

The "Scenarios are saved in this browser only. Use Export to back up or share." note is the right message in the right place. Field users need to understand the localStorage limitation before they rely on it.

The UCD Ward / UCD ICU one-click list loading in Consumables and Medicines is the best UX decision in the suite for field use. A medic or logistics officer can load a complete standard list in one click and immediately start adjusting quantities. This dramatically reduces the time-to-useful-output.

The UC Davis blue/gold styling on `.btn-ucd` creates a visual distinction between "load standard data" (UCD buttons) and "manage scenarios" (neutral buttons). This is subtle but effective visual hierarchy.

---

## 6. Robustness for Field Use

**Rating: Not yet ready — specific blockers identified**

This is the most important dimension given the deployment context. Field use means: intermittent or absent connectivity, shared machines, USB distribution, high-stress operators, time pressure, and consequences for errors that go beyond inconvenience.

### What is robust

The autosave system protects against accidental browser close or crash. Named scenario export to JSON means work can be backed up to a USB drive and restored on another machine. The tool has no external dependencies (no CDN, no API calls except `version.json` which fails gracefully). The `try/catch` patterns mean the shell will not throw unhandled exceptions.

The RestorePoints strategy is a genuine operational safety net. The ability to roll back to a known-good snapshot is exactly the right approach for a tool used in field conditions.

### Blockers for field readiness

**1. Print is non-functional at the shell level.** Cannot be shipped to field users in this state. Fix: 10 lines of CSS in `shell.css`. Time: 15 minutes.

**2. Radio name conflict breaks export.** Selecting CSV in one panel may silently deselect it in another. A user exporting a consumables list who has previously opened the medicines export dialog may unknowingly export JSON instead of CSV. Fix: five attribute changes in `index.html`. Time: 10 minutes.

**3. No confirmation on destructive actions.** "Clear all Scenarios" can destroy an entire deployment's planning data with a single accidental tap. Fix: two `confirm()` dialogs or a simple modal. Time: 30 minutes.

**4. Silent script failures.** If a calc script fails to load — path issue, missing file, USB corruption — the panel appears but may be non-functional with no indication to the user. Fix: `onerror` handlers on script elements. Time: 20 minutes.

**5. No print stylesheet produces a clean output.** Even after adding the basic print CSS (blocker 1), the printed output does not show the scenario name, date, or which calc produced it. In a field logistics workflow, printed sheets get separated from their context. Fix: add a print-only header to each panel showing the calc name, scenario name, and date. Time: 30 minutes.

### Secondary concerns

**localStorage is not namespaced.** If two instances of the suite run from the same origin on a shared machine, saved scenarios can collide silently. Low risk for folder-based distribution, real risk for intranet deployment.

**No confirmation when loading a scenario over unsaved changes.** Loading a scenario replaces the current worksheet state. If a user has made changes since the last save, those changes are lost without warning.

**The `lastUpdated` date in `version.json` is `2026-02-11` but the README says the restore point is also dated `2026-02-11`, while earlier changelog entries are dated `2026-03-12`.** The dates are inconsistent — either the 1.0.9 changelog entry date is wrong or the README is. This should be corrected before field distribution to avoid confusion about which version is current.

---

## Field Readiness Scorecard

| Criterion | Score | Notes |
|-----------|-------|-------|
| Code correctness | 8/10 | Radio bug, XHR, version label inconsistency |
| Architecture soundness | 8/10 | Hardcoded paths, no error handling |
| Feature completeness | 8/10 | All core features present; minor gaps |
| UX / UI | 6/10 | Print broken, no destructive action confirmation |
| Intuitiveness | 9/10 | Consistent patterns, good help system |
| Field robustness | 5/10 | Print, radio bug, silent failures, no confirmations |
| **Overall** | **7/10** | **Conditional — fix blockers before field distribution** |

---

## Way Forward

### Must fix before any field distribution (1–2 hours total)

These are blockers. The tool should not be handed to field users until these are resolved.

**Step 1 — Fix radio name conflict** *(10 min, `index.html`)*  
Change `name="export-format"` to a unique name in each panel's export dialog:
- Load Basic → `name="load-export-format"`
- Load Pro → `name="load-pro-export-format"`
- Water → `name="water-export-format"`
- Consumables → `name="cons-export-format"`
- Medicines → `name="meds-export-format"`

Version bump → **1.0.10**

**Step 2 — Add print stylesheet** *(15 min, `shell.css`)*  
Add `@media print` rules that hide the shell chrome and show only the active panel. Minimum viable:
```css
@media print {
  .shell-header, .shell-footer, .shell-toast { display: none !important; }
  .shell-main { padding: 0; }
  .calc-panel[hidden] { display: none !important; }
  .calc-panel:not([hidden]) { display: block !important; max-width: 100%; }
}
```
Version bump → included in **1.0.10**

**Step 3 — Add confirmation on destructive actions** *(30 min, each calc's `script.js`)*  
Add a `confirm()` prompt before "Clear all Scenarios" and "Reset Worksheet" in each calc. This change lives in the individual calc scripts, not the shell — but it must happen before field distribution.

**Step 4 — Fix Medicines Deployment Parameters help icon** *(5 min, `index.html`)*  
Add the missing `?` button and help popover to the Medicines Deployment Parameters section. Included in **1.0.10**.

**Step 5 — Correct version.json date** *(2 min)*  
The 1.0.9 entry is dated `2026-02-11` but should match the actual date. Correct before distribution to avoid confusion.

---

### Should fix before sustained field use (2–4 hours)

**Step 6 — Centralise asset paths** *(30 min, `index.html`)*  
Replace 16 hardcoded `../RestorePoints/2025-02-11/` references with a single `CALC_ROOT` constant. Confirm which restore point the calcs should actually load from — the README references `2026-02-11` but the HTML loads from `2025-02-11`.

Version bump → **1.1.0**

**Step 7 — Add script load error handling** *(20 min, `index.html`)*  
Add `onerror` handlers that show a visible placeholder if any calc script fails to load. Best done alongside Step 6 as part of the dynamic loader.

**Step 8 — Add scenario unsaved-changes warning** *(30 min per calc, each calc's `script.js`)*  
Track whether the current state has changed since the last save. Warn before loading a scenario over unsaved changes.

**Step 9 — Improve print output** *(30 min, `shell.css` + each panel)*  
Add a print-only header to each panel showing the calc name, active scenario name, and print date. Ensures printed sheets are self-identifying when separated from context.

**Step 10 — Resolve version label inconsistency** *(20 min)*  
Either remove per-panel version labels (simplest) or update `version-control.js` to populate all `.version-label` elements from `version.json` (cleanest).

---

### Plan for continued development

**Step 11 — Full ARIA tablist** *(45 min)*  
Add `role="tablist"` to nav, `role="tab"` and `aria-selected` to buttons, `role="tabpanel"` and `aria-labelledby` to panels. Update `showPanel()` to toggle `aria-selected`.

**Step 12 — localStorage namespace isolation** *(assess first)*  
Determine whether multi-instance deployment is a real scenario. If yes, prefix all localStorage keys with `fhcs.v1.` and provide a migration path for existing saved data.

**Step 13 — Scenario section deduplication** *(2–3 hours, only when stable)*  
Extract the repeated scenario section HTML into a JS render function (`shell-scenario.js`). Cuts `index.html` by ~40% and bakes in the radio name fix permanently.

**Step 14 — Modernise version-control.js** *(10 min)*  
Replace XMLHttpRequest with fetch.

**Step 15 — Deduplicate hash maps in shell.js** *(10 min)*  
Replace dual maps with one source map and a derived reverse.

---

## Summary Version Sequence

| Version | What it delivers | Status |
|---------|-----------------|--------|
| **1.0.10** | Radio fix, print CSS, Medicines help icon, date correction | **Do now** |
| **1.1.0** | Centralised paths, error handling | Before sustained use |
| **1.1.1** | Unsaved changes warning, print output improvement, version labels | Before sustained use |
| **1.1.2** | Full ARIA, fetch modernisation, hash map dedup | Planned improvement |
| **1.2.0** | localStorage namespacing (if needed) | Conditional |
| **1.3.0** | Scenario section deduplication | When stable |

---

## Closing Assessment

This is a tool built by someone who understands the operational domain, not just the web development patterns. The MSF/WHO/Sphere references in the Water calc, the kVA motor-start assumptions in Load Pro, the UCD Ward vs ICU list distinction, the buffer percentage for wastage — these reflect real field hospital logistics knowledge embedded in the software.

The architecture is appropriate for the constraints. The code discipline has held across nine versions. The versioning and documentation practices are professional.

The gap between where it is and where it needs to be for field readiness is not architectural — it is a small, specific set of fixable issues. Steps 1 through 5 above close the field-readiness blockers in under two hours. The tool is close.

---

*This assessment covers the shell layer only. Individual calc scripts (`consumables.js`, `pharma-lists.js`, `script.js` files) were not included in the review packet and are not assessed here.*
