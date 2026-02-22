import { useMemo } from 'react';

interface MiniSparklineProps {
  value: number;
  color?: string;
  className?: string;
}

export function MiniSparkline({ value, color = 'hsl(205, 78%, 48%)', className }: MiniSparklineProps) {
  // Generate a pseudo-random sparkline based on the value
  const points = useMemo(() => {
    const seed = value * 13 + 7;
    const pts: number[] = [];
    for (let i = 0; i < 8; i++) {
      const v = ((Math.sin(seed * (i + 1) * 0.7) + 1) / 2) * 0.6 + 0.2;
      pts.push(v);
    }
    // Make last point trend towards the actual relative value
    pts[pts.length - 1] = Math.min(Math.max(value / (value + 5), 0.3), 0.9);
    return pts;
  }, [value]);

  const width = 60;
  const height = 24;
  const padding = 2;

  const pathD = points
    .map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - p * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-${value}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${value})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
