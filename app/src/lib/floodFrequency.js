// Water-level 5: how rare a water level of a given size is, from the annual
// maxima. The method is standard (Gringorten plotting positions, a Gumbel fit
// by least squares on the reduced variate) but the record behind it is six
// years long, so the extrapolation is capped and the chart is labelled
// illustrative — this is the figure most likely to be read as more
// authoritative than the data supports.
import { linearFit, readSeries, yearCoverage, yearOf } from "./seriesUtils.js";

function emptyResult() {
  return { points: [], curve: [], fit: null, years: 0, completeYears: 0, maxReturnPeriod: null };
}

const reducedVariate = (probability) => -Math.log(-Math.log(probability));

export function calculateFloodFrequency(dailyRecords, { returnPeriodFactor = 3 } = {}) {
  // the daily maximum, not the daily mean: an annual maximum built from means
  // reports a flood peak no gauge ever measured
  const rows = readSeries(dailyRecords, { field: "hi" });
  if (!rows.length) return emptyResult();

  const coverage = yearCoverage(rows);
  const byYear = new Map();
  for (const row of rows) {
    const year = yearOf(row.key);
    const best = byYear.get(year);
    if (!best || row.value > best.value) byYear.set(year, { year, value: row.value, date: row.key.slice(0, 10) });
  }

  const maxima = [...byYear.values()].sort((a, b) => a.value - b.value);
  const n = maxima.length;
  if (n < 3) return { ...emptyResult(), years: n };

  // Gringorten positions, ascending rank — less biased than Weibull for a
  // Gumbel-distributed sample, which is why the spec names them
  const points = maxima.map((row, index) => {
    const rank = index + 1;
    const probability = (rank - 0.44) / (n + 0.12);
    return {
      ...row,
      probability,
      returnPeriod: 1 / (1 - probability),
      variate: reducedVariate(probability),
      partial: coverage.get(row.year)?.partial ?? false,
      observedDays: coverage.get(row.year)?.observedDays ?? 0,
    };
  });

  // partial years stay in the fit: dropping them from a six-point sample costs
  // more than the bias of keeping a year that may not contain its true maximum
  const fit = linearFit(points.map((point) => ({ x: point.variate, y: point.value })));
  if (!fit) return { ...emptyResult(), years: n };

  const maxReturnPeriod = returnPeriodFactor * n;
  const curve = [];
  const steps = 120;
  const from = Math.log(1.05);
  const to = Math.log(maxReturnPeriod);
  for (let step = 0; step <= steps; step += 1) {
    const returnPeriod = Math.exp(from + ((to - from) * step) / steps);
    const probability = 1 - 1 / returnPeriod;
    const variate = reducedVariate(probability);
    const value = fit.at(variate);
    // prediction interval of the fitted line, widening away from the centre of
    // the observed variates — the visible cost of a six-year record
    const halfWidth = 1.96 * fit.standardError * Math.sqrt(1 / fit.n + (variate - fit.meanX) ** 2 / fit.sxx);
    curve.push({
      returnPeriod: +returnPeriod.toFixed(3),
      value,
      lower: value - halfWidth,
      upper: value + halfWidth,
      band: 2 * halfWidth,
    });
  }

  return {
    points,
    curve,
    fit: { slope: fit.slope, intercept: fit.intercept, standardError: fit.standardError },
    years: n,
    completeYears: points.filter((point) => !point.partial).length,
    maxReturnPeriod,
    start: rows[0].key.slice(0, 10),
    end: rows.at(-1).key.slice(0, 10),
  };
}
