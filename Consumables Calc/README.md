# Consumables Supply List Calculator

Part of the **Field Hospital Calculator** suite. **Standalone module:** this folder is self-contained and can be used independently (e.g. deployed alone, or given to a different team). It does not depend on the Pharmaceuticals calc or any shared code. Manages consumables requirements for field hospital deployments: load pre-built UCD Ward or ICU lists, set deployment parameters (days, beds, buffer), and save/load scenarios. Sort and search filter the list.

## Suite versioning

**Suite** version is defined in **`../version.json`** — see **[`../VERSIONING.md`](../VERSIONING.md)** for how to bump releases and what testers report. **Do not** duplicate the suite version number in this README; the page footer shows **Suite v…** at runtime. This README describes **Consumables** only (including in-app user guide / tooltips).

---

## How to run

Open `index.html` in a modern browser. No server required. Works offline.

**Dependencies:** `consumables.js` (main logic), `consumables-lists.js` (UCD Ward/ICU list data), `styles.css`.

---

## Functionality

### Data sources
- **UCD Ward List** — Load the built-in Ward consumables list from `consumables-lists.js`.
- **UCD ICU List** — Load the built-in ICU consumables list from `consumables-lists.js`.
- **Add Item** — Add a custom consumable with a per-day/per-bed rate directly in the calculator.
- **Clear All Items** — Remove all items and reset to empty state.

### Deployment parameters
- **Expected Length of Deployment (Days)** — Number of days (used for scaling or notes; can drive per-day logic if implemented).
- **Expected Number of Beds** — Bed count (context for quantities).
- **Buffer Percentage (%)** — Optional buffer (e.g. 10 for 10%) applied to quantities. Range 0–100.

### Consumables requirements table
- **Per row:** Item name and calculated quantity. Totals/summary reflect visible rows after search.
- **Row deletion:** Any row can be deleted using the row-level **Delete** action for scenario-specific tailoring. Loading a UCD list restores the original baseline list.
- **Sort** — Name A–Z/Z–A, Total quantity High to Low / Low to High (persisted).
- **Search** — Filter items by name (live); row count and totals use visible rows only.

### Scenarios
- **Save scenario** — Uses the Scenario name field; if blank, prompts for a name. Saved scenario names automatically append date/time for traceability. Saves current items, deployment parameters (days, beds, buffer), and notes to browser storage. Validation must pass before saving.
- **Load / Delete / Clear all** — Restore or remove saved scenarios from dropdown.
- **Import from file / Export to file** — JSON scenario files. If imported data contains invalid values, the app sanitizes what it can, warns the user, and downloads a printable `.txt` sanitization report with fix guidance.

### Validation and UX
- **Input validation** — Deployment parameters and quantities validated on blur with red border and inline message where applicable. Save blocked when errors exist.
- **Placeholder behavior** — Numeric inputs use placeholders (e.g. 0); focus clears “0” for easier entry.

### Other
- **Print** — Print-friendly view; toolbar and scenario controls hidden in print.
- **Robust stress test** — Open `stress-test-robust.html` to run standalone robustness checks for quantity logic, invariants, and real-data validation against Ward and ICU lists.

---

## UX/UI design

- **Layout:** Banner → Toolbar (Print, UCD Ward/ICU, Clear All Items, list status) → Scenarios → Deployment Parameters (highlight) → Consumables Requirements (sort, search, item count, table).
- **Suite alignment:** Same banner, scenario block, and button roles (Print blue, UCD/list buttons, Save/Load green, Delete amber, Clear red, Secondary gray). IDs use `cons-` prefix for clarity.

---

## File structure

| File | Purpose |
|------|--------|
| `index.html` | Structure, toolbar, scenario UI, deployment params, sort/search, table container. |
| `consumables.js` | Table build, recalc, validation, scenarios, search filter, sort, placeholder/focus behavior. |
| `consumables-lists.js` | UCD Ward and ICU consumables list data (item names and default quantities). |
| `styles.css` | Layout, cards, table, validation and placeholder styles, print. |
| `stress-test-robust.html` | Standalone robustness test harness for consumables quantity calculations and data invariants. |

---

## Technical notes

- **Storage:** Scenarios stored in localStorage under a key specific to the Consumables calculator; sort preference persisted.
- **Search:** Rows without a name match get a hidden class; totals and item count reflect visible rows only.

### Future implementation note
- Consider an intentional empty-start experience on open (no list preloaded), with a clear starter prompt in the table area:
  - `Get started` message
  - `Load UCD Ward List` button
  - `Load UCD ICU List` button
- This should call existing list-load handlers (no duplicated logic) and keep current toolbar buttons as-is.

---

*This tool is a simplified estimator. Verify quantities and assumptions for your context.*
