/**
 * PDF transpositions of the web SVG icons (components/icons/*) into
 * @react-pdf/renderer primitives. The web icons rely on `currentColor`, which
 * is not resolved in react-pdf, so every shape here receives an EXPLICIT color.
 *
 * Path/coordinate data is copied verbatim from the source web icons so the
 * pictograms match the dashboard exactly. The country silhouette + city dot
 * reuse the generated data (lib/country-map-data.generated.ts) — never duplicate
 * those paths by hand.
 */
import { Svg, Path, Circle, Rect, Line, Polygon, Polyline } from "@react-pdf/renderer";
import { PATHS, SITE_COORDS } from "@/lib/country-map-data.generated";
import type { Complexity, LabTestMeanStatus, LabTestMeanType } from "@/lib/types";
import { colors, statusColor } from "./styles";

// Shared stroke style for the line-art icons (matches the web: round caps/joins,
// no fill). `w` mirrors each source icon's strokeWidth.
function strokeProps(color: string, w = 1.8) {
  return {
    stroke: color,
    strokeWidth: w,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

// ---------------------------------------------------------------------------
// Status (components/icons/StatusIcon.tsx)
// ---------------------------------------------------------------------------
export function PdfStatusIcon({
  status,
  size = 12,
}: Readonly<{
  status: LabTestMeanStatus;
  size?: number;
}>) {
  const c = statusColor[status] ?? colors.muted;
  const s = strokeProps(c, 2);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {status === "operational" && <Circle cx={12} cy={12} r={9} fill={c} />}
      {status === "mothballed" && (
        <>
          <Circle cx={12} cy={12} r={10} {...s} />
          <Line x1={10} y1={9} x2={10} y2={15} {...s} />
          <Line x1={14} y1={9} x2={14} y2={15} {...s} />
        </>
      )}
      {status === "out-of-service" && (
        <>
          <Circle cx={12} cy={12} r={10} {...s} />
          <Line x1={9} y1={9} x2={15} y2={15} {...s} />
          <Line x1={15} y1={9} x2={9} y2={15} {...s} />
        </>
      )}
      {status === "in-project" && (
        <>
          <Circle cx={12} cy={12} r={10} {...s} />
          <Polyline points="12,7 12,12 15,14" {...s} />
        </>
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Complexity (components/icons/ComplexityIcon.tsx) — 3 stars + 3 rings
// ---------------------------------------------------------------------------
const STAR_CENTERS = [4, 12, 20];
const STAR_CY = 4.5;
const STAR_R = 2.5;
const RING_RADII = [3, 5, 7];
const ACTIVE_COUNT: Record<Complexity, number> = {
  simple: 1,
  medium: 2,
  complex: 3,
};

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

export function PdfComplexityIcon({
  level,
  size = 16,
}: Readonly<{
  level: Complexity;
  size?: number;
}>) {
  const active = ACTIVE_COUNT[level];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {STAR_CENTERS.map((cx, i) => {
        const isActive = i < active;
        return (
          <Polygon
            key={`s${i}`}
            points={starPoints(cx, STAR_CY, STAR_R)}
            fill={isActive ? colors.warning : "none"}
            stroke={isActive ? colors.warning : colors.fg}
            strokeWidth={1.2}
            strokeLinejoin="round"
            opacity={isActive ? 1 : 0.35}
          />
        );
      })}
      {RING_RADII.map((r, i) => {
        const isActive = active >= 3 - i;
        return (
          <Circle
            key={`r${i}`}
            cx={12}
            cy={16}
            r={r}
            fill="none"
            stroke={colors.fg}
            strokeWidth={isActive ? 1.5 : 1}
            opacity={isActive ? 0.85 : 0.3}
          />
        );
      })}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Access control (components/icons/AccessControlIcon.tsx)
// ---------------------------------------------------------------------------
export function PdfAccessIcon({
  enabled,
  size = 16,
}: Readonly<{
  enabled: boolean;
  size?: number;
}>) {
  const c = colors.fg;
  const s = strokeProps(c, 2);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={6} cy={12} r={3} {...s} />
      <Line x1={9} y1={12} x2={20} y2={12} {...s} />
      <Line x1={17} y1={12} x2={17} y2={14.5} {...s} />
      <Line x1={20} y1={12} x2={20} y2={15} {...s} />
      {!enabled && (
        <>
          <Line
            x1={3}
            y1={3}
            x2={21}
            y2={21}
            stroke={colors.danger}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Line
            x1={21}
            y1={3}
            x2={3}
            y2={21}
            stroke={colors.danger}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Remote access (components/icons/CapabilityIcon.tsx)
// ---------------------------------------------------------------------------
export function PdfRemoteIcon({
  enabled,
  size = 16,
}: Readonly<{
  enabled: boolean;
  size?: number;
}>) {
  const c = colors.fg;
  const s = strokeProps(c, 1.8);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.55a11 11 0 0 1 14 0" {...s} />
      <Path d="M8.5 16.05a6 6 0 0 1 7 0" {...s} />
      <Circle cx={12} cy={20} r={0.8} fill={c} />
      {!enabled && <Path d="M4 4l16 16" {...s} />}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Bench type glyph (components/icons/TypeIcon.tsx) — used in the Identity chip
// ---------------------------------------------------------------------------
export function PdfTypeIcon({
  type,
  size = 14,
  color = colors.accent,
}: Readonly<{
  type: LabTestMeanType;
  size?: number;
  color?: string;
}>) {
  const s = strokeProps(color, 2);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {type === "SIMU" && (
        <>
          <Rect x={2} y={3} width={20} height={14} rx={2} {...s} />
          <Line x1={8} y1={21} x2={16} y2={21} {...s} />
          <Line x1={12} y1={17} x2={12} y2={21} {...s} />
        </>
      )}
      {type === "SIB" && (
        <>
          <Circle cx={12} cy={12} r={3} {...s} />
          <Path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            {...s}
          />
        </>
      )}
      {type === "FIB" && (
        <>
          <Rect x={4} y={4} width={16} height={16} rx={2} {...s} />
          <Rect x={9} y={9} width={6} height={6} {...s} />
          <Line x1={9} y1={2} x2={9} y2={4} {...s} />
          <Line x1={15} y1={2} x2={15} y2={4} {...s} />
          <Line x1={9} y1={20} x2={9} y2={22} {...s} />
          <Line x1={15} y1={20} x2={15} y2={22} {...s} />
          <Line x1={20} y1={9} x2={22} y2={9} {...s} />
          <Line x1={20} y1={14} x2={22} y2={14} {...s} />
          <Line x1={2} y1={9} x2={4} y2={9} {...s} />
          <Line x1={2} y1={14} x2={4} y2={14} {...s} />
        </>
      )}
      {type === "RT" && (
        <>
          <Path d="M9 2v6L4 20a2 2 0 0 0 1.78 2.9h12.44A2 2 0 0 0 20 20L15 8V2" {...s} />
          <Line x1={8} y1={2} x2={16} y2={2} {...s} />
          <Line x1={6.5} y1={14} x2={17.5} y2={14} {...s} />
        </>
      )}
      {type === "SHARE" && (
        <>
          <Circle cx={18} cy={5} r={3} {...s} />
          <Circle cx={6} cy={12} r={3} {...s} />
          <Circle cx={18} cy={19} r={3} {...s} />
          <Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} {...s} />
          <Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} {...s} />
        </>
      )}
      {type === "NA" && (
        <>
          <Circle cx={12} cy={12} r={10} {...s} />
          <Line x1={8} y1={12} x2={16} y2={12} {...s} />
        </>
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Aircraft program + ATA tiles (components/icons/AircraftIcon.tsx, AtaIcon.tsx)
// ---------------------------------------------------------------------------
export function PdfAircraftIcon({
  size = 22,
  color = colors.fg,
}: Readonly<{
  size?: number;
  color?: string;
}>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
        {...strokeProps(color)}
      />
    </Svg>
  );
}

export function PdfAtaIcon({
  size = 22,
  color = colors.fg,
}: Readonly<{
  size?: number;
  color?: string;
}>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        {...strokeProps(color)}
      />
      <Circle cx={12} cy={12} r={3} {...strokeProps(color)} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle step icons (components/icons/LifecycleStepIcon.tsx)
// ---------------------------------------------------------------------------
type StepIconProps = { size?: number; color?: string };

export function PdfKickoffIcon({ size = 14, color = colors.fg }: Readonly<StepIconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 22V4" {...strokeProps(color)} />
      <Path d="M4 4h12l-2 4 2 4H4" {...strokeProps(color)} />
    </Svg>
  );
}

export function PdfInServiceIcon({ size = 14, color = colors.fg }: Readonly<StepIconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...strokeProps(color)} />
      <Path d="m8 12 3 3 5-6" {...strokeProps(color)} />
    </Svg>
  );
}

export function PdfMothballedIcon({ size = 14, color = colors.fg }: Readonly<StepIconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
        {...strokeProps(color)}
      />
    </Svg>
  );
}

export function PdfDismantledIcon({ size = 14, color = colors.fg }: Readonly<StepIconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={4} width={18} height={4} rx={1} {...strokeProps(color)} />
      <Path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" {...strokeProps(color)} />
      <Path d="M10 12h4" {...strokeProps(color)} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Country silhouette + city dot (components/icons/CountryMapIcon.tsx)
// ---------------------------------------------------------------------------
export function PdfCountryMap({
  country,
  site,
  width = 120,
  color = colors.fg,
}: Readonly<{
  country: string;
  site: string;
  width?: number;
  color?: string;
}>) {
  const d = PATHS[country];
  if (!d) return null;
  const height = Math.round((width * 140) / 200);
  const dot = SITE_COORDS[site];
  const showDot = !!dot && dot.country === country;
  return (
    <Svg width={width} height={height} viewBox="0 0 200 140">
      <Path
        d={d}
        fill={color}
        fillOpacity={0.35}
        stroke={color}
        strokeWidth={0.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {showDot && (
        <Circle
          cx={dot.x}
          cy={dot.y}
          r={4}
          fill={colors.danger}
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Airbus wordmark (public/airbus-logo.svg) — fill forced to Airbus blue.
// ---------------------------------------------------------------------------
export function PdfAirbusLogo({
  width = 120,
  color = "#00205b",
}: Readonly<{
  width?: number;
  color?: string;
}>) {
  const height = Math.round((width * 73.885) / 398.971);
  return (
    <Svg width={width} height={height} viewBox="0 0 398.971 73.885">
      <Path
        fill={color}
        d="m120.15 1.5117v70.861h17.258v-55.547h19.521c7.227 0 9.8145 4.1007 9.8145 8.8457 0 4.854-2.6968 8.8438-9.9238 8.8438h-16.717l23.729 37.857h19.631s-16.179-25.453-16.07-25.453c10.032-2.372 16.502-9.3837 16.502-21.68 0-13.482-8.8443-23.729-27.072-23.729zm-28.906-7.188e-4h17.258v70.864h-17.258zm-44.114 44.114h-14.523l10.747-21.787h0.217l24.16 48.536h19.846l-36.133-70.863h-15.315l-36.133 70.863h19.414l5.853-11.864h29.093zm144.96-44.113v70.861h41.961c14.668 0 24.268-7.8737 24.268-19.846-1e-3 -8.304-4.6376-14.559-11.434-16.932 5.502-3.021 8.4141-7.8752 8.4141-14.994 0-11.433-8.5222-19.09-22.867-19.09zm17.26 14.992h23.082c3.452 0 6.1484 2.6959 6.1484 6.2559 0 3.56-2.6968 6.2559-6.2578 6.2559h-22.973zm0 26.639h23.514c4.207 0 7.4434 3.0211 7.4434 7.1191 1e-3 4.206-3.2364 7.334-7.4434 7.334h-23.514zm103.44-2.0476c0 10.756-4.962 16.718-14.776 16.718-9.707 0-14.669-5.962-14.669-16.718v-39.584h-17.688v38.29c0 21.896 11.541 34.084 32.357 34.084s32.465-12.188 32.465-34.084v-38.29h-17.689zm55.009-41.095c-18.229 0-28.477 9.0611-28.477 21.248 0 13.114 7.6533 18.442 25.238 22.219 13.69 3.018 16.609 4.9013 16.609 8.7363 0 4.166-3.7748 6.041-11.217 6.041-10.786 0-20.546-2.6193-28.365-6.9023l-5.2852 15.1c8.521 4.53 21.247 7.4434 34.082 7.4434 17.905 0 28.582-8.3067 28.582-22.221 2e-3 -11.163-7.2206-18.334-22.434-22.002-16.383-3.989-19.951-4.3696-19.951-9.0605 0-3.629 4.097-5.3945 11-5.3945 9.168 0 18.931 2.3018 24.484 5.7188l5.5-14.453c-7.118-3.775-17.58-6.4727-29.768-6.4727z"
      />
    </Svg>
  );
}
