/**
 * Real-World Geospatial Map Engine (Leaflet + OpenStreetMap / CartoDB Dark Matter)
 *
 * Replaces the abstract canvas with a live interactive geospatial map:
 * - Calibrated to Yamuna River Basin & Floodplains (Delhi / NCR)
 * - Region QuadTree spatial partition boundary rectangles (O(log N))
 * - Dynamic Minimum Spanning Tree (MST) powered by Disjoint-Set Union (DSU)
 * - Real-world circular hazard polygons with radius in meters
 * - Triage-coded pulsing casualty markers (START / NDMA protocols)
 * - Evacuation corridors dynamically routed by Dynamic A*
 */

import React, { useMemo, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Polyline,
  Rectangle,
  Marker,
  Tooltip,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useSimulation } from '../../context/SimulationContext';
import { MapLegendDrawer } from './MapLegendDrawer';
import { QuadBoundary } from '../../ads/QuadTree';
import {
  Crosshair,
  Eye,
  HeartPulse,
  AlertTriangle,
  Shield,
  Flame,
  Layers,
  Activity,
  Radio,
} from 'lucide-react';

// Custom Map Interaction Click Handler
interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Default Chandigarh University / Mamupur Mohali coordinate center & zoom (static constants)
const DEFAULT_MAP_CENTER: [number, number] = [30.7695, 76.5760];
const DEFAULT_MAP_ZOOM = 14;

// Controls programmatic scenario switching ONLY (never runs on recurring simulation ticks)
interface ScenarioViewControllerProps {
  scenario: string;
}

const ScenarioViewController: React.FC<ScenarioViewControllerProps> = ({ scenario }) => {
  const map = useMap();
  const lastScenarioRef = React.useRef<string>(scenario);
  const isInitialMount = React.useRef<boolean>(true);

  useEffect(() => {
    // Position zoomControl cleanly in bottom-right corner if available
    if (map.zoomControl) {
      map.zoomControl.setPosition('bottomright');
    }
  }, [map]);

  useEffect(() => {
    // Skip initial mount so user pan/zoom is never reset on startup
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // ONLY re-center when the scenario dropdown is explicitly changed by the user
    if (lastScenarioRef.current !== scenario) {
      lastScenarioRef.current = scenario;
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, { animate: true });
    }
  }, [scenario, map]);

  return null;
};

