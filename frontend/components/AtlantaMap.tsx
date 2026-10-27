"use client";

import React, { useState } from "react";
import { SiteData } from "./types";
import {
  Plus,
  Minus,
  RotateCcw,
  Globe,
  Navigation,
  ExternalLink,
  Layers,
} from "lucide-react";

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
  tractCode: string;
  areaLabel: string;
  points: string;
  heatLevel: 0 | 1 | 2 | 3 | 4;
  noCarLevel: 0 | 1 | 2 | 3 | 4;
  age65Level: 0 | 1 | 2 | 3 | 4;
  estOffsetF: number;
  estNoCarPct: number;
  estAge65Pct: number;
  siteId?: number;
}

const LEVEL_COLORS: Record<number, string> = {
  0: "#182334",
  1: "#7c3a21",
  2: "#d95b16",
  3: "#f97316",
  4: "#fed7aa",
};

const TRACT_POLYGONS: TractPoly[] = [
  // Row 1 (Outer North / Northwest / Northeast)
  { id: "r1c1", tractCode: "98.01", areaLabel: "Riverside / NW", points: "0,0 115,0 105,68 0,75", heatLevel: 0, noCarLevel: 0, age65Level: 1, estOffsetF: -1.4, estNoCarPct: 4.2, estAge65Pct: 11.5 },
  { id: "r1c2", tractCode: "95.02", areaLabel: "Paces / West Paces", points: "115,0 235,0 220,62 105,68", heatLevel: 0, noCarLevel: 0, age65Level: 1, estOffsetF: -1.8, estNoCarPct: 3.1, estAge65Pct: 14.2 },
  { id: "r1c3", tractCode: "91.01", areaLabel: "Buckhead West", points: "235,0 355,0 348,58 220,62", heatLevel: 0, noCarLevel: 1, age65Level: 1, estOffsetF: -0.6, estNoCarPct: 7.4, estAge65Pct: 13.0 },
  { id: "r1c4", tractCode: "93.00", areaLabel: "Buckhead Central", points: "355,0 470,0 460,55 348,58", heatLevel: 0, noCarLevel: 0, age65Level: 2, estOffsetF: -0.4, estNoCarPct: 5.8, estAge65Pct: 16.4 },
  { id: "r1c5", tractCode: "100.01", areaLabel: "North Buckhead", points: "470,0 575,0 565,60 460,55", heatLevel: 0, noCarLevel: 0, age65Level: 1, estOffsetF: -1.1, estNoCarPct: 4.9, estAge65Pct: 12.8 },
  { id: "r1c6", tractCode: "101.06", areaLabel: "Pine Hills", points: "575,0 675,0 668,68 565,60", heatLevel: 0, noCarLevel: 0, age65Level: 1, estOffsetF: -0.9, estNoCarPct: 5.2, estAge65Pct: 11.9 },
  { id: "r1c7", tractCode: "214.05", areaLabel: "Brookhaven Border", points: "675,0 760,0 760,72 668,68", heatLevel: 0, noCarLevel: 0, age65Level: 0, estOffsetF: -1.5, estNoCarPct: 3.8, estAge65Pct: 9.4 },

  // Row 2 (Upper North Perimeter)
  { id: "r2c1", tractCode: "88.00", areaLabel: "Carey Park", points: "0,75 105,68 122,135 0,145", heatLevel: 0, noCarLevel: 1, age65Level: 1, estOffsetF: -0.3, estNoCarPct: 9.2, estAge65Pct: 12.1 },
  { id: "r2c2", tractCode: "87.00", areaLabel: "Scotts Crossing", points: "105,68 220,62 212,128 122,135", heatLevel: 3, noCarLevel: 2, age65Level: 2, estOffsetF: 2.6, estNoCarPct: 16.5, estAge65Pct: 14.8 },
  { id: "r2c3", tractCode: "89.02", areaLabel: "Underwood Hills", points: "220,62 348,58 330,118 212,128", heatLevel: 2, noCarLevel: 3, age65Level: 2, estOffsetF: 1.9, estNoCarPct: 19.2, estAge65Pct: 15.1 },
  { id: "r2c4", tractCode: "90.00", areaLabel: "Loring Heights", points: "348,58 460,55 452,115 330,118", heatLevel: 1, noCarLevel: 1, age65Level: 2, estOffsetF: 0.9, estNoCarPct: 8.7, estAge65Pct: 14.5 },
  { id: "r2c5", tractCode: "92.00", areaLabel: "Lindbergh", points: "460,55 565,60 558,125 452,115", heatLevel: 0, noCarLevel: 1, age65Level: 1, estOffsetF: 0.2, estNoCarPct: 10.4, estAge65Pct: 10.2 },
  { id: "r2c6", tractCode: "94.04", areaLabel: "Morningside North", points: "565,60 668,68 655,132 558,125", heatLevel: 0, noCarLevel: 0, age65Level: 1, estOffsetF: -0.7, estNoCarPct: 4.5, estAge65Pct: 11.8 },
  { id: "r2c7", tractCode: "202.00", areaLabel: "Druid Hills North", points: "668,68 760,72 760,140 655,132", heatLevel: 0, noCarLevel: 0, age65Level: 1, estOffsetF: -1.2, estNoCarPct: 4.1, estAge65Pct: 12.6 },

  // Row 3 (Upper-Mid Core — includes Site 1)
  { id: "r3c1", tractCode: "84.00", areaLabel: "Grove Park West", points: "0,145 122,135 112,210 0,205", heatLevel: 0, noCarLevel: 1, age65Level: 2, estOffsetF: 0.4, estNoCarPct: 11.2, estAge65Pct: 15.2 },
  { id: "r3c2", tractCode: "85.00", areaLabel: "Center Hill", points: "122,135 212,128 198,195 112,210", heatLevel: 3, noCarLevel: 3, age65Level: 3, estOffsetF: 2.8, estNoCarPct: 22.1, estAge65Pct: 16.9 },
  { id: "r3c3", tractCode: "68.02", areaLabel: "Thomasville (Site 1)", points: "212,128 282,122 275,192 198,195", heatLevel: 4, noCarLevel: 4, age65Level: 4, estOffsetF: 4.1, estNoCarPct: 24.6, estAge65Pct: 17.8, siteId: 1 },
  { id: "r3c4", tractCode: "10.01", areaLabel: "Home Park / Tech", points: "282,122 365,118 355,188 275,192", heatLevel: 2, noCarLevel: 3, age65Level: 2, estOffsetF: 2.1, estNoCarPct: 20.4, estAge65Pct: 13.8 },
  { id: "r3c5", tractCode: "12.01", areaLabel: "Midtown Core", points: "365,118 452,115 445,182 355,188", heatLevel: 1, noCarLevel: 2, age65Level: 2, estOffsetF: 1.4, estNoCarPct: 14.8, estAge65Pct: 13.1 },
  { id: "r3c6", tractCode: "15.00", areaLabel: "Virginia-Highland", points: "452,115 558,125 545,185 445,182", heatLevel: 1, noCarLevel: 1, age65Level: 1, estOffsetF: 0.8, estNoCarPct: 7.9, estAge65Pct: 11.4 },
  { id: "r3c7", tractCode: "30.00", areaLabel: "Poncey-Highland", points: "558,125 655,132 642,175 545,185", heatLevel: 2, noCarLevel: 1, age65Level: 1, estOffsetF: 1.7, estNoCarPct: 9.1, estAge65Pct: 10.9 },
  { id: "r3c8", tractCode: "204.00", areaLabel: "Candler Park", points: "655,132 760,140 760,190 642,175", heatLevel: 1, noCarLevel: 0, age65Level: 1, estOffsetF: 0.6, estNoCarPct: 5.4, estAge65Pct: 11.2 },

  // Row 4 (Center / Downtown & Site 2 & Site 4)
  { id: "r4c1", tractCode: "82.02", areaLabel: "Harvel Homes", points: "0,205 112,210 105,275 0,270", heatLevel: 0, noCarLevel: 1, age65Level: 1, estOffsetF: 0.1, estNoCarPct: 10.5, estAge65Pct: 12.3 },
  { id: "r4c2", tractCode: "25.00", areaLabel: "English Avenue", points: "112,210 198,195 188,268 105,275", heatLevel: 2, noCarLevel: 3, age65Level: 3, estOffsetF: 2.3, estNoCarPct: 26.4, estAge65Pct: 15.8 },
  { id: "r4c3", tractCode: "26.00", areaLabel: "Vine City", points: "198,195 275,192 268,262 188,268", heatLevel: 3, noCarLevel: 4, age65Level: 3, estOffsetF: 2.9, estNoCarPct: 31.2, estAge65Pct: 16.4 },
  { id: "r4c4", tractCode: "35.00", areaLabel: "Downtown / Five Points", points: "275,192 355,188 350,258 268,262", heatLevel: 3, noCarLevel: 3, age65Level: 2, estOffsetF: 3.1, estNoCarPct: 24.0, estAge65Pct: 12.9 },
  { id: "r4c5", tractCode: "44.00", areaLabel: "Sweet Auburn", points: "355,188 445,182 435,255 350,258", heatLevel: 4, noCarLevel: 4, age65Level: 3, estOffsetF: 3.4, estNoCarPct: 29.5, estAge65Pct: 15.7 },
  { id: "r4c6", tractCode: "62.00", areaLabel: "Peoplestown (Site 2)", points: "445,182 545,185 532,262 435,255", heatLevel: 4, noCarLevel: 3, age65Level: 3, estOffsetF: 3.7, estNoCarPct: 21.4, estAge65Pct: 16.2, siteId: 2 },
  { id: "r4c7", tractCode: "50.00", areaLabel: "Reynoldstown", points: "545,185 642,175 628,255 532,262", heatLevel: 4, noCarLevel: 1, age65Level: 1, estOffsetF: 3.1, estNoCarPct: 9.8, estAge65Pct: 10.6 },
  { id: "r4c8", tractCode: "24.00", areaLabel: "Bankhead (Site 4)", points: "642,175 760,190 760,260 628,255", heatLevel: 3, noCarLevel: 1, age65Level: 1, estOffsetF: 3.0, estNoCarPct: 16.2, estAge65Pct: 11.8, siteId: 4 },

  // Row 5 (South-Central Core)
  { id: "r5c1", tractCode: "81.02", areaLabel: "Adamsville", points: "0,270 105,275 95,345 0,340", heatLevel: 1, noCarLevel: 2, age65Level: 2, estOffsetF: 1.1, estNoCarPct: 15.6, estAge65Pct: 14.9 },
  { id: "r5c2", tractCode: "40.00", areaLabel: "Westview", points: "105,275 188,268 178,340 95,345", heatLevel: 2, noCarLevel: 3, age65Level: 3, estOffsetF: 1.9, estNoCarPct: 21.0, estAge65Pct: 16.1 },
  { id: "r5c3", tractCode: "42.00", areaLabel: "West End", points: "188,268 268,262 258,335 178,340", heatLevel: 2, noCarLevel: 3, age65Level: 3, estOffsetF: 2.2, estNoCarPct: 23.4, estAge65Pct: 15.5 },
  { id: "r5c4", tractCode: "57.00", areaLabel: "Pittsburgh", points: "268,262 350,258 342,330 258,335", heatLevel: 3, noCarLevel: 4, age65Level: 3, estOffsetF: 3.0, estNoCarPct: 25.7, estAge65Pct: 15.2 },
  { id: "r5c5", tractCode: "55.01", areaLabel: "Summerhill", points: "350,258 435,255 425,332 342,330", heatLevel: 4, noCarLevel: 3, age65Level: 3, estOffsetF: 3.3, estNoCarPct: 22.8, estAge65Pct: 14.9 },
  { id: "r5c6", tractCode: "53.00", areaLabel: "Grant Park", points: "435,255 532,262 518,338 425,332", heatLevel: 3, noCarLevel: 2, age65Level: 2, estOffsetF: 2.4, estNoCarPct: 12.1, estAge65Pct: 12.4 },
  { id: "r5c7", tractCode: "69.00", areaLabel: "Ormewood Park", points: "532,262 628,255 615,335 518,338", heatLevel: 2, noCarLevel: 1, age65Level: 2, estOffsetF: 1.8, estNoCarPct: 8.9, estAge65Pct: 13.2 },
  { id: "r5c8", tractCode: "208.01", areaLabel: "East Atlanta", points: "628,255 760,260 760,340 615,335", heatLevel: 2, noCarLevel: 1, age65Level: 1, estOffsetF: 1.6, estNoCarPct: 8.4, estAge65Pct: 11.7 },

  // Row 6 (South Atlanta — includes Site 3 and Site 5)
  { id: "r6c1", tractCode: "78.07", areaLabel: "Cascade Heights", points: "0,340 95,345 88,415 0,412", heatLevel: 1, noCarLevel: 2, age65Level: 2, estOffsetF: 0.9, estNoCarPct: 14.2, estAge65Pct: 16.0 },
  { id: "r6c2", tractCode: "65.00", areaLabel: "Lakewood Heights (Site 5)", points: "95,345 178,340 168,415 88,415", heatLevel: 2, noCarLevel: 2, age65Level: 2, estOffsetF: 2.8, estNoCarPct: 17.5, estAge65Pct: 12.1, siteId: 5 },
  { id: "r6c3", tractCode: "61.00", areaLabel: "Sylvan Hills", points: "178,340 258,335 248,412 168,415", heatLevel: 3, noCarLevel: 3, age65Level: 3, estOffsetF: 2.7, estNoCarPct: 20.8, estAge65Pct: 15.9 },
  { id: "r6c4", tractCode: "58.00", areaLabel: "Mechanicsville (Site 3)", points: "258,335 342,330 335,410 248,412", heatLevel: 4, noCarLevel: 4, age65Level: 3, estOffsetF: 3.2, estNoCarPct: 28.9, estAge65Pct: 14.5, siteId: 3 },
  { id: "r6c5", tractCode: "63.00", areaLabel: "South Atlanta", points: "342,330 425,332 415,412 335,410", heatLevel: 4, noCarLevel: 4, age65Level: 4, estOffsetF: 3.3, estNoCarPct: 27.4, estAge65Pct: 17.2 },
  { id: "r6c6", tractCode: "67.00", areaLabel: "Chosewood Park", points: "425,332 518,338 505,415 415,412", heatLevel: 3, noCarLevel: 2, age65Level: 2, estOffsetF: 2.5, estNoCarPct: 14.6, estAge65Pct: 13.0 },
  { id: "r6c7", tractCode: "70.01", areaLabel: "Boulevard Heights", points: "518,338 615,335 602,415 505,415", heatLevel: 1, noCarLevel: 1, age65Level: 1, estOffsetF: 1.0, estNoCarPct: 9.5, estAge65Pct: 11.8 },
  { id: "r6c8", tractCode: "238.01", areaLabel: "Gresham Park", points: "615,335 760,340 760,415 602,415", heatLevel: 0, noCarLevel: 0, age65Level: 1, estOffsetF: -0.2, estNoCarPct: 6.8, estAge65Pct: 12.2 },

  // Row 7 (Bottom Perimeter Edge)
  { id: "r7c1", tractCode: "77.05", areaLabel: "Campbellton Road", points: "0,412 88,415 82,480 0,480", heatLevel: 0, noCarLevel: 1, age65Level: 1, estOffsetF: -0.5, estNoCarPct: 10.1, estAge65Pct: 12.7 },
  { id: "r7c2", tractCode: "75.00", areaLabel: "Perkerson", points: "88,415 168,415 160,480 82,480", heatLevel: 2, noCarLevel: 2, age65Level: 2, estOffsetF: 1.8, estNoCarPct: 16.9, estAge65Pct: 13.5 },
  { id: "r7c3", tractCode: "74.00", areaLabel: "Blair Villa / Poole Creek", points: "168,415 248,412 240,480 160,480", heatLevel: 2, noCarLevel: 2, age65Level: 2, estOffsetF: 1.9, estNoCarPct: 17.8, estAge65Pct: 14.1 },
  { id: "r7c4", tractCode: "73.00", areaLabel: "Browns Mill Park", points: "248,412 335,410 328,480 240,480", heatLevel: 1, noCarLevel: 2, age65Level: 2, estOffsetF: 1.2, estNoCarPct: 15.2, estAge65Pct: 14.8 },
  { id: "r7c5", tractCode: "71.00", areaLabel: "South River Gardens", points: "335,410 415,412 408,480 328,480", heatLevel: 2, noCarLevel: 3, age65Level: 2, estOffsetF: 2.0, estNoCarPct: 21.3, estAge65Pct: 14.4 },
  { id: "r7c6", tractCode: "72.00", areaLabel: "Orchard Knob", points: "415,412 505,415 498,480 408,480", heatLevel: 3, noCarLevel: 2, age65Level: 2, estOffsetF: 2.5, estNoCarPct: 16.4, estAge65Pct: 13.9 },
  { id: "r7c7", tractCode: "110.00", areaLabel: "constitution / SE", points: "505,415 602,415 595,480 498,480", heatLevel: 0, noCarLevel: 1, age65Level: 1, estOffsetF: -0.4, estNoCarPct: 8.2, estAge65Pct: 11.6 },
  { id: "r7c8", tractCode: "238.03", areaLabel: "Panthersville", points: "602,415 760,415 760,480 595,480", heatLevel: 0, noCarLevel: 0, age65Level: 0, estOffsetF: -0.8, estNoCarPct: 5.9, estAge65Pct: 9.8 },
];

