# Cursor Instructions — Field Hospital Calculator Suite
# CSS Scoping + Shell Path Fix
# Date: 2026-03-12
# SUPERSEDES all previous cursor instruction files — ignore any other instruction files

---

## CRITICAL RULES — READ BEFORE DOING ANYTHING

1. **NEVER touch anything inside `Backup and Restore points\`** — this folder is read-only
2. **NEVER modify any `script.js` file** — calculation logic must not be changed
3. **NEVER modify any `index.html` file inside a calc folder** — only the shell index gets one specific change in Task 1
4. **NEVER modify any data files** (`equipment-data-basic.js`, `equipment-data.js`, `consumables-lists.js`, `medications-data.js`, `water-data.js`, `guide-content.js`)
5. **Do exactly one task at a time** — stop after each task and wait
6. **Do not rename any files**
7. **If you are unsure which file to edit, stop and ask**

---

## PROJECT ROOT

All work happens inside this exact folder:
```
Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\
```

The subfolders you will work in are:
```
Calcs Final\Calcs Shell\
Calcs Final\Load Calc Pro\
Calcs Final\Consumables Calc\
Calcs Final\Medicines Calc\
Calcs Final\Water Calc\
Calcs Final\Load Calc Basic\
```

---

## TASK 1 — Fix shell file references in `Calcs Shell\index.html`

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Calcs Shell\index.html`

**What to change — Part A (near top of file, around lines 7–11):**

Find these exact lines:
```html
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Load Calc Basic/styles.css">
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Load Calc Pro/styles.css">
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Water Calc/styles.css">
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Consumables Calc/styles.css">
  <link rel="stylesheet" href="../RestorePoints/2025-02-11/Medicines Calc/styles.css">
```

Replace them with:
```html
  <link rel="stylesheet" href="../Load Calc Basic/styles.css">
  <link rel="stylesheet" href="../Load Calc Pro/styles.css">
  <link rel="stylesheet" href="../Water Calc/styles.css">
  <link rel="stylesheet" href="../Consumables Calc/styles.css">
  <link rel="stylesheet" href="../Medicines Calc/styles.css">
```

**What to change — Part B (near bottom of file, around lines 1039–1049):**

Find these exact lines:
```html
  <script src="../RestorePoints/2025-02-11/Load Calc Basic/guide-content.js"></script>
  <script src="../RestorePoints/2025-02-11/Load Calc Basic/script.js"></script>
  <script src="../RestorePoints/2025-02-11/Load Calc Pro/guide-content.js"></script>
  <script src="../RestorePoints/2025-02-11/Load Calc Pro/equipment-data.js"></script>
  <script src="../RestorePoints/2025-02-11/Load Calc Pro/script.js"></script>
  <script src="../RestorePoints/2025-02-11/Water Calc/water-data.js"></script>
  <script src="../RestorePoints/2025-02-11/Water Calc/script.js"></script>
  <script src="../RestorePoints/2025-02-11/Consumables Calc/consumables-lists.js"></script>
  <script src="../RestorePoints/2025-02-11/Consumables Calc/consumables.js"></script>
  <script src="../RestorePoints/2025-02-11/Medicines Calc/pharma-lists.js"></script>
  <script src="../RestorePoints/2025-02-11/Medicines Calc/script.js"></script>
```

Replace them with:
```html
  <script src="../Load Calc Basic/guide-content.js"></script>
  <script src="../Load Calc Basic/equipment-data-basic.js"></script>
  <script src="../Load Calc Basic/script.js"></script>
  <script src="../Load Calc Pro/guide-content.js"></script>
  <script src="../Load Calc Pro/equipment-data.js"></script>
  <script src="../Load Calc Pro/script.js"></script>
  <script src="../Water Calc/water-data.js"></script>
  <script src="../Water Calc/script.js"></script>
  <script src="../Consumables Calc/consumables-lists.js"></script>
  <script src="../Consumables Calc/consumables.js"></script>
  <script src="../Medicines Calc/medications-data.js"></script>
  <script src="../Medicines Calc/script.js"></script>
```

**Do not change anything else in this file.**

