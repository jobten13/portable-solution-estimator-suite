# Field Hospital Calculator Suite — Pre-Deployment Sprint

**Suite version at start:** 1.0.9  
**Target:** Field-ready distribution  
**Timeline:** 2 days  
**Date:** March 12, 2026

---

## The Principle

Fix what will hurt someone in the field first. Leave what won't until after return.

---

## Today — The Two Blockers
**Time: 25 minutes**  
**These go in now regardless of anything else.**

### Fix 1 — Radio name conflict
**File:** `index.html`  
**Time:** 10 minutes

All five export dialogs share `name="export-format"`. Radio groups are document-scoped — selecting CSV in one calc silently deselects it in another. Every export is at risk.

Find and replace in each panel's two radio inputs:

| Panel | Change to |
|-------|-----------|
| Load Basic | `name="load-export-format"` |
| Load Pro | `name="load-pro-export-format"` |
| Water | `name="water-export-format"` |
| Consumables | `name="cons-export-format"` |
| Medicines | `name="meds-export-format"` |

No JS changes required. Test one export per calc after.

### Fix 2 — Print stylesheet
**File:** `shell.css`  
**Time:** 15 minutes

Every calc has a Print button. There are no `@media print` rules in `shell.css`. Printing currently outputs the full shell — nav, header, all hidden panels — not the active calc. Paper handoffs are broken.

Add to the bottom of `shell.css`:

```css
@media print {
  .shell-header,
  .shell-footer,
  .shell-toast { display: none !important; }

  .shell-main { padding: 0; }

  .calc-panel[hidden] { display: none !important; }

  .calc-panel:not([hidden]) {
    display: block !important;
    max-width: 100%;
  }
}
```

Test by opening each calc, hitting Print, and verifying only the active calc renders.

### After Today

- ✅ Bump version → **1.0.10**
- ✅ Update `version.json` `lastUpdated` to today's date
- ✅ Create restore point `RestorePoints/2026-03-12-pre-deploy`

---

## Tomorrow — Operational Safety
**Time: ~90 minutes**  
**These are the ones that matter when someone is tired and moving fast.**

### Fix 3 — Destructive action confirmations
**Files:** Each calc's `script.js` / `consumables.js`  
**Time:** 30 minutes

"Clear all Scenarios" and "Reset Worksheet" are irreversible and prominent. One accidental tap in the field destroys a deployment's worth of planning data with no recovery. No confirmation exists.

Add before each destructive action executes:

```javascript
// Clear all Scenarios
if (!confirm('Delete all saved scenarios? This cannot be undone.')) return;

// Reset Worksheet
if (!confirm('Reset the worksheet? All current inputs will be cleared.')) return;
```

Apply to all five calcs. The buttons already have descriptive `title` tooltips — the confirm text should match that tone: clear, specific, no jargon.

### Fix 4 — Unsaved changes warning on scenario load
**Files:** Each calc's `script.js` / `consumables.js`  
**Time:** 30 minutes

Loading a scenario silently replaces the current worksheet. If a user has made changes since their last save, those changes are lost without warning. Under field pressure this will happen.

Each calc needs a dirty-state flag:

```javascript
// Set when any input changes
let isDirty = false;
// inputs fire: isDirty = true
// after save or load: isDirty = false

// Before loading a scenario:
if (isDirty) {
  if (!confirm('You have unsaved changes. Load scenario anyway?')) return;
}
```

The autosave system already tracks state — hook into the same pattern the calc uses for autosave detection.

### Fix 5 — Print output identification
**Files:** `shell.css`, each panel in `index.html`  
**Time:** 30 minutes

A printed consumables list or load calculation is anonymous once it leaves the desk. In a field hospital with multiple concurrent planning sessions, sheets get separated from context. The printed page needs to identify itself.

Add a print-only header to each panel showing the calc name, scenario name, and print date. In `shell.css`:

```css
@media print {
  .print-header { display: block !important; }
}

.print-header {
  display: none;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #022851;
  font-size: 0.9rem;
  color: #333;
}
```

In each panel, add immediately after the opening panel `<div>`:

```html
<!-- Load Basic example -->
<div class="print-header">
  <strong>Field Hospital Calculator Suite — Load Calculator Basic</strong><br>
  Scenario: <span class="print-scenario-name"></span> &nbsp;|&nbsp;
  Printed: <span class="print-date"></span>
</div>
```

