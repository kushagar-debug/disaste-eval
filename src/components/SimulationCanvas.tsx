/**
 * Interactive 2D Simulation Canvas
 *
 * Implements high-DPI Canvas 2D rendering with:
 * - Dynamic MST visualization powered by DSU
 * - QuadTree spatial quadrant boundary boxes
 * - Dynamic A* evacuation corridors
 * - Animated multi-hazard fronts (flood, fire, toxic, seismic)
 * - Triage-coded casualty vitals & emergency shelter telemetry
 * - Pan, zoom, and interactive entity deployment
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { QuadBoundary } from '../ads/QuadTree';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  HeartPulse,
  Flame,
  Droplets,
  Radio,
  Eye,
  PlusCircle,
  Shield,
  Layers,
  Activity,
  Crosshair
} from 'lucide-react';

export const SimulationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
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
    selectedEntity,
  } = useSimulation();

  // Canvas Viewport transform (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 20 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover Tooltip state
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    title: string;
    type: string;
    details: string[];
    badgeColor: string;
  } | null>(null);

  // Animation frame loop ticker
  const animTimeRef = useRef<number>(0);

  /**
   * Screen to World coordinates transform
   */
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = screenX - rect.left;
      const clientY = screenY - rect.top;

      return {
        x: (clientX - pan.x) / zoom,
        y: (clientY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  /**
   * Handle Mouse Down (Pan or Action)
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey || toolMode === 'inspect') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Hit-testing for Hover Tooltip
    const worldPos = screenToWorld(e.clientX, e.clientY);
    let hitFound = false;

    // Check Casualties
    for (const c of casualties) {
      if (Math.hypot(c.x - worldPos.x, c.y - worldPos.y) < 18 / zoom) {
        setHoverInfo({
          x: e.clientX,
          y: e.clientY,
          title: c.name,
          type: `CASUALTY [${c.category}]`,
          badgeColor:
            c.category === 'RED'
              ? '#ef4444'
              : c.category === 'YELLOW'
              ? '#f59e0b'
              : c.category === 'GREEN'
              ? '#10b981'
              : '#64748b',
          details: [
            `Triage Urgency: ${c.calculatedPriorityScore} (Priority Key)`,
            `Severity Vitals: ${c.severity} / 10.0`,
            `Age: ${c.age} yrs | Wait: ${Math.round(c.elapsedWaitMinutes)} min`,
            `Hazard Exposure: ${c.environmentalExposure.toFixed(1)} ppm/decay`,
            `Status: ${c.evacuated ? 'EVACUATED' : 'AWAITING DISPATCH'}`,
          ],
        });
        hitFound = true;
        break;
      }
    }

    // Check Shelters
    if (!hitFound) {
      for (const s of shelters) {
        if (Math.hypot(s.x - worldPos.x, s.y - worldPos.y) < 26 / zoom) {
          setHoverInfo({
            x: e.clientX,
            y: e.clientY,
            title: s.name,
            type: `INFRASTRUCTURE [${s.type.toUpperCase()}]`,
            badgeColor: '#38bdf8',
            details: [
              `Operating Status: ${s.status.toUpperCase()}`,
              `Surge Capacity: ${s.capacity} beds`,
              `Location: (${Math.round(s.x)}, ${Math.round(s.y)})`,
            ],
          });
          hitFound = true;
          break;
        }
      }
    }

    // Check Hazards
    if (!hitFound) {
      for (const h of hazards) {
        if (Math.hypot(h.x - worldPos.x, h.y - worldPos.y) < h.radius) {
          setHoverInfo({
            x: e.clientX,
            y: e.clientY,
            title: `HAZARD FRONT [${h.type.toUpperCase()}]`,
            type: 'ACTIVE THREAT ZONE',
            badgeColor:
              h.type === 'flood'
                ? '#0284c7'
                : h.type === 'fire'
                ? '#ea580c'
                : h.type === 'toxic'
                ? '#a855f7'
                : '#f43f5e',
            details: [
              `Core Lethal Radius: ${Math.round(h.radius)} meters`,
              `Threat Severity: ${h.severity} / 10.0`,
              `Buffer Zone Decay: 180m Exponential Penalty`,
            ],
          });
          hitFound = true;
          break;
        }
      }
    }

    if (!hitFound) {
      setHoverInfo(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(0.3, Math.min(3.5, zoom * zoomFactor));

    // Zoom toward mouse pointer
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  /**
   * Canvas Click Handlers for Interactive Placement
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (toolMode === 'add_casualty') {
      addCasualtyAt(worldPos.x, worldPos.y, selectedCasualtyCategory);
    } else if (toolMode === 'add_hazard') {
      addHazardAt(worldPos.x, worldPos.y, selectedHazardType);
    } else if (toolMode === 'add_shelter') {
      addShelterAt(worldPos.x, worldPos.y);
    } else if (toolMode === 'sever_road') {
      // Find nearest road to click
      for (const r of roads) {
        const s = shelters.find(node => node.id === r.source);
        const t = shelters.find(node => node.id === r.target);
        if (s && t) {
          const midX = (s.x + t.x) / 2;
          const midY = (s.y + t.y) / 2;
          if (Math.hypot(midX - worldPos.x, midY - worldPos.y) < 40 / zoom) {
            toggleRoadStatus(r.id);
            break;
          }
        }
      }
    } else if (toolMode === 'inspect') {
      // Select clicked entity for inspector
      let selected = false;
      for (const c of casualties) {
        if (Math.hypot(c.x - worldPos.x, c.y - worldPos.y) < 20 / zoom) {
          setSelectedEntity({ type: 'casualty', data: c });
          selected = true;
          break;
        }
      }
      if (!selected) {
        for (const s of shelters) {
          if (Math.hypot(s.x - worldPos.x, s.y - worldPos.y) < 30 / zoom) {
            setSelectedEntity({ type: 'shelter', data: s });
            selected = true;
            break;
          }
        }
      }
      if (!selected) {
        for (const h of hazards) {
          if (Math.hypot(h.x - worldPos.x, h.y - worldPos.y) < h.radius) {
            setSelectedEntity({ type: 'hazard', data: h });
            selected = true;
            break;
          }
        }
      }
      if (!selected) {
        setSelectedEntity(null);
      }
    }
  };

  /**
   * Main Render Canvas Frame Loop
   */
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      animTimeRef.current = time;

      // Handle Resize & DPR
      const container = containerRef.current;
      if (container) {
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = container.clientWidth;
        const displayHeight = container.clientHeight;

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
        }
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // 1. Dark Background
      ctx.fillStyle = '#06090e';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // --- World Boundary ---
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 1800, 1200);

      // --- 2. Topographic Elevation Grid & Radar Grid ---
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x <= 1800; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1200);
        ctx.stroke();
      }
      for (let y = 0; y <= 1200; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1800, y);
        ctx.stroke();
      }

      // Contour elevation rings (simulated topographical terrain)
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
      ctx.lineWidth = 1.2;
      for (let r = 120; r <= 800; r += 140) {
        ctx.beginPath();
        ctx.arc(900, 600, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // --- 3. QuadTree Spatial Partition Overlay ---
      if (showQuadTreeOverlay) {
        const boundaries: QuadBoundary[] = hazardQuadTree.getAllBoundaries();
        for (let i = 0; i < boundaries.length; i++) {
          const b = boundaries[i];
          const alpha = Math.max(0.12, 0.5 - b.depth * 0.08);

          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = Math.max(1, 2.5 - b.depth * 0.4) / zoom;
          ctx.strokeRect(b.x, b.y, b.width, b.height);

          // Subdued quadrant depth badge in corner
          if (b.width > 90) {
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.8})`;
            ctx.font = `${Math.max(9, 11 / zoom)}px "JetBrains Mono"`;
            ctx.fillText(`D:${b.depth}`, b.x + 6, b.y + 14);
          }
        }
      }

      // --- 4. Infrastructure Road Network & Dynamic MST (DSU) ---
      const shelterMap = new Map(shelters.map(s => [s.id, s]));

      // Render All Roads
      for (const road of roads) {
        const s = shelterMap.get(road.source);
        const t = shelterMap.get(road.target);
        if (!s || !t) continue;

        const isMSTEdge = mstResult.edges.some(e => e.id === road.id);

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (road.status === 'severed' || road.status === 'flooded') {
          // Severed link: dashed red
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 2.5 / zoom;
          ctx.stroke();
          ctx.setLineDash([]);

          // Hazard Cross badge at midpoint
          const midX = (s.x + t.x) / 2;
          const midY = (s.y + t.y) / 2;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.beginPath();
          ctx.arc(midX, midY, 6 / zoom, 0, Math.PI * 2);
          ctx.fill();
        } else if (isMSTEdge && showMSTOverlay) {
          // MST Active Backbone: Glowing Emerald
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.lineWidth = 4 / zoom;
          ctx.stroke();

          // Subdued inner core
          ctx.strokeStyle = '#6ee7b7';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        } else {
          // Standard secondary road
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        }
      }

      // --- 5. Evacuation Corridors (Dynamic A* Paths) ---
      if (showEvacuationCorridors && evacuationPaths.length > 0) {
        const animOffset = (time / 35) % 24;

        for (const ep of evacuationPaths) {
          const path = ep.result.path;
          if (path.length < 2) continue;

          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let pIdx = 1; pIdx < path.length; pIdx++) {
            ctx.lineTo(path[pIdx].x, path[pIdx].y);
          }

          // Pulsing glow trail
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 6 / zoom;
          ctx.stroke();

          // Animated dashes showing flow toward shelter
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5 / zoom;
          ctx.setLineDash([8, 12]);
          ctx.lineDashOffset = -animOffset;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // --- 6. Active Hazard Zones with Expanding Ripples ---
      for (const h of hazards) {
        const pulse = Math.sin(time / 600 + h.x) * 6;
        const currentR = Math.max(10, h.radius + pulse);

        // Radial gradient
        const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, currentR * 1.5);

        if (h.type === 'flood') {
          grad.addColorStop(0, 'rgba(2, 132, 199, 0.85)');
          grad.addColorStop(0.5, 'rgba(2, 132, 199, 0.35)');
          grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        } else if (h.type === 'fire') {
          grad.addColorStop(0, 'rgba(234, 88, 12, 0.9)');
          grad.addColorStop(0.4, 'rgba(239, 68, 68, 0.4)');
          grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        } else if (h.type === 'toxic') {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.85)');
          grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        } else {
          grad.addColorStop(0, 'rgba(244, 63, 94, 0.85)');
          grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.3)');
          grad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, currentR * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Core lethal boundary
        ctx.strokeStyle =
          h.type === 'flood'
            ? '#38bdf8'
            : h.type === 'fire'
            ? '#f97316'
            : h.type === 'toxic'
            ? '#c084fc'
            : '#fb7185';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(h.x, h.y, currentR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, 12 / zoom)}px "JetBrains Mono"`;
        ctx.textAlign = 'center';
        ctx.fillText(
          `${h.type.toUpperCase()} [${h.severity} / 10]`,
          h.x,
          h.y - currentR - 8 / zoom
        );
      }

      // --- 7. Emergency Shelters & Hospitals ---
      for (const s of shelters) {
        const isOffline = s.status === 'offline';

        // Outer beacon halo
        ctx.fillStyle = isOffline ? 'rgba(100, 116, 139, 0.2)' : 'rgba(14, 165, 233, 0.15)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 24 / zoom, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.fillStyle = isOffline ? '#334155' : s.type === 'hospital' ? '#0284c7' : '#0369a1';
        ctx.strokeStyle = isOffline ? '#64748b' : '#38bdf8';
        ctx.lineWidth = 2.5 / zoom;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 14 / zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Symbol (Cross or Shelter)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.x - 2 / zoom, s.y - 7 / zoom, 4 / zoom, 14 / zoom);
        ctx.fillRect(s.x - 7 / zoom, s.y - 2 / zoom, 14 / zoom, 4 / zoom);

        // Shelter Name Label
        ctx.font = `bold ${Math.max(9, 11 / zoom)}px "Inter"`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(s.name, s.x, s.y + 26 / zoom);

        ctx.font = `${Math.max(8, 9 / zoom)}px "JetBrains Mono"`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`CAP: ${s.capacity}`, s.x, s.y + 38 / zoom);
      }

      // --- 8. Casualties & Triage Halos ---
      for (const c of casualties) {
        if (c.evacuated) continue;

        let color = '#ef4444'; // RED
        let haloColor = 'rgba(239, 68, 68, 0.3)';
        if (c.category === 'YELLOW') {
          color = '#f59e0b';
          haloColor = 'rgba(245, 158, 11, 0.25)';
        } else if (c.category === 'GREEN') {
          color = '#10b981';
          haloColor = 'rgba(16, 185, 129, 0.2)';
        } else if (c.category === 'BLACK') {
          color = '#64748b';
          haloColor = 'rgba(100, 116, 139, 0.2)';
        }

        // Pulse for RED category (Critical urgent triage)
        const pulse = c.category === 'RED' ? Math.sin(time / 200 + c.severity) * 3 : 0;

        ctx.fillStyle = haloColor;
        ctx.beginPath();
        ctx.arc(c.x, c.y, (12 + pulse) / zoom, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6 / zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2 / zoom;
        ctx.stroke();
      }

      ctx.restore();

      // Mini Radar Sweep Line on bottom right
      const radarSize = 50;
      const radarX = w - radarSize - 16;
      const radarY = h - radarSize - 16;
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(radarX, radarY, radarSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      const sweepAngle = (time / 1000) % (Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(radarX, radarY);
      ctx.lineTo(
        radarX + Math.cos(sweepAngle) * (radarSize / 2),
        radarY + Math.sin(sweepAngle) * (radarSize / 2)
      );
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    pan,
    zoom,
    hazards,
    casualties,
    shelters,
    roads,
    evacuationPaths,
    hazardQuadTree,
    mstResult,
    showQuadTreeOverlay,
    showMSTOverlay,
    showEvacuationCorridors,
  ]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
      {/* 2D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Top Floating Command Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 shadow-2xl">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mr-2 border-r border-slate-700 pr-3">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span>TOOL:</span>
        </div>

        {/* Tool Mode Selectors */}
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
          title="Click canvas to deploy new casualties"
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
          title="Click canvas to trigger hazard zone"
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
          title="Click canvas to establish shelter hub"
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
          title="Click road corridor to toggle collapse/severing"
        >
          <Flame className="w-3.5 h-3.5 text-purple-400" />
          Sever Link
        </button>

        {/* Sub-selectors for casualty category or hazard type */}
        {toolMode === 'add_casualty' && (
          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            {(['RED', 'YELLOW', 'GREEN'] as const).map(cat => (
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

        {toolMode === 'add_hazard' && (
          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            {(['flood', 'fire', 'toxic', 'seismic'] as const).map(hz => (
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
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 shadow-2xl">
        <button
          onClick={() => setShowQuadTreeOverlay(!showQuadTreeOverlay)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
            showQuadTreeOverlay
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle QuadTree spatial boundaries"
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
          title="Toggle Dynamic MST Infrastructure Backbone"
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

      {/* Bottom Floating Navigation (Zoom & Reset) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-xl">
        <button
          onClick={() => setZoom(z => Math.min(3.5, z * 1.2))}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(0.95);
            setPan({ x: 30, y: 20 });
          }}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="text-[11px] font-mono text-slate-400 px-2 border-l border-slate-700">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Real-time Hit-Test Hover Tooltip */}
      {hoverInfo && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-2xl text-xs"
          style={{
            left: `${hoverInfo.x + 16}px`,
            top: `${hoverInfo.y - 12}px`,
            maxWidth: '280px',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-slate-100">{hoverInfo.title}</span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
              style={{
                backgroundColor: `${hoverInfo.badgeColor}25`,
                color: hoverInfo.badgeColor,
              }}
            >
              {hoverInfo.type}
            </span>
          </div>
          <div className="space-y-0.5 text-slate-400 text-[11px] font-mono">
            {hoverInfo.details.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
