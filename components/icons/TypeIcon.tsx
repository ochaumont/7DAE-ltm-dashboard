import type { LabTestMeanType } from "@/lib/types";

type Props = {
  type: LabTestMeanType;
  size?: number;
  className?: string;
};

// SIMU/SIB/FIB use dedicated artwork (temp/SIMU21.svg, temp/SIB.svg,
// temp/FIB.svg) with their own viewBox baked in — RT/SHARE/NA keep the
// original 24x24 line-icon style.
const VIEWBOX: Record<LabTestMeanType, string> = {
  // Cropped tightly to the artwork's actual bounding box within the source
  // file's 1536x1024 canvas (most of that canvas is empty padding) — this
  // fills the icon slot correctly without relying on a manual scale
  // transform that bled outside the SVG's own bounds and got clipped by
  // ancestors with `overflow: hidden` (e.g. the truncated info line on
  // `/depgraph` node cards).
  SIMU: "460 251 617 473",
  SIB: "0 0 64 64",
  FIB: "0 0 64 64",
  RT: "0 0 24 24",
  SHARE: "0 0 24 24",
  NA: "0 0 24 24",
};

export default function TypeIcon({ type, size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX[type]}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {GLYPH[type]}
    </svg>
  );
}

const GLYPH: Record<LabTestMeanType, React.ReactNode> = {
  SIMU: (
    <g transform="translate(0,1024) scale(0.1,-0.1)" fill="currentColor" stroke="none">
      <path d="M7130 7389 c-207 -9 -565 -40 -727 -64 -271 -40 -570 -113 -699 -170
-168 -74 -281 -197 -338 -369 -29 -84 -307 -1133 -328 -1236 -12 -58 2 -117
39 -161 54 -64 123 -73 268 -35 50 13 162 40 250 61 88 20 207 48 265 61 341
80 754 159 1030 198 506 71 1274 63 1733 -19 45 -8 150 -26 232 -40 182 -31
641 -132 1002 -220 146 -36 284 -65 305 -65 83 0 148 55 167 142 10 42 5 68
-55 305 -36 142 -90 350 -121 463 -30 113 -72 272 -94 353 -22 81 -53 184 -68
227 -82 223 -240 334 -601 424 -430 106 -998 157 -1720 154 -195 0 -438 -5
-540 -9z m412 -336 c6 -68 1 -1040 -6 -1051 -3 -5 -63 -12 -134 -16 -434 -23
-1005 -125 -1785 -320 -161 -40 -251 -58 -257 -52 -16 16 -13 35 40 228 28
101 61 224 75 273 92 337 159 567 179 610 26 56 83 117 136 145 62 32 251 88
405 119 304 63 769 107 1156 110 l186 1 5 -47z m738 37 c557 -30 978 -96 1228
-192 95 -36 170 -96 203 -161 12 -22 41 -112 66 -201 44 -157 212 -764 238
-858 22 -81 20 -81 -268 -10 -836 206 -1395 303 -1872 325 l-50 2 -3 540 c-1
297 0 545 2 552 7 16 191 17 456 3z" />
      <path d="M6983 5530 c-55 -8 -89 -28 -139 -82 -47 -49 -228 -478 -219 -517 14
-64 -47 -61 1059 -61 l1005 0 27 24 c43 36 37 70 -51 271 -121 279 -136 303
-220 348 -40 22 -43 22 -725 23 -377 1 -708 -2 -737 -6z m263 -257 c31 -20 50
-82 38 -125 -13 -43 -65 -78 -116 -78 -55 0 -108 51 -108 104 0 103 100 156
186 99z m1020 0 c51 -33 56 -125 10 -171 -15 -16 -39 -26 -67 -29 -61 -6 -104
22 -120 78 -11 37 -11 46 7 78 35 65 109 84 170 44z m-508 -8 c104 -88 -17
-247 -134 -176 -95 58 -52 201 61 201 32 0 51 -7 73 -25z" />
      <path d="M5525 5246 c-81 -38 -135 -104 -154 -186 -8 -36 -1 -105 40 -389 27
-190 48 -350 45 -357 -2 -6 -22 -14 -43 -17 -50 -8 -110 -64 -118 -111 -4 -21
4 -88 23 -180 33 -163 54 -207 122 -252 38 -25 52 -28 198 -36 86 -5 373 -8
637 -6 470 3 481 3 520 25 83 45 113 94 144 238 33 157 28 201 -32 263 -47 50
-81 63 -175 70 l-85 7 -64 240 c-35 132 -82 308 -104 390 -44 164 -70 218
-126 265 -68 55 -102 60 -457 60 -316 0 -322 -1 -371 -24z" />
      <path d="M9110 5261 c-68 -21 -132 -75 -164 -138 -9 -18 -46 -142 -81 -275
-36 -134 -79 -290 -95 -348 -16 -58 -33 -123 -39 -146 l-11 -41 -87 -7 c-71
-5 -97 -12 -133 -34 -92 -57 -108 -133 -66 -320 28 -125 59 -174 131 -211 l50
-26 610 1 c480 0 618 3 649 13 50 17 118 80 139 128 21 48 57 239 57 301 0 72
-45 126 -113 138 -21 4 -41 12 -43 19 -3 7 15 153 41 326 49 340 53 407 30
463 -23 54 -84 116 -140 142 -49 23 -54 24 -380 23 -181 0 -341 -4 -355 -8z" />
      <path d="M7227 4709 c-36 -21 -47 -63 -47 -181 0 -91 4 -120 18 -147 20 -37
72 -71 109 -71 48 0 47 -19 -32 -401 -41 -200 -75 -378 -75 -395 0 -23 8 -39
26 -53 26 -21 37 -21 461 -21 l434 0 24 25 c14 13 25 35 25 49 0 23 -66 359
-126 638 -29 137 -26 158 20 158 36 0 88 35 108 71 14 27 18 56 18 142 0 121
-14 166 -56 186 -33 15 -881 15 -907 0z" />
      <path d="M5632 3600 c-32 -13 -52 -68 -52 -140 0 -73 19 -114 58 -128 28 -9
921 -6 969 4 34 7 53 54 53 129 0 76 -19 121 -56 135 -33 13 -941 12 -972 0z" />
      <path d="M8739 3581 c-28 -28 -29 -34 -29 -116 0 -78 2 -88 25 -110 28 -29
-22 -27 588 -27 l408 -1 24 23 c30 28 44 131 26 191 -21 70 -11 69 -541 69
l-472 0 -29 -29z" />
    </g>
  ),
  SIB: (
    <g stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <rect x="23" y="5" width="18" height="14" rx="3" />
      <rect x="6" y="43" width="18" height="14" rx="3" />
      <rect x="40" y="43" width="18" height="14" rx="3" />
      <path d="M32 19v10M15 43v-7h34v7M32 29v7" />
      <circle cx="32" cy="36" r="2.5" fill="currentColor" stroke="none" />
      <path d="M27 11h10M10 49h10M44 49h10" />
    </g>
  ),
  FIB: (
    <g stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <rect x="14" y="5" width="36" height="54" rx="5" />
      <path d="M14 23h36M14 40h36" />
      <rect x="20" y="11" width="13" height="7" rx="1.5" />
      <circle cx="40" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="45" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M20 29h17M20 34h13" />
      <circle cx="43" cy="29" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="43" cy="34" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 47v6M27 47v6M33 47v6" />
      <rect x="39" y="46" width="6" height="7" rx="1" />
    </g>
  ),
  RT: (
    <>
      <path d="M9 2v6L4 20a2 2 0 0 0 1.78 2.9h12.44A2 2 0 0 0 20 20L15 8V2" />
      <line x1="8" y1="2" x2="16" y2="2" />
      <line x1="6.5" y1="14" x2="17.5" y2="14" />
    </>
  ),
  SHARE: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </>
  ),
  NA: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
};
