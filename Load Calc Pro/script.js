/**
 * Load Calc Pro – Generator Load Estimator (kVA/kW).
 * Data-driven: categories and rows built from LOAD_CALC_PRO_EQUIPMENT.
 * Calculations: running kW/kVA, peak starting kVA (largest motor 4×), recommended kVA, capacity check, runtime.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'loadCalcProScenario';
  const STORAGE_SCENARIOS = 'loadCalcProScenarios';
  const SORT_STORAGE_KEY = 'loadCalcProSort';
  const MOTOR_START_FACTOR = 4.0;
  const CONTINUOUS_SAFETY_FACTOR = 0.8;
  const IMPORT_SCHEMA_VERSION = 1;
  let currentSortKey = 'name-asc';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function simpleMarkdownToHtml(md) {
    if (!md || typeof md !== 'string') return '';
    function inline(s) {
      return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
    }
    const lines = md.split(/\r?\n/);
    const out = [];
    let inTable = false;
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (trimmed === '' || trimmed === '---') {
        if (inTable) { out.push('</table>'); inTable = false; }
        if (inList) { out.push('</ul>'); inList = false; }
        out.push('<p></p>');
        continue;
      }
      if (trimmed.startsWith('### ')) {
        if (inTable) { out.push('</table>'); inTable = false; }
        if (inList) { out.push('</ul>'); inList = false; }
        out.push('<h3>' + inline(trimmed.slice(4)) + '</h3>');
        continue;
      }
      if (trimmed.startsWith('## ')) {
        if (inTable) { out.push('</table>'); inTable = false; }
        if (inList) { out.push('</ul>'); inList = false; }
        out.push('<h2>' + inline(trimmed.slice(3)) + '</h2>');
        continue;
      }
      if (trimmed.startsWith('# ')) {
        if (inTable) { out.push('</table>'); inTable = false; }
        if (inList) { out.push('</ul>'); inList = false; }
        out.push('<h1>' + inline(trimmed.slice(2)) + '</h1>');
        continue;
      }
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (inTable) { /* same table */ } else { out.push('<table class="guide-table">'); inTable = true; }
        if (inList) { out.push('</ul>'); inList = false; }
        const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
        const isSep = cells.every(c => /^[-:]+$/.test(c));
        if (!isSep) {
          const lastTr = out[out.length - 1] && out[out.length - 1].startsWith('<tr');
          const tag = !lastTr ? 'th' : 'td';
          out.push('<tr>' + cells.map(c => '<' + tag + '>' + inline(c) + '</' + tag + '>').join('') + '</tr>');
        }
        continue;
      }
      if (inTable) { out.push('</table>'); inTable = false; }
      if (trimmed.startsWith('- ')) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push('<li>' + inline(trimmed.slice(2)) + '</li>');
        continue;
      }
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<p>' + inline(trimmed) + '</p>');
    }
    if (inTable) out.push('</table>');
    if (inList) out.push('</ul>');
    return out.join('');
  }

  function formatNum(n, decimals = 2) {
    return parseFloat(n).toFixed(decimals);
  }

  // --- Input validation ---
  const SIDEBAR_RULES = {
    'load-pro-available-kva': { min: 0, max: 100000, message: 'kVA must be between 0 and 100,000' },
    'load-pro-fuel-capacity': { min: 0, max: 1000000, message: 'Fuel capacity must be between 0 and 1,000,000' },
    'load-pro-fuel-rate-per-kw': { min: 0, max: 2, message: 'Rate must be between 0 and 2' }
  };

  function getFuelCapacityGallons() {
    const el = $('#load-pro-fuel-capacity');
    if (!el) return 0;
    const val = parseFloat(el.value) || 0;
    return val;
  }

  function getFuelRateGalPerKw() {
    const el = $('#load-pro-fuel-rate-per-kw');
    if (!el) return 0;
    const val = parseFloat(el.value) || 0;
    return val;
  }

  function validateSidebarInput(id) {
    if (id === 'load-pro-fuel-capacity') {
      const capacityGal = getFuelCapacityGallons();
      if (capacityGal < 0) return { valid: false, message: 'Enter a valid number' };
      if (capacityGal > 1000000) return { valid: false, message: SIDEBAR_RULES['load-pro-fuel-capacity'].message };
      return { valid: true };
    }
    if (id === 'load-pro-fuel-rate-per-kw') {
      const rateGal = getFuelRateGalPerKw();
      if (rateGal < 0) return { valid: false, message: 'Enter a valid number' };
      if (rateGal > 2) return { valid: false, message: SIDEBAR_RULES['load-pro-fuel-rate-per-kw'].message };
      return { valid: true };
    }
    const el = $(`#${id}`);
    if (!el) return { valid: true };
    const rule = SIDEBAR_RULES[id];
    if (!rule) return { valid: true };
    const value = el.value.trim();
    if (value === '') return { valid: true };
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, message: 'Enter a valid number' };
    if (num < rule.min || num > rule.max) return { valid: false, message: rule.message };
    return { valid: true };
  }

  function validateEquipmentInput(input) {
    if (!input) return { valid: true };
    const cls = input.classList;
    if (cls.contains('qty-input')) {
      const v = parseFloat(input.value);
      if (input.value.trim() !== '' && (isNaN(v) || v < 0 || !Number.isInteger(v))) return { valid: false, message: 'Qty must be a whole number ≥ 0' };
      return { valid: true };
    }
    if (cls.contains('kw-input')) {
      const v = parseFloat(input.value);
      if (input.value.trim() !== '' && (isNaN(v) || v < 0)) return { valid: false, message: 'kW must be ≥ 0' };
      return { valid: true };
    }
    if (cls.contains('pf-input')) {
      const v = parseFloat(input.value);
      if (input.value.trim() !== '' && (isNaN(v) || v < 0.01 || v > 1)) return { valid: false, message: 'PF must be between 0.01 and 1' };
      return { valid: true };
    }
    return { valid: true };
  }

  function showValidationError(el, message) {
    if (!el) return;
    el.classList.add('input-error');
    const field = el.closest('.field');
    const cell = el.closest('td');
    const container = field || cell;
    if (container) {
      let err = container.querySelector('.validation-error');
      if (!err) {
        err = document.createElement('small');
        err.className = 'validation-error';
        container.appendChild(err);
      }
      err.textContent = message;
      err.style.display = 'block';
    }
  }

  function clearValidationError(el) {
    if (!el) return;
    el.classList.remove('input-error');
    const field = el.closest('.field');
    const cell = el.closest('td');
    const container = field || cell;
    if (container) {
      const err = container.querySelector('.validation-error');
      if (err) err.style.display = 'none';
    }
  }

  function validateAndShowSidebar(id) {
    const el = $(`#${id}`);
    const result = validateSidebarInput(id);
    if (result.valid) clearValidationError(el);
    else showValidationError(el, result.message);
    return result.valid;
  }

  function validateAndShowEquipment(input) {
    const result = validateEquipmentInput(input);
    if (result.valid) clearValidationError(input);
    else showValidationError(input, result.message);
    return result.valid;
  }

  // --- Build DOM from equipment data ---
  function buildCategories() {
    const col = $('#load-pro-categories-column');
    if (!col || typeof LOAD_CALC_PRO_EQUIPMENT === 'undefined') return;

    col.innerHTML = '';
    for (const [catId, config] of Object.entries(LOAD_CALC_PRO_EQUIPMENT)) {
      const section = document.createElement('div');
      section.className = 'category';
      section.id = catId;
      section.innerHTML = `
        <div class="category-header">
          <div class="category-title">
            <span class="chevron" aria-hidden="true">▼</span>
            <span>${escapeHtml(config.title)}</span>
          </div>
          <div class="category-actions">
            <button type="button" class="btn btn-sm" data-reset-target="${catId}">Reset Qty</button>
            ${config.badge ? `<span class="badge badge-info">${escapeHtml(config.badge)}</span>` : ''}
          </div>
        </div>
        <div class="category-body">
          <div class="custom-form" data-cat="${catId}">
            <input type="text" class="custom-name" placeholder="Item name">
            <input type="number" class="custom-kw" min="0" step="0.01" placeholder="kW">
            <input type="number" class="custom-pf" min="0.01" max="1" step="0.01" value="1" placeholder="PF">
            <input type="number" class="custom-qty" min="0" step="1" placeholder="Qty">
            <button type="button" class="add-custom-btn">Add</button>
          </div>
          <table class="equipment-table">
            <thead>
              <tr>
                <th style="width:30%">Item</th>
                <th>Qty</th>
                <th class="num kw-cell">kW each</th>
                <th class="num pf-cell">PF</th>
                <th class="num">kW total</th>
                <th class="kva-peak-cell">kVA Peak</th>
                <th class="col-delete"></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      `;
      const tbody = section.querySelector('tbody');
      config.items.forEach(({ name, kw, pf }) => {
        const tr = document.createElement('tr');
        tr.className = 'equipment-row';
        tr.innerHTML = `
          <td>${escapeHtml(name)}</td>
          <td><input type="number" min="0" step="1" value="" placeholder="0" class="qty-input"></td>
          <td class="kw-cell"><input type="number" step="0.01" min="0" value="${kw}" class="kw-input" data-original-kw="${kw}"></td>
          <td class="pf-cell"><input type="number" min="0.01" max="1" step="0.01" value="${pf}" class="pf-input" data-original-pf="${pf}"></td>
          <td class="num item-kw-total">0.00</td>
          <td class="kva-peak-cell item-kva-peak">0.00</td>
          <td class="col-delete"><button type="button" class="btn-icon delete-row">✕</button></td>
        `;
        tbody.appendChild(tr);
      });
      col.appendChild(section);
    }
    $$('.qty-input').forEach(inp => { inp.value = ''; });
    attachRowHandlers(document);
    initCustomForms();
  }

  function setupPlaceholderBehavior(input) {
    if (!input) return;
    input.addEventListener('focus', function() {
      const v = this.value.trim();
      if (v === '' || v === '0' || v === '0.0') {
        this.value = '';
      }
      this.select();
    });
    input.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.value = '';
      }
    });
  }

  function attachRowHandlers(root) {
    $$('.equipment-row .qty-input, .equipment-row .kw-input, .equipment-row .pf-input', root).forEach(input => {
      input.removeEventListener('input', onRecalc);
      input.addEventListener('input', onRecalc);
      input.removeEventListener('blur', onEquipmentBlur);
      input.addEventListener('blur', onEquipmentBlur);
      setupPlaceholderBehavior(input);
    });
    $$('.equipment-row .delete-row', root).forEach(btn => {
      btn.removeEventListener('click', onDeleteRow);
      btn.addEventListener('click', onDeleteRow);
    });
  }

  function onEquipmentBlur(e) {
    validateAndShowEquipment(e.target);
  }

  function onRecalc() { recalc(); }

  function filterEquipmentSearch() {
    const searchEl = $('#load-pro-search-equipment');
    const term = (searchEl && searchEl.value.trim()) ? searchEl.value.toLowerCase().trim() : '';
    $$('.equipment-row').forEach(row => {
      if (!term) {
        row.classList.remove('search-hidden');
        return;
      }
      const name = getRowSortName(row).toLowerCase();
      if (name.includes(term)) {
        row.classList.remove('search-hidden');
      } else {
        row.classList.add('search-hidden');
      }
    });
    const hiddenCount = document.querySelectorAll('.equipment-row.search-hidden').length;
    const filterNotice = document.getElementById('load-pro-filter-notice');
    if (filterNotice) {
      if (hiddenCount > 0) {
        filterNotice.textContent = `ℹ Filtered-view subtotals shown below; all-items totals remain authoritative (${hiddenCount} item${hiddenCount !== 1 ? 's' : ''} hidden).`;
        filterNotice.style.display = 'block';
      } else {
        filterNotice.style.display = 'none';
      }
    }
    recalc();
  }

  // --- Sorting functions ---
  function getRowSortName(row) {
    const td = row.querySelector('td');
    return (td && td.textContent.trim()) || '';
  }

  function getRowSortKw(row) {
    const totalEl = row.querySelector('.item-kw-total');
    if (!totalEl) return 0;
    return parseFloat(totalEl.textContent) || 0;
  }

  function getRowSortKvaPeak(row) {
    const peakEl = row.querySelector('.item-kva-peak');
    if (!peakEl) return 0;
    return parseFloat(peakEl.textContent) || 0;
  }

  function applySort() {
    const active = document.activeElement;
    const wasQtyInput = active && active.classList && active.classList.contains('qty-input');
    const selStart = wasQtyInput ? active.selectionStart : 0;
    const selEnd = wasQtyInput ? active.selectionEnd : 0;

    const sel = $('#load-pro-sort-equipment');
    const key = (sel && sel.value) || currentSortKey;
    currentSortKey = key;
    $$('.category').forEach(cat => {
      const tbody = cat.querySelector('.equipment-table tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.querySelectorAll('.equipment-row'));
      rows.sort((a, b) => {
        if (key === 'name-asc') return getRowSortName(a).localeCompare(getRowSortName(b));
        if (key === 'name-desc') return getRowSortName(b).localeCompare(getRowSortName(a));
        const kwA = getRowSortKw(a);
        const kwB = getRowSortKw(b);
        if (key === 'kw-desc') return kwB - kwA;
        if (key === 'kw-asc') return kwA - kwB;
        const kvaPeakA = getRowSortKvaPeak(a);
        const kvaPeakB = getRowSortKvaPeak(b);
        if (key === 'kva-peak-desc') return kvaPeakB - kvaPeakA;
        if (key === 'kva-peak-asc') return kvaPeakA - kvaPeakB;
        return 0;
      });
      rows.forEach(r => tbody.appendChild(r));
    });

    if (wasQtyInput && active && active.closest('.equipment-table')) {
      active.focus();
      if (typeof active.setSelectionRange === 'function') active.setSelectionRange(selStart, selEnd);
    }
  }

  function onSortChange() {
    const sel = $('#load-pro-sort-equipment');
    if (sel) {
      currentSortKey = sel.value;
      try { localStorage.setItem(SORT_STORAGE_KEY, currentSortKey); } catch (e) {}
      applySort();
    }
  }
  function onDeleteRow(e) {
    const row = e.target.closest('.equipment-row');
    if (!row) return;
    const nameCell = row.querySelector('td:first-child');
    const name = nameCell ? nameCell.textContent.trim() : 'this row';
    if (!confirm(`Delete "${name}" from the list?`)) return;
    row.remove();
    recalc();
  }

  function initCustomForms() {
    $$('.custom-form').forEach(form => {
      const catId = form.getAttribute('data-cat');
      const nameIn = form.querySelector('.custom-name');
      const kwIn = form.querySelector('.custom-kw');
      const pfIn = form.querySelector('.custom-pf');
      const qtyIn = form.querySelector('.custom-qty');
      const addBtn = form.querySelector('.add-custom-btn');
      if (!addBtn) return;
      addBtn.onclick = () => {
        clearValidationError(nameIn);
        clearValidationError(kwIn);
        clearValidationError(pfIn);
        clearValidationError(qtyIn);
        const name = (nameIn && nameIn.value || '').trim();
        const kw = parseFloat(kwIn && kwIn.value);
        const pf = parseFloat(pfIn && pfIn.value);
        const qty = parseInt(qtyIn && qtyIn.value, 10);
        if (!name) {
          showValidationError(nameIn, 'Enter an item name.');
          return;
        }
        if (isNaN(kw) || kw < 0) {
          showValidationError(kwIn, 'kW must be a number ≥ 0.');
          return;
        }
        if (isNaN(pf) || pf < 0.01 || pf > 1) {
          showValidationError(pfIn, 'Power factor must be between 0.01 and 1.');
          return;
        }
        if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
          showValidationError(qtyIn, 'Quantity must be a whole number ≥ 0.');
          return;
        }
        addCustomRow(catId, name, kw, pf, qty);
        if (nameIn) nameIn.value = '';
        if (kwIn) kwIn.value = '';
        if (pfIn) pfIn.value = '1';
        if (qtyIn) qtyIn.value = '';
      };
    });
  }

  function addCustomRow(catId, name, kw, pf, qty) {
    const tbody = $(`#${catId} tbody`);
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.className = 'equipment-row custom';
    tr.innerHTML = `
      <td>${escapeHtml(name)}</td>
      <td><input type="number" min="0" step="1" value="${qty || ''}" placeholder="0" class="qty-input"></td>
      <td class="kw-cell"><input type="number" step="0.01" min="0" value="${kw}" class="kw-input" data-original-kw="${kw}"></td>
      <td class="pf-cell"><input type="number" min="0.01" max="1" step="0.01" value="${pf}" class="pf-input" data-original-pf="${pf}"></td>
      <td class="num item-kw-total">0.00</td>
      <td class="kva-peak-cell item-kva-peak">0.00</td>
      <td class="col-delete"><button type="button" class="btn-icon delete-row">✕</button></td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
    attachRowHandlers(tr);
    recalc();
  }

  // --- Core calculation ---
  function recalc() {
    let totalKw = 0;
    let totalKva = 0;
    let filteredKw = 0;
    let filteredKva = 0;
    let largestMotorStartingKva = 0;
    let largestMotorRow = null;

    $$('.equipment-row').forEach(row => {
      const qtyIn = row.querySelector('.qty-input');
      const kwIn = row.querySelector('.kw-input');
      const pfIn = row.querySelector('.pf-input');
      const kwTotalEl = row.querySelector('.item-kw-total');
      const kvaPeakEl = row.querySelector('.item-kva-peak');

      const qty = parseFloat(qtyIn && qtyIn.value) || 0;
      const kwEach = parseFloat(kwIn && kwIn.value) || 0;
      const pfEach = parseFloat(pfIn && pfIn.value) > 0 ? parseFloat(pfIn.value) : 1;

      const kvaEach = kwEach / pfEach;
      const itemKw = qty * kwEach;
      const itemKva = qty * kvaEach;
      totalKw += itemKw;
      totalKva += itemKva;
      if (!row.classList.contains('search-hidden')) {
        filteredKw += itemKw;
        filteredKva += itemKva;
      }

      if (kwTotalEl) kwTotalEl.textContent = formatNum(itemKw);

      const isInductive = pfEach < 0.95 && kwEach > 0.1;
      let itemPeakKva = itemKva;
      if (isInductive && qty > 0) {
        const kvaOneStart = kvaEach * MOTOR_START_FACTOR;
        itemPeakKva = qty === 1 ? kvaOneStart : kvaOneStart + (qty - 1) * kvaEach;
      }
      if (kvaPeakEl) kvaPeakEl.textContent = formatNum(itemPeakKva);

      const singleUnitStartKva = isInductive ? kvaEach * MOTOR_START_FACTOR : kvaEach;
      if (qty > 0 && singleUnitStartKva > largestMotorStartingKva) {
        largestMotorStartingKva = singleUnitStartKva;
        largestMotorRow = row;
      }
    });

    let totalKvaExcludingLargest = 0;
    $$('.equipment-row').forEach(row => {
      const qtyIn = row.querySelector('.qty-input');
      const kwIn = row.querySelector('.kw-input');
      const pfIn = row.querySelector('.pf-input');
      const qty = parseFloat(qtyIn && qtyIn.value) || 0;
      const kwEach = parseFloat(kwIn && kwIn.value) || 0;
      const pfEach = parseFloat(pfIn && pfIn.value) > 0 ? parseFloat(pfIn.value) : 1;
      const kvaEach = kwEach / pfEach;
      if (row !== largestMotorRow) {
        totalKvaExcludingLargest += qty * kvaEach;
      } else {
        totalKvaExcludingLargest += (qty > 0 ? qty - 1 : 0) * kvaEach;
      }
    });

    let peakKva = totalKvaExcludingLargest + (largestMotorRow ? largestMotorStartingKva : 0);
    if (totalKw === 0) peakKva = 0;
    if (peakKva < totalKva) peakKva = totalKva;

    const recommendedKva = totalKva / CONTINUOUS_SAFETY_FACTOR;
    const finalRecommendedKva = Math.max(peakKva, recommendedKva);

    const availableKva = parseFloat($('#load-pro-available-kva').value) || 0;
    const kvaMargin = availableKva - totalKva;

    const fuelGal = getFuelCapacityGallons();
    const ratePerKw = getFuelRateGalPerKw();
    let runtime = 0;
    if (totalKw > 0 && fuelGal > 0 && ratePerKw > 0) {
      runtime = fuelGal / (totalKw * ratePerKw);
    }

    $('#load-pro-total-kw').textContent = formatNum(totalKw);
    $('#load-pro-total-kva').textContent = formatNum(totalKva);
    const filteredKwEl = $('#load-pro-filtered-kw');
    const filteredKvaEl = $('#load-pro-filtered-kva');
    const filteredKwRow = $('#load-pro-filtered-kw-row');
    const filteredKvaRow = $('#load-pro-filtered-kva-row');
    const searchEl = $('#load-pro-search-equipment');
    const hasActiveFilter = !!(searchEl && searchEl.value && searchEl.value.trim());
    if (filteredKwEl) filteredKwEl.textContent = formatNum(filteredKw);
    if (filteredKvaEl) filteredKvaEl.textContent = formatNum(filteredKva);
    if (filteredKwRow) filteredKwRow.style.display = hasActiveFilter ? '' : 'none';
    if (filteredKvaRow) filteredKvaRow.style.display = hasActiveFilter ? '' : 'none';
    $('#load-pro-peak-kva').textContent = formatNum(peakKva);
    $('#load-pro-recommended-kva').textContent = formatNum(finalRecommendedKva);
    $('#load-pro-kva-margin').textContent = formatNum(kvaMargin);
    $('#load-pro-approximate-runtime').textContent = formatNum(runtime, 1);

    updateCapacityStatus(kvaMargin, peakKva, availableKva);
    saveWorksheetState();
  }

  function updateCapacityStatus(kvaMargin, peakKva, availableKva) {
    const pill = $('#load-pro-capacity-status-pill');
    if (!pill) return;
    pill.classList.remove('status-green', 'status-orange', 'status-red', 'status-grey');
    if (availableKva < peakKva && peakKva > 0) {
      pill.textContent = 'PEAK START FAIL';
      pill.classList.add('status-red');
    } else if (kvaMargin >= 0.01 && availableKva >= peakKva) {
      pill.textContent = 'ADEQUATE MARGIN';
      pill.classList.add('status-green');
    } else if (kvaMargin >= 0 && availableKva > 0) {
      pill.textContent = 'TIGHT MARGIN';
      pill.classList.add('status-orange');
    } else if (availableKva > 0 && peakKva > 0 && kvaMargin < 0) {
      pill.textContent = 'INSUFFICIENT KVA';
      pill.classList.add('status-red');
    } else {
      pill.textContent = 'CHECK INPUTS';
      pill.classList.add('status-grey');
    }
  }

  // --- Scenario state ---
  function getScenarioData() {
    const nameEl = $('#load-pro-scenario-name');
    const notesEl = $('#load-pro-scenario-notes');
    const data = {
      name: (nameEl && nameEl.value && nameEl.value.trim()) ? nameEl.value.trim() : '',
      notes: (notesEl && notesEl.value) ? notesEl.value : '',
      availableKva: ($('#load-pro-available-kva') && $('#load-pro-available-kva').value) || '0',
      // Gallons-only canonical model for Pro.
      fuelTankCapacityGallons: getFuelCapacityGallons(),
      fuelRateGalPerKw: getFuelRateGalPerKw(),
      rows: []
    };
    $$('.equipment-row').forEach(row => {
      const nameCell = row.querySelector('td:first-child');
      const name = nameCell ? nameCell.textContent.trim() : '';
      const qtyIn = row.querySelector('.qty-input');
      const kwIn = row.querySelector('.kw-input');
      const pfIn = row.querySelector('.pf-input');
      const cat = row.closest('.category');
      data.rows.push({
        name,
        qty: (qtyIn && qtyIn.value) || '0',
        kw: (kwIn && kwIn.value) || '0',
        pf: (pfIn && pfIn.value) || '1',
        catId: cat ? cat.id : null
      });
    });
    return data;
  }

  function applyScenarioData(data) {
    if (!data) return;
    $$('.input-error').forEach(el => clearValidationError(el));
    $$('.validation-error').forEach(el => { el.style.display = 'none'; });
    const nameEl = $('#load-pro-scenario-name');
    const notesEl = $('#load-pro-scenario-notes');
    if (nameEl && data.name != null) nameEl.value = data.name;
    if (notesEl && data.notes != null) notesEl.value = data.notes;
    const kvaEl = $('#load-pro-available-kva');
    const fuelEl = $('#load-pro-fuel-capacity');
    const rateEl = $('#load-pro-fuel-rate-per-kw');
    if (kvaEl) kvaEl.value = (data.availableKva && parseFloat(data.availableKva) !== 0) ? data.availableKva : '';
    if (fuelEl && rateEl) {
      const capacityG = parseFloat(data.fuelTankCapacityGallons) || 0;
      const rateG = parseFloat(data.fuelRateGalPerKw) || 0;
      fuelEl.value = capacityG !== 0 ? String(capacityG) : '';
      rateEl.value = rateG !== 0 ? String(rateG) : '';
    }

    $$('.equipment-row.custom').forEach(row => row.remove());

    (data.rows || []).forEach(item => {
      const existing = $$('.equipment-row').find(row => {
        const first = row.querySelector('td:first-child');
        return first && first.textContent.trim() === item.name;
      });
      if (existing) {
        const q = existing.querySelector('.qty-input');
        const k = existing.querySelector('.kw-input');
        const p = existing.querySelector('.pf-input');
        if (q) q.value = (item.qty && parseFloat(item.qty) !== 0) ? item.qty : '';
        if (k) k.value = item.kw;
        if (p) p.value = item.pf;
      } else if (item.catId) {
        addCustomRow(item.catId, item.name, parseFloat(item.kw) || 0, parseFloat(item.pf) || 1, parseInt(item.qty, 10) || 0);
      }
    });
    filterEquipmentSearch();
  }

  const LAST_SAVED_KEY = 'load-pro-lastSaved';

  function updateAutosaveTimestampDisplay(tsIsoString) {
    const el = document.getElementById('load-pro-last-saved');
    if (!el) return;
    if (!tsIsoString || typeof tsIsoString !== 'string') {
      el.textContent = '';
      return;
    }
    try {
      const date = new Date(tsIsoString);
      el.textContent = isNaN(date.getTime()) ? '' : 'Last autosaved: ' + date.toLocaleString();
    } catch (e) {
      el.textContent = '';
    }
  }

  function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) container.remove();
      }, 300);
    }, duration);
  }

  function saveWorksheetState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getScenarioData()));
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SAVED_KEY, now);
      updateAutosaveTimestampDisplay(now);
    } catch (e) { /* ignore */ }
  }

  function loadWorksheetState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) applyScenarioData(JSON.parse(raw));
      updateAutosaveTimestampDisplay(localStorage.getItem(LAST_SAVED_KEY));
    } catch (e) { /* ignore */ }
  }

  function getSavedScenarios() {
    try {
      const raw = localStorage.getItem(STORAGE_SCENARIOS);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function updateScenarioDropdown() {
    const select = $('#load-pro-scenario-select');
    if (!select) return;
    const scenarios = getSavedScenarios();
    if (scenarios.length === 0) {
      select.innerHTML = '<option value="">— No saved scenarios —</option>';
    } else {
      select.innerHTML = '<option value="">— Select scenario to load —</option>';
    }
    scenarios.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    scenarios.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${new Date(s.timestamp).toLocaleString()})`;
      select.appendChild(opt);
    });
    const loadBtn = $('#load-pro-load-scenario-btn');
    const deleteBtn = $('#load-pro-delete-scenario-btn');
    const clearBtn = $('#load-pro-clear-scenarios-btn');
    const disabled = scenarios.length === 0;
    select.disabled = disabled;
    if (loadBtn) loadBtn.disabled = disabled;
    if (deleteBtn) deleteBtn.disabled = disabled;
    if (clearBtn) clearBtn.disabled = disabled;
  }

  function buildImportIssueReport(sourceFileName, issues) {
    const lines = [];
    lines.push('Load Calc Pro - Import Sanitization Report');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Source file: ${sourceFileName || 'Unknown'}`);
    lines.push(`Schema version: ${IMPORT_SCHEMA_VERSION}`);
    lines.push('');
    lines.push('Issues detected during import:');
    issues.forEach((issue, idx) => lines.push(`${idx + 1}. ${issue}`));
    lines.push('');
    lines.push('Action: review and correct source data, then re-export/re-import.');
    return lines.join('\n');
  }

  function downloadImportIssueReport(sourceFileName, issues) {
    if (!issues || issues.length === 0) return;
    const reportText = buildImportIssueReport(sourceFileName, issues);
    const safeStamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `load-calc-pro-import-sanitization-report-${safeStamp}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function sanitizeImportedScenarioData(rawPayload, issues) {
    if (!rawPayload || typeof rawPayload !== 'object') return null;
    const payload = rawPayload;
    const cleaned = {
      name: typeof payload.name === 'string' ? payload.name.trim() : '',
      notes: typeof payload.notes === 'string' ? payload.notes : '',
      rows: []
    };

    const availableKva = Number(payload.availableKva);
    cleaned.availableKva = Number.isFinite(availableKva) && availableKva >= 0 ? String(availableKva) : '0';
    if (payload.availableKva != null && cleaned.availableKva === '0' && Number(payload.availableKva) !== 0) {
      issues.push(`Available kVA: invalid value "${payload.availableKva}" replaced with 0.`);
    }

    const fuelTankCapacityGallons = Number(payload.fuelTankCapacityGallons);
    cleaned.fuelTankCapacityGallons = Number.isFinite(fuelTankCapacityGallons) && fuelTankCapacityGallons >= 0 ? fuelTankCapacityGallons : 0;
    if (payload.fuelTankCapacityGallons != null && cleaned.fuelTankCapacityGallons === 0 && Number(payload.fuelTankCapacityGallons) !== 0) {
      issues.push(`Fuel tank capacity (gallons): invalid value "${payload.fuelTankCapacityGallons}" replaced with 0.`);
    }

    const fuelRateGalPerKw = Number(payload.fuelRateGalPerKw);
    cleaned.fuelRateGalPerKw = Number.isFinite(fuelRateGalPerKw) && fuelRateGalPerKw >= 0 ? fuelRateGalPerKw : 0;
    if (payload.fuelRateGalPerKw != null && cleaned.fuelRateGalPerKw === 0 && Number(payload.fuelRateGalPerKw) !== 0) {
      issues.push(`Fuel rate (gal/hr per kW): invalid value "${payload.fuelRateGalPerKw}" replaced with 0.`);
    }

    if (!Array.isArray(payload.rows)) {
      issues.push('Rows: missing or invalid; import rejected.');
      return null;
    }

    payload.rows.forEach((row, index) => {
      const rowNum = index + 1;
      if (!row || typeof row !== 'object') {
        issues.push(`Row ${rowNum}: dropped because entry is not an object.`);
        return;
      }
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      if (!name) {
        issues.push(`Row ${rowNum}: dropped because name is missing.`);
        return;
      }
      const qty = Number(row.qty);
      const kw = Number(row.kw);
      const pf = Number(row.pf);
      const safeQty = Number.isFinite(qty) && qty >= 0 ? Math.floor(qty) : 0;
      const safeKw = Number.isFinite(kw) && kw >= 0 ? kw : 0;
      const safePf = Number.isFinite(pf) && pf >= 0.01 && pf <= 1 ? pf : 1;
      const safeCat = typeof row.catId === 'string' && row.catId.trim() ? row.catId.trim() : null;

      if (!Number.isFinite(qty) || qty < 0 || qty !== safeQty) {
        issues.push(`Row ${rowNum} (${name}): qty "${row.qty}" normalized to ${safeQty}.`);
      }
      if (!Number.isFinite(kw) || kw < 0) {
        issues.push(`Row ${rowNum} (${name}): kW "${row.kw}" normalized to ${safeKw}.`);
      }
      if (!Number.isFinite(pf) || pf < 0.01 || pf > 1) {
        issues.push(`Row ${rowNum} (${name}): PF "${row.pf}" normalized to ${safePf}.`);
      }
      if (!safeCat) {
        issues.push(`Row ${rowNum} (${name}): missing category; item may not restore if not in baseline equipment list.`);
      }

      cleaned.rows.push({
        name,
        qty: String(safeQty),
        kw: String(safeKw),
        pf: String(safePf),
        catId: safeCat
      });
    });

    return cleaned;
  }

  function saveScenario() {
    let hasErrors = false;
    Object.keys(SIDEBAR_RULES).forEach(id => {
      if (!validateAndShowSidebar(id)) hasErrors = true;
    });
    if (hasErrors) {
      acknowledge('load-pro-save-scenario-btn', 'Fix errors first');
      return;
    }
    const data = getScenarioData();
    let scenarioName = (data.name && data.name.trim()) ? data.name.trim() : '';
    if (!scenarioName) {
      scenarioName = prompt('Enter a name for this scenario:', `Scenario ${new Date().toLocaleDateString()}`);
      if (!scenarioName || !scenarioName.trim()) {
        acknowledge('load-pro-save-scenario-btn', 'Cancelled');
        return;
      }
      scenarioName = scenarioName.trim();
    }
    const scenario = {
      id: String(Date.now()),
      name: scenarioName,
      timestamp: new Date().toISOString(),
      data
    };
    const scenarios = getSavedScenarios();
    const existingIndex = scenarios.findIndex(s => s.name === scenario.name);
    if (existingIndex >= 0) {
      if (!confirm(`A scenario named "${scenario.name}" already exists. Overwrite it?`)) return;
      scenarios[existingIndex] = scenario;
    } else {
      scenarios.push(scenario);
    }
    try {
      localStorage.setItem(STORAGE_SCENARIOS, JSON.stringify(scenarios));
    } catch (e) {
      acknowledge('load-pro-save-scenario-btn', 'Save failed – storage full');
      return;
    }
    updateScenarioDropdown();
    acknowledge('load-pro-save-scenario-btn', 'Saved!');
  }

  function loadSelectedScenario() {
    const select = $('#load-pro-scenario-select');
    const scenarioId = select ? select.value : '';
    if (!scenarioId) {
      acknowledge('load-pro-load-scenario-btn', 'Select one first');
      return;
    }
    const scenarios = getSavedScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario || !scenario.data) {
      acknowledge('load-pro-load-scenario-btn', 'Not found');
      return;
    }
    applyScenarioData(scenario.data);
    acknowledge('load-pro-load-scenario-btn', 'Loaded!');
  }

  function deleteSelectedScenario() {
    const select = $('#load-pro-scenario-select');
    const scenarioId = select ? select.value : '';
    if (!scenarioId) {
      acknowledge('load-pro-delete-scenario-btn', 'Select one first');
      return;
    }
    const scenarios = getSavedScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;
    if (!confirm(`Delete scenario "${scenario.name}"?`)) return;
    const updated = scenarios.filter(s => s.id !== scenarioId);
    try {
      localStorage.setItem(STORAGE_SCENARIOS, JSON.stringify(updated));
    } catch (e) { /* ignore */ }
    updateScenarioDropdown();
    acknowledge('load-pro-delete-scenario-btn', 'Deleted');
  }

  function clearAllScenarios() {
    const scenarios = getSavedScenarios();
    if (scenarios.length === 0) {
      acknowledge('load-pro-clear-scenarios-btn', 'None saved');
      return;
    }
    if (!confirm(`Delete all ${scenarios.length} saved scenarios? This cannot be undone.`)) return;
    try { localStorage.removeItem(STORAGE_SCENARIOS); } catch (e) {}
    updateScenarioDropdown();
    acknowledge('load-pro-clear-scenarios-btn', 'Cleared');
  }

  function loadScenarioFromFile(file) {
    if (!file) return;
    const sourceFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        const issues = [];
        const cleaned = sanitizeImportedScenarioData(payload, issues);
        if (!cleaned) {
          throw new Error('Invalid file');
        }
        applyScenarioData(cleaned);
        if (issues.length > 0) {
          downloadImportIssueReport(sourceFileName, issues);
          acknowledge('load-pro-import-file-btn', `Imported (${issues.length} issue${issues.length === 1 ? '' : 's'})`);
        } else {
          acknowledge('load-pro-import-file-btn', 'Imported!');
        }
      } catch (err) {
        acknowledge('load-pro-import-file-btn', 'Invalid file');
      }
    };
    reader.readAsText(file);
  }

  function downloadTextFile(content, mimeType, fileName) {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function toCsvCell(value) {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function buildCsvExport(data) {
    const lines = [];
    lines.push('Field,Value');
    lines.push(`${toCsvCell('Scenario Name')},${toCsvCell(data.name || '')}`);
    lines.push(`${toCsvCell('Notes')},${toCsvCell(data.notes || '')}`);
    lines.push(`${toCsvCell('Available kVA')},${toCsvCell(data.availableKva || '')}`);
    lines.push(`${toCsvCell('Fuel Tank (gal)')},${toCsvCell(data.fuelTankCapacityGallons != null ? data.fuelTankCapacityGallons : '')}`);
    lines.push(`${toCsvCell('Fuel Rate (gal/kW)')},${toCsvCell(data.fuelRateGalPerKw != null ? data.fuelRateGalPerKw : '')}`);
    lines.push(`${toCsvCell('Exported At')},${toCsvCell(new Date().toLocaleString())}`);
    lines.push('');
    lines.push('Item,kW,PF,Qty,kVA');
    (data.rows || []).forEach(row => {
      const kw = parseFloat(row.kw) || 0;
      const pf = parseFloat(row.pf) || 1;
      const qty = parseInt(row.qty, 10) || 0;
      const kva = pf > 0 ? (kw / pf) : 0;
      lines.push([
        toCsvCell(row.name || ''),
        toCsvCell(row.kw),
        toCsvCell(row.pf),
        toCsvCell(row.qty),
        toCsvCell(kva.toFixed(2))
      ].join(','));
    });
    return lines.join('\n');
  }

  function exportScenarioToFile() {
    const dialog = $('#load-pro-export-format-dialog');
    if (dialog) {
      const jsonRadio = document.querySelector('#load-pro-export-format-dialog input[name="export-format"][value="JSON"]');
      if (jsonRadio) jsonRadio.checked = true;
      dialog.hidden = false;
      dialog.setAttribute('aria-hidden', 'false');
    }
  }

  function performExportWithFormat(fmt) {
    const data = getScenarioData();
    const format = (fmt && String(fmt).toUpperCase()) || 'JSON';
    if (format === 'CSV') {
      const csv = buildCsvExport(data);
      downloadTextFile(csv, 'text/csv;charset=utf-8', 'load-calc-pro-export.csv');
      acknowledge('load-pro-export-file-btn', 'Exported!');
      return;
    }
    data.schemaVersion = IMPORT_SCHEMA_VERSION;
    const json = JSON.stringify(data, null, 2);
    downloadTextFile(json, 'application/json', 'load-calc-pro-scenario.json');
    acknowledge('load-pro-export-file-btn', 'Exported!');
  }

  function closeExportFormatDialog() {
    const dialog = $('#load-pro-export-format-dialog');
    if (dialog) {
      dialog.hidden = true;
      dialog.setAttribute('aria-hidden', 'true');
    }
  }

  function acknowledge(btnId, text) {
    const btn = $(`#${btnId}`);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = text;
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('btn-success');
    }, 1500);
  }

  function resetAllQuantities() {
    if (!confirm('Reset all quantities to 0 and remove custom rows? Current scenario is not saved first.')) return;
    $$('.qty-input').forEach(inp => { inp.value = ''; });
    $$('.equipment-row.custom').forEach(row => row.remove());
    recalc();
  }

  function clearSheet() {
    if (!confirm('Reset worksheet? This will restore the original equipment list, clear all quantities, remove custom rows, and reset generator/fuel inputs. This cannot be undone.')) return;
    // Restore full table from baseline (restores any deleted rows)
    buildCategories();
    // Re-attach per-category Reset Qty buttons (new DOM from buildCategories)
    $$('[data-reset-target]').forEach(btn => {
      btn.addEventListener('click', () => resetCategory(btn.getAttribute('data-reset-target')));
    });
    // Reset generator/fuel inputs to empty (placeholder shows)
    const kvaEl = $('#load-pro-available-kva');
    const fuelEl = $('#load-pro-fuel-capacity');
    const rateEl = $('#load-pro-fuel-rate-per-kw');
    if (kvaEl) kvaEl.value = '';
    if (fuelEl) fuelEl.value = '';
    if (rateEl) rateEl.value = '';
    const searchEl = $('#load-pro-search-equipment');
    if (searchEl) searchEl.value = '';
    filterEquipmentSearch();
    recalc();
  }

  function resetCategory(catId) {
    const cat = $(`#${catId}`);
    if (!cat) return;
    cat.querySelectorAll('.qty-input').forEach(inp => { inp.value = ''; });
    cat.querySelectorAll('.equipment-row.custom').forEach(row => row.remove());
    recalc();
  }

  function clearAutosavedState() {
    if (!confirm('Clear autosaved worksheet state from this browser? This will not delete named saved scenarios.')) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_SAVED_KEY);
      updateAutosaveTimestampDisplay('');
      showToast('Autosaved worksheet state cleared', 'success', 2500);
    } catch (e) {
      showToast('Failed to clear autosaved worksheet state', 'error', 3000);
    }
  }

  function init() {
    buildCategories();
    loadWorksheetState();
    applySort();

    const kvaEl = $('#load-pro-available-kva');
    const fuelEl = $('#load-pro-fuel-capacity');
    const rateEl = $('#load-pro-fuel-rate-per-kw');
    [kvaEl, fuelEl, rateEl].forEach(el => {
      if (el) {
        setupPlaceholderBehavior(el);
        el.addEventListener('input', recalc);
        if (el === kvaEl) el.addEventListener('blur', () => validateAndShowSidebar('load-pro-available-kva'));
        if (el === fuelEl) el.addEventListener('blur', () => validateAndShowSidebar('load-pro-fuel-capacity'));
        if (el === rateEl) el.addEventListener('blur', () => validateAndShowSidebar('load-pro-fuel-rate-per-kw'));
      }
    });
    $('#load-pro-reset-btn').addEventListener('click', resetAllQuantities);
    $('#load-pro-clear-sheet-btn').addEventListener('click', clearSheet);
    $('#load-pro-save-scenario-btn').addEventListener('click', saveScenario);
    $('#load-pro-print-summary-btn').addEventListener('click', () => {
      acknowledge('load-pro-print-summary-btn', 'Printing...');
      window.print();
    });
    const guideOverlay = $('#load-pro-guide-modal-overlay');
    const guideBody = $('#load-pro-guide-modal-body');
    function renderGuideMd(html) {
      if (guideBody) guideBody.innerHTML = html;
    }
    function openGuide() {
      if (!guideOverlay || !guideBody) return;
      if (guideBody.innerHTML === '') {
        const embedded = typeof window.LOAD_CALC_PRO_GUIDE_MARKDOWN === 'string' && window.LOAD_CALC_PRO_GUIDE_MARKDOWN.length > 0;
        if (embedded) {
          renderGuideMd(simpleMarkdownToHtml(window.LOAD_CALC_PRO_GUIDE_MARKDOWN));
        } else {
          guideBody.innerHTML = '<p class="guide-loading">Loading…</p>';
          fetch('README.md').then(r => r.text()).then(md => {
            renderGuideMd(simpleMarkdownToHtml(md));
          }).catch(() => {
            renderGuideMd('<p>User guide could not be loaded. Open README.md from this folder if needed.</p>');
          });
        }
      }
      guideOverlay.hidden = false;
      guideOverlay.setAttribute('aria-hidden', 'false');
    }
    $('#load-pro-guide-btn').addEventListener('click', openGuide);
    function closeGuide() {
      if (guideOverlay) {
        guideOverlay.hidden = true;
        guideOverlay.setAttribute('aria-hidden', 'true');
      }
    }
    $('#load-pro-guide-modal-close').addEventListener('click', closeGuide);
    function closeGuideOnOverlayClick(e) {
      if (e.target === guideOverlay) closeGuide();
    }
    if (guideOverlay) {
      guideOverlay.removeEventListener('click', closeGuideOnOverlayClick);
      guideOverlay.addEventListener('click', closeGuideOnOverlayClick);
    }

    $('#load-pro-load-scenario-btn').addEventListener('click', loadSelectedScenario);
    $('#load-pro-delete-scenario-btn').addEventListener('click', deleteSelectedScenario);
    $('#load-pro-clear-scenarios-btn').addEventListener('click', clearAllScenarios);
    $('#load-pro-import-file-btn').addEventListener('click', () => {
      const input = $('#load-pro-load-scenario-file');
      if (input) { input.value = ''; input.click(); }
    });
    $('#load-pro-export-file-btn').addEventListener('click', exportScenarioToFile);
    const exportFormatDialog = $('#load-pro-export-format-dialog');
    const exportFormatConfirm = $('#load-pro-export-format-confirm');
    const exportFormatCancel = $('#load-pro-export-format-cancel');
    if (exportFormatConfirm) {
      exportFormatConfirm.addEventListener('click', () => {
        const selected = document.querySelector('#load-pro-export-format-dialog input[name="export-format"]:checked');
        const fmt = selected ? selected.value : 'JSON';
        performExportWithFormat(fmt);
        closeExportFormatDialog();
      });
    }
    if (exportFormatCancel) exportFormatCancel.addEventListener('click', closeExportFormatDialog);
    if (exportFormatDialog) {
      exportFormatDialog.addEventListener('click', (e) => {
        if (e.target === exportFormatDialog) closeExportFormatDialog();
      });
    }
    $('#load-pro-btn-clear-autosave').addEventListener('click', clearAutosavedState);
    $('#load-pro-load-scenario-file').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) loadScenarioFromFile(file);
    });

    updateScenarioDropdown();

    const sortSel = $('#load-pro-sort-equipment');
    if (sortSel) {
      sortSel.addEventListener('change', onSortChange);
      const storedSort = localStorage.getItem(SORT_STORAGE_KEY);
      const validSorts = ['name-asc', 'name-desc', 'kw-desc', 'kw-asc', 'kva-peak-desc', 'kva-peak-asc'];
      if (storedSort && validSorts.includes(storedSort)) {
        currentSortKey = storedSort;
        sortSel.value = storedSort;
      } else {
        currentSortKey = 'name-asc';
        sortSel.value = 'name-asc';
      }
      applySort();
    }

    const searchEl = $('#load-pro-search-equipment');
    if (searchEl) searchEl.addEventListener('input', filterEquipmentSearch);

    $$('[data-reset-target]').forEach(btn => {
      btn.addEventListener('click', () => resetCategory(btn.getAttribute('data-reset-target')));
    });

    document.addEventListener('click', (e) => {
      const title = e.target.closest('.category-title');
      if (title) {
        const category = title.closest('.category');
        if (category) category.classList.toggle('collapsed');
      }
    });

    (function initHelpPopovers() {
      let helpHoverHideTimeout = null;
      function getPopoverForBtn(btn) {
        const id = btn.getAttribute('data-help');
        return id ? document.getElementById('help-popover-' + id) : null;
      }
      function closeAllHelpPopovers(unpin) {
        if (unpin) document.querySelectorAll('.help-popover').forEach(p => p.classList.remove('pinned'));
        document.querySelectorAll('.help-popover').forEach(p => { p.hidden = true; });
        document.querySelectorAll('.help-icon').forEach(b => b.setAttribute('aria-expanded', 'false'));
      }
      function scheduleHoverHide(pop, btn) {
        if (helpHoverHideTimeout) clearTimeout(helpHoverHideTimeout);
        helpHoverHideTimeout = setTimeout(() => {
          if (pop && !pop.classList.contains('pinned')) { pop.hidden = true; if (btn) btn.setAttribute('aria-expanded', 'false'); }
          helpHoverHideTimeout = null;
        }, 220);
      }
      function cancelHoverHide() {
        if (helpHoverHideTimeout) { clearTimeout(helpHoverHideTimeout); helpHoverHideTimeout = null; }
      }
      document.querySelectorAll('.help-icon').forEach(btn => {
        const pop = getPopoverForBtn(btn);
        if (!pop) return;
        btn.addEventListener('mouseenter', () => { cancelHoverHide(); pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); });
        btn.addEventListener('mouseleave', () => { if (!pop.classList.contains('pinned')) scheduleHoverHide(pop, btn); });
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          cancelHoverHide();
          const wasPinned = pop.classList.contains('pinned');
          closeAllHelpPopovers(true);
          if (!wasPinned) { pop.classList.add('pinned'); pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
        });
      });
      document.querySelectorAll('.help-popover').forEach(pop => {
        pop.addEventListener('mouseenter', cancelHoverHide);
        pop.addEventListener('mouseleave', () => {
          const helpId = (pop.id || '').replace('help-popover-', '');
          const b = helpId ? document.querySelector('.help-icon[data-help="' + helpId + '"]') : null;
          if (!pop.classList.contains('pinned')) scheduleHoverHide(pop, b);
        });
      });
      document.addEventListener('click', () => closeAllHelpPopovers(true));
    })();

    recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
