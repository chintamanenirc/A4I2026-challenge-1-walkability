"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import { Plus, Minus, Globe } from "lucide-react";

interface AtlantaMapProps {
  sites: SiteData[];
  selectedSiteId: number;
  onSelectSite: (id: number) => void;
  centersToFund: number;
  setCentersToFund: (fn: (prev: number) => number) => void;
  activeLayer: "heat" | "nocar" | "age65";
  setActiveLayer: (layer: "heat" | "nocar" | "age65") => void;
}

interface TractPoly {
  id: string;
  points: string;
  heatLevel: 0 | 1 | 2 | 3 | 4; // 0=cooler slate, 1=warm brown, 2=orange-red, 3=bright orange, 4=pale peach
  noCarLevel: 0 | 1 | 2 | 3 | 4;
  age65Level: 0 | 1 | 2 | 3 | 4;
  siteId?: number;
}

const LEVEL_COLORS: Record<number, string> = {
  0: "#182334",
  1: "#7c3a21",
  2: "#d95b16",
  3: "#f97316",
  4: "#fed7aa",
};

// Exact Voronoi-style irregular polygon tessellation matching Screenshot 1
const TRACT_POLYGONS: TractPoly[] = [
  // Row 1 (Outer North / Northwest / Northeast — mostly cooler slate outside I-285)
  { id: "r1c1", points: "0,0 115,0 105,68 0,75", heatLevel: 0, noCarLevel: 0, age65Level: 1 },
  { id: "r1c2", points: "115,0 235,0 220,62 105,68", heatLevel: 0, noCarLevel: 0, age65Level: 1 },
  { id: "r1c3", points: "235,0 355,0 348,58 220,62", heatLevel: 0, noCarLevel: 1, age65Level: 1 },
  { id: "r1c4", points: "355,0 470,0 460,55 348,58", heatLevel: 0, noCarLevel: 0, age65Level: 2 },
  { id: "r1c5", points: "470,0 575,0 565,60 460,55", heatLevel: 0, noCarLevel: 0, age65Level: 1 },
  { id: "r1c6", points: "575,0 675,0 668,68 565,60", heatLevel: 0, noCarLevel: 0, age65Level: 1 },
  { id: "r1c7", points: "675,0 760,0 760,72 668,68", heatLevel: 0, noCarLevel: 0, age65Level: 0 },

  // Row 2 (Upper North Perimeter)
  { id: "r2c1", points: "0,75 105,68 122,135 0,145", heatLevel: 0, noCarLevel: 1, age65Level: 1 },
  { id: "r2c2", points: "105,68 220,62 212,128 122,135", heatLevel: 3, noCarLevel: 2, age65Level: 2 },
  { id: "r2c3", points: "220,62 348,58 330,118 212,128", heatLevel: 2, noCarLevel: 3, age65Level: 2 },
  { id: "r2c4", points: "348,58 460,55 452,115 330,118", heatLevel: 1, noCarLevel: 1, age65Level: 2 },
  { id: "r2c5", points: "460,55 565,60 558,125 452,115", heatLevel: 0, noCarLevel: 1, age65Level: 1 },
  { id: "r2c6", points: "565,60 668,68 655,132 558,125", heatLevel: 0, noCarLevel: 0, age65Level: 1 },
  { id: "r2c7", points: "668,68 760,72 760,140 655,132", heatLevel: 0, noCarLevel: 0, age65Level: 1 },

  // Row 3 (Upper-Mid Core — includes Site 1 in pale peach #fed7aa)
  { id: "r3c1", points: "0,145 122,135 112,210 0,205", heatLevel: 0, noCarLevel: 1, age65Level: 2 },
  { id: "r3c2", points: "122,135 212,128 198,195 112,210", heatLevel: 3, noCarLevel: 3, age65Level: 3 },
  { id: "r3c3", points: "212,128 282,122 275,192 198,195", heatLevel: 4, noCarLevel: 4, age65Level: 4, siteId: 1 },
  { id: "r3c4", points: "282,122 365,118 355,188 275,192", heatLevel: 2, noCarLevel: 3, age65Level: 2 },
  { id: "r3c5", points: "365,118 452,115 445,182 355,188", heatLevel: 1, noCarLevel: 2, age65Level: 2 },
  { id: "r3c6", points: "452,115 558,125 545,185 445,182", heatLevel: 1, noCarLevel: 1, age65Level: 1 },
  { id: "r3c7", points: "558,125 655,132 642,175 545,185", heatLevel: 2, noCarLevel: 1, age65Level: 1 },
  { id: "r3c8", points: "655,132 760,140 760,190 642,175", heatLevel: 1, noCarLevel: 0, age65Level: 1 },

  // Row 4 (Center / Downtown & Site 2 & Site 4)
  { id: "r4c1", points: "0,205 112,210 105,275 0,270", heatLevel: 0, noCarLevel: 1, age65Level: 1 },
  { id: "r4c2", points: "112,210 198,195 188,268 105,275", heatLevel: 2, noCarLevel: 3, age65Level: 3 },
  { id: "r4c3", points: "198,195 275,192 268,262 188,268", heatLevel: 3, noCarLevel: 4, age65Level: 3 },
  { id: "r4c4", points: "275,192 355,188 350,258 268,262", heatLevel: 3, noCarLevel: 3, age65Level: 2 },
  { id: "r4c5", points: "355,188 445,182 435,255 350,258", heatLevel: 4, noCarLevel: 4, age65Level: 3 },
  { id: "r4c6", points: "445,182 545,185 532,262 435,255", heatLevel: 4, noCarLevel: 3, age65Level: 3, siteId: 2 },
  { id: "r4c7", points: "545,185 642,175 628,255 532,262", heatLevel: 4, noCarLevel: 1, age65Level: 1 },
  { id: "r4c8", points: "642,175 760,190 760,260 628,255", heatLevel: 3, noCarLevel: 1, age65Level: 1, siteId: 4 },

  // Row 5 (South-Central Core)
  { id: "r5c1", points: "0,270 105,275 95,345 0,340", heatLevel: 1, noCarLevel: 2, age65Level: 2 },
  { id: "r5c2", points: "105,275 188,268 178,340 95,345", heatLevel: 2, noCarLevel: 3, age65Level: 3 },
  { id: "r5c3", points: "188,268 268,262 258,335 178,340", heatLevel: 2, noCarLevel: 3, age65Level: 3 },
  { id: "r5c4", points: "268,262 350,258 342,330 258,335", heatLevel: 3, noCarLevel: 4, age65Level: 3 },
  { id: "r5c5", points: "350,258 435,255 425,332 342,330", heatLevel: 4, noCarLevel: 3, age65Level: 3 },
  { id: "r5c6", points: "435,255 532,262 518,338 425,332", heatLevel: 3, noCarLevel: 2, age65Level: 2 },
  { id: "r5c7", points: "532,262 628,255 615,335 518,338", heatLevel: 2, noCarLevel: 1, age65Level: 2 },
  { id: "r5c8", points: "628,255 760,260 760,340 615,335", heatLevel: 2, noCarLevel: 1, age65Level: 1 },

  // Row 6 (South Atlanta — includes Site 3 in pale peach and Site 5 in SW)
  { id: "r6c1", points: "0,340 95,345 88,415 0,412", heatLevel: 1, noCarLevel: 2, age65Level: 2 },
  { id: "r6c2", points: "95,345 178,340 168,415 88,415", heatLevel: 2, noCarLevel: 2, age65Level: 2, siteId: 5 },
  { id: "r6c3", points: "178,340 258,335 248,412 168,415", heatLevel: 3, noCarLevel: 3, age65Level: 3 },
  { id: "r6c4", points: "258,335 342,330 335,410 248,412", heatLevel: 4, noCarLevel: 4, age65Level: 3, siteId: 3 },
  { id: "r6c5", points: "342,330 425,332 415,412 335,410", heatLevel: 4, noCarLevel: 4, age65Level: 4 },
  { id: "r6c6", points: "425,332 518,338 505,415 415,412", heatLevel: 3, noCarLevel: 2, age65Level: 2 },
  { id: "r6c7", points: "518,338 615,335 602,415 505,415", heatLevel: 1, noCarLevel: 1, age65Level: 1 },
  { id: "r6c8", points: "615,335 760,340 760,415 602,415", heatLevel: 0, noCarLevel: 0, age65Level: 1 },

  // Row 7 (Bottom Perimeter Edge)
  { id: "r7c1", points: "0,412 88,415 82,480 0,480", heatLevel: 0, noCarLevel: 1, age65Level: 1 },
  { id: "r7c2", points: "88,415 168,415 160,480 82,480", heatLevel: 2, noCarLevel: 2, age65Level: 2 },
  { id: "r7c3", points: "168,415 248,412 240,480 160,480", heatLevel: 2, noCarLevel: 2, age65Level: 2 },
  { id: "r7c4", points: "248,412 335,410 328,480 240,480", heatLevel: 1, noCarLevel: 2, age65Level: 2 },
  { id: "r7c5", points: "335,410 415,412 408,480 328,480", heatLevel: 2, noCarLevel: 3, age65Level: 2 },
  { id: "r7c6", points: "415,412 505,415 498,480 408,480", heatLevel: 3, noCarLevel: 2, age65Level: 2 },
  { id: "r7c7", points: "505,415 602,415 595,480 498,480", heatLevel: 0, noCarLevel: 1, age65Level: 1 },
  { id: "r7c8", points: "602,415 760,415 760,480 595,480", heatLevel: 0, noCarLevel: 0, age65Level: 0 },
];

