"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();
  const [logoFailed, setLogoFailed] = useState(false);

  const catalogueActive =
    pathname === "/" || pathname.startsWith("/labtestmean");
  const mapActive =
    pathname === "/map" || pathname.startsWith("/map/");

  const itemClass = (active: boolean) =>
    clsx(
      "px-3 py-1.5 rounded text-sm font-medium transition-colors",
      active
        ? "bg-[#00205B] text-white"
        : "text-[#00205B]/70 hover:text-[#00205B]"
    );

  return (
    <header className="sticky top-0 z-20 border-b border-[#00205B]/15 bg-white">
      <div className="px-4 md:px-6 py-3 flex items-center gap-6 max-w-[1600px] mx-auto">
        <Link
          href="/"
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label="Airbus — go to catalogue"
        >
          {logoFailed ? (
            <span className="text-lg font-bold tracking-tight">Airbus</span>
          ) : (
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_HREF ?? ""}/airbus-logo.svg`}
              alt="Airbus"
              className="h-6 w-auto"
              onError={() => setLogoFailed(true)}
            />
          )}
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/" className={itemClass(catalogueActive)}>
            Catalogue
          </Link>
          <Link href="/map" className={itemClass(mapActive)}>
            Map
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 min-h-[32px]">
          {/* RESERVED: avatar, global search, notifications (V2) */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
