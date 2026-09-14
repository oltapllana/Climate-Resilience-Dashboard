// Fill calendar months that are only partly covered by the record.
export function effectiveClimatology(meas) {
  const out = (meas.climatology || []).map((c) => ({ ...c }));
  const have = new Set(out.map((c) => c.month));
  const stats = meas.stats || {};
  for (const row of meas.monthly || []) {
    if (!row.partial || row.v == null) continue;
    const month = Number(row.m.slice(5, 7));
    if (have.has(month)) continue;
    let value = row.v;
    if (meas.kind === "sum") {
      const year = Number(row.m.slice(0, 4));
      const daysInMonth = new Date(year, month, 0).getDate();
      let coveredDays = daysInMonth;
      if (stats.start && stats.start.slice(0, 7) === row.m) coveredDays -= Number(stats.start.slice(8, 10)) - 1;
      if (stats.end && stats.end.slice(0, 7) === row.m) coveredDays -= daysInMonth - Number(stats.end.slice(8, 10));
      if (coveredDays > 0 && coveredDays < daysInMonth) value = (value * daysInMonth) / coveredDays;
    }
    have.add(month);
    out.push({ month, v: Math.round(value * 1000) / 1000, est: true });
  }
  return Array.from({ length: 12 }, (_, index) => {
    const row = out.find(c => c.month === index + 1);
    return { ...row, month: index + 1, v: row?.v ?? null, available: row?.v != null };
  });
}

// Reference support is per calendar month, not a count of year prefixes.
// Keep the supplied climatological value and existing departure calculation.
export function monthlyAnomalies(series) {
  const support = new Map();
  for (const row of series.monthly || []) {
    if (row.partial || row.v == null || !Number.isFinite(Number(row.v))) continue;
    const month = Number(row.m.slice(5, 7));
    if (!support.has(month)) support.set(month, new Set());
    support.get(month).add(row.m.slice(0, 4));
  }
  const climatology = new Map((series.climatology || []).map(c => [c.month, c.v]));
  return (series.monthly || []).map(row => {
    const month = Number(row.m.slice(5, 7));
    const base = climatology.get(month);
    const referenceYears = support.get(month)?.size ?? 0;
    const available = referenceYears >= 2 && !row.partial && row.v != null && base != null;
    const difference = available ? row.v - base : null;
    return { m: row.m, anom: !available ? null : +(series.circular ? ((difference + 540) % 360) - 180 : difference).toFixed(3), available, referenceYears, partial: !!row.partial };
  });
}
