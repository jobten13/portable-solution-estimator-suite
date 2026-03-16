# Cursor Instructions — Field Hospital Calculator Suite
# CSS Scoping + JS ID Fixes + Shell Path Fix
# Date: 2026-03-12
# SUPERSEDES all previous cursor instruction files — ignore any other instruction files

---

## CRITICAL RULES — READ BEFORE DOING ANYTHING

1. **NEVER touch anything inside `Backup and Restore points\`** — this folder is read-only
2. **NEVER modify any data files** (`equipment-data-basic.js`, `equipment-data.js`, `consumables-lists.js`, `medications-data.js`, `water-data.js`, `guide-content.js`)
3. **Do exactly one task at a time** — stop after each task and wait
4. **Do not rename any files**
5. **Only change what is explicitly listed in each task — nothing else**
6. **If you are unsure which file to edit, stop and ask**

---

## PROJECT ROOT

All work happens inside this exact folder:
```
Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\
```

---

## TASK 1 — Fix shell file references in `Calcs Shell\index.html`

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Calcs Shell\index.html`

**Part A — find these exact lines near the top (around lines 7–11):**
```html
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Load Calc Basic/styles.css">
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Load Calc Pro/styles.css">
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Water Calc/styles.css">
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Consumables Calc/styles.css">
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Medicines Calc/styles.css">
```

Replace with:
```html
  <link rel="stylesheet" href="../Load Calc Basic/styles.css">
  <link rel="stylesheet" href="../Load Calc Pro/styles.css">
  <link rel="stylesheet" href="../Water Calc/styles.css">
  <link rel="stylesheet" href="../Consumables Calc/styles.css">
  <link rel="stylesheet" href="../Medicines Calc/styles.css">
```

**Part B — find these exact lines near the bottom (around lines 1039–1049):**
```html
  <script src="../RestorePoints/2025-02-11/Load Calc Basic/guide-content.js"></script>
  <script src="../RestorePoints/2025-02-11/Load Calc Basic/script.js"></script>
  <script src="../RestorePoints/2025-02-11/Load Calc Pro/guide-content.js"></script>
  <script src="../RestorePoints/2025-02-11/Load Calc Pro/equipment-data.js"></script>
  <script src="../RestorePoints/2025-02-11/Load Calc Pro/script.js"></script>
  <script src="../RestorePoints/2025-02-11/Water Calc/water-data.js"></script>
  <script src="../RestorePoints/2025-02-11/Water Calc/script.js"></script>
  <script src="../RestorePoints/2025-02-11/Consumables Calc/consumables-lists.js"></script>
  <script src="../RestorePoints/2025-02-11/Consumables Calc/consumables.js"></script>
  <script src="../RestorePoints/2025-02-11/Medicines Calc/pharma-lists.js"></script>
  <script src="../RestorePoints/2025-02-11/Medicines Calc/script.js"></script>
```

Replace with:
```html
  <script src="../Load Calc Basic/guide-content.js"></script>
  <script src="../Load Calc Basic/equipment-data-basic.js"></script>
  <script src="../Load Calc Basic/script.js"></script>
  <script src="../Load Calc Pro/guide-content.js"></script>
  <script src="../Load Calc Pro/equipment-data.js"></script>
  <script src="../Load Calc Pro/script.js"></script>
  <script src="../Water Calc/water-data.js"></script>
  <script src="../Water Calc/script.js"></script>
  <script src="../Consumables Calc/consumables-lists.js"></script>
  <script src="../Consumables Calc/consumables.js"></script>
  <script src="../Medicines Calc/medications-data.js"></script>
  <script src="../Medicines Calc/script.js"></script>
```

**Do not change anything else in this file.**

**STOP. Do not proceed to Task 2 until told to.**

---

## TASK 2 — Scope Load Calc Pro CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Load Calc Pro\styles.css`

- Delete the bare `* { box-sizing: border-box; }` block entirely
- Delete the bare `body { ... }` block entirely
- Convert `:root { ... }` to `.load-pro-calc { ... }` — do NOT delete it
- Prefix every other selector with `.load-pro-calc ` (with a space after)
- For comma-separated selectors like `h1, h2, h3` prefix each part individually: `.load-pro-calc h1, .load-pro-calc h2, .load-pro-calc h3`
- For selectors inside `@media` blocks, prefix each selector inside — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or animation step selectors (`from`, `to`, `0%`)
- Do not change any property values
- Do not rename the file

**STOP. Do not proceed to Task 3 until told to.**

---

