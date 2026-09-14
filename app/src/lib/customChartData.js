// Presentation adapters: preserve plotted values and coverage; never infer events.
export const columns = entries => entries.map(([key, label]) => ({ key, label }));
export const statusColumn = { key: "status", label: "Status", display: (value, row, t) => t({ missing: "chartStatusMissing", excluded: "chartStatusExcluded", observed: "chartStatusObserved" }[value]) };

export function windRoseRows(result) {
  return result.directions.flatMap(direction => result.speedRanges.map(bin => ({
    direction, bin: bin.label, count: result.binCounts[direction][bin.label],
    percentage: result.stats.totalRecords ? Number(result.windRose[direction][bin.label]) : null,
    directionMean: result.directionMeanSpeeds[direction] == null ? null : Number(result.directionMeanSpeeds[direction]),
  })));
}
export const windRoseColumns = columns([["direction", "Direction"], ["bin", "Speed bin (m/s)"], ["count", "Records"], ["percentage", "Share of all records (%)"], ["directionMean", "Direction mean speed (m/s)"]]);

export function windRiskRows(result) {
  return result.months.flatMap((month, i) => Array.from({ length: 24 }, (_, hour) => {
    const cell = result.observations[month][hour];
    return { month: i + 1, hour, percentage: cell.count ? Number(result.heatmapData[month][hour]) : null,
      observed: cell.count > 0, count: cell.count, highRiskCount: cell.highRiskCount, threshold: result.highWindThreshold };
  }));
}
export const windRiskColumns = columns([["month", "Month"], ["hour", "Hour"], ["percentage", "Strong-wind hours (%)"], ["observed", "Observed"], ["count", "Observed records"], ["highRiskCount", "Strong-wind records"], ["threshold", "Strong-wind threshold (m/s)"]]);

export function monthYearRows(result) {
  return result.years.flatMap(year => Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    const cell = result.cells.get(key), excluded = result.excludedCells.get(key);
    return { year, month: i + 1, value: cell?.value ?? null, observedDays: cell?.observedDays ?? excluded?.observedDays ?? 0,
      status: cell ? "observed" : excluded ? "excluded" : "missing" };
  }));
}
export const monthYearColumns = unit => [...columns([["year", "Year"], ["month", "Month"], ["value", `Displayed mean (${unit})`], ["observedDays", "Observed days"]]), statusColumn];

export function matrixRows(yearly) {
  return yearly.flatMap(year => year.months.map(month => ({ year: year.year, month: month.month,
    count: month.count, available: month.available, partial: month.isPartial,
    coverageStart: year.availableStart, coverageEnd: year.availableEnd, partialYear: year.isPartial })));
}
export const matrixColumns = columns([["year", "Year"], ["month", "Month"], ["count", "Qualifying days"], ["available", "Available"], ["partial", "Partial month"], ["partialYear", "Partial year"], ["coverageStart", "Coverage start"], ["coverageEnd", "Coverage end"]]);

export function dryTimelineRows(yearly) {
  return yearly.flatMap(year => {
    const coverage = { year: year.year, coverageStart: year.availableStart, coverageEnd: year.availableEnd, partial: year.isPartial };
    return [{ ...coverage, type: "Coverage" }, ...year.runs.filter(run => run.length >= 5).map(run => ({
      ...coverage, type: "Dry spell", start: run.startDate, end: run.endDate, days: run.length,
      category: run.length >= 7 ? "At least 7 days" : "5–6 days",
    }))];
  });
}
export const dryTimelineColumns = columns([["type", "Row type"], ["year", "Year"], ["start", "Event start"], ["end", "Event end"], ["days", "Duration (days)"], ["category", "Category"], ["partial", "Partial coverage"], ["coverageStart", "Coverage start"], ["coverageEnd", "Coverage end"]]);

export function compoundTimelineRows(yearly) {
  return yearly.flatMap(year => {
    const coverage = { year: year.year, coverageStart: year.availableCommonStart, coverageEnd: year.availableCommonEnd, partial: year.isPartial };
    return [{ ...coverage, type: "Coverage" },
      ...year.dryRuns.map(run => ({ ...coverage, type: "Dry spell", start: run.startDate, end: run.endDate, days: run.length, inside7: run.length >= 7 })),
      ...year.hotDayDates.map(date => ({ ...coverage, type: "Hot day", start: date, end: date, temperature: year.hotDayTemperatures[date],
        inside5: year.compound5Dates.includes(date), inside7: year.compound7Dates.includes(date) }))];
  });
}
export const compoundTimelineColumns = columns([["type", "Row type"], ["year", "Year"], ["start", "Start date"], ["end", "End date"], ["days", "Duration (days)"], ["temperature", "Daily maximum (°C)"], ["inside5", "Within dry spell of at least 5 days"], ["inside7", "Within dry spell of at least 7 days"], ["partial", "Partial coverage"], ["coverageStart", "Common coverage start"], ["coverageEnd", "Common coverage end"]]);
