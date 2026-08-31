"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";
import { PHOTO_PLACEHOLDER } from "@/lib/photo";
import { usePhoto } from "@/lib/usePhoto";
import PanoramaClient from "./PanoramaClient";
import PhotoSpinner from "./PhotoSpinner";

function PhotoSlide({ photo }: Readonly<{ photo: Photo }>) {
  const { url: src, isLoading } = usePhoto(photo.resourceId, photo.resourceUri, !photo.is360);
  if (photo.is360) return <PanoramaClient src={src} />;
  return (
    <>
      <img
        src={src}
        alt={photo.alt ?? ""}
        className="w-full h-full object-cover"
      />
      {isLoading && <PhotoSpinner />}
    </>
  );
}

function Thumbnail({
  photo,
  active,
  onClick,
}: Readonly<{
  photo: Photo;
  active: boolean;
  onClick: () => void;
}>) {
  const { url: src, isLoading } = usePhoto(photo.resourceId, photo.resourceUri, !photo.is360);
  return (
    <button
      onClick={onClick}
      title={photo.is360 ? "Image 360°" : undefined}
      className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
        active
          ? "border-accent opacity-100"
          : "border-transparent opacity-60 hover:opacity-100"
      }`}
      type="button"
    >
      <img src={src} alt={photo.alt ?? ""} className="w-full h-full object-cover" />
      {isLoading && <PhotoSpinner />}
      {photo.is360 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 px-1 py-0.5 rounded text-[10px] font-mono bg-accent text-accent-fg leading-none"
        >
          360°
        </span>
      )}
    </button>
  );
}

export default function Gallery({ photos }: Readonly<{ photos: Photo[] }>) {
  const [active, setActive] = useState(0);
  const current = photos[active];

  if (!current) {
    return (
      <div className="relative aspect-video bg-surface-2 rounded-card overflow-hidden">
        <img
          src={PHOTO_PLACEHOLDER}
          alt="No photo available for this lab test mean"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-surface-2 rounded-card overflow-hidden">
        <PhotoSlide photo={current} />
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {photos.map((p, i) => (
            <Thumbnail
              key={i}
              photo={p}
              active={i === active}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
