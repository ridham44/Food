/** Shared recharts styling so every chart on the platform reads as one system. */

export const chartColors = {
  primary: '#8b6cff',
  cyan: '#35d4e7',
  // Same hues as the --danger/--warning design tokens (tokens.css) — reused
  // here so decorative multi-color charts (e.g. stat-card sparklines) stay
  // on the same palette instead of introducing new ad-hoc colors.
  pink: '#ff647c',
  orange: '#ffb84d',
  info: '#58a6ff',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#747b93',
} as const;

export const chartGridProps = {
  strokeDasharray: '3 3',
  stroke: chartColors.grid,
  vertical: false,
} as const;

export const chartAxisProps = {
  stroke: chartColors.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const chartTooltipStyle = {
  background: '#151b2d',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  fontSize: 12,
} as const;

/** Gradient fill defs must live inside the chart's <defs>; this just gives them a consistent id/color pairing. */
export function chartGradientStops(color: string) {
  return { start: { offset: '0%', stopColor: color, stopOpacity: 0.3 }, end: { offset: '100%', stopColor: color, stopOpacity: 0 } };
}
