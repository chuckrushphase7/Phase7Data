// events.js
// Data-only config for Phase 7 events.

const EVENTS = [
  // BLUE GUITAR PARK – single clear icon with rich popup text
  {
    id: "blue_guitar_scene",
    type: "santa",
    label: "Santa & Sleigh at Blue Guitar Park",
    siteId: "BlueGuitarPark",     // must match mapped_sites.js
    phaseNumber: 7,
    isActive: true,
    requiresUnlock: false,
    seasons: [],                   // [] = all seasons, always visible
    description:
      "Join us at Blue Guitar Park for a magical picture with Santa and His Sleigh."
  },

  // Global snow overlay tied to the same scene
  {
    id: "blue_guitar_snow",
    type: "snow",
    label: "Snow at the Park",
    siteId: "BlueGuitarPark",
    phaseNumber: 7,
    isActive: true,
    requiresUnlock: false,
    seasons: [],                   // all seasons (you can tighten later)
    snowOverlay: true,
    description: " "
  },

  // Example lot-based event (currently off)
  {
    id: "lot_1906_special",
    type: "santa",
    label: "Santa Stop (Lot 1906)",
    lotNumber: 1906,
    phaseNumber: 7,
    isActive: false,               // turn on when needed
    requiresUnlock: false,
    seasons: [],
    description: "Santa makes a special stop at Lot 1906."
  },

  // ALLIGATOR / WILDLIFE AT POND4
  {
    id: "alligator_pond4",
    type: "alligator",
    label: "Alligator Sighting",
    siteId: "Pond4",
    phaseNumber: 7,
    isActive: true,
    requiresUnlock: false,
    seasons: [],                   // all seasons
    description: "Wildlife reminder: use caution around water."
  }
];