Populate via JS before print (use `window.onbeforeprint` or inject on Print button click):

```javascript
document.querySelector('.print-scenario-name').textContent =
  document.getElementById('load-scenario-name').value || '(unnamed)';
document.querySelector('.print-date').textContent =
  new Date().toLocaleDateString();
```

### After Tomorrow

- ✅ Bump version → **1.1.0**
- ✅ Update `version.json` `lastUpdated`
- ✅ Create restore point `RestorePoints/2026-03-13-field-ready`
- ✅ Distribute

---

## Final Pass — Robustness
**Time: ~60 minutes**  
**If time permits before distribution. If not, first thing after return.**

### Fix 6 — Script load error handling
**File:** `index.html`  
**Time:** 20 minutes

If any calc script fails to load — path issue, missing file, USB corruption — the panel renders silently broken. The user has no indication anything is wrong.

Add `onerror` to each script tag, or handle in the dynamic loader (see Fix 7):

```javascript
s.onerror = function () {
  var panel = document.getElementById(panelId);
  if (panel) {
    panel.innerHTML =
      '<div class="shell-panel-placeholder">' +
      '⚠️ This calculator failed to load. ' +
      'Check that all files are present and try again.' +
      '</div>';
  }
};
```

### Fix 7 — Centralise asset paths
**File:** `index.html`  
**Time:** 30 minutes

Sixteen `<link>` and `<script>` tags hardcode `../RestorePoints/2025-02-11/`. A path change requires 16 edits across a 600-line file.

**Also resolve:** the README references `RestorePoints/2026-02-11` as the latest restore point but `index.html` still loads from `2025-02-11`. Confirm which restore point each calc should load from before implementing.

Replace all hardcoded paths with a single constant:

```javascript
// ── Update this one line when the RestorePoints path changes ──
window.CALC_ROOT = '../RestorePoints/2025-02-11';
```

Then load all assets dynamically from that constant. Path changes become a one-line edit.

### Fix 8 — Clean up version metadata
**File:** `version.json`  
**Time:** 5 minutes

The 1.0.9 changelog entry is dated `2026-02-11` but was clearly written in March 2026. Correct the date before distribution to keep records clean and auditable.

### After Final Pass

- ✅ Bump version → **1.1.1**
- ✅ Update `version.json` `lastUpdated`
- ✅ Final restore point `RestorePoints/2026-03-13-v1.1.1`
- ✅ Distribute

---

## What to Leave Until After Return

These are real improvements. None of them affect a field user in the next 48 hours.

| Item | Why it can wait |
|------|----------------|
| Full ARIA tablist pattern | No field user is on a screen reader in this context |
| localStorage namespace isolation | Only matters if multi-instance on same origin |
| Scenario section deduplication | Maintainability only, no user impact |
| `fetch` modernisation in `version-control.js` | XHR works, just dated |
| Hash map deduplication in `shell.js` | Elegance only, no user impact |

---

## Distribution Checklist

Before handing to field users, verify:

- [ ] Export works correctly in all five calcs (JSON and CSV)
- [ ] Print renders cleanly in all five calcs — only the active panel, with scenario name and date
- [ ] "Clear all Scenarios" prompts for confirmation
- [ ] "Reset Worksheet" prompts for confirmation
- [ ] Loading a scenario over unsaved changes prompts for confirmation
- [ ] All files are present in the correct folder structure relative to `index.html`
- [ ] Tool opens correctly from the USB / local folder without a server
- [ ] Version footer shows `1.1.0` or `1.1.1`
- [ ] `version.json` dates are correct and current
- [ ] README `lastUpdated` reference matches the actual restore point

---

## Version Summary

| Version | Contents | When |
|---------|----------|------|
| **1.0.10** | Radio fix + print stylesheet | Today |
| **1.1.0** | Destructive confirmations + unsaved warning + print ID | Tomorrow |
| **1.1.1** | Error handling + path centralisation + metadata cleanup | Final pass |
| **1.2.0+** | ARIA, localStorage, deduplication | After return |

---

*For the full architectural assessment and long-term roadmap, see `FIELD_ASSESSMENT.md` and `ROADMAP.md`.*
