import { calculateHeavySnowfall } from "./heavySnowfall.js";

export function calculateSnowfall(rainfallInput, temperatureInput) {
  const base = calculateHeavySnowfall(rainfallInput, temperatureInput);
  if (!base.yearly.length) {
    return {
      joinedDaily: base.joinedDaily,
      events: [],
      qualifyingDates: [],
      monthlyCounts: [],
      annualTotals: [],
      commonCoverage: [],
      yearly: [],
    };
  }

  const events = base.joinedDaily.filter((row) => row.precipitation > 1 && row.meanTemperature < 0);
  const counts = new Map();
  events.forEach((event) => {
    const key = event.date.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const yearly = base.yearly.map((baseYear) => {
    const months = baseYear.months.map((baseMonth) => ({
      ...baseMonth,
      count: baseMonth.available ? (counts.get(`${baseYear.year}-${String(baseMonth.month).padStart(2, "0")}`) ?? 0) : null,
    }));
    const monthlyCounts = months.map((month) => month.count);
    return {
      ...baseYear,
      months,
      monthlyCounts,
      annualTotal: monthlyCounts.reduce((sum, count) => sum + (count ?? 0), 0),
    };
  });

  return {
    joinedDaily: base.joinedDaily,
    events,
    qualifyingDates: events.map((event) => event.date),
    monthlyCounts: yearly.map(({ year, monthlyCounts }) => ({ year, counts: monthlyCounts })),
    annualTotals: yearly.map(({ year, annualTotal }) => ({ year, total: annualTotal })),
    commonCoverage: yearly.map(({ year, availableStart, availableEnd, isPartial }) => ({ year, start: availableStart, end: availableEnd, isPartial })),
    yearly,
  };
}
