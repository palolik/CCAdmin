// Ad placements on the user site's home page. `key` is the value stored in advertisement.location.
// Keep in sync with CCUser/src/userside/userhome/ads/adSlots.js and
// cloudcompanyserver/scripts/seedPlaceholderAds.js.
export const AD_SLOTS = [
  { key: "Header", label: "Header banner", where: "Home page, just below the hero", width: 1200, height: 150 },
  { key: "Homepage Banner", label: "Homepage banner", where: "Home page, above Packages", width: 1200, height: 400 },
  { key: "Footer", label: "Footer banner", where: "Home page, just above the footer", width: 1200, height: 150 },
  { key: "hls", label: "Home left sidebar", where: "Fixed on the left edge (wide screens only)", width: 160, height: 600 },
  { key: "hrs", label: "Home right sidebar", where: "Fixed on the right edge (wide screens only)", width: 160, height: 600 },
  { key: "Sidebar", label: "Both home sidebars", where: "Left and right edges (wide screens only)", width: 160, height: 600 },
  { key: "Popup", label: "Popup", where: "Home page popup, once per visit after 4s", width: 600, height: 600 },
];

export const slotFor = (location) =>
  AD_SLOTS.find((s) => s.key.toLowerCase() === (location || "").toLowerCase());

export const sizeText = (slot) => (slot ? `${slot.width} × ${slot.height} px` : "Unknown size");
