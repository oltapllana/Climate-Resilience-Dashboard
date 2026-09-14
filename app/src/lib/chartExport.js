export function csvText(rows, columns) {
  const escape = value => {
    if (value == null || (typeof value === "number" && !Number.isFinite(value))) return "";
    let text = String(value);
    // Keep numeric values numeric; prevent spreadsheet formula execution in text.
    if (typeof value === "string" && /^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return "\uFEFF" + [columns.map(c => escape(c.label ?? c.key)).join(","),
    ...rows.map(row => columns.map(c => escape(c.value ? c.value(row) : row[c.key])).join(","))].join("\r\n");
}

export function exportFilename(station, indicator, extension) {
  const slug = value => String(value || "chart").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80);
  return `podujeva_${slug(station || "station")}_${slug(indicator)}.${extension}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Serialize only the rendered chart's SVG, with computed styles inlined. HTML
// headings, callouts and Recharts legends become SVG text above the plot; no
// foreignObject or external raster assets are needed, keeping canvas untainted.
export async function chartPng(frame, title) {
  const source = frame.querySelector("svg.recharts-surface") ?? frame.querySelector("svg");
  if (!source) throw new Error("Chart has not rendered");
  const ns = "http://www.w3.org/2000/svg";
  const node = (name, attrs = {}) => { const n = document.createElementNS(ns, name); for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,String(v)); return n; };
  const width = Math.max(480, source.viewBox.baseVal.width || source.getBoundingClientRect().width);
  const height = source.viewBox.baseVal.height || source.getBoundingClientRect().height;
  if (!height) throw new Error("Chart has no size");
  const root = node("svg", { xmlns: ns, width: width + 48 });
  let y = 28;
  function textLines(text, size = 14) {
    const words = String(text).split(/\s+/); let line = "";
    const max = Math.max(24, Math.floor(width / (size * 0.56)));
    for (const word of [...words, ""]) {
      if ((line.length + word.length > max || !word) && line) {
        const el = node("text", { x: 24, y, fill: "#1f2937", "font-family": "Arial, sans-serif", "font-size": size });
        el.textContent = line; root.append(el); y += size + 7; line = "";
      }
      line += (line ? " " : "") + word;
    }
  }
  textLines(title, 18);
  const context = frame.closest(".indicator-panel, .chart-card, section.card") ?? frame.parentElement;
  for (const p of context.querySelectorAll(":scope > .indicator-callout, :scope > .chart-axis-note")) textLines(p.textContent);
  for (const p of frame.querySelectorAll("[data-export-caption]")) textLines(p.textContent);
  for (const p of context.querySelectorAll(":scope > [data-export-caption]")) textLines(p.textContent);
  // Custom charts explicitly mark their HTML legend items and swatches.
  // These are presentation content only; CSV always uses the supplied rows.
  for (const item of frame.querySelectorAll("[data-export-legend-item]")) {
    const swatch = item.querySelector("[data-export-swatch]");
    if (swatch) {
      const style = getComputedStyle(swatch);
      const rounded = parseFloat(style.borderRadius) > 5;
      root.append(node(rounded ? "circle" : "rect", rounded
        ? { cx: 31, cy: y - 5, r: 6, fill: style.backgroundColor, stroke: style.borderColor }
        : { x: 24, y: y - 12, width: 16, height: 12, fill: style.backgroundColor, stroke: style.borderColor, "stroke-dasharray": style.borderStyle === "dashed" ? "3 2" : "none" }));
    }
    const before = root.childNodes.length;
    textLines(item.textContent, 13);
    [...root.childNodes].slice(before).forEach(el => el.setAttribute("x", "48"));
  }
  // Keep legend symbols as well as names, including dashed line samples.
  for (const item of frame.querySelectorAll(".recharts-legend-item")) {
    const symbol = item.querySelector("svg");
    if (symbol) {
      const sample = symbol.cloneNode(true);
      sample.setAttribute("x", "24"); sample.setAttribute("y", String(y - 12));
      sample.setAttribute("width", "16"); sample.setAttribute("height", "14");
      root.append(sample);
    }
    const before = root.childNodes.length;
    textLines(item.textContent, 13);
    [...root.childNodes].slice(before).forEach(el => el.setAttribute("x", "48"));
  }
  const clone = source.cloneNode(true);
  const originals = [source, ...source.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  const properties = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray", "stroke-opacity", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline", "opacity", "paint-order"];
  originals.forEach((el, i) => { const style = getComputedStyle(el); properties.forEach(p => {
    const value = style.getPropertyValue(p).replace(/url\(["']?[^)"']*#([^)'"\s]+)["']?\)/g, "url(#$1)");
    copies[i].style.setProperty(p, value);
  }); });
  clone.setAttribute("x", "24"); clone.setAttribute("y", String(y + 8)); clone.setAttribute("width", String(width)); clone.setAttribute("height", String(height));
  for (const property of ["width", "height", "min-width", "max-width", "min-height", "max-height"]) clone.style.removeProperty(property);
  clone.style.overflow = "visible"; root.append(clone);
  const totalHeight = Math.ceil(y + height + 40);
  root.setAttribute("height", String(totalHeight));
  root.setAttribute("viewBox", `0 0 ${width + 48} ${totalHeight}`);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise((resolve,reject) => { img.onload = resolve; img.onerror = () => reject(new Error("SVG rendering failed")); img.src = url; });
    const canvas = document.createElement("canvas"); canvas.width = (width + 48) * 2; canvas.height = totalHeight * 2;
    const ctx = canvas.getContext("2d"); ctx.scale(2,2); ctx.fillStyle = "white"; ctx.fillRect(0,0,width+48,totalHeight); ctx.drawImage(img,0,0);
    return await new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG encoding failed")), "image/png"));
  } finally { URL.revokeObjectURL(url); }
}
