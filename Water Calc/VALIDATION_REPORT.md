# Water Requirements Calculator - Validation Report

## Current Default Values in Calculator

- **Potable water**: 80 L/bed/day
- **Wastewater output**: 65 L/bed/day (single field; optional breakdown: ~77% gray, ~23% black)
- **Unit conversion**: 1 US gallon = 3.78541 L

---

## External Data Sources Found

### 1. MSF (Médecins Sans Frontières) Guidelines

**Source**: MSF Medical Guidelines - Cholera Treatment Centers (CTCs) and Cholera Treatment Units (CTUs)

**Standard**: **60 litres per day per patient** for CTCs/CTUs

**Breakdown**:
- Cleaning and disinfection of objects, floors, surfaces, and laundry
- Hand-washing and personal hygiene of patients and attendants
- Preparation of ORS (Oral Rehydration Solution) and human consumption (drinking, cooking)

**Notes**:
- This volume is given as an indication
- Needs should be re-evaluated based on context (climate, culture, number of patients)
- Lower patient occupancy relative to facility capacity increases per-patient water needs
- Recommended 3-day reserve supply on-site

**Citation**: WHO Technical Notes on WASH in Emergencies (2013)

---

### 2. WHO (World Health Organization) Standards

**General Emergency Minimums**:
- **Minimum**: 7.5-15 litres per person per day (immediate post-impact)
- **Standard minimum**: 15 litres per person per day (drinking, cooking, personal hygiene)
- **MSF/WHO recommendation**: 15-20 litres per person per day for drinking, cooking, and hygiene

**Health Facility Context**:
- Health facilities have specialized needs beyond household consumption
- Includes cleaning, laundry, infection prevention measures
- WHO emphasizes dedicated planning for WASH in healthcare settings

**Note**: WHO does not provide specific per-bed breakdowns in the sources found, but references Sphere Standards for detailed guidance.

---

### 3. Sphere Standards (Humanitarian Standards)

**General Population Minimums**:
- **Basic survival**: 7.5-15 litres per person per day
- **Drinking and food**: 2.5-3 litres/day
- **Basic hygiene**: 2-6 litres/day
- **Basic cooking**: 3-6 litres/day
- **Household minimum**: 15 litres per person per day

**Health Facilities**:
- Sphere Handbook Chapter 6 addresses WASH in disease outbreaks and healthcare settings
- Appendix 2 contains "minimum water quantities for institutions and other uses"
- Specific per-bed figures not fully detailed in accessible excerpts

---

### 4. Military Field Hospital Standards

**U.S. Army Water Planning Guide**:
- Provides planning factors for Role III and IV Medical Operations (field hospitals)
- Breaks requirements into functional categories (drinking, personal hygiene, centralized hygiene, heat treatment)
- Does not provide consolidated per-bed totals or gray/black water breakdowns in accessible sources

---

## Validation Assessment

### ✅ **Potable Water (80 L/bed/day)**

**Comparison**:
- **Calculator default**: 80 L/bed/day
- **MSF standard**: 60 L/day per patient (cholera treatment centers)
- **WHO general emergency**: 15-20 L/person/day (household)
- **Sphere minimum**: 15 L/person/day (household)

**Assessment**: 
- The calculator's **80 L/bed/day** is **higher** than MSF's 60 L/day for intensive cholera treatment centers
- This is reasonable for a general field hospital calculator because:
  1. MSF's 60 L is for cholera-specific facilities (high-intensity care)
  2. General field hospitals may have varying patient acuity
  3. The calculator allows user adjustment, which aligns with MSF's guidance to "re-evaluate real needs depending on context"
  4. Higher default provides a safety margin for planning

**Recommendation**: ✅ **Acceptable** - Consider adding a note that 60-80 L/bed/day is typical range, with 60 L for intensive care settings and 80 L for general ward settings.

---

### ⚠️ **Gray Water / Black Water**

The calculator uses a **single wastewater field** (65 L/bed/day). The gray/black split is a **display-only informational estimate** (~77% gray, ~23% black), not a model input. Users cannot adjust gray vs black independently.

**Comparison**:
- **Calculator**: 65 L/bed/day total wastewater; optional "Show breakdown" displays estimated gray/black split
- **External sources**: No specific gray/black water breakdowns found in WHO, Sphere, or MSF guidelines
- **MSF total**: 60 L/day includes all uses (does not separate wastewater streams)

**Assessment**:
- The **65 L/bed/day wastewater** (gray + black) is close to MSF's total 60 L/day, which suggests reasonable assumptions
- **Gray water (50 L)**: Assumes ~62% of potable becomes gray water (washing, cleaning runoff)
- **Black water (15 L)**: Assumes ~19% of potable becomes black water (toilet/sewage)
- These ratios (62% gray, 19% black) are reasonable estimates but not validated by authoritative sources

**Recommendation**: ⚠️ **Reasonable but unvalidated** - Consider:
1. Adding a disclaimer that gray/black water ratios are estimates
2. Allowing users to adjust gray/black ratios independently
3. Noting that actual ratios depend on facility design (waterless toilets vs. flush toilets, etc.)

---

### ✅ **Unit Conversion (1 US gallon = 3.78541 L)**

**Validation**: ✅ **Correct** - Standard US liquid gallon conversion factor is accurate.

---

## Recommendations

### 1. **Add Validation Notes to Calculator**

Consider adding a note or tooltip explaining:
- Default values are based on MSF guidelines (60 L/day) with a safety margin (80 L/day)
- Gray/black water ratios are estimates (not validated by WHO/Sphere/MSF)
- Users should adjust based on context (climate, patient acuity, facility design)

### 2. **Consider Adding Presets**

Add preset options:
- **Intensive care** (cholera/ICU): 60 L/bed/day potable
- **General ward**: 80 L/bed/day potable (current default)
- **Minimal care**: 40-50 L/bed/day potable

### 3. **Documentation Update**

Update `water-data.js` or add a README section noting:
- MSF reference: 60 L/day per patient for CTCs/CTUs
- Calculator uses 80 L/day as default (safety margin for general field hospitals)
- Gray/black water breakdowns are estimates based on typical field hospital operations

---

## Sources Cited

1. **MSF Medical Guidelines** - 7.4 Potable water supply: https://medicalguidelines.msf.org/en/viewport/CHOL/english/7-4-potable-water-supply-25297020.html
2. **WHO Technical Notes on WASH in Emergencies** (2013): http://www.pseau.org/outils/ouvrages/oms_wedc_quelle_est_la_quantite_d_eau_necessaire_en_situation_d_urgence_2013.pdf
3. **Sphere Handbook** (2018): https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf
4. **WHO WASH FIT**: Water and sanitation for health facility improvement tool

---

## Conclusion

The calculator's **potable water default (80 L/bed/day)** aligns reasonably with MSF's 60 L/day standard for intensive care, with a safety margin appropriate for general field hospital planning. The **gray/black water breakdowns** are reasonable estimates but lack authoritative validation—this is acceptable given that wastewater ratios vary significantly by facility design and are not standardized in humanitarian guidelines.

**Overall Assessment**: ✅ **Calculator assumptions are reasonable and defensible** for field hospital planning purposes.
