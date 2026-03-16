# Load Calculator Basic — kW Values Audit vs. Public Data

Audit date: Feb 2025. Each value was checked against publicly available specifications and averages.  
**Legend:** ✅ Accurate | ⚠️ Slightly high/low (optional tweak) | ❌ Consider revising

---

## Standard Medical Equipment

| Item | Assigned kW | Verdict | Public data / notes |
|------|-------------|---------|---------------------|
| Portable Vital Signs Monitor | 0.10 | ✅ | Portable patient monitors ~100–240 W AC (e.g. EDAN X8/X10/X12). 0.10 kW is a reasonable average. |
| Patient Monitor | 0.10 | ✅ | Same range as above; 0.10 kW appropriate. |
| Infusion / Syringe Pump | 0.05 | ✅ | Typical 15–24 W (e.g. 12V 2A adapters, &lt;15 VA units). 50 W is conservative for planning; in range. |
| IV Administration Pump | 0.05 | ✅ | Same as infusion/syringe; 0.05 kW acceptable. |
| Suction Machine | 0.15 | ❌ | **High.** Hospital suction often 40–48 W (e.g. SSCOR DUET 40 W, Sunset SU100DC 48 VA). **Suggest 0.05 kW.** |
| Electric Hospital Bed | 0.25 | ✅ | Typical 100–250 W (some sources 150–500 W). 0.25 kW is a good average. |
| ICU Bed | 0.35 | ✅ | Higher than standard bed; 0.35 kW plausible for advanced beds. |
| Oxygen Concentrator | 0.40 | ✅ | Stationary units 300–600 W; 400 W is mid-range. |
| Portable Oxygen Concentrator | 0.30 | ❌ | **High.** Portable units typically 45–120 W (e.g. Inogen G2 ~40 W, SimplyGo ~120 W). **Suggest 0.08–0.12 kW.** |
| Sequential Compression Device | 0.10 | ⚠️ | No direct specs found; 0.10 kW is a reasonable estimate for small pump/controller. |
| CPAP | 0.12 | ✅ | Without humidifier 30–60 W; with humidifier 60–90 W; with heated tube up to ~150 W. 0.12 kW is a reasonable “with humidifier” average. |
| ECG / EKG | 0.20 | ⚠️ | Little published data; 0.20 kW is a plausible planning value for a cart/console unit. |
| Small Lab Centrifuge | 0.30 | ❌ | **High for mini.** Small tabletop/mini centrifuges often 18–45 W. **Suggest 0.05 kW** for true “small” units; keep 0.30 kW only if meaning larger benchtop clinical centrifuges. |
| Portable Ultrasound | 0.50 | ⚠️ | Few public wattage specs; 0.50 kW is a reasonable planning estimate for portable systems. |
| Orthopedic Cast Cutter | 0.40 | ⚠️ | No clear wattage in search; 0.40 kW is a reasonable estimate for motorized saw. |

---

## Emergency / Critical Medical Equipment

| Item | Assigned kW | Verdict | Public data / notes |
|------|-------------|---------|---------------------|
| Portable Ventilator | 0.60 | ⚠️ | Research/low-power designs ~15 W; commercial transport ventilators often 50–150 W. 0.60 kW is conservative (worst-case/older units); consider 0.15–0.25 kW for typical modern portable. |
| Defibrillator | 0.30 | ✅ | Monitors/chargers in this range; 0.30 kW reasonable for planning. |
| Video Laryngoscope | 0.05 | ✅ | Small battery/display device; 50 W is a reasonable plug-in estimate. |
| Portable X-Ray | 3.00 | ✅ | Portable units commonly 2–5 kW; 3 kW is a good average. |
| Rapid Infuser | 1.00 | ⚠️ | No wattage in public docs; 1 kW is a reasonable planning value for heater/pump. |
| Blood Gas Analyzer | 0.40 | ✅ | Handheld POC (e.g. Abbott iSTAT) ~300 W; benchtop can be similar or higher; 0.40 kW in range. |
| Blood Chemistry POC | 0.30 | ✅ | POC devices often in this range; 0.30 kW appropriate. |
| Hematology Analyzer | 0.40 | ✅ | Similar to blood gas/chemistry; 0.40 kW reasonable. |
| Chemistry Analyzer | 1.00 | ✅ | Larger lab analyzers often 0.5–1.5 kW; 1.00 kW is a good average. |
| Refrigerator (Pharmacy/Specimen) | 0.30 | ✅ | Household/medical refrigerators ~300–800 W running; 0.30 kW is a conservative average. |
| Refrigerator (Blood Storage) | 0.30 | ✅ | Same as above. |
| Refrigerator Freezer | 0.50 | ✅ | Slightly higher than fridge-only; 0.50 kW reasonable. |
| Blanket Warmer | 1.20 | ⚠️ | No exact specs found; 1.2 kW is a plausible estimate for larger warmers. |
| Bair Hugger | 1.10 | ⚠️ | No exact specs; 1.1 kW is a plausible estimate for forced-air warmer. |
| Anesthesia Machine | 0.80 | ❌ | **High.** Published data: active use ~58–136 W (e.g. GE CareStation 58 W, Dräger Primus 136 W). **Suggest 0.12–0.15 kW.** |
| Crash Cart (mixed loads) | 0.50 | ✅ | Aggregate of monitor, suction, etc.; 0.50 kW is a reasonable planning value. |

---

## Office & IT Equipment

