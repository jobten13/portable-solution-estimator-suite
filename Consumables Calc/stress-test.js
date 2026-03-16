/**
 * Consumables Calc – stress test (run with Node.js)
 * Tests the same quantity formula and edge cases without the DOM.
 * Run: node stress-test.js
 */

const fs = require('fs');
const path = require('path');

// Same formula as consumables.js
function calculateItemQuantity(usagePerDayPerBed, deploymentDays, deploymentBeds, bufferPercentage) {
  const baseQuantity = deploymentDays * deploymentBeds * usagePerDayPerBed;
  const bufferMultiplier = 1 + (bufferPercentage / 100);
  return baseQuantity * bufferMultiplier;
}

// Load Ward list from consumables-lists.js (extract first array)
function loadWardItems() {
  const filePath = path.join(__dirname, 'consumables-lists.js');
  let code = fs.readFileSync(filePath, 'utf8');
  // Get UCD_WARD_ITEMS: find "var UCD_WARD_ITEMS = " and extract array (match brackets)
  const start = code.indexOf('var UCD_WARD_ITEMS = ');
  if (start === -1) return [];
  let depth = 0;
  let i = code.indexOf('[', start);
  const begin = i;
  for (; i < code.length; i++) {
    if (code[i] === '[') depth++;
    else if (code[i] === ']') {
      depth--;
      if (depth === 0) return JSON.parse(code.slice(begin, i + 1));
    }
  }
  return [];
}

const wardItems = loadWardItems();
console.log('Loaded', wardItems.length, 'Ward items');

const scenarios = [
  { name: 'All zeros', days: 0, beds: 0, buffer: 0 },
  { name: 'Zero days', days: 0, beds: 40, buffer: 10 },
  { name: 'Zero beds', days: 14, beds: 0, buffer: 0 },
  { name: 'Typical small', days: 7, beds: 20, buffer: 5 },
  { name: 'Typical', days: 14, beds: 40, buffer: 10 },
  { name: 'Large deployment', days: 90, beds: 100, buffer: 15 },
  { name: 'Max buffer', days: 30, beds: 50, buffer: 100 },
  { name: 'Decimal buffer', days: 14, beds: 40, buffer: 12.5 },
  { name: 'Stress: high numbers', days: 365, beds: 500, buffer: 20 },
  { name: 'Stress: very high', days: 365, beds: 1000, buffer: 50 },
];

let passed = 0;
let failed = 0;

for (const s of scenarios) {
  let ok = true;
  const results = [];
  for (let i = 0; i < Math.min(wardItems.length, 5); i++) {
    const item = wardItems[i];
    const qty = calculateItemQuantity(item.usagePerDayPerBed, s.days, s.beds, s.buffer);
    const ceiled = Math.ceil(qty);
    if (qty !== qty || !isFinite(qty) || qty < 0) {
      console.log('  FAIL: NaN/Infinity/negative for', item.name, 'qty=', qty);
      ok = false;
    }
    if (ceiled < 0 || ceiled > Number.MAX_SAFE_INTEGER) {
      console.log('  FAIL: ceiled out of range', ceiled);
      ok = false;
    }
    results.push(ceiled);
  }
  // All-zero scenario: every quantity must be 0
  if (s.days === 0 || s.beds === 0) {
    const qty = calculateItemQuantity(1, s.days, s.beds, s.buffer);
    if (qty !== 0) {
      console.log('  FAIL: expected 0 when days or beds is 0, got', qty);
      ok = false;
    }
  }
  if (ok) {
    passed++;
    console.log('OK', s.name, 'sample totals:', results.join(', '));
  } else {
    failed++;
    console.log('FAIL', s.name);
  }
}

// Full list run (performance + no NaN)
const big = { days: 30, beds: 100, buffer: 10 };
const startTime = Date.now();
let totalSum = 0;
for (const item of wardItems) {
  const qty = calculateItemQuantity(item.usagePerDayPerBed, big.days, big.beds, big.buffer);
  const c = Math.ceil(qty);
  if (c !== c || !isFinite(c)) {
    console.log('FAIL full list: invalid result for', item.name);
    failed++;
    break;
  }
  totalSum += c;
}
const elapsed = Date.now() - startTime;
console.log('Full list (' + wardItems.length + ' items): total quantity sum =', totalSum, 'in', elapsed, 'ms');
if (elapsed < 5000) passed++; else { console.log('WARN: full list took > 5s'); failed++; }

console.log('\n--- Result:', passed, 'passed,', failed, 'failed');
