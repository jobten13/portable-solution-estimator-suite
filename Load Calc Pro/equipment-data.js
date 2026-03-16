/**
 * Load Calc Pro – Equipment definitions (name, kW, PF) per category.
 * Engineer-style: editable in UI; used to build tables and for save/load.
 *
 * kW/PF VALIDATION (typical public / design-guide ranges; verify with nameplate):
 * - Monitors: 50–70 W typical → 0.10 kW OK.
 * - Infusion/syringe pumps: ~9–15 W → set to 0.02 kW (was 0.05).
 * - Hospital/ICU beds: 100–250 W → 0.25 / 0.35 kW OK.
 * - Oxygen concentrators: portable 28–150 W, stationary to ~400 W → 0.12 portable, 0.40 stationary.
 * - Ventilators: 180–420 W (config-dependent) → 0.60 kW OK.
 * - Portable X-Ray: 3–30 kW → 3.00 kW OK (low end).
 * - Medical refrigerators: ~60–200 W avg, higher peak → 0.30 / 0.50 kW OK.
 * - Desktop + monitor(s): ~80–210 W → 0.20 / 0.30 kW OK. Laser printer: 430–730 W printing, 8–36 W ready → 0.80 / 0.03 OK.
 * - HVAC 3.5/5 ton: ~2.5–5 kW (SEER-dependent); heat strip adds load → 4 / 5.5 / 8 / 12 kW OK.
 * - Motor PF: induction motors typically 0.75–0.92 full load; resistive/IT ~1.0 → PF values in range.
 * Always confirm with manufacturer or nameplate for design.
 */
