/**
 * Generator Load Estimator - Load Calculator Basic
 * Single data-driven script: equipment data, DOM build, calculations, save/load.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'generator-load-scenarios';
  const WORKSHEET_STORAGE_KEY = 'generator-load-basic-autosave';
  const LAST_SAVED_KEY = 'generator-load-basic-lastSaved';
  const SORT_STORAGE_KEY = 'generator-load-sort';
  let currentSortKey = 'name-asc';

  const CONSTANTS = {
    LITERS_PER_GALLON: 3.78541,
    SAFETY_FACTOR: 1.25,
    FUEL_RATES_BY_LOAD_PERCENT_GAL_PER_KW: [
      { maxUtil: 25, rateGalHrPerKw: 0.35 / 3.78541 },
      { maxUtil: 50, rateGalHrPerKw: 0.30 / 3.78541 },
      { maxUtil: 75, rateGalHrPerKw: 0.25 / 3.78541 },
      { maxUtil: 1000, rateGalHrPerKw: 0.22 / 3.78541 }
    ]
  };

  const EQUIPMENT = {
    'cat-standard': {
      title: 'Standard Medical Equipment',
      badge: 'Fixed typical kW values',
      items: [
        { name: 'Portable Vital Signs Monitor', kw: 0.10 },
        { name: 'Patient Monitor', kw: 0.10 },
        { name: 'Infusion / Syringe Pump', kw: 0.02 },
        { name: 'IV Administration Pump', kw: 0.02 },
        { name: 'Suction Machine', kw: 0.05 },
        { name: 'Electric Hospital Bed', kw: 0.25 },
        { name: 'ICU Bed', kw: 0.35 },
        { name: 'Oxygen Concentrator', kw: 0.40 },
        { name: 'Portable Oxygen Concentrator', kw: 0.10 },
        { name: 'Sequential Compression Device', kw: 0.10 },
        { name: 'CPAP', kw: 0.12 },
        { name: 'ECG / EKG', kw: 0.10 },
        { name: 'Small Lab Centrifuge', kw: 0.05 },
        { name: 'Portable Ultrasound', kw: 0.20 },
        { name: 'Orthopedic Cast Cutter', kw: 0.40 }
      ]
    },
    'cat-emergency': {
      title: 'Emergency / Critical Medical Equipment',
      badge: null,
      items: [
        { name: 'Portable Ventilator', kw: 0.60 },
        { name: 'Defibrillator', kw: 0.30 },
        { name: 'Video Laryngoscope', kw: 0.05 },
        { name: 'Portable X-Ray', kw: 3.00 },
        { name: 'Rapid Infuser', kw: 1.00 },
        { name: 'Blood Gas Analyzer', kw: 0.40 },
        { name: 'Blood Chemistry POC', kw: 0.30 },
        { name: 'Hematology Analyzer', kw: 0.40 },
        { name: 'Chemistry Analyzer', kw: 1.00 },
        { name: 'Refrigerator (Pharmacy/Specimen)', kw: 0.30 },
        { name: 'Refrigerator (Blood Storage)', kw: 0.30 },
        { name: 'Refrigerator Freezer', kw: 0.50 },
        { name: 'Blanket Warmer', kw: 1.20 },
        { name: 'Bair Hugger', kw: 1.10 },
        { name: 'Anesthesia Machine', kw: 0.12 },
        { name: 'Crash Cart (mixed loads)', kw: 0.50 }
      ]
    },
    'cat-office': {
      title: 'Office & IT Equipment',
      badge: null,
      items: [
        { name: 'Desktop PC + 1 Monitor', kw: 0.20 },
        { name: 'Desktop PC + 2 Monitors', kw: 0.30 },
        { name: 'Laptop', kw: 0.07 },
        { name: 'Smartphone (charging)', kw: 0.01 },
        { name: 'Tablet (charging)', kw: 0.015 },
        { name: 'Radio charging base (single)', kw: 0.005 },
        { name: 'Radio charging base (multi-unit, 6–12 bay)', kw: 0.15 },
        { name: 'Computer Monitor', kw: 0.03 },
        { name: 'TV / Display (small, e.g. 32")', kw: 0.05 },
        { name: 'TV / Display (large, e.g. 55")', kw: 0.10 },
        { name: 'VoIP Phone', kw: 0.02 },
        { name: 'Network Switch / Router (per rack)', kw: 0.05 },
        { name: 'Multifunction Printer', kw: 0.80 },
        { name: 'Printer (Standby)', kw: 0.05 },
        { name: 'Printer (Printing)', kw: 0.80 },
        { name: 'Label printer (thermal)', kw: 0.10 },
        { name: 'Tool Battery Charger', kw: 0.10 },
        { name: 'Office / Task Lighting (per room)', kw: 0.15 },
        { name: 'Desk Light', kw: 0.03 },
        { name: 'Floor Light - Exam', kw: 0.08 },
        { name: 'Mini Fridge (Office)', kw: 0.10 }
      ]
    },
    'cat-hvac': {
      title: 'Environmental & Site Systems (Large Loads)',
      badge: null,
      items: [
        { name: 'HVAC 3.5 Ton', kw: 4.00 },
        { name: 'HVAC 3.5 Ton w/ Heat Strip', kw: 8.50 },
        { name: 'HVAC 5 Ton', kw: 5.50 },
        { name: 'HVAC 5 Ton w/ Heat Strip', kw: 12.00 },
        { name: 'Furnace / Air Handler Blower', kw: 0.60 },
        { name: 'Water Pump (Hygiene Center)', kw: 0.30 },
        { name: 'Sump Pump (Hygiene Center)', kw: 0.50 },
        { name: 'Portable Sink Pump (Hygiene Station)', kw: 0.30 },
        { name: 'Portable Shower Pump', kw: 0.50 },
        { name: 'Bladder Fill / Transfer Pump', kw: 0.75 },
        { name: 'Air Shelter Inflator', kw: 1.50 },
        { name: 'Tactical Stringable Lights', kw: 0.30 },
        { name: 'External Work Light (20K Lumens)', kw: 0.25 },
        { name: 'LED Work Light Tower', kw: 1.50 },
        { name: 'Portable LED Work Light', kw: 0.20 }
      ]
    }
  };

  const ROOT = document.getElementById('panel-load-calc') || document.documentElement;
  const PREFIX = document.getElementById('panel-load-calc') ? 'load-' : '';
  const id = (name) => `#${PREFIX}${name}`;
  const $ = (sel, el) => (el || ROOT).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || ROOT).querySelectorAll(sel));

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

  // --- Input validation ---
  const SIDEBAR_RULES = {
    'gen-capacity': { min: 0, max: 100000, message: 'Generator capacity must be between 0 and 100,000 kW' },
    'fuel-capacity': { min: 0, max: 1000000, message: 'Fuel capacity must be between 0 and 1,000,000 (in selected unit)' }
  };

  function validateSidebarInput(name) {
    const el = $(id(name));
    if (!el) return { valid: true };
    const rule = SIDEBAR_RULES[name];
    if (!rule) return { valid: true };
    const value = el.value.trim();
    if (value === '') return { valid: true };
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, message: 'Enter a valid number' };
    if (num < rule.min || num > rule.max) return { valid: false, message: rule.message };
    return { valid: true };
  }

  function validateQtyInput(input) {
    if (!input) return { valid: true };
    const value = input.value.trim();
    if (value === '') return { valid: true };
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) return { valid: false, message: 'Qty must be a whole number ≥ 0' };
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

  function validateAndShowSidebar(name) {
    const el = $(id(name));
    const result = validateSidebarInput(name);
    if (result.valid) clearValidationError(el);
    else showValidationError(el, result.message);
    return result.valid;
  }

  function validateAndShowQty(input) {
    const result = validateQtyInput(input);
    if (result.valid) clearValidationError(input);
    else showValidationError(input, result.message);
    return result.valid;
  }

  function formatDateTime(d) {
    const x = new Date(d);
    const m = x.getMonth() + 1, day = x.getDate(), y = x.getFullYear();
    const h = x.getHours(), min = x.getMinutes(), ampm = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return `${m}/${day}/${y} ${h12}:${String(min).padStart(2, '0')} ${ampm}`;
  }

  function migrateScenario(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const data = raw.data || null;
    if (!data || typeof data !== 'object') return null;

    const savedAtRaw = raw.savedAt || raw.timestamp || Date.now();
    const savedAtMs = new Date(savedAtRaw).getTime();
    const safeSavedAtMs = Number.isFinite(savedAtMs) ? savedAtMs : Date.now();
    const baseName = raw.baseName || raw.scenarioName || data.scenarioName || 'Unnamed scenario';
    const displayName = raw.displayName || `${baseName} – ${formatDateTime(safeSavedAtMs)}`;
    const id = raw.id != null ? String(raw.id) : String(safeSavedAtMs);

    return {
      id,
      baseName,
      displayName,
      savedAt: new Date(safeSavedAtMs).toISOString(),
      data
    };
  }

  function getSavedScenarios() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map(migrateScenario).filter(Boolean);
    } catch (e) {
      console.error('Failed to read saved scenarios:', e);
      return [];
    }
  }

  function saveScenariosToStorage(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function updateAutosaveTimestampDisplay(tsIsoString) {
    const el = document.getElementById(PREFIX + 'load-basic-last-saved');
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

  function updateSavedDisplay(isoTimestampOrNull) {
    const el = document.getElementById(PREFIX + 'load-basic-saved-display');
    if (!el) return;
    if (isoTimestampOrNull) {
      try {
        const d = new Date(isoTimestampOrNull);
        el.textContent = 'Saved: ' + (d.toLocaleString && d.toLocaleString());
      } catch (e) {
        el.textContent = '';
      }
    } else {
      el.textContent = '';
    }
  }

  function getCurrentWorksheetData() {
    const nameEl = $(id('scenario-name'));
    const notesEl = $(id('scenario-notes'));
    const genEl = $(id('gen-capacity'));
    const scenarioName = (nameEl && nameEl.value.trim()) || '';
    const scenarioNotes = notesEl ? notesEl.value : '';
    const generatorCapacity = genEl ? genEl.value : '';
    const fuelTankCapacityGallons = getFuelCapacityGallons();
    const equipment = [];
    $$('.equipment-row').forEach(row => {
      const cat = row.closest('.category');
      const categoryId = cat ? cat.id : null;
      const name = row.dataset.name || (row.querySelector('td') && row.querySelector('td').textContent.trim());
      const kwValue = row.dataset.kwValue;
      const qtyIn = row.querySelector('.qty-input');
      const qty = qtyIn ? qtyIn.value : 0;
      const isCustom = row.classList.contains('custom-item-row');
      equipment.push({ name, kwValue, qty, isCustom, categoryId: isCustom ? categoryId : undefined });
    });
    return { scenarioName, scenarioNotes, generatorCapacity, fuelTankCapacityGallons, equipment };
  }

  function saveWorksheetState() {
    try {
      localStorage.setItem(WORKSHEET_STORAGE_KEY, JSON.stringify(getCurrentWorksheetData()));
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SAVED_KEY, now);
      updateAutosaveTimestampDisplay(now);
    } catch (e) { /* ignore */ }
  }

  function loadWorksheetState() {
    try {
      const raw = localStorage.getItem(WORKSHEET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Normalize older autosave payloads that used placeholder naming.
          if (parsed.scenarioName === 'Unnamed scenario') {
            parsed.scenarioName = '';
          }
          applyScenarioData(parsed);
          attachListeners();
          calculateLoad();
        }
      }
      updateAutosaveTimestampDisplay(localStorage.getItem(LAST_SAVED_KEY));
    } catch (e) { /* ignore */ }
  }

  function clearAutosavedState() {
    if (!confirm('Clear autosaved worksheet state from this browser? This will not delete named saved scenarios.')) return;
    try {
      localStorage.removeItem(WORKSHEET_STORAGE_KEY);
      localStorage.removeItem(LAST_SAVED_KEY);
      updateAutosaveTimestampDisplay('');
      showToast('Autosaved worksheet state cleared', 'success', 2500);
    } catch (e) {
      showToast('Failed to clear autosaved worksheet state', 'error', 3000);
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

  function acknowledgeClick(btn, text, duration = 1000) {
    const origText = btn.textContent.trim();
    const origClass = btn.className;
    btn.textContent = text;
    btn.className = `${origClass.replace(/\s*btn-\w+/g, '')} btn-primary`;
    setTimeout(() => {
      btn.textContent = origText;
      btn.className = origClass;
    }, duration);
  }

  function buildCategories() {
    const wrap = $(id('categories-wrap'));
    if (!wrap) return;

    wrap.innerHTML = '';
    for (const [catId, config] of Object.entries(EQUIPMENT)) {
      const cat = document.createElement('div');
      cat.className = 'category';
      cat.id = catId;
      const head = document.createElement('div');
      head.className = 'category-head';
      head.innerHTML = `
        <div class="category-title">
          <span class="chevron">▼</span> ${escapeHtml(config.title)}
        </div>
        <div class="category-actions">
          <button type="button" class="btn btn-sm" data-reset-target="${catId}">Reset Qty</button>
          ${config.badge ? `<span class="badge">${escapeHtml(config.badge)}</span>` : ''}
        </div>
      `;
      const body = document.createElement('div');
      body.className = 'category-body';
      body.innerHTML = `
        <div class="add-row" data-cat="${catId}">
          <input type="text" class="add-name" placeholder="Additional equipment name">
          <input type="number" class="add-kw" min="0" step="0.01" placeholder="kW each">
          <input type="number" class="add-qty" min="0" step="1" value="0" placeholder="Qty">
          <button type="button" class="btn btn-sm add-custom-btn">Add</button>
        </div>
        <table class="equipment-table">
          <thead>
            <tr>
              <th style="width:50%">Item</th>
              <th>Qty</th>
              <th class="num">kW each</th>
              <th class="num">kW total</th>
              <th class="col-delete">Delete</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      `;
      const tbody = body.querySelector('tbody');
      config.items.forEach(({ name, kw }) => {
        const tr = document.createElement('tr');
        tr.className = 'equipment-row';
        tr.dataset.name = name;
        tr.dataset.kwValue = String(kw);
        tr.innerHTML = `
          <td>${escapeHtml(name)}</td>
          <td><input type="number" min="0" step="1" placeholder="0" class="qty qty-input"></td>
          <td class="num">${Number(kw).toFixed(2)}</td>
          <td class="num item-total">0.00</td>
          <td class="col-delete"></td>
        `;
        tbody.appendChild(tr);
      });

      cat.appendChild(head);
      cat.appendChild(body);
      wrap.appendChild(cat);
    }
  }

  function updateZeroPlaceholder() {
    const inputs = $$('.qty-input');
    const gen = $(id('gen-capacity'));
    const fuel = $(id('fuel-capacity'));
    [...inputs, gen, fuel].filter(Boolean).forEach(inp => {
      if (inp && parseFloat(inp.value) === 0 && inp.value.trim() !== '') {
        inp.classList.add('input-placeholder-zero');
      } else {
        inp.classList.remove('input-placeholder-zero');
      }
    });
  }

  function getEquipmentRowName(row) {
    const first = row.querySelector('td');
    return (row.dataset.name || (first && first.textContent.trim()) || '').toLowerCase();
  }

  function filterEquipmentSearch() {
    const searchEl = $(id('search-equipment'));
    const term = (searchEl && searchEl.value.trim()) ? searchEl.value.toLowerCase().trim() : '';
    $$('.equipment-row').forEach(row => {
      const name = getEquipmentRowName(row);
      if (!term) {
        row.classList.remove('search-hidden');
        return;
      }
      if (name.includes(term)) {
        row.classList.remove('search-hidden');
      } else {
        row.classList.add('search-hidden');
      }
    });
    calculateLoad();
  }

  function getRowKw(row) {
    const fromData = parseFloat(row.dataset.kwValue);
    if (!Number.isNaN(fromData)) return fromData;
    const kwCell = row.cells[2];
    if (kwCell) {
      const fromCell = parseFloat(kwCell.textContent);
      if (!Number.isNaN(fromCell)) return fromCell;
    }
    return 0;
  }

  function calculateLoad() {
    let totalKw = 0;
    let filteredKw = 0;
    (ROOT.querySelectorAll('.equipment-table tbody') || []).forEach(tbody => {
      (tbody.querySelectorAll('.equipment-row') || []).forEach(row => {
        const qtyIn = row.querySelector('.qty-input');
        const totalEl = row.querySelector('.item-total');
        const qty = parseFloat(qtyIn && qtyIn.value) || 0;
        const kw = getRowKw(row);
        const rowKw = qty * kw;
        totalKw += rowKw;
        if (!row.classList.contains('search-hidden')) {
          filteredKw += rowKw;
        }
        if (totalEl) totalEl.textContent = rowKw.toFixed(2);
      });
    });

    const recommended = totalKw * CONSTANTS.SAFETY_FACTOR;
    const totalEl = $(id('total-kw'));
    const recEl = $(id('recommended-kw'));
    const filteredEl = $(id('filtered-kw'));
    const filteredRow = $(id('filtered-kw-row'));
    const searchEl = $(id('search-equipment'));
    const hasActiveFilter = !!(searchEl && searchEl.value && searchEl.value.trim());
    if (totalEl) totalEl.textContent = `${totalKw.toFixed(2)} kW`;
    if (recEl) recEl.textContent = `${recommended.toFixed(2)} kW`;
    if (filteredEl) filteredEl.textContent = `${filteredKw.toFixed(2)} kW`;
    if (filteredRow) filteredRow.style.display = hasActiveFilter ? '' : 'none';

    updateZeroPlaceholder();
    checkCapacity(totalKw);
    calculateRuntime(totalKw);
    const active = document.activeElement;
    const typingQty = active && active.classList && active.classList.contains('qty-input');
    if (!typingQty) applySort();
    saveWorksheetState();
  }

  function getRowSortName(row) {
    const td = row.querySelector('td');
    return (td && td.textContent.trim()) || (row.dataset.name || '').toLowerCase();
  }

  function getRowSortKw(row) {
    const totalEl = row.querySelector('.item-total');
    if (!totalEl) return 0;
    return parseFloat(totalEl.textContent) || 0;
  }

  function applySort() {
    const active = document.activeElement;
    const wasQtyInput = active && active.classList && active.classList.contains('qty-input');
    const selStart = wasQtyInput ? active.selectionStart : 0;
    const selEnd = wasQtyInput ? active.selectionEnd : 0;

    const sel = $(id('sort-equipment'));
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
    const sel = $(id('sort-equipment'));
    if (sel) {
      currentSortKey = sel.value;
      try {
        localStorage.setItem(SORT_STORAGE_KEY, currentSortKey);
      } catch (e) {
        showToast('Sort applied; preference could not be saved.', 'info', 2500);
      }
      applySort();
      showToast(`Sort: ${sel.selectedOptions[0].text}`, 'info', 1500);
    }
  }

  function checkCapacity(totalKw) {
    const statusEl = $(id('capacity-status'));
    const pctEl = $(id('percent-used'));
    const genKw = parseFloat(($(id('gen-capacity')) && $(id('gen-capacity')).value)) || 0;

    if (!pctEl || !statusEl) return;
    if (genKw === 0) {
      pctEl.textContent = '0.00';
      statusEl.textContent = 'CHECK INPUTS';
      statusEl.className = 'status-pill status-muted';
      return;
    }
    const pct = (totalKw / genKw) * 100;
    pctEl.textContent = pct.toFixed(2);
    if (pct > 100) {
      statusEl.textContent = 'OVERLOAD (> 100%)';
      statusEl.className = 'status-pill status-danger';
    } else if (pct >= 80) {
      statusEl.textContent = 'HIGH LOAD (80–100%)';
      statusEl.className = 'status-pill status-warn';
    } else {
      statusEl.textContent = 'WITHIN SAFE RANGE (< 80%)';
      statusEl.className = 'status-pill status-ok';
    }
  }

  function getFuelCapacityGallons() {
    const fuelEl = $(id('fuel-capacity'));
    if (!fuelEl) return 0;
    return parseFloat(fuelEl.value) || 0;
  }

  function fuelRateGalPerKw(totalKw, genKw) {
    if (!genKw || !totalKw) return 0;
    const pct = (totalKw / genKw) * 100;
    let rate = CONSTANTS.FUEL_RATES_BY_LOAD_PERCENT_GAL_PER_KW[0].rateGalHrPerKw;
    for (const t of CONSTANTS.FUEL_RATES_BY_LOAD_PERCENT_GAL_PER_KW) {
      if (pct <= t.maxUtil) {
        rate = t.rateGalHrPerKw;
        break;
      }
    }
    return rate;
  }

  function calculateRuntime(totalKw) {
    const rateEl = $(id('consumption-rate'));
    const runtimeEl = $(id('runtime'));
    const genKw = parseFloat(($(id('gen-capacity')) && $(id('gen-capacity')).value)) || 0;
    const capacityGallons = getFuelCapacityGallons();

    if (!rateEl || !runtimeEl) return;
    if (!genKw || !totalKw || !capacityGallons) {
      rateEl.textContent = '0.00';
      runtimeEl.textContent = '0.0';
      return;
    }
    const rateGallons = fuelRateGalPerKw(totalKw, genKw);
    rateEl.textContent = rateGallons.toFixed(3);
    const gallonsPerHr = rateGallons * totalKw;
    runtimeEl.textContent = (capacityGallons / gallonsPerHr).toFixed(1);
  }

  function applyScenarioData(data) {
    $$('.input-error').forEach(el => clearValidationError(el));
    $$('.validation-error').forEach(el => { el.style.display = 'none'; });
    const nameEl = $(id('scenario-name'));
    const notesEl = $(id('scenario-notes'));
    const genEl = $(id('gen-capacity'));
    const fuelEl = $(id('fuel-capacity'));
    if (data.scenarioName != null && nameEl) nameEl.value = data.scenarioName;
    if (data.scenarioNotes != null && notesEl) notesEl.value = data.scenarioNotes;
    if (data.generatorCapacity != null && genEl) genEl.value = (parseFloat(data.generatorCapacity) !== 0) ? data.generatorCapacity : '';
    if (fuelEl) {
      if (data.fuelTankCapacityGallons != null) {
        const capacityGallons = parseFloat(data.fuelTankCapacityGallons) || 0;
        fuelEl.value = capacityGallons !== 0 ? capacityGallons : '';
      } else if (data.fuelTankCapacityLiters != null) {
        const capacityL = parseFloat(data.fuelTankCapacityLiters) || 0;
        const capacityGallons = capacityL / CONSTANTS.LITERS_PER_GALLON;
        fuelEl.value = capacityGallons !== 0 ? capacityGallons : '';
      }
    }

    $$('.equipment-row:not(.custom-item-row) .qty-input').forEach(inp => { if (inp) inp.value = ''; });
    $$('.custom-item-row').forEach(row => row.remove());

    if (data.equipment && Array.isArray(data.equipment)) {
      data.equipment.forEach(item => {
        if (item.isCustom) {
          const catId = item.categoryId || 'cat-standard';
          const tbody = $(`#${catId} .equipment-table tbody`);
          if (!tbody) return;
          const tr = document.createElement('tr');
          tr.className = 'equipment-row custom-item-row';
          tr.dataset.name = item.name;
          tr.dataset.kwValue = item.kwValue || '0';
          const kw = parseFloat(item.kwValue) || 0;
          const qty = parseInt(item.qty, 10) || 0;
          tr.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td><input type="number" min="0" step="1" value="${qty !== 0 ? qty : ''}" placeholder="0" class="qty qty-input"></td>
            <td class="num">${kw.toFixed(2)}</td>
            <td class="num item-total">0.00</td>
            <td class="col-delete"><button type="button" class="btn btn-delete btn-delete-row">✕</button></td>
          `;
          tbody.appendChild(tr);
        } else {
          const row = $$('.equipment-row:not(.custom-item-row)').find(r =>
            (r.dataset.name || (r.querySelector('td') && r.querySelector('td').textContent.trim())) === item.name
          );
          if (row) {
            const qtyIn = row.querySelector('.qty-input');
            if (qtyIn) qtyIn.value = (item.qty && parseFloat(item.qty) !== 0) ? item.qty : '';
          }
        }
      });
    }
    filterEquipmentSearch();
  }

  function populateScenarioSelect() {
    const sel = $(id('scenario-select'));
    if (!sel) return;
    const btnLoad = $(id('btn-load'));
    const btnDelete = $(id('btn-delete-scenario'));
    const btnClear = $(id('btn-clear-scenarios'));
    const list = getSavedScenarios().slice().sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    const prev = sel.value;
    sel.innerHTML = list.length === 0
      ? '<option value="">— No saved scenarios —</option>'
      : '<option value="">— Select scenario to load —</option>';
    list.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = String(s.id);
      const baseName = s.baseName || (s.data && s.data.scenarioName) || 'Unnamed scenario';
      const stamp = s.savedAt ? new Date(s.savedAt).toLocaleString() : '';
      opt.textContent = stamp ? `${baseName} (${stamp})` : baseName;
      sel.appendChild(opt);
    });
    if (prev && list.some(s => String(s.id) === prev)) sel.value = prev;
    const disabled = list.length === 0;
    sel.disabled = disabled;
    if (btnLoad) btnLoad.disabled = disabled;
    if (btnDelete) btnDelete.disabled = disabled;
    if (btnClear) btnClear.disabled = disabled;
  }

  function onPrint() {
    const btn = $(id('btn-print'));
    const origText = btn ? btn.textContent : 'Print';
    showToast('Opening print dialog...', 'info', 2000);
    if (btn) {
      btn.textContent = 'Printing...';
      window.onafterprint = () => {
        btn.textContent = origText;
        window.onafterprint = null;
      };
    }
    window.print();
  }

  function setupPlaceholderBehavior(input) {
    if (!input) return;
    input.addEventListener('focus', function() {
      if (this.value === '0' || this.value === '0.0') {
        this.value = '';
      }
      /* Do not call select() here: applySort() restores focus after reordering,
         which re-fires focus and would select the current value, so the next
         keypress would replace it (e.g. "1" becomes "2" instead of "12"). */
    });
    input.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.value = '';
      }
    });
  }

  function onResetQuantities() {
    if (!confirm('Reset all equipment quantities to zero? Scenario name, notes, and capacities are kept.')) return;
    $$('.qty-input').forEach(inp => { if (inp) inp.value = ''; });
    calculateLoad();
    showToast('Quantities reset', 'success', 2000);
  }

  function onFullReset() {
    if (!confirm('Full sheet reset? This clears quantities, capacities, scenario name/notes, and removes all custom equipment.')) return;
    $$('.qty-input').forEach(inp => { if (inp) inp.value = ''; });
    const gen = $(id('gen-capacity'));
    const fuel = $(id('fuel-capacity'));
    const name = $(id('scenario-name'));
    const notes = $(id('scenario-notes'));
    const searchInput = $(id('search-equipment'));
    if (gen) gen.value = '';
    if (fuel) fuel.value = '';
    if (name) name.value = '';
    if (notes) notes.value = '';
    if (searchInput) searchInput.value = '';
    $$('.custom-item-row').forEach(row => row.remove());
    filterEquipmentSearch();
    updateAutosaveTimestampDisplay('');
    updateSavedDisplay(null);
    showToast('Full sheet reset complete', 'success', 2000);
  }

  function onSave() {
    let hasErrors = false;
    Object.keys(SIDEBAR_RULES).forEach(name => {
      if (!validateAndShowSidebar(name)) hasErrors = true;
    });
    if (hasErrors) {
      showToast('Please fix validation errors before saving', 'warning', 3000);
      return;
    }
    const data = getCurrentWorksheetData();
    let scenarioName = (data.scenarioName && data.scenarioName.trim()) || '';
    if (!scenarioName) {
      scenarioName = prompt('Enter a name for this scenario:', `Scenario ${new Date().toLocaleDateString()}`);
      if (!scenarioName || !scenarioName.trim()) {
        acknowledgeClick($(id('btn-save')), 'Cancelled', 1200);
        return;
      }
      scenarioName = scenarioName.trim();
    }
    const scenarioData = Object.assign({}, data, { scenarioName });
    const savedAt = new Date();
    const baseName = scenarioName;
    const displayName = `${baseName} (${savedAt.toLocaleString()})`;
    const list = getSavedScenarios();
    const savedScenario = { id: String(savedAt.getTime()), displayName, baseName, savedAt: savedAt.toISOString(), data: scenarioData };
    const existingIndex = list.findIndex(s => (s.baseName || '').trim() === baseName);
    if (existingIndex >= 0) {
      if (!confirm(`A scenario named "${baseName}" already exists. Overwrite it?`)) return;
      list[existingIndex] = savedScenario;
    } else {
      list.push(savedScenario);
    }
    try {
      saveScenariosToStorage(list);
    } catch (e) {
      console.error('Failed to save scenarios:', e);
      showToast('Could not save scenario. Storage may be disabled or full.', 'error', 4000);
      return;
    }
    populateScenarioSelect();
    const sel = $(id('scenario-select'));
    if (sel) sel.value = String(savedScenario.id);
    updateAutosaveTimestampDisplay(savedScenario.savedAt);
    updateSavedDisplay(savedScenario.savedAt);
    acknowledgeClick($(id('btn-save')), 'Saved!', 1500);
    showToast(`Scenario saved: ${displayName}`, 'success', 3000);
  }

  function onLoad() {
    const sel = $(id('scenario-select'));
    if (!sel || sel.value === '') {
      showToast('Select a scenario from the dropdown to load', 'warning', 3000);
      return;
    }
    const list = getSavedScenarios();
    const scenario = list.find(s => String(s.id) === sel.value);
    if (!scenario || !scenario.data) {
      showToast('Scenario not found', 'error', 2000);
      return;
    }
    applyScenarioData(scenario.data);
    const nameEl = $(id('scenario-name'));
    if (nameEl) nameEl.value = scenario.baseName || scenario.data.scenarioName || '';
    attachListeners();
    calculateLoad();
    updateAutosaveTimestampDisplay(scenario.savedAt || '');
    updateSavedDisplay(scenario.savedAt || null);
    acknowledgeClick($(id('btn-load')), 'Loaded!', 1500);
    showToast(`Scenario loaded: ${scenario.displayName}`, 'success', 2500);
  }

  function onDeleteScenario() {
    const sel = $(id('scenario-select'));
    if (!sel || sel.value === '') {
      showToast('Select a scenario to delete', 'warning', 3000);
      return;
    }
    const list = getSavedScenarios();
    const idx = list.findIndex(s => String(s.id) === sel.value);
    const scenario = idx >= 0 ? list[idx] : null;
    if (!scenario) return;
    if (!confirm(`Delete scenario "${scenario.baseName || scenario.displayName}"?`)) return;
    list.splice(idx, 1);
    try {
      saveScenariosToStorage(list);
    } catch (e) {
      console.error('Failed to save scenarios:', e);
      showToast('Could not delete scenario. Storage may be disabled or full.', 'error', 4000);
      return;
    }
    populateScenarioSelect();
    showToast('Scenario deleted', 'success', 2000);
  }

  function onClearAllScenarios() {
    const list = getSavedScenarios();
    if (list.length === 0) {
      showToast('No scenarios to clear', 'info', 2000);
      return;
    }
    if (!confirm(`Clear all ${list.length} scenarios? This cannot be undone.`)) return;
    try {
      saveScenariosToStorage([]);
    } catch (e) {
      showToast('Could not clear scenarios. Storage may be disabled or full.', 'error', 4000);
      return;
    }
    populateScenarioSelect();
    updateAutosaveTimestampDisplay('');
    updateSavedDisplay(null);
    showToast('All scenarios cleared', 'success', 2000);
  }

  function onImportFromFile() {
    const input = $(id('scenario-file-input'));
    if (input) {
      input.value = '';
      input.click();
    }
  }

  function sanitizeImportedScenarioData(rawData, issues) {
    if (!rawData || typeof rawData !== 'object') return null;
    const data = Object.assign({}, rawData);
    const cleaned = {
      scenarioName: typeof data.scenarioName === 'string' ? data.scenarioName : '',
      scenarioNotes: typeof data.scenarioNotes === 'string' ? data.scenarioNotes : ''
    };

    const genCapacity = Number(data.generatorCapacity);
    if (data.generatorCapacity != null && (!Number.isFinite(genCapacity) || genCapacity < 0)) {
      issues.push(`Generator capacity: invalid value "${data.generatorCapacity}" replaced with 0.`);
      cleaned.generatorCapacity = 0;
    } else if (data.generatorCapacity != null) {
      cleaned.generatorCapacity = genCapacity;
    }

    if (data.fuelTankCapacityGallons != null) {
      const fuelCapacityGallons = Number(data.fuelTankCapacityGallons);
      if (!Number.isFinite(fuelCapacityGallons) || fuelCapacityGallons < 0) {
        issues.push(`Fuel tank capacity (gallons): invalid value "${data.fuelTankCapacityGallons}" replaced with 0.`);
        cleaned.fuelTankCapacityGallons = 0;
      } else {
        cleaned.fuelTankCapacityGallons = fuelCapacityGallons;
      }
    } else if (data.fuelTankCapacityLiters != null) {
      const fuelCapacityL = Number(data.fuelTankCapacityLiters);
      if (!Number.isFinite(fuelCapacityL) || fuelCapacityL < 0) {
        issues.push(`Fuel tank capacity (liters): invalid value "${data.fuelTankCapacityLiters}" replaced with 0.`);
        cleaned.fuelTankCapacityGallons = 0;
      } else {
        cleaned.fuelTankCapacityGallons = fuelCapacityL / CONSTANTS.LITERS_PER_GALLON;
        issues.push(`Fuel tank capacity (liters): converted "${data.fuelTankCapacityLiters}" liters to gallons for this calculator.`);
      }
    }
    if (data.fuelUnit != null && String(data.fuelUnit).toUpperCase() !== 'G') {
      issues.push(`Fuel unit: "${data.fuelUnit}" normalized to "G" for this gallons-based calculator.`);
    }

    const equipment = Array.isArray(data.equipment) ? data.equipment : [];
    const sanitizedEquipment = [];
    equipment.forEach((item, index) => {
      const row = index + 1;
      if (!item || typeof item !== 'object') {
        issues.push(`Equipment row ${row}: dropped because item is not an object.`);
        return;
      }
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      if (!name) {
        issues.push(`Equipment row ${row}: dropped because name is missing.`);
        return;
      }
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
        issues.push(`Equipment row ${row} (${name}): invalid qty "${item.qty}" replaced with 0.`);
      }
      const safeQty = Number.isFinite(qty) && qty >= 0 && Number.isInteger(qty) ? qty : 0;

      const isCustom = item.isCustom === true;
      if (isCustom) {
        const kw = Number(item.kwValue);
        if (!Number.isFinite(kw) || kw < 0) {
          issues.push(`Equipment row ${row} (${name}): dropped because custom kW "${item.kwValue}" is invalid.`);
          return;
        }
        let catId = item.categoryId;
        if (!catId || !Object.prototype.hasOwnProperty.call(EQUIPMENT, catId)) {
          issues.push(`Equipment row ${row} (${name}): invalid category "${item.categoryId || ''}" replaced with "cat-standard".`);
          catId = 'cat-standard';
        }
        sanitizedEquipment.push({
          name,
          kwValue: kw.toFixed(2),
          qty: safeQty,
          isCustom: true,
          categoryId: catId
        });
      } else {
        sanitizedEquipment.push({
          name,
          qty: safeQty,
          isCustom: false
        });
      }
    });
    cleaned.equipment = sanitizedEquipment;
    return cleaned;
  }

  function buildImportIssueReport(sourceFileName, issues) {
    const lines = [];
    lines.push('Load Calculator Basic - Import Sanitization Report');
    lines.push('=================================================');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Source file: ${sourceFileName || 'Unknown'}`);
    lines.push(`Issues found: ${issues.length}`);
    lines.push('');
    lines.push('Detected issues');
    lines.push('---------------');
    issues.forEach((issue, idx) => lines.push(`${idx + 1}. ${issue}`));
    lines.push('');
    lines.push('How to fix the source file');
    lines.push('--------------------------');
    lines.push('- Ensure quantity values are whole numbers >= 0.');
    lines.push('- Ensure custom items have valid non-negative kW values and valid category IDs.');
    lines.push('- Ensure generator/fuel values are non-negative numbers.');
    lines.push('- Re-export and import the corrected file.');
    return lines.join('\n');
  }

  function downloadImportIssueReport(sourceFileName, issues) {
    if (!issues || issues.length === 0) return;
    const reportText = buildImportIssueReport(sourceFileName, issues);
    const safeStamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `load-basic-import-sanitization-report-${safeStamp}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onScenarioFileSelected(ev) {
    const file = ev.target && ev.target.files[0];
    if (!file) return;
    const sourceFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const issues = [];
        const json = JSON.parse(reader.result);
        const state = json.state || json.data || json;
        let data = null;
        if (state.data) {
          data = state.data;
        } else if (state.scenarioName != null || state.equipment != null) {
          data = state;
        } else if (Array.isArray(state.scenarios) && state.scenarios[0] && state.scenarios[0].data) {
          data = state.scenarios[0].data;
        } else if (Array.isArray(state) && state[0] && state[0].data) {
          data = state[0].data;
        }
        if (data) {
          const sanitized = sanitizeImportedScenarioData(data, issues);
          if (!sanitized) {
            showToast('File does not contain a valid scenario', 'warning', 3000);
            ev.target.value = '';
            return;
          }
          applyScenarioData(sanitized);
          attachListeners();
          calculateLoad();
          if (issues.length > 0) {
            downloadImportIssueReport(sourceFileName, issues);
            showToast(`Imported with ${issues.length} data issue(s). Report downloaded for review/printing.`, 'warning', 5000);
          } else {
            showToast('Scenario imported and applied', 'success', 3000);
          }
        } else {
          showToast('File does not contain a valid scenario', 'warning', 3000);
        }
      } catch (e) {
        showToast(`Import failed: ${e.message || 'Invalid or corrupted file.'} Use a scenario JSON exported from this calculator.`, 'error', 4000);
      }
      ev.target.value = '';
    };
    reader.onerror = () => {
      showToast('Error reading file. Please try again or choose a different file.', 'error', 4000);
      ev.target.value = '';
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
    lines.push(`${toCsvCell('Scenario Name')},${toCsvCell(data.scenarioName || '')}`);
    lines.push(`${toCsvCell('Notes')},${toCsvCell(data.scenarioNotes || '')}`);
    lines.push(`${toCsvCell('Generator capacity (kW)')},${toCsvCell(data.generatorCapacity || '')}`);
    lines.push(`${toCsvCell('Fuel tank (gal)')},${toCsvCell(data.fuelTankCapacityGallons != null ? data.fuelTankCapacityGallons : '')}`);
    lines.push(`${toCsvCell('Exported At')},${toCsvCell(new Date().toLocaleString())}`);
    lines.push('');
    lines.push('Item,kW,Qty,Custom');
    (data.equipment || []).forEach(row => {
      lines.push([
        toCsvCell(row.name || ''),
        toCsvCell(row.kwValue != null ? row.kwValue : ''),
        toCsvCell(row.qty != null ? row.qty : ''),
        toCsvCell(row.isCustom ? 'Yes' : 'No')
      ].join(','));
    });
    return lines.join('\n');
  }

  function onExportToFile() {
    const dialog = document.getElementById(PREFIX + 'export-format-dialog');
    if (dialog) {
      const jsonRadio = document.querySelector('#' + PREFIX + 'export-format-dialog input[name="' + PREFIX + 'export-format"][value="JSON"]');
      if (jsonRadio) jsonRadio.checked = true;
      dialog.hidden = false;
      dialog.setAttribute('aria-hidden', 'false');
    }
  }

  function performExportWithFormat(fmt) {
    const data = getCurrentWorksheetData();
    const format = (fmt && String(fmt).toUpperCase()) || 'JSON';
    if (format === 'CSV') {
      const csv = buildCsvExport(data);
      downloadTextFile(csv, 'text/csv;charset=utf-8', 'load-calculator-basic-export.csv');
      showToast('Scenario exported as CSV', 'success', 2000);
      return;
    }
    const payload = { data, exportedAt: new Date().toISOString() };
    downloadTextFile(JSON.stringify(payload, null, 2), 'application/json', 'load-calculator-basic-scenario.json');
    showToast('Scenario exported', 'success', 2000);
  }

  function closeExportFormatDialog() {
    const dialog = document.getElementById(PREFIX + 'export-format-dialog');
    if (dialog) {
      dialog.hidden = true;
      dialog.setAttribute('aria-hidden', 'true');
    }
  }

  function onResetCategory(e) {
    const id = e.target.dataset.resetTarget;
    if (!id) return;
    $$(`#${id} .qty-input`).forEach(inp => { if (inp) inp.value = ''; });
    calculateLoad();
    showToast('Category quantities reset', 'success', 2000);
  }

  function onDeleteRow(e) {
    if (!confirm('Delete this custom item?')) return;
    const row = e.target.closest('.equipment-row');
    if (row) {
      row.remove();
      calculateLoad();
      showToast('Custom item deleted', 'success', 2000);
    }
  }

  function onAddCustomRow(e) {
    const addRow = e.target.closest('.add-row');
    if (!addRow) return;
    const catId = addRow.dataset.cat;
    const nameIn = addRow.querySelector('.add-name');
    const kwIn = addRow.querySelector('.add-kw');
    const qtyIn = addRow.querySelector('.add-qty');
    const name = (nameIn && nameIn.value.trim()) || '';
    const kw = parseFloat(kwIn && kwIn.value);
    const qty = parseInt(qtyIn && qtyIn.value, 10);
    if (!name) {
      showToast('Enter an equipment name', 'warning', 2000);
      return;
    }
    if (isNaN(kw) || kw < 0) {
      showToast('kW must be a number ≥ 0', 'warning', 2000);
      return;
    }
    if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
      showToast('Quantity must be a whole number ≥ 0', 'warning', 2000);
      return;
    }
    const qtyVal = qty;
    const tbody = $(`#${catId} .equipment-table tbody`);
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.className = 'equipment-row custom-item-row';
    const kwStr = kw.toFixed(2);
    tr.innerHTML = `
      <td>${escapeHtml(name)}</td>
      <td><input type="number" min="0" step="1" value="${qtyVal !== 0 ? qtyVal : ''}" placeholder="0" class="qty qty-input"></td>
      <td class="num">${kwStr}</td>
      <td class="num item-total">0.00</td>
      <td class="col-delete"><button type="button" class="btn btn-delete btn-delete-row">✕</button></td>
    `;
    tr.setAttribute('data-name', name);
    tr.setAttribute('data-kw-value', kwStr);
    tbody.appendChild(tr);
    if (nameIn) nameIn.value = '';
    if (kwIn) kwIn.value = '';
    if (qtyIn) qtyIn.value = '0';
    attachListeners();
    calculateLoad();
    showToast('Custom item added', 'success', 2000);
  }

  function setupHelpPopovers() {
    const helpPopoverIdPrefix = PREFIX + 'help-popover-';
    let helpHoverHideTimeout = null;
    function getPopoverForBtn(btn) {
      const id = btn.getAttribute('data-help');
      return id ? document.getElementById(helpPopoverIdPrefix + id) : null;
    }
    function closeAllHelpPopovers(unpin) {
      if (unpin) $$('.help-popover').forEach(p => p.classList.remove('pinned'));
      $$('.help-popover').forEach(p => { p.hidden = true; });
      $$('.help-icon').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }
    function scheduleHoverHide(pop, btn) {
      if (helpHoverHideTimeout) clearTimeout(helpHoverHideTimeout);
      helpHoverHideTimeout = setTimeout(() => {
        if (pop && !pop.classList.contains('pinned')) {
          pop.hidden = true;
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
        helpHoverHideTimeout = null;
      }, 220);
    }
    function cancelHoverHide() {
      if (helpHoverHideTimeout) {
        clearTimeout(helpHoverHideTimeout);
        helpHoverHideTimeout = null;
      }
    }
    $$('.help-icon').forEach(btn => {
      const pop = getPopoverForBtn(btn);
      if (!pop) return;
      btn.addEventListener('mouseenter', () => {
        cancelHoverHide();
        pop.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      });
      btn.addEventListener('mouseleave', () => {
        if (!pop.classList.contains('pinned')) scheduleHoverHide(pop, btn);
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cancelHoverHide();
        const wasPinned = pop.classList.contains('pinned');
        closeAllHelpPopovers(true);
        if (!wasPinned) {
          const popToShow = pop;
          const btnToUpdate = btn;
          setTimeout(() => {
            popToShow.classList.add('pinned');
            popToShow.hidden = false;
            btnToUpdate.setAttribute('aria-expanded', 'true');
          }, 0);
        }
      });
    });
    $$('.help-popover').forEach(pop => {
      pop.addEventListener('mouseenter', cancelHoverHide);
      pop.addEventListener('mouseleave', () => {
        const helpId = (pop.id || '').replace(helpPopoverIdPrefix, '');
        const b = helpId ? $(`.help-icon[data-help="${helpId}"]`) : null;
        if (!pop.classList.contains('pinned')) scheduleHoverHide(pop, b);
      });
    });
    document.addEventListener('click', (e) => {
      if (!ROOT.contains(e.target)) return;
      if (e.target.closest('.help-icon') || e.target.closest('.help-popover')) return;
      closeAllHelpPopovers(true);
    });
  }

  function onQtyFocus(e) {
    const inp = e.target;
    if (parseFloat(inp.value) === 0 && inp.value.trim() !== '') inp.value = '';
    inp.classList.remove('input-placeholder-zero');
  }

  function onQtyBlur(e) {
    const inp = e.target;
    // Keep empty (placeholder shows) - calculations handle empty as 0
    validateAndShowQty(inp);
    calculateLoad();
  }

  function onGenFuelBlur(e) {
    const name = e.target.id || '';
    if (SIDEBAR_RULES[name]) validateAndShowSidebar(name);
    calculateLoad();
  }

  function attachListeners() {
    $$('[data-reset-target]').forEach(btn => {
      btn.removeEventListener('click', onResetCategory);
      btn.addEventListener('click', onResetCategory);
    });
    $$('.add-custom-btn').forEach(btn => {
      btn.removeEventListener('click', onAddCustomRow);
      btn.addEventListener('click', onAddCustomRow);
    });
    $$('.btn-delete-row').forEach(btn => {
      btn.removeEventListener('click', onDeleteRow);
      btn.addEventListener('click', onDeleteRow);
    });
    $$('.qty-input').forEach(inp => {
      inp.removeEventListener('focus', onQtyFocus);
      inp.removeEventListener('blur', onQtyBlur);
      inp.removeEventListener('input', calculateLoad);
      inp.addEventListener('focus', onQtyFocus);
      inp.addEventListener('blur', onQtyBlur);
      inp.addEventListener('input', calculateLoad);
      setupPlaceholderBehavior(inp);
    });
    const gen = $(id('gen-capacity'));
    const fuel = $(id('fuel-capacity'));
    [gen, fuel].forEach(inp => {
      if (!inp) return;
      inp.removeEventListener('input', calculateLoad);
      inp.addEventListener('input', calculateLoad);
      inp.removeEventListener('focus', onQtyFocus);
      inp.removeEventListener('blur', onGenFuelBlur);
      inp.addEventListener('focus', onQtyFocus);
      inp.addEventListener('blur', onGenFuelBlur);
      setupPlaceholderBehavior(inp);
    });
    const btnPrint = $(id('btn-print'));
    const btnReset = $(id('btn-reset-qty'));
    const btnFull = $(id('btn-full-reset'));
    const btnSave = $(id('btn-save'));
    const btnLoad = $(id('btn-load'));
    const btnDeleteScen = $(id('btn-delete-scenario'));
    const btnClearScen = $(id('btn-clear-scenarios'));
    const btnImport = $(id('btn-import'));
    const btnExport = $(id('btn-export'));
    const btnClearAutosave = $(id('btn-clear-autosave'));
    const fileInput = $(id('scenario-file-input'));
    if (btnPrint) { btnPrint.removeEventListener('click', onPrint); btnPrint.addEventListener('click', onPrint); }
    const guideOverlay = document.getElementById(PREFIX + 'guide-modal-overlay');
    const guideBody = document.getElementById(PREFIX + 'guide-modal-body');
    function openGuide() {
      if (!guideOverlay || !guideBody) return;
      if (guideBody.innerHTML === '') {
        const embedded = typeof window.LOAD_CALC_BASIC_GUIDE_MARKDOWN === 'string' && window.LOAD_CALC_BASIC_GUIDE_MARKDOWN.length > 0;
        if (embedded) {
          guideBody.innerHTML = simpleMarkdownToHtml(window.LOAD_CALC_BASIC_GUIDE_MARKDOWN);
        } else {
          guideBody.innerHTML = '<p class="guide-loading">Loading…</p>';
          fetch('README.md').then(r => r.text()).then(md => {
            guideBody.innerHTML = simpleMarkdownToHtml(md);
          }).catch(() => {
            guideBody.innerHTML = '<p>User guide could not be loaded. Open README.md from this folder if needed.</p>';
          });
        }
      }
      guideOverlay.hidden = false;
      guideOverlay.setAttribute('aria-hidden', 'false');
    }
    const btnGuide = document.getElementById(PREFIX + 'guide-btn');
    if (btnGuide) { btnGuide.removeEventListener('click', openGuide); btnGuide.addEventListener('click', openGuide); }
    function closeGuide() {
      if (guideOverlay) { guideOverlay.hidden = true; guideOverlay.setAttribute('aria-hidden', 'true'); }
    }
    const guideClose = document.getElementById(PREFIX + 'guide-modal-close');
    if (guideClose) { guideClose.removeEventListener('click', closeGuide); guideClose.addEventListener('click', closeGuide); }
    function closeGuideOnOverlayClick(e) {
      if (e.target === guideOverlay) { guideOverlay.hidden = true; guideOverlay.setAttribute('aria-hidden', 'true'); }
    }
    if (guideOverlay) {
      guideOverlay.removeEventListener('click', closeGuideOnOverlayClick);
      guideOverlay.addEventListener('click', closeGuideOnOverlayClick);
    }
    if (btnReset) { btnReset.removeEventListener('click', onResetQuantities); btnReset.addEventListener('click', onResetQuantities); }
    if (btnFull) { btnFull.removeEventListener('click', onFullReset); btnFull.addEventListener('click', onFullReset); }
    if (btnSave) { btnSave.removeEventListener('click', onSave); btnSave.addEventListener('click', onSave); }
    if (btnLoad) { btnLoad.removeEventListener('click', onLoad); btnLoad.addEventListener('click', onLoad); }
    if (btnDeleteScen) { btnDeleteScen.removeEventListener('click', onDeleteScenario); btnDeleteScen.addEventListener('click', onDeleteScenario); }
    if (btnClearScen) { btnClearScen.removeEventListener('click', onClearAllScenarios); btnClearScen.addEventListener('click', onClearAllScenarios); }
    if (btnImport) { btnImport.removeEventListener('click', onImportFromFile); btnImport.addEventListener('click', onImportFromFile); }
    if (btnExport) { btnExport.removeEventListener('click', onExportToFile); btnExport.addEventListener('click', onExportToFile); }
    const exportFormatDialog = document.getElementById(PREFIX + 'export-format-dialog');
    const exportFormatConfirm = document.getElementById(PREFIX + 'export-format-confirm');
    const exportFormatCancel = document.getElementById(PREFIX + 'export-format-cancel');
    function onExportFormatConfirm() {
      const selected = document.querySelector('#' + PREFIX + 'export-format-dialog input[name="' + PREFIX + 'export-format"]:checked');
      const fmt = selected ? selected.value : 'JSON';
      performExportWithFormat(fmt);
      closeExportFormatDialog();
    }
    if (exportFormatConfirm) {
      exportFormatConfirm.removeEventListener('click', onExportFormatConfirm);
      exportFormatConfirm.addEventListener('click', onExportFormatConfirm);
    }
    if (exportFormatCancel) {
      exportFormatCancel.removeEventListener('click', closeExportFormatDialog);
      exportFormatCancel.addEventListener('click', closeExportFormatDialog);
    }
    function closeExportOnOverlayClick(e) {
      if (e.target === exportFormatDialog) closeExportFormatDialog();
    }
    if (exportFormatDialog) {
      exportFormatDialog.removeEventListener('click', closeExportOnOverlayClick);
      exportFormatDialog.addEventListener('click', closeExportOnOverlayClick);
    }
    if (btnClearAutosave) { btnClearAutosave.removeEventListener('click', clearAutosavedState); btnClearAutosave.addEventListener('click', clearAutosavedState); }
    if (fileInput) { fileInput.removeEventListener('change', onScenarioFileSelected); fileInput.addEventListener('change', onScenarioFileSelected); }
    const sortSel = $(id('sort-equipment'));
    if (sortSel) { sortSel.removeEventListener('change', onSortChange); sortSel.addEventListener('change', onSortChange); }
    const searchEl = $(id('search-equipment'));
    if (searchEl) {
      searchEl.removeEventListener('input', filterEquipmentSearch);
      searchEl.addEventListener('input', filterEquipmentSearch);
    }
  }

  function init() {
    if (!document._loadBasicCategoryToggleBound) {
      document._loadBasicCategoryToggleBound = true;
      document.addEventListener('click', function (e) {
        const head = e.target.closest('.category-head');
        if (!head || !ROOT.contains(head)) return;
        if (e.target.closest('.category-actions')) return;
        const cat = e.target.closest('.category');
        if (cat) cat.classList.toggle('collapsed');
      });
    }
    buildCategories();
    populateScenarioSelect();
    loadWorksheetState();
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      if (saved && ['name-asc', 'name-desc', 'kw-desc', 'kw-asc'].includes(saved)) {
        currentSortKey = saved;
        const sel = $(id('sort-equipment'));
        if (sel) sel.value = saved;
      }
    } catch (e) {}
    setupHelpPopovers();
    attachListeners();
    applySort();
    calculateLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
