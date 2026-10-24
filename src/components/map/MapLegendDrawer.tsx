/**
 * Visual Collapsible Legend Drawer
 *
 * Floating tactical legend mounted in the bottom-left corner of the Geospatial Map view.
 * Explains:
 * - Casualty Triage (Red/Yellow/Green/Black)
 * - Dynamic Infrastructure (Active DSU MST vs Severed Corridor)
 * - Hazard Rings & QuadTree Proximity Zones
 * - Shelter Hubs & Medical Facilities
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  HeartPulse,
  Activity,
  Flame,
  Droplets,
  Shield,
  Radio,
  Share2,
} from 'lucide-react';

export const MapLegendDrawer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="absolute bottom-6 left-4 z-[1000] select-none font-mono">
      {/* Collapsed Button or Expanded Container */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden w-80">
        {/* Header Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 hover:bg-slate-800/80 transition-colors border-b border-slate-800 text-left"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100 tracking-wider">
              GEOSPATIAL TACTICAL LEGEND
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 font-semibold">
              WGS84
            </span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="p-3.5 space-y-3.5 text-xs text-slate-300 max-h-96 overflow-y-auto">
            {/* 1. Casualty Triage START */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                <span>CASUALTY TRIAGE (START / NDMA)</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/40 animate-pulse" />
                  <div>
                    <span className="font-bold text-red-400 block">RED (Immediate)</span>
                    <span className="text-slate-500 text-[9px]">GCS &lt; 8 / Shock</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/40" />
                  <div>
                    <span className="font-bold text-amber-400 block">YELLOW (Delayed)</span>
                    <span className="text-slate-500 text-[9px]">Serious / Stable</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/40" />
                  <div>
                    <span className="font-bold text-emerald-400 block">GREEN (Minimal)</span>
                    <span className="text-slate-500 text-[9px]">Walking Wounded</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600 ring-2 ring-slate-600/40" />
                  <div>
                    <span className="font-bold text-slate-400 block">BLACK (Expectant)</span>
                    <span className="text-slate-500 text-[9px]">Vital Cessation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Dynamic Infrastructure (DSU MST) */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>DYNAMIC INFRASTRUCTURE (DSU MST)</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-1 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50" />
                    <span className="text-emerald-300 font-semibold">Active DSU MST Backbone</span>
                  </div>
                  <span className="text-[9px] text-slate-500">Kruskal Union</span>
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 border-t-2 border-dashed border-red-500" />
                    <span className="text-red-400 font-semibold">Severed / Submerged Link</span>
                  </div>
                  <span className="text-[9px] text-slate-500">Bridge Breach</span>
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 border-t-2 border-dashed border-sky-400" />
                    <span className="text-sky-300 font-semibold">Dynamic A* Evac Corridor</span>
                  </div>
                  <span className="text-[9px] text-slate-500">Fib Open Set</span>
                </div>
              </div>
            </div>

            {/* 3. Hazards & QuadTree Partitioning */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>HAZARDS & QUADTREE PARTITIONING</span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500/30 border border-sky-400 flex items-center justify-center text-[7px] text-sky-200">
                    FL
                  </div>
                  <span>Cho & Drainage Floodplain Inundation (Meters)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-400 flex items-center justify-center text-[7px] text-purple-200">
                    TX
                  </div>
                  <span>Industrial Toxic Plume / Chemical Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-cyan-400 bg-cyan-400/10 flex items-center justify-center text-[7px] text-cyan-300 font-bold">
                    Q
                  </div>
                  <span>Region QuadTree O(log N) Space Partition Bounds</span>
                </div>
              </div>
            </div>

            {/* 4. Shelter Hubs */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>RELIEF HUBS & MEDICAL BASES</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-4 h-4 rounded bg-cyan-600 border border-cyan-400 flex items-center justify-center text-white text-[10px] font-bold">
                  +
                </div>
                <span>Hospitals, Emergency Muster Centers & Relief Camps</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
