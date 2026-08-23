import React from "react";
import { processWindRiskHeatmap } from "../lib/windRose";

export function WindRiskHeatmap({ speedData, t }) {
  if (!speedData) {
    return <div className="text-gray-500">{t?.("noData") || "No data available"}</div>;
  }

  const data = processWindRiskHeatmap(speedData);
  if (!data) return <div className="text-gray-500">{t?.("noData") || "No data available"}</div>;

  const { heatmapData, months, highWindThreshold } = data;

  // Color scale: blue (low) → red (high) - matching reference image
  const getColor = (percentage) => {
    const value = parseFloat(percentage);
    if (value <= 0) return "#0466cc";
    if (value < 5) return "#4da6ff";
    if (value < 10) return "#99ccff";
    if (value < 15) return "#ffcc99";
    if (value < 20) return "#ff9933";
    return "#cc0000";
  };

  const cellSize = 28;
  const labelWidth = 45;
  const hourLabelHeight = 35;

  const [hoveredCell, setHoveredCell] = React.useState(null);

  return (
    <div style={{ width: "100%", backgroundColor: "#ffffff", borderRadius: "8px", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)"}}>
      <div style={{display: "flex", alignItems: "center" , justifyContent: "center",fontWeight: "600", fontSize: "14px", color: "#000610"}}>

        <p style={{ margin: 0, fontSize: "11px", color: "#000610" }}>
          {t?.("windRiskDescription") || `Përqindja e orëve me shpejtësi ≥ ${highWindThreshold} m/s / Percentage of hours with wind speed ≥ ${highWindThreshold} m/s`}
        </p>
      </div>

      <div style={{ overflowX: "auto", position: "relative" }}>
        <svg
          viewBox={`0 0 ${labelWidth + 24 * cellSize + 60} ${hourLabelHeight + months.length * cellSize + 80}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            display: "block",
            width: "100%",
            height: "600px",
            // below this the 24 hourly columns stop being readable, so the
            // wrapper scrolls rather than shrinking them further
            minWidth: `${labelWidth + 24 * cellSize + 60}px`,
          }}
        >
          {/* Y-axis label */}
          <text
            x={15}
            y={hourLabelHeight + (months.length * cellSize) / 2}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#475569"
            transform={`rotate(-90 15 ${hourLabelHeight + (months.length * cellSize) / 2})`}
          >
            {t?.("month") || "Month"}
          </text>

          {/* Hour labels */}
          {Array.from({ length: 24 }).map((_, hour) => (
            <text
              key={`hour-${hour}`}
              x={labelWidth + hour * cellSize + cellSize / 2}
              y={hourLabelHeight - 6}
              textAnchor="middle"
              fontSize="9"
              fontWeight="500"
              fill="#475569"
            >
              {hour.toString().padStart(2, '0')}
            </text>
          ))}

          {/* Month labels and cells */}
          {months.map((month, monthIdx) => (
            <g key={`month-${month}`}>
              <text
                x={labelWidth - 6}
                y={hourLabelHeight + monthIdx * cellSize + cellSize / 2}
                textAnchor="end"
                dy="0.3em"
                fontSize="9"
                fontWeight="500"
                fill="#475569"
              >
                {month}
              </text>

              {Array.from({ length: 24 }).map((_, hour) => {
                const percentage = parseFloat(heatmapData[month][hour]);
                const color = getColor(heatmapData[month][hour]);
                const cellKey = `${month}-${hour}`;
                const isHovered = hoveredCell === cellKey;

                return (
                  <g key={`cell-${month}-${hour}`}>
                    <rect
                      x={labelWidth + hour * cellSize}
                      y={hourLabelHeight + monthIdx * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={isHovered ? "2" : "1"}
                      style={{ cursor: "pointer", transition: "all 0.15s" }}
                      opacity={isHovered ? 1 : 0.9}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                    {isHovered && (
                      <title>
                        {month} {hour.toString().padStart(2, '0')}:00 - {percentage.toFixed(2)}%
                      </title>
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* Border */}
          <rect
            x={labelWidth}
            y={hourLabelHeight}
            width={24 * cellSize}
            height={months.length * cellSize}
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1"
          />

          {/* X-axis label */}
          <text
            x={labelWidth + 12 * cellSize}
            y={hourLabelHeight + months.length * cellSize + 40}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#475569"
          >
            {t?.("hourOfDay") || "Hour of Day"}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "0%", color: "#0466cc" },
            { label: "< 5%", color: "#4da6ff" },
            { label: "5-10%", color: "#99ccff" },
            { label: "10-15%", color: "#ffcc99" },
            { label: "15-20%", color: "#ff9933" },
            { label: "> 20%", color: "#cc0000" },
          ].map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: item.color,
                  border: "1px solid #d1d5db",
                }}
              />
              <span style={{ fontSize: "10px", color: "#6b7280" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid #e5e7eb", fontSize: "9px", color: "#9ca3af" }}>
        <p style={{ margin: 0, marginBottom: "4px" }}>
          {t?.("dataSource") || "Source: direct monitoring data"}
        </p>
        <p style={{ margin: 0 }}>
          {t?.("wmoStandard") || "WMO standard for meteorological data representation (WMO-No. 8, Guide to Meteorological Instruments and Methods of Observation, 2018 Ed.)"}
        </p>
      </div>
    </div>
  );
}
