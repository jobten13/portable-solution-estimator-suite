/**
 * Consumables Calculator - UCD UberCalc (Consumables panel)
 * Uses cons- prefixed IDs.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cons-fieldHospitalScenarios';
  const STORAGE_BUFFER = 'cons-fieldHospitalBuffer';
  const STORAGE_CONSUMABLES = 'cons-fieldHospitalConsumables';
  const STORAGE_FILENAME = 'cons-fieldHospitalFileName';
  const SORT_STORAGE_KEY = 'cons-fieldHospitalSort';

  function g(id) {
    return document.getElementById(`cons-${id}`);
  }

  const VALIDATION_RULES = {
    days: { min: 0, max: 3650, message: 'Days must be between 0 and 3650' },
    beds: { min: 0, max: 10000, message: 'Beds must be between 0 and 10,000' },
    buffer: { min: 0, max: 100, message: 'Buffer must be between 0% and 100%' }
  };

  function validateInput(fieldId) {
    const el = g(fieldId);
    if (!el) return { valid: true };
    const rule = VALIDATION_RULES[fieldId];
    if (!rule) return { valid: true };
    const value = el.value.trim();
    if (value === '') return { valid: true };
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, message: 'Enter a valid number' };
    if (num < rule.min || num > rule.max) return { valid: false, message: rule.message };
    return { valid: true };
  }

  function showValidationError(fieldId, message) {
    const el = g(fieldId);
    if (!el) return;
    el.classList.add('input-error');
    const paramGroup = el.closest('.param-group');
    if (paramGroup) {
      let err = paramGroup.querySelector('.validation-error');
      if (!err) {
        err = document.createElement('small');
        err.className = 'validation-error';
        paramGroup.appendChild(err);
      }
      err.textContent = message;
      err.style.display = 'block';
    }
  }

  function clearValidationError(fieldId) {
    const el = g(fieldId);
    if (!el) return;
    el.classList.remove('input-error');
    const paramGroup = el.closest('.param-group');
    if (paramGroup) {
      const err = paramGroup.querySelector('.validation-error');
      if (err) err.style.display = 'none';
    }
  }

  function validateAndShow(fieldId) {
    const result = validateInput(fieldId);
    if (result.valid) clearValidationError(fieldId);
    else showValidationError(fieldId, result.message);
    return result.valid;
  }

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sanitizeDays(value) {
    return clampNumber(toFiniteNumber(value), 0, VALIDATION_RULES.days.max);
  }

  function sanitizeBeds(value) {
    return clampNumber(toFiniteNumber(value), 0, VALIDATION_RULES.beds.max);
  }

  function sanitizeBuffer(value) {
    return clampNumber(toFiniteNumber(value), 0, VALIDATION_RULES.buffer.max);
  }

  let allConsumables = [];
  let filteredConsumables = [];
  let deploymentDays = 0;
  let deploymentBeds = 0;
  let bufferPercentage = 0;
  let currentFileName = null;
  let currentSortKey = 'name-asc';
  /** 'ward' | 'icu' | 'custom' | null. null = no list / cleared; 'custom' = list present but not a known Ward/ICU list; 'ward'/'icu' = known list. Drives rate column label (Per Ward Bed / Per ICU Bed / Per Bed). */
  let currentListType = null;
  let customItemCounter = 1;

  function listTypeFromFileName(fileName) {
    if (!fileName) return null;
    if (fileName === 'UCD Ward List') return 'ward';
    if (fileName === 'UCD ICU List') return 'icu';
    return 'custom';
  }

  /** Use saved listType if valid; otherwise derive from fileName. For scenario load/import. */
  function resolveListType(scenario) {
    const t = scenario && scenario.listType;
    if (t === 'ward' || t === 'icu' || t === 'custom') return t;
    return listTypeFromFileName(scenario && scenario.fileName);
  }

  function getRateColumnLabel(listType) {
    return listType === 'ward' ? 'Per day/Per Ward Bed' : listType === 'icu' ? 'Per day/Per ICU Bed' : 'Per day/Per Bed';
  }

  function getRatePlaceholder(listType) {
    return listType === 'ward' ? 'Per day/Per Ward Bed' : listType === 'icu' ? 'Per day/Per ICU Bed' : 'Per day/Per bed';
  }

  function setupPlaceholderBehavior(input) {
    if (!input) return;
    input.addEventListener('focus', function() {
      if (this.value === '0' || this.value === '0.0') {
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

  function setupEventListeners() {
    if (g('clear-autosave-btn')) g('clear-autosave-btn').addEventListener('click', clearAutosavedState);
    if (g('clear-items-btn')) g('clear-items-btn').addEventListener('click', clearAllItems);
    if (g('ward-list-btn')) g('ward-list-btn').addEventListener('click', loadWardList);
    if (g('icu-list-btn')) g('icu-list-btn').addEventListener('click', loadICUList);

    if (g('days')) {
      const daysEl = g('days');
      setupPlaceholderBehavior(daysEl);
      daysEl.addEventListener('input', function () {
        deploymentDays = sanitizeDays(parseFloat(this.value));
        saveData();
        calculateAndDisplay();
      });
      daysEl.addEventListener('blur', () => validateAndShow('days'));
    }
    if (g('beds')) {
      const bedsEl = g('beds');
      setupPlaceholderBehavior(bedsEl);
      bedsEl.addEventListener('input', function () {
        deploymentBeds = sanitizeBeds(parseFloat(this.value));
        saveData();
        calculateAndDisplay();
      });
      bedsEl.addEventListener('blur', () => validateAndShow('beds'));
    }
    if (g('buffer')) {
      const bufferEl = g('buffer');
      setupPlaceholderBehavior(bufferEl);
      bufferEl.addEventListener('input', function () {
        bufferPercentage = sanitizeBuffer(parseFloat(this.value));
        saveData();
        calculateAndDisplay();
      });
      bufferEl.addEventListener('blur', () => validateAndShow('buffer'));
    }
    if (g('search')) g('search').addEventListener('input', filterItems);
    if (g('min-qty-filter')) g('min-qty-filter').addEventListener('input', filterItems);
    if (g('nonzero-only-filter')) g('nonzero-only-filter').addEventListener('change', filterItems);
    if (g('add-item-btn')) g('add-item-btn').addEventListener('click', addCustomItem);
    if (g('new-item-name')) {
      g('new-item-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCustomItem();
        }
      });
    }
    if (g('new-item-rate')) {
      g('new-item-rate').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCustomItem();
        }
      });
    }
    if (g('print-btn')) g('print-btn').addEventListener('click', printReport);
    if (g('save-btn')) g('save-btn').addEventListener('click', saveScenario);
    if (g('load-btn')) g('load-btn').addEventListener('click', loadSelectedScenario);
    if (g('delete-btn')) g('delete-btn').addEventListener('click', deleteSelectedScenario);
    if (g('clear-btn')) g('clear-btn').addEventListener('click', clearAllScenarios);
    if (g('import-btn')) g('import-btn').addEventListener('click', importFromFile);
    const importInput = document.getElementById('cons-import-file-input');
    if (importInput) importInput.addEventListener('change', onImportFileSelected);
    if (g('export-btn')) g('export-btn').addEventListener('click', onExportToFile);

    const exportFormatDialog = g('export-format-dialog');
    const exportFormatConfirm = g('export-format-confirm');
    const exportFormatCancel = g('export-format-cancel');
    if (exportFormatConfirm) {
      exportFormatConfirm.addEventListener('click', function () {
        const selected = document.querySelector('#cons-export-format-dialog input[name="cons-export-format"]:checked');
        const fmt = (selected && selected.value) ? selected.value : 'JSON';
        performExportWithFormat(fmt);
        closeExportFormatDialog();
      });
    }
    if (exportFormatCancel) {
      exportFormatCancel.addEventListener('click', closeExportFormatDialog);
    }
    if (exportFormatDialog) {
      exportFormatDialog.addEventListener('click', function (e) {
        if (e.target === exportFormatDialog) closeExportFormatDialog();
      });
    }
    if (g('sort-equipment')) g('sort-equipment').addEventListener('change', onSortChange);
    if (g('consumables-container')) {
      g('consumables-container').addEventListener('click', onConsumablesTableClick);
    }

    (function initHelpPopovers() {
      const helpROOT = document.getElementById('panel-consumables') || document.documentElement;
      const helpPopoverIdPrefix = document.getElementById('panel-consumables') ? 'cons-help-popover-' : 'help-popover-';
      let helpHoverHideTimeout = null;
      function getPopoverForBtn(btn) {
        const id = btn.getAttribute('data-help');
        if (!id) return null;
        return document.getElementById(helpPopoverIdPrefix + id) || null;
      }
      function closeAllHelpPopovers(unpin) {
        if (unpin) helpROOT.querySelectorAll('.help-popover').forEach(p => p.classList.remove('pinned'));
        helpROOT.querySelectorAll('.help-popover').forEach(p => { p.hidden = true; });
        helpROOT.querySelectorAll('.help-icon').forEach(b => { b.setAttribute('aria-expanded', 'false'); b.removeAttribute('aria-describedby'); });
      }
      function scheduleHoverHide(pop, btn) {
        if (helpHoverHideTimeout) clearTimeout(helpHoverHideTimeout);
        helpHoverHideTimeout = setTimeout(() => {
          if (pop && !pop.classList.contains('pinned')) { pop.hidden = true; if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-describedby'); } }
          helpHoverHideTimeout = null;
        }, 220);
      }
      function cancelHoverHide() {
        if (helpHoverHideTimeout) { clearTimeout(helpHoverHideTimeout); helpHoverHideTimeout = null; }
      }
      helpROOT.querySelectorAll('.help-icon').forEach(btn => {
        const pop = getPopoverForBtn(btn);
        if (!pop) return;
        btn.addEventListener('mouseenter', () => {
          cancelHoverHide();
          pop.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
          if (pop.id) btn.setAttribute('aria-describedby', pop.id);
        });
        btn.addEventListener('mouseleave', () => { if (!pop.classList.contains('pinned')) scheduleHoverHide(pop, btn); });
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          cancelHoverHide();
          const wasPinned = pop.classList.contains('pinned');
          closeAllHelpPopovers(true);
          if (!wasPinned) {
            const popToShow = pop;
            const btnToUpdate = btn;
            setTimeout(function () {
              popToShow.classList.add('pinned');
              popToShow.hidden = false;
              btnToUpdate.setAttribute('aria-expanded', 'true');
              if (popToShow.id) btnToUpdate.setAttribute('aria-describedby', popToShow.id);
            }, 0);
          }
        });
      });
      helpROOT.querySelectorAll('.help-popover').forEach(pop => {
        pop.addEventListener('mouseenter', cancelHoverHide);
        pop.addEventListener('mouseleave', () => {
          const helpId = (pop.id || '').replace(helpPopoverIdPrefix, '');
          const b = helpId ? helpROOT.querySelector('.help-icon[data-help="' + helpId + '"]') : null;
          if (!pop.classList.contains('pinned')) scheduleHoverHide(pop, b);
        });
      });
      document.addEventListener('click', (e) => {
        if (!helpROOT.contains(e.target)) return;
        if (e.target.closest('.help-icon') || e.target.closest('.help-popover')) return;
        closeAllHelpPopovers(true);
      });
    })();

    updateScenarioDropdown();
  }

  function getMinQtyThreshold() {
    const minQtyEl = g('min-qty-filter');
    if (!minQtyEl) return { active: false, value: 0 };
    const raw = minQtyEl.value.trim();
    if (raw === '') return { active: false, value: 0 };
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return { active: true, value: 0 };
    return { active: true, value: Math.floor(parsed) };
  }

  function isNonZeroOnlyEnabled() {
    const checkbox = g('nonzero-only-filter');
    return !!(checkbox && checkbox.checked);
  }

  function updateFilterNotice(searchActive, minQtyActive, nonZeroOnly, hiddenCount, minQtyValue) {
    const notice = g('filter-notice');
    if (!notice) return;
    if (!searchActive && !minQtyActive && !nonZeroOnly) {
      notice.style.display = 'none';
      notice.textContent = '';
      return;
    }

    const parts = [];
    if (searchActive) parts.push('search');
    if (minQtyActive) parts.push(`Min Qty >= ${minQtyValue}`);
    if (nonZeroOnly) parts.push('non-zero only');
    notice.textContent = `Filtered view active (${parts.join(' + ')}): ${hiddenCount} item${hiddenCount === 1 ? '' : 's'} hidden.`;
    notice.style.display = 'block';
  }

  function clearViewFilters() {
    const searchEl = g('search');
    if (searchEl) searchEl.value = '';
    const minQtyEl = g('min-qty-filter');
    if (minQtyEl) minQtyEl.value = '';
    const nonZeroEl = g('nonzero-only-filter');
    if (nonZeroEl) nonZeroEl.checked = false;
  }

  function filterItems() {
    const searchEl = g('search');
    const searchTerm = searchEl ? searchEl.value.toLowerCase().trim() : '';
    const minQty = getMinQtyThreshold();
    const nonZeroOnly = isNonZeroOnlyEnabled();

    filteredConsumables = allConsumables.filter(item => {
      const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm);
      const totalQty = Math.ceil(calculateItemQuantity(Number(item.usagePerDayPerBed) || 0));
      const matchesMinQty = !minQty.active || totalQty >= minQty.value;
      const matchesNonZero = !nonZeroOnly || totalQty > 0;
      return matchesSearch && matchesMinQty && matchesNonZero;
    });

    const hiddenCount = Math.max(0, allConsumables.length - filteredConsumables.length);
    updateFilterNotice(!!searchTerm, minQty.active, nonZeroOnly, hiddenCount, minQty.value);
    displayConsumables();
    updateItemsInfo();
  }

  function updateAddItemRatePlaceholder() {
    const rateEl = g('new-item-rate');
    if (!rateEl) return;
    const placeholder = getRatePlaceholder(currentListType);
    rateEl.placeholder = placeholder;
  }

  function updateInventoryHelpRateLabel() {
    const pop = document.getElementById('cons-help-popover-inventory') || document.getElementById('help-popover-inventory');
    if (!pop) return;
    const firstLi = pop.querySelector('ul li:first-child');
    if (!firstLi) return;
    const rateLabel = getRateColumnLabel(currentListType);
    firstLi.innerHTML = '<strong>' + rateLabel + ':</strong> Usage rate per bed per day. Total quantity = days × beds × rate × (1 + buffer%).';
  }

  function displayConsumables() {
    const container = g('consumables-container');
    if (!container) return;

    updateAddItemRatePlaceholder();
    updateInventoryHelpRateLabel();

    if (filteredConsumables.length === 0) {
      if (allConsumables.length === 0) {
        container.innerHTML = '<p class="empty-message">Load the UCD Ward or ICU list above.</p>';
      } else {
        container.innerHTML = '<p class="empty-message">No items match your search.</p>';
      }
      return;
    }

    let html = '';
    if (bufferPercentage > 0) {
      html += '<div class="buffer-badge" role="status">Buffer: +' + bufferPercentage + '% applied to all quantities</div>';
    }
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr>';
    const rateHeader = getRateColumnLabel(currentListType);
    html += '<th>Item Description</th>';
    html += '<th aria-live="polite">' + rateHeader + '</th>';
    html += '<th>Total quantity</th>';
    html += '<th>Delete</th>';
    html += '</tr></thead><tbody>';

    for (const item of filteredConsumables) {
      if (!item._deleteId) {
        item._deleteId = `item-${Date.now()}-${customItemCounter++}`;
      }
      if (item.isCustom && !item.customId) {
        item.customId = `custom-${Date.now()}-${customItemCounter++}`;
      }
      const rate = Number(item.usagePerDayPerBed);
      const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
      const totalQty = calculateItemQuantity(safeRate);
      html += '<tr>';
      html += `<td>${escapeHtml(item.name)}</td>`;
      html += `<td class="number-cell">${safeRate.toFixed(3)}</td>`;
      html += `<td class="number-cell highlight-cell">${Math.ceil(totalQty)}</td>`;
      html += `<td class="number-cell"><button type="button" class="btn-delete-item" data-item-id="${escapeHtml(item._deleteId)}">Delete</button></td>`;
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
    applySort();
  }

  function getRowSortName(row) {
    const td = row.querySelector('td');
    return (td && td.textContent.trim() || '').toLowerCase();
  }

  function getRowSortQty(row) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return 0;
    return parseInt(cells[2].textContent, 10) || 0;
  }

  function applySort() {
    const container = g('consumables-container');
    if (!container) return;
    const tbody = container.querySelector('.data-table tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length === 0) return;

    const active = document.activeElement;
    const wasSearch = active && active.id === 'cons-search';
    const selStart = wasSearch ? active.selectionStart : 0;
    const selEnd = wasSearch ? active.selectionEnd : 0;

    const sel = g('sort-equipment');
    const key = (sel && sel.value) || currentSortKey;
    currentSortKey = key;

    rows.sort((a, b) => {
      if (key === 'name-asc') return getRowSortName(a).localeCompare(getRowSortName(b));
      if (key === 'name-desc') return getRowSortName(b).localeCompare(getRowSortName(a));
      const qA = getRowSortQty(a);
      const qB = getRowSortQty(b);
      if (key === 'qty-desc') return qB - qA;
      if (key === 'qty-asc') return qA - qB;
      return 0;
    });
    rows.forEach(r => tbody.appendChild(r));

    if (wasSearch && active) {
      active.focus();
      if (typeof active.setSelectionRange === 'function') active.setSelectionRange(selStart, selEnd);
    }
  }

  function onSortChange() {
    const sel = g('sort-equipment');
    if (sel) {
      currentSortKey = sel.value;
      try {
        localStorage.setItem(SORT_STORAGE_KEY, currentSortKey);
      } catch (e) {
        showFeedback('Sort applied; preference could not be saved.', 'info');
      }
      applySort();
      const sortLabel = sel.selectedOptions && sel.selectedOptions[0] ? sel.selectedOptions[0].text : currentSortKey;
      showFeedback(`Sort: ${sortLabel}`, 'info');
    }
  }

  function onConsumablesTableClick(event) {
    const target = event.target;
    if (!target || !target.matches('.btn-delete-item[data-item-id]')) return;
    const itemId = target.getAttribute('data-item-id');
    if (!itemId) return;

    const idx = allConsumables.findIndex(item => item && item._deleteId === itemId);
    if (idx === -1) {
      showFeedback('Item not found.', 'error');
      return;
    }
    const removedName = allConsumables[idx].name || 'Item';
    if (!confirm(`Delete "${removedName}" from the list?`)) return;
    allConsumables.splice(idx, 1);
    filterItems();
    calculateAndDisplay();
    saveData();
    showFeedback(`Deleted "${removedName}".`, 'success');
  }

  function addCustomItem() {
    const nameEl = g('new-item-name');
    const rateEl = g('new-item-rate');
    if (!nameEl || !rateEl) return;

    const name = nameEl.value.trim();
    const rateRaw = rateEl.value.trim();
    const rate = parseFloat(rateRaw);

    if (!name) {
      showFeedback('Enter an item name before adding.', 'info');
      nameEl.focus();
      return;
    }
    if (rateRaw === '' || !isFinite(rate) || rate < 0) {
      showFeedback('Enter a valid non-negative per-day/per-bed rate.', 'info');
      rateEl.focus();
      return;
    }

    allConsumables.push({
      id: `custom-${Date.now()}-${customItemCounter}`,
      customId: `custom-${Date.now()}-${customItemCounter++}`,
      name,
      usagePerDayPerBed: rate,
      isCustom: true
    });
    currentFileName = currentFileName || 'Custom List';
    currentListType = 'custom';

    const fs = g('file-status');
    if (fs) {
      fs.textContent = currentFileName;
      fs.style.color = '#28a745';
    }

    nameEl.value = '';
    rateEl.value = '';
    filterItems();
    calculateAndDisplay();
    saveData();
    showFeedback(`Added "${name}".`, 'success');
    nameEl.focus();
  }

  function sanitizeImportedConsumables(items, issues) {
    if (!Array.isArray(items)) return [];
    const sanitized = [];
    items.forEach((item, index) => {
      const row = index + 1;
      if (!item || typeof item !== 'object') {
        issues.push(`Row ${row}: dropped because item is not an object.`);
        return;
      }
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      if (!name) {
        issues.push(`Row ${row}: dropped because item name is missing or empty.`);
        return;
      }
      const rate = Number(item.usagePerDayPerBed);
      if (!Number.isFinite(rate) || rate < 0) {
        issues.push(`Row ${row} (${name}): dropped because "usagePerDayPerBed" must be a non-negative number.`);
        return;
      }

      const cleaned = { name, usagePerDayPerBed: rate };
      if (item.isCustom === true) {
        cleaned.isCustom = true;
        cleaned.customId = (typeof item.customId === 'string' && item.customId.trim())
          ? item.customId.trim()
          : `custom-${Date.now()}-${customItemCounter++}`;
      }
      sanitized.push(cleaned);
    });
    return sanitized;
  }

  function buildImportIssueReport(sourceFileName, issues) {
    const lines = [];
    lines.push('Consumables Calculator - Import Sanitization Report');
    lines.push('==================================================');
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
    lines.push('- Ensure each item has a non-empty "name".');
    lines.push('- Ensure "usagePerDayPerBed" is a non-negative number (for example: 0.125).');
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
    a.download = `consumables-import-sanitization-report-${safeStamp}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importFromFile() {
    const input = document.getElementById('cons-import-file-input');
    if (input) { input.value = ''; input.click(); }
  }

  function onImportFileSelected(ev) {
    const file = ev.target && ev.target.files[0];
    if (!file) return;
    const sourceFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const issues = [];
        const data = JSON.parse(reader.result);
        if (data && (data.consumables || data.deploymentDays != null || data.deploymentBeds != null)) {
          if (data.consumables && Array.isArray(data.consumables)) {
            allConsumables = sanitizeImportedConsumables(data.consumables, issues);
            currentListType = 'custom';
          }
          if (data.deploymentDays != null) {
            const parsedDays = Number(data.deploymentDays);
            if (!Number.isFinite(parsedDays) || parsedDays < 0) {
              issues.push(`Deployment Days: invalid value "${data.deploymentDays}" replaced with 0.`);
              deploymentDays = 0;
            } else {
              deploymentDays = parsedDays;
            }
            const de = g('days');
            if (de) de.value = (deploymentDays !== 0) ? deploymentDays : '';
          }
          if (data.deploymentBeds != null) {
            const parsedBeds = Number(data.deploymentBeds);
            if (!Number.isFinite(parsedBeds) || parsedBeds < 0) {
              issues.push(`Deployment Beds: invalid value "${data.deploymentBeds}" replaced with 0.`);
              deploymentBeds = 0;
            } else {
              deploymentBeds = parsedBeds;
            }
            const be = g('beds');
            if (be) be.value = (deploymentBeds !== 0) ? deploymentBeds : '';
          }
          if (data.bufferPercentage != null) {
            const parsedBuffer = Number(data.bufferPercentage);
            if (!Number.isFinite(parsedBuffer)) {
              issues.push(`Buffer Percentage: invalid value "${data.bufferPercentage}" replaced with 0.`);
              bufferPercentage = 0;
            } else if (parsedBuffer < 0 || parsedBuffer > 100) {
              const clamped = Math.max(0, Math.min(100, parsedBuffer));
              issues.push(`Buffer Percentage: out-of-range value "${data.bufferPercentage}" clamped to ${clamped}.`);
              bufferPercentage = clamped;
            } else {
              bufferPercentage = parsedBuffer;
            }
            const bu = g('buffer');
            if (bu) bu.value = (bufferPercentage !== 0) ? bufferPercentage : '';
          }
          if (data.fileName) {
            currentFileName = data.fileName;
            currentListType = resolveListType(data);
            const fs = g('file-status');
            if (fs) { fs.textContent = currentFileName; fs.style.color = '#28a745'; }
          } else {
            currentFileName = null;
            currentListType = null;
            const fs2 = g('file-status');
            if (fs2) { fs2.textContent = 'No list loaded'; fs2.style.color = '#666'; }
          }
          clearViewFilters();
          filterItems();
          calculateAndDisplay();
          saveData();
          if (issues.length > 0) {
            downloadImportIssueReport(sourceFileName, issues);
            showFeedback(`Imported with ${issues.length} data issue(s). Report downloaded for review/printing.`, 'error');
          } else {
            showFeedback('Scenario imported and applied.', 'success');
          }
        } else {
          showFeedback('File does not contain a valid scenario.', 'error');
        }
      } catch (e) {
        showFeedback(`Invalid file: ${e.message || 'parse error'}`, 'error');
      }
      if (ev.target) ev.target.value = '';
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

  function buildExportScenario() {
    const nameEl = g('scenario-name');
    const notesEl = g('scenario-notes');
    return {
      scenarioName: (nameEl && nameEl.value.trim()) || '',
      scenarioNotes: notesEl ? notesEl.value.trim() : '',
      deploymentDays,
      deploymentBeds,
      bufferPercentage,
      consumables: allConsumables,
      fileName: currentFileName,
      listType: currentListType,
      exportedAt: new Date().toISOString()
    };
  }

  function toCsvCell(value) {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function buildCsvExport(scenario) {
    const lines = [];
    lines.push('Field,Value');
    lines.push(`${toCsvCell('Scenario Name')},${toCsvCell(scenario.scenarioName || '')}`);
    lines.push(`${toCsvCell('Scenario Notes')},${toCsvCell(scenario.scenarioNotes || '')}`);
    lines.push(`${toCsvCell('Source List')},${toCsvCell(scenario.fileName || '')}`);
    lines.push(`${toCsvCell('Deployment Days')},${toCsvCell(deploymentDays)}`);
    lines.push(`${toCsvCell('Deployment Beds')},${toCsvCell(deploymentBeds)}`);
    lines.push(`${toCsvCell('Buffer Percentage')},${toCsvCell(bufferPercentage)}`);
    lines.push(`${toCsvCell('Exported At')},${toCsvCell(new Date(scenario.exportedAt).toLocaleString())}`);
    lines.push('');
    const csvRateHeader = getRateColumnLabel(currentListType);
    lines.push('Item Description,' + csvRateHeader + ',Total Quantity,Custom Item');

    allConsumables.forEach((item) => {
      const rate = Number(item && item.usagePerDayPerBed);
      const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
      const totalQty = Math.ceil(calculateItemQuantity(safeRate));
      lines.push([
        toCsvCell(item && item.name ? item.name : ''),
        toCsvCell(safeRate.toFixed(3)),
        toCsvCell(totalQty),
        toCsvCell(item && item.isCustom ? 'Yes' : 'No')
      ].join(','));
    });

    // BOM helps Excel open UTF-8 CSV cleanly.
    return `\uFEFF${lines.join('\n')}`;
  }

  function onExportToFile() {
    const dialog = g('export-format-dialog');
    if (dialog) {
      const jsonRadio = dialog.querySelector('input[name="cons-export-format"][value="JSON"]');
      dialog.removeAttribute('hidden');
      dialog.setAttribute('aria-hidden', 'false');
    }
  }

  function performExportWithFormat(fmt) {
    const format = (fmt && String(fmt).toUpperCase()) || 'JSON';
    const scenario = buildExportScenario();
    if (format === 'CSV') {
      const csv = buildCsvExport(scenario);
      downloadTextFile(csv, 'text/csv;charset=utf-8', 'consumables-calc-export.csv');
      showFeedback('Scenario exported as CSV.', 'success');
      return;
    }
    downloadTextFile(
      JSON.stringify(scenario, null, 2),
      'application/json',
      'consumables-calc-scenario.json'
    );
    showFeedback('Scenario exported as JSON.', 'success');
  }

  function closeExportFormatDialog() {
    const dialog = g('export-format-dialog');
    if (dialog) {
      dialog.hidden = true;
      dialog.setAttribute('aria-hidden', 'true');
    }
  }

  function calculateItemQuantity(usagePerDayPerBed) {
    const safeDays = sanitizeDays(deploymentDays);
    const safeBeds = sanitizeBeds(deploymentBeds);
    const safeRate = Math.max(0, toFiniteNumber(usagePerDayPerBed));
    const safeBuffer = sanitizeBuffer(bufferPercentage);
    const baseQuantity = safeDays * safeBeds * safeRate;
    const bufferMultiplier = 1 + (safeBuffer / 100);
    return baseQuantity * bufferMultiplier;
  }

  function calculateAndDisplay() {
    displayConsumables();
    updateItemsInfo();
  }

  function updateItemsInfo() {
    const info = g('items-info');
    if (!info) return;
    if (allConsumables.length === 0) {
      info.style.display = 'none';
      return;
    }
    info.style.display = '';
    const count = filteredConsumables.length;
    const total = allConsumables.length;
    if (count === total) {
      info.textContent = `${total} items loaded`;
    } else {
      info.textContent = `${count} of ${total} items shown`;
    }
  }

  function printReport() {
    if (allConsumables.length === 0) {
      showFeedback('No data to print. Please load the Ward or ICU list first.', 'info');
      return;
    }

    showFeedback('Opening print preview...', 'info');

    const sel = g('sort-equipment');
    const savedSort = (sel && sel.value) || currentSortKey;
    if (sel) sel.value = 'qty-desc';
    currentSortKey = 'qty-desc';
    filterItems();

    const afterPrint = () => {
      window.removeEventListener('afterprint', afterPrint);
      if (sel) sel.value = savedSort;
      currentSortKey = savedSort;
      filterItems();
      showFeedback('Print complete.', 'success');
    };
    window.addEventListener('afterprint', afterPrint);
    window.print();
  }

  function saveScenario() {
    if (allConsumables.length === 0) {
      showFeedback('No data to save. Please load the Ward or ICU list first.', 'info');
      return;
    }

    let hasErrors = false;
    ['days', 'beds', 'buffer'].forEach(fid => { if (!validateAndShow(fid)) hasErrors = true; });
    if (hasErrors) {
      showFeedback('Please fix validation errors before saving.', 'error');
      return;
    }
    const nameEl = g('scenario-name');
    const notesEl = g('scenario-notes');
    let baseName = nameEl ? nameEl.value.trim() : '';
    if (!baseName) {
      const promptedName = prompt('Enter a scenario name:');
      if (promptedName === null) {
        showFeedback('Save cancelled.', 'info');
        return;
      }
      baseName = promptedName.trim();
    }
    if (!baseName) {
      showFeedback('Scenario name is required to save.', 'info');
      if (nameEl) nameEl.focus();
      return;
    }
    const now = new Date();
    const name = `${baseName} (${now.toLocaleString()})`;
    if (nameEl) nameEl.value = baseName;
    const notes = notesEl ? notesEl.value.trim() : '';

    const scenario = {
      id: Date.now().toString(),
      name,
      baseName,
      notes,
      deploymentDays,
      deploymentBeds,
      bufferPercentage,
      consumables: allConsumables,
      fileName: currentFileName,
      listType: currentListType,
      timestamp: now.toISOString()
    };

    const scenarios = getSavedScenarios();
    const existingIndex = scenarios.findIndex(s => s.baseName === baseName);
    if (existingIndex >= 0) {
      if (!confirm(`A scenario named "${baseName}" already exists. Overwrite it?`)) return;
      scenarios[existingIndex] = scenario;
    } else {
      scenarios.push(scenario);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch (e) {
      console.error('Failed to save scenarios:', e);
      showFeedback('Could not save scenario. Storage may be disabled or full.', 'error');
      return;
    }
    updateScenarioDropdown();
    updateSavedDisplay(scenario.timestamp || null);
    showFeedback(`Scenario "${scenario.name}" saved successfully!`, 'success');
  }

  function getSavedScenarios() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const list = saved ? JSON.parse(saved) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function updateSavedDisplay(isoTimestampOrNull) {
    const el = g('saved-display');
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

  function updateScenarioDropdown() {
    const select = g('scenario-select');
    if (!select) return;

    select.innerHTML = '<option value="">— Select scenario to load —</option>';
    const scenarios = getSavedScenarios();
    scenarios.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    scenarios.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name || 'Unnamed scenario';
      select.appendChild(opt);
    });

    const loadBtn = g('load-btn');
    const deleteBtn = g('delete-btn');
    const clearBtn = g('clear-btn');
    const disabled = scenarios.length === 0;
    select.disabled = disabled;
    if (loadBtn) loadBtn.disabled = disabled;
    if (deleteBtn) deleteBtn.disabled = disabled;
    if (clearBtn) clearBtn.disabled = disabled;
  }

  function loadSelectedScenario() {
    const select = g('scenario-select');
    const scenarioId = select ? select.value : '';

    if (!scenarioId) {
      showFeedback('Please select a scenario to load.', 'info');
      return;
    }

    const scenarios = getSavedScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);

    if (!scenario) {
      showFeedback('Scenario not found.', 'error');
      return;
    }

    ['days', 'beds', 'buffer'].forEach(clearValidationError);
    if (scenario.consumables && Array.isArray(scenario.consumables)) {
      allConsumables = scenario.consumables;
      currentListType = 'custom';
    }
    if (scenario.deploymentDays != null) {
      deploymentDays = sanitizeDays(scenario.deploymentDays);
      const de = g('days');
      if (de) de.value = (deploymentDays !== 0) ? deploymentDays : '';
    }
    if (scenario.deploymentBeds != null) {
      deploymentBeds = sanitizeBeds(scenario.deploymentBeds);
      const be = g('beds');
      if (be) be.value = (deploymentBeds !== 0) ? deploymentBeds : '';
    }
    if (scenario.bufferPercentage !== undefined) {
      bufferPercentage = sanitizeBuffer(scenario.bufferPercentage);
      const bu = g('buffer');
      if (bu) bu.value = (bufferPercentage !== 0) ? bufferPercentage : '';
    }
    if (scenario.fileName) {
      currentFileName = scenario.fileName;
      currentListType = resolveListType(scenario);
      const fse = g('file-status');
      if (fse) { fse.textContent = currentFileName; fse.style.color = '#28a745'; }
    } else {
      currentFileName = null;
      currentListType = null;
      const fse2 = g('file-status');
      if (fse2) { fse2.textContent = 'No list loaded'; fse2.style.color = '#666'; }
    }

    if (g('scenario-name')) g('scenario-name').value = scenario.baseName || scenario.name || '';
    if (g('scenario-notes')) g('scenario-notes').value = scenario.notes || '';
    updateSavedDisplay(scenario.timestamp || null);
    clearViewFilters();
    filterItems();
    calculateAndDisplay();
    saveData();
    showFeedback(`Scenario "${scenario.name}" loaded successfully!`, 'success');
  }

  function deleteSelectedScenario() {
    const select = g('scenario-select');
    const scenarioId = select ? select.value : '';
    if (!scenarioId) {
      showFeedback('Please select a scenario to delete.', 'info');
      return;
    }
    const scenarios = getSavedScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      showFeedback('Scenario not found.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${scenario.name}"?`)) return;
    const updated = scenarios.filter(s => s.id !== scenarioId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save scenarios:', e);
    }
    updateScenarioDropdown();
    showFeedback(`Scenario "${scenario.name}" deleted successfully!`, 'success');
  }

  function clearAllScenarios() {
    const scenarios = getSavedScenarios();
    if (scenarios.length === 0) {
      showFeedback('No scenarios to clear.', 'info');
      return;
    }
    if (!confirm(`Are you sure you want to delete all ${scenarios.length} saved scenarios? This cannot be undone.`)) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    updateScenarioDropdown();
    updateSavedDisplay(null);
    showFeedback('All scenarios cleared successfully!', 'success');
  }

  const LAST_SAVED_KEY = 'cons-lastSaved';

  function updateAutosaveTimestampDisplay(tsIsoString) {
    const el = document.getElementById('cons-last-saved');
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

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('fade-out');
      setTimeout(function () {
        toast.remove();
        if (container.children.length === 0) container.remove();
      }, 300);
    }, duration);
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_BUFFER, bufferPercentage);
      if (allConsumables.length > 0) {
        localStorage.setItem(STORAGE_CONSUMABLES, JSON.stringify(allConsumables));
      } else {
        localStorage.removeItem(STORAGE_CONSUMABLES);
      }
      if (currentFileName) {
        localStorage.setItem(STORAGE_FILENAME, currentFileName);
      } else {
        localStorage.removeItem(STORAGE_FILENAME);
      }
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SAVED_KEY, now);
      updateAutosaveTimestampDisplay(now);
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  function loadSavedData() {
    const savedBuffer = localStorage.getItem(STORAGE_BUFFER);
    const savedConsumables = localStorage.getItem(STORAGE_CONSUMABLES);
    const savedFileName = localStorage.getItem(STORAGE_FILENAME);

    const de = g('days');
    const be = g('beds');
    const bu = g('buffer');

    deploymentDays = 0;
    deploymentBeds = 0;
    if (de) de.value = '';
    if (be) be.value = '';
    if (savedBuffer !== null) {
      bufferPercentage = sanitizeBuffer(parseFloat(savedBuffer));
      if (bu) bu.value = bufferPercentage !== 0 ? String(bufferPercentage) : '';
    } else {
      bufferPercentage = 0;
      if (bu) bu.value = '';
    }
    if (savedConsumables) {
      try {
        allConsumables = JSON.parse(savedConsumables);
        currentListType = 'custom';
      } catch (e) {
        allConsumables = [];
        currentListType = null;
      }
    } else {
      allConsumables = [];
      currentListType = null;
    }
    filteredConsumables = allConsumables.slice();
    if (savedFileName) {
      currentFileName = savedFileName;
      currentListType = listTypeFromFileName(savedFileName);
    } else {
      currentFileName = null;
      currentListType = allConsumables.length > 0 ? 'custom' : null;
    }

    const fs = g('file-status');
    if (fs) {
      fs.textContent = currentFileName || 'No list loaded';
      fs.style.color = currentFileName ? '#28a745' : '#666';
    }
    const wb = g('ward-list-btn');
    const ib = g('icu-list-btn');
    if (wb) wb.classList.remove('active');
    if (ib) ib.classList.remove('active');
    filterItems();
    calculateAndDisplay();
    let lastSaved = localStorage.getItem(LAST_SAVED_KEY);
    if (!lastSaved && (savedBuffer !== null || savedConsumables)) {
      try {
        lastSaved = new Date().toISOString();
        localStorage.setItem(LAST_SAVED_KEY, lastSaved);
      } catch (e) { /* ignore */ }
    }
    updateAutosaveTimestampDisplay(lastSaved);
  }

  function clearAutosavedState() {
    if (!confirm('Clear autosaved worksheet state from this browser? This will not delete named saved scenarios.')) return;
    try {
      localStorage.removeItem(STORAGE_BUFFER);
      localStorage.removeItem(STORAGE_CONSUMABLES);
      localStorage.removeItem(STORAGE_FILENAME);
      localStorage.removeItem(LAST_SAVED_KEY);
      updateAutosaveTimestampDisplay('');
      showToast('Autosaved worksheet state cleared', 'success', 2500);
    } catch (e) {
      showToast('Failed to clear autosaved worksheet state', 'error', 3000);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showFeedback(message, type) {
    type = type || 'success';
    const feedbackEl = g('button-feedback');
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.className = `button-feedback show ${type}`;
    setTimeout(() => {
      feedbackEl.classList.remove('show');
      setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.className = 'button-feedback';
      }, 300);
    }, 3000);
  }

  function clearAllItems() {
    if (allConsumables.length === 0) {
      showFeedback('No items to clear.', 'info');
      return;
    }
    if (!confirm(`Are you sure you want to clear all ${allConsumables.length} items?`)) return;

    allConsumables = [];
    filteredConsumables = [];
    currentFileName = null;
    currentListType = null;
    bufferPercentage = 0;
    const bu = g('buffer');
    if (bu) bu.value = '';
    clearValidationError('buffer');
    deploymentDays = 0;
    deploymentBeds = 0;
    const de = g('days');
    const be = g('beds');
    if (de) de.value = '';
    if (be) be.value = '';
    clearValidationError('days');
    clearValidationError('beds');
    const nameEl = g('scenario-name');
    const notesEl = g('scenario-notes');
    if (nameEl) nameEl.value = '';
    if (notesEl) notesEl.value = '';
    updateSavedDisplay(null);
    try {
      localStorage.removeItem(STORAGE_CONSUMABLES);
      localStorage.removeItem(STORAGE_FILENAME);
    } catch (e) {}

    const fs = g('file-status');
    if (fs) { fs.textContent = 'No list loaded'; fs.style.color = '#666'; }

    const wb = g('ward-list-btn');
    const ib = g('icu-list-btn');
    if (wb) wb.classList.remove('active');
    if (ib) ib.classList.remove('active');
    clearViewFilters();

    filterItems();
    calculateAndDisplay();
    saveData();
    showFeedback('All items cleared successfully!', 'success');
  }

  function loadWardList() {
    if (typeof UCD_WARD_ITEMS === 'undefined' || !UCD_WARD_ITEMS.length) {
      showFeedback('Ward List is not available.', 'error');
      return;
    }
    allConsumables = JSON.parse(JSON.stringify(UCD_WARD_ITEMS));
    filteredConsumables = allConsumables.slice();
    currentFileName = 'UCD Ward List';
    currentListType = 'ward';

    const fs = g('file-status');
    if (fs) { fs.textContent = currentFileName; fs.style.color = '#28a745'; }
    clearViewFilters();
    const wb = g('ward-list-btn');
    const ib = g('icu-list-btn');
    if (wb) wb.classList.add('active');
    if (ib) ib.classList.remove('active');

    filterItems();
    displayConsumables();
    updateItemsInfo();
    saveData();
    showFeedback('Ward List loaded', 'success');
  }

  function loadICUList() {
    if (typeof UCD_ICU_ITEMS === 'undefined' || !UCD_ICU_ITEMS.length) {
      showFeedback('ICU List is not available.', 'error');
      return;
    }
    allConsumables = JSON.parse(JSON.stringify(UCD_ICU_ITEMS));
    filteredConsumables = allConsumables.slice();
    currentFileName = 'UCD ICU List';
    currentListType = 'icu';

    const fs = g('file-status');
    if (fs) { fs.textContent = currentFileName; fs.style.color = '#28a745'; }
    clearViewFilters();
    const wb = g('ward-list-btn');
    const ib = g('icu-list-btn');
    if (wb) wb.classList.remove('active');
    if (ib) ib.classList.add('active');

    filterItems();
    displayConsumables();
    updateItemsInfo();
    saveData();
    showFeedback('ICU List loaded', 'success');
  }

  function init() {
    const sortSel = g('sort-equipment');
    const validSorts = ['name-asc', 'name-desc', 'qty-desc', 'qty-asc'];
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      if (saved && validSorts.includes(saved)) {
        currentSortKey = saved;
        if (sortSel) sortSel.value = saved;
      } else {
        currentSortKey = 'name-asc';
        if (sortSel) sortSel.value = 'name-asc';
      }
    } catch (e) {
      currentSortKey = 'name-asc';
      if (sortSel) sortSel.value = 'name-asc';
    }
    setupEventListeners();
    loadSavedData();
    updateAddItemRatePlaceholder();
    updateInventoryHelpRateLabel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
