# Print: Consumables & Medicines – Game plan (no changes made yet)

## Issue

When printing, the **list of loaded items does not show properly** – scrollbars appear and the list does not expand to show all rows. Behaviour should respect current sort and filters (min qty, non-zero only, search) where applicable.

---

## Root cause (summary)

### Consumables

- **How print works:** `printReport()` calls `window.print()` on the **current page** (no new window).
- **What’s wrong:** The list lives inside `.table-wrapper`, which has:
  - `max-height: 500px`
  - `overflow-y: auto`
  - `overflow-x: auto`
- The **`@media print`** block hides toolbar, scenario-actions, sort-bar, etc., but **does not override** `.table-wrapper`. So in print the same 500px + overflow rules apply → the table is inside a fixed-height scrollable box, so you see scrollbars and the full list doesn’t flow onto the page.
- **Sort/filter:** Before `window.print()`, the code temporarily sets sort to `qty-desc` and calls `filterItems()`, so the **current filter** (min qty, non-zero, search) is what’s in the DOM. So the “what you see” is correct; only the **layout** (height/overflow) is wrong.

### Medicines

- **How print works:** `printReport()` **opens a new window**, builds an HTML string (title, params, table), writes it to that window, then calls `print()` on the new window.
- **What’s wrong:**
  1. **Data used:** It uses **`allConsumables`** and sorts in JS by `totalQuantity` desc. It does **not** use `filteredConsumables`, and does **not** use the user’s current **sort** (name A–Z, qty asc/desc, etc.) or **filters** (min qty, non-zero only, search). So the printed list is always “all items, quantity high to low,” regardless of what’s on screen.
  2. **Scrollbars / list not showing:** The new window’s inline `<style>` does not set `.table-wrapper` at all, so there’s no `max-height` in that document. If scrollbars still appear, it may be the **browser window** (popup) size or the way the print preview is rendered. Adding explicit print-friendly styles in that document (no max-height, overflow visible) will make behaviour predictable.

---

## Proposed fix (game plan)

### 1. Consumables – make the table flow in print

**File:** `Consumables Calc/styles.css`

- In the existing **`@media print`** block, add overrides for the list container so the table can grow and flow across pages:
  - Target: **`.cons-calc .table-wrapper`** (the div that wraps the data table).
  - Set:
    - `max-height: none;`
    - `overflow: visible;` (or at least `overflow-y: visible;`)
  - Optionally: `page-break-inside: auto` on the wrapper so the table can break across pages; and consider `thead { display: table-header-group; }` so the header can repeat on each page (browser-dependent).

**No change** to `printReport()` logic for Consumables is strictly necessary for “list not showing / scrollbars”: the current behaviour of forcing sort to qty-desc and calling `filterItems()` already ensures the printed content matches the current filter. Only the CSS fix above is required so that content is visible and not stuck in a 500px box.

---

### 2. Medicines – two parts

**Part A – Respect current view (sort + filters)**

**File:** `Medicines Calc/script.js` – inside `printReport()`.

- Use **`filteredConsumables`** (and the same deployment params) instead of `allConsumables` so the printed list matches the current **filters** (search, min qty, non-zero only).
- Apply the **current sort** (e.g. read `currentSortKey` or the sort dropdown value) when building the printed rows, instead of hardcoding `summaryData.sort((a, b) => b.totalQuantity - a.totalQuantity)`.
- Optionally: in the printed document, add a short line under the title or params indicating active filters (e.g. “Filter: Min qty ≥ X; Non-zero only”) when any filter is active, so the print is self-explanatory.

**Part B – No scrollbars / full list in print window**

**File:** `Medicines Calc/script.js` – same `printReport()`, where `fullHtml` and the inline `<style>` are built.

- In the inline `<style>` for the print window, add rules so the table container does not constrain height or show scrollbars, e.g.:
  - `.table-wrapper { max-height: none; overflow: visible; }`
- This ensures the list in the new window flows fully and prints without being clipped or shown with scrollbars.

---

## Order of work (when you’re back)

1. **Consumables:** Add the `@media print` overrides for `.cons-calc .table-wrapper` in `Consumables Calc/styles.css`. Test: load list, set sort/filters, print → list should show in full with no scrollbar box; sort/filter should match screen.
2. **Medicines Part B:** Add `.table-wrapper { max-height: none; overflow: visible; }` (or equivalent) to the print-window inline style in `printReport()`. Test: print → list should show in full in the print preview.
3. **Medicines Part A:** Change `printReport()` to use `filteredConsumables` and current sort (and optional filter caption). Test: apply sort/filters on screen, print → printed list and order should match the current view.

---

## Files to touch (recap)

| Calc        | File                          | Change |
|------------|--------------------------------|--------|
| Consumables | `Consumables Calc/styles.css`  | `@media print` overrides for `.cons-calc .table-wrapper` (max-height: none; overflow: visible; etc.). |
| Medicines   | `Medicines Calc/script.js`     | (Part B) Inline style in print window: `.table-wrapper { max-height: none; overflow: visible; }`. |
| Medicines   | `Medicines Calc/script.js`     | (Part A) Use `filteredConsumables` + current sort when building print HTML; optionally add filter caption. |

No other files need to change for this game plan.
