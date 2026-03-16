# Smoke Test Roadmap (Future Implementation)

Purpose: capture a simple, suite-wide plan for adding UI smoke tests later while keeping robust tests model-based.

## Test Strategy

- Primary confidence layer: model/data robust tests (offline-safe, deterministic).
- Secondary confidence layer: UI smoke tests (small, critical-path checks only).
- Keep smoke tests short and resilient to minor layout/style changes.

## What Smoke Tests Should Catch

- Wiring regressions (inputs/buttons no longer trigger expected logic).
- Display regressions (correct values not shown, stale fields, wrong target element).
- Critical state transitions (reset, load/import, filter toggles, save/load scenario basics).

## Suggested Smoke Test Scope By Calculator

### Load Calc Basic

- Quantity input updates total kW and recommended kW.
- Filter search toggles filtered subtotal row visibility.
- Reset quantities clears quantities and recalculates outputs.
- Scenario save/load roundtrip restores key values.

### Load Calc Pro

- Quantity input updates total/recommended.
- Generator/fuel inputs update rate and runtime display.
- Clear sheet/reset flow updates UI and persisted autosave state as designed.
- Scenario save/load/import paths update dropdown and rendered state.

### Consumables Calc

- List selection loads visible rows and totals.
- Quantity/rate changes update required quantities.
- Reset worksheet clears user-entered values and recalculates.
- Scenario save/load/import updates rendered worksheet and messages.

### Medicines Calc

- List selection and quantity inputs recalculate totals.
- Reset worksheet clears values and updates output cards/tables.
- Scenario save/load/import updates UI state and derived values.

### Water Calc

- Input changes update demand/storage outputs.
- Unit toggle (liters/gallons) updates values and labels correctly.
- Header reset restores defaults and refreshes all displayed outputs.

## Environment Guidance

- Smoke tests should run from a local static host when possible.
- Avoid iframe cross-origin dependencies for required checks.
- Prefer stable selectors and user-visible assertions over internal implementation details.

## Future Completion Checklist

- [ ] Pick one smoke test runner pattern to use across all calculators.
- [ ] Add one baseline smoke test file per calculator.
- [ ] Document run instructions for offline and local-host execution.
- [ ] Define pass/fail criteria for release readiness.