const LOAD_CALC_PRO_EQUIPMENT = {
  'cat-standard': {
    title: 'Standard Medical Equipment',
    badge: 'kW/PF Assumptions',
    items: [
      { name: 'Portable Vital Signs Monitor', kw: 0.10, pf: 1.00 },
      { name: 'Patient Monitor', kw: 0.10, pf: 1.00 },
      { name: 'Infusion / Syringe Pump', kw: 0.02, pf: 1.00 },
      { name: 'IV Administration Pump', kw: 0.02, pf: 1.00 },
      { name: 'Suction Machine', kw: 0.05, pf: 0.80 },
      { name: 'Electric Hospital Bed', kw: 0.25, pf: 1.00 },
      { name: 'ICU Bed', kw: 0.35, pf: 1.00 },
      { name: 'Oxygen Concentrator', kw: 0.40, pf: 0.90 },
      { name: 'Portable Oxygen Concentrator', kw: 0.10, pf: 0.90 },
      { name: 'Sequential Compression Device', kw: 0.10, pf: 1.00 },
      { name: 'CPAP', kw: 0.12, pf: 1.00 },
      { name: 'ECG / EKG', kw: 0.10, pf: 1.00 },
      { name: 'Small Lab Centrifuge', kw: 0.05, pf: 0.85 },
      { name: 'Portable Ultrasound', kw: 0.20, pf: 1.00 },
      { name: 'Orthopedic Cast Cutter', kw: 0.40, pf: 0.80 }
    ]
  },
  'cat-emergency': {
    title: 'Emergency / Critical Medical Equipment',
    badge: 'kW/PF Assumptions',
    items: [
      { name: 'Portable Ventilator', kw: 0.20, pf: 1.00 },
      { name: 'Defibrillator', kw: 0.30, pf: 1.00 },
      { name: 'Video Laryngoscope', kw: 0.05, pf: 1.00 },
      { name: 'Portable X-Ray', kw: 3.00, pf: 0.80 },
      { name: 'Rapid Infuser', kw: 1.00, pf: 1.00 },
      { name: 'Blood Gas Analyzer', kw: 0.40, pf: 1.00 },
      { name: 'Blood Chemistry POC', kw: 0.30, pf: 1.00 },
      { name: 'Hematology Analyzer', kw: 0.40, pf: 1.00 },
      { name: 'Chemistry Analyzer', kw: 1.00, pf: 1.00 },
      { name: 'Refrigerator (Pharmacy/Specimen)', kw: 0.30, pf: 0.75 },
      { name: 'Refrigerator (Blood Storage)', kw: 0.30, pf: 0.75 },
      { name: 'Refrigerator Freezer', kw: 0.50, pf: 0.70 },
      { name: 'Blanket Warmer', kw: 1.20, pf: 1.00 },
      { name: 'Bair Hugger', kw: 1.10, pf: 1.00 },
      { name: 'Anesthesia Machine', kw: 0.12, pf: 1.00 },
      { name: 'Crash Cart (mixed loads)', kw: 0.50, pf: 1.00 }
    ]
  },
  'cat-office': {
    title: 'Office & IT Equipment',
    badge: 'kW/PF Assumptions',
    items: [
      { name: 'Desktop PC + 1 Monitor', kw: 0.20, pf: 0.95 },
      { name: 'Desktop PC + 2 Monitors', kw: 0.30, pf: 0.95 },
      { name: 'Laptop', kw: 0.07, pf: 1.00 },
      { name: 'Smartphone (charging)', kw: 0.01, pf: 1.00 },
      { name: 'Tablet (charging)', kw: 0.015, pf: 1.00 },
      { name: 'Radio charging base (single)', kw: 0.005, pf: 1.00 },
      { name: 'Radio charging base (multi-unit, 6–12 bay)', kw: 0.15, pf: 1.00 },
      { name: 'Computer Monitor', kw: 0.03, pf: 1.00 },
      { name: 'TV / Display (small, e.g. 32")', kw: 0.05, pf: 1.00 },
      { name: 'TV / Display (large, e.g. 55")', kw: 0.10, pf: 1.00 },
      { name: 'VoIP Phone', kw: 0.02, pf: 1.00 },
      { name: 'Network Switch / Router (per rack)', kw: 0.05, pf: 0.98 },
      { name: 'Multifunction Printer', kw: 0.80, pf: 0.95 },
      { name: 'Printer (Standby)', kw: 0.05, pf: 1.00 },
      // Suite standard: Printer (Printing) 0.80 kW, Label printer (thermal) 0.10 kW (aligned with Basic).
      { name: 'Printer (Printing)', kw: 0.80, pf: 0.95 },
      { name: 'Label printer (thermal)', kw: 0.10, pf: 1.00 },
      { name: 'Tool Battery Charger', kw: 0.10, pf: 1.00 },
      { name: 'Office / Task Lighting (per room)', kw: 0.15, pf: 1.00 },
      { name: 'Desk Light', kw: 0.03, pf: 1.00 },
      { name: 'Floor Light - Exam', kw: 0.08, pf: 1.00 },
      { name: 'Mini Fridge (Office)', kw: 0.10, pf: 0.75 }
    ]
  },
  'cat-hvac': {
    title: 'HVAC, Hygiene Pumps, Work Lights',
    badge: 'kW/PF Assumptions (Motor loads trigger 4x kVA start surge)',
    items: [
      { name: 'HVAC 3.5 Ton', kw: 4.00, pf: 0.80 },
      { name: 'HVAC 3.5 Ton w/ Heat Strip', kw: 8.50, pf: 0.90 },
      { name: 'HVAC 5 Ton', kw: 5.50, pf: 0.80 },
      { name: 'HVAC 5 Ton w/ Heat Strip', kw: 12.00, pf: 0.90 },
      { name: 'Furnace / Air Handler Blower', kw: 0.60, pf: 0.85 },
      { name: 'Water Pump (Hygiene Center)', kw: 0.30, pf: 0.75 },
      { name: 'Sump Pump (Hygiene Center)', kw: 0.50, pf: 0.75 },
      { name: 'Portable Sink Pump (Hygiene Station)', kw: 0.30, pf: 0.80 },
      { name: 'Portable Shower Pump', kw: 0.50, pf: 0.75 },
      { name: 'Bladder Fill / Transfer Pump', kw: 0.75, pf: 0.80 },
      { name: 'Air Shelter Inflator', kw: 1.50, pf: 0.80 },
      { name: 'Tactical Stringable Lights', kw: 0.30, pf: 1.00 },
      { name: 'External Work Light (20K Lumens)', kw: 0.25, pf: 1.00 },
      { name: 'LED Work Light Tower', kw: 1.50, pf: 1.00 },
      { name: 'Portable LED Work Light', kw: 0.20, pf: 1.00 }
    ]
  }
};
