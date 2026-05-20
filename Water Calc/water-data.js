/**
 * Water Requirements Calculator - Default rates and storage presets
 * All volumes are US gallons (Gal). Based on typical field hospital / Sphere-style guidelines.
 */

var WATER_DEFAULTS = {
  // Deployment
  days: 0,
  beds: 0,
  bufferPercent: 0,

  // Water demand (Gal per bed per day)
  potablePerBedPerDay: 22,        // Drinking, handwashing, clinical use, cleaning (potable)
  wastewaterPerBedPerDay: 18,     // Total wastewater output (Gal per bed per day)

  // Supply/disposal defaults
  potableSupplyMode: 'self',
  wastewaterDisposalMode: 'containers',
  mainsFlowRate: 0,               // Gal per hour

  // Storage containers: user-entered (count × capacity in Gal). Supports bladder tanks,
  // IBC totes, pillow tanks, or fixed cisterns. No default values — user-entered.
  potableContainerCount: 0,
  potableContainerCapacity: 0,
  wastewaterContainerCount: 0,
  wastewaterContainerCapacity: 0
};
