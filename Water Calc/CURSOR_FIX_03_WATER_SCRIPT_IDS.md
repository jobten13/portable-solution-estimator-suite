# CURSOR FIX 03 — Water Calc: Prefix IDs in script.js setup() function

## Problem
In `Water Calc/script.js`, the `setup()` function wires input event listeners using
unprefixed IDs like `'days'`, `'beds'`, `'buffer'` etc. Since `g()` is a plain
`getElementById` with no prefix logic, these lookups return `null` in the Shell
(where all IDs are `water-days`, `water-beds` etc). No listeners are attached,
so inputs never trigger `recalc()` and Estimated Totals never update.

## Fix
In `Water Calc/script.js`, find and replace these two arrays in the `setup()` function.

Do NOT change anything else. Do NOT touch index.html. Do NOT touch data files.

---

### Change 1 — number inputs array (around line 851)

FIND:
```js
    ['days', 'beds', 'buffer', 'potable-count', 'potable-capacity', 'wastewater-count', 'wastewater-capacity', 'mains-flow-rate'].forEach(id => {
```

REPLACE WITH:
```js
    ['water-days', 'water-beds', 'water-buffer', 'water-potable-count', 'water-potable-capacity', 'water-wastewater-count', 'water-wastewater-capacity', 'water-mains-flow-rate'].forEach(id => {
```

---

### Change 2 — also fix the broken blur condition on the same line inside that loop (around line 855)

FIND:
```js
        if (id === 'water-mains-flow-rate') el.addEventListener('blur', () => validateAndShow('water-mains-flow-rate'));
```

This condition was already using the prefixed name but the loop ids were unprefixed, so it never matched. Now that the loop ids are prefixed this will work correctly. No change needed here — it's already correct.

---

### Change 3 — water rate inputs array (around line 860)

FIND:
```js
    ['potable-rate', 'wastewater-rate'].forEach(id => {
```

REPLACE WITH:
```js
    ['water-potable-rate', 'water-wastewater-rate'].forEach(id => {
```

---

### Change 4 — supply/disposal mode selects (around line 968)

FIND:
```js
    ['potable-supply-mode', 'wastewater-disposal-mode'].forEach(id => {
```

REPLACE WITH:
```js
    ['water-potable-supply-mode', 'water-wastewater-disposal-mode'].forEach(id => {
```

---

## After making changes

1. Save `Water Calc/script.js`
2. Stop server (Ctrl+C), restart: `python -m http.server 8080`
3. Hard refresh: Ctrl+Shift+R
4. Test: `http://localhost:8080/Calcs%20Shell/index.html`
5. Go to Water calc tab
6. Enter values in Days and Beds — Estimated Totals should update live
7. If working: `git add "Water Calc/script.js"` → `git commit -m "fix: prefix Water Calc script.js input IDs to match Shell HTML"`
