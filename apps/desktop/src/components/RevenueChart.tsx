interface Point {
  label: string;
  value: number;
}

/** Dependency-free, theme-aware SVG bar chart for monthly revenue. */
export function RevenueChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No sales yet — create an invoice to see revenue here.
      </div>
    );
  }

  const W = 720;
  const H = 240;
  const padX = 36;
  const padTop = 24;
  const padBottom = 28;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = chartW / data.length;
  const barW = Math.min(46, slot * 0.6);

  const compact = (n: number) => {
    if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
    if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
    return String(Math.round(n));
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-60 w-full" role="img" aria-label="Monthly revenue">
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yy = padTop + chartH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padX}
                y1={yy}
                x2={W - padX}
                y2={yy}
                className="stroke-border"
                strokeWidth={1}
                strokeDasharray={t === 0 ? '0' : '3 4'}
              />
              <text x={padX - 6} y={yy + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9}>
                {compact(max * t)}
              </text>
            </g>
          );
        })}
        {/* bars */}
        {data.map((d, i) => {
          const h = (d.value / max) * chartH;
          const x = padX + slot * i + (slot - barW) / 2;
          const y = padTop + chartH - h;
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${d.value.toLocaleString('en-IN')}`}</title>
              <rect x={x} y={y} width={barW} height={Math.max(h, 1)} rx={3} className="fill-primary" />
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="fill-foreground" fontSize={9}>
                  {compact(d.value)}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={9}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
