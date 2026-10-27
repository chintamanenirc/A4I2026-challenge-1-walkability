"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Navigation,
  Compass,
  Layers,
  ThermometerSun,
  Maximize2,
  Copy,
  Check,
  MapPin,
} from "lucide-react";

export interface LocationPoint {
  lat: number;
  lon: number;
  label?: string;
  heatOffset?: number;
  agentId?: "urban_heat_agent" | "atlanta_heat_agent";
  agentLabel?: string;
}

interface MapViewerProps {
  selectedLocation: LocationPoint | null;
  locations: LocationPoint[];
  onSelectLocation: (loc: LocationPoint) => void;
}

export default function MapViewer({
  selectedLocation,
  locations,
  onSelectLocation,
}: MapViewerProps) {
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [copied, setCopied] = useState(false);

  const currentLat = selectedLocation ? selectedLocation.lat : 33.7043;
  const currentLon = selectedLocation ? selectedLocation.lon : -84.3610;

  // Google Maps Embed with specific map types
  const embedUrl =
    mapType === "satellite"
      ? `https://maps.google.com/maps?q=${currentLat},${currentLon}&t=k&z=16&output=embed`
      : `https://maps.google.com/maps?q=${currentLat},${currentLon}&hl=en&z=15&output=embed`;

  const externalSearchUrl = `https://www.google.com/maps/search/?api=1&query=${currentLat}%2C${currentLon}`;
  const externalWalkUrl = `https://www.google.com/maps/dir/?api=1&destination=${currentLat}%2C${currentLon}&travelmode=walking`;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-100 text-sm sm:text-base">
                Google Maps Spatial Inspector
              </h2>
              <span className="px-2 py-0.5 text-[11px] bg-emerald-500/20 text-emerald-300 rounded-full font-medium border border-emerald-500/30">
                Live Sync
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
              <span>Lat: <strong className="text-emerald-400 font-semibold">{currentLat.toFixed(4)}°N</strong></span>
              <span className="text-slate-600">|</span>
              <span>Lon: <strong className="text-emerald-400 font-semibold">{currentLon.toFixed(4)}°W</strong></span>
              <button
                onClick={copyCoordinates}
                title="Copy coordinates"
                className="hover:text-slate-200 text-slate-500 p-0.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layer Switcher */}
          <div className="bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-800 text-xs">
            <button
              onClick={() => setMapType("roadmap")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mapType === "roadmap"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Street Map
            </button>
            <button
              onClick={() => setMapType("satellite")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mapType === "satellite"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tree Canopy & Satellite
            </button>
          </div>

          {/* Pedestrian Walking Directions */}
          <a
            href={externalWalkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-medium transition-colors shadow-sm"
            title="Inspect 10-minute pedestrian walking distance in Google Maps"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Walk Route</span>
          </a>

          {/* Full Google Maps view */}
          <a
            href={externalSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium border border-slate-700 transition-colors"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full bg-slate-950 min-h-[380px]">
        <iframe
          title="Google Maps Geocoded Viewer"
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        />

        {/* Floating Site Summary Card */}
        <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs max-w-xs pointer-events-auto">
          <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1.5">
            <ThermometerSun className="w-4 h-4 text-amber-400" />
            <span>Selected Site Pin</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">Target Coordinates:</span>
              <span className="text-emerald-400 font-medium">
                {currentLat.toFixed(4)}, {currentLon.toFixed(4)}
              </span>
            </div>
            {selectedLocation?.label && (
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {selectedLocation.label}
              </p>
            )}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Pedestrian Accessibility:</span>
            <a
              href={externalWalkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              10-min Isochrone ↗
            </a>
          </div>
        </div>
      </div>

      {/* Candidate Sites Selector Carousel if multiple sites exist */}
      {locations.length > 0 && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap pl-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Identified Sites:
          </span>
          <div className="flex items-center gap-2">
            {locations.map((loc, idx) => {
              const isSelected =
                Math.abs(currentLat - loc.lat) < 0.001 &&
                Math.abs(currentLon - loc.lon) < 0.001;
              const isAgent2 = loc.agentId === "atlanta_heat_agent";
              return (
                <button
                  key={`${loc.lat}-${loc.lon}-${idx}`}
                  onClick={() => onSelectLocation(loc)}
                  className={`px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all font-mono flex items-center gap-1.5 ${
                    isSelected
                      ? isAgent2
                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-200 font-semibold shadow-md ring-1 ring-emerald-500"
                        : "bg-amber-500/25 border-amber-400 text-amber-200 font-semibold shadow-md ring-1 ring-amber-500"
                      : isAgent2
                      ? "bg-slate-900 border-emerald-800/60 text-emerald-300 hover:border-emerald-600"
                      : "bg-slate-900 border-amber-800/60 text-amber-300 hover:border-amber-600"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      isAgent2 ? "bg-emerald-600" : "bg-amber-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>
                    {loc.agentLabel ? `${loc.agentLabel}: ` : ""}
                    {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
