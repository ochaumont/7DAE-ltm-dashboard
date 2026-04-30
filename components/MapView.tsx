"use client";

import { useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import type { LabTestMean } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";

const TILE_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const;

export default function MapView({
  labTestMeans,
}: {
  labTestMeans: LabTestMean[];
}) {
  const [selected, setSelected] = useState<LabTestMean | null>(null);
  const theme = useTheme();
  const plotted = labTestMeans.filter(
    (m) => m.location.lat != null && m.location.lng != null
  );
  return (
    <Map
      initialViewState={{
        longitude: 5,
        latitude: 47,
        zoom: 3.5,
      }}
      mapStyle={TILE_STYLES[theme]}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-right" />
      {plotted.map((m) => (
        <Marker
          key={m.id}
          longitude={m.location.lng!}
          latitude={m.location.lat!}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelected(m);
          }}
        >
          <button
            type="button"
            className="w-3 h-3 rounded-full bg-accent border-2 border-white shadow-lg hover:scale-150 transition-transform cursor-pointer"
            aria-label={m.name}
          />
        </Marker>
      ))}
      {selected && selected.location.lat != null && selected.location.lng != null && (
        <Popup
          longitude={selected.location.lng}
          latitude={selected.location.lat}
          onClose={() => setSelected(null)}
          closeButton={false}
          anchor="top"
          offset={12}
          maxWidth="320px"
        >
          <div className="p-3 space-y-2 min-w-[260px]">
            <img
              src={selected.coverPhoto}
              alt={selected.name}
              className="w-full h-28 object-cover rounded"
              onError={(e) => {
                const t = e.currentTarget;
                if (!t.src.endsWith("/covers/cover-1.svg"))
                  t.src = "/covers/cover-1.svg";
              }}
            />
            <div className="flex items-center justify-between">
              <ChipType type={selected.type} />
              <BadgeStatus status={selected.status} />
            </div>
            <div className="font-semibold text-sm leading-tight">
              {selected.name}
            </div>
            <div className="text-xs text-muted">
              {selected.location.city}, {selected.location.country}
            </div>
            <Link
              href={`/labtestmean/${selected.id}`}
              className="inline-block text-xs font-semibold text-accent mt-1"
            >
              View details →
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  );
}
