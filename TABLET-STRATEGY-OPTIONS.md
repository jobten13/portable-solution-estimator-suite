# Tablet Strategy Options (Calcs Final)

Purpose: capture implementation paths for making calculators more tablet-friendly, with tradeoffs and cross-device data implications.  
Scope: planning document only (no code changes).

---

## 1) Goals and Constraints

- Keep field reliability first (offline-friendly, predictable behavior).
- Minimize regression risk in core calculations.
- Preserve compatibility of scenarios/import/export across desktop/tablet.
- Avoid unnecessary long-term maintenance overhead.

---

## 2) Option A - Single responsive app (auto-adapt by viewport)

### Summary
Use CSS media queries and selective layout behavior changes to automatically adapt to tablet screens.

### Pros
- One codebase to maintain.
- Fewer drift issues between desktop and tablet versions.
- Same scenario schema, import/export behavior, and validation logic.

### Cons
- Requires disciplined responsive design pass across all calculators.
- Risk of layout regressions if done broadly without phased rollout.
- Complex screens (tables/sidebar cards) may need structural adjustments.

### Risk level
- Medium (UI complexity), low data-model risk.

### Best use
- Preferred long-term architecture if consistency and maintainability are priorities.

---

## 3) Option B - Separate tablet package/download

### Summary
Create a second packaged version optimized specifically for tablet layout and controls.

### Pros
- Fastest path to highly tailored tablet UX.
- Can optimize aggressively for touch/spacing without desktop constraints.

### Cons
- Two UI code paths to maintain and test.
- Higher risk of behavior divergence over time.
- Double regression testing burden each release.

### Risk level
- Medium-high maintenance risk, low initial UX risk.

### Best use
- Useful if tablet workflow is operationally distinct enough to justify separate product tracks.

---

## 4) Option C - In-app mode toggle (Desktop / Tablet)

### Summary
Single app with a top-level mode switch that changes layout density/structure.

### Pros
- One deployable app artifact.
- User can choose preferred mode based on context/device.

### Cons
- More state/UI complexity than pure responsive design.
- Need to maintain/test two presentation modes in one codebase.
- Mode persistence and accidental mismatch can confuse users.

### Risk level
- Medium-high UI complexity, low data-model risk.

### Best use
- Good if users frequently use mixed form factors and need explicit control.

---

## 5) Scenarios / Import / Export Cross-device Impact

### Key point
Scenario portability is primarily a **schema** concern, not a layout concern.

### If schema is stable
- Desktop <-> tablet transfer via JSON import/export should work reliably.
- localStorage autosave remains device-local (not shared), which is expected.

### Potential issues to avoid
- Different builds writing different scenario keys or units.
- Version skew where one build expects fields the other does not.
- Silent coercion differences between implementations.

### Mitigations
- Maintain one canonical scenario schema per calculator.
- Add `schemaVersion` in exported files.
- Validate imports strictly and show user-facing sanitization reports on issues.
- Keep a compatibility policy document when schema changes.

---

## 6) Recommended Path

### Recommended now
Start with **Option A (responsive single app)** in phased, low-risk increments.

### Why
- Best balance of reliability, maintainability, and field practicality.
- Avoids split-maintenance burden of separate builds.
- Keeps data/import/export behavior naturally consistent.

### Suggested phased rollout
1. Touch target + spacing pass (44px min targets for key controls).
2. Toolbar/scenario action wrapping and overflow behavior.
3. Sidebar-to-stacked layout at tablet breakpoints.
4. Table usability improvements (horizontal scroll affordances, sticky key columns if needed).
5. Field validation and help-popover usability pass on touch.

---

## 7) Decision Checklist (for implementation go/no-go)

- Is one code path strongly preferred for maintenance?
- Do tablet users require a fundamentally different workflow?
- Can responsive layout meet usability needs without feature divergence?
- Is schema/version governance in place for import/export portability?
- Is test capacity sufficient for one mode vs two mode matrices?

---

## 8) Open Questions for Follow-up

- Target tablet sizes and orientations (e.g., iPad 10.2 portrait/landscape).
- Minimum supported browser baseline on field tablets.
- Whether print workflows are expected from tablets.
- Whether autosave clear/reset controls should be surfaced differently on touch.

