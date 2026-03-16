/**
 * Water Requirements Calculator - Default rates and storage presets
 * Rates are per bed per day (L/bed/day). Based on typical field hospital / Sphere-style guidelines.
 */

var WATER_DEFAULTS = {
  // Deployment
  days: 0,
  beds: 0,
  bufferPercent: 0,

  // Default unit: Gallons for US/military planning; Liters for international
  waterUnit: 'G',

  // Water demand (L per bed per day) — stored internally in liters always
  potablePerBedPerDay: 80,        // Drinking, handwashing, clinical use, cleaning (potable)
  wastewaterPerBedPerDay: 65,     // Total wastewater output (L per bed per day)

  // Supply/disposal defaults
  potableSupplyMode: 'self',
  wastewaterDisposalMode: 'containers',
  mainsFlowRate: 0,               // Stored internally in L/hr

  // Storage containers: user-entered (count × capacity). Supports bladder tanks,
  // IBC totes, pillow tanks, or fixed cisterns. No default values — user-entered.
  potableContainerCount: 0,
  potableContainerCapacity: 0,
  wastewaterContainerCount: 0,
  wastewaterContainerCapacity: 0
};
