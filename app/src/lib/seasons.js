// Canonical meteorological seasons, shared by every seasonal chart so the
// month grouping and colours cannot drift apart between indicators.
export const SEASON_DEFINITIONS = [
  { id: "spring", months: [3, 4, 5], color: "#4a9d4a" },
  { id: "summer", months: [6, 7, 8], color: "#c63a2b" },
  { id: "autumn", months: [9, 10, 11], color: "#e0a52b" },
  { id: "winter", months: [12, 1, 2], color: "#2b7fc4" },
];

export function seasonOf(month) {
  return SEASON_DEFINITIONS.find((season) => season.months.includes(month)) ?? null;
}
