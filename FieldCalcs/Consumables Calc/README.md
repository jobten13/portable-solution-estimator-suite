# Consumables Supply List Calculator

Part of the **Field Hospital Calculator** suite. **Standalone module:** this folder is self-contained and can be used independently (e.g. deployed alone, or given to a different team). It does not depend on the Pharmaceuticals calc or any shared code. Manages consumables requirements for field hospital deployments: load pre-built Ward Consumables or ICU Consumables lists, set deployment parameters (days, beds, buffer), and save/load scenarios. Sort and search filter the list.

## Suite versioning

**Suite** version is defined in **`../version.json`** — see **[`../../VERSIONING.md`](../../VERSIONING.md)** for how to bump releases and what testers report. **Do not** duplicate the suite version number in this README; the page footer shows **Suite v…** at runtime. This README describes **Consumables** only (including in-app user guide / tooltips).

---

## How to run

Open this folder’s **`index.html`** — it redirects to **`../index.html#consumables`** in the FieldCalcs shell. No server required. Works offline.

**Dependencies:** `consumables.js` (main logic), `consumables-lists.js` (Ward/ICU consumables list data), `styles.css`.

---

## Functionality

### Data sources
- **Ward Consumables** — Load the built-in Ward consumables list from `consumables-lists.js`.
- **ICU Consumables** — Load the built-in ICU consumables list from `consumables-lists.js`.
- **Add Item** — Add a custom consumable with a per-day/per-bed rate directly in the calculator.
- **Reset Worksheet** — Remove all items and reset to empty state (toolbar; clears deployment inputs and scenario name/notes per app behavior).

### Toolbar: autosave and list-loading tooltips
- **Restore Autosave** — Grey (**secondary**) button. Restores the last autosaved worksheet state in this browser (recovery slot); named scenarios in the dropdown are unchanged.
- **Autosaved:** — Text next to Restore Autosave when a timestamp exists. Format: **Autosaved: M/D h:mm AM/PM** (no year, no seconds). Empty when there is no autosave to show.
- **Ward Consumables** / **ICU Consumables** — Blue/gold (**`.btn-ucd`**) buttons. Hover tooltips (browser `title` attribute):
  - **Ward Consumables:** *Load the built-in Ward consumables list; replaces the current worksheet list.*
  - **ICU Consumables:** *Load the built-in ICU consumables list; replaces the current worksheet list.*

### Deployment parameters
- **Expected Length of Deployment (Days)** — Number of days (used for scaling or notes; can drive per-day logic if implemented).
- **Expected Number of Beds** — Bed count (context for quantities).
- **Buffer Percentage (%)** — Optional buffer (e.g. 10 for 10%) applied to quantities. Range 0–100.

### Consumables requirements table
- **Per row:** Item name and calculated quantity. Totals/summary reflect visible rows after search.
- **Row deletion:** Any row can be deleted using the row-level **Delete** action for scenario-specific tailoring. Loading Ward or ICU consumables restores the original baseline list.
- **Items count line** — Below the search box: when a list is loaded, shows counts such as **`236 Ward Consumables items loaded`** or **`184 ICU Consumables items loaded`**, or **`N of M Ward Consumables items shown`** when filters/search hide rows. The toolbar no longer shows a separate “list status” label; the active list name is included in this line. Hidden when the worksheet has no items (empty state message applies).
- **Sort** — Name A–Z/Z–A, Total quantity High to Low / Low to High, plus **Source list order** when a built-in list is active (persisted).
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

- **Layout:** Banner → Toolbar (**Restore Autosave**, **Autosaved:** timestamp, Print, **Ward Consumables** / **ICU Consumables**, **Reset Worksheet**) → Scenarios → Deployment Parameters (highlight) → Consumables Requirements (sort, search, items count line, table).
- **Suite alignment:** Same banner, scenario block, and button roles (Print blue, Ward/ICU list buttons in UC Davis blue/gold, Save/Load green, Delete amber, Clear red, **Restore Autosave** and Import/Export as grey secondary). IDs use `cons-` prefix for clarity.

---

## File structure

| File | Purpose |
|------|--------|
| `index.html` | Structure, toolbar, scenario UI, deployment params, sort/search, table container. |
| `consumables.js` | Table build, recalc, validation, scenarios, search filter, sort, placeholder/focus behavior. |
| `consumables-lists.js` | Ward and ICU consumables list data (item names and default quantities). |
| `styles.css` | Layout, cards, table, validation and placeholder styles, print. |
| `stress-test-robust.html` | Standalone robustness test harness for consumables quantity calculations and data invariants. |

---

## Technical notes

- **Storage:** Scenarios stored in localStorage under a key specific to the Consumables calculator; sort preference persisted.
- **Search:** Rows without a name match get a hidden class; totals and item count reflect visible rows only.

### Future implementation note
- Consider an intentional empty-start experience on open (no list preloaded), with a clear starter prompt in the table area:
  - `Get started` message
  - `Ward Consumables` button
  - `ICU Consumables` button
- This should call existing list-load handlers (no duplicated logic) and keep current toolbar buttons as-is.

---

*This tool is a simplified estimator. Verify quantities and assumptions for your context.*
