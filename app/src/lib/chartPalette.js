// Shared semantic colours. Severity retains the existing ordered warning bands.
export const CHART_PALETTE = {
  rainfall: "#2b7fc4",
  reference: "#475569",
  noData: "#64748b",
  severity: { light: "#7fb3d5", moderate: "#e8c33c", heavy: "#e08a2b", extreme: "#c63a2b" },
};
export const REFERENCE_DASH = "6 4";

// Text over custom heatmap fills: choose the higher-contrast black/white pair.
export function contrastingText(color) {
  const rgb = color.startsWith("#") ? [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)) : color.match(/[\d.]+/g).slice(0, 3).map(Number);
  const linear = rgb.map(v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#000000" : "#ffffff";
}

export const SERIES_DASHES = ["", "10 3", "3 3", "10 3 3 3", "2 3 2 3 8 3", "14 4 2 4"];
