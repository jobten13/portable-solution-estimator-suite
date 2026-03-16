# Field Hospital Calculator – Unified UX/UI Spec

This spec applies when **Load Calculator Pro**, **Consumables Calculator**, and **Medications Calculator** (and optionally the simpler **Electrical Load Calculator**) are combined as **tabs in one tool**. Standalone apps should follow the same patterns so they can be merged later with minimal rework.

---

## 1. Shell (combined app)

- **Top bar**: App title (e.g. **Field Hospital Calculator**) + **tabs**: Load Calculator Pro | Consumables | Medications (or: Electrical | Consumables | Medications, depending on naming).
- **Active tab**: Clear selected state; panel content below.
- **Single scrollable area** per panel; no nested scrolling unless necessary.

---

## 2. Per-tab layout (same order everywhere)

Each tab uses the same **vertical structure** so switching tabs feels familiar:

| Zone | Purpose | Shared across tabs? |
|------|---------|---------------------|
| **Banner** | App name + tab subtitle | Yes – same component |
| **Primary toolbar** | Print + main actions + Reset + Clear | Yes – same strip, same button roles |
| **Scenarios panel** | Save / Load / dropdown / Delete / Clear all / Import | Yes where scenarios exist |
| **Main content** | Tab-specific (equipment table, consumables list, deployment params) | Structure similar; content different |
| **Footer** | Disclaimer | Yes – same style |

---

## 3. Banner (visual + functional)

- **One component** used in every tab.
- **Structure**: `header.banner` → `h1.banner-title` + `p.banner-subtitle`.
- **Content**:
  - **Title**: Always **Field Hospital Calculator**.
  - **Subtitle**: Tab name, e.g. **Load Calculator Pro** | **Consumables Supply List** | **Medications Supply List**.
- **Style**: Same blue gradient, white text, padding, centered. Print: white background, black text.
- **Class names**: Use `.banner`, `.banner-title`, `.banner-subtitle` everywhere so one shared stylesheet can style all tabs.

---

## 4. Primary toolbar

- **Position**: Directly under the banner; full-width strip, light background, bottom border.
- **Content order** (left to right or wrap):
  1. **Print** (always first).
  2. Tab-specific primary actions (e.g. Load list, Upload file).
  3. **Reset-type** button (Reset all Qtys to Zero / Reset Quantities).
  4. **Clear-type** button (Clear Sheet / Clear all Items / Full Sheet Reset).
- **Style**: Same button classes so colors and size match across tabs (see §6).

---

## 5. Scenarios panel (where applicable)

- **When**: Used in Load Calculator Pro, Consumables, Medications (and Electrical if it has save/load).
- **Placement**: Below the primary toolbar, above the main content.
- **Layout**: One block with a short label (e.g. **Scenarios**) and:
  - **Save Scenario**
  - **Dropdown**: “— Select scenario to load —” (same placeholder text)
  - **Load Scenario**
  - **Delete Scenario**
  - **Clear all Scenarios**
  - **Import from file** (or “Upload scenario file” where that’s the only import)
- **Visual**: Slight background (e.g. `#f8f9fa`), padding, optional top border so it reads as one “Scenarios” block.
- **Behavior**: Same semantics everywhere: Save adds to list (prompt for name if needed), Load loads selected from dropdown, Delete/Clear all manage the list, Import loads from file. No tab should use a different pattern for “save/load scenario.”

---

## 6. Button roles and colors (shared)

Use the **same classes and colors** in every tab so users recognize actions:

| Role | Class | Color | Use for |
|------|--------|--------|---------|
| Print | `.btn-print` | Blue `#2563eb` | Print |
| Save / Load scenario | `.btn-save`, `.btn-load` | Green `#10b981` | Save Scenario, Load Scenario |
| Delete / Reset | `.btn-delete` | Amber `#f59e0b` | Delete Scenario, Reset all Qtys to Zero, Reset Quantities |
| Clear / Destructive | `.btn-clear` | Red `#ef4444` | Clear Sheet, Clear all Scenarios, Clear all Items, Full Sheet Reset |
| Primary action | `.btn-primary` | Blue | Upload Excel, primary CTA |
| Secondary | `.btn-secondary` | Gray | Import from file |
| UCD / list load | `.btn-ucd` | Dark blue + gold | UCD Medications List, UCD Ward List, UCD ICU List |

- Same padding, border-radius, hover state across tabs.
- Icons (e.g. 🖨️ 📁) optional but consistent if used.

