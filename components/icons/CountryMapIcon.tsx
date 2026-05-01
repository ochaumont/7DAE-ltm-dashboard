/**
 * Mini country map for the LTM detail header.
 *
 * Renders a precise SVG silhouette (Natural Earth 50m, mainland EU only) with
 * a red dot on the actual city, all in a 200×140 viewBox so silhouette and
 * dot are aligned by construction.
 *
 * Path data and city coordinates are produced by
 * `scripts/extract-country-paths.mjs` — do not hand-edit
 * `lib/country-map-data.generated.ts`.
 *
 * Returns `null` when the country is unknown — the header stays compact.
 */

import { PATHS, SITE_COORDS } from "@/lib/country-map-data.generated";

type Props = {
  country: string;
  site: string;
};

export default function CountryMapIcon({ country, site }: Props) {
  const path = PATHS[country];
  if (!path) return null;

  const dot = SITE_COORDS[site];
  const showDot = !!dot && dot.country === country;

  return (
    <svg
      width={200}
      height={140}
      viewBox="0 0 200 140"
      aria-hidden="true"
      className="block shrink-0"
    >
      <path
        d={path}
        stroke="currentColor"
        fill="currentColor"
        fillOpacity={0.35}
        strokeWidth={0.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {showDot && (
        <circle
          cx={dot.x}
          cy={dot.y}
          r={4}
          fill="var(--color-danger)"
          stroke="white"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}
