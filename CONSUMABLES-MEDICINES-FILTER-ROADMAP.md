# Consumables + Medicines Filter Roadmap (Future)

Purpose: preserve approved filter ideas for later implementation in `Consumables Calc` and `Medicines Calc`.

## Scope and UX Principles

- Filters are view-only by default (non-destructive).
- Filters must never delete or alter underlying worksheet data.
- Keep controls compact in field workflows; avoid clutter.
- Clearly communicate when totals are all-items versus filtered-view.

## Recommended Phase 1

### 1) Min Quantity Filter

- Control: `Min Qty` numeric input (show rows where quantity >= X).
- Placement: near existing sort/search controls.
- Behavior: combines with search criteria (AND logic).
- Safety: blank value = filter off.

### 2) Non-zero Only Toggle

- Control: checkbox/toggle `Show non-zero only`.
- Value: very fast review of active rows before handoff/print.
- Behavior: applies with search/min-qty filters.

## Recommended Phase 2

### 3) Row Total Threshold Filter

- Control: `Min row total` (e.g., kW or quantity-derived threshold depending on calc).
- Goal: quickly surface major demand/consumption drivers.
- Keep optional and hidden by default behind an "Advanced filters" affordance if needed.

## Optional Future Filters (only if user demand is clear)

- Category toggles (show/hide categories).
- "Show custom items only" where applicable.
- "Show edited values only" for review workflows.

## Data/Output Rules

- Default totals should remain all-items authoritative.
- Filtered subtotals should appear only when filters are active.
- Any scoped output (print/export visible rows only) should be explicit opt-in.

## Implementation Notes

- Reuse the existing `search-hidden` row class pattern when practical.
- Centralize visibility logic in one filter function to reduce regressions.
- Add a tiny active-filter notice when filters hide rows.

## Suggested Rollout Order

1. `Min Qty` (view-only) in Consumables
2. `Min Qty` (view-only) in Medicines
3. `Show non-zero only` in both
4. Evaluate with real field feedback before adding advanced filters
