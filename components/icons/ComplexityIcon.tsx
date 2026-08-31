import type { Complexity } from "@/lib/types";

type Props = {
  level: Complexity;
  size?: number;
  className?: string;
};

const ACTIVE_COUNT: Record<Complexity, number> = {
  simple: 1,
  medium: 2,
  complex: 3,
};

const STAR_CENTERS = [4, 12, 20];
const STAR_CY = 4.5;
const STAR_R = 2.5;
const RING_RADII = [3, 5, 7];
const RING_CENTER = { cx: 12, cy: 16 };

function starPoints(cx: number, cy: number, R: number): string {
  const r = R * 0.382;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angleRad = ((-90 + i * 36) * Math.PI) / 180;
    const radius = i % 2 === 0 ? R : r;
    const x = cx + radius * Math.cos(angleRad);
    const y = cy + radius * Math.sin(angleRad);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

export default function ComplexityIcon({ level, size = 14, className }: Readonly<Props>) {
  const active = ACTIVE_COUNT[level];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {STAR_CENTERS.map((cx, i) => {
        const isActive = i < active;
        return (
          <polygon
            key={`s${cx}`}
            points={starPoints(cx, STAR_CY, STAR_R)}
            fill={isActive ? "var(--color-warning)" : "none"}
            stroke={isActive ? "var(--color-warning)" : "currentColor"}
            strokeWidth={1.2}
            strokeLinejoin="round"
            opacity={isActive ? 1 : 0.35}
          />
        );
      })}
      {RING_RADII.map((r, i) => {
        const isActive = active >= 3 - i;
        return (
          <circle
            key={`r${r}`}
            cx={RING_CENTER.cx}
            cy={RING_CENTER.cy}
            r={r}
            stroke="currentColor"
            strokeWidth={isActive ? 1.5 : 1}
            strokeDasharray={isActive ? undefined : "2 2"}
            opacity={isActive ? 0.85 : 0.3}
          />
        );
      })}
    </svg>
  );
}
