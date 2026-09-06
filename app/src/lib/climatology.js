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
  return out.sort((a, b) => a.month - b.month);
}