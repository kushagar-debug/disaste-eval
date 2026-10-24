/**
 * Real-Time Telemetry HUD & Live Dynamic Triage Queue
 *
 * Visualizes live mathematical indices (DRI, Hazard Threat, Vulnerability),
 * DSU infrastructure resilience metrics, and the active Fibonacci Heap triage queue.
 */

import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  ShieldAlert,
  HeartPulse,
  Share2,
  Cpu,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Radio,
  ChevronRight,
  TrendingUp,
  Activity,
} from 'lucide-react';

export const TelemetryHUD: React.FC = () => {
  const {
    metrics,
    heapTelemetry,
    mstResult,
    casualties,
    evacuateCasualty,
    dispatchNextCritical,
    selectedEntity,
  } = useSimulation();

  // Active unevacuated casualties sorted by priority key (lowest key = highest urgency)
  const activeQueue = casualties
    .filter(c => !c.evacuated)
    .sort((a, b) => a.calculatedPriorityScore - b.calculatedPriorityScore);

  return (
    <aside className="w-96 h-full bg-slate-900/90 border-l border-slate-800/80 backdrop-blur-md flex flex-col z-20 overflow-hidden select-none">
      {/* 1. Scientific Telemetry Headers & KPIs */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
            <Activity className="w-4 h-4 text-red-500" />
            <span>DISASTER TELEMETRY INDICES</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-semibold">
            LIVE STREAM
          </span>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-2 gap-2">
          {/* Disaster Risk Index */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>RISK INDEX (R)</span>
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-red-400">
                {metrics.disasterRiskIndex}
              </span>
              <span className="text-[10px] text-slate-500">/ 100</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>Sendai: {metrics.sendaiPriorityCompliance}%</span>
              <span className="text-emerald-400 font-semibold">CAT-4</span>
            </div>
          </div>

          {/* Infrastructure MST Connectivity */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>INFRA DSU MST</span>
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {mstResult.connectedComponents}
              </span>
              <span className="text-[10px] text-slate-500">
                {mstResult.isFullyConnected ? 'Unified' : 'Partitions'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>Cost: {Math.round(mstResult.totalCost)}</span>
              <span className={mstResult.isFullyConnected ? 'text-emerald-400' : 'text-red-400'}>
                {mstResult.isFullyConnected ? 'OPTIMAL' : 'ISOLATED'}
              </span>
            </div>
          </div>

          {/* Fibonacci Heap Cuts */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>FIB HEAP CUTS</span>
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-amber-400">
                {heapTelemetry.cascadingCuts}
              </span>
              <span className="text-[10px] text-slate-500">cuts</span>
            </div>
            <div className="mt-1 text-[9px] font-mono text-slate-400">
              <span>Consolidations: {heapTelemetry.consolidations}</span>
            </div>
          </div>

          {/* Active Casualties Triage */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>CASUALTY TOTAL</span>
              <HeartPulse className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-slate-100">
                {activeQueue.length}
              </span>
              <span className="text-[10px] text-emerald-400">
                +{metrics.evacuatedCount} Evac
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[9px] font-mono">
              <span className="text-red-400 font-bold">{metrics.criticalRedCount}R</span>
              <span className="text-amber-400">{metrics.yellowDelayedCount}Y</span>
              <span className="text-emerald-400">{metrics.greenMinorCount}G</span>
              <span className="text-slate-400">{metrics.blackExpectantCount}B</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Selected Entity Inspector Card (if any) */}
      {selectedEntity && (
        <div className="p-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
              SELECTED: {selectedEntity.type}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{selectedEntity.data.id}</span>
          </div>
          <div className="text-xs text-slate-300 font-medium">{selectedEntity.data.name || selectedEntity.data.type}</div>
          {selectedEntity.type === 'casualty' && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => evacuateCasualty(selectedEntity.data.id)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold py-1 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <UserCheck className="w-3 h-3" />
                Dispatch & Evacuate
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Live Dynamic Casualty Triage Queue (Fibonacci Heap Min-Order) */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-200">
              DYNAMIC PRIORITY QUEUE
            </span>
            <span className="text-[10px] font-mono bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-bold">
              extractMin()
            </span>
          </div>

          <button
            id="btn-dispatch-next"
            onClick={dispatchNextCritical}
            disabled={activeQueue.length === 0}
            className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1 disabled:opacity-40"
            title="Invokes fibonacciHeap.extractMin() triggering degree consolidation pass"
          >
            <UserCheck className="w-3 h-3" />
            Dispatch Next
          </button>
        </div>

        {/* Scrollable Casualty List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {activeQueue.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              All casualties evacuated. Zero backlog.
            </div>
          ) : (
            activeQueue.map((casualty, index) => {
              const isTop = index === 0;

              return (
                <div
                  key={casualty.id}
                  className={`p-3 transition-colors hover:bg-slate-800/50 ${
                    isTop ? 'bg-red-950/20 border-l-2 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{index + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          casualty.category === 'RED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : casualty.category === 'YELLOW'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : casualty.category === 'GREEN'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {casualty.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                        {casualty.name}
                      </span>
                    </div>

                    <button
                      onClick={() => evacuateCasualty(casualty.id)}
                      className="text-[10px] font-mono font-medium px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors flex items-center gap-1"
                      title="Extract from triage heap & dispatch ambulance"
                    >
                      <UserCheck className="w-3 h-3" />
                      Evac
                    </button>
                  </div>

                  {/* Vitals Telemetry Row */}
                  <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-red-400" />
                      <span>Vit: {casualty.severity}/10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>Exp: {casualty.environmentalExposure}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>Δt: {Math.round(casualty.elapsedWaitMinutes)}m</span>
                    </div>
                  </div>

                  {/* Priority Key Score */}
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">
                      Fibonacci Key:{' '}
                      <span className="text-slate-300 font-semibold">
                        {casualty.calculatedPriorityScore}
                      </span>
                    </span>
                    <span className="text-slate-500">
                      Age: {casualty.age} yrs
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