**STOP. Do not proceed to Task 2 until told to.**

---

## TASK 2 — Scope Load Calc Pro CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Load Calc Pro\styles.css`

**Rules for this task:**
- The scope class is `.load-pro-calc`
- Delete the bare `* { box-sizing: border-box; }` block entirely
- Delete the bare `body { ... }` block entirely
- Convert `:root { ... }` to `.load-pro-calc { ... }` — do NOT delete it, the CSS variables inside are used throughout
- Prefix every other selector with `.load-pro-calc ` (with a space after)
- For comma-separated selectors like `h1, h2, h3 { }` prefix each part: `.load-pro-calc h1, .load-pro-calc h2, .load-pro-calc h3 { }`
- For selectors inside `@media` blocks, prefix each selector inside the block — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or the animation step selectors inside them (`from`, `to`, `0%` etc)
- Do not change any property values
- Do not rename the file

**STOP. Do not proceed to Task 3 until told to.**

---

## TASK 3 — Scope Consumables CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Consumables Calc\styles.css`

**Rules for this task:**
- The scope class is `.cons-calc`
- Delete the bare `* { ... }` block entirely
- Delete the bare `body { ... }` block entirely
- Convert `:root { ... }` to `.cons-calc { ... }` — do NOT delete it, the CSS variables inside are used throughout
- Prefix every other selector with `.cons-calc ` (with a space after)
- For comma-separated selectors, prefix each part individually
- For selectors inside `@media` blocks, prefix each selector inside the block — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or the animation step selectors inside them
- Do not change any property values
- Do not rename the file

**STOP. Do not proceed to Task 4 until told to.**

---

## TASK 4 — Scope Medicines CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Medicines Calc\styles.css`

**Rules for this task:**
- The scope class is `.meds-calc`
- Delete the bare `* { ... }` block entirely
- Delete the bare `body { ... }` block entirely
- If there is a `:root { ... }` block, convert it to `.meds-calc { ... }` — do NOT delete it
- If there is no `:root` block, skip that step
- Prefix every other selector with `.meds-calc ` (with a space after)
- For comma-separated selectors, prefix each part individually
- For selectors inside `@media` blocks, prefix each selector inside the block — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or the animation step selectors inside them
- Do not change any property values
- Do not rename the file

**STOP. Do not proceed to Task 5 until told to.**

---

## TASK 5 — Scope Water CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Water Calc\styles.css`

**Rules for this task:**
- The scope class is `.water-calc`
- Delete the bare `* { ... }` block entirely
- Delete the bare `body { ... }` block entirely
- If there is a `:root { ... }` block, convert it to `.water-calc { ... }` — do NOT delete it
- If there is no `:root` block, skip that step
- Find any rule that sets `min-height: 100vh` on a container — change it to `min-height: auto`
- Prefix every other selector with `.water-calc ` (with a space after)
- For comma-separated selectors, prefix each part individually
- For selectors inside `@media` blocks, prefix each selector inside the block — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or the animation step selectors inside them
- Do not change any property values except the `min-height` change noted above
- Do not rename the file

**STOP. Do not proceed to Task 6 until told to.**

---

## TASK 6 — Scope Load Calc Basic CSS

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Load Calc Basic\styles.css`

**Rules for this task:**
- The scope class is `.load-basic-calc`
- Delete the bare `* { ... }` block entirely
- Delete the bare `body { ... }` block entirely
- If there is a `:root { ... }` block, convert it to `.load-basic-calc { ... }` — do NOT delete it
- Prefix every other selector with `.load-basic-calc ` (with a space after)
- For comma-separated selectors, prefix each part individually
- For selectors inside `@media` blocks, prefix each selector inside the block — do NOT prefix the `@media` line itself
- Do NOT prefix `@keyframes` selectors or the animation step selectors inside them
- Do not change any property values
- Do not rename the file

**STOP. All tasks complete. Do not do anything else.**

---

## VERIFICATION AFTER ALL TASKS

After all tasks are done, open this file in a browser:
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Calcs Shell\index.html`

Click each calculator tab and confirm it displays with full styling and correct layout.
