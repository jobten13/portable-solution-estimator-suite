# Cursor Fix Instructions — Export CSV Bug
# Date: 2026-03-15
# SUPERSEDES any previous fix instructions for this issue

---

## CRITICAL RULES — READ BEFORE DOING ANYTHING

1. **NEVER touch anything inside `Backup and Restore points\`** — this folder is read-only
2. **NEVER modify any data files** (`equipment-data-basic.js`, `equipment-data.js`, `consumables-lists.js`, `medications-data.js`, `water-data.js`, `guide-content.js`)
3. **Do exactly one task at a time** — stop after each task and wait
4. **Do not rename any files**
5. **Only change what is explicitly listed — nothing else**
6. **If you are unsure which file to edit, stop and ask**

---

## PROJECT ROOT

All work happens inside this exact folder:
```
Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\
```

---

## BACKGROUND

The export format dialog radio buttons in the shell HTML use prefixed `name` attributes
(e.g. `name="cons-export-format"`), but the scripts query for the unprefixed
`name="export-format"`. This mismatch means the selected format is never found
and the export always falls back to JSON regardless of what the user selects.

Water Calc is NOT affected — do not touch it.

---

## TASK 1 — Fix export format in `Consumables Calc\consumables.js`

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Consumables Calc\consumables.js`

**Make these exact string replacements — change only these strings, nothing else:**

| Find | Replace with |
|------|-------------|
| `input[name="export-format"]:checked` | `input[name="cons-export-format"]:checked` |
| `input[name="export-format"][value="JSON"]` | `input[name="cons-export-format"][value="JSON"]` |

**Do not change any calculation logic, variable names, or anything else.**

**STOP. Do not proceed to Task 2 until told to.**

---

## TASK 2 — Fix export format in `Medicines Calc\script.js`

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Medicines Calc\script.js`

**Make these exact string replacements:**

| Find | Replace with |
|------|-------------|
| `input[name="export-format"]:checked` | `input[name="meds-export-format"]:checked` |
| `input[name="export-format"][value="JSON"]` | `input[name="meds-export-format"][value="JSON"]` |

**Do not change any calculation logic, variable names, or anything else.**

**STOP. Do not proceed to Task 3 until told to.**

---

## TASK 3 — Fix export format in `Load Calc Basic\script.js`

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Load Calc Basic\script.js`

**Make these exact string replacements:**

| Find | Replace with |
|------|-------------|
| `input[name="export-format"]:checked` | `input[name="load-export-format"]:checked` |
| `input[name="export-format"][value="JSON"]` | `input[name="load-export-format"][value="JSON"]` |

**Do not change any calculation logic, variable names, or anything else.**

**STOP. Do not proceed to Task 4 until told to.**

---

## TASK 4 — Fix export format in `Load Calc Pro\script.js`

**File to edit:**
`Desktop\IMPACTS Project\PoP 3\Load Calc\Claude\Calcs Final\Load Calc Pro\script.js`

**Make these exact string replacements:**

| Find | Replace with |
|------|-------------|
| `input[name="export-format"]:checked` | `input[name="load-pro-export-format"]:checked` |
| `input[name="export-format"][value="JSON"]` | `input[name="load-pro-export-format"][value="JSON"]` |

**Do not change any calculation logic, variable names, or anything else.**

**STOP. All tasks complete. Do not do anything else.**

---

## VERIFICATION AFTER ALL TASKS

For each of the four calculators (Consumables, Medicines, Load Basic, Load Pro):
1. Open the shell in Chrome via `http://localhost:8080/Calcs Shell/index.html`
2. Navigate to the calculator tab
3. Click Export, select CSV, confirm
4. Verify the downloaded file has a `.csv` extension and contains comma-separated values, not JSON