export const GeospatialMap: React.FC = () => {
  const {
    currentScenario,
    toolMode,
    setToolMode,
    selectedHazardType,
    setSelectedHazardType,
    selectedCasualtyCategory,
    setSelectedCasualtyCategory,
    hazards,
    casualties,
    shelters,
    roads,
    evacuationPaths,
    hazardQuadTree,
    mstResult,
    showQuadTreeOverlay,
    setShowQuadTreeOverlay,
    showMSTOverlay,
    setShowMSTOverlay,
    showEvacuationCorridors,
    setShowEvacuationCorridors,
    addCasualtyAt,
    addHazardAt,
    addShelterAt,
    toggleRoadStatus,
    setSelectedEntity,
  } = useSimulation();

  // Custom Leaflet DivIcons for Shelters / Hospitals
  const createShelterIcon = (type: string, status: string, name: string) => {
    const isOffline = status === 'offline';
    const bgColor = isOffline ? '#475569' : type === 'hospital' ? '#0284c7' : '#0d9488';
    const borderColor = isOffline ? '#94a3b8' : '#38bdf8';

    return L.divIcon({
      className: 'custom-shelter-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: ${bgColor};
          border: 2px solid ${borderColor};
          box-shadow: 0 0 12px ${borderColor}80;
          color: white;
          font-weight: bold;
          font-family: monospace;
          font-size: 14px;
        ">
          +
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Custom DivIcon for Casualties
  const createCasualtyIcon = (category: string, isEvacuated: boolean) => {
    if (isEvacuated) return L.divIcon({ className: 'hidden' });

    let color = '#ef4444'; // RED
    let ringAnim = 'animate-ping';
    if (category === 'YELLOW') {
      color = '#f59e0b';
      ringAnim = '';
    } else if (category === 'GREEN') {
      color = '#10b981';
      ringAnim = '';
    } else if (category === 'BLACK') {
      color = '#64748b';
      ringAnim = '';
    }

    return L.divIcon({
      className: 'custom-casualty-marker',
      html: `
        <div style="position: relative; width: 18px; height: 18px;">
          <div class="${ringAnim}" style="
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            background-color: ${color};
            opacity: 0.4;
          "></div>
          <div style="
            position: absolute;
            inset: 2px;
            border-radius: 9999px;
            background-color: ${color};
            border: 1.5px solid #ffffff;
            box-shadow: 0 0 8px ${color};
          "></div>
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  };

  // Handle clicks on map surface
  const handleMapClick = (lat: number, lng: number) => {
    if (toolMode === 'add_casualty') {
      // In geo mode: x = lng, y = lat
      addCasualtyAt(lng, lat, selectedCasualtyCategory);
    } else if (toolMode === 'add_hazard') {
      addHazardAt(lng, lat, selectedHazardType);
    } else if (toolMode === 'add_shelter') {
      addShelterAt(lng, lat);
    }
  };

  // QuadTree boundary boxes
  const quadBoundaries: QuadBoundary[] = useMemo(() => {
    if (!showQuadTreeOverlay) return [];
    return hazardQuadTree.getAllBoundaries();
  }, [hazardQuadTree, showQuadTreeOverlay]);

  // Shelter lookup map
  const shelterLookup = useMemo(() => {
    return new Map(shelters.map(s => [s.id, s]));
  }, [shelters]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* 1. Leaflet Geospatial Map Container */}
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        minZoom={10}
        maxZoom={19}
        zoomControl={true}
        scrollWheelZoom={true}
        touchZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#06090e' }}
      >
        {/* CartoDB Dark Matter Authentic Basemap with Authentication Key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=cb1_4tl8_1_04d8036ff19b076f44b09366"
          subdomains="abcd"
          maxZoom={20}
        />

        <ScenarioViewController scenario={currentScenario} />
        <MapClickHandler onMapClick={handleMapClick} />

        {/* 2. Region QuadTree Spatial Overlays */}
        {showQuadTreeOverlay &&
          quadBoundaries.map((b, idx) => {
            const bounds: [[number, number], [number, number]] = [
              [b.minLat, b.minLng],
              [b.maxLat, b.maxLng],
            ];
            const alpha = Math.max(0.15, 0.6 - b.depth * 0.1);

            return (
              <Rectangle
                key={`qb-${idx}`}
                bounds={bounds}
                pathOptions={{
                  color: '#38bdf8',
                  weight: Math.max(1, 2.5 - b.depth * 0.35),
                  opacity: alpha,
                  fill: false,
                  dashArray: b.depth === 0 ? undefined : '4, 4',
                }}
              >
                <Tooltip sticky direction="center" className="quadtree-tooltip">
                  <div className="text-[10px] font-mono bg-slate-950/90 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/30">
                    Depth:{b.depth} | Pts:{b.pointCount}
                  </div>
                </Tooltip>
              </Rectangle>
            );
          })}

        {/* 3. Infrastructure Corridors & DSU Minimum Spanning Tree */}
        {roads.map((road) => {
          const s = shelterLookup.get(road.source);
          const t = shelterLookup.get(road.target);
          if (!s || !t) return null;

          const positions: [number, number][] = [
            [s.y, s.x],
            [t.y, t.x],
          ];

          const isMST = mstResult.edges.some((e) => e.id === road.id);
          const isSevered = road.status === 'severed' || road.status === 'flooded';

          return (
            <Polyline
              key={road.id}
              positions={positions}
              eventHandlers={{
                click: () => {
                  if (toolMode === 'sever_road' || toolMode === 'inspect') {
                    toggleRoadStatus(road.id);
                  }
                },
              }}
              pathOptions={{
                color: isSevered ? '#ef4444' : isMST && showMSTOverlay ? '#10b981' : '#64748b',
                weight: isMST && showMSTOverlay ? 4 : isSevered ? 3 : 1.5,
                opacity: isSevered ? 0.9 : isMST && showMSTOverlay ? 0.9 : 0.4,
                dashArray: isSevered ? '8, 8' : undefined,
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-mono bg-slate-900 text-slate-100 p-1.5 rounded border border-slate-700">
                  <span className="font-bold block">
                    Corridor {road.id} {isSevered ? '[SEVERED / COLLAPSED]' : isMST ? '[MST BACKBONE]' : '[SECONDARY]'}
                  </span>
                  <span>Length: {Math.round(road.length)} m | Hazard Exposure: {(road.hazardProximity * 100).toFixed(0)}%</span>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* 4. Evacuation Corridors (Dynamic A* with Fibonacci Heap) */}
        {showEvacuationCorridors &&
          evacuationPaths.map((ep, idx) => {
            const positions: [number, number][] = ep.result.path.map((p) => [p.y, p.x]);
            if (positions.length < 2) return null;

            return (
              <Polyline
                key={`evac-${idx}`}
                positions={positions}
                pathOptions={{
                  color: '#38bdf8',
                  weight: 3.5,
                  opacity: 0.85,
                  dashArray: '6, 10',
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-mono bg-slate-900 text-sky-200 p-1.5 rounded border border-sky-500/40">
                    <span className="font-bold block">DYNAMIC A* EVACUATION CORRIDOR</span>
                    <span>Distance: {ep.result.totalDistance} m | Transit Time: {Math.round(ep.result.estimatedTransitTimeSec / 60)} min</span>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

        {/* 5. Active Hazard Circles */}
        {hazards.map((h) => {
          const color =
            h.type === 'flood'
              ? '#0284c7'
              : h.type === 'fire'
              ? '#ea580c'
              : h.type === 'toxic'
              ? '#a855f7'
              : '#f43f5e';

          return (
            <Circle
              key={h.id}
              center={[h.y, h.x]}
              radius={h.radius}
              eventHandlers={{
                click: () => setSelectedEntity({ type: 'hazard', data: h }),
              }}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.35,
                weight: 2,
                dashArray: '6, 6',
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-mono bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700">
                  <span className="font-bold text-amber-400 block uppercase">
                    HAZARD FRONT: {h.type}
                  </span>
                  <span>Severity: {h.severity} / 10.0</span>
                  <br />
                  <span>Radius: {Math.round(h.radius)} meters</span>
                </div>
              </Tooltip>
            </Circle>
          );
        })}

        {/* 6. Emergency Shelters & Hospitals */}
        {shelters.map((s) => (
          <Marker
            key={s.id}
            position={[s.y, s.x]}
            icon={createShelterIcon(s.type, s.status, s.name)}
            eventHandlers={{
              click: () => setSelectedEntity({ type: 'shelter', data: s }),
            }}
          >
            <Tooltip direction="top" offset={[0, -18]} opacity={1}>
              <div className="text-xs font-mono bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700 shadow-xl min-w-[200px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-cyan-400">{s.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase">
                    {s.type}
                  </span>
                </div>
                <div className="text-slate-300 text-[11px] space-y-0.5">
                  <div>Surge Capacity: <span className="font-bold text-white">{s.capacity} beds</span></div>
                  <div>Status: <span className={s.status === 'operational' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{s.status.toUpperCase()}</span></div>
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* 7. Casualties (Pulsing Triage Markers) */}
        {casualties.map((c) => {
          if (c.evacuated) return null;

          return (
            <Marker
              key={c.id}
              position={[c.y, c.x]}
              icon={createCasualtyIcon(c.category, c.evacuated)}
              eventHandlers={{
                click: () => setSelectedEntity({ type: 'casualty', data: c }),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-xs font-mono bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700 shadow-xl min-w-[220px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">{c.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.category === 'RED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : c.category === 'YELLOW'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : c.category === 'GREEN'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.category}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] space-y-0.5">
                    <div>Triage Key: <span className="text-amber-400 font-bold">{c.calculatedPriorityScore}</span> (Min-Heap)</div>
                    <div>Clinical Severity: <span className="font-bold text-white">{c.severity} / 10.0</span></div>
                    <div>Wait Time: {Math.round(c.elapsedWaitMinutes)} min | Age: {c.age} yrs</div>
                    <div>Hazard Exposure: <span className="text-purple-400 font-bold">{c.environmentalExposure.toFixed(1)}</span></div>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Top Floating Command Toolbar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 shadow-2xl">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mr-2 border-r border-slate-700 pr-3">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span>TOOL:</span>
        </div>

        <button
          onClick={() => setToolMode('inspect')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            toolMode === 'inspect'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Select and inspect entities"
        >
          <Eye className="w-3.5 h-3.5" />
          Inspect
        </button>

        <button
          onClick={() => setToolMode('add_casualty')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            toolMode === 'add_casualty'
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Click map to deploy new casualties"
        >
          <HeartPulse className="w-3.5 h-3.5 text-red-400" />
          + Casualty
        </button>

        <button
          onClick={() => setToolMode('add_hazard')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            toolMode === 'add_hazard'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Click map to trigger hazard zone"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          + Hazard
        </button>

        <button
          onClick={() => setToolMode('add_shelter')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            toolMode === 'add_shelter'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Click map to establish shelter hub"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          + Shelter
        </button>

        <button
          onClick={() => setToolMode('sever_road')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            toolMode === 'sever_road'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Click road corridor on map to toggle bridge/road collapse"
        >
          <Flame className="w-3.5 h-3.5 text-purple-400" />
          Sever Link
        </button>

        {/* Sub-selector for casualty triage category */}
        {toolMode === 'add_casualty' && (
          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            {(['RED', 'YELLOW', 'GREEN'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCasualtyCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedCasualtyCategory === cat
                    ? cat === 'RED'
                      ? 'bg-red-500 text-white'
                      : cat === 'YELLOW'
                      ? 'bg-amber-500 text-black'
                      : 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Sub-selector for hazard type */}
        {toolMode === 'add_hazard' && (
          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            {(['flood', 'fire', 'toxic', 'seismic'] as const).map((hz) => (
              <button
                key={hz}
                onClick={() => setSelectedHazardType(hz)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  selectedHazardType === hz ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hz}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layer Visibility Toggles */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 shadow-2xl">
        <button
          onClick={() => setShowQuadTreeOverlay(!showQuadTreeOverlay)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
            showQuadTreeOverlay
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Region QuadTree spatial partition boundaries"
        >
          <Layers className="w-3.5 h-3.5" />
          QuadTree
        </button>

        <button
          onClick={() => setShowMSTOverlay(!showMSTOverlay)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
            showMSTOverlay
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Dynamic MST Infrastructure Backbone (DSU)"
        >
          <Activity className="w-3.5 h-3.5" />
          DSU MST
        </button>

        <button
          onClick={() => setShowEvacuationCorridors(!showEvacuationCorridors)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
            showEvacuationCorridors
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Dynamic A* Evacuation Corridors"
        >
          <Radio className="w-3.5 h-3.5" />
          A* Routes
        </button>
      </div>

      {/* Floating Tactical Legend Drawer */}
      <MapLegendDrawer />
    </div>
  );
};
