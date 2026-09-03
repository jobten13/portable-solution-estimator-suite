/**
 * Water Requirements Calculator - Per bed/per day demand, wastewater, bladder schedule
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'pseWaterScenarios';
  const WATER_AUTOSAVE_KEY = 'pseWaterAutosave';
  const LAST_SAVED_KEY = 'pseWaterLastSaved';
  const SCHEMA_VERSION = 1;
  const GRAY_RATIO = 0.77; // Estimated ~77% gray water, ~23% black water
  const DEFAULT_POTABLE_GAL_PER_BED = 22;
  const DEFAULT_WASTEWATER_GAL_PER_BED = 18;

  function g(id) {
    const fullId = (id && id.startsWith('water-')) ? id : 'water-' + (id || '');
    return document.getElementById(fullId);
  }

  const WATER_PILL_TIERS = ['water-status-pill--ok', 'water-status-pill--warn', 'water-status-pill--danger', 'water-status-pill--neutral'];

  const MAINS_ROW_TIERS = ['water-mains-row--ok', 'water-mains-row--warn', 'water-mains-row--danger', 'water-mains-row--neutral'];

  function setMainsRowTier(row, tier) {
    if (!row) return;
    MAINS_ROW_TIERS.forEach(function (c) { row.classList.remove(c); });
    row.removeAttribute('role');
    if (tier === 'ok' || tier === 'warn' || tier === 'danger' || tier === 'neutral') {
      row.classList.add('water-mains-row--' + tier);
      if (tier === 'danger') row.setAttribute('role', 'alert');
    }
  }

  function setWaterStatusPill(el, tier) {
    if (!el) return;
    WATER_PILL_TIERS.forEach(function (c) { el.classList.remove(c); });
    el.classList.add('water-status-pill');
    const t = tier === 'ok' || tier === 'warn' || tier === 'danger' || tier === 'neutral' ? tier : 'neutral';
    el.classList.add('water-status-pill--' + t);
  }

  function roundCoverDays(x) {
    return Math.round(x * 10) / 10;
  }

  function applyContainerTierWarning(daysCover, warnRow, pill, detailEl, dangerSuffix) {
    let tier = 'danger';
    if (daysCover >= 2) tier = 'ok';
    else if (daysCover >= 1) tier = 'warn';
    const x = roundCoverDays(daysCover);
    const detailBase = `Containers cover ~${x} days at current demand`;
    const detailText = tier === 'danger' ? detailBase + ' — ' + dangerSuffix : detailBase;
    const pillLabel = tier === 'ok' ? 'ADEQUATE' : tier === 'warn' ? 'MARGINAL' : 'INSUFFICIENT';
    if (warnRow) warnRow.style.display = '';
    setMainsRowTier(warnRow, tier);
    if (pill) {
      pill.textContent = pillLabel;
      setWaterStatusPill(pill, tier);
      pill.setAttribute('role', 'status');
    }
    if (detailEl) {
      detailEl.textContent = detailText;
      detailEl.removeAttribute('aria-hidden');
    }
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

  function getState() {
    const days = getNum(g('water-days'), 0);
    const beds = getNum(g('water-beds'), 0);
    const buffer = getNum(g('water-buffer'), 0) / 100;
    const potableRate = getNum(g('water-potable-rate'), DEFAULT_POTABLE_GAL_PER_BED);
    const wastewaterRate = getNum(g('water-wastewater-rate'), DEFAULT_WASTEWATER_GAL_PER_BED);
    const potableCount = getNum(g('water-potable-count'), 0);
    const potableCap = getNum(g('water-potable-capacity'), 0);
    const wastewaterCount = getNum(g('water-wastewater-count'), 0);
    const wastewaterCap = getNum(g('water-wastewater-capacity'), 0);
    const mainsFlowRate = getNum(g('water-mains-flow-rate'), 0);

    return {
      schemaVersion: SCHEMA_VERSION,
      days,
      beds,
      bufferPercent: buffer * 100,
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
      mainsFlowRate
    };
  }

  function applyState(s) {
    if (!s) return;
    Object.keys(VALIDATION_RULES).forEach(id => clearValidationError(id));

    if (g('water-days')) g('water-days').value = s.days != null ? s.days : 0;
    if (g('water-beds')) g('water-beds').value = s.beds != null ? s.beds : 0;
    if (g('water-buffer')) g('water-buffer').value = s.bufferPercent != null ? s.bufferPercent : 0;
    if (g('water-scenario-name')) g('water-scenario-name').value = s.scenarioName != null ? s.scenarioName : '';
    if (g('water-scenario-notes')) g('water-scenario-notes').value = s.scenarioNotes != null ? s.scenarioNotes : '';
    if (g('water-potable-rate')) {
      g('water-potable-rate').value = s.potablePerBedPerDay != null ? s.potablePerBedPerDay : DEFAULT_POTABLE_GAL_PER_BED;
    }
    if (g('water-wastewater-rate')) {
      g('water-wastewater-rate').value = s.wastewaterPerBedPerDay != null ? s.wastewaterPerBedPerDay : DEFAULT_WASTEWATER_GAL_PER_BED;
    }
    if (g('water-potable-count')) g('water-potable-count').value = s.potableContainerCount != null ? s.potableContainerCount : 0;
    if (g('water-potable-capacity')) g('water-potable-capacity').value = s.potableContainerCapacity != null ? s.potableContainerCapacity : 0;
    if (g('water-wastewater-count')) g('water-wastewater-count').value = s.wastewaterContainerCount != null ? s.wastewaterContainerCount : 0;
    if (g('water-wastewater-capacity')) g('water-wastewater-capacity').value = s.wastewaterContainerCapacity != null ? s.wastewaterContainerCapacity : 0;
    if (g('water-potable-supply-mode')) {
      g('water-potable-supply-mode').value = s.potableSupplyMode || 'self';
    }
    if (g('water-wastewater-disposal-mode')) {
      g('water-wastewater-disposal-mode').value = s.wastewaterDisposalMode || 'containers';
    }
    if (g('water-mains-flow-rate')) {
      g('water-mains-flow-rate').value = s.mainsFlowRate != null ? s.mainsFlowRate : 0;
    }
    updateSupplyModeUI();
    updateBreakdown();

    Object.keys(VALIDATION_RULES).forEach(id => validateAndShow(id));
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
    const wastewater = getNum(wastewaterEl, DEFAULT_WASTEWATER_GAL_PER_BED);
    const grayEst = Math.round(wastewater * GRAY_RATIO);
    const blackEst = Math.round(wastewater * (1 - GRAY_RATIO));
    setText('breakdown-gray', `${formatNum(grayEst)} Gal`);
    setText('breakdown-black', `${formatNum(blackEst)} Gal`);
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
    const mainsPill = g('water-out-mains-pill');
    const mainsDetail = g('water-out-mains-detail');
    const showMains = potableMode === 'mains' || potableMode === 'hybrid';
    if (deliveryRow) deliveryRow.style.display = showMains && potableMode !== 'hybrid' ? 'none' : '';
    if (mainsRow) mainsRow.style.display = showMains ? '' : 'none';
    if (bufferRow) bufferRow.style.display = showMains ? '' : 'none';
    if (pickupRow) pickupRow.style.display = wastewaterMode === 'mains' ? 'none' : '';
    if (wwMainsRow) wwMainsRow.style.display = wastewaterMode === 'mains' ? '' : 'none';
    const wwMainsAdvisory = g('water-wastewater-mains-advisory');
    if (wwMainsAdvisory) wwMainsAdvisory.style.display = wastewaterMode === 'mains' ? '' : 'none';
    if (mainsRow) setMainsRowTier(mainsRow, null);
    if (mainsPill) setWaterStatusPill(mainsPill, 'neutral');
    if (mainsPill) mainsPill.textContent = '—';
    if (mainsDetail) {
      mainsDetail.textContent = '';
      mainsDetail.setAttribute('aria-hidden', 'true');
    }

    const potableStorageWarnRow = g('water-potable-storage-warning-row');
    const potableStoragePill = g('water-out-potable-storage-pill');
    const wastewaterStorageWarnRow = g('water-wastewater-storage-warning-row');
    const wastewaterStoragePill = g('water-out-wastewater-storage-pill');
    if (potableStorageWarnRow) {
      potableStorageWarnRow.style.display = 'none';
      setMainsRowTier(potableStorageWarnRow, null);
    }
    if (potableStoragePill) {
      setWaterStatusPill(potableStoragePill, 'neutral');
      potableStoragePill.textContent = '—';
      potableStoragePill.setAttribute('role', 'status');
    }
    const potableStorageDetailEl = g('out-potable-storage-detail');
    if (potableStorageDetailEl) {
      potableStorageDetailEl.textContent = '';
      potableStorageDetailEl.setAttribute('aria-hidden', 'true');
    }
    if (wastewaterStorageWarnRow) {
      wastewaterStorageWarnRow.style.display = 'none';
      setMainsRowTier(wastewaterStorageWarnRow, null);
    }
    if (wastewaterStoragePill) {
      setWaterStatusPill(wastewaterStoragePill, 'neutral');
      wastewaterStoragePill.textContent = '—';
      wastewaterStoragePill.setAttribute('role', 'status');
    }
    const wastewaterStorageDetailEl = g('out-wastewater-storage-detail');
    if (wastewaterStorageDetailEl) {
      wastewaterStorageDetailEl.textContent = '';
      wastewaterStorageDetailEl.setAttribute('aria-hidden', 'true');
    }

    // Potable: self-supplied or hybrid container side (uses buffered daily demand)
    if (potableMode === 'self' || potableMode === 'hybrid') {
      let daysPerDelivery;
      let potableDeliveries = '—';
      if (days <= 0 || beds <= 0) {
        potableDeliveries = 'Enter deployment length and number of beds';
      } else if (potableStorage > 0 && potablePerDayBuffered > 0) {
        daysPerDelivery = potableStorage / potablePerDayBuffered;
        const deliveriesNeeded = Math.ceil(days / daysPerDelivery);
        potableDeliveries = `~${deliveriesNeeded} over deployment (every ~${Math.round(daysPerDelivery)} days)`;
      } else if (potableStorage > 0) {
        potableDeliveries = 'No daily demand entered';
      } else {
        potableDeliveries = potableMode === 'hybrid' ? 'Enter backup container count & capacity' : 'Enter container count & capacity';
      }
      setText('out-potable-deliveries', potableDeliveries);

      const skipPotableStorageWarn =
        days <= 0 ||
        beds <= 0 ||
        potableStorage <= 0 ||
        potablePerDayBuffered <= 0 ||
        typeof daysPerDelivery !== 'number';
      if (!skipPotableStorageWarn) {
        applyContainerTierWarning(
          daysPerDelivery, potableStorageWarnRow, potableStoragePill,
          potableStorageDetailEl, 'expect more than one delivery per day'
        );
      }
    }

    // Potable: mains adequacy check
    if (showMains) {
      const mainsFlowGalHr = st.mainsFlowRate || 0;
      const peakDemandGalHr = potablePerDay / 16;
      const displayFlow = Math.round(mainsFlowGalHr) + ' Gal/hr';
      let rowTier = 'neutral';
      let pillTier = 'neutral';
      let pillLabel = '—';
      let detailText = '';
      if (mainsFlowGalHr <= 0) {
        pillLabel = 'NEEDS INPUT';
        detailText = 'Enter mains flow rate above';
      } else if (potablePerDay <= 0) {
        pillLabel = 'NEEDS INPUT';
        detailText = 'Enter beds and daily rate to check';
      } else if (mainsFlowGalHr >= peakDemandGalHr * 1.25) {
        const peakDisp = Math.round(peakDemandGalHr);
        rowTier = 'ok';
        pillTier = 'ok';
        pillLabel = 'ADEQUATE';
        detailText = `${displayFlow} supply vs. ${peakDisp} Gal/hr peak demand`;
      } else if (mainsFlowGalHr >= peakDemandGalHr) {
        rowTier = 'warn';
        pillTier = 'warn';
        pillLabel = 'MARGINAL';
        detailText = `${displayFlow} supply — limited safety margin`;
      } else {
        const peakDisp = Math.round(peakDemandGalHr);
        rowTier = 'danger';
        pillTier = 'danger';
        pillLabel = 'INSUFFICIENT';
        detailText = `${displayFlow} supply cannot meet ${peakDisp} Gal/hr peak demand`;
      }
      if (mainsPill) {
        mainsPill.textContent = pillLabel;
        setWaterStatusPill(mainsPill, pillTier);
      }
      if (mainsDetail) {
        mainsDetail.textContent = detailText;
        if (detailText) mainsDetail.removeAttribute('aria-hidden');
        else mainsDetail.setAttribute('aria-hidden', 'true');
      }
      if (mainsRow) setMainsRowTier(mainsRow, rowTier);
      const bufferGal = potablePerDay * 2;
      const bufferDisplay = Math.round(bufferGal).toLocaleString();
      setText('out-potable-buffer', bufferGal > 0 ? bufferDisplay + ' (for 48 hours if mains supply is interrupted)' : '—');
    }

    // Wastewater: container collection (uses buffered daily output)
    if (wastewaterMode === 'containers') {
      let daysPerFill;
      let wastewaterPickups = '—';
      if (days > 0 && beds > 0) {
        if (wastewaterStorage > 0 && wastewaterPerDayBuffered > 0) {
          daysPerFill = wastewaterStorage / wastewaterPerDayBuffered;
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

      const skipWastewaterStorageWarn =
        days <= 0 ||
        beds <= 0 ||
        wastewaterStorage <= 0 ||
        wastewaterPerDayBuffered <= 0 ||
        typeof daysPerFill !== 'number';
      if (!skipWastewaterStorageWarn) {
        applyContainerTierWarning(
          daysPerFill, wastewaterStorageWarnRow, wastewaterStoragePill,
          wastewaterStorageDetailEl, 'expect more than one pickup per day'
        );
      }
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
      throw e;
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

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    const host = document.getElementById('panel-water');
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

  async function confirmOverwriteIfDirty() {
    if (!scenarioLoadGuardDirty) return true;
    return shellConfirm(MSG_LOAD_OVERWRITE_DIRTY);
  }

  async function confirmImportIfDirty() {
    if (!scenarioLoadGuardDirty) return true;
    return shellConfirm(MSG_IMPORT_OVERWRITE_DIRTY);
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
    showToast('Restored worksheet from autosave.', 'success', 2500);
  }

  function syncScenarioSelectTitle() {
    const select = g('water-scenario-select');
    if (!select) return;
    const opt = select.selectedOptions && select.selectedOptions[0];
    const text = opt ? String(opt.textContent || '').trim() : '';
    select.title = text;
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
    syncScenarioSelectTitle();
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


  async function saveScenario() {
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
      name = await shellPrompt('Enter a name for this scenario:', `Water ${new Date().toLocaleDateString()}`);
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
    if (idx >= 0 && !(await shellConfirm(`Overwrite existing scenario "${scenario.name}"?`))) {
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

  async function loadSelectedScenario() {
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
    if (!(await confirmOverwriteIfDirty())) return;
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
    acknowledge('water-load-btn', 'Loaded!');
  }

  async function deleteSelectedScenario() {
    const select = g('water-scenario-select');
    const id = select ? select.value : '';
    if (!id) {
      showFeedback('Select a scenario to delete.', 'info');
      return;
    }
    const list = getSavedScenarios();
    const scenario = list.find(s => s.id === id);
    if (!scenario || !(await shellConfirm(`Delete "${scenario.name || ''}"?`))) return;
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

  async function clearAllScenarios() {
    const list = getSavedScenarios();
    if (list.length === 0) {
      showFeedback('No scenarios to clear.', 'info');
      return;
    }
    if (!(await shellConfirm(`Delete all ${list.length} scenarios? This cannot be undone.`))) return;
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
    lines.push(`${toCsvCell('Potable (per bed/day, Gal)')},${toCsvCell(state.potablePerBedPerDay != null ? state.potablePerBedPerDay : '')}`);
    lines.push(`${toCsvCell('Wastewater (per bed/day, Gal)')},${toCsvCell(state.wastewaterPerBedPerDay != null ? state.wastewaterPerBedPerDay : '')}`);
    lines.push(`${toCsvCell('Potable containers (count)')},${toCsvCell(state.potableContainerCount != null ? state.potableContainerCount : '')}`);
    lines.push(`${toCsvCell('Potable capacity per container (Gal)')},${toCsvCell(state.potableContainerCapacity != null ? state.potableContainerCapacity : '')}`);
    lines.push(`${toCsvCell('Wastewater containers (count)')},${toCsvCell(state.wastewaterContainerCount != null ? state.wastewaterContainerCount : '')}`);
    lines.push(`${toCsvCell('Wastewater capacity per container (Gal)')},${toCsvCell(state.wastewaterContainerCapacity != null ? state.wastewaterContainerCapacity : '')}`);
    lines.push(`${toCsvCell('Potable supply mode')},${toCsvCell(state.potableSupplyMode || '')}`);
    lines.push(`${toCsvCell('Wastewater disposal mode')},${toCsvCell(state.wastewaterDisposalMode || '')}`);
    lines.push(`${toCsvCell('Mains flow rate (Gal/hr)')},${toCsvCell(state.mainsFlowRate != null ? state.mainsFlowRate : '')}`);
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

  function onFileSelected(ev) {
    const file = ev.target && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        const state = data.state;
        if (state.days != null || state.beds != null) {
          if (!state.scenarioName && data.name) state.scenarioName = data.name;
          if (!(await confirmImportIfDirty())) {
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
          acknowledge('import-btn', 'Imported!');
        } else {
          acknowledge('import-btn', 'Invalid file');
        }
      } catch (e) {
        acknowledge('import-btn', 'Invalid file');
      }
      ev.target.value = '';
    };
    reader.onerror = () => {
      acknowledge('import-btn', 'Invalid file');
      ev.target.value = '';
    };
    reader.readAsText(file);
  }

  async function resetToDefaults() {
    if (!(await shellConfirm('Reset to defaults? This will restore all water inputs, modes, and capacities to baseline values.'))) return;
    if (debouncedAutosaveTimeout) { clearTimeout(debouncedAutosaveTimeout); debouncedAutosaveTimeout = null; }
    waterAutosaveDirty = false;
    if (typeof WATER_DEFAULTS !== 'undefined') {
      applyState(WATER_DEFAULTS);
    }
    recalc();
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
    ['water-potable-rate', 'water-wastewater-rate'].forEach(id => {
      const el = g(id);
      if (el) {
        el.addEventListener('input', () => {
          notifyWorksheetChanged();
          recalc();
        });
      }
    });

    if (g('water-breakdown-toggle')) {
      g('water-breakdown-toggle').addEventListener('click', toggleBreakdown);
    }

    // Section-level help: hover for quick glance; click to pin open (scoped to Water panel in Shell)
    const helpROOT = document.getElementById('panel-water');
    const helpPopoverIdPrefix = 'water-help-popover-';
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
    if (g('water-scenario-select')) g('water-scenario-select').addEventListener('change', syncScenarioSelectTitle);
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
    }
    try {
      updateAutosaveTimestampDisplay(localStorage.getItem(LAST_SAVED_KEY));
    } catch (e) { /* ignore */ }
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
