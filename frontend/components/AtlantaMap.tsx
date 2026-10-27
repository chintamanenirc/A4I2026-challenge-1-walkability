"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import { Plus, Minus, Map as MapIcon, Layers } from "lucide-react";

interface AtlantaMapProps {
  sites: SiteData[];
  selectedSiteId: number;
  onSelectSite: (id: number) => void;
  centersToFund: number;
  setCentersToFund: (fn: (prev: number) => number) => void;
  activeLayer: "heat" | "nocar" | "age65";
  setActiveLayer: (layer: "heat" | "nocar" | "age65") => void;
}

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
  const [viewMode, setViewMode] = useState<"choropleth" | "googlemaps">("choropleth");

  // Selected site for dashed ring & focus
  const activeSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  // Map coordinates to SVG viewport (Atlanta bounding box approx 33.65 - 33.85, -84.50 - -84.30)
  const mapWidth = 600;
  const mapHeight = 440;

  const latToY = (lat: number) => {
    // 33.85 top -> 0, 33.65 bottom -> mapHeight
    return ((33.86 - lat) / (33.86 - 33.64)) * mapHeight;
  };

  const lonToX = (lon: number) => {
    // -84.52 left -> 0, -84.28 right -> mapWidth
    return ((lon - (-84.52)) / (-84.28 - (-84.52))) * mapWidth;
  };

  // Predefined stylized Atlanta tracts polygon paths
  const tracts = [
    // Downtown / Midtown / Core
    { id: "t1", d: "M 280,180 L 320,175 L 340,210 L 310,230 L 275,210 Z", offset: 3.4, noCar: 22, age65: 14 },
    { id: "t2", d: "M 320,175 L 370,170 L 390,210 L 340,210 Z", offset: 2.8, noCar: 18, age65: 12 },
    { id: "t3", d: "M 240,190 L 280,180 L 275,210 L 230,225 Z", offset: 3.8, noCar: 26, age65: 15 },
    // South Atlanta / Thomasville / Peoplestown (Hotter cluster)
    { id: "t4", d: "M 310,230 L 360,225 L 390,265 L 340,285 L 295,260 Z", offset: 4.1, noCar: 28, age65: 18 }, // Site 1 area
    { id: "t5", d: "M 260,230 L 310,230 L 295,260 L 245,265 Z", offset: 3.7, noCar: 25, age65: 16 }, // Site 2 area
    { id: "t6", d: "M 215,230 L 260,230 L 245,265 L 205,260 Z", offset: 3.2, noCar: 29, age65: 15 }, // Site 3 area
    { id: "t7", d: "M 340,285 L 390,265 L 430,310 L 370,335 Z", offset: 4.3, noCar: 24, age65: 17 }, // High heat south
    { id: "t8", d: "M 275,290 L 340,285 L 370,335 L 310,350 L 250,330 Z", offset: 3.9, noCar: 23, age65: 19 },
    // Westside / Bankhead (Site 4 area)
    { id: "t9", d: "M 160,190 L 230,190 L 215,230 L 140,225 Z", offset: 3.0, noCar: 20, age65: 13 }, // Site 4
    { id: "t10", d: "M 120,230 L 205,230 L 195,270 L 110,260 Z", offset: 3.1, noCar: 21, age65: 14 },
    { id: "t11", d: "M 170,270 L 245,265 L 230,320 L 160,310 Z", offset: 2.9, noCar: 19, age65: 15 },
    // North / Buckhead (Cooler)
    { id: "t12", d: "M 260,110 L 330,100 L 350,150 L 280,155 Z", offset: 1.2, noCar: 6, age65: 22 },
    { id: "t13", d: "M 330,100 L 400,95 L 420,145 L 350,150 Z", offset: 1.0, noCar: 5, age65: 24 },
    { id: "t14", d: "M 200,120 L 260,110 L 280,155 L 215,160 Z", offset: 1.6, noCar: 8, age65: 19 },
    // East Atlanta / Decatur fringe
    { id: "t15", d: "M 390,210 L 450,200 L 480,250 L 415,260 Z", offset: 2.2, noCar: 12, age65: 14 },
    { id: "t16", d: "M 415,260 L 480,250 L 505,300 L 440,310 Z", offset: 2.5, noCar: 14, age65: 16 },
    // South / Airport Fringe (Site 5 area)
    { id: "t17", d: "M 220,330 L 290,325 L 310,380 L 230,390 Z", offset: 2.8, noCar: 21, age65: 16 }, // Site 5
    { id: "t18", d: "M 290,325 L 360,320 L 380,385 L 310,380 Z", offset: 3.6, noCar: 22, age65: 17 },
  ];

  // Helper color function based on active layer
  const getTractFill = (t: typeof tracts[0]) => {
    if (activeLayer === "heat") {
      if (t.offset >= 4.0) return "#ea580c"; // Deep hot orange
      if (t.offset >= 3.4) return "#f97316"; // Vivid orange
      if (t.offset >= 2.8) return "#fb923c"; // Medium amber
      if (t.offset >= 2.0) return "#fdba74"; // Light amber
      return "#334155"; // Cooler slate
    } else if (activeLayer === "nocar") {
      if (t.noCar >= 25) return "#ea580c";
      if (t.noCar >= 20) return "#f97316";
      if (t.noCar >= 15) return "#fb923c";
      return "#1e293b";
    } else {
      // Age 65+
      if (t.age65 >= 20) return "#7c3aed";
      if (t.age65 >= 16) return "#a855f7";
      return "#1e293b";
    }
  };

  return (
    <div className="bg-[#0d131f] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      {/* Map Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0b101b]">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Atlanta · predicted heat offset by tract</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Map mockup · live build uses Google Maps + Census tract boundaries
          </p>
        </div>

        {/* Layer Toggles & Mode Switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-full text-xs">
            <button
              onClick={() => setActiveLayer("heat")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeLayer === "heat"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Heat offset
            </button>
            <button
              onClick={() => setActiveLayer("nocar")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeLayer === "nocar"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              No car
            </button>
            <button
              onClick={() => setActiveLayer("age65")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeLayer === "age65"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Age 65+
            </button>
          </div>

          <button
            onClick={() => setViewMode(viewMode === "choropleth" ? "googlemaps" : "choropleth")}
            title="Toggle Google Maps live view"
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              viewMode === "googlemaps"
                ? "bg-sky-950/80 border-sky-500/50 text-sky-300"
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="text-[10px]">{viewMode === "googlemaps" ? "Satellite" : "Tracts"}</span>
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-[380px] bg-[#070b12] overflow-hidden select-none">
        {viewMode === "choropleth" ? (
          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full h-full transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <defs>
              {/* Pattern for background water or texture */}
              <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="1%" stopColor="#0284c7" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Chattahoochee River */}
            <path
              d="M 50,40 Q 120,90 140,160 T 90,270 T 40,400"
              fill="none"
              stroke="#0284c7"
              strokeWidth="4"
              strokeOpacity="0.5"
            />
            <text x="75" y="110" fill="#38bdf8" fontSize="10" fontStyle="italic" opacity="0.7">
              Chattahoochee R.
            </text>

            {/* I-285 Outer Perimeter Loop */}
            <ellipse
              cx="300"
              cy="220"
              rx="240"
              ry="180"
              fill="none"
              stroke="#334155"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              opacity="0.6"
            />
            <text x="520" y="120" fill="#64748b" fontSize="10" fontWeight="bold">
              I-285
            </text>

            {/* I-20 Highway (East - West) */}
            <path
              d="M 60,235 L 540,235"
              fill="none"
              stroke="#475569"
              strokeWidth="2"
              opacity="0.7"
            />
            <text x="80" y="230" fill="#64748b" fontSize="10" fontWeight="bold">
              I-20
            </text>

            {/* I-75 / I-85 Downtown Connector (North - South) */}
            <path
              d="M 260,50 L 300,160 L 305,250 L 330,420"
              fill="none"
              stroke="#475569"
              strokeWidth="2.5"
              opacity="0.7"
            />
            <text x="395" y="70" fill="#64748b" fontSize="10" fontWeight="bold">
              I-75/85
            </text>

            {/* Census Tract Polygons */}
            <g className="cursor-pointer">
              {tracts.map((t) => (
                <path
                  key={t.id}
                  d={t.d}
                  fill={getTractFill(t)}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  className="transition-all duration-200 hover:opacity-90 hover:stroke-amber-300"
                />
              ))}
            </g>

            {/* Downtown Label */}
            <g>
              <circle cx="300" cy="200" r="3" fill="#f59e0b" />
              <text x="308" y="204" fill="#fbbf24" fontSize="10" fontWeight="600" opacity="0.9">
                Downtown
              </text>
            </g>

            {/* Dashed Buffer Ring for Selected Site */}
            {activeSite && (
              <circle
                cx={lonToX(activeSite.lon)}
                cy={latToY(activeSite.lat)}
                r="42"
                fill="none"
                stroke="#ea580c"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="animate-pulse"
              />
            )}

            {/* Numbered Pins (1 to 5) */}
            {sites.map((site) => {
              const cx = lonToX(site.lon);
              const cy = latToY(site.lat);
              const isSelected = site.id === selectedSiteId;
              const isFunded = site.id <= centersToFund;

              return (
                <g
                  key={site.id}
                  onClick={() => onSelectSite(site.id)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  {/* Pin outer aura if selected */}
                  {isSelected && (
                    <circle cx={cx} cy={cy} r="16" fill="#ea580c" fillOpacity="0.3" />
                  )}

                  {/* Pin circular body */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 11 : 9}
                    fill={isFunded ? (isSelected ? "#ea580c" : "#ffffff") : "#334155"}
                    stroke={isSelected ? "#ffffff" : "#1e293b"}
                    strokeWidth="2"
                    className="drop-shadow-lg"
                  />

                  {/* Pin Number */}
                  <text
                    x={cx}
                    y={cy + 3.5}
                    textAnchor="middle"
                    fill={isFunded ? (isSelected ? "#ffffff" : "#0f172a") : "#94a3b8"}
                    fontSize={isSelected ? "11" : "9"}
                    fontWeight="bold"
                  >
                    {site.id}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          /* Live Google Maps Embed View */
          <div className="w-full h-full relative">
            <iframe
              title="Atlanta Live Google Maps"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%)" }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${activeSite.lat},${activeSite.lon}&z=13&output=embed`}
            />
            <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-md text-[11px] text-slate-300 pointer-events-none">
              Google Maps Live Sync · {activeSite.name} ({activeSite.lat}, {activeSite.lon})
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shadow-md">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-800 mx-1"></div>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Footer Bar: Legend & Centers To Fund Counter */}
      <div className="px-5 py-3 border-t border-slate-800 bg-[#0b101b] flex items-center justify-between text-xs">
        {/* Gradient Legend */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">Cooler</span>
          <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-slate-600 via-amber-500 to-orange-600 border border-slate-700"></div>
          <span className="text-slate-400 text-[11px]">Hotter than city average</span>
        </div>

        {/* Centers to fund interactive counter */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full shadow-sm">
          <span className="text-slate-300 text-[11px] font-medium">Centers to fund</span>
          <button
            onClick={() => setCentersToFund((prev) => Math.max(1, prev - 1))}
            className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs transition-colors"
          >
            −
          </button>
          <span className="font-bold text-orange-400 text-xs px-1">{centersToFund}</span>
          <button
            onClick={() => setCentersToFund((prev) => Math.min(5, prev + 1))}
            className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Map Footnote Annotation */}
      <div className="px-5 py-1.5 border-t border-slate-800/60 bg-[#080d16] text-[10px] text-slate-500 flex justify-between">
        <span>Dashed ring = straight-line reach</span>
        <span>Base map: Google Maps (in build) · Tracts: Census TIGER/Line</span>
      </div>
    </div>
  );
};
