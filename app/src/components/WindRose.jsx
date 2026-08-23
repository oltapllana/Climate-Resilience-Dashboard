import React from "react";
import { processWindData, SPEED_RANGES } from "../lib/windRose";

const AXIS = "#475569";
const GRID = "#e2e8f0";

export function WindRose({ directionData, speedData, t }) {
  if (!directionData || !speedData) {
    return <div className="text-gray-500">{t?.("noData") || "No data available"}</div>;
  }

  const data = processWindData(directionData, speedData);
  if (!data) return <div className="text-gray-500">{t?.("noData") || "No data available"}</div>;

  const { windRose, stats, directions, directionStats, directionMeanSpeeds } = data;
  const centerX = 200;
  const centerY = 200;
  const radius = 140;
  const ringCount = 5;
  const ringSpacing = radius / ringCount;

  const [hoveredBar, setHoveredBar] = React.useState(null);
  const separator = "|||"; // Use unique separator for splitting

  // Convert polar to cartesian
  const polarToCartesian = (angle, distance) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: centerX + distance * Math.sin(rad),
      y: centerY - distance * Math.cos(rad),
    };
  };

  // Create path for a bar in the wind rose
  const createBarPath = (direction, dirIndex, speedIndex) => {
    const barWidth = 22.5 * 0.7; // degrees, with small gap
    const startAngle = dirIndex * 22.5 - barWidth / 2;
    const endAngle = startAngle + barWidth;

    // Inner and outer radius for this speed category
    const innerRadius = ringSpacing * speedIndex;
    const outerRadius = ringSpacing * (speedIndex + 1);

    const p1 = polarToCartesian(startAngle, innerRadius);
    const p2 = polarToCartesian(startAngle, outerRadius);
    const p3 = polarToCartesian(endAngle, outerRadius);
    const p4 = polarToCartesian(endAngle, innerRadius);

    const largeArc = barWidth > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p3.x} ${p3.y} L ${p4.x} ${p4.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p1.x} ${p1.y}`;
  };

  return (
    <div style={{ width: "100%", backgroundColor: "#ffffff", borderRadius: "8px", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)" }}>
      {/* Main content */}
      <div className="wind-rose-layout">
        {/* Summary */}
        <div className="wind-rose-stats">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", margin: 0 }}>{stats.dateRange}</p>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", margin: 0 }}>Mean wind speed: {stats.meanSpeed} m/s</p>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", margin: 0 }}>Max wind speed: {stats.maxSpeed} m/s</p>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", margin: 0 }}>Calm (&lt;0.5 m/s): {stats.calmPercentage}%</p>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", margin: 0 }}>Total records: {stats.totalRecords > 999 ? (stats.totalRecords / 1000).toFixed(2) + 'K' : stats.totalRecords.toLocaleString()}</p>
        </div>
      </div>

        {/* Wind rose plot */}
        <div className="wind-rose-plot" style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="relative" style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            {/* Tooltip div */}
            {hoveredBar && (() => {
            const [direction, speedLabel] = hoveredBar.split(separator);

            const range = SPEED_RANGES.find(r => r.label === speedLabel);
            if (!range) return null;

            const percentage = windRose[direction]?.[speedLabel];
            if (percentage === undefined) return null;

            const directionTotalCount = directionStats[direction]?.count || 0;
            const directionMeanSpeed = directionMeanSpeeds[direction] || 0;
            const speedRangeCount = Math.round((parseFloat(percentage) / 100) * stats.totalRecords);

            return (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1a202c",
                  color: "white",
                  padding: "16px 20px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: `3px solid ${range.color}`,
                  zIndex: 9999,
                  pointerEvents: "none",
                  textAlign: "center",
                  minWidth: "180px",
                  boxShadow: "0 6px 25px rgba(0,0,0,0.6)",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: range.color }}>
                  {direction}
                </div>
                <div style={{ marginBottom: "6px", color: "#e5e7eb" }}>
                  {speedLabel} m/s
                </div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: range.color, marginBottom: "8px" }}>
                  {parseFloat(percentage).toFixed(1)}%
                </div>
                <div style={{ borderTop: "1px solid #4b5563", paddingTop: "8px", fontSize: "12px", color: "#cbd5e0" }}>
                  <div>Records: {speedRangeCount}</div>
                  <div>Direction avg: {directionMeanSpeed} m/s</div>
                </div>
              </div>
            );
          })()}

            <svg viewBox="0 0 420 420" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", maxHeight: "360px" }}>
            <defs>
              <style>
                {`
                  .wind-bar { transition: all 0.2s; }
                  .wind-bar:hover { filter: brightness(1.2); }
                `}
              </style>
            </defs>

          {/* Grid circles */}
          {Array.from({ length: ringCount }).map((_, i) => (
            <circle
              key={`ring-${i}`}
              cx={centerX}
              cy={centerY}
              r={ringSpacing * (i + 1)}
              fill="none"
              stroke={GRID}
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const end = polarToCartesian(angle, radius);
            return (
              <line
                key={`axis-${angle}`}
                x1={centerX}
                y1={centerY}
                x2={end.x}
                y2={end.y}
                stroke={GRID}
                strokeWidth="0.5"
              />
            );
          })}

          {/* Wind bars */}
          {directions.map((direction, dirIndex) => (
            <g key={`dir-${direction}`}>
              {SPEED_RANGES.map((range, speedIndex) => {
                const percentage = parseFloat(windRose[direction][range.label]) || 0;
                if (percentage === 0) return null;

                const barKey = `${direction}${separator}${range.label}`;
                const isHovered = hoveredBar === barKey;

                return (
                  <g key={`bar-${direction}-${speedIndex}`}>
                    <path
                      className="wind-bar"
                      d={createBarPath(direction, dirIndex, speedIndex)}
                      fill={range.color}
                      stroke="#fff"
                      strokeWidth={isHovered ? "1.5" : "0.5"}
                      opacity={isHovered ? 1 : 0.85}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={() => setHoveredBar(barKey)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </g>
                );
              })}
            </g>
          ))}

          {/* Direction labels */}
          {directions.map((direction, dirIndex) => {
            const angle = dirIndex * 22.5;
            const labelPos = polarToCartesian(angle, radius + 20);
            return (
              <text
                key={`label-${direction}`}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dy="0.3em"
                fontSize="12"
                fontWeight="600"
                fill={AXIS}
              >
                {direction}
              </text>
            );
          })}

            {/* Center circle */}
            <circle cx={centerX} cy={centerY} r="3" fill={AXIS} />
          </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="wind-rose-legend" style={{ flexShrink: 0, paddingTop: "8px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937", marginBottom: "16px", margin: 0 }}>{t?.("windSpeed") || "Wind speed"}</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {SPEED_RANGES.map((range, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "20px",
                    height: "14px",
                    backgroundColor: range.color,
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>{range.label}</span>
              </div>
            ))}
            <div style={{ paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                <div style={{ width: "20px", height: "14px", backgroundColor: "transparent", border: "2px dashed #cbd5e0", borderRadius: "2px" }} />
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>Calm (&lt;0.5)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div style={{ paddingTop: "24px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
          {t?.("windRoseNote") || "Frequency is shown as percentage of total observations"}
        </p>
      </div>
    </div>
  );
}
