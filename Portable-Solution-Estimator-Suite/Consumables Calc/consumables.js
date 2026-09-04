/**
 * Consumables Calculator (Consumables panel)
 * Uses cons- prefixed IDs.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cons-pseScenarios';
  const STORAGE_BUFFER = 'cons-pseBuffer';
  const STORAGE_CONSUMABLES = 'cons-pseConsumables';
  const STORAGE_FILENAME = 'cons-pseFileName';
  const STORAGE_DAYS = 'cons-pseDays';
  const STORAGE_BEDS = 'cons-pseBeds';
  const STORAGE_SCENARIO_NAME = 'cons-pseScenarioName';
  const STORAGE_SCENARIO_NOTES = 'cons-pseScenarioNotes';
  const STORAGE_SEARCH = 'cons-pseSearch';
  const STORAGE_MIN_QTY_FILTER = 'cons-pseMinQtyFilter';
  const STORAGE_NONZERO_ONLY = 'cons-pseNonzeroOnly';
  const STORAGE_LIST_TYPE = 'cons-pseListType';
  const STORAGE_VIEW_STATE = 'cons-pseViewState';
  const STORAGE_SCHEMA_VERSION = 'cons-pseSchemaVersion';
  const STORAGE_HOSPITAL_ITEMS = 'cons-pseHospitalItems';
  const STORAGE_HOSPITAL_LABEL = 'cons-pseHospitalLabel';
  const STORAGE_UPLOAD_PROVENANCE = 'cons-pseUploadProvenance';
  const SORT_STORAGE_KEY = 'cons-pseSort';
  const SCHEMA_VERSION = 1;
  const LIST_CALC_SORT_KEYS = ['source-asc', 'name-asc', 'name-desc', 'qty-desc', 'qty-asc'];
  const VIEW_STATE_DEFAULTS = {
    sort: 'source-asc',
    search: '',
    minQtyFilter: '',
    nonZeroOnly: false
  };
  const DEFAULT_HOSPITAL_LABEL = 'Hospital Data';
  const RESERVED_LIST_LABELS = ['Ward Consumables', 'ICU Consumables'];
  const HOSPITAL_RATE_OUTLIER_CEILING = 50;
  const HOSPITAL_CSV_TEMPLATE =
    'Item name,Quantity consumed\n"Gloves nitrile L, bx/100",200\n';
  const MSG_HOSPITAL_UPLOAD_DAYS_BEDS =
    'Enter positive numbers for days and beds.';
  const MSG_HOSPITAL_OUTLIER =
    'We flagged a few items with extremely high daily use rates — please check those quantities for typos such as an extra zero.';
  const MSG_REMOVE_HOSPITAL =
    'Remove your uploaded list? Saved scenarios and exports keep their copies.';
  const MSG_HOSPITAL_REPLACE_PASTE_WITH_FILE = 'Replace pasted data with file?';
  const MSG_HOSPITAL_REPLACE_FILE_WITH_PASTE = 'Replace file with pasted data?';
  const MSG_HOSPITAL_NEED_SOURCE = 'Paste your list or choose a CSV file first.';

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

  const AUTOSAVE_INTERVAL_MS = 1 * 60 * 1000;
  const DEBOUNCED_AUTOSAVE_MS = 3 * 1000;
  let autosaveTimerId = null;
  let debouncedAutosaveTimeout = null;
  /** True after worksheet edits until a successful saveData() (matches Load Calc Basic autosave model). */
  let consAutosaveDirty = false;
  /** Stays true across successful autosaves until load/import/restore/named save clears it (unsaved-edit guard). */
  let scenarioLoadGuardDirty = false;

  const MSG_LOAD_OVERWRITE_DIRTY = 'You have unsaved changes on this worksheet. Load this scenario anyway? Unsaved edits may be lost.';
  const MSG_IMPORT_OVERWRITE_DIRTY = 'You have unsaved changes on this worksheet. Import this file anyway? Unsaved edits may be lost.';

  async function confirmOverwriteIfDirty() {
    if (!scenarioLoadGuardDirty) return true;
    return shellConfirm(MSG_LOAD_OVERWRITE_DIRTY);
  }

  async function confirmImportIfDirty() {
    if (!scenarioLoadGuardDirty) return true;
    return shellConfirm(MSG_IMPORT_OVERWRITE_DIRTY);
  }

  function notifyWorksheetChanged() {
    consAutosaveDirty = true;
    scenarioLoadGuardDirty = true;
    scheduleDebouncedAutosave();
  }

  function scheduleDebouncedAutosave() {
    if (!consAutosaveDirty) return;
    if (debouncedAutosaveTimeout) clearTimeout(debouncedAutosaveTimeout);
    debouncedAutosaveTimeout = setTimeout(function () {
      debouncedAutosaveTimeout = null;
      saveData();
    }, DEBOUNCED_AUTOSAVE_MS);
  }

  let allConsumables = [];
  let filteredConsumables = [];
  let deploymentDays = 0;
  let deploymentBeds = 0;
  let bufferPercentage = 0;
  let currentFileName = null;
  let currentSortKey = 'source-asc';
  /** 'ward' | 'icu' | 'hospital' | 'custom' | null. null = no list / cleared; 'custom' = list present but not a known built-in/hospital list. */
  let currentListType = null;
  let customItemCounter = 1;
  /** Cached hospital upload (survives Ward/ICU switch until Reset or re-upload). */
  let hospitalItemsCache = [];
  let hospitalListLabel = DEFAULT_HOSPITAL_LABEL;
  let uploadProvenance = null;
  let pendingHospitalCsvText = null;
  let pendingHospitalFilename = null;
  let hospitalSourceReplaceBusy = false;
  let hospitalPasteFeedbackTimer = null;

  function listTypeFromFileName(fileName) {
    if (!fileName) return null;
    if (fileName === 'Ward Consumables') return 'ward';
    if (fileName === 'ICU Consumables') return 'icu';
    return 'custom';
  }

  /** Prefer listLabel; fall back to legacy fileName. */
  function resolveListLabel(data) {
    if (!data || typeof data !== 'object') return null;
    if (typeof data.listLabel === 'string' && data.listLabel) return data.listLabel;
    if (typeof data.fileName === 'string' && data.fileName) return data.fileName;
    return null;
  }

  /** Use saved listType if valid; otherwise derive from listLabel/fileName. For scenario load/import. */
  function resolveListType(scenario) {
    const t = scenario && scenario.listType;
    if (t === 'ward' || t === 'icu' || t === 'hospital' || t === 'custom') return t;
    return listTypeFromFileName(resolveListLabel(scenario));
  }

  function sanitizeListLabel(raw, defaultLabel, reservedLabels) {
    const fallback = defaultLabel || DEFAULT_HOSPITAL_LABEL;
    let s = String(raw == null ? '' : raw);
    s = s.replace(/[\u0000-\u001F\u007F]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (!s) s = fallback;
    const reserved = reservedLabels || RESERVED_LIST_LABELS;
    const lower = s.toLowerCase();
    if (reserved.some(function (r) { return String(r).toLowerCase() === lower; })) {
      s = s + ' (upload)';
    }
    if (s.length > 24) s = s.slice(0, 24).trim();
    if (!s) s = String(fallback).slice(0, 24);
    return s;
  }

  function parseCsvLine(line) {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  }

  function hospitalTextUsesTabDelimiter(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
    for (let i = 0; i < lines.length; i++) {
      if (String(lines[i] || '').trim() === '') continue;
      if (String(lines[i]).indexOf('\t') !== -1) return true;
    }
    return false;
  }

  function splitHospitalFields(rawLine, useTab) {
    if (useTab) return String(rawLine).split('\t');
    return parseCsvLine(rawLine);
  }

  function isCsvHeaderRow(fields) {
    if (!fields || fields.length < 2) return false;
    const a = String(fields[0] || '').trim().toLowerCase();
    const b = String(fields[1] || '').trim().toLowerCase();
    return (a.indexOf('item') !== -1 || a.indexOf('name') !== -1) &&
      (b.indexOf('qty') !== -1 || b.indexOf('quantity') !== -1 || b.indexOf('consumed') !== -1);
  }

  /**
   * Parse two-column hospital list (comma CSV or tab-delimited). Mutates flags counters.
   * flags: { unreadable, blankName, badQty, duplicates, outlierNames, validCount }
   */
  function parseHospitalCsv(text, sourceDays, sourceBeds, flags) {
    const items = [];
    const seenNames = Object.create(null);
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
    const useTab = hospitalTextUsesTabDelimiter(text);
    let started = false;
    let sourceOrder = 1;
    for (let li = 0; li < lines.length; li++) {
      const rawLine = lines[li];
      if (!started && String(rawLine || '').trim() === '') continue;
      const fields = splitHospitalFields(rawLine, useTab);
      if (!started) {
        started = true;
        if (isCsvHeaderRow(fields)) continue;
      }
      if (fields.length !== 2) {
        if (String(rawLine || '').trim() !== '') flags.unreadable += 1;
        continue;
      }
      const name = String(fields[0] || '').trim();
      if (!name) {
        flags.blankName += 1;
        continue;
      }
      const qtyRaw = String(fields[1] || '').trim().replace(/,/g, '');
      const qty = Number(qtyRaw);
      if (!Number.isFinite(qty) || qty < 0) {
        flags.badQty += 1;
        continue;
      }
      const nameKey = name.toLowerCase();
      if (seenNames[nameKey]) {
        flags.duplicates += 1;
        continue;
      }
      seenNames[nameKey] = true;
      const rate = qty / sourceBeds / sourceDays;
      if (rate > HOSPITAL_RATE_OUTLIER_CEILING) {
        flags.outlierNames.push(name);
      }
      items.push({
        name: name,
        usagePerDayPerBed: rate,
        id: sourceOrder++,
        isCustom: false
      });
    }
    flags.validCount = items.length;
    return items;
  }

  /** Canonical scenarioName preferred; legacy name accepted. */
  function resolveScenarioNameField(data) {
    if (!data || typeof data !== 'object') return null;
    if (typeof data.scenarioName === 'string') return data.scenarioName;
    if (typeof data.name === 'string') return data.name;
    return null;
  }

  /** Canonical scenarioNotes preferred; legacy notes accepted. */
  function resolveScenarioNotesField(data) {
    if (!data || typeof data !== 'object') return null;
    if (typeof data.scenarioNotes === 'string') return data.scenarioNotes;
    if (typeof data.notes === 'string') return data.notes;
    return null;
  }

  function captureViewState() {
    const searchEl = g('search');
    const sortEl = g('sort-equipment');
    const minQtyEl = g('min-qty-filter');
    const nonzeroEl = g('nonzero-only-filter');
    return {
      sort: (sortEl && sortEl.value) || currentSortKey,
      search: (searchEl && searchEl.value) || '',
      minQtyFilter: (minQtyEl && minQtyEl.value) || '',
      nonZeroOnly: !!(nonzeroEl && nonzeroEl.checked)
    };
  }

  /**
   * Apply viewState to controls. Does NOT write cons-pseSort (session-only).
   * opts.preserveSort: when true and sort missing/invalid, leave currentSortKey alone
   * (v0 autosave had filters but not sort).
   */
  function applyViewState(data, opts) {
    opts = opts || {};
    const src = (data && data.viewState && typeof data.viewState === 'object') ? data.viewState : {};
    let sort;
    if (typeof src.sort === 'string' && LIST_CALC_SORT_KEYS.includes(src.sort)) {
      sort = src.sort;
    } else if (opts.preserveSort) {
      sort = currentSortKey;
    } else {
      sort = VIEW_STATE_DEFAULTS.sort;
    }
    const search = typeof src.search === 'string' ? src.search : VIEW_STATE_DEFAULTS.search;
    const minQtyFilter = typeof src.minQtyFilter === 'string'
      ? src.minQtyFilter
      : VIEW_STATE_DEFAULTS.minQtyFilter;
    const nonZeroOnly = typeof src.nonZeroOnly === 'boolean'
      ? src.nonZeroOnly
      : VIEW_STATE_DEFAULTS.nonZeroOnly;

    currentSortKey = sort;
    const sortEl = g('sort-equipment');
    if (sortEl) sortEl.value = sort;
    const searchEl = g('search');
    if (searchEl) searchEl.value = search;
    const minQtyEl = g('min-qty-filter');
    if (minQtyEl) minQtyEl.value = minQtyFilter;
    const nonzeroEl = g('nonzero-only-filter');
    if (nonzeroEl) nonzeroEl.checked = nonZeroOnly;

    filterItems();
  }

  function getRateColumnLabel(listType) {
    return listType === 'ward' ? 'Per day/Per Ward Bed' : listType === 'icu' ? 'Per day/Per ICU Bed' : 'Per day/Per Bed';
  }

  function getRatePlaceholder(listType) {
    return listType === 'ward' ? 'Per day/Per Ward Bed' : listType === 'icu' ? 'Per day/Per ICU Bed' : 'Per day/Per bed';
  }

  function setListButtonActive(listType) {
    const wb = g('ward-list-btn');
    const ib = g('icu-list-btn');
    const hb = g('hospital-list-btn');
    if (wb) wb.classList.toggle('active', listType === 'ward');
    if (ib) ib.classList.toggle('active', listType === 'icu');
    if (hb) hb.classList.toggle('active', listType === 'hospital');
  }

  function syncHospitalButton() {
    const hasHospital = hospitalItemsCache && hospitalItemsCache.length > 0;
    const hb = g('hospital-list-btn');
    if (hb) {
      hb.hidden = !hasHospital;
      if (hasHospital) {
        hb.textContent = hospitalListLabel || DEFAULT_HOSPITAL_LABEL;
        hb.title = 'Load your uploaded hospital consumables list; replaces the current worksheet list.';
      } else {
        hb.classList.remove('active');
      }
    }
    const removeBtn = g('hospital-remove-btn');
    if (removeBtn) removeBtn.hidden = !hasHospital;
  }

  function clearHospitalCache() {
    hospitalItemsCache = [];
    hospitalListLabel = DEFAULT_HOSPITAL_LABEL;
    uploadProvenance = null;
    syncHospitalButton();
  }

  function clearHospitalAutosaveKeys() {
    try {
      localStorage.removeItem(STORAGE_HOSPITAL_ITEMS);
      localStorage.removeItem(STORAGE_HOSPITAL_LABEL);
      localStorage.removeItem(STORAGE_UPLOAD_PROVENANCE);
    } catch (e) { /* ignore */ }
  }

  async function removeHospitalList() {
    if (!hospitalItemsCache || hospitalItemsCache.length === 0) {
      showFeedback('No uploaded list to remove.', 'info');
      return;
    }
    if (!(await shellConfirm(MSG_REMOVE_HOSPITAL))) return;

    const hospitalWasActive = currentListType === 'hospital';
    clearHospitalCache();
    clearHospitalAutosaveKeys();
    dismissUploadFlags();

    if (hospitalWasActive) {
      allConsumables = [];
      filteredConsumables = [];
      currentFileName = null;
      currentListType = null;
      setListButtonActive(null);
      clearViewFilters();
      filterItems();
      calculateAndDisplay();
    }

    saveData();
    scenarioLoadGuardDirty = false;
    closeHospitalUploadDialog();
    showFeedback('Uploaded list removed.', 'success');
  }

  function restoreHospitalCacheFromStorage() {
    try {
      const rawItems = localStorage.getItem(STORAGE_HOSPITAL_ITEMS);
      const rawLabel = localStorage.getItem(STORAGE_HOSPITAL_LABEL);
      const rawProv = localStorage.getItem(STORAGE_UPLOAD_PROVENANCE);
      if (!rawItems) {
        hospitalItemsCache = [];
        hospitalListLabel = DEFAULT_HOSPITAL_LABEL;
        uploadProvenance = null;
        return;
      }
      const parsed = JSON.parse(rawItems);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        hospitalItemsCache = [];
        hospitalListLabel = DEFAULT_HOSPITAL_LABEL;
        uploadProvenance = null;
        return;
      }
      hospitalItemsCache = parsed;
      hospitalListLabel = (rawLabel && String(rawLabel).trim())
        ? sanitizeListLabel(rawLabel, DEFAULT_HOSPITAL_LABEL, RESERVED_LIST_LABELS)
        : DEFAULT_HOSPITAL_LABEL;
      if (rawProv) {
        try {
          uploadProvenance = JSON.parse(rawProv);
        } catch (e) {
          uploadProvenance = null;
        }
      } else {
        uploadProvenance = null;
      }
    } catch (e) {
      hospitalItemsCache = [];
      hospitalListLabel = DEFAULT_HOSPITAL_LABEL;
      uploadProvenance = null;
    }
  }

  function rememberHospitalFromWorksheet() {
    if (currentListType !== 'hospital') return;
    hospitalItemsCache = JSON.parse(JSON.stringify(allConsumables));
    hospitalListLabel = currentFileName || hospitalListLabel || DEFAULT_HOSPITAL_LABEL;
    syncHospitalButton();
  }

  function dismissUploadFlags() {
    const callout = g('upload-flags-callout');
    if (callout) callout.hidden = true;
    const body = g('upload-flags-body');
    if (body) body.innerHTML = '';
  }

  function showUploadFlags(flags) {
    const parts = [];
    if (flags.unreadable > 0) {
      parts.push('Skipped ' + flags.unreadable + ' unreadable row' + (flags.unreadable === 1 ? '' : 's') + '.');
    }
    if (flags.blankName > 0) {
      parts.push('Skipped ' + flags.blankName + ' row' + (flags.blankName === 1 ? '' : 's') + ' with blank item names.');
    }
    if (flags.badQty > 0) {
      parts.push('Skipped ' + flags.badQty + ' row' + (flags.badQty === 1 ? '' : 's') + ' with invalid quantities.');
    }
    if (flags.duplicates > 0) {
      parts.push('Skipped ' + flags.duplicates + ' duplicate item name' + (flags.duplicates === 1 ? '' : 's') + ' (kept the first).');
    }
    if (flags.outlierNames && flags.outlierNames.length > 0) {
      parts.push(MSG_HOSPITAL_OUTLIER);
      parts.push('<ul>' + flags.outlierNames.map(function (n) {
        return '<li>' + escapeHtml(n) + '</li>';
      }).join('') + '</ul>');
    }
    if (flags.validCount > 0 && flags.validCount < 4) {
      parts.push('Only ' + flags.validCount + ' item' + (flags.validCount === 1 ? '' : 's') +
        ' uploaded. For a short list, Add Item on Ward or ICU Consumables may be simpler.');
    }
    const callout = g('upload-flags-callout');
    const body = g('upload-flags-body');
    if (!callout || !body) return;
    if (parts.length === 0) {
      callout.hidden = true;
      body.innerHTML = '';
      return;
    }
    body.innerHTML = parts.map(function (p) {
      return p.charAt(0) === '<' ? p : ('<p>' + p + '</p>');
    }).join('');
    callout.hidden = false;
  }

  function clearHospitalPendingFile() {
    pendingHospitalCsvText = null;
    pendingHospitalFilename = null;
    const fileEl = g('hospital-upload-filename');
    if (fileEl) fileEl.textContent = '';
  }

  function clearHospitalPasteFeedback() {
    if (hospitalPasteFeedbackTimer) {
      clearTimeout(hospitalPasteFeedbackTimer);
      hospitalPasteFeedbackTimer = null;
    }
    const wrap = g('hospital-upload-paste-feedback');
    const countEl = g('hospital-upload-paste-count');
    const table = g('hospital-upload-paste-preview');
    const moreEl = g('hospital-upload-paste-more');
    if (wrap) wrap.hidden = true;
    if (countEl) countEl.textContent = '';
    if (table) {
      table.hidden = true;
      const tbody = table.querySelector('tbody');
      if (tbody) tbody.innerHTML = '';
    }
    if (moreEl) {
      moreEl.hidden = true;
      moreEl.textContent = '';
    }
  }

  function updateHospitalPasteFeedback(text) {
    const wrap = g('hospital-upload-paste-feedback');
    const countEl = g('hospital-upload-paste-count');
    const table = g('hospital-upload-paste-preview');
    const moreEl = g('hospital-upload-paste-more');
    if (!wrap || !countEl || !table || !moreEl) return;

    const raw = String(text == null ? '' : text);
    if (raw.trim() === '') {
      clearHospitalPasteFeedback();
      return;
    }

    // Neutral days/beds (1,1): rate === quantity for preview display; rates are not shown.
    const flags = {
      unreadable: 0,
      blankName: 0,
      badQty: 0,
      duplicates: 0,
      outlierNames: [],
      validCount: 0
    };
    const items = parseHospitalCsv(raw, 1, 1, flags);
    wrap.hidden = false;

    if (items.length === 0) {
      countEl.textContent = 'No valid rows detected — check the format example.';
      table.hidden = true;
      const tbodyEmpty = table.querySelector('tbody');
      if (tbodyEmpty) tbodyEmpty.innerHTML = '';
      moreEl.hidden = true;
      moreEl.textContent = '';
      return;
    }

    const n = items.length;
    countEl.textContent = n + ' item' + (n === 1 ? '' : 's') + ' detected';

    const tbody = table.querySelector('tbody');
    if (tbody) {
      const preview = items.slice(0, 5);
      tbody.innerHTML = preview.map(function (item) {
        const qty = item.usagePerDayPerBed;
        const qtyText = Number.isFinite(qty)
          ? (Number.isInteger(qty) ? String(qty) : String(qty))
          : '';
        return '<tr><td>' + escapeHtml(item.name) + '</td><td>' + escapeHtml(qtyText) + '</td></tr>';
      }).join('');
    }
    table.hidden = false;

    if (n > 5) {
      moreEl.textContent = '…and ' + (n - 5) + ' more';
      moreEl.hidden = false;
    } else {
      moreEl.hidden = true;
      moreEl.textContent = '';
    }
  }

  function scheduleHospitalPasteFeedback(text) {
    if (hospitalPasteFeedbackTimer) clearTimeout(hospitalPasteFeedbackTimer);
    hospitalPasteFeedbackTimer = setTimeout(function () {
      hospitalPasteFeedbackTimer = null;
      updateHospitalPasteFeedback(text);
    }, 120);
  }

  function closeHospitalUploadDialog() {
    const dialog = g('hospital-upload-dialog');
    if (dialog) {
      dialog.hidden = true;
      dialog.setAttribute('aria-hidden', 'true');
    }
    const err = g('hospital-upload-error');
    if (err) {
      err.hidden = true;
      err.textContent = '';
    }
    const pasteEl = g('hospital-upload-paste');
    if (pasteEl) pasteEl.value = '';
    clearHospitalPendingFile();
    clearHospitalPasteFeedback();
    hospitalSourceReplaceBusy = false;
  }

  function openHospitalUploadDialog() {
    const dialog = g('hospital-upload-dialog');
    if (!dialog) return;
    const daysEl = g('hospital-upload-days');
    const bedsEl = g('hospital-upload-beds');
    const labelEl = g('hospital-upload-label');
    const pasteEl = g('hospital-upload-paste');
    const err = g('hospital-upload-error');
    if (daysEl) daysEl.value = '';
    if (bedsEl) bedsEl.value = '';
    if (labelEl) labelEl.value = hospitalListLabel || DEFAULT_HOSPITAL_LABEL;
    if (pasteEl) pasteEl.value = '';
    clearHospitalPendingFile();
    clearHospitalPasteFeedback();
    if (err) {
      err.hidden = true;
      err.textContent = '';
    }
    syncHospitalButton();
    dialog.hidden = false;
    dialog.setAttribute('aria-hidden', 'false');
    if (pasteEl) pasteEl.focus();
  }

  function downloadHospitalCsvTemplate() {
    downloadTextFile(HOSPITAL_CSV_TEMPLATE, 'text/csv;charset=utf-8', 'consumables-hospital-template.csv');
    showFeedback('CSV template downloaded.', 'success');
  }

  function onHospitalUploadClick() {
    openHospitalUploadDialog();
  }

  function triggerHospitalFilePicker() {
    const input = document.getElementById('cons-hospital-file-input');
    if (!input) return;
    input.value = '';
    input.click();
  }

  async function onHospitalFileBtnClick() {
    const pasteEl = g('hospital-upload-paste');
    if (pasteEl && String(pasteEl.value || '').trim() !== '') {
      if (!(await shellConfirm(MSG_HOSPITAL_REPLACE_PASTE_WITH_FILE))) return;
      pasteEl.value = '';
      clearHospitalPasteFeedback();
    }
    triggerHospitalFilePicker();
  }

  function onHospitalFileSelected(ev) {
    const file = ev.target && ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      const pasteEl = g('hospital-upload-paste');
      if (pasteEl) pasteEl.value = '';
      clearHospitalPasteFeedback();
      pendingHospitalCsvText = String(reader.result || '');
      pendingHospitalFilename = file.name || 'hospital-data.csv';
      const fileEl = g('hospital-upload-filename');
      if (fileEl) fileEl.textContent = 'File: ' + pendingHospitalFilename;
      const err = g('hospital-upload-error');
      if (err) {
        err.hidden = true;
        err.textContent = '';
      }
    };
    reader.onerror = function () {
      showFeedback('Could not read that CSV file.', 'error');
      clearHospitalPendingFile();
    };
    reader.readAsText(file);
    if (ev.target) ev.target.value = '';
  }

  async function onHospitalPasteInput(ev) {
    const el = ev.target;
    if (!el) return;
    if (pendingHospitalCsvText != null) {
      if (hospitalSourceReplaceBusy) return;
      const attempted = el.value;
      if (String(attempted || '').trim() === '') {
        scheduleHospitalPasteFeedback(el.value);
        return;
      }
      hospitalSourceReplaceBusy = true;
      const ok = await shellConfirm(MSG_HOSPITAL_REPLACE_FILE_WITH_PASTE);
      if (ok) {
        clearHospitalPendingFile();
      } else {
        el.value = '';
      }
      hospitalSourceReplaceBusy = false;
    }
    scheduleHospitalPasteFeedback(el.value);
  }

  function confirmHospitalUpload() {
    const daysEl = g('hospital-upload-days');
    const bedsEl = g('hospital-upload-beds');
    const labelEl = g('hospital-upload-label');
    const pasteEl = g('hospital-upload-paste');
    const err = g('hospital-upload-error');
    const days = daysEl ? Number(daysEl.value) : NaN;
    const beds = bedsEl ? Number(bedsEl.value) : NaN;
    if (!Number.isFinite(days) || days <= 0 || !Number.isFinite(beds) || beds <= 0) {
      if (err) {
        err.textContent = MSG_HOSPITAL_UPLOAD_DAYS_BEDS;
        err.hidden = false;
      }
      return;
    }
    if (err) {
      err.hidden = true;
      err.textContent = '';
    }
    const pasteText = pasteEl ? String(pasteEl.value || '') : '';
    const hasPaste = pasteText.trim() !== '';
    const hasFile = pendingHospitalCsvText != null;
    if (!hasPaste && !hasFile) {
      if (err) {
        err.textContent = MSG_HOSPITAL_NEED_SOURCE;
        err.hidden = false;
      }
      return;
    }
    const sourceText = hasPaste ? pasteText : pendingHospitalCsvText;
    const provenanceFilename = hasPaste ? '' : (pendingHospitalFilename || '');
    const flags = {
      unreadable: 0,
      blankName: 0,
      badQty: 0,
      duplicates: 0,
      outlierNames: [],
      validCount: 0
    };
    const items = parseHospitalCsv(sourceText, days, beds, flags);
    if (items.length === 0) {
      if (err) {
        err.textContent = 'No valid rows found in the CSV.';
        err.hidden = false;
      }
      return;
    }
    const label = sanitizeListLabel(
      labelEl ? labelEl.value : DEFAULT_HOSPITAL_LABEL,
      DEFAULT_HOSPITAL_LABEL,
      RESERVED_LIST_LABELS
    );
    const provenance = {
      uploadedAt: new Date().toISOString(),
      sourceDays: days,
      sourceBeds: beds,
      originalFilename: provenanceFilename
    };
    closeHospitalUploadDialog();
    applyHospitalList(items, label, provenance, flags);
  }

  function applyHospitalList(items, label, provenance, flags) {
    hospitalItemsCache = JSON.parse(JSON.stringify(items));
    hospitalListLabel = label || DEFAULT_HOSPITAL_LABEL;
    uploadProvenance = provenance || null;
    allConsumables = JSON.parse(JSON.stringify(hospitalItemsCache));
    filteredConsumables = allConsumables.slice();
    currentFileName = hospitalListLabel;
    currentListType = 'hospital';
    clearViewFilters();
    setListButtonActive('hospital');
    syncHospitalButton();
    setSortToUcdSourceOrder();
    filterItems();
    calculateAndDisplay();
    saveData();
    scenarioLoadGuardDirty = false;
    if (flags) showUploadFlags(flags);
    showFeedback('Hospital list loaded (' + allConsumables.length + ' items).', 'success');
  }

  function loadHospitalList() {
    if (!hospitalItemsCache || hospitalItemsCache.length === 0) {
      showFeedback('No hospital list uploaded yet.', 'info');
      return;
    }
    allConsumables = JSON.parse(JSON.stringify(hospitalItemsCache));
    filteredConsumables = allConsumables.slice();
    currentFileName = hospitalListLabel || DEFAULT_HOSPITAL_LABEL;
    currentListType = 'hospital';
    clearViewFilters();
    setListButtonActive('hospital');
    syncHospitalButton();
    setSortToUcdSourceOrder();
    filterItems();
    calculateAndDisplay();
    saveData();
    scenarioLoadGuardDirty = false;
    dismissUploadFlags();
    showFeedback((currentFileName || 'Hospital list') + ' loaded', 'success');
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
    if (g('clear-autosave-btn')) g('clear-autosave-btn').addEventListener('click', restoreAutosavedState);
    if (g('clear-items-btn')) g('clear-items-btn').addEventListener('click', clearAllItems);
    if (g('ward-list-btn')) g('ward-list-btn').addEventListener('click', loadWardList);
    if (g('icu-list-btn')) g('icu-list-btn').addEventListener('click', loadICUList);
    if (g('hospital-list-btn')) g('hospital-list-btn').addEventListener('click', loadHospitalList);
    if (g('hospital-upload-btn')) g('hospital-upload-btn').addEventListener('click', onHospitalUploadClick);
    if (g('hospital-template-btn')) g('hospital-template-btn').addEventListener('click', downloadHospitalCsvTemplate);
    if (g('hospital-remove-btn')) g('hospital-remove-btn').addEventListener('click', removeHospitalList);
    if (g('hospital-upload-file-btn')) g('hospital-upload-file-btn').addEventListener('click', onHospitalFileBtnClick);
    const hospitalPasteEl = g('hospital-upload-paste');
    if (hospitalPasteEl) hospitalPasteEl.addEventListener('input', onHospitalPasteInput);
    const hospitalFileInput = document.getElementById('cons-hospital-file-input');
    if (hospitalFileInput) hospitalFileInput.addEventListener('change', onHospitalFileSelected);
    if (g('hospital-upload-confirm')) g('hospital-upload-confirm').addEventListener('click', confirmHospitalUpload);
    if (g('hospital-upload-cancel')) g('hospital-upload-cancel').addEventListener('click', closeHospitalUploadDialog);
    if (g('upload-flags-dismiss')) g('upload-flags-dismiss').addEventListener('click', dismissUploadFlags);
    const hospitalUploadDialog = g('hospital-upload-dialog');
    if (hospitalUploadDialog) {
      hospitalUploadDialog.addEventListener('click', function (e) {
        if (e.target === hospitalUploadDialog) closeHospitalUploadDialog();
      });
    }

    if (g('days')) {
      const daysEl = g('days');
      setupPlaceholderBehavior(daysEl);
      daysEl.addEventListener('input', function () {
        deploymentDays = sanitizeDays(parseFloat(this.value));
        calculateAndDisplay();
        notifyWorksheetChanged();
      });
      daysEl.addEventListener('blur', () => validateAndShow('days'));
    }
    if (g('beds')) {
      const bedsEl = g('beds');
      setupPlaceholderBehavior(bedsEl);
      bedsEl.addEventListener('input', function () {
        deploymentBeds = sanitizeBeds(parseFloat(this.value));
        calculateAndDisplay();
        notifyWorksheetChanged();
      });
      bedsEl.addEventListener('blur', () => validateAndShow('beds'));
    }
    if (g('buffer')) {
      const bufferEl = g('buffer');
      setupPlaceholderBehavior(bufferEl);
      bufferEl.addEventListener('input', function () {
        bufferPercentage = sanitizeBuffer(parseFloat(this.value));
        calculateAndDisplay();
        notifyWorksheetChanged();
      });
      bufferEl.addEventListener('blur', () => validateAndShow('buffer'));
    }
    const scenarioNameEl = g('scenario-name');
    const scenarioNotesEl = g('scenario-notes');
    if (scenarioNameEl) {
      scenarioNameEl.addEventListener('input', notifyWorksheetChanged);
      scenarioNameEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (scenarioNotesEl) {
      scenarioNotesEl.addEventListener('input', notifyWorksheetChanged);
      scenarioNotesEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (g('search')) {
      const searchEl = g('search');
      searchEl.addEventListener('input', function () {
        notifyWorksheetChanged();
        filterItems();
      });
      searchEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (g('min-qty-filter')) {
      const minEl = g('min-qty-filter');
      function onMinQtyFilterChange() {
        notifyWorksheetChanged();
        filterItems();
      }
      minEl.addEventListener('input', onMinQtyFilterChange);
      minEl.addEventListener('change', onMinQtyFilterChange);
      minEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (g('nonzero-only-filter')) {
      g('nonzero-only-filter').addEventListener('change', function () {
        notifyWorksheetChanged();
        filterItems();
      });
    }
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
    if (g('scenario-select')) g('scenario-select').addEventListener('change', syncScenarioSelectTitle);
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
      const helpROOT = document.getElementById('panel-consumables');
      const helpPopoverIdPrefix = 'cons-help-popover-';
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
          // Hover exclusivity: hide other unpinned popovers. Do not unpin/close a
          // different pinned popover (click path unpins via closeAllHelpPopovers(true);
          // hover must not silently steal a pin). If another is pinned, skip opening.
          let otherPinned = false;
          helpROOT.querySelectorAll('.help-popover').forEach(function (p) {
            if (p === pop) return;
            if (p.classList.contains('pinned')) {
              otherPinned = true;
              return;
            }
            p.hidden = true;
          });
          helpROOT.querySelectorAll('.help-icon').forEach(function (b) {
            if (b === btn) return;
            const otherPop = getPopoverForBtn(b);
            if (otherPop && otherPop.classList.contains('pinned')) return;
            b.setAttribute('aria-expanded', 'false');
            b.removeAttribute('aria-describedby');
          });
          if (otherPinned) return;
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
    const pop = document.getElementById('cons-help-popover-inventory');
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
        container.innerHTML = '<p class="empty-message">Load Ward Consumables or ICU Consumables above.</p>';
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
      const sourceOrder = getItemSourceOrder(item);
      html += `<tr data-source-order="${sourceOrder}">`;
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

  function getItemSourceOrder(item) {
    if (item && item.id != null && Number.isFinite(Number(item.id))) return Number(item.id);
    const idx = allConsumables.indexOf(item);
    return idx >= 0 ? 1000000 + idx : 2000000;
  }

  function getRowSourceOrder(row) {
    const v = row.getAttribute('data-source-order');
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 2000000;
  }

  /** After loading Ward/ICU consumables data, show rows in MSF/source order (session only — does not write cons-pseSort). */
  function setSortToUcdSourceOrder() {
    currentSortKey = 'source-asc';
    const sortSel = g('sort-equipment');
    if (sortSel) sortSel.value = 'source-asc';
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
      if (key === 'source-asc') return getRowSourceOrder(a) - getRowSourceOrder(b);
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
      notifyWorksheetChanged();
      const sortLabel = sel.selectedOptions && sel.selectedOptions[0] ? sel.selectedOptions[0].text : currentSortKey;
      showFeedback(`Sort: ${sortLabel}`, 'info');
    }
  }

  async function onConsumablesTableClick(event) {
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
    if (!(await shellConfirm(`Delete "${removedName}" from the list?`))) return;
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

  function acknowledge(suffixId, text) {
    const btn = g(suffixId);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = text;
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('btn-success');
    }, 1500);
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
    reader.onload = async () => {
      try {
        const issues = [];
        const data = JSON.parse(reader.result);
        if (data && (data.consumables || data.deploymentDays != null || data.deploymentBeds != null)) {
          if (!(await confirmImportIfDirty())) {
            if (ev.target) ev.target.value = '';
            return;
          }
          if (data.scenarioName != null || data.name != null) {
            const el = g('scenario-name');
            const resolvedName = resolveScenarioNameField(data);
            if (el && resolvedName != null) el.value = resolvedName;
          }
          if (data.scenarioNotes != null || data.notes != null) {
            const el = g('scenario-notes');
            const resolvedNotes = resolveScenarioNotesField(data);
            if (el && resolvedNotes != null) el.value = resolvedNotes;
          }
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
          const importedLabel = resolveListLabel(data);
          if (importedLabel) {
            currentFileName = importedLabel;
            currentListType = resolveListType(data);
          } else {
            currentFileName = null;
            currentListType = allConsumables.length > 0 ? 'custom' : null;
          }
          if (currentListType === 'hospital') {
            hospitalItemsCache = JSON.parse(JSON.stringify(allConsumables));
            hospitalListLabel = currentFileName || DEFAULT_HOSPITAL_LABEL;
            uploadProvenance = (data.uploadProvenance && typeof data.uploadProvenance === 'object')
              ? data.uploadProvenance
              : null;
            syncHospitalButton();
            setListButtonActive('hospital');
          } else {
            setListButtonActive(currentListType === 'ward' || currentListType === 'icu' ? currentListType : null);
            syncHospitalButton();
          }
          applyViewState(data);
          calculateAndDisplay();
          saveData();
          scenarioLoadGuardDirty = false;
          if (issues.length > 0) {
            downloadImportIssueReport(sourceFileName, issues);
            acknowledge('import-btn', `Imported (${issues.length} issue${issues.length === 1 ? '' : 's'})`);
          } else {
            acknowledge('import-btn', 'Imported!');
          }
        } else {
          acknowledge('import-btn', 'Invalid file');
        }
      } catch (e) {
        acknowledge('import-btn', 'Invalid file');
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
    if (currentListType === 'hospital') rememberHospitalFromWorksheet();
    return {
      schemaVersion: SCHEMA_VERSION,
      scenarioName: (nameEl && nameEl.value.trim()) || '',
      scenarioNotes: notesEl ? notesEl.value.trim() : '',
      deploymentDays,
      deploymentBeds,
      bufferPercentage,
      consumables: allConsumables,
      listLabel: currentFileName,
      fileName: currentFileName,
      listType: currentListType,
      uploadProvenance: currentListType === 'hospital' ? uploadProvenance : null,
      viewState: captureViewState(),
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
      showFeedback('No data to print. Please load Ward Consumables or ICU Consumables first.', 'info');
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

  async function saveScenario() {
    if (allConsumables.length === 0) {
      showFeedback('No data to save. Please load Ward Consumables or ICU Consumables first.', 'info');
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
      const promptedName = await shellPrompt('Enter a scenario name:');
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

    if (currentListType === 'hospital') rememberHospitalFromWorksheet();

    const scenario = {
      id: Date.now().toString(),
      name,
      baseName,
      notes,
      schemaVersion: SCHEMA_VERSION,
      scenarioName: baseName,
      scenarioNotes: notes,
      deploymentDays,
      deploymentBeds,
      bufferPercentage,
      consumables: allConsumables,
      listLabel: currentFileName,
      fileName: currentFileName,
      listType: currentListType,
      uploadProvenance: currentListType === 'hospital' ? uploadProvenance : null,
      viewState: captureViewState(),
      timestamp: now.toISOString()
    };

    const scenarios = getSavedScenarios();
    const existingIndex = scenarios.findIndex(s => s.baseName === baseName);
    if (existingIndex >= 0) {
      if (!(await shellConfirm(`A scenario named "${baseName}" already exists. Overwrite it?`))) return;
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
    scenarioLoadGuardDirty = false;
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

  function syncScenarioSelectTitle() {
    const select = g('scenario-select');
    if (!select) return;
    const opt = select.selectedOptions && select.selectedOptions[0];
    const text = opt ? String(opt.textContent || '').trim() : '';
    select.title = text;
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
    syncScenarioSelectTitle();
  }

  async function loadSelectedScenario() {
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

    if (!(await confirmOverwriteIfDirty())) return;

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
    const loadedLabel = resolveListLabel(scenario);
    if (loadedLabel) {
      currentFileName = loadedLabel;
      currentListType = resolveListType(scenario);
    } else {
      currentFileName = null;
      currentListType = allConsumables.length > 0 ? 'custom' : null;
    }

    if (currentListType === 'hospital') {
      hospitalItemsCache = JSON.parse(JSON.stringify(allConsumables));
      hospitalListLabel = currentFileName || DEFAULT_HOSPITAL_LABEL;
      uploadProvenance = (scenario.uploadProvenance && typeof scenario.uploadProvenance === 'object')
        ? scenario.uploadProvenance
        : null;
      syncHospitalButton();
      setListButtonActive('hospital');
    } else {
      setListButtonActive(currentListType === 'ward' || currentListType === 'icu' ? currentListType : null);
      syncHospitalButton();
    }

    const nameEl = g('scenario-name');
    const notesEl = g('scenario-notes');
    if (nameEl) {
      if (scenario.baseName) nameEl.value = scenario.baseName;
      else {
        const resolvedName = resolveScenarioNameField(scenario);
        nameEl.value = (resolvedName != null) ? resolvedName : (scenario.name || '');
      }
    }
    if (notesEl) {
      const resolvedNotes = resolveScenarioNotesField(scenario);
      notesEl.value = (resolvedNotes != null) ? resolvedNotes : '';
    }
    updateSavedDisplay(scenario.timestamp || null);
    applyViewState(scenario);
    calculateAndDisplay();
    saveData();
    scenarioLoadGuardDirty = false;
    acknowledge('load-btn', 'Loaded!');
  }

  async function deleteSelectedScenario() {
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
    if (!(await shellConfirm(`Are you sure you want to delete "${scenario.name}"?`))) return;
    const updated = scenarios.filter(s => s.id !== scenarioId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save scenarios:', e);
      showFeedback('Could not delete scenario. Storage may be full.', 'error');
      return;
    }
    updateScenarioDropdown();
    showFeedback(`Scenario "${scenario.name}" deleted successfully!`, 'success');
  }

  async function clearAllScenarios() {
    const scenarios = getSavedScenarios();
    if (scenarios.length === 0) {
      showFeedback('No scenarios to clear.', 'info');
      return;
    }
    if (!(await shellConfirm(`Are you sure you want to delete all ${scenarios.length} saved scenarios? This cannot be undone.`))) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    updateScenarioDropdown();
    updateSavedDisplay(null);
    showFeedback('All scenarios cleared successfully!', 'success');
  }

  const LAST_SAVED_KEY = 'cons-pseLastSaved';

  function updateAutosaveTimestampDisplay(tsIsoString) {
    const el = document.getElementById('cons-last-saved');
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
      autosaveTimerId = setInterval(() => {
        if (consAutosaveDirty) saveData();
      }, AUTOSAVE_INTERVAL_MS);
    } catch (e) { /* ignore */ }
  }

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    const host = document.getElementById('panel-consumables');
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
      if (currentListType === 'hospital') rememberHospitalFromWorksheet();
      localStorage.setItem(STORAGE_BUFFER, bufferPercentage);
      localStorage.setItem(STORAGE_DAYS, String(deploymentDays));
      localStorage.setItem(STORAGE_BEDS, String(deploymentBeds));
      const nameEl = g('scenario-name');
      const notesEl = g('scenario-notes');
      localStorage.setItem(STORAGE_SCENARIO_NAME, (nameEl && nameEl.value) ? nameEl.value : '');
      localStorage.setItem(STORAGE_SCENARIO_NOTES, (notesEl && notesEl.value) ? notesEl.value : '');
      const viewState = captureViewState();
      localStorage.setItem(STORAGE_VIEW_STATE, JSON.stringify(viewState));
      localStorage.setItem(STORAGE_SCHEMA_VERSION, String(SCHEMA_VERSION));
      // Dual-write legacy filter keys for v0 readers / suite key list continuity.
      localStorage.setItem(STORAGE_SEARCH, viewState.search || '');
      localStorage.setItem(STORAGE_MIN_QTY_FILTER, viewState.minQtyFilter || '');
      localStorage.setItem(STORAGE_NONZERO_ONLY, viewState.nonZeroOnly ? '1' : '0');
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
      if (currentListType) {
        localStorage.setItem(STORAGE_LIST_TYPE, currentListType);
      } else {
        localStorage.removeItem(STORAGE_LIST_TYPE);
      }
      if (hospitalItemsCache && hospitalItemsCache.length > 0) {
        localStorage.setItem(STORAGE_HOSPITAL_ITEMS, JSON.stringify(hospitalItemsCache));
        localStorage.setItem(STORAGE_HOSPITAL_LABEL, hospitalListLabel || DEFAULT_HOSPITAL_LABEL);
        if (uploadProvenance) {
          localStorage.setItem(STORAGE_UPLOAD_PROVENANCE, JSON.stringify(uploadProvenance));
        } else {
          localStorage.removeItem(STORAGE_UPLOAD_PROVENANCE);
        }
      } else {
        localStorage.removeItem(STORAGE_HOSPITAL_ITEMS);
        localStorage.removeItem(STORAGE_HOSPITAL_LABEL);
        localStorage.removeItem(STORAGE_UPLOAD_PROVENANCE);
      }
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SAVED_KEY, now);
      updateAutosaveTimestampDisplay(now);
      consAutosaveDirty = false;
    } catch (e) {
      console.warn('Consumables autosave failed:', e);
      showToast('Could not autosave (storage may be full or blocked).', 'error', 4000);
    }
  }

  function tryAutosaveOnBlur() {
    if (consAutosaveDirty) saveData();
  }

  function loadSavedData() {
    const savedBuffer = localStorage.getItem(STORAGE_BUFFER);
    const savedDays = localStorage.getItem(STORAGE_DAYS);
    const savedBeds = localStorage.getItem(STORAGE_BEDS);
    const savedConsumables = localStorage.getItem(STORAGE_CONSUMABLES);
    const savedFileName = localStorage.getItem(STORAGE_FILENAME);
    const savedListType = localStorage.getItem(STORAGE_LIST_TYPE);
    const savedScenarioName = localStorage.getItem(STORAGE_SCENARIO_NAME);
    const savedScenarioNotes = localStorage.getItem(STORAGE_SCENARIO_NOTES);
    const savedViewStateRaw = localStorage.getItem(STORAGE_VIEW_STATE);
    const savedSearch = localStorage.getItem(STORAGE_SEARCH);
    const savedMinQtyFilter = localStorage.getItem(STORAGE_MIN_QTY_FILTER);
    const savedNonzeroOnly = localStorage.getItem(STORAGE_NONZERO_ONLY);

    const de = g('days');
    const be = g('beds');
    const bu = g('buffer');
    const nameEl = g('scenario-name');
    const notesEl = g('scenario-notes');

    if (nameEl) nameEl.value = (savedScenarioName != null) ? savedScenarioName : '';
    if (notesEl) notesEl.value = (savedScenarioNotes != null) ? savedScenarioNotes : '';

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
    } else {
      currentFileName = null;
    }
    if (savedListType === 'ward' || savedListType === 'icu' || savedListType === 'hospital' || savedListType === 'custom') {
      currentListType = savedListType;
    } else if (savedFileName) {
      currentListType = listTypeFromFileName(savedFileName);
    } else {
      currentListType = allConsumables.length > 0 ? 'custom' : null;
    }

    restoreHospitalCacheFromStorage();
    if (currentListType === 'hospital' && allConsumables.length > 0) {
      hospitalItemsCache = JSON.parse(JSON.stringify(allConsumables));
      hospitalListLabel = currentFileName || hospitalListLabel || DEFAULT_HOSPITAL_LABEL;
    }
    syncHospitalButton();
    setListButtonActive(
      currentListType === 'ward' || currentListType === 'icu' || currentListType === 'hospital'
        ? currentListType
        : null
    );

    let viewStateApplied = false;
    if (savedViewStateRaw) {
      try {
        const parsedView = JSON.parse(savedViewStateRaw);
        applyViewState({ viewState: parsedView });
        viewStateApplied = true;
      } catch (e) { /* fall through to legacy keys */ }
    }
    if (!viewStateApplied) {
      applyViewState({
        viewState: {
          search: (savedSearch != null) ? savedSearch : '',
          minQtyFilter: (savedMinQtyFilter != null) ? savedMinQtyFilter : '',
          nonZeroOnly: savedNonzeroOnly === '1'
        }
      }, { preserveSort: true });
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
    consAutosaveDirty = false;
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

  async function clearAllItems() {
    if (allConsumables.length === 0) {
      showFeedback('No items to clear.', 'info');
      return;
    }
    if (!(await shellConfirm(`Are you sure you want to clear all ${allConsumables.length} items?`))) return;

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

    setListButtonActive(null);
    syncHospitalButton();
    dismissUploadFlags();
    clearViewFilters();

    filterItems();
    calculateAndDisplay();
    if (debouncedAutosaveTimeout) { clearTimeout(debouncedAutosaveTimeout); debouncedAutosaveTimeout = null; }
    consAutosaveDirty = false;
    scenarioLoadGuardDirty = false;
    showFeedback('All items cleared successfully!', 'success');
  }

  function loadWardList() {
    if (typeof UCD_WARD_ITEMS === 'undefined' || !UCD_WARD_ITEMS.length) {
      showFeedback('Ward Consumables list is not available.', 'error');
      return;
    }
    allConsumables = JSON.parse(JSON.stringify(UCD_WARD_ITEMS));
    filteredConsumables = allConsumables.slice();
    currentFileName = 'Ward Consumables';
    currentListType = 'ward';

    clearViewFilters();
    setListButtonActive('ward');

    setSortToUcdSourceOrder();
    filterItems();
    saveData();
    scenarioLoadGuardDirty = false;
    dismissUploadFlags();
    showFeedback('Ward Consumables loaded', 'success');
  }

  function loadICUList() {
    if (typeof UCD_ICU_ITEMS === 'undefined' || !UCD_ICU_ITEMS.length) {
      showFeedback('ICU Consumables list is not available.', 'error');
      return;
    }
    allConsumables = JSON.parse(JSON.stringify(UCD_ICU_ITEMS));
    filteredConsumables = allConsumables.slice();
    currentFileName = 'ICU Consumables';
    currentListType = 'icu';

    clearViewFilters();
    setListButtonActive('icu');

    setSortToUcdSourceOrder();
    filterItems();
    saveData();
    scenarioLoadGuardDirty = false;
    dismissUploadFlags();
    showFeedback('ICU Consumables loaded', 'success');
  }

  function init() {
    const sortSel = g('sort-equipment');
    const validSorts = ['source-asc', 'name-asc', 'name-desc', 'qty-desc', 'qty-asc'];
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      if (saved && validSorts.includes(saved)) {
        currentSortKey = saved;
        if (sortSel) sortSel.value = saved;
      } else {
        currentSortKey = 'source-asc';
        if (sortSel) sortSel.value = 'source-asc';
      }
    } catch (e) {
      currentSortKey = 'source-asc';
      if (sortSel) sortSel.value = 'source-asc';
    }
    setupEventListeners();
    restoreHospitalCacheFromStorage();
    syncHospitalButton();
    setListButtonActive(null);
    consAutosaveDirty = false;
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