---

## 7. Main content area

- **Load Calculator Pro**: Table-note (if any) + main-grid (categories column + sidebar cards). Collapsible categories; same card style for summary/capacity/runtime.
- **Consumables / Medications**: Sections with clear h3 (e.g. Load list, Deployment parameters, Scenarios, Inventory). Same section spacing and card style for highlight sections (e.g. deployment params).
- **Electrical Load (simpler)**: Same grid idea as Load Calc Pro (categories + sidebar); can share the same card and table styles.
- Use the same **spacing scale** (e.g. 8, 12, 16, 24 px), **card border-radius**, and **label/value** typography so sidebars and summary blocks feel like one family.

---

## 8. Footer / disclaimer

- One **footer.disclaimer** style: small text, muted color, same copy pattern (“simplified estimator… verify with qualified…”).
- Shown in Load Calc and Electrical tabs; optional in Consumables/Medications if not needed.

---

## 9. Functional continuity (same concepts)

- **Print**: Same behavior (window.print + same print CSS rules where possible).
- **Scenarios**: Same idea in every tab that has it – “Save current state with a name,” “Load a saved state from the list,” “Delete one,” “Clear all,” “Import from file.” Only the *data* saved (equipment rows vs consumables list vs deployment params) changes.
- **Reset vs Clear**: Same idea across tabs – “Reset” = zero out quantities or revert to defaults; “Clear” = remove items or full reset. Use the same words for the same scope (e.g. “Clear Sheet” = full clear in Load Calc Pro; “Clear all Items” = clear list in Consumables).

---

## 10. Implementation order (recommended)

1. **Define shared CSS variables and one “shell” stylesheet** for banner, toolbar, scenario panel, buttons, cards, footer.
2. **Align Load Calc Pro** with this spec (banner already done; toolbar + scenario panel + button classes).
3. **Align Medications/Consumables** (Medicines Calc and UberCalc consumables panel): same banner classes, same toolbar order, same scenario block layout and button classes.
4. **Align Electrical Load** (Load Calc Basic): same banner, same toolbar + scenario pattern, same button colors.
5. **Build or refine the tabbed shell** so it only switches panel content and subtitle; banner and (if desired) a single toolbar or scenario block can be shared or duplicated per tab with the same markup/CSS.

Once this is in place, a user moving from tab to tab will see the same **banner**, **toolbar pattern**, **scenario block**, and **button colors**, and can get to work quickly without relearning where Print, Save, Load, and Clear live.

---

## 11. Section-level help (tooltips)

Use this pattern for contextual help: **hover** for a quick glance, **click** to pin the popover open. Implemented on the Water Calc; apply the same pattern on other calculators when adding help.

### Behavior
- **Hover** on the **?** button → popover shows. Mouse off (icon and popover) → popover closes after a short delay (~220 ms) so the user can move onto the popover to read.
- **Click** **?** → that section’s popover is **pinned** open (stays open; others close). Click the same **?** again or click outside → unpin and close all.

### HTML
- **Heading row**: `<div class="section-heading-row">` with `<h3>Section title</h3>` and `<button type="button" class="help-icon" aria-label="Help for this section" data-help="section-id">?</button>`.
- **Popover**: `<div class="help-popover" id="help-popover-{section-id}" role="tooltip" hidden>` with a `<ul>` of short bullet points. Match `data-help` to the popover `id` (e.g. `data-help="deployment"` and `id="help-popover-deployment"`).

### CSS
- **`.section-heading-row`**: flex, align center, gap 8px.
- **`.help-icon`**: Small circle (e.g. 22×22px), light blue fill, blue border/text; hover and `[aria-expanded="true"]` = solid blue, white text.
- **`.help-popover`**: Translucent — `background: rgba(241, 245, 249, 0.7);` and `backdrop-filter: blur(10px);`, semi-transparent border, padding, border-radius 8px, max-width ~420px. Hide with `[hidden]`; in print hide `.help-icon` and `.help-popover`.

### JS
- Hover: show on `mouseenter` of icon; on `mouseleave` of icon and popover, if not pinned, hide after ~220 ms; cancel timeout on `mouseenter` of popover so moving to popover keeps it visible.
- Click: toggle “pinned” (e.g. class `.pinned` on popover); if pinning, close others and show this one; if unpinning, hide. Document click → close all and unpin.

### Content
- 2–4 short bullets per section; include a “**Typical:** …” line where useful. Same concise tone across calculators.
