"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import { Plus, Minus, Map as MapIcon } from "lucide-react";

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

  const activeSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  // Stylized polygonal tracts matching PDF image 1
  const mapPolygons = [
    // Top-left / Northwest cooler tracts
    { id: "p1", points: "60,40 180,40 170,120 70,110", fill: "#1a2638" },
    { id: "p2", points: "180,40 300,40 280,115 170,120", fill: "#162030" },
    { id: "p3", points: "300,40 430,40 410,120 280,115", fill: "#1d2b3f" },
    { id: "p4", points: "430,40 540,40 530,120 410,120", fill: "#172233" },

    // Middle-North warm tracts
    { id: "p5", points: "70,110 170,120 180,185 80,180", fill: "#c2410c" },
    { id: "p6", points: "170,120 280,115 290,180 180,185", fill: "#ea580c" },
    { id: "p7", points: "280,115 410,120 405,185 290,180", fill: "#f97316" },
    { id: "p8", points: "410,120 530,120 520,185 405,185", fill: "#c2410c" },

    // Core Center / Site 1 area (Hotter peach/orange tracts)
    { id: "p9", points: "180,185 290,180 300,245 190,250", fill: "#fed7aa" }, // Hot Site 1 zone (peach)
    { id: "p10", points: "290,180 405,185 400,245 300,245", fill: "#f97316" },
    { id: "p11", points: "405,185 520,185 510,245 400,245", fill: "#ea580c" },
    { id: "p12", points: "80,180 180,185 190,250 90,245", fill: "#ea580c" },

    // East side / Site 4 area (Vivid orange tract)
    { id: "p13", points: "400,245 510,245 500,310 395,310", fill: "#f97316" }, // Site 4 zone
    { id: "p14", points: "300,245 400,245 395,310 295,310", fill: "#fed7aa" }, // Site 2 zone (peach)
    { id: "p15", points: "190,250 300,245 295,310 185,310", fill: "#ea580c" },
    { id: "p16", points: "90,245 190,250 185,310 85,310", fill: "#c2410c" },

    // South Core / Site 3 and Site 5 zones
    { id: "p17", points: "85,310 185,310 180,380 75,375", fill: "#ea580c" }, // Site 5 area
    { id: "p18", points: "185,310 295,310 290,380 180,380", fill: "#fed7aa" }, // Site 3 zone
    { id: "p19", points: "295,310 395,310 390,380 290,380", fill: "#ea580c" },
    { id: "p20", points: "395,310 500,310 490,380 390,380", fill: "#c2410c" },
  ];

  // Specific marker coordinates matching PDF screen
  const pinPositions: Record<number, { x: number; y: number }> = {
    1: { x: 245, y: 215 }, // Site 1 (Inside light peach polygon)
    2: { x: 350, y: 280 }, // Site 2 (Southeast of center)
    3: { x: 295, y: 345 }, // Site 3 (South)
    4: { x: 445, y: 245 }, // Site 4 (East)
    5: { x: 135, y: 345 }, // Site 5 (Southwest)
  };

  return (
    <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      {/* Map Header */}
      <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#0a0f1a]">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>Atlanta · predicted heat offset by tract</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Map mockup · live build uses Google Maps + Census tract boundaries
          </p>
        </div>

        {/* Layer Toggles & Mode Switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#090d16] border border-slate-800 p-0.5 rounded-full text-xs">
            <button
              onClick={() => setActiveLayer("heat")}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                activeLayer === "heat"
                  ? "bg-[#ea580c] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Heat offset
            </button>
            <button
              onClick={() => setActiveLayer("nocar")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeLayer === "nocar"
                  ? "bg-[#ea580c] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              No car
            </button>
            <button
              onClick={() => setActiveLayer("age65")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeLayer === "age65"
                  ? "bg-[#ea580c] text-white shadow-sm"
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

      {/* Map Canvas Viewport */}
      <div className="relative w-full h-[400px] bg-[#090e18] overflow-hidden select-none">
        {viewMode === "choropleth" ? (
          <svg
            viewBox="0 0 600 420"
            className="w-full h-full transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Census Tract Polygons */}
            <g>
              {mapPolygons.map((poly) => (
                <polygon
                  key={poly.id}
                  points={poly.points}
                  fill={poly.fill}
                  stroke="#0a0f1a"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-opacity hover:opacity-90"
                />
              ))}
            </g>

            {/* Chattahoochee River line & text */}
            <path
              d="M 40,40 Q 110,80 130,150 T 80,260 T 30,390"
              fill="none"
              stroke="#0284c7"
              strokeWidth="3.5"
              strokeOpacity="0.6"
            />
            <text x="60" y="95" fill="#67e8f9" fontSize="10" fontWeight="500" opacity="0.8">
              Chattahoochee R.
            </text>

            {/* I-285 Highway (outer boundary loop) */}
            <path
              d="M 50,210 Q 50,45 290,45 T 530,210 T 290,395 T 50,210"
              fill="none"
              stroke="#475569"
              strokeWidth="1.8"
              strokeDasharray="6 4"
              opacity="0.7"
            />
            <text x="480" y="115" fill="#94a3b8" fontSize="9" fontWeight="bold">
              I-285
            </text>

            {/* I-20 Highway (horizontal line across map) */}
            <line
              x1="40"
              y1="215"
              x2="550"
              y2="215"
              stroke="#64748b"
              strokeWidth="1.8"
              opacity="0.75"
            />
            <text x="65" y="210" fill="#94a3b8" fontSize="9" fontWeight="bold">
              I-20
            </text>

            {/* I-75/85 Connector (vertical diagonal line) */}
            <line
              x1="240"
              y1="40"
              x2="340"
              y2="390"
              stroke="#64748b"
              strokeWidth="2"
              opacity="0.75"
            />
            <text x="365" y="60" fill="#94a3b8" fontSize="9" fontWeight="bold">
              I-75/85
            </text>

            {/* Downtown Label & Dot */}
            <circle cx="285" cy="210" r="3" fill="#fbbf24" />
            <text x="293" y="213" fill="#fde68a" fontSize="9" fontWeight="600" opacity="0.9">
              Downtown
            </text>

            {/* Dashed Buffer Ring around Site 1 */}
            <circle
              cx={pinPositions[1].x}
              cy={pinPositions[1].y}
              r="40"
              fill="none"
              stroke="#0a0f1a"
              strokeWidth="2"
              strokeDasharray="4 3"
            />

            {/* Numbered Pins (1, 2, 3, 4, 5) */}
            {[1, 2, 3, 4, 5].map((id) => {
              const pos = pinPositions[id];
              const isSelected = id === selectedSiteId;
              const isSite4 = id === 4;

              return (
                <g
                  key={id}
                  onClick={() => onSelectSite(id)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  {/* Pin outer circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 11 : 9.5}
                    fill={isSite4 ? "#1e293b" : "#ffffff"}
                    stroke="#090d16"
                    strokeWidth="2"
                    strokeDasharray={isSite4 ? "3 2" : undefined}
                    className="drop-shadow-md"
                  />

                  {/* Pin inner text */}
                  <text
                    x={pos.x}
                    y={pos.y + 3.5}
                    textAnchor="middle"
                    fill={isSite4 ? "#cbd5e1" : "#090d16"}
                    fontSize={isSelected ? "11" : "9.5"}
                    fontWeight="bold"
                  >
                    {id}
                  </text>
                </g>
              );
            })}

            {/* Internal Annotation Footnotes at Bottom of Map Frame */}
            <text x="20" y="405" fill="#94a3b8" fontSize="9" fontWeight="medium">
              Dashed ring = straight-line reach
            </text>
            <text x="380" y="405" fill="#64748b" fontSize="8.5">
              Base map: Google Maps (in build) · Tracts: Census TIGER/Line
            </text>
          </svg>
        ) : (
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
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shadow-md">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="h-px bg-slate-800 mx-1"></div>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Control Bar: Gradient & Centers to Fund */}
      <div className="px-5 py-2.5 border-t border-slate-800/80 bg-[#0a0f1a] flex items-center justify-between text-xs">
        {/* Gradient Legend */}
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400 text-[11px]">Cooler</span>
          <div className="w-24 h-2.5 rounded-sm bg-gradient-to-r from-[#1a2638] via-[#ea580c] to-[#fed7aa] border border-slate-800"></div>
          <span className="text-slate-400 text-[11px]">Hotter than city average</span>
        </div>

        {/* Centers to fund interactive counter */}
        <div className="flex items-center gap-2 bg-[#090d16] border border-slate-800 px-3 py-1 rounded-full shadow-sm">
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
    </div>
  );
};
