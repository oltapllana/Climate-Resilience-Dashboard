import { useMemo, useState } from "react";
import { calculateMonthYearGrid, rampColor, readableTextColor } from "../lib/monthYearGrid.js";

// Rrezatimi 4 — month x year grid, warmer colour meaning a higher value.
// Drawn as SVG rather than a chart library: a categorical grid with a value in
// every cell is not something Recharts models well.
const CELL_WIDTH = 78;
const CELL_HEIGHT = 30;
const LABEL_WIDTH = 74;
const HEADER_HEIGHT = 28;
const BAR_WIDTH = 16;
const BAR_GAP = 26;

export default function MonthYearHeatmap({ measurement, unit, title, description, scaleLabel, explanation, assumption, digits = 0, t }) {
  const result = useMemo(() => calculateMonthYearGrid(measurement?.daily), [measurement]);
  const [hovered, setHovered] = useState(null);

  if (!result.years.length) return null;

  const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
  const { years, cells, min, max, hottest, coldest } = result;
  const span = max - min || 1;
  const fractionOf = (value) => (value - min) / span;

  const gridWidth = years.length * CELL_WIDTH;
  const gridHeight = 12 * CELL_HEIGHT;
  const width = LABEL_WIDTH + gridWidth + BAR_GAP + BAR_WIDTH + 62;
  const height = HEADER_HEIGHT + gridHeight + 34;

  // five evenly spaced ticks down the colour bar, high value at the top
  const ticks = Array.from({ length: 5 }, (_, index) => min + (span * index) / 4).reverse();

  return (
    <section className="card landslide-indicator">
      <div className="indicator-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <p className="indicator-callout">
        {t("max")}: <strong>{t("monthsFull")[hottest.monthNumber - 1]} {hottest.year} ({format(hottest.value)} {unit})</strong> · {t("min")}: <strong>{t("monthsFull")[coldest.monthNumber - 1]} {coldest.year} ({format(coldest.value)} {unit})</strong>
      </p>

      <div style={{ overflowX: "auto" }}>
        <svg width={width} height={height} style={{ display: "block" }} role="img">
          {years.map((year, columnIndex) => (
            <text
              key={`year-${year}`}
              x={LABEL_WIDTH + columnIndex * CELL_WIDTH + CELL_WIDTH / 2}
              y={HEADER_HEIGHT - 9}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#475569"
            >
              {year}
            </text>
          ))}

          {Array.from({ length: 12 }, (_, rowIndex) => {
            const monthNumber = rowIndex + 1;
            return (
              <g key={`row-${monthNumber}`}>
                <text
                  x={LABEL_WIDTH - 8}
                  y={HEADER_HEIGHT + rowIndex * CELL_HEIGHT + CELL_HEIGHT / 2}
                  textAnchor="end"
                  dy="0.34em"
                  fontSize="11"
                  fill="#475569"
                >
                  {t("monthsFull")[rowIndex]}
                </text>

                {years.map((year, columnIndex) => {
                  const cell = cells.get(`${year}-${String(monthNumber).padStart(2, "0")}`);
                  const x = LABEL_WIDTH + columnIndex * CELL_WIDTH;
                  const y = HEADER_HEIGHT + rowIndex * CELL_HEIGHT;
                  const key = `${year}-${monthNumber}`;
                  if (!cell) {
                    // no observations: left blank, never drawn as a zero
                    return <rect key={key} x={x} y={y} width={CELL_WIDTH} height={CELL_HEIGHT} fill="#fbfcfd" stroke="#eef2f6" strokeWidth="1" />;
                  }
                  const fraction = fractionOf(cell.value);
                  const isHovered = hovered === key;
                  return (
                    <g key={key} onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}>
                      <rect
                        x={x}
                        y={y}
                        width={CELL_WIDTH}
                        height={CELL_HEIGHT}
                        fill={rampColor(fraction)}
                        stroke={isHovered ? "#17242b" : "#ffffff"}
                        strokeWidth={isHovered ? 2 : 1}
                        style={{ cursor: "pointer" }}
                      />
                      <text
                        x={x + CELL_WIDTH / 2}
                        y={y + CELL_HEIGHT / 2}
                        textAnchor="middle"
                        dy="0.34em"
                        fontSize="11"
                        fontWeight="700"
                        fill={readableTextColor(fraction)}
                        style={{ pointerEvents: "none" }}
                      >
                        {format(cell.value)}
                      </text>
                      <title>
                        {`${t("monthsFull")[rowIndex]} ${year} — ${format(cell.value)} ${unit} (${cell.observedDays} ${t("observedDays").toLowerCase()})`}
                      </title>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* colour bar */}
          <defs>
            <linearGradient id="monthYearScale" x1="0" y1="1" x2="0" y2="0">
              {Array.from({ length: 11 }, (_, index) => (
                <stop key={index} offset={`${index * 10}%`} stopColor={rampColor(index / 10)} />
              ))}
            </linearGradient>
          </defs>
          <rect
            x={LABEL_WIDTH + gridWidth + BAR_GAP}
            y={HEADER_HEIGHT}
            width={BAR_WIDTH}
            height={gridHeight}
            fill="url(#monthYearScale)"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          {ticks.map((value, index) => (
            <text
              key={`tick-${index}`}
              x={LABEL_WIDTH + gridWidth + BAR_GAP + BAR_WIDTH + 6}
              y={HEADER_HEIGHT + (gridHeight * index) / 4}
              dy={index === 0 ? "0.9em" : index === 4 ? "0em" : "0.34em"}
              fontSize="10"
              fill="#475569"
            >
              {format(value)}
            </text>
          ))}
          <text
            x={LABEL_WIDTH + gridWidth + BAR_GAP + BAR_WIDTH + 52}
            y={HEADER_HEIGHT + gridHeight / 2}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#475569"
            transform={`rotate(-90 ${LABEL_WIDTH + gridWidth + BAR_GAP + BAR_WIDTH + 52} ${HEADER_HEIGHT + gridHeight / 2})`}
          >
            {scaleLabel}
          </text>

          <text x={LABEL_WIDTH + gridWidth / 2} y={height - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            {t("year")}
          </text>
        </svg>
      </div>

      <p className="indicator-explanation">{explanation}</p>
      <p className="indicator-assumption">{assumption}</p>
      <p className="indicator-assumption">
        {t("heatmapCellNote").replace("{filled}", result.filledCells)}
        {result.skippedCells > 0 && ` ${t("heatmapSkipped").replace("{n}", result.skippedCells)}`}
      </p>
    </section>
  );
}
