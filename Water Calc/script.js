/**
 * Water Requirements Calculator - Per bed/per day demand, wastewater, bladder schedule
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'fieldHospitalWaterScenarios';
  const WATER_AUTOSAVE_KEY = 'fieldHospitalWaterAutosave';
  const LAST_SAVED_KEY = 'fieldHospitalWaterLastSaved';
  const L_PER_GAL = 3.78541;
  const baseLiterValues = { potable: 80, wastewater: 65 };
  const GRAY_RATIO = 0.77; // Estimated ~77% gray water, ~23% black water

  function g(id) {
    const fullId = (id && id.startsWith('water-')) ? id : 'water-' + (id || '');
    return document.getElementById(fullId);
  }

  function getNum(el, def) {
    if (!el) return def;
    const v = parseFloat(el.value);
    return isNaN(v) ? def : Math.max(0, v);
  }

  // Validation rules
  const VALIDATION_RULES = {
    'water-days': { min: 0, max: 3650, message: 'Days must be between 0 and 3650 (10 years)' },
    'water-beds': { min: 0, max: 10000, message: 'Beds must be between 0 and 10,000' },
    'water-buffer': { min: 0, max: 100, message: 'Buffer must be between 0% and 100%' },
    'water-potable-rate': { min: 0, max: 10000, message: 'Rate must be between 0 and 10,000' },
    'water-wastewater-rate': { min: 0, max: 10000, message: 'Rate must be between 0 and 10,000' },
    'water-potable-count': { min: 0, max: 1000, integer: true, message: 'Count must be a whole number between 0 and 1,000' },
    'water-potable-capacity': { min: 0, max: 1000000, message: 'Capacity must be between 0 and 1,000,000' },
    'water-wastewater-count': { min: 0, max: 1000, integer: true, message: 'Count must be a whole number between 0 and 1,000' },
    'water-wastewater-capacity': { min: 0, max: 1000000, message: 'Capacity must be between 0 and 1,000,000' },
    'water-mains-flow-rate': { min: 0, max: 1000000, message: 'Flow rate must be 0 or greater' }
  };

  function validateInput(inputId) {
    const input = g(inputId);
    if (!input) return { valid: true };
    const rule = VALIDATION_RULES[inputId];
    if (!rule) return { valid: true };

    const value = input.value.trim();
    if (value === '' || value === null) {
      return { valid: true }; // Empty is OK, will use default
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, message: 'Please enter a valid number' };
    }

    if (rule.integer && !Number.isInteger(num)) {
      return { valid: false, message: rule.message };
    }

    if (num < rule.min || num > rule.max) {
      return { valid: false, message: rule.message };
    }

    return { valid: true };
  }

  function showValidationError(inputId, message) {
    const input = g(inputId);
    if (!input) return;
    input.classList.add('input-error');
    const paramGroup = input.closest('.param-group');
    if (paramGroup) {
      let errorEl = paramGroup.querySelector('.validation-error');
      if (!errorEl) {
        errorEl = document.createElement('small');
        errorEl.className = 'validation-error';
        paramGroup.appendChild(errorEl);
      }
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function clearValidationError(inputId) {
    const input = g(inputId);
    if (!input) return;
    input.classList.remove('input-error');
    const paramGroup = input.closest('.param-group');
    if (paramGroup) {
      const errorEl = paramGroup.querySelector('.validation-error');
      if (errorEl) errorEl.style.display = 'none';
    }
  }

  function validateAndShow(inputId) {
    const result = validateInput(inputId);
    if (result.valid) {
      clearValidationError(inputId);
    } else {
      showValidationError(inputId, result.message);
    }
    return result.valid;
  }

  function isGallons() {
    const radio = document.querySelector('input[name="water-unit"]:checked');
    return radio && radio.value === 'G';
  }

  function getPotableSupplyMode() {
    const el = g('water-potable-supply-mode');
    return el ? el.value : 'self';
  }

  function getWastewaterDisposalMode() {
    const el = g('water-wastewater-disposal-mode');
    return el ? el.value : 'containers';
  }

  function updateSupplyModeUI() {
    const potableMode = getPotableSupplyMode();
    const mainsFlowSection = g('water-mains-flow-section');
    if (mainsFlowSection) {
      mainsFlowSection.style.display =
        (potableMode === 'mains' || potableMode === 'hybrid') ? 'grid' : 'none';
    }
  }

  function updateUnitLabels() {
    const unit = isGallons() ? 'G' : 'L';
    const waterSpans = document.querySelectorAll('.water-unit');
    waterSpans.forEach(span => span.textContent = unit);
    const bladderSpans = document.querySelectorAll('.bladder-capacity-unit');
    bladderSpans.forEach(span => span.textContent = unit);
    const resultSpans = document.querySelectorAll('.result-unit');
    resultSpans.forEach(span => span.textContent = unit);
  }

  function getState() {
    let days = getNum(g('water-days'), 0);
    let beds = getNum(g('water-beds'), 0);
    let buffer = getNum(g('water-buffer'), 0) / 100;
    let potableRate = getNum(g('water-potable-rate'), 80);
    let wastewaterRate = getNum(g('water-wastewater-rate'), 65);
    if (isGallons()) {
      potableRate *= L_PER_GAL;
      wastewaterRate *= L_PER_GAL;
    }
    const potableCount = getNum(g('water-potable-count'), 0);
    const potableCap = getNum(g('water-potable-capacity'), 0);
    const wastewaterCount = getNum(g('water-wastewater-count'), 0);
    const wastewaterCap = getNum(g('water-wastewater-capacity'), 0);
    const mainsFlowVal = getNum(g('water-mains-flow-rate'), 0);
    const mainsFlowLhr = isGallons() ? mainsFlowVal * L_PER_GAL : mainsFlowVal;

    return {
      days,
      beds,
      bufferPercent: buffer * 100,
      waterUnit: isGallons() ? 'G' : 'L',
      scenarioName: g('water-scenario-name') ? g('water-scenario-name').value : '',
      scenarioNotes: g('water-scenario-notes') ? g('water-scenario-notes').value : '',
      potablePerBedPerDay: potableRate,
      wastewaterPerBedPerDay: wastewaterRate,
      potableContainerCount: potableCount,
      potableContainerCapacity: potableCap,
      wastewaterContainerCount: wastewaterCount,
      wastewaterContainerCapacity: wastewaterCap,
      potableSupplyMode: getPotableSupplyMode(),
      wastewaterDisposalMode: getWastewaterDisposalMode(),
      mainsFlowRate: mainsFlowLhr
    };
  }

  function applyState(s) {
    if (!s) return;
    // Clear any existing validation errors
    Object.keys(VALIDATION_RULES).forEach(id => clearValidationError(id));
    
    if (g('water-days')) g('water-days').value = s.days != null ? s.days : 0;
    if (g('water-beds')) g('water-beds').value = s.beds != null ? s.beds : 0;
    if (g('water-buffer')) g('water-buffer').value = s.bufferPercent != null ? s.bufferPercent : 0;
    if (g('water-scenario-name')) g('water-scenario-name').value = s.scenarioName != null ? s.scenarioName : '';
    if (g('water-scenario-notes')) g('water-scenario-notes').value = s.scenarioNotes != null ? s.scenarioNotes : '';
    const unit = (s.waterUnit === 'G') ? 'G' : 'L';
    const radioGal = document.querySelector('input[name="water-unit"][value="G"]');
    const radioL = document.querySelector('input[name="water-unit"][value="L"]');
    if (radioGal && radioL) {
      if (unit === 'G') radioGal.checked = true; else radioL.checked = true;
    }
    const potableL = s.potablePerBedPerDay != null ? s.potablePerBedPerDay : 80;
    const wastewaterL = s.wastewaterPerBedPerDay != null ? s.wastewaterPerBedPerDay : (s.grayWaterPerBedPerDay != null && s.blackWaterPerBedPerDay != null ? (s.grayWaterPerBedPerDay + s.blackWaterPerBedPerDay) : 65);
    // Store liter values
    baseLiterValues.potable = potableL;
    baseLiterValues.wastewater = wastewaterL;
    // Display based on unit
    if (g('water-potable-rate')) g('water-potable-rate').value = unit === 'G' ? Math.ceil(potableL / L_PER_GAL) : potableL;
    if (g('water-wastewater-rate')) g('water-wastewater-rate').value = unit === 'G' ? Math.ceil(wastewaterL / L_PER_GAL) : wastewaterL;
    updateUnitLabels();
    if (g('water-potable-count')) g('water-potable-count').value = s.potableContainerCount ?? s.potableBladderCount ?? 0;
    if (g('water-potable-capacity')) g('water-potable-capacity').value = s.potableContainerCapacity ?? s.potableBladderCapacity ?? 0;
    if (g('water-wastewater-count')) g('water-wastewater-count').value = s.wastewaterContainerCount ?? s.wastewaterBladderCount ?? s.grayBladderCount ?? 0;
    if (g('water-wastewater-capacity')) g('water-wastewater-capacity').value = s.wastewaterContainerCapacity ?? s.wastewaterBladderCapacity ?? s.grayBladderCapacity ?? 0;
    if (g('water-potable-supply-mode')) {
      g('water-potable-supply-mode').value = s.potableSupplyMode || 'self';
    }
    if (g('water-wastewater-disposal-mode')) {
      g('water-wastewater-disposal-mode').value = s.wastewaterDisposalMode || 'containers';
    }
    if (g('water-mains-flow-rate')) {
      const mainsFlowLhr = s.mainsFlowRate != null ? s.mainsFlowRate : 0;
      g('water-mains-flow-rate').value = isGallons() ? Math.round(mainsFlowLhr / L_PER_GAL) : mainsFlowLhr;
    }
    updateSupplyModeUI();
    updateBreakdown();
    
    // Validate loaded values
    Object.keys(VALIDATION_RULES).forEach(id => validateAndShow(id));
  }

  function onUnitChange() {
    const potableEl = g('water-potable-rate');
    const wastewaterEl = g('water-wastewater-rate');
    if (!potableEl || !wastewaterEl) return;
    const nowGal = isGallons();
    // Get current displayed values
    const p = getNum(potableEl, 0);
    const w = getNum(wastewaterEl, 0);
    
    if (nowGal) {
      // Switching TO gallons: current inputs are in liters, store them and display gallons (rounded up)
      baseLiterValues.potable = p;
      baseLiterValues.wastewater = w;
      potableEl.value = Math.ceil(baseLiterValues.potable / L_PER_GAL);
      wastewaterEl.value = Math.ceil(baseLiterValues.wastewater / L_PER_GAL);
    } else {
      // Switching TO liters: restore stored liter values (preserve original whole numbers)
      potableEl.value = baseLiterValues.potable;
      wastewaterEl.value = baseLiterValues.wastewater;
    }
    updateUnitLabels();
    updateBreakdown();
    notifyWorksheetChanged();
    recalc();
  }

  function formatNum(n) {
    if (n == null || isNaN(n)) return '—';
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
    return Math.round(n).toLocaleString();
  }

  function updateBreakdown() {
    const wastewaterEl = g('water-wastewater-rate');
    if (!wastewaterEl) return;
    let wastewater = getNum(wastewaterEl, 0);
    if (isGallons()) wastewater *= L_PER_GAL;
    const grayEst = Math.round(wastewater * GRAY_RATIO);
    const blackEst = Math.round(wastewater * (1 - GRAY_RATIO));
    const u = isGallons() ? ' G' : ' L';
    if (isGallons()) {
      setText('breakdown-gray', `${formatNum(Math.ceil(grayEst / L_PER_GAL))}${u}`);
      setText('breakdown-black', `${formatNum(Math.ceil(blackEst / L_PER_GAL))}${u}`);
    } else {
      setText('breakdown-gray', `${formatNum(grayEst)}${u}`);
      setText('breakdown-black', `${formatNum(blackEst)}${u}`);
    }
  }

  function recalc() {
    const st = getState();
    const { days, beds, bufferPercent } = st;
    const bufferBadgeContainer = g('buffer-badge-container');
    if (bufferBadgeContainer) {
      const pct = Number(bufferPercent);
      const showBadge = pct > 0 && Number.isFinite(pct);
      bufferBadgeContainer.innerHTML = showBadge
        ? '<div class="buffer-badge" role="status">Buffer: +' + Math.round(pct) + '% applied to all quantities</div>'
        : '';
    }
    const mult = 1 + (bufferPercent / 100);

    const potablePerDay = beds * st.potablePerBedPerDay;
    const wastewaterPerDay = beds * st.wastewaterPerBedPerDay;
    const potablePerDayBuffered = potablePerDay * mult;
    const wastewaterPerDayBuffered = wastewaterPerDay * mult;

    const totalPotable = days * potablePerDayBuffered;
    const totalWastewater = days * wastewaterPerDayBuffered;

    // Output totals and per-day
    setText('out-potable-total', formatNum(totalPotable));
    setText('out-potable-per-day', formatNum(potablePerDay));
    setText('out-wastewater-total', formatNum(totalWastewater));
    setText('out-wastewater-per-day', formatNum(wastewaterPerDay));

    const potableMode = getPotableSupplyMode();
    const wastewaterMode = getWastewaterDisposalMode();
    const potableStorage = st.potableContainerCount * st.potableContainerCapacity;
    const wastewaterStorage = st.wastewaterContainerCount * st.wastewaterContainerCapacity;

    // Show/hide result rows based on mode
    const deliveryRow = g('water-potable-delivery-row');
    const mainsRow = g('water-potable-mains-row');
    const bufferRow = g('water-potable-buffer-row');
    const pickupRow = g('water-wastewater-pickup-row');
    const wwMainsRow = g('water-wastewater-mains-row');
    const mainsStatusEl = g('water-out-mains-status');
    const showMains = potableMode === 'mains' || potableMode === 'hybrid';
    if (deliveryRow) deliveryRow.style.display = showMains && potableMode !== 'hybrid' ? 'none' : '';
    if (mainsRow) mainsRow.style.display = showMains ? '' : 'none';
    if (bufferRow) bufferRow.style.display = showMains ? '' : 'none';
    if (pickupRow) pickupRow.style.display = wastewaterMode === 'mains' ? 'none' : '';
    if (wwMainsRow) wwMainsRow.style.display = wastewaterMode === 'mains' ? '' : 'none';
    if (mainsStatusEl) {
      mainsStatusEl.classList.remove('mains-status-ok', 'mains-status-warn', 'mains-status-danger');
    }

    // Potable: self-supplied or hybrid container side (uses buffered daily demand)
    if (potableMode === 'self' || potableMode === 'hybrid') {
      let potableDeliveries = '—';
      if (days <= 0 || beds <= 0) {
        potableDeliveries = 'Enter deployment length and number of beds';
      } else if (potableStorage > 0 && potablePerDayBuffered > 0) {
        const daysPerDelivery = potableStorage / potablePerDayBuffered;
        const deliveriesNeeded = Math.ceil(days / daysPerDelivery);
        potableDeliveries = `~${deliveriesNeeded} over deployment (every ~${Math.round(daysPerDelivery)} days)`;
      } else if (potableStorage > 0) {
        potableDeliveries = 'No daily demand entered';
      } else {
        potableDeliveries = potableMode === 'hybrid' ? 'Enter backup container count & capacity' : 'Enter container count & capacity';
      }
      setText('out-potable-deliveries', potableDeliveries);
    }

    // Potable: mains adequacy check
    if (showMains) {
      const mainsFlowLhr = st.mainsFlowRate || 0;
      const peakDemandLhr = potablePerDay / 16;
      const displayFlow = isGallons()
        ? Math.round(mainsFlowLhr / L_PER_GAL) + ' Gal/hr'
        : Math.round(mainsFlowLhr) + ' L/hr';
      let mainsStatus = '—';
      let mainsClass = '';
      if (mainsFlowLhr <= 0) {
        mainsStatus = 'Enter mains flow rate above';
      } else if (potablePerDay <= 0) {
        mainsStatus = 'Enter beds and daily rate to check';
      } else if (mainsFlowLhr >= peakDemandLhr * 1.25) {
        const peakDisp = isGallons() ? Math.round(peakDemandLhr / L_PER_GAL) : Math.round(peakDemandLhr);
        mainsStatus = `✓ Adequate (${displayFlow} supply vs. ${peakDisp} ${isGallons() ? 'Gal' : 'L'}/hr peak demand)`;
        mainsClass = 'mains-status-ok';
      } else if (mainsFlowLhr >= peakDemandLhr) {
        mainsStatus = `⚠ Marginal (${displayFlow} supply — limited safety margin)`;
        mainsClass = 'mains-status-warn';
      } else {
        const peakDisp = isGallons() ? Math.round(peakDemandLhr / L_PER_GAL) : Math.round(peakDemandLhr);
        mainsStatus = `✗ Insufficient (${displayFlow} supply cannot meet ${peakDisp} ${isGallons() ? 'Gal' : 'L'}/hr peak demand)`;
        mainsClass = 'mains-status-danger';
      }
      setText('out-mains-status', mainsStatus);
      if (mainsStatusEl && mainsClass) mainsStatusEl.classList.add(mainsClass);
      const bufferL = potablePerDay * 2;
      const bufferDisplay = isGallons()
        ? Math.ceil(bufferL / L_PER_GAL).toLocaleString()
        : Math.round(bufferL).toLocaleString();
      setText('out-potable-buffer', bufferL > 0 ? bufferDisplay + ' (for 48 hours if mains supply is interrupted)' : '—');
      document.querySelectorAll('.result-unit').forEach(span => { span.textContent = isGallons() ? 'Gal' : 'L'; });
    }

    // Wastewater: container collection (uses buffered daily output)
    if (wastewaterMode === 'containers') {
      let wastewaterPickups = '—';
      if (days > 0 && beds > 0) {
        if (wastewaterStorage > 0 && wastewaterPerDayBuffered > 0) {
          const daysPerFill = wastewaterStorage / wastewaterPerDayBuffered;
          const pickupsNeeded = Math.ceil(days / daysPerFill);
          wastewaterPickups = `~${pickupsNeeded} over deployment (every ~${Math.round(daysPerFill)} days)`;
        } else if (wastewaterStorage > 0) {
          wastewaterPickups = 'No wastewater output entered';
        } else {
          wastewaterPickups = 'Enter container count & capacity';
        }
      } else {
        wastewaterPickups = 'Enter deployment length and number of beds';
      }
      setText('out-wastewater-pickups', wastewaterPickups);
    }

    const note = g('water-schedule-note');
    if (note) {
      const parts = [];
      if (potableMode === 'self' || potableMode === 'hybrid') {
        parts.push('Delivery intervals are estimates based on container capacity and daily demand.');
      }
      if (potableMode === 'mains' || potableMode === 'hybrid') {
        parts.push('Mains adequacy check assumes 16 operating hours/day peak demand. Confirm flow rate with site survey or supply authority.');
      }
      if (wastewaterMode === 'containers') {
        parts.push('Pickup intervals are estimates based on container capacity and daily output.');
      }
      parts.push('Plan for safety margin and logistics.');
      note.textContent = parts.join(' ');
      note.style.display = 'block';
    }
    updateBreakdown();
  }

  function setText(id, text) {
    const el = g(id);
    if (el) el.textContent = text;
  }

  function getSavedScenarios() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedScenarios(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save scenarios:', e);
    }
  }

  function updateAutosaveTimestampDisplay(tsIsoString) {
    const el = document.getElementById('water-last-saved');
    if (!el) return;
    if (!tsIsoString || typeof tsIsoString !== 'string') {
      el.textContent = '';
      return;
    }
    try {
      const date = new Date(tsIsoString);
      el.textContent = isNaN(date.getTime()) ? '' : 'Worksheet autosaved: ' + date.toLocaleString();
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
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) container.remove();
      }, 300);
    }, duration);
  }

  const AUTOSAVE_INTERVAL_MS = 60 * 1000;
  const DEBOUNCED_AUTOSAVE_MS = 3 * 1000;
  let autosaveTimerId = null;
  let debouncedAutosaveTimeout = null;
  /** Only true after user edits; avoids overwriting prior autosave on open (defaults + initial recalc). */
  let waterAutosaveDirty = false;
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
    markScenarioListStaleIfNeeded();
    waterAutosaveDirty = true;
    scenarioLoadGuardDirty = true;
    scheduleDebouncedAutosave();
  }

  function scheduleDebouncedAutosave() {
    if (!waterAutosaveDirty) return;
    if (debouncedAutosaveTimeout) clearTimeout(debouncedAutosaveTimeout);
    debouncedAutosaveTimeout = setTimeout(() => {
      debouncedAutosaveTimeout = null;
      saveWorksheetState();
    }, DEBOUNCED_AUTOSAVE_MS);
  }

  function startAutosaveTimer() {
    if (autosaveTimerId != null) return;
    try {
      autosaveTimerId = setInterval(() => {
        if (waterAutosaveDirty) saveWorksheetState();
      }, AUTOSAVE_INTERVAL_MS);
    } catch (e) { /* ignore */ }
  }

  function saveWorksheetState() {
    try {
      localStorage.setItem(WATER_AUTOSAVE_KEY, JSON.stringify(getState()));
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SAVED_KEY, now);
      updateAutosaveTimestampDisplay(now);
      waterAutosaveDirty = false;
      return true;
    } catch (e) {
      console.warn('Water autosave failed:', e);
      showToast('Could not autosave (storage may be full or blocked).', 'error', 4000);
      return false;
    }
  }

  /** After editing a field, blur saves immediately so reload doesn’t lose work before debounce. */
  function tryAutosaveOnBlur() {
    if (waterAutosaveDirty) saveWorksheetState();
  }

  function loadWorksheetState() {
    try {
      const raw = localStorage.getItem(WATER_AUTOSAVE_KEY);
      if (!raw) {
        updateAutosaveTimestampDisplay(localStorage.getItem(LAST_SAVED_KEY));
        return false;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        try { localStorage.removeItem(WATER_AUTOSAVE_KEY); } catch (err) {}
        updateAutosaveTimestampDisplay('');
        return false;
      }
      applyState(parsed);
      let lastSaved = localStorage.getItem(LAST_SAVED_KEY);
      if (!lastSaved) {
        lastSaved = new Date().toISOString();
        try { localStorage.setItem(LAST_SAVED_KEY, lastSaved); } catch (err) {}
      }
      updateAutosaveTimestampDisplay(lastSaved);
      scenarioLoadGuardDirty = false;
      return true;
    } catch (e) {
      try { localStorage.removeItem(WATER_AUTOSAVE_KEY); } catch (err) {}
      updateAutosaveTimestampDisplay('');
      return false;
    }
  }

  function restoreAutosavedState() {
    if (!localStorage.getItem(WATER_AUTOSAVE_KEY)) {
      showToast('No autosaved worksheet state to restore.', 'info', 2500);
      return;
    }
    if (!loadWorksheetState()) {
      showToast('Could not restore autosave.', 'error', 2500);
      return;
    }
    recalc();
    waterAutosaveDirty = true;
    saveWorksheetState();
    scenarioLoadGuardDirty = false;
    setScenarioListLine({ kind: 'restored_autosave' });
    showToast('Restored last autosave.', 'success', 2500);
  }

  function updateScenarioDropdown() {
    const select = g('water-scenario-select');
    if (!select) return;
    const list = getSavedScenarios();
    if (list.length === 0) {
      select.innerHTML = '<option value="">— No saved scenarios —</option>';
    } else {
      select.innerHTML = '<option value="">— Select scenario to load —</option>';
    }
    list.sort((a, b) => {
      const ta = a.timestamp != null ? (typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime()) : 0;
      const tb = b.timestamp != null ? (typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime()) : 0;
      return tb - ta;
    });
    list.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name || 'Unnamed'} (${s.timestamp ? new Date(s.timestamp).toLocaleString() : ''})`;
      select.appendChild(opt);
    });
    const loadBtn = g('water-load-btn');
    const deleteBtn = g('water-delete-btn');
    const clearBtn = g('water-clear-btn');
    const disabled = list.length === 0;
    select.disabled = disabled;
    if (loadBtn) loadBtn.disabled = disabled;
    if (deleteBtn) deleteBtn.disabled = disabled;
    if (clearBtn) clearBtn.disabled = disabled;
  }

  /** Bottom line = scenario list / import only (not worksheet autosave — that’s the toolbar). */
  let scenarioListLine = { kind: 'none', name: '', ts: '' };

  function formatScenarioTs(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? '' : d.toLocaleString();
    } catch (e) {
      return '';
    }
  }

  function renderScenarioListLine() {
    const el = g('saved-display');
    if (!el) return;
    const { kind, name, ts } = scenarioListLine;
    if (kind === 'none') {
      el.textContent = '';
      return;
    }
    if (kind === 'editing') {
      el.textContent = 'Worksheet edited — not yet saved to the scenario list. Unsaved work is in toolbar (worksheet autosave).';
      return;
    }
    const n = (name || '').trim();
    const t = formatScenarioTs(ts);
    if (kind === 'list_saved') {
      el.textContent = n ? `Scenario list: “${n}” added/updated · ${t}` : `Scenario list: saved · ${t}`;
    } else if (kind === 'list_loaded') {
      el.textContent = n ? `Loaded from list: “${n}” · stored in list ${t}` : `Loaded from scenario list · ${t}`;
    } else if (kind === 'imported') {
      el.textContent = t ? `Imported from file · export time ${t}` : 'Imported from file.';
    } else if (kind === 'restored_autosave') {
      el.textContent = 'Restored from worksheet autosave (separate from the named scenario list).';
    }
  }

  function setScenarioListLine(opts) {
    scenarioListLine = {
      kind: opts.kind || 'none',
      name: opts.name != null ? opts.name : '',
      ts: opts.ts != null ? opts.ts : ''
    };
    renderScenarioListLine();
  }

  function markScenarioListStaleIfNeeded() {
    const k = scenarioListLine.kind;
    if (k === 'list_saved' || k === 'list_loaded' || k === 'imported' || k === 'restored_autosave') {
      scenarioListLine = { kind: 'editing', name: '', ts: '' };
      renderScenarioListLine();
    }
  }


  function saveScenario() {
    // Validate all inputs before saving
    let hasErrors = false;
    Object.keys(VALIDATION_RULES).forEach(id => {
      if (!validateAndShow(id)) hasErrors = true;
    });
    if (hasErrors) {
      showFeedback('Please fix validation errors before saving.', 'info');
      return;
    }
    const state = getState();
    let name = (state.scenarioName || '').trim();
    if (!name) {
      name = prompt('Enter a name for this scenario:', `Water ${new Date().toLocaleDateString()}`);
      if (!name || !name.trim()) {
        showFeedback('Save cancelled. Name required.', 'info');
        return;
      }
      name = name.trim();
      if (g('water-scenario-name')) g('water-scenario-name').value = name;
      state.scenarioName = name;
    }
    const scenario = {
      id: Date.now().toString(),
      name: name,
      timestamp: new Date().toISOString(),
      state
    };
    const list = getSavedScenarios();
    const idx = list.findIndex(s => s.name === scenario.name);
    if (idx >= 0 && !confirm(`Overwrite existing scenario "${scenario.name}"?`)) {
      showFeedback('Save cancelled.', 'info');
      return;
    }
    if (idx >= 0) list[idx] = scenario;
    else list.push(scenario);
    try {
      setSavedScenarios(list);
    } catch (e) {
      console.error('Failed to save scenarios:', e);
      showFeedback('Could not save scenario. Storage may be disabled or full.', 'error');
      return;
    }
    updateScenarioDropdown();
    setScenarioListLine({ kind: 'list_saved', name: scenario.name, ts: scenario.timestamp });
    saveWorksheetState();
    scenarioLoadGuardDirty = false;
    showFeedback(`Scenario "${scenario.name}" saved.`, 'success');
  }

  function loadSelectedScenario() {
    const select = g('water-scenario-select');
    const id = select ? select.value : '';
    if (!id) {
      showFeedback('Select a scenario to load.', 'info');
      return;
    }
    const list = getSavedScenarios();
    const scenario = list.find(s => s.id === id);
    if (!scenario || !scenario.state) {
      showFeedback('Scenario not found or invalid.', 'info');
      return;
    }
    if (!confirmOverwriteIfDirty()) return;
    applyState(scenario.state);
    if (g('water-scenario-name')) g('water-scenario-name').value = scenario.name || (scenario.state && scenario.state.scenarioName) || '';
    setScenarioListLine({
      kind: 'list_loaded',
      name: scenario.name || '',
      ts: scenario.timestamp || null
    });
    recalc();
    saveWorksheetState();
    scenarioLoadGuardDirty = false;
    showFeedback(`Scenario "${scenario.name || ''}" loaded.`, 'success');
  }

  function deleteSelectedScenario() {
    const select = g('water-scenario-select');
    const id = select ? select.value : '';
    if (!id) {
      showFeedback('Select a scenario to delete.', 'info');
      return;
    }
    const list = getSavedScenarios();
    const scenario = list.find(s => s.id === id);
    if (!scenario || !confirm(`Delete "${scenario.name || ''}"?`)) return;
    const filtered = list.filter(s => s.id !== id);
    try {
      setSavedScenarios(filtered);
    } catch (e) {
      console.error('Failed to save scenarios:', e);
      showFeedback('Could not delete scenario. Storage may be disabled or full.', 'error');
      return;
    }
    updateScenarioDropdown();
    showFeedback('Scenario deleted.', 'success');
  }

  function clearAllScenarios() {
    const list = getSavedScenarios();
    if (list.length === 0) {
      showFeedback('No scenarios to clear.', 'info');
      return;
    }
    if (!confirm(`Delete all ${list.length} scenarios? This cannot be undone.`)) return;
    try {
      setSavedScenarios([]);
    } catch (e) {
      showFeedback('Could not clear scenarios. Storage may be disabled or full.', 'error');
      return;
    }
    updateScenarioDropdown();
    setScenarioListLine({ kind: 'none' });
    showFeedback('All scenarios cleared.', 'success');
  }

  function importFromFile() {
    const input = g('water-file-input');
    if (!input) return;
    input.value = '';
    input.click();
  }

  function toCsvCell(text) {
    if (text == null) return '""';
    const t = String(text);
    if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
    return `"${t}"`;
  }

  function buildCsvExport(state) {
    const lines = [];
    lines.push('Field,Value');
    lines.push(`${toCsvCell('Scenario Name')},${toCsvCell(state.scenarioName || '')}`);
    lines.push(`${toCsvCell('Notes')},${toCsvCell(state.scenarioNotes || '')}`);
    lines.push(`${toCsvCell('Deployment (days)')},${toCsvCell(state.days != null ? state.days : '')}`);
    lines.push(`${toCsvCell('Beds')},${toCsvCell(state.beds != null ? state.beds : '')}`);
    lines.push(`${toCsvCell('Buffer (%)')},${toCsvCell(state.bufferPercent != null ? state.bufferPercent : '')}`);
    lines.push(`${toCsvCell('Unit')},${toCsvCell(state.waterUnit || '')}`);
    lines.push(`${toCsvCell('Potable (per bed/day, L)')},${toCsvCell(state.potablePerBedPerDay != null ? state.potablePerBedPerDay : '')}`);
    lines.push(`${toCsvCell('Wastewater (per bed/day, L)')},${toCsvCell(state.wastewaterPerBedPerDay != null ? state.wastewaterPerBedPerDay : '')}`);
    lines.push(`${toCsvCell('Potable containers (count)')},${toCsvCell(state.potableContainerCount != null ? state.potableContainerCount : '')}`);
    lines.push(`${toCsvCell('Potable capacity per container')},${toCsvCell(state.potableContainerCapacity != null ? state.potableContainerCapacity : '')}`);
    lines.push(`${toCsvCell('Wastewater containers (count)')},${toCsvCell(state.wastewaterContainerCount != null ? state.wastewaterContainerCount : '')}`);
    lines.push(`${toCsvCell('Wastewater capacity per container')},${toCsvCell(state.wastewaterContainerCapacity != null ? state.wastewaterContainerCapacity : '')}`);
    lines.push(`${toCsvCell('Potable supply mode')},${toCsvCell(state.potableSupplyMode || '')}`);
    lines.push(`${toCsvCell('Wastewater disposal mode')},${toCsvCell(state.wastewaterDisposalMode || '')}`);
    lines.push(`${toCsvCell('Mains flow rate (L/hr)')},${toCsvCell(state.mainsFlowRate != null ? state.mainsFlowRate : '')}`);
    lines.push(`${toCsvCell('Exported At')},${toCsvCell(new Date().toLocaleString())}`);
    return lines.join('\n');
  }

  function downloadTextFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onExportToFile() {
    const dialog = g('water-export-format-dialog');
    if (dialog) {
      const jsonRadio = document.querySelector('#water-export-format-dialog input[name="water-export-format"][value="JSON"]');
      if (jsonRadio) jsonRadio.checked = true;
      dialog.hidden = false;
      dialog.setAttribute('aria-hidden', 'false');
    }
  }

  function performExportWithFormat(fmt) {
    const state = getState();
    const format = (fmt && String(fmt).toUpperCase()) || 'JSON';
    if (format === 'CSV') {
      const csv = buildCsvExport(state);
      downloadTextFile(csv, 'text/csv;charset=utf-8', 'water-calculator-export.csv');
      showFeedback('Scenario exported as CSV', 'success');
      return;
    }
    const exportName = (state.scenarioName && state.scenarioName.trim()) ? state.scenarioName.trim() : `Water ${new Date().toLocaleDateString()}`;
    const data = {
      name: exportName,
      timestamp: new Date().toISOString(),
      state,
      exportedAt: new Date().toISOString()
    };
    downloadTextFile(JSON.stringify(data, null, 2), 'application/json', 'water-calculator-scenario.json');
    showFeedback('Scenario exported.', 'success');
  }

  function closeExportFormatDialog() {
    const dialog = g('water-export-format-dialog');
    if (dialog) {
      dialog.hidden = true;
      dialog.setAttribute('aria-hidden', 'true');
    }
  }

  function onFileSelected(ev) {
    const file = ev.target && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const state = data.state || data;
        if (state.days != null || state.beds != null) {
          if (!state.scenarioName && data.name) state.scenarioName = data.name;
          if (!confirmImportIfDirty()) {
            ev.target.value = '';
            return;
          }
          applyState(state);
          setScenarioListLine({
            kind: 'imported',
            name: state.scenarioName || data.name || '',
            ts: data.timestamp || null
          });
          recalc();
          saveWorksheetState();
          scenarioLoadGuardDirty = false;
          showFeedback('Scenario imported and applied.', 'success');
        } else {
          showFeedback('File does not contain a valid scenario.', 'info');
        }
      } catch (e) {
        showFeedback(`Import failed: ${e.message || 'Invalid or corrupted file.'} Use a scenario JSON exported from this calculator.`, 'error');
      }
      ev.target.value = '';
    };
    reader.onerror = () => {
      showFeedback('Error reading file. Please try again or choose a different file.', 'error');
      ev.target.value = '';
    };
    reader.readAsText(file);
  }

  function resetToDefaults() {
    if (!confirm('Reset to defaults? This will restore all water inputs, modes, and capacities to baseline values.')) return;
    if (typeof WATER_DEFAULTS === 'undefined') {
      applyState({
        days: 0, beds: 0, bufferPercent: 0,
        potablePerBedPerDay: 80, wastewaterPerBedPerDay: 65,
        potableContainerCount: 0, potableContainerCapacity: 0,
        wastewaterContainerCount: 0, wastewaterContainerCapacity: 0
      });
    } else {
      applyState(WATER_DEFAULTS);
    }
    recalc();
    saveWorksheetState();
    setScenarioListLine({ kind: 'none' });
    scenarioLoadGuardDirty = false;
    showFeedback('Reset to defaults.', 'success');
  }

  function showFeedback(msg, type) {
    type = type || 'success';
    const el = g('water-button-feedback');
    if (!el) return;
    el.textContent = msg;
    el.className = `button-feedback show ${type}`;
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => {
        el.textContent = '';
        el.className = 'button-feedback';
      }, 300);
    }, 3000);
  }

  function printReport() {
    window.print();
    showFeedback('Print preview opened.', 'success');
  }

  function updateBaseLiterValues() {
    const potableEl = g('water-potable-rate');
    const wastewaterEl = g('water-wastewater-rate');
    if (isGallons()) {
      // User edited in gallons mode: convert to liters and store
      if (potableEl) baseLiterValues.potable = getNum(potableEl, 0) * L_PER_GAL;
      if (wastewaterEl) baseLiterValues.wastewater = getNum(wastewaterEl, 0) * L_PER_GAL;
    } else {
      // User edited in liters mode: store directly
      if (potableEl) baseLiterValues.potable = getNum(potableEl, baseLiterValues.potable);
      if (wastewaterEl) baseLiterValues.wastewater = getNum(wastewaterEl, baseLiterValues.wastewater);
    }
  }

  function toggleBreakdown() {
    const display = g('water-breakdown-display');
    const toggle = g('water-breakdown-toggle');
    if (!display || !toggle) return;
    if (display.style.display === 'none') {
      display.style.display = 'block';
      toggle.textContent = 'ℹ️ Hide breakdown';
      updateBreakdown();
    } else {
      display.style.display = 'none';
      toggle.textContent = 'ℹ️ Show breakdown';
    }
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

  function setup() {
    // Setup validation for all inputs
    Object.keys(VALIDATION_RULES).forEach(id => {
      const el = g(id);
      if (el) {
        el.addEventListener('blur', () => {
          validateAndShow(id);
          tryAutosaveOnBlur();
        });
        el.addEventListener('input', () => {
          // Clear error on input, but don't validate until blur
          if (el.classList.contains('input-error')) {
            const result = validateInput(id);
            if (result.valid) clearValidationError(id);
          }
        });
      }
    });

    // Setup placeholder behavior for all number inputs
    ['water-days', 'water-beds', 'water-buffer', 'water-potable-count', 'water-potable-capacity', 'water-wastewater-count', 'water-wastewater-capacity', 'water-mains-flow-rate'].forEach(id => {
      const el = g(id);
      if (el) {
        setupPlaceholderBehavior(el);
        el.addEventListener('input', () => {
          notifyWorksheetChanged();
          recalc();
        });
        if (id === 'water-mains-flow-rate') el.addEventListener('blur', () => validateAndShow('water-mains-flow-rate'));
      }
    });
    // Water rate inputs: update base values and recalc
    ['water-potable-rate', 'water-wastewater-rate'].forEach(id => {
      const el = g(id);
      if (el) {
        el.addEventListener('input', () => {
          notifyWorksheetChanged();
          updateBaseLiterValues();
          recalc();
        });
      }
    });

    if (g('water-breakdown-toggle')) {
      g('water-breakdown-toggle').addEventListener('click', toggleBreakdown);
    }

    // Section-level help: hover for quick glance; click to pin open (scoped to Water panel in Shell)
    const helpROOT = document.getElementById('panel-water') || document.documentElement;
    const helpPopoverIdPrefix = document.getElementById('panel-water') ? 'water-help-popover-' : 'help-popover-';
    let helpHoverHideTimeout = null;
    function getPopoverForBtn(btn) {
      const id = btn.getAttribute('data-help');
      if (!id) return null;
      return document.getElementById(helpPopoverIdPrefix + id) || null;
    }
    function closeAllHelpPopovers(unpin) {
      if (unpin) helpROOT.querySelectorAll('.help-popover').forEach(pop => { pop.classList.remove('pinned'); });
      helpROOT.querySelectorAll('.help-popover').forEach(pop => { pop.hidden = true; });
      helpROOT.querySelectorAll('.help-icon').forEach(b => { b.setAttribute('aria-expanded', 'false'); });
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
      if (helpHoverHideTimeout) { clearTimeout(helpHoverHideTimeout); helpHoverHideTimeout = null; }
    }
    helpROOT.querySelectorAll('.help-icon').forEach(btn => {
      const pop = getPopoverForBtn(btn);
      if (!pop) return;
      btn.addEventListener('mouseenter', () => {
        cancelHoverHide();
        pop.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
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

    if (g('water-btn-clear-autosave')) g('water-btn-clear-autosave').addEventListener('click', restoreAutosavedState);
    if (g('water-print-btn')) g('water-print-btn').addEventListener('click', printReport);
    if (g('water-reset-btn')) g('water-reset-btn').addEventListener('click', resetToDefaults);
    if (g('water-save-btn')) g('water-save-btn').addEventListener('click', saveScenario);
    if (g('water-load-btn')) g('water-load-btn').addEventListener('click', loadSelectedScenario);
    if (g('water-delete-btn')) g('water-delete-btn').addEventListener('click', deleteSelectedScenario);
    if (g('water-clear-btn')) g('water-clear-btn').addEventListener('click', clearAllScenarios);
    if (g('water-import-btn')) g('water-import-btn').addEventListener('click', importFromFile);
    if (g('water-export-btn')) g('water-export-btn').addEventListener('click', onExportToFile);

    const exportFormatDialog = g('water-export-format-dialog');
    const exportFormatConfirm = g('water-export-format-confirm');
    const exportFormatCancel = g('water-export-format-cancel');
    function onExportFormatConfirm() {
      const selected = document.querySelector('#water-export-format-dialog input[name="water-export-format"]:checked');
      const fmt = selected ? selected.value : 'JSON';
      performExportWithFormat(fmt);
      closeExportFormatDialog();
    }
    if (exportFormatConfirm) {
      exportFormatConfirm.addEventListener('click', onExportFormatConfirm);
    }
    if (exportFormatCancel) {
      exportFormatCancel.addEventListener('click', closeExportFormatDialog);
    }
    if (exportFormatDialog) {
      exportFormatDialog.addEventListener('click', function (e) {
        if (e.target === exportFormatDialog) closeExportFormatDialog();
      });
    }

    const fileInput = g('water-file-input');
    if (fileInput) fileInput.addEventListener('change', onFileSelected);

    const unitRadios = document.querySelectorAll('input[name="water-unit"]');
    unitRadios.forEach(radio => radio.addEventListener('change', onUnitChange));

    ['water-potable-supply-mode', 'water-wastewater-disposal-mode'].forEach(id => {
      const el = g(id);
      if (el) el.addEventListener('change', () => {
        notifyWorksheetChanged();
        updateSupplyModeUI();
        recalc();
      });
    });

    const scenarioNameEl = g('water-scenario-name');
    const scenarioNotesEl = g('water-scenario-notes');
    if (scenarioNameEl) {
      scenarioNameEl.addEventListener('input', notifyWorksheetChanged);
      scenarioNameEl.addEventListener('blur', tryAutosaveOnBlur);
    }
    if (scenarioNotesEl) {
      scenarioNotesEl.addEventListener('input', notifyWorksheetChanged);
      scenarioNotesEl.addEventListener('blur', tryAutosaveOnBlur);
    }

    startAutosaveTimer();
    waterAutosaveDirty = false;
    scenarioLoadGuardDirty = false;
    setScenarioListLine({ kind: 'none' });
    if (typeof WATER_DEFAULTS !== 'undefined') {
      applyState(WATER_DEFAULTS);
    } else {
      const potableEl = g('water-potable-rate');
      const wastewaterEl = g('water-wastewater-rate');
      if (potableEl && !isGallons()) baseLiterValues.potable = getNum(potableEl, baseLiterValues.potable);
      if (wastewaterEl && !isGallons()) baseLiterValues.wastewater = getNum(wastewaterEl, baseLiterValues.wastewater);
    }
    try {
      updateAutosaveTimestampDisplay(localStorage.getItem(LAST_SAVED_KEY));
    } catch (e) { /* ignore */ }
    updateUnitLabels();
    updateSupplyModeUI();
    updateScenarioDropdown();
    recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