## TASK 3 — Fix element IDs in Load Calc Pro script

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Load Calc Pro\script.js`

This file uses bare element IDs that need the `load-pro-` prefix to match the shell's HTML.

**Make these exact string replacements — change only the ID strings inside quotes, nothing else:**

| Find | Replace with |
|------|-------------|
| `'#approximate-runtime'` | `'#load-pro-approximate-runtime'` |
| `'#available-kva'` | `'#load-pro-available-kva'` |
| `'#btn-clear-autosave'` | `'#load-pro-btn-clear-autosave'` |
| `'#capacity-status-pill'` | `'#load-pro-capacity-status-pill'` |
| `'#categories-column'` | `'#load-pro-categories-column'` |
| `'#clear-scenarios-btn'` | `'#load-pro-clear-scenarios-btn'` |
| `'#clear-sheet-btn'` | `'#load-pro-clear-sheet-btn'` |
| `'#delete-scenario-btn'` | `'#load-pro-delete-scenario-btn'` |
| `'#export-file-btn'` | `'#load-pro-export-file-btn'` |
| `'#export-format-cancel'` | `'#load-pro-export-format-cancel'` |
| `'#export-format-confirm'` | `'#load-pro-export-format-confirm'` |
| `'#export-format-dialog'` | `'#load-pro-export-format-dialog'` |
| `'#filter-notice'` | `'#load-pro-filter-notice'` |
| `'#filtered-kva'` | `'#load-pro-filtered-kva'` |
| `'#filtered-kva-row'` | `'#load-pro-filtered-kva-row'` |
| `'#filtered-kw'` | `'#load-pro-filtered-kw'` |
| `'#filtered-kw-row'` | `'#load-pro-filtered-kw-row'` |
| `'#fuel-capacity'` | `'#load-pro-fuel-capacity'` |
| `'#fuel-rate-per-kw'` | `'#load-pro-fuel-rate-per-kw'` |
| `'#guide-btn'` | `'#load-pro-guide-btn'` |
| `'#guide-modal-body'` | `'#load-pro-guide-modal-body'` |
| `'#guide-modal-close'` | `'#load-pro-guide-modal-close'` |
| `'#guide-modal-overlay'` | `'#load-pro-guide-modal-overlay'` |
| `'#import-file-btn'` | `'#load-pro-import-file-btn'` |
| `'#kva-margin'` | `'#load-pro-kva-margin'` |
| `'#load-scenario-btn'` | `'#load-pro-load-scenario-btn'` |
| `'#load-scenario-file'` | `'#load-pro-load-scenario-file'` |
| `'#peak-kva'` | `'#load-pro-peak-kva'` |
| `'#print-summary-btn'` | `'#load-pro-print-summary-btn'` |
| `'#recommended-kva'` | `'#load-pro-recommended-kva'` |
| `'#reset-btn'` | `'#load-pro-reset-btn'` |
| `'#save-scenario-btn'` | `'#load-pro-save-scenario-btn'` |
| `'#scenario-name'` | `'#load-pro-scenario-name'` |
| `'#scenario-notes'` | `'#load-pro-scenario-notes'` |
| `'#scenario-select'` | `'#load-pro-scenario-select'` |
| `'#search-equipment'` | `'#load-pro-search-equipment'` |
| `'#sort-equipment'` | `'#load-pro-sort-equipment'` |
| `'#total-kva'` | `'#load-pro-total-kva'` |
| `'#total-kw'` | `'#load-pro-total-kw'` |
| `getElementById('filter-notice')` | `getElementById('load-pro-filter-notice')` |

Also fix this querySelector string (used for export format dialog radio buttons):
| Find | Replace with |
|------|-------------|
| `'#export-format-dialog input[name="export-format"]:checked'` | `'#load-pro-export-format-dialog input[name="export-format"]:checked'` |
| `'#export-format-dialog input[name="export-format"][value="JSON"]'` | `'#load-pro-export-format-dialog input[name="export-format"][value="JSON"]'` |

**Do not change any calculation logic, variable names, or anything else — only the ID strings listed above.**

**STOP. Do not proceed to Task 4 until told to.**

---

## TASK 4 — Scope Water Calc CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Water Calc\styles.css`

- Delete the bare `* { ... }` block entirely
- Delete the bare `body { ... }` block entirely
- If there is a `:root { ... }` block, convert it to `.water-calc { ... }` — do NOT delete it
- Find any rule that sets `min-height: 100vh` — change it to `min-height: auto`
- Prefix every other selector with `.water-calc ` (with a space after)
- For comma-separated selectors, prefix each part individually
- For selectors inside `@media` blocks, prefix each selector inside — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or animation step selectors
- Do not change any property values except the `min-height` change above
- Do not rename the file

**STOP. Do not proceed to Task 5 until told to.**

---

