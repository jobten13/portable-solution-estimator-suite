# Pharmaceuticals Supply List Calculator (Ward-ICU-Pharma)

Part of the **Field Hospital Calculator** suite. Manages pharmaceuticals requirements for field hospital deployments: load the pre-built **UCD Pharmaceuticals List**, set deployment parameters (days, beds, buffer), add custom items, and save/load scenarios. Sort and search filter the list.

## Suite versioning

**Suite** version is defined in **`../version.json`** — see **[`../VERSIONING.md`](../VERSIONING.md)** for how to bump releases and what testers report. **Do not** duplicate the suite version number in this README; the page footer shows **Suite v…** at runtime. This README describes **Pharmaceuticals** only (including in-app user guide / tooltips).

---

## How to run

Open `index.html` in a modern browser. No server required. Works offline.

**Dependencies:** `script.js` (main logic), `consumables-lists.js` (UCD Pharmaceuticals list data), `styles.css`.

---

## Functionality

### Data sources
- **UCD Pharmaceuticals List** — Load the built-in pharmaceuticals list from `consumables-lists.js` (current source file: `New UCD Lists/Medicines_List_Consolidated-2.csv`, mapped from row 4 onward using Column B = item name and Column C = multiplier).
- **Add Item** — Add a custom pharmaceuticals item with a per-day/per-bed rate directly in the calculator.
- **Clear All Items** — Remove all items and reset to empty state.

### Deployment parameters
- **Expected Length of Deployment (Days)** — Number of days (used for scaling or notes).
- **Expected Number of Beds** — Bed count (context for quantities).
- **Buffer Percentage (%)** — Optional buffer (e.g. 10 for 10%) applied to quantities. Range 0–100.

### Pharmaceuticals requirements table
- **Per row:** Item name and calculated quantity. Totals/summary reflect visible rows after search.
- **Row deletion:** Any row can be deleted using the row-level **Delete** action for scenario-specific tailoring. Loading the UCD list restores the original baseline list.
- **Sort** — Name A–Z/Z–A, Total quantity High to Low / Low to High (persisted in localStorage).
- **Search** — Filter items by name (live); row count and totals use visible rows only.

### Scenarios
- **Save scenario** — Uses the Scenario name field; if blank, prompts for a name. Saved scenario names automatically append date/time for traceability. Saves current items, deployment parameters (days, beds, buffer), and notes to browser storage. Validation must pass before saving.
- **Load / Delete / Clear all** — Restore or remove saved scenarios from dropdown.
- **Import from file / Export to file** — JSON scenario files. If imported data contains invalid values, the app sanitizes what it can, warns the user, and downloads a printable `.txt` sanitization report with fix guidance.

### Validation and UX
- **Input validation** — Deployment parameters and quantities validated on blur with red border and inline message where applicable. Save blocked when errors exist.
- **Placeholder behavior** — Numeric inputs use placeholders (e.g. 0); focus clears “0” for easier entry. Loaded scenarios restore empty string for 0 so placeholders show.

### Other
- **Print** — Print-friendly view; toolbar and scenario controls hidden in print.
- **Robust stress test** — Open `stress-test-robust.html` to run standalone robustness checks for quantity logic, invariants, and real-data validation against `PHARMA_ITEMS`.

---

## UX/UI design

- **Layout:** Banner → Toolbar (Print, UCD Pharmaceuticals List, Clear All Items, file status) → Scenarios → Deployment Parameters (highlight) → Pharmaceuticals Requirements (sort, search, item count, table).
- **Suite alignment:** Same banner, scenario block, and button roles (Print blue, UCD list button, Save/Load green, Delete amber, Clear red, Secondary gray). Structure mirrors the Consumables calculator; IDs are pharma-specific (no `cons-` prefix).

---

## File structure

| File | Purpose |
|------|--------|
| `index.html` | Structure, toolbar, scenario UI, deployment params, sort/search, table container. |
| `script.js` | Table build, recalc, validation, scenarios, search filter, sort, placeholder/focus behavior. |
| `consumables-lists.js` | UCD Pharmaceuticals list data (item names and default quantities). |
| `styles.css` | Layout, cards, table, validation and placeholder styles, print. |
| `stress-test-robust.html` | Standalone robustness test harness for pharmaceuticals quantity calculations and data invariants. |

---

## Technical notes

- **Storage:** Scenarios and sort preference use localStorage keys specific to the Pharmaceuticals calculator (pharma/medications), separate from the Consumables calculator.
- **Search:** Rows without a name match get a hidden class; totals and item count reflect visible rows only.

---

*This tool is a simplified estimator. Verify requirements with qualified personnel before deployment.*
