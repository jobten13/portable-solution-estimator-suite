# Load Calc Pro - Migration Checklist (from Basic)

Use this checklist when deciding which `Load Calc Basic` changes to port into Pro.

## Execution Checklist

- [x] **Scenario empty-state hardening**
  - Disable scenario controls when no scenarios are saved.
  - Show a clear placeholder option (e.g., `No saved scenarios`).

- [x] **Import sanitization parity audit**
  - Confirm Pro import sanitizes generator, fuel, and equipment fields robustly.
  - Ensure sanitized/coerced values produce user-facing warnings.
  - Ensure downloadable printable issue report is available when issues are found.

- [x] **Help-popover parity pass**
  - Verify tooltip/help coverage and wording for:
    - Scenarios
    - Equipment List
    - Summary
    - Capacity Check
    - Fuel/Runtime

- [ ] **Equipment section heading parity**
  - Ensure explicit `Equipment List` title exists and styling is consistent with section title standards.

- [x] **Worksheet auto-save + auto-restore**
  - Persist current in-progress worksheet state (not only named scenarios) to local storage.
  - Restore that working state automatically on reopen/refresh.
  - Add a clear reset path so users can discard auto-saved working state when needed.

- [x] **Fuel-unit model decision (finalized)**
  - Decision: **Pro is gallons-only**.
  - Fuel model cleanup completed:
    - Canonical scenario fields are gallons-based (`fuelTankCapacityGallons`, `fuelRateGalPerKw`).
    - Removed remaining `fuelUnit` write-path fragment from scenario export/save.
    - Removed legacy liters/alternate payload fallback paths from Pro import/load.

## Already Applied in Pro (from this workstream)

- [x] Compact scenario section styling aligned with suite standard.
- [x] Dual totals in summary (`all-items` + `filtered view`).
- [x] Footer-centered version label pattern (no top-banner version).
- [x] Fuel model standardized to gallons-only with legacy fallback paths removed.

## Recommended Order

1. Scenario empty-state hardening
2. Import sanitization/report parity audit
3. Worksheet auto-save + auto-restore
4. Help-popover parity pass
5. Equipment heading parity
6. (Completed) Fuel-unit model decision and implementation
