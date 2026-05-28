/**
 * Ward-ICU-Pharma - Standalone Medications Supply List
 * Medications Supply List calculator. Uses pharma-specific localStorage keys.
 */
(function () {
  'use strict';

  const STORAGE_SCENARIOS = 'fieldHospitalPharmaScenarios';
  const STORAGE_BUFFER = 'fieldHospitalPharmaBuffer';
  const STORAGE_CONSUMABLES = 'fieldHospitalPharmaConsumables';
  const STORAGE_FILENAME = 'fieldHospitalPharmaFileName';
  const STORAGE_DAYS = 'fieldHospitalPharmaDays';
  const STORAGE_BEDS = 'fieldHospitalPharmaBeds';
  const STORAGE_SCENARIO_NAME = 'fieldHospitalPharmaScenarioName';
  const STORAGE_SCENARIO_NOTES = 'fieldHospitalPharmaScenarioNotes';
  const STORAGE_SEARCH = 'fieldHospitalPharmaSearch';
  const STORAGE_MIN_QTY_FILTER = 'fieldHospitalPharmaMinQtyFilter';
  const STORAGE_NONZERO_ONLY = 'fieldHospitalPharmaNonzeroOnly';
  const LAST_SAVED_KEY = 'fieldHospitalPharmaLastSaved';
  const SORT_STORAGE_KEY = 'fieldHospitalPharmaSort';

  function g(id) {
    return document.getElementById(id);
  }

  /** Deployment fields use #meds-days / #meds-beds / #meds-buffer (Shell + standalone); rules stay keyed as days/beds/buffer. */
  function validationDomId(fieldId) {
    if (fieldId === 'days') return 'meds-days';
    if (fieldId === 'beds') return 'meds-beds';
    if (fieldId === 'buffer') return 'meds-buffer';
    return fieldId;
  }

  const VALIDATION_RULES = {
    days: { min: 0, max: 3650, message: 'Days must be between 0 and 3650' },
    beds: { min: 0, max: 10000, message: 'Beds must be between 0 and 10,000' },
    buffer: { min: 0, max: 100, message: 'Buffer must be between 0% and 100%' }
  };

  function validateInput(fieldId) {
    const el = g(validationDomId(fieldId));
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
    const el = g(validationDomId(fieldId));
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
    const el = g(validationDomId(fieldId));
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
  /** 'ward' | 'icu' | 'custom' | null. null = no list / cleared; 'custom' = list present but not a known Ward/ICU list; 'ward'/'icu' = known list. Drives rate column label (Per Ward Bed / Per ICU Bed / Per Bed). */
  let currentListType = null;
  let currentSortKey = 'name-asc';
  let customItemCounter = 1;

  const AUTOSAVE_INTERVAL_MS = 1 * 60 * 1000;
  const DEBOUNCED_AUTOSAVE_MS = 3 * 1000;
  let autosaveTimerId = null;
  let debouncedAutosaveTimeout = null;
  /** True after worksheet edits until a successful saveData() (matches Load Calc Basic autosave model). */
  let medsAutosaveDirty = false;
  /** Stays true across successful autosaves until load/import/restore/named save clears it (unsaved-edit guard). */
  let scenarioLoadGuardDirty = false;

  const MSG_LOAD_OVERWRITE_DIRTY = 'You have unsaved changes on this worksheet. Load this scenario anyway? Unsaved edits may be lost.';
  const MSG_IMPORT_OVERWRITE_DIRTY = 'You have unsaved changes on this worksheet. Import this file anyway? Unsaved edits may be lost.';

  function confirmOverwriteIfDirty() {
    if (!scenarioLoadGuardDirty) return true;
    return confirm(MSG_LOAD_OVERWRITE_DIRTY);
  }

  function confirmImportIfDirty() {
    if (!scenarioLoadGuardDirty) return true;
    return confirm(MSG_IMPORT_OVERWRITE_DIRTY);
  }

  function notifyWorksheetChanged() {
    medsAutosaveDirty = true;
    scenarioLoadGuardDirty = true;
    scheduleDebouncedAutosave();
  }

  function scheduleDebouncedAutosave() {
    if (!medsAutosaveDirty) return;
    if (debouncedAutosaveTimeout) clearTimeout(debouncedAutosaveTimeout);
    debouncedAutosaveTimeout = setTimeout(function () {
      debouncedAutosaveTimeout = null;
      saveData();
    }, DEBOUNCED_AUTOSAVE_MS);
  }

  function listTypeFromFileName(fileName) {
    if (!fileName) return null;
    if (fileName === 'Ward Meds') return 'ward';
    if (fileName === 'ICU Meds') return 'icu';
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

  function updateInventoryHelpRateLabel() {
    const pop = document.getElementById('meds-help-popover-inventory');
    if (!pop) return;
    const firstLi = pop.querySelector('ul li:first-child');
    if (!firstLi) return;
    const label = getRateColumnLabel(currentListType);
    firstLi.innerHTML = '<strong>' + label + ':</strong> Usage rate per bed per day. Total quantity = days × beds × rate × (1 + buffer%).';
  }

  function updateAddItemRatePlaceholder() {
    const rateEl = g('meds-new-item-rate');
    if (!rateEl) return;
    rateEl.placeholder = getRatePlaceholder(currentListType);
  }

  function setupHelpPopovers() {
    var ROOT = document.getElementById('panel-medications');
    var helpPopoverIdPrefix = 'meds-help-popover-';
    var helpButtons = Array.from(ROOT.querySelectorAll('.help-icon[data-help]'));
    if (!helpButtons.length) return;

    var helpHoverHideTimeout = null;

    function getPopoverForBtn(btn) {
      var key = btn.getAttribute('data-help');
      return key ? document.getElementById(helpPopoverIdPrefix + key) : null;
    }

    function closeAllHelpPopovers(unpin) {
      if (unpin) {
        ROOT.querySelectorAll('.help-popover').forEach(function (pop) { pop.classList.remove('pinned'); });
      }
      ROOT.querySelectorAll('.help-popover').forEach(function (pop) { pop.hidden = true; });
      ROOT.querySelectorAll('.help-icon').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); b.removeAttribute('aria-describedby'); });
    }

    function scheduleHoverHide(pop, btn) {
      if (helpHoverHideTimeout) clearTimeout(helpHoverHideTimeout);
      helpHoverHideTimeout = setTimeout(function () {
        if (pop && !pop.classList.contains('pinned')) {
          pop.hidden = true;
          if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-describedby'); }
        }
        helpHoverHideTimeout = null;
      }, 220);
    }

    function cancelHoverHide() {
      if (helpHoverHideTimeout) { clearTimeout(helpHoverHideTimeout); helpHoverHideTimeout = null; }
    }

    helpButtons.forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      var pop = getPopoverForBtn(btn);
      if (!pop) return;

      btn.addEventListener('mouseenter', function () {
        cancelHoverHide();
        pop.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        if (pop.id) btn.setAttribute('aria-describedby', pop.id);
      });
      btn.addEventListener('mouseleave', function () {
        if (!pop.classList.contains('pinned')) scheduleHoverHide(pop, btn);
      });
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        cancelHoverHide();
        var wasPinned = pop.classList.contains('pinned');
        closeAllHelpPopovers(true);
        if (!wasPinned) {
          var popToShow = pop;
          var btnToUpdate = btn;
          setTimeout(function () {
            popToShow.classList.add('pinned');
            popToShow.hidden = false;
            btnToUpdate.setAttribute('aria-expanded', 'true');
            if (popToShow.id) btnToUpdate.setAttribute('aria-describedby', popToShow.id);
          }, 0);
        }
      });
    });

    ROOT.querySelectorAll('.help-popover').forEach(function (pop) {
      pop.addEventListener('mouseenter', cancelHoverHide);
      pop.addEventListener('mouseleave', function () {
        var helpId = (pop.id || '').replace(helpPopoverIdPrefix, '');
        var b = helpId ? ROOT.querySelector('.help-icon[data-help="' + helpId + '"]') : null;
        if (!pop.classList.contains('pinned')) scheduleHoverHide(pop, b);
      });
    });

    document.addEventListener('click', function (e) {
      if (!ROOT.contains(e.target)) return;
      if (e.target.closest('.help-icon') || e.target.closest('.help-popover')) return;
      closeAllHelpPopovers(true);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeAllHelpPopovers(true);
    });
  }

  function setupEventListeners() {
    if (g('meds-btn-clear-autosave')) g('meds-btn-clear-autosave').addEventListener('click', restoreAutosavedState);
    if (g('meds-clear-items-btn')) g('meds-clear-items-btn').addEventListener('click', clearAllItems);
    if (g('meds-pharma-list-btn')) g('meds-pharma-list-btn').addEventListener('click', loadPharmaList);
    if (g('meds-pharma-secondary-list-btn')) g('meds-pharma-secondary-list-btn').addEventListener('click', loadSecondaryPharmaList);

    if (g('meds-days')) {
      const daysEl = g('meds-days');
      daysEl.addEventListener('input', function () {
        deploymentDays = sanitizeDays(parseFloat(this.value));
        calculateAndDisplay();
        notifyWorksheetChanged();
      });
      daysEl.addEventListener('blur', () => validateAndShow('days'));
    }
    if (g('meds-beds')) {
      const bedsEl = g('meds-beds');
      bedsEl.addEventListener('input', function () {
        deploymentBeds = sanitizeBeds(parseFloat(this.value));
        calculateAndDisplay();
        notifyWorksheetChanged();
      });
      bedsEl.addEventListener('blur', () => validateAndShow('beds'));
    }
    if (g('meds-buffer')) {
      const bufferEl = g('meds-buffer');
      bufferEl.addEventListener('input', function () {
        bufferPercentage = sanitizeBuffer(parseFloat(this.value));
        calculateAndDisplay();
        notifyWorksheetChanged();
      });
      bufferEl.addEventListener('blur', () => validateAndShow('buffer'));
    }
    const scenarioNameEl = g('meds-scenario-name');
    const scenarioNotesEl = g('meds-scenario-notes');
    if (scenarioNameEl) {
      scenarioNameEl.addEventListener('input', notifyWorksheetChanged);
      scenarioNameEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (scenarioNotesEl) {
      scenarioNotesEl.addEventListener('input', notifyWorksheetChanged);
      scenarioNotesEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (g('meds-search')) {
      const searchEl = g('meds-search');
      searchEl.addEventListener('input', function () {
        notifyWorksheetChanged();
        filterItems();
      });
      searchEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (g('meds-min-qty-filter')) {
      const minEl = g('meds-min-qty-filter');
      function onMinQtyFilterChange() {
        notifyWorksheetChanged();
        filterItems();
      }
      minEl.addEventListener('input', onMinQtyFilterChange);
      minEl.addEventListener('change', onMinQtyFilterChange);
      minEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (g('meds-nonzero-only-filter')) {
      g('meds-nonzero-only-filter').addEventListener('change', function () {
        notifyWorksheetChanged();
        filterItems();
      });
    }
    if (g('meds-add-item-btn')) g('meds-add-item-btn').addEventListener('click', addCustomItem);
    if (g('meds-new-item-name')) {
      g('meds-new-item-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCustomItem();
        }
      });
    }
    if (g('meds-new-item-rate')) {
      g('meds-new-item-rate').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCustomItem();
        }
      });
    }
    if (g('meds-sort-equipment')) g('meds-sort-equipment').addEventListener('change', onSortChange);
    if (g('meds-consumables-container')) {
      g('meds-consumables-container').addEventListener('click', onConsumablesTableClick);
    }
    if (g('meds-print-btn')) g('meds-print-btn').addEventListener('click', printReport);
    if (g('meds-save-btn')) g('meds-save-btn').addEventListener('click', saveScenario);
    if (g('meds-load-btn')) g('meds-load-btn').addEventListener('click', loadSelectedScenario);
    if (g('meds-delete-btn')) g('meds-delete-btn').addEventListener('click', deleteSelectedScenario);
    if (g('meds-clear-btn')) g('meds-clear-btn').addEventListener('click', clearAllScenarios);
    if (g('meds-scenario-select')) g('meds-scenario-select').addEventListener('change', syncScenarioSelectTitle);
    if (g('meds-import-btn')) g('meds-import-btn').addEventListener('click', () => { g('meds-import-file-input').click(); });
    if (g('meds-import-file-input')) g('meds-import-file-input').addEventListener('change', handleImportFile);
    if (g('meds-export-btn')) g('meds-export-btn').addEventListener('click', onExportToFile);

    const exportFormatDialog = g('meds-export-format-dialog');
    const exportFormatConfirm = g('meds-export-format-confirm');
    const exportFormatCancel = g('meds-export-format-cancel');
    if (exportFormatConfirm) {
      exportFormatConfirm.addEventListener('click', function () {
        const selected = document.querySelector('#meds-export-format-dialog input[name="meds-export-format"]:checked');
        const fmt = selected ? selected.value : 'JSON';
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

    updateScenarioDropdown();
    setupHelpPopovers();
  }

  function getMinQtyThreshold() {
    const minQtyEl = g('meds-min-qty-filter');
    if (!minQtyEl) return { active: false, value: 0 };
    const raw = minQtyEl.value.trim();
    if (raw === '') return { active: false, value: 0 };
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return { active: true, value: 0 };
    return { active: true, value: Math.floor(parsed) };
  }

  function isNonZeroOnlyEnabled() {
    const checkbox = g('meds-nonzero-only-filter');
    return !!(checkbox && checkbox.checked);
  }

  function updateFilterNotice(searchActive, minQtyActive, nonZeroOnly, hiddenCount, minQtyValue) {
    const notice = g('meds-filter-notice');
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
    const searchEl = g('meds-search');
    if (searchEl) searchEl.value = '';
    const minQtyEl = g('meds-min-qty-filter');
    if (minQtyEl) minQtyEl.value = '';
    const nonZeroEl = g('meds-nonzero-only-filter');
    if (nonZeroEl) nonZeroEl.checked = false;
  }

  function filterItems() {
    const searchEl = g('meds-search');
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

  function displayConsumables() {
    const container = g('meds-consumables-container');
    if (!container) return;

    updateAddItemRatePlaceholder();
    updateInventoryHelpRateLabel();

    if (filteredConsumables.length === 0) {
      if (allConsumables.length === 0) {
        container.innerHTML = '<p class="empty-message">Load Ward Meds or ICU Meds above.</p>';
      } else {
        container.innerHTML = '<p class="empty-message">No items match your search.</p>';
      }
      return;
    }

    const rateHeader = getRateColumnLabel(currentListType);
    let html = '';
    if (bufferPercentage > 0) {
      html += '<div class="buffer-badge" role="status">Buffer: +' + bufferPercentage + '% applied to all quantities</div>';
    }
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr>';
    html += '<th>Item Description</th>';
    html += '<th class="col-rate-header" aria-live="polite">' + rateHeader + '</th>';
    html += '<th>Total quantity</th>';
    html += '<th>Delete</th>';
    html += '</tr></thead><tbody>';

    for (const item of filteredConsumables) {
      if (!item._deleteId) {
        item._deleteId = 'item-' + Date.now() + '-' + (customItemCounter++);
      }
      if (item.isCustom && !item.customId) {
        item.customId = item._deleteId;
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
    const container = g('meds-consumables-container');
    if (!container) return;
    const tbody = container.querySelector('.data-table tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length === 0) return;

    const active = document.activeElement;
    const wasSearch = active && active.id === 'search';
    const selStart = wasSearch ? active.selectionStart : 0;
    const selEnd = wasSearch ? active.selectionEnd : 0;

    const sel = g('meds-sort-equipment');
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
    const sel = g('meds-sort-equipment');
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
    const nameEl = g('meds-new-item-name');
    const rateEl = g('meds-new-item-rate');
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

    var newId = 'item-' + Date.now() + '-' + (customItemCounter++);
    allConsumables.push({
      _deleteId: newId,
      customId: newId,
      name,
      usagePerDayPerBed: rate,
      isCustom: true
    });
    currentFileName = currentFileName || 'Custom List';
    currentListType = currentListType || 'custom';

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
    lines.push('Medications Calculator - Import Sanitization Report');
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
    a.download = `medications-import-sanitization-report-${safeStamp}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function acknowledge(btnId, text) {
    const btn = g(btnId);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = text;
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('btn-success');
    }, 1500);
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
    if (filteredConsumables.length > 0) {
      displayConsumables();
    }
  }

  function updateItemsInfo() {
    const info = g('meds-items-info');
    if (!info) return;
    if (allConsumables.length === 0) {
      info.style.display = 'none';
      return;
    }
    info.style.display = '';
    const count = filteredConsumables.length;
    const total = allConsumables.length;
    const label = currentFileName;
    if (label) {
      if (count === total) {
        info.textContent = `${total} ${label} items loaded`;
      } else {
        info.textContent = `${count} of ${total} ${label} items shown`;
      }
    } else if (count === total) {
      info.textContent = `${total} items loaded`;
    } else {
      info.textContent = `${count} of ${total} items shown`;
    }
  }

  function printReport() {
    if (allConsumables.length === 0) {
      showFeedback('No data to print. Please load a list first.', 'info');
      return;
    }
    if (filteredConsumables.length === 0) {
      showFeedback('No rows match the current filters. Adjust filters or search to print.', 'info');
      return;
    }

    showFeedback('Opening print preview...', 'info');
    const afterPrint = function () {
      window.removeEventListener('afterprint', afterPrint);
      showFeedback('Print complete.', 'success');
    };
    window.addEventListener('afterprint', afterPrint);
    window.print();
  }

  function saveScenario() {
    if (allConsumables.length === 0) {
      showFeedback('No data to save. Please load a list first.', 'info');
      return;
    }
    let hasErrors = false;
    ['days', 'beds', 'buffer'].forEach(fid => { if (!validateAndShow(fid)) hasErrors = true; });
    if (hasErrors) {
      showFeedback('Please fix validation errors before saving.', 'info');
      return;
    }
    const nameEl = g('meds-scenario-name');
    const notesEl = g('meds-scenario-notes');
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
    const scenarioName = `${baseName} (${now.toLocaleString()})`;
    if (nameEl) nameEl.value = baseName;
    const scenarioNotes = notesEl ? notesEl.value.trim() : '';

    // name = display string (with timestamp); baseName = used for overwrite/dedup when saving
    const scenario = {
      id: Date.now().toString(),
      name: scenarioName,
      baseName,
      notes: scenarioNotes,
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
      localStorage.setItem(STORAGE_SCENARIOS, JSON.stringify(scenarios));
    } catch (e) {
      console.error('Failed to save scenarios:', e);
      showFeedback('Could not save scenario. Storage may be disabled or full.', 'error');
      return;
    }
    updateScenarioDropdown();
    updateSavedDisplay(scenario.timestamp || null);
    scenarioLoadGuardDirty = false;
    showFeedback(`Scenario "${scenario.name}" saved successfully!`, 'success');
  }

  function getSavedScenarios() {
    try {
      const saved = localStorage.getItem(STORAGE_SCENARIOS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to read saved scenarios:', e);
      showToast('Could not read saved scenarios. Data may be corrupted.', 'error', 4000);
      return [];
    }
  }

  function updateSavedDisplay(isoTimestampOrNull) {
    const el = g('meds-saved-display');
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

  function syncScenarioSelectTitle() {
    const select = g('meds-scenario-select');
    if (!select) return;
    const opt = select.selectedOptions && select.selectedOptions[0];
    const text = opt ? String(opt.textContent || '').trim() : '';
    select.title = text;
  }

  function updateScenarioDropdown() {
    const select = g('meds-scenario-select');
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
      opt.textContent = s.name || 'Unnamed';
      select.appendChild(opt);
    });

    const loadBtn = g('meds-load-btn');
    const deleteBtn = g('meds-delete-btn');
    const clearBtn = g('meds-clear-btn');
    const disabled = scenarios.length === 0;
    select.disabled = disabled;
    if (loadBtn) loadBtn.disabled = disabled;
    if (deleteBtn) deleteBtn.disabled = disabled;
    if (clearBtn) clearBtn.disabled = disabled;
    syncScenarioSelectTitle();
  }

  function loadSelectedScenario() {
    const select = g('meds-scenario-select');
    const scenarioId = select ? select.value : '';

    if (!scenarioId) {
      showFeedback('Please select a scenario to load.', 'info');
      return;
    }

    const scenarios = getSavedScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);

    if (!scenario) {
      showFeedback('Scenario not found.', 'info');
      return;
    }

    if (!confirmOverwriteIfDirty()) return;

    ['days', 'beds', 'buffer'].forEach(clearValidationError);
    if (scenario.consumables && Array.isArray(scenario.consumables)) {
      allConsumables = scenario.consumables;
    }
    if (scenario.deploymentDays != null) {
      deploymentDays = sanitizeDays(scenario.deploymentDays);
      const de = g('meds-days');
      if (de) de.value = (deploymentDays !== 0) ? deploymentDays : '';
    }
    if (scenario.deploymentBeds != null) {
      deploymentBeds = sanitizeBeds(scenario.deploymentBeds);
      const be = g('meds-beds');
      if (be) be.value = (deploymentBeds !== 0) ? deploymentBeds : '';
    }
    if (scenario.bufferPercentage !== undefined) {
      bufferPercentage = sanitizeBuffer(scenario.bufferPercentage);
      const bu = g('meds-buffer');
      if (bu) bu.value = (bufferPercentage !== 0) ? bufferPercentage : '';
    }
    if (scenario.fileName) {
      currentFileName = scenario.fileName;
      currentListType = resolveListType(scenario);
    } else {
      currentFileName = null;
      currentListType = null;
    }
    if (g('meds-scenario-name')) g('meds-scenario-name').value = scenario.baseName || scenario.name || '';
    if (g('meds-scenario-notes')) g('meds-scenario-notes').value = scenario.notes || '';
    updateSavedDisplay(scenario.timestamp || null);
    clearViewFilters();

    filterItems();
    calculateAndDisplay();
    saveData();
    scenarioLoadGuardDirty = false;
    acknowledge('meds-load-btn', 'Loaded!');
  }

  function deleteSelectedScenario() {
    const select = g('meds-scenario-select');
    const scenarioId = select ? select.value : '';
    if (!scenarioId) {
      showFeedback('Please select a scenario to delete.', 'info');
      return;
    }
    const scenarios = getSavedScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      showFeedback('Scenario not found.', 'info');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${scenario.name}"?`)) return;
    const updated = scenarios.filter(s => s.id !== scenarioId);
    try {
      localStorage.setItem(STORAGE_SCENARIOS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save scenarios:', e);
      showFeedback('Could not delete scenario. Storage may be disabled or full.', 'error');
      return;
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
      localStorage.removeItem(STORAGE_SCENARIOS);
    } catch (e) {
      showFeedback('Could not clear scenarios. Storage may be disabled or full.', 'error');
      return;
    }
    updateScenarioDropdown();
    updateSavedDisplay(null);
    showFeedback('All scenarios cleared successfully!', 'success');
  }

  function handleImportFile(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    const sourceFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const issues = [];
        const data = JSON.parse(e.target.result);
        const scenario = data;
        const hasConsumables = Array.isArray(scenario && scenario.consumables);
        const hasDays = scenario && scenario.deploymentDays !== undefined;
        const hasBeds = scenario && scenario.deploymentBeds !== undefined;
        const hasBuffer = scenario && scenario.bufferPercentage !== undefined;
        const hasFileName = scenario && scenario.fileName !== undefined;
        if (!scenario || typeof scenario !== 'object' || (!hasConsumables && !hasDays && !hasBeds && !hasBuffer && !hasFileName)) {
          throw new Error('Invalid scenario file format');
        }
        if (!confirmImportIfDirty()) {
          input.value = '';
          return;
        }
        if (scenario.consumables && Array.isArray(scenario.consumables)) {
          allConsumables = sanitizeImportedConsumables(scenario.consumables, issues);
        }
        if (scenario.deploymentDays !== undefined) {
          const parsedDays = Number(scenario.deploymentDays);
          if (!Number.isFinite(parsedDays) || parsedDays < 0) {
            issues.push(`Deployment Days: invalid value "${scenario.deploymentDays}" replaced with 0.`);
            deploymentDays = 0;
          } else {
            deploymentDays = parsedDays;
          }
          const de = g('meds-days');
          if (de) de.value = (deploymentDays !== 0) ? deploymentDays : '';
        }
        if (scenario.deploymentBeds !== undefined) {
          const parsedBeds = Number(scenario.deploymentBeds);
          if (!Number.isFinite(parsedBeds) || parsedBeds < 0) {
            issues.push(`Deployment Beds: invalid value "${scenario.deploymentBeds}" replaced with 0.`);
            deploymentBeds = 0;
          } else {
            deploymentBeds = parsedBeds;
          }
          const be = g('meds-beds');
          if (be) be.value = (deploymentBeds !== 0) ? deploymentBeds : '';
        }
        if (scenario.bufferPercentage !== undefined) {
          const parsedBuffer = Number(scenario.bufferPercentage);
          if (!Number.isFinite(parsedBuffer)) {
            issues.push(`Buffer Percentage: invalid value "${scenario.bufferPercentage}" replaced with 0.`);
            bufferPercentage = 0;
          } else if (parsedBuffer < 0 || parsedBuffer > 100) {
            const clamped = Math.max(0, Math.min(100, parsedBuffer));
            issues.push(`Buffer Percentage: out-of-range value "${scenario.bufferPercentage}" clamped to ${clamped}.`);
            bufferPercentage = clamped;
          } else {
            bufferPercentage = parsedBuffer;
          }
          const bu = g('meds-buffer');
          if (bu) bu.value = (bufferPercentage !== 0) ? bufferPercentage : '';
        }
        if (scenario.fileName) {
          currentFileName = scenario.fileName;
          currentListType = resolveListType(scenario);
        } else {
          currentFileName = null;
          currentListType = null;
        }
        // Imported files have name only; saved scenarios have baseName and name.
        if (g('meds-scenario-name')) g('meds-scenario-name').value = scenario.name || '';
        if (g('meds-scenario-notes')) g('meds-scenario-notes').value = scenario.notes || '';
        clearViewFilters();
        filterItems();
        calculateAndDisplay();
        saveData();
        scenarioLoadGuardDirty = false;
        if (issues.length > 0) {
          downloadImportIssueReport(sourceFileName, issues);
          acknowledge('meds-import-btn', `Imported (${issues.length} issue${issues.length === 1 ? '' : 's'})`);
        } else {
          acknowledge('meds-import-btn', 'Imported!');
        }
      } catch (err) {
        console.error(err);
        acknowledge('meds-import-btn', 'Invalid file');
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  function onExportToFile() {
    const dialog = g('meds-export-format-dialog');
    if (dialog) {
      const jsonRadio = document.querySelector('#meds-export-format-dialog input[name="meds-export-format"][value="JSON"]');
      if (jsonRadio) jsonRadio.checked = true;
      dialog.hidden = false;
      dialog.setAttribute('aria-hidden', 'false');
    }
  }

  function performExportWithFormat(fmt) {
    const format = (fmt && String(fmt).toUpperCase()) || 'JSON';
    const scenario = buildExportScenario();
    if (format === 'CSV') {
      const csv = buildCsvExport(scenario);
      downloadTextFile(csv, 'text/csv;charset=utf-8', 'medications-calc-export.csv');
      showFeedback('Scenario exported as CSV.', 'success');
      return;
    }
    downloadTextFile(
      JSON.stringify(scenario, null, 2),
      'application/json',
      'medications-supply-scenario.json'
    );
    showFeedback('Scenario exported as JSON.', 'success');
  }

  function closeExportFormatDialog() {
    const dialog = g('meds-export-format-dialog');
    if (dialog) {
      dialog.hidden = true;
      dialog.setAttribute('aria-hidden', 'true');
    }
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
    const nameEl = g('meds-scenario-name');
    const notesEl = g('meds-scenario-notes');
    return {
      name: (nameEl && nameEl.value.trim()) || `Medications scenario ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
      notes: notesEl ? notesEl.value.trim() : '',
      deploymentDays,
      deploymentBeds,
      bufferPercentage,
      consumables: allConsumables,
      fileName: currentFileName,
      listType: currentListType,
      timestamp: new Date().toISOString()
    };
  }

  function toCsvCell(value) {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function buildCsvExport(scenario) {
    const lines = [];
    lines.push('Field,Value');
    lines.push(`${toCsvCell('Scenario Name')},${toCsvCell(scenario.name || '')}`);
    lines.push(`${toCsvCell('Scenario Notes')},${toCsvCell(scenario.notes || '')}`);
    lines.push(`${toCsvCell('Source List')},${toCsvCell(scenario.fileName || '')}`);
    lines.push(`${toCsvCell('Deployment Days')},${toCsvCell(deploymentDays)}`);
    lines.push(`${toCsvCell('Deployment Beds')},${toCsvCell(deploymentBeds)}`);
    lines.push(`${toCsvCell('Buffer Percentage')},${toCsvCell(bufferPercentage)}`);
    lines.push(`${toCsvCell('Exported At')},${toCsvCell(scenario.timestamp ? new Date(scenario.timestamp).toLocaleString() : '')}`);
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

    return `\uFEFF${lines.join('\n')}`;
  }

  function updateAutosaveTimestampDisplay(tsIsoString) {
    const el = document.getElementById('meds-last-saved');
    if (!el) return;
    if (!tsIsoString || typeof tsIsoString !== 'string') {
      el.textContent = '';
      return;
    }
    try {
      const date = new Date(tsIsoString);
      if (isNaN(date.getTime())) {
        el.textContent = '';
        return;
      }
      const mo = date.getMonth() + 1;
      const day = date.getDate();
      const h24 = date.getHours();
      const min = date.getMinutes();
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      const mm = min < 10 ? '0' + min : String(min);
      el.textContent = `Autosaved: ${mo}/${day} ${h12}:${mm} ${ampm}`;
    } catch (e) {
      el.textContent = '';
    }
  }

  function startAutosaveTimer() {
    if (autosaveTimerId != null) return;
    try {
      autosaveTimerId = setInterval(function () {
        if (medsAutosaveDirty) saveData();
      }, AUTOSAVE_INTERVAL_MS);
    } catch (e) { /* ignore */ }
  }

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    const host = document.getElementById('panel-medications');
    let container = host.querySelector(':scope > .toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      host.appendChild(container);
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
      localStorage.setItem(STORAGE_DAYS, String(deploymentDays));
      localStorage.setItem(STORAGE_BEDS, String(deploymentBeds));
      const nameEl = g('meds-scenario-name');
      const notesEl = g('meds-scenario-notes');
      localStorage.setItem(STORAGE_SCENARIO_NAME, (nameEl && nameEl.value) ? nameEl.value : '');
      localStorage.setItem(STORAGE_SCENARIO_NOTES, (notesEl && notesEl.value) ? notesEl.value : '');
      const searchEl = g('meds-search');
      const minQtyEl = g('meds-min-qty-filter');
      const nonzeroEl = g('meds-nonzero-only-filter');
      localStorage.setItem(STORAGE_SEARCH, (searchEl && searchEl.value) ? searchEl.value : '');
      localStorage.setItem(STORAGE_MIN_QTY_FILTER, (minQtyEl && minQtyEl.value) ? minQtyEl.value : '');
      localStorage.setItem(STORAGE_NONZERO_ONLY, (nonzeroEl && nonzeroEl.checked) ? '1' : '0');
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
      medsAutosaveDirty = false;
    } catch (e) {
      console.warn('Medicines autosave failed:', e);
      showToast('Could not autosave (storage may be full or blocked).', 'error', 4000);
    }
  }

  function tryAutosaveOnBlur() {
    if (medsAutosaveDirty) saveData();
  }

  function loadSavedData() {
    const savedBuffer = localStorage.getItem(STORAGE_BUFFER);
    const savedConsumables = localStorage.getItem(STORAGE_CONSUMABLES);
    const savedDays = localStorage.getItem(STORAGE_DAYS);
    const savedBeds = localStorage.getItem(STORAGE_BEDS);
    const savedScenarioName = localStorage.getItem(STORAGE_SCENARIO_NAME);
    const savedScenarioNotes = localStorage.getItem(STORAGE_SCENARIO_NOTES);
    const savedSearch = localStorage.getItem(STORAGE_SEARCH);
    const savedMinQtyFilter = localStorage.getItem(STORAGE_MIN_QTY_FILTER);
    const savedNonzeroOnly = localStorage.getItem(STORAGE_NONZERO_ONLY);

    const de = g('meds-days');
    const be = g('meds-beds');
    const nameEl = g('meds-scenario-name');
    const notesEl = g('meds-scenario-notes');
    const searchEl = g('meds-search');
    const minQtyEl = g('meds-min-qty-filter');
    const nonzeroEl = g('meds-nonzero-only-filter');

    if (nameEl) nameEl.value = (savedScenarioName != null) ? savedScenarioName : '';
    if (notesEl) notesEl.value = (savedScenarioNotes != null) ? savedScenarioNotes : '';
    if (searchEl) searchEl.value = (savedSearch != null) ? savedSearch : '';
    if (minQtyEl) minQtyEl.value = (savedMinQtyFilter != null) ? savedMinQtyFilter : '';
    if (nonzeroEl) nonzeroEl.checked = savedNonzeroOnly === '1';

    if (savedDays !== null) {
      deploymentDays = sanitizeDays(parseFloat(savedDays));
      if (de) de.value = deploymentDays !== 0 ? String(deploymentDays) : '';
    } else {
      deploymentDays = 0;
      if (de) de.value = '';
    }
    if (savedBeds !== null) {
      deploymentBeds = sanitizeBeds(parseFloat(savedBeds));
      if (be) be.value = deploymentBeds !== 0 ? String(deploymentBeds) : '';
    } else {
      deploymentBeds = 0;
      if (be) be.value = '';
    }

    if (savedBuffer !== null) {
      bufferPercentage = sanitizeBuffer(parseFloat(savedBuffer));
      const bu = g('meds-buffer');
      if (bu) bu.value = (bufferPercentage !== 0) ? String(bufferPercentage) : '';
    } else {
      const bu = g('meds-buffer');
      if (bu) bu.value = '';
    }
    if (savedConsumables) {
      try {
        allConsumables = JSON.parse(savedConsumables);
        filterItems();
      } catch (e) {
        console.error('Error loading saved medications:', e);
        allConsumables = [];
        try { localStorage.removeItem(STORAGE_CONSUMABLES); } catch (err) {}
        showFeedback('Saved data was reset due to an error.', 'info');
      }
    }
    const savedFileName = localStorage.getItem(STORAGE_FILENAME);
    if (savedFileName) {
      currentFileName = savedFileName;
      currentListType = listTypeFromFileName(savedFileName);
    } else {
      currentFileName = null;
      currentListType = allConsumables.length > 0 ? 'custom' : null;
    }
    calculateAndDisplay();
    let lastSaved = localStorage.getItem(LAST_SAVED_KEY);
    if (!lastSaved && (savedBuffer !== null || savedConsumables)) {
      try {
        lastSaved = new Date().toISOString();
        localStorage.setItem(LAST_SAVED_KEY, lastSaved);
      } catch (e) { /* ignore */ }
    }
    updateAutosaveTimestampDisplay(lastSaved);
    medsAutosaveDirty = false;
    scenarioLoadGuardDirty = false;
  }

  function restoreAutosavedState() {
    if (!localStorage.getItem(LAST_SAVED_KEY)) {
      showToast('No autosaved worksheet state to restore.', 'info', 2500);
      return;
    }
    loadSavedData();
    showToast('Restored worksheet from autosave.', 'success', 2500);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showFeedback(message, type) {
    type = type || 'success';
    const feedbackEl = g('meds-button-feedback');
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
    try {
      localStorage.removeItem(STORAGE_CONSUMABLES);
      localStorage.removeItem(STORAGE_FILENAME);
    } catch (e) {
      showFeedback('Items cleared; storage preference could not be updated.', 'info');
    }

    const pb = g('meds-pharma-list-btn');
    if (pb) pb.classList.remove('active');
    const psb = g('meds-pharma-secondary-list-btn');
    if (psb) psb.classList.remove('active');
    const minQtyEl = g('meds-min-qty-filter');
    if (minQtyEl) minQtyEl.value = '';
    const nonZeroEl = g('meds-nonzero-only-filter');
    if (nonZeroEl) nonZeroEl.checked = false;

    deploymentDays = 0;
    deploymentBeds = 0;
    bufferPercentage = 0;
    const daysEl = g('meds-days');
    if (daysEl) daysEl.value = '';
    const bedsEl = g('meds-beds');
    if (bedsEl) bedsEl.value = '';
    const bufferEl = g('meds-buffer');
    if (bufferEl) bufferEl.value = '';
    ['days', 'beds', 'buffer'].forEach(clearValidationError);

    const nameEl = g('meds-scenario-name');
    if (nameEl) nameEl.value = '';
    const notesEl = g('meds-scenario-notes');
    if (notesEl) notesEl.value = '';

    updateSavedDisplay(null);
    filterItems();
    calculateAndDisplay();
    saveData();
    scenarioLoadGuardDirty = false;
    showFeedback('All items cleared successfully!', 'success');
  }

  function loadPharmaList() {
    if (typeof PHARMA_ITEMS === 'undefined' || !PHARMA_ITEMS.length) {
      showFeedback('Ward Meds list is not available. Add data to medications-data.js (PHARMA_ITEMS).', 'info');
      return;
    }
    try {
      allConsumables = JSON.parse(JSON.stringify(PHARMA_ITEMS));
    } catch (e) {
      console.error('Failed to load Ward Meds list:', e);
      allConsumables = [];
      showFeedback('Could not load Ward Meds list. Data may be invalid.', 'error');
      return;
    }
    filteredConsumables = allConsumables.slice();
    currentFileName = 'Ward Meds';
    currentListType = 'ward';

    const searchEl = g('meds-search');
    if (searchEl) searchEl.value = '';
    const minQtyEl = g('meds-min-qty-filter');
    if (minQtyEl) minQtyEl.value = '';
    const nonZeroEl = g('meds-nonzero-only-filter');
    if (nonZeroEl) nonZeroEl.checked = false;
    const pb = g('meds-pharma-list-btn');
    const psb = g('meds-pharma-secondary-list-btn');
    if (pb) pb.classList.add('active');
    if (psb) psb.classList.remove('active');

    filterItems();
    displayConsumables();
    updateItemsInfo();
    saveData();
    scenarioLoadGuardDirty = false;
    showFeedback('Ward Meds loaded', 'success');
  }

  function loadSecondaryPharmaList() {
    if (typeof PHARMA_ITEMS_SECONDARY === 'undefined' || !PHARMA_ITEMS_SECONDARY.length) {
      showFeedback('ICU Meds list is not available. Add data to medications-data.js (PHARMA_ITEMS_SECONDARY).', 'info');
      return;
    }
    try {
      allConsumables = JSON.parse(JSON.stringify(PHARMA_ITEMS_SECONDARY));
    } catch (e) {
      console.error('Failed to load ICU Meds list:', e);
      allConsumables = [];
      showFeedback('Could not load ICU Meds list. Data may be invalid.', 'error');
      return;
    }
    filteredConsumables = allConsumables.slice();
    currentFileName = 'ICU Meds';
    currentListType = 'icu';

    const searchEl = g('meds-search');
    if (searchEl) searchEl.value = '';
    const minQtyEl = g('meds-min-qty-filter');
    if (minQtyEl) minQtyEl.value = '';
    const nonZeroEl = g('meds-nonzero-only-filter');
    if (nonZeroEl) nonZeroEl.checked = false;
    const pb = g('meds-pharma-list-btn');
    const psb = g('meds-pharma-secondary-list-btn');
    if (pb) pb.classList.remove('active');
    if (psb) psb.classList.add('active');

    filterItems();
    displayConsumables();
    updateItemsInfo();
    saveData();
    scenarioLoadGuardDirty = false;
    showFeedback('ICU Meds loaded', 'success');
  }

  function init() {
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      if (saved && ['name-asc', 'name-desc', 'qty-desc', 'qty-asc'].includes(saved)) {
        currentSortKey = saved;
        const sel = g('meds-sort-equipment');
        if (sel) sel.value = saved;
      }
    } catch (e) {}

    setupEventListeners();
    medsAutosaveDirty = false;
    scenarioLoadGuardDirty = false;
    startAutosaveTimer();
    try {
      updateAutosaveTimestampDisplay(localStorage.getItem(LAST_SAVED_KEY));
    } catch (e) { /* ignore */ }
    updateAddItemRatePlaceholder();
    updateInventoryHelpRateLabel();
    updateItemsInfo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
