# Export (JSON/CSV) flow: Water Calc vs Consumables Calc

**Context:** Water export works; Consumables export always downloads JSON even when CSV is selected. This file summarizes how each calc runs the export and where they differ. Use it to fix Consumables or align behavior.

**Scope:** Calcs Final folder only. Water Calc index.html and script.js; Consumables Calc index.html and consumables.js; Calcs Shell index.html where the suite embeds both.

---

## 1. The `g()` helper

| Calc        | Definition | Effect |
|-------------|------------|--------|
| **Water**   | `return document.getElementById(id);` | Uses the id you pass as-is (no prefix). |
| **Consumables** | `return document.getElementById(\`cons-${id}\`);` | Prepends `cons-` to every id. |

---

## 2. How the dialog and buttons are found

- **Water** uses fully qualified ids in script: `g('water-export-format-dialog')`, `g('water-export-format-confirm')`, etc.
- **Consumables** uses logical names; `g()` adds the prefix: `g('export-format-dialog')` → `#cons-export-format-dialog`, `g('export-format-confirm')` → `#cons-export-format-confirm`.

So both resolve to the correct elements when the HTML uses the same ids (e.g. in the Shell).

---

## 3. How the selected format is read (on Export button click)

**Water (script.js, ~942–945):**

```js
function onExportFormatConfirm() {
  const selected = document.querySelector('#water-export-format-dialog input[name="export-format"]:checked');
  const fmt = selected ? selected.value : 'JSON';
  performExportWithFormat(fmt);
  closeExportFormatDialog();
}
```

**Consumables (consumables.js, ~211–216):**

```js
exportFormatConfirm.addEventListener('click', function () {
  const selected = document.querySelector('#cons-export-format-dialog input[name="cons-export-format"]:checked');
  const fmt = (selected && selected.value) ? selected.value : 'JSON';
  performExportWithFormat(fmt);
  closeExportFormatDialog();
});
```

So:

- Water looks for: `#water-export-format-dialog input[name="export-format"]:checked`
- Consumables looks for: `#cons-export-format-dialog input[name="cons-export-format"]:checked`

---

## 4. What the HTML actually has

### Shell (Calcs Shell/index.html) – one document, all panels

- **Water panel:** `#water-export-format-dialog`, radios **`name="water-export-format"`**
- **Consumables panel:** `#cons-export-format-dialog`, radios **`name="cons-export-format"`**

So in the Shell, Consumables’ selector matches. Water’s selector uses `name="export-format"` but the Shell uses `name="water-export-format"` for Water — so in the Shell, Water’s selector would not match unless the Shell markup were different.

### Standalone pages

- **Consumables Calc/index.html:**  
  Dialog id = `cons-export-format-dialog`.  
  Radios = **`name="export-format"`** (no `cons-` prefix).

- **Water Calc/index.html:**  
  Dialog id = **`export-format-dialog`** (no `water-` prefix).  
  Radios = **`name="export-format"`**.

---

## 5. Root cause for Consumables always exporting JSON

In **Consumables Calc/index.html** (standalone), the radio inputs use **`name="export-format"`**, but **consumables.js** looks for **`name="cons-export-format"`**. So in standalone mode:

- `document.querySelector('#cons-export-format-dialog input[name="cons-export-format"]:checked')` returns **null**
- `fmt` falls back to `'JSON'`
- The file is always JSON.

So the script and the standalone HTML disagree on the radio `name`.

---

## 6. Why Water can work

In **Water Calc/index.html** (standalone), the radios use **`name="export-format"`** and the Water script also looks for **`name="export-format"`**, so the selector matches and CSV/JSON both work there. (In the Shell, Water’s dialog uses `name="water-export-format"`, so there would be a mismatch there unless the script or Shell markup is updated.)

---

## 7. Other differences (for reference)

- Water uses a named function `onExportFormatConfirm` for the confirm click; Consumables uses an inline anonymous function. Functionally equivalent.
- Opening the dialog: Water sets `dialog.hidden = false`; Consumables uses `dialog.removeAttribute('hidden')`. Both show the dialog.
- Water resets the dialog to JSON when opening: `if (jsonRadio) jsonRadio.checked = true;`. Consumables no longer does that, so the last choice is preserved.

---

## 8. Suggested fix for Consumables

Make the radio `name` consistent between HTML and script:

- **Option A:** In **Consumables Calc/index.html** (standalone), change the export-format radio inputs from `name="export-format"` to **`name="cons-export-format"`** so they match what consumables.js expects (and match the Shell).
- **Option B:** In **consumables.js**, when resolving the selected format, try both names (e.g. try `cons-export-format` first, then `export-format`) so it works in both Shell and standalone without changing data files.

Do not change files under `Backup and Restore points\`, and do not edit data files (e.g. equipment-data, medications-data, etc.) unless the fix explicitly requires it.
