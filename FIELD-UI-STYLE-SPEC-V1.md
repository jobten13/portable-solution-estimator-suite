# Field UI Style Spec v1

Purpose: define a practical, field-first visual system for all calculators in `Calcs Final`, with a more contemporary/modern feel while preserving reliability, readability, and speed in austere environments.

---

## 1) Design Principles

- **Field-first utility:** readability and task speed take priority over decorative styling.
- **High trust visuals:** clean, stable, predictable interface with clear states.
- **Consistency over novelty:** repeated controls should look and behave the same across calculators.
- **Accessible by default:** strong contrast, visible focus states, and touch-friendly targets.
- **Graceful degradation:** app remains usable offline, in poor lighting, and on mixed device classes.

---

## 2) Core Token System (per calculator, aligned values)

Use calculator-local CSS variables, but keep values aligned to this spec unless there is a justified exception.

### Color tokens

```css
--ui-bg: #f3f5f8;
--ui-surface: #ffffff;
--ui-surface-alt: #f8fafc;
--ui-border: #d6dbe4;
--ui-text: #0f172a;
--ui-text-muted: #475569;

--ui-primary: #1d4ed8;
--ui-primary-hover: #1e40af;
--ui-success: #059669;
--ui-warning: #d97706;
--ui-danger: #dc2626;
--ui-secondary: #4b5563;

--ui-focus: #2563eb;
--ui-disabled: #9ca3af;
```

### Type tokens

```css
--font-family-base: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 22px;

--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Spacing/radius/shadow tokens

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;

--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;

--shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
--shadow-md: 0 6px 18px rgba(15, 23, 42, 0.10);
```

---

## 3) Layout & Structure Standards

- **Max width:** keep app containers around `1200-1300px` depending on calc complexity.
- **Section rhythm:** use consistent vertical spacing (`16/24px`) between major blocks.
- **Toolbar order:** high-frequency actions first, destructive actions grouped right.
- **Card model:** one border/radius/shadow language across all calculators.
- **Empty states:** always provide actionable CTA (button/link) instead of passive text-only notices.

---

## 4) Component Styling Standards

### Header/Banner

- Keep existing recognizable identity, but avoid increasing visual density.
- Title and subtitle hierarchy must be consistent across calculators.

### Buttons

- Keep semantic roles:
  - Print/primary action = blue
  - Save/load = green
  - Warning/reset qty = amber
  - Destructive clear/reset worksheet = red
  - Neutral/import/export = gray
- Minimum tap target: **44px** height for high-use controls in field contexts.
- Hover/focus states must be visible even in bright light.

### Inputs

- Use one focus-ring style everywhere (2px ring, clear contrast).
- Placeholder text should not be too faint.
- Validation state must combine color + message (not color alone).

### Tables

- Sticky headers for large datasets where appropriate.
- Subtle row separators; clear hover state.
- Numeric cells right-aligned and tabular where possible.

### Help popovers

- Keep concise, actionable bullets.
- Max width bounded (~420px).
- Consistent trigger and pin/close behavior across apps.

---

## 5) Field Accessibility Requirements

- **Contrast:** target WCAG AA minimum for body text and controls.
- **Keyboard:** visible focus for all actionable controls.
- **Color redundancy:** critical states should include text labels, not color only.
- **Motion:** keep transitions subtle and optional; no essential behavior tied to animation.
- **Print mode:** preserve key totals and assumptions; hide only non-essential controls.

---

## 6) Modernization Scope by Risk

### Tier 1 - Low risk / immediate wins

- Normalize type scale and heading weights.
- Unify spacing tokens and card chrome (radius, border, shadow).
- Standardize button padding, line-height, and state colors.
- Standardize focus and validation visuals.

### Tier 2 - Medium risk

- Align toolbar layouts and section heading patterns across calculators.
- Harmonize table styles and empty-state presentations.
- Standardize help-popover wording style and tone.

### Tier 3 - Higher coordination

- Full cross-calc component library approach (shared CSS architecture).
- Optional dark mode/high-contrast mode toggles.
- Formal design system docs with visual regression checks.

---

## 7) Implementation Sequencing (recommended)

1. **Token pass per calculator** (no layout changes).
2. **Buttons + inputs state pass** (focus, validation, disabled).
3. **Card/table consistency pass**.
4. **Heading/spacing harmonization** (excluding intentionally distinct areas).
5. **Accessibility audit + print verification**.

---

## 8) Non-goals (for now)

- No heavy animation redesign.
- No radical structural UI rewrite.
- No dependency on external design frameworks.
- No behavior changes unless explicitly approved.

---

## 9) Notes for Future Suite Build

- Current strategy: calculator-local token classes with aligned values.
- Future suite strategy: move aligned tokens into shared global source when architecture is unified.