// Pin coordinates matching Screenshot 1
const PIN_COORDS: Record<number, { x: number; y: number }> = {
  1: { x: 238, y: 158 },
  2: { x: 486, y: 222 },
  3: { x: 350, y: 372 },
  4: { x: 678, y: 205 },
  5: { x: 112, y: 378 },
};

export const AtlantaMap: React.FC<AtlantaMapProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  centersToFund,
  setCentersToFund,
  activeLayer,
  setActiveLayer,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLiveGoogleMap, setShowLiveGoogleMap] = useState(false);

  const activeSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  const getPolygonFill = (poly: TractPoly) => {
    const level =
      activeLayer === "heat"
        ? poly.heatLevel
        : activeLayer === "nocar"
        ? poly.noCarLevel
        : poly.age65Level;
    return LEVEL_COLORS[level];
  };

  return (
    <div className="bg-[#0f1724] border border-[#1e2c42] rounded-2xl flex flex-col overflow-hidden shadow-xl">
      {/* Top Header of Map Card */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 leading-snug">
            Atlanta · predicted heat offset by tract
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Map mockup · live build uses Google Maps + Census tract boundaries
          </p>
        </div>

        {/* Layer Segmented Control + Live Google Maps Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0b111b] border border-[#1f2d42] p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveLayer("heat");
                setShowLiveGoogleMap(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all ${
                activeLayer === "heat" && !showLiveGoogleMap
                  ? "bg-[#f97316] text-[#090d16] font-bold shadow-sm"
                  : "text-slate-300 hover:text-white font-medium"
              }`}
            >
              Heat offset
            </button>
            <button
              onClick={() => {
                setActiveLayer("nocar");
                setShowLiveGoogleMap(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all ${
                activeLayer === "nocar" && !showLiveGoogleMap
                  ? "bg-[#f97316] text-[#090d16] font-bold shadow-sm"
                  : "text-slate-300 hover:text-white font-medium"
              }`}
            >
              No car
            </button>
            <button
              onClick={() => {
                setActiveLayer("age65");
                setShowLiveGoogleMap(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all ${
                activeLayer === "age65" && !showLiveGoogleMap
                  ? "bg-[#f97316] text-[#090d16] font-bold shadow-sm"
                  : "text-slate-300 hover:text-white font-medium"
              }`}
            >
              Age 65+
            </button>
          </div>

          <button
            onClick={() => setShowLiveGoogleMap(!showLiveGoogleMap)}
            title="Switch between Census Tract Choropleth and Live Google Maps Embed"
            className={`px-2.5 py-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              showLiveGoogleMap
                ? "bg-[#f97316]/20 border-[#f97316] text-[#fb923c] font-bold"
                : "bg-[#0b111b] border-[#1f2d42] text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showLiveGoogleMap ? "Tract View" : "Google Map"}</span>
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="px-5">
        <div className="relative w-full h-[430px] bg-[#090e17] border border-[#1e2c42] rounded-xl overflow-hidden select-none">
          {!showLiveGoogleMap ? (
            <svg
              viewBox="0 0 760 480"
              preserveAspectRatio="none"
              className="w-full h-full transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Census Tract Polygons */}
              <g>
                {TRACT_POLYGONS.map((poly) => (
                  <polygon
                    key={poly.id}
                    points={poly.points}
                    fill={getPolygonFill(poly)}
                    stroke="#0b111b"
                    strokeWidth="2.2"
                    onClick={() => {
                      if (poly.siteId) onSelectSite(poly.siteId);
                    }}
                    className="cursor-pointer transition-opacity hover:opacity-90"
                  />
                ))}
              </g>

              {/* Chattahoochee River (NW to SW) */}
              <path
                d="M 0,72 Q 95,120 112,185 T 72,330 T 48,480"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeOpacity="0.75"
              />
              <text
                x="14"
                y="124"
                fill="#60a5fa"
                fontSize="11"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                opacity="0.9"
              >
                Chattahoochee R.
              </text>

              {/* I-285 Perimeter Loop (Dashed) */}
              <ellipse
                cx="392"
                cy="255"
                rx="288"
                ry="198"
                fill="none"
                stroke="#64748b"
                strokeWidth="1.6"
                strokeDasharray="6 5"
                opacity="0.75"
              />

              {/* I-75/85 North-South Highway */}
              <path
                d="M 366,0 Q 378,130 375,240 T 365,480"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                opacity="0.8"
              />

              {/* I-20 East-West Highway */}
              <path
                d="M 0,256 Q 220,248 380,238 T 760,245"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                opacity="0.8"
              />

              {/* Highway Label Badges */}
              {/* I-75/85 Badge */}
              <g transform="translate(335, 18)">
                <rect width="58" height="20" rx="4" fill="#0b111b" fillOpacity="0.88" stroke="#1e2c42" />
                <text
                  x="29"
                  y="13.5"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  I-75/85
                </text>
              </g>

              {/* I-285 Badge */}
              <g transform="translate(632, 62)">
                <rect width="46" height="20" rx="4" fill="#0b111b" fillOpacity="0.88" stroke="#1e2c42" />
                <text
                  x="23"
                  y="13.5"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  I-285
                </text>
              </g>

              {/* I-20 Badge */}
              <g transform="translate(16, 260)">
                <rect width="38" height="20" rx="4" fill="#0b111b" fillOpacity="0.88" stroke="#1e2c42" />
                <text
                  x="19"
                  y="13.5"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  I-20
                </text>
              </g>

              {/* Downtown Marker & Label */}
              <circle cx="376" cy="218" r="4" fill="#ffffff" />
              <text
                x="386"
                y="222"
                fill="#ffffff"
                fontSize="11"
                fontWeight="600"
                opacity="0.95"
              >
                Downtown
              </text>

              {/* Dashed Straight-Line Reach Rings around Funded Sites (1..centersToFund) */}
              {sites.slice(0, centersToFund).map((site) => {
                const pos = PIN_COORDS[site.id];
                if (!pos) return null;
                return (
                  <circle
                    key={`ring-${site.id}`}
                    cx={pos.x}
                    cy={pos.y}
                    r="68"
                    fill="none"
                    stroke="#0b111b"
                    strokeWidth="2.2"
                    strokeDasharray="6 5"
                    opacity="0.9"
                  />
                );
              })}

              {/* Site Pins 1 to 5 */}
              {sites.map((site) => {
                const pos = PIN_COORDS[site.id];
                if (!pos) return null;
                const isFunded = site.id <= centersToFund;
                const isSelected = site.id === selectedSiteId;

                return (
                  <g
                    key={site.id}
                    onClick={() => onSelectSite(site.id)}
                    className="cursor-pointer"
                  >
                    {/* Outer selection ring for active funded site */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="19"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.5"
                      />
                    )}

                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isFunded ? 14 : 13}
                      fill={isFunded ? "#ffffff" : "#162030"}
                      stroke={isFunded ? "#0b111b" : "#94a3b8"}
                      strokeWidth={isFunded ? "2.5" : "1.8"}
                      strokeDasharray={isFunded ? undefined : "3 2"}
                    />

                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill={isFunded ? "#090d16" : "#cbd5e1"}
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="ui-monospace, SFMono-Regular, monospace"
                    >
                      {site.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="w-full h-full relative">
              <iframe
                title="Atlanta Live Google Maps"
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  filter: "invert(90%) hue-rotate(180deg) brightness(90%) contrast(105%)",
                }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${activeSite.lat},${activeSite.lon}&z=14&output=embed`}
              />
            </div>
          )}

          {/* Top-Right Zoom Controls */}
          <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
              className="w-8 h-8 bg-[#0f1724]/95 border border-[#26364f] text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg flex items-center justify-center shadow-md transition-colors"
              title="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.15).toFixed(2)))}
              className="w-8 h-8 bg-[#0f1724]/95 border border-[#26364f] text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg flex items-center justify-center shadow-md transition-colors"
              title="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom-Left Overlay Badge */}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#0b111b]/90 border border-[#1e2c42] text-[11px] font-mono text-slate-300 pointer-events-none">
            Dashed ring = straight-line reach
          </div>

          {/* Bottom-Right Overlay Badge */}
          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-[#0b111b]/90 border border-[#1e2c42] text-[11px] text-slate-400 pointer-events-none">
            Base map: Google Maps (in build) · Tracts: Census TIGER/Line
          </div>
        </div>
      </div>

      {/* Bottom Legend & Centers to Fund Control Bar */}
      <div className="px-5 py-3.5 flex flex-wrap items-center justify-between text-xs gap-4">
        {/* Left: 5-Swatch Discrete Legend */}
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400 text-xs">Cooler</span>
          <div className="flex items-center gap-1">
            <span className="w-5 h-2.5 rounded-[2px] bg-[#182334] border border-slate-700/60" />
            <span className="w-5 h-2.5 rounded-[2px] bg-[#7c3a21]" />
            <span className="w-5 h-2.5 rounded-[2px] bg-[#d95b16]" />
            <span className="w-5 h-2.5 rounded-[2px] bg-[#f97316]" />
            <span className="w-5 h-2.5 rounded-[2px] bg-[#fed7aa]" />
          </div>
          <span className="text-slate-400 text-xs">Hotter than city average</span>
        </div>

        {/* Right: Centers to fund stepper + 5 pill bars */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs">Centers to fund</span>

          <div className="inline-flex items-center bg-[#0b111b] border border-[#223147] rounded-lg overflow-hidden">
            <button
              onClick={() => setCentersToFund((prev) => Math.max(1, prev - 1))}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white font-mono text-sm transition-colors"
            >
              −
            </button>
            <span className="px-2.5 font-mono font-bold text-slate-100 text-xs">
              {centersToFund}
            </span>
            <button
              onClick={() => setCentersToFund((prev) => Math.min(5, prev + 1))}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white font-mono text-sm transition-colors"
            >
              +
            </button>
          </div>

          {/* 5 discrete funding bar segments matching Screenshot 1 */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((idx) => (
              <span
                key={idx}
                className={`w-4 h-2 rounded-[2px] transition-colors ${
                  idx <= centersToFund ? "bg-[#f97316]" : "bg-[#1e2c42]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
