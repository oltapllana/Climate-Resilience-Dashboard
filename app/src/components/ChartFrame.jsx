import { Children, isValidElement, createContext, useContext, useEffect, useId, useRef, useState, cloneElement } from "react";
import { ResponsiveContainer } from "recharts";
import { chartPng, csvText, downloadBlob, exportFilename } from "../lib/chartExport.js";

export const ChartContext = createContext({ station: "", t: null });
export default function ChartFrame({ rows, columns, indicator, t: translator, children, custom = false, title: suppliedTitle, description, ...size }) {
  const context = useContext(ChartContext);
  const t = translator ?? context.t;
  const exportId = [context.measurement, indicator].filter(Boolean).join("-");
  const frame = useRef(null); const id = useId();
  const [title, setTitle] = useState(suppliedTitle ?? indicator);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const [open, setOpen] = useState(false); const [page, setPage] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const start = Math.min(page * 100, Math.max(0, Math.floor((rows.length - 1) / 100) * 100));
  const chart = Children.toArray(children).find(isValidElement);
  const chartChildren = !custom && Children.map(chart.props.children, child => isValidElement(child) && reducedMotion
    ? cloneElement(child, { isAnimationActive: false }) : child);
  useEffect(() => {
    const panel = frame.current.closest(".indicator-panel, .chart-card, section.card") ?? frame.current.parentElement;
    setTitle(suppliedTitle || panel.querySelector("h2,h3")?.textContent || indicator);
  }, [t, indicator, suppliedTitle]);
  useEffect(() => {
    if (!custom) return;
    for (const svg of frame.current.querySelectorAll(".custom-chart-content > div svg")) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", title);
      svg.setAttribute("aria-describedby", `${id}-description`);
    }
  }, [custom, title, id]);
  async function png() {
    setBusy(true); setError(false);
    try { downloadBlob(await chartPng(frame.current, [context.station,title].filter(Boolean).join(" · ")), exportFilename(context.station,exportId,"png")); }
    catch { setError(true); } finally { setBusy(false); }
  }
  return <div className={`chart-frame${custom ? " chart-frame--custom" : ""}`} ref={frame} role="group" aria-labelledby={id}>
    <span className="sr-only" id={id}>{title}. {t("chartDataAlternative")}</span>
    <div className="chart-actions">
      <button type="button" disabled={!rows.length} onClick={() => downloadBlob(new Blob([csvText(rows,columns)], { type: "text/csv;charset=utf-8" }),exportFilename(context.station,exportId,"csv"))}>{t("downloadCsv")}</button>
      <button type="button" disabled={busy || !rows.length} onClick={png}>{t(busy ? "exportingPng" : "downloadPng")}</button>
    </div>
    {error && <p role="alert">{t("exportFailed")}</p>}
    {custom && <p id={`${id}-description`} className="chart-axis-note"><span className="sr-only">{description} </span>{t("chartTouchData")}</p>}
    <div className="chart-viewport" tabIndex={0} role="group" aria-label={t("chartScrollLabel", { chart: title })}>
      {custom ? <div className="custom-chart-content">{children}</div> : <ResponsiveContainer {...size}>{cloneElement(chart, { accessibilityLayer: true }, chartChildren)}</ResponsiveContainer>}
    </div>
    <details className="chart-data" onToggle={event => setOpen(event.currentTarget.open)}><summary>{t("viewChartData")}</summary>
      {open && <><p>{t("dataPage", { start: rows.length ? start + 1 : 0, end: Math.min(start + 100, rows.length), total: rows.length })}</p>
      {rows.length > 100 && <div className="chart-actions">
        <button type="button" disabled={!start} onClick={() => setPage(Math.max(0, page - 1))}>{t("previousData")}</button>
        <button type="button" disabled={start + 100 >= rows.length} onClick={() => setPage(page + 1)}>{t("nextData")}</button>
      </div>}
      <div className="chart-table-scroll" tabIndex={0} role="region" aria-label={title}>
        <table><caption>{title}</caption><thead><tr>{columns.map(c => <th scope="col" lang="en" key={c.key}>{c.label ?? c.key}</th>)}</tr></thead>
          <tbody>{rows.slice(start, start + 100).map((row,i) => <tr key={i}>{columns.map(c => {const v = c.value ? c.value(row) : row[c.key];return <td key={c.key}>{c.display ? c.display(v, row, t) : v == null ? t("chartMissingValue") : typeof v === "boolean" ? t(v ? "chartYes" : "chartNo") : typeof v === "number" ? t.number(v) : String(v)}</td>;})}</tr>)}</tbody>
        </table>
      </div></>}
    </details>
  </div>;
}