## TASK 5 — Fix element IDs in Water Calc script

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Water Calc\script.js`

This file uses a `g(id)` helper function that calls `getElementById`. The bare IDs need `water-` prefix.

**Make these exact string replacements — change only the ID strings inside quotes:**

| Find | Replace with |
|------|-------------|
| `g('beds')` | `g('water-beds')` |
| `g('breakdown-display')` | `g('water-breakdown-display')` |
| `g('breakdown-toggle')` | `g('water-breakdown-toggle')` |
| `g('btn-clear-autosave')` | `g('water-btn-clear-autosave')` |
| `g('buffer')` | `g('water-buffer')` |
| `g('button-feedback')` | `g('water-button-feedback')` |
| `g('clear-btn')` | `g('water-clear-btn')` |
| `g('days')` | `g('water-days')` |
| `g('delete-btn')` | `g('water-delete-btn')` |
| `g('export-btn')` | `g('water-export-btn')` |
| `g('export-format-cancel')` | `g('water-export-format-cancel')` |
| `g('export-format-confirm')` | `g('water-export-format-confirm')` |
| `g('export-format-dialog')` | `g('water-export-format-dialog')` |
| `g('file-input')` | `g('water-file-input')` |
| `g('import-btn')` | `g('water-import-btn')` |
| `g('load-btn')` | `g('water-load-btn')` |
| `g('mains-flow-rate')` | `g('water-mains-flow-rate')` |
| `g('mains-flow-section')` | `g('water-mains-flow-section')` |
| `g('out-mains-status')` | `g('water-out-mains-status')` |
| `g('potable-buffer-row')` | `g('water-potable-buffer-row')` |
| `g('potable-capacity')` | `g('water-potable-capacity')` |
| `g('potable-count')` | `g('water-potable-count')` |
| `g('potable-delivery-row')` | `g('water-potable-delivery-row')` |
| `g('potable-mains-row')` | `g('water-potable-mains-row')` |
| `g('potable-rate')` | `g('water-potable-rate')` |
| `g('potable-supply-mode')` | `g('water-potable-supply-mode')` |
| `g('print-btn')` | `g('water-print-btn')` |
| `g('reset-btn')` | `g('water-reset-btn')` |
| `g('save-btn')` | `g('water-save-btn')` |
| `g('scenario-name')` | `g('water-scenario-name')` |
| `g('scenario-notes')` | `g('water-scenario-notes')` |
| `g('scenario-select')` | `g('water-scenario-select')` |
| `g('schedule-note')` | `g('water-schedule-note')` |
| `g('wastewater-capacity')` | `g('water-wastewater-capacity')` |
| `g('wastewater-count')` | `g('water-wastewater-count')` |
| `g('wastewater-disposal-mode')` | `g('water-wastewater-disposal-mode')` |
| `g('wastewater-mains-row')` | `g('water-wastewater-mains-row')` |
| `g('wastewater-pickup-row')` | `g('water-wastewater-pickup-row')` |
| `g('wastewater-rate')` | `g('water-wastewater-rate')` |

Also fix these querySelector strings:
| Find | Replace with |
|------|-------------|
| `'#export-format-dialog input[name="export-format"]:checked'` | `'#water-export-format-dialog input[name="export-format"]:checked'` |
| `'#export-format-dialog input[name="export-format"][value="JSON"]'` | `'#water-export-format-dialog input[name="export-format"][value="JSON"]'` |

Also fix this getElementById call:
| Find | Replace with |
|------|-------------|
| `getElementById('water-last-saved')` | leave as-is — already correct |

**Do not change any calculation logic, variable names, or anything else.**

**STOP. Do not proceed to Task 6 until told to.**

---

## TASK 6 — Scope Medicines CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Medicines Calc\styles.css`

- Delete the bare `* { ... }` block entirely
- Delete the bare `body { ... }` block entirely
- If there is a `:root { ... }` block, convert it to `.meds-calc { ... }` — do NOT delete it
- Prefix every other selector with `.meds-calc ` (with a space after)
- For comma-separated selectors, prefix each part individually
- For selectors inside `@media` blocks, prefix each selector inside — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or animation step selectors
- Do not change any property values
- Do not rename the file

**STOP. Do not proceed to Task 7 until told to.**

---

## TASK 7 — Fix element IDs in Medicines script

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Medicines Calc\script.js`

**Make these exact string replacements:**

| Find | Replace with |
|------|-------------|
| `g('add-item-btn')` | `g('meds-add-item-btn')` |
| `g('beds')` | `g('meds-beds')` |
| `g('btn-clear-autosave')` | `g('meds-btn-clear-autosave')` |
| `g('buffer')` | `g('meds-buffer')` |
| `g('button-feedback')` | `g('meds-button-feedback')` |
| `g('clear-btn')` | `g('meds-clear-btn')` |
| `g('clear-items-btn')` | `g('meds-clear-items-btn')` |
| `g('consumables-container')` | `g('meds-consumables-container')` |
| `g('days')` | `g('meds-days')` |
| `g('delete-btn')` | `g('meds-delete-btn')` |
| `g('export-btn')` | `g('meds-export-btn')` |
| `g('export-format-cancel')` | `g('meds-export-format-cancel')` |
| `g('export-format-confirm')` | `g('meds-export-format-confirm')` |
| `g('export-format-dialog')` | `g('meds-export-format-dialog')` |
| `g('file-status')` | `g('meds-file-status')` |
| `g('filter-notice')` | `g('meds-filter-notice')` |
| `g('import-btn')` | `g('meds-import-btn')` |
| `g('import-file-input')` | `g('meds-import-file-input')` |
| `g('items-info')` | `g('meds-items-info')` |
| `g('load-btn')` | `g('meds-load-btn')` |
| `g('min-qty-filter')` | `g('meds-min-qty-filter')` |
| `g('new-item-name')` | `g('meds-new-item-name')` |
| `g('new-item-rate')` | `g('meds-new-item-rate')` |
| `g('nonzero-only-filter')` | `g('meds-nonzero-only-filter')` |
| `g('pharma-list-btn')` | `g('meds-pharma-list-btn')` |
| `g('pharma-secondary-list-btn')` | `g('meds-pharma-secondary-list-btn')` |
| `g('print-btn')` | `g('meds-print-btn')` |
| `g('save-btn')` | `g('meds-save-btn')` |
| `g('scenario-name')` | `g('meds-scenario-name')` |
| `g('scenario-notes')` | `g('meds-scenario-notes')` |
| `g('scenario-select')` | `g('meds-scenario-select')` |
| `g('search')` | `g('meds-search')` |
| `g('sort-equipment')` | `g('meds-sort-equipment')` |
| `getElementById('help-popover-inventory')` | `getElementById('meds-help-popover-inventory')` |
| `getElementById('medicines-last-saved')` | leave as-is — already correct |

Also fix these querySelector strings:
| Find | Replace with |
|------|-------------|
| `'#export-format-dialog input[name="export-format"]:checked'` | `'#meds-export-format-dialog input[name="export-format"]:checked'` |
| `'#export-format-dialog input[name="export-format"][value="JSON"]'` | `'#meds-export-format-dialog input[name="export-format"][value="JSON"]'` |

**Do not change any calculation logic, variable names, or anything else.**

**STOP. Do not proceed to Task 8 until told to.**

---

## TASK 8 — Scope Consumables CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Consumables Calc\styles.css`

- Delete the bare `* { ... }` block entirely
- Delete the bare `body { ... }` block entirely
- Convert `:root { ... }` to `.cons-calc { ... }` — do NOT delete it
- Prefix every other selector with `.cons-calc ` (with a space after)
- For comma-separated selectors, prefix each part individually
- For selectors inside `@media` blocks, prefix each selector inside — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or animation step selectors
- Do not change any property values
- Do not rename the file

**STOP. Do not proceed to Task 9 until told to.**

---

## TASK 9 — Scope Load Calc Basic CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Load Calc Basic\styles.css`

- Delete the bare `* { ... }` block entirely
- Delete the bare `body { ... }` block entirely
- If there is a `:root { ... }` block, convert it to `.load-basic-calc { ... }` — do NOT delete it
- Prefix every other selector with `.load-basic-calc ` (with a space after)
- For comma-separated selectors, prefix each part individually
- For selectors inside `@media` blocks, prefix each selector inside — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or animation step selectors
- Do not change any property values
- Do not rename the file

**STOP. Do not proceed to Task 10 until told to.**

---

## TASK 10 — Fix element IDs in Load Calc Basic script

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Load Calc Basic\script.js`

**Make these exact string replacements:**

| Find | Replace with |
|------|-------------|
| `getElementById('export-format-cancel')` | `getElementById('load-export-format-cancel')` |
| `getElementById('export-format-confirm')` | `getElementById('load-export-format-confirm')` |
| `getElementById('export-format-dialog')` | `getElementById('load-export-format-dialog')` |
| `getElementById('guide-btn')` | `getElementById('load-guide-btn')` |
| `getElementById('guide-modal-body')` | `getElementById('load-guide-modal-body')` |
| `getElementById('guide-modal-close')` | `getElementById('load-guide-modal-close')` |
| `getElementById('guide-modal-overlay')` | `getElementById('load-guide-modal-overlay')` |
| `getElementById('load-basic-last-saved')` | leave as-is — already correct |
| `getElementById('panel-load-calc')` | leave as-is — already correct |

**Do not change any calculation logic, variable names, or anything else.**

**STOP. All tasks complete. Do not do anything else.**

---

## VERIFICATION AFTER ALL TASKS

Open this file in Chrome:
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Calcs Shell\index.html`

Click each tab and confirm it displays with full styling and layout. Press F12 and check the Console tab for any red errors.
