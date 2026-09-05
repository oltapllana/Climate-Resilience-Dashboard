// Chart furniture shared by the indicator charts.
//
// Two problems the review found again and again, both of them positioning
// rather than data: reference-line labels that ran off the right edge and lost
// the end of their own number ("Absolute minimum: 906.8 hP", "Mean: 0.25 g/l…"),
// and rotated y-axis titles clipped by the plot's left margin ("Departure from
// the daily" with the unit missing).

const AXIS = "#475569";

/**
 * A reference-line label drawn back inside the plot from the edge it is
 * anchored to, so it can never be clipped by the chart's own border.
 *
 * @param {"left"|"right"} [side]  which edge to anchor to
 * @param {"above"|"below"} [place] which side of the line to sit on
 */
export function EdgeLabel({ viewBox, text, side = "right", place = "above", fill = AXIS, topLimit = 12 }) {
  if (!viewBox || !text) return null;
  const { x = 0, y = 0, width = 0 } = viewBox;
  const padding = 5;
  const anchoredRight = side === "right";
  const tx = anchoredRight ? x + width - padding : x + padding;
  // Keep the text off the top border when the line itself sits near it.
  const ty = place === "above" ? Math.max(y - 6, topLimit) : y + 14;
  return (
    <text
      x={tx}
      y={ty}
      textAnchor={anchoredRight ? "end" : "start"}
      fill={fill}
      fontSize={11}
      fontWeight={600}
      stroke="#ffffff"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

/**
 * A label for a marked point. Near the right-hand end of a series a centred
 * label runs past the plot edge and loses its tail, so callers pass the anchor
 * that suits where the point actually falls.
 */
export function DotLabel({ viewBox, text, anchor = "middle", place = "top", fill = AXIS }) {
  if (!viewBox || !text) return null;
  // ReferenceDot hands over a rect; a plain point hands over cx/cy.
  const cx = viewBox.cx ?? (viewBox.x ?? 0) + (viewBox.width ?? 0) / 2;
  const cy = viewBox.cy ?? (viewBox.y ?? 0) + (viewBox.height ?? 0) / 2;
  const dx = anchor === "end" ? -8 : anchor === "start" ? 8 : 0;
  const dy = place === "top" ? -11 : 17;
  return (
    <text
      x={cx + dx}
      y={cy + dy}
      textAnchor={anchor}
      fill={fill}
      fontSize={11}
      fontWeight={700}
      stroke="#ffffff"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

/**
 * Where a marked point sits along the series, expressed as the text anchor that
 * keeps its label inside the plot.
 */
export function anchorForPosition(index, count) {
  if (!count || index == null || index < 0) return "middle";
  const position = index / Math.max(1, count - 1);
  if (position > 0.72) return "end";
  if (position < 0.28) return "start";
  return "middle";
}

/** A rotated y-axis title that stays centred on the axis and inside the margin. */
export function yAxisLabel(value, offset = 4) {
  return {
    value,
    angle: -90,
    position: "insideLeft",
    offset,
    style: { textAnchor: "middle", fill: AXIS, fontSize: 12, fontWeight: 600 },
  };
}

/** An x-axis title with the same treatment. */
export function xAxisLabel(value, offset = -6) {
  return {
    value,
    position: "insideBottom",
    offset,
    style: { textAnchor: "middle", fill: AXIS, fontSize: 12, fontWeight: 600 },
  };
}

/** Legends read before the plot rather than after it. */
export const topLegendProps = {
  verticalAlign: "top",
  height: 28,
  wrapperStyle: { fontSize: 12, paddingBottom: 6 },
};

/** A chart with nothing to draw says so, in the middle, at a readable size. */
export function ChartEmptyState({ title, detail }) {
  return (
    <div className="chart-empty-state">
      <strong>{title}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}