| Item | Assigned kW | Verdict | Public data / notes |
|------|-------------|---------|---------------------|
| Desktop PC + 1 Monitor | 0.20 | ✅ | PC 40–70 W idle, 150–250 W load; monitor 15–60 W. 200 W total is a reasonable planning average. |
| Desktop PC + 2 Monitors | 0.30 | ✅ | PC + two monitors; 300 W is reasonable for mixed use. |
| Laptop | 0.07 | ✅ | Typical 50–65 W (adapter rating); 0.07 kW in range. |
| Smartphone (charging) | 0.01 | ✅ | 5–25 W typical; 10 W is a good average. |
| Tablet (charging) | 0.015 | ✅ | ~10–45 W; 15 W is a reasonable average. |
| Two-way radio charging base (single) | 0.005 | ✅ | Commonly ~5 W; 0.005 kW correct. |
| Two-way radio charging base (multi-unit, 6–12 bay) | 0.15 | ✅ | Multi-bay rapid chargers ~150–260 W input; 0.15 kW is a good average. |
| Computer Monitor | 0.03 | ✅ | Typical 15–60 W; 30 W is a good average. |
| TV / Display (small, e.g. 32") | 0.05 | ✅ | 32" LED often 30–60 W; 0.05 kW in range. |
| TV / Display (large, e.g. 55") | 0.10 | ✅ | 55" LED often 80–120 W; 0.10 kW in range. |
| VoIP Phone | 0.02 | ✅ | Low-power device; 20 W is a reasonable estimate. |
| Network Switch / Router (per rack) | 0.05 | ✅ | Small switch/router 5–20 W; “per rack” 0.05 kW is conservative. |
| Multifunction Printer | 0.80 | ✅ | Printing 380–600 W typical, peak to ~1.2 kW; 0.80 kW is a good “in use” value. |
| Printer (Standby) | 0.05 | ✅ | Ready 40–75 W, sleep lower; 0.05 kW reasonable for standby. |
| Printer (Printing) | 0.10 | ✅ | Small printer when printing; 0.10 kW in range. |
| Label printer (thermal) | 0.02 | ✅ | Small thermal printers ~10–25 W; 0.02 kW appropriate. |

---

## Environmental & Site Systems (Large Loads)

| Item | Assigned kW | Verdict | Public data / notes |
|------|-------------|---------|---------------------|
| HVAC 3.5 Ton | 3.50 | ✅ | Electrical draw depends on SEER; 3.5 ton often ~2.5–4 kW. 3.50 kW is a reasonable estimate. |
| HVAC 3.5 Ton w/ Heat Strip | 8.50 | ✅ | Cooling ~3.5 kW + strip (e.g. ~5 kW) ≈ 8.5 kW; consistent. |
| HVAC 5 Ton | 5.00 | ✅ | 5 ton often ~3–4 kW at good SEER; 5 kW is conservative for planning. |
| HVAC 5 Ton w/ Heat Strip | 12.00 | ✅ | Cooling + larger strip; 12 kW plausible. |
| Furnace / Air Handler Blower | 0.60 | ✅ | PSC blowers 400–800 W; ECM 80–400 W. 0.60 kW is a good average. |
| Water Pump (Hygiene Center) | 0.30 | ✅ | Small pumps in this range; 0.30 kW reasonable. |
| Sump Pump (Hygiene Center) | 0.50 | ✅ | ½ HP ≈ 370 W electrical; 0.50 kW is a good estimate. |
| Portable Sink Pump (Hygiene Station) | 0.30 | ✅ | Small pump; 0.30 kW reasonable. |
| Portable Shower Pump | 0.50 | ✅ | Similar to sump; 0.50 kW in range. |
| Bladder Fill / Transfer Pump | 0.75 | ⚠️ | No direct data; 0.75 kW is a plausible estimate for larger transfer pump. |
| Air Shelter Inflator | 1.50 | ⚠️ | Some commercial inflators ~2.2 kW; 1.5 kW is reasonable for smaller/single-motor units. |
| Tactical Stringable Lights | 0.30 | ⚠️ | No direct data; 0.30 kW is a reasonable estimate per string/segment. |
| External Work Light (20K Lumens) | 0.20 | ✅ | 20K lumen LED work lights often ~200 W; 0.20 kW correct. |
| LED Work Light Tower | 0.30 | ✅ | Multiple heads/small tower; 0.30 kW plausible. |
| Portable LED Work Light | 0.20 | ✅ | Similar to 20K lumen class; 0.20 kW in range. |

---

## Summary of suggested changes

| Item | Current kW | Suggested kW | Reason |
|------|------------|--------------|--------|
| Suction Machine | 0.15 | **0.05** | Typical units 40–48 W. |
| Portable Oxygen Concentrator | 0.30 | **0.10** | Portable units 45–120 W; 0.10 kW is a safe average. |
| Small Lab Centrifuge | 0.30 | **0.05** | Small/mini centrifuges 18–45 W; use 0.30 only if meaning larger benchtop. |
| Anesthesia Machine | 0.80 | **0.12** or **0.15** | Published active use 58–136 W. |
| Portable Ventilator | 0.60 | **0.20** (optional) | Many modern portables 50–150 W; 0.60 kW is worst-case. |

All other values are either accurate or acceptably conservative for generator/load planning. Optional tweaks (e.g. Portable Ventilator, Sequential Compression Device) can stay as-is if you prefer to plan for worst-case or older equipment.