// Pin coordinates matching the tract map
const PIN_COORDS: Record<number, { x: number; y: number }> = {
  1: { x: 238, y: 158 },
  2: { x: 486, y: 222 },
  3: { x: 300, y: 372 },
  4: { x: 685, y: 215 },
  5: { x: 132, y: 378 },
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
  const [hoveredTract, setHoveredTract] = useState<TractPoly | null>(null);

  const activeSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
  const activeLon = activeSite.lon ?? activeSite.lng;

  const getPolygonFill = (poly: TractPoly) => {
    const level =
      activeLayer === "heat"
        ? poly.heatLevel
        : activeLayer === "nocar"
        ? poly.noCarLevel
        : poly.age65Level;
    return LEVEL_COLORS[level];
  };

  const layerDescriptions: Record<"heat" | "nocar" | "age65", { title: string; low: string; high: string }> = {
    heat: {
      title: "Atlanta · predicted heat offset by census tract",
      low: "Cooler (−1.8°F)",
      high: "Hotter (+4.1°F vs. city average)",
    },
    nocar: {
      title: "Atlanta · share of households without a vehicle",
      low: "Lower (<5% no car)",
      high: "Higher (>25% car-free households)",
    },
    age65: {
      title: "Atlanta · share of senior residents (age 65+)",
      low: "Younger (<10% 65+)",
      high: "Older (>17% seniors 65+)",
    },
  };

  const currentLayerInfo = layerDescriptions[activeLayer];

  return (
    <div className="bg-[#0f1724] border border-[#1e2c42] rounded-2xl flex flex-col overflow-hidden shadow-xl">
      {/* Top Header of Map Card */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#182336]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#f97316]" />
            <h2 className="text-base font-extrabold text-slate-100 leading-snug">
              {showLiveGoogleMap
                ? `Live Google Maps · Site ${activeSite.id}: ${activeSite.name}`
                : currentLayerInfo.title}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {showLiveGoogleMap
              ? `Inspecting [${activeSite.lat.toFixed(4)}, ${(activeSite.lon ?? activeSite.lng).toFixed(4)}] · Tract ${activeSite.shortTract}`
              : "Hover any census tract to inspect metrics · Click numbered pins (1–5) to select a site"}
          </p>
        </div>

        {/* Layer Segmented Control + Live Google Maps Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#0b111b] border border-[#1f2d42] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveLayer("heat");
                setShowLiveGoogleMap(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all ${
                activeLayer === "heat" && !showLiveGoogleMap
                  ? "bg-[#f97316] text-[#090d16] font-extrabold shadow-sm"
                  : "text-slate-300 hover:text-white font-medium"
              }`}
            >
              Heat offset
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLayer("nocar");
                setShowLiveGoogleMap(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all ${
                activeLayer === "nocar" && !showLiveGoogleMap
                  ? "bg-[#f97316] text-[#090d16] font-extrabold shadow-sm"
                  : "text-slate-300 hover:text-white font-medium"
              }`}
            >
              No car %
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLayer("age65");
                setShowLiveGoogleMap(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all ${
                activeLayer === "age65" && !showLiveGoogleMap
                  ? "bg-[#f97316] text-[#090d16] font-extrabold shadow-sm"
                  : "text-slate-300 hover:text-white font-medium"
              }`}
            >
              Age 65+ %
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLiveGoogleMap(!showLiveGoogleMap)}
            title="Switch between Census Tract Choropleth and Live Google Maps Embed"
            className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              showLiveGoogleMap
                ? "bg-[#f97316] border-[#f97316] text-[#090d16] font-extrabold shadow-sm"
                : "bg-[#0b111b] border-[#1f2d42] text-slate-300 hover:text-white hover:border-slate-600"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{showLiveGoogleMap ? "Back to Tracts" : "Google Map"}</span>
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="p-4 sm:px-5 sm:py-4">
        <div className="relative w-full h-[420px] bg-[#090e17] border border-[#1e2c42] rounded-xl overflow-hidden select-none">
          {!showLiveGoogleMap ? (
            <svg
              viewBox="0 0 760 480"
              preserveAspectRatio="none"
              className="w-full h-full transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Census Tract Polygons */}
              <g>
                {TRACT_POLYGONS.map((poly) => {
                  const isHovered = hoveredTract?.id === poly.id;
                  const isSelectedPoly = poly.siteId === selectedSiteId;
                  return (
                    <polygon
                      key={poly.id}
                      points={poly.points}
                      fill={getPolygonFill(poly)}
                      stroke={
                        isSelectedPoly
                          ? "#ffffff"
                          : isHovered
                          ? "#fdba74"
                          : "#0b111b"
                      }
                      strokeWidth={isSelectedPoly ? "3" : isHovered ? "2.6" : "2.1"}
                      onMouseEnter={() => setHoveredTract(poly)}
                      onMouseLeave={() => setHoveredTract(null)}
                      onClick={() => {
                        if (poly.siteId) {
                          onSelectSite(poly.siteId);
                        }
                      }}
                      className="cursor-pointer transition-opacity hover:opacity-95"
                    />
                  );
                })}
              </g>

              {/* Chattahoochee River (NW to SW) */}
              <path
                d="M 0,72 Q 95,120 112,185 T 72,330 T 48,480"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeOpacity="0.75"
                pointerEvents="none"
              />
              <text
                x="14"
                y="124"
                fill="#60a5fa"
                fontSize="11"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                opacity="0.9"
                pointerEvents="none"
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
                pointerEvents="none"
              />

              {/* I-75/85 North-South Highway */}
              <path
                d="M 366,0 Q 378,130 375,240 T 365,480"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                opacity="0.8"
                pointerEvents="none"
              />

              {/* I-20 East-West Highway */}
              <path
                d="M 0,256 Q 220,248 380,238 T 760,245"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                opacity="0.8"
                pointerEvents="none"
              />

              {/* Highway Label Badges */}
              <g transform="translate(335, 18)" pointerEvents="none">
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

              <g transform="translate(632, 62)" pointerEvents="none">
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

              <g transform="translate(16, 260)" pointerEvents="none">
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
              <circle cx="376" cy="218" r="4" fill="#ffffff" pointerEvents="none" />
              <text
                x="386"
                y="222"
                fill="#ffffff"
                fontSize="11"
                fontWeight="600"
                opacity="0.95"
                pointerEvents="none"
              >
                Downtown
              </text>

              {/* Dashed Straight-Line 0.5-Mile Reach Rings around Funded Sites (1..centersToFund) */}
              {sites.slice(0, centersToFund).map((site) => {
                const pos = PIN_COORDS[site.id];
                if (!pos) return null;
                const isSelected = site.id === selectedSiteId;
                return (
                  <g key={`ring-${site.id}`} pointerEvents="none">
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="64"
                      fill={isSelected ? "rgba(249, 115, 22, 0.10)" : "rgba(15, 23, 42, 0.08)"}
                      stroke={isSelected ? "#ffffff" : "#0b111b"}
                      strokeWidth={isSelected ? "2.4" : "2"}
                      strokeDasharray="6 5"
                      opacity="0.95"
                    />
                  </g>
                );
              })}

              {/* Site Pins 1 to 5 with Readable Callout Tags */}
              {sites.map((site) => {
                const pos = PIN_COORDS[site.id];
                if (!pos) return null;
                const isFunded = site.id <= centersToFund;
                const isSelected = site.id === selectedSiteId;
                const labelWidth = site.name.length * 6.4 + 54;
                const labelX = pos.x + 18 + labelWidth > 750 ? pos.x - 18 - labelWidth : pos.x + 18;

                return (
                  <g
                    key={site.id}
                    onClick={() => onSelectSite(site.id)}
                    className="cursor-pointer group"
                  >
                    {/* Outer selection glow ring */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="21"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="3"
                      />
                    )}

                    {/* Pin Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isFunded ? 14 : 13}
                      fill={isFunded ? "#ffffff" : "#162030"}
                      stroke={isSelected ? "#f97316" : isFunded ? "#0b111b" : "#94a3b8"}
                      strokeWidth={isFunded ? "2.5" : "1.8"}
                      strokeDasharray={isFunded ? undefined : "3 2"}
                    />

                    {/* Pin Number */}
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

                    {/* Site Name + Offset Tag */}
                    <g transform={`translate(${labelX}, ${pos.y - 11})`}>
                      <rect
                        width={labelWidth}
                        height="22"
                        rx="6"
                        fill={isSelected ? "#090d16" : "#0b111b"}
                        fillOpacity="0.92"
                        stroke={isSelected ? "#f97316" : isFunded ? "#334155" : "#1e293b"}
                        strokeWidth={isSelected ? "1.5" : "1"}
                      />
                      <text
                        x="8"
                        y="14.5"
                        fill={isSelected ? "#ffffff" : isFunded ? "#f1f5f9" : "#94a3b8"}
                        fontSize="10.5"
                        fontWeight={isSelected || isFunded ? "700" : "500"}
                      >
                        {site.name}{" "}
                        <tspan fill="#f97316" fontFamily="ui-monospace, monospace" fontWeight="700">
                          +{site.offsetF.toFixed(1)}°
                        </tspan>
                      </text>
                    </g>
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
                  filter: "invert(90%) hue-rotate(180deg) brightness(92%) contrast(105%)",
                }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${activeSite.lat},${activeSite.lon ?? activeSite.lng}&z=14&output=embed`}
              />
              {/* Floating External Google Maps Links */}
              <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${activeSite.lat},${activeSite.lon ?? activeSite.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#0b111b]/95 border border-slate-700 hover:border-[#f97316] text-xs font-semibold text-slate-100 flex items-center gap-1.5 shadow-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>Open in Google Maps</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeSite.lat},${activeSite.lon ?? activeSite.lng}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#0b111b]/95 border border-slate-700 hover:border-[#f97316] text-xs font-semibold text-slate-100 flex items-center gap-1.5 shadow-lg transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Walking Directions</span>
                </a>
              </div>
            </div>
          )}

          {/* Top-Left Interactive Tract Hover Inspector */}
          {!showLiveGoogleMap && hoveredTract && (
            <div className="absolute top-3 left-3 px-3.5 py-2.5 rounded-xl bg-[#090d16]/95 border border-[#f97316]/60 shadow-xl pointer-events-none max-w-xs animate-in fade-in duration-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-white">
                  {hoveredTract.areaLabel}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  Tract {hoveredTract.tractCode}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] font-mono">
                <span className="text-[#f97316] font-bold">
                  {hoveredTract.estOffsetF >= 0 ? "+" : ""}
                  {hoveredTract.estOffsetF.toFixed(1)}°F
                </span>
                <span className="text-slate-300">
                  No car: <strong>{hoveredTract.estNoCarPct}%</strong>
                </span>
                <span className="text-slate-300">
                  65+: <strong>{hoveredTract.estAge65Pct}%</strong>
                </span>
              </div>
              {hoveredTract.siteId && (
                <div className="mt-1 text-[10px] text-emerald-400 font-semibold">
                  Click to inspect Candidate Site #{hoveredTract.siteId}
                </div>
              )}
            </div>
          )}

          {/* Top-Right Zoom Controls */}
          {!showLiveGoogleMap && (
            <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
                className="w-8 h-8 bg-[#0f1724]/95 border border-[#26364f] text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg flex items-center justify-center shadow-md transition-colors"
                title="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.15).toFixed(2)))}
                className="w-8 h-8 bg-[#0f1724]/95 border border-[#26364f] text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg flex items-center justify-center shadow-md transition-colors"
                title="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="w-8 h-8 bg-[#0f1724]/95 border border-[#26364f] text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center justify-center shadow-md transition-colors"
                  title="Reset zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Bottom-Left Overlay Badge */}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#0b111b]/90 border border-[#1e2c42] text-[11px] font-mono text-slate-300 pointer-events-none flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-white inline-block" />
            <span>Dashed ring = 0.5-mi straight-line reach</span>
          </div>

          {/* Bottom-Right Overlay Badge */}
          <div className="hidden sm:block absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-[#0b111b]/90 border border-[#1e2c42] text-[11px] text-slate-400 pointer-events-none">
            Base: Google Maps · Tracts: US Census TIGER/Line
          </div>
        </div>
      </div>

      {/* Bottom Legend & Interactive Centers-to-Fund Control Bar */}
      <div className="px-5 py-3.5 bg-[#0b111c] border-t border-[#182336] flex flex-wrap items-center justify-between text-xs gap-4">
        {/* Left: 5-Swatch Discrete Legend */}
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400 text-xs">{currentLayerInfo.low}</span>
          <div className="flex items-center gap-1">
            <span className="w-5 h-2.5 rounded-[2px] bg-[#182334] border border-slate-700/60" />
            <span className="w-5 h-2.5 rounded-[2px] bg-[#7c3a21]" />
            <span className="w-5 h-2.5 rounded-[2px] bg-[#d95b16]" />
            <span className="w-5 h-2.5 rounded-[2px] bg-[#f97316]" />
            <span className="w-5 h-2.5 rounded-[2px] bg-[#fed7aa]" />
          </div>
          <span className="text-slate-300 text-xs font-medium">
            {currentLayerInfo.high}
          </span>
        </div>

        {/* Right: Centers to fund stepper + clickable 5 pill bars */}
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-semibold text-xs">
            Centers to fund:
          </span>

          <div className="inline-flex items-center bg-[#111927] border border-[#26364f] rounded-lg overflow-hidden shadow-sm">
            <button
              type="button"
              aria-label="Decrease funded centers"
              onClick={() => setCentersToFund((prev) => Math.max(1, prev - 1))}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white font-mono text-sm transition-colors"
            >
              −
            </button>
            <span className="px-2.5 font-mono font-extrabold text-[#f97316] text-xs">
              {centersToFund}
            </span>
            <button
              type="button"
              aria-label="Increase funded centers"
              onClick={() => setCentersToFund((prev) => Math.min(5, prev + 1))}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white font-mono text-sm transition-colors"
            >
              +
            </button>
          </div>

          {/* 5 clickable funding bar segments */}
          <div className="flex items-center gap-1" title="Click to set number of funded cooling centers (1 to 5)">
            {[1, 2, 3, 4, 5].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCentersToFund(() => idx)}
                className={`w-4 h-2.5 rounded-[2px] transition-all ${
                  idx <= centersToFund
                    ? "bg-[#f97316] hover:bg-orange-400"
                    : "bg-[#1e2c42] hover:bg-slate-700"
                }`}
                title={`Fund ${idx} ${idx === 1 ? "center" : "centers"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
