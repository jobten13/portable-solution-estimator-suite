/* Load Calc Basic equipment data for standalone stress tests */
const LOAD_CALC_BASIC_EQUIPMENT = {
  "cat-standard": {
    "title": "Standard Medical Equipment",
    "badge": "Fixed typical kW values",
    "items": [
      { "name": "Portable Vital Signs Monitor", "kw": 0.10 },
      { "name": "Patient Monitor", "kw": 0.10 },
      { "name": "Infusion / Syringe Pump", "kw": 0.02 },
      { "name": "IV Administration Pump", "kw": 0.02 },
      { "name": "Suction Machine", "kw": 0.05 },
      { "name": "Electric Hospital Bed", "kw": 0.25 },
      { "name": "ICU Bed", "kw": 0.35 },
      { "name": "Oxygen Concentrator", "kw": 0.40 },
      { "name": "Portable Oxygen Concentrator", "kw": 0.10 },
      { "name": "Sequential Compression Device", "kw": 0.10 },
      { "name": "CPAP", "kw": 0.12 },
      { "name": "ECG / EKG", "kw": 0.10 },
      { "name": "Small Lab Centrifuge", "kw": 0.05 },
      { "name": "Portable Ultrasound", "kw": 0.20 },
      { "name": "Orthopedic Cast Cutter", "kw": 0.40 }
    ]
  },
  "cat-emergency": {
    "title": "Emergency / Critical Medical Equipment",
    "badge": null,
    "items": [
      { "name": "Portable Ventilator", "kw": 0.60 },
      { "name": "Defibrillator", "kw": 0.30 },
      { "name": "Video Laryngoscope", "kw": 0.05 },
      { "name": "Portable X-Ray", "kw": 3.00 },
      { "name": "Rapid Infuser", "kw": 1.00 },
      { "name": "Blood Gas Analyzer", "kw": 0.40 },
      { "name": "Blood Chemistry POC", "kw": 0.30 },
      { "name": "Hematology Analyzer", "kw": 0.40 },
      { "name": "Chemistry Analyzer", "kw": 1.00 },
      { "name": "Refrigerator (Pharmacy/Specimen)", "kw": 0.30 },
      { "name": "Refrigerator (Blood Storage)", "kw": 0.30 },
      { "name": "Refrigerator Freezer", "kw": 0.50 },
      { "name": "Blanket Warmer", "kw": 1.20 },
      { "name": "Bair Hugger", "kw": 1.10 },
      { "name": "Anesthesia Machine", "kw": 0.12 },
      { "name": "Crash Cart (mixed loads)", "kw": 0.50 }
    ]
  },
  "cat-office": {
    "title": "Office & IT Equipment",
    "badge": null,
    "items": [
      { "name": "Desktop PC + 1 Monitor", "kw": 0.20 },
      { "name": "Desktop PC + 2 Monitors", "kw": 0.30 },
      { "name": "Laptop", "kw": 0.07 },
      { "name": "Smartphone (charging)", "kw": 0.01 },
      { "name": "Tablet (charging)", "kw": 0.015 },
      { "name": "Radio charging base (single)", "kw": 0.005 },
      { "name": "Radio charging base (multi-unit, 6-12 bay)", "kw": 0.15 },
      { "name": "Computer Monitor", "kw": 0.03 },
      { "name": "TV / Display (small, e.g. 32\")", "kw": 0.05 },
      { "name": "TV / Display (large, e.g. 55\")", "kw": 0.10 },
      { "name": "VoIP Phone", "kw": 0.02 },
      { "name": "Network Switch / Router (per rack)", "kw": 0.05 },
      { "name": "Multifunction Printer", "kw": 0.80 },
      { "name": "Printer (Standby)", "kw": 0.05 },
      { "name": "Printer (Printing)", "kw": 0.80 },
      { "name": "Label printer (thermal)", "kw": 0.10 },
      { "name": "Tool Battery Charger", "kw": 0.10 },
      { "name": "Office / Task Lighting (per room)", "kw": 0.15 },
      { "name": "Desk Light", "kw": 0.03 },
      { "name": "Floor Light - Exam", "kw": 0.08 },
      { "name": "Mini Fridge (Office)", "kw": 0.10 }
    ]
  },
  "cat-hvac": {
    "title": "Environmental & Site Systems (Large Loads)",
    "badge": null,
    "items": [
      { "name": "HVAC 3.5 Ton", "kw": 4.00 },
      { "name": "HVAC 3.5 Ton w/ Heat Strip", "kw": 8.50 },
      { "name": "HVAC 5 Ton", "kw": 5.50 },
      { "name": "HVAC 5 Ton w/ Heat Strip", "kw": 12.00 },
      { "name": "Furnace / Air Handler Blower", "kw": 0.60 },
      { "name": "Water Pump (Hygiene Center)", "kw": 0.30 },
      { "name": "Sump Pump (Hygiene Center)", "kw": 0.50 },
      { "name": "Portable Sink Pump (Hygiene Station)", "kw": 0.30 },
      { "name": "Portable Shower Pump", "kw": 0.50 },
      { "name": "Bladder Fill / Transfer Pump", "kw": 0.75 },
      { "name": "Air Shelter Inflator", "kw": 1.50 },
      { "name": "Tactical Stringable Lights", "kw": 0.30 },
      { "name": "External Work Light (20K Lumens)", "kw": 0.25 },
      { "name": "LED Work Light Tower", "kw": 1.50 },
      { "name": "Portable LED Work Light", "kw": 0.20 }
    ]
  }
};
