/**
 * Command Center Top Navigation Bar
 *
 * Houses session status, simulation cycle controls, tab routing,
 * scenario presets, and the One-Click PDF Research Dossier Generator.
 */

import React, { useState } from 'react';
import { useSimulation, ActiveTab } from '../context/SimulationContext';
import { PdfResearchDossierGenerator } from '../scientific/PdfReportGenerator';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  FileDown,
  Layers,
  Cpu,
  BookOpen,
  MapPin,
  ShieldCheck,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isPlaying,
    togglePlay,
    simSpeed,
    setSimSpeed,
    stepTick,
    loadScenario,
    metrics,
    heapTelemetry,
    mstResult,
    heapBenchmarks,
    spatialBenchmarks,
  } = useSimulation();

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const handleExportPdf = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        PdfResearchDossierGenerator.generateDossier({
          metrics,
          heapTelemetry,
          mstTelemetry: {
            connectedComponents: mstResult.connectedComponents,
            totalCost: mstResult.totalCost,
            isFullyConnected: mstResult.isFullyConnected,
          },
          heapBenchmarks: heapBenchmarks.length > 0 ? heapBenchmarks : undefined,
          spatialBenchmarks: spatialBenchmarks.length > 0 ? spatialBenchmarks : undefined,
        });
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      } catch (err) {
        console.error('PDF Export Error:', err);
      } finally {
        setIsExporting(false);
      }
    }, 150);
  };

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between z-30 select-none shadow-lg">
      {/* Brand & Mission Identifier */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 shadow-md shadow-red-500/20">
          <Activity className="w-5 h-5 text-white animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-base text-slate-100 font-mono">
              DISASTE<span className="text-red-500">-EVAL</span>
            </span>
            <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              ADS V2.4
            </span>
            <span className="hidden xl:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-medium">
              <ShieldCheck className="w-3 h-3" />
              SENDAI ALIGNED
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden md:block">
            High-Throughput Spatial Triage & Infrastructure Resilience Engine
          </p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
        <button
          id="tab-btn-workstation"
          onClick={() => setActiveTab('workstation')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'workstation'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span>Workstation</span>
        </button>

        <button
          id="tab-btn-inspector"
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'inspector'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>ADS Inspector</span>
        </button>

        <button
          id="tab-btn-benchmark"
          onClick={() => setActiveTab('benchmark')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'benchmark'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>Benchmark Lab</span>
        </button>

        <button
          id="tab-btn-theory"
          onClick={() => setActiveTab('theory')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'theory'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>Formulations</span>
        </button>
      </nav>

      {/* Simulation Controls & PDF Action */}
      <div className="flex items-center gap-3">
        {/* Scenario Preset Selector */}
        <div className="hidden lg:flex items-center gap-1.5">
          <select
            onChange={e => loadScenario(e.target.value)}
            defaultValue="flood_catastrophe"
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-red-500"
          >
            <option value="flood_catastrophe">Scenario: CU Campus & Mamupur Cho Flood (Mohali)</option>
            <option value="earthquake_chemical">Scenario: NH-05 Hazmat Tanker Rupture (CU-Mamupur)</option>
          </select>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={togglePlay}
            className={`p-1.5 rounded-lg transition-colors ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            }`}
            title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={stepTick}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Step 1 Cycle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1)}
            className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs font-mono font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            title="Cycle Speed"
          >
            {simSpeed}x
          </button>
        </div>

        {/* One-Click PDF Research Dossier Generator */}
        <button
          id="btn-export-pdf"
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-md shadow-red-900/30 border border-red-400/30 transition-all transform active:scale-95 disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : exportSuccess ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          ) : (
            <FileDown className="w-3.5 h-3.5" />
          )}
          <span>{exportSuccess ? 'Dossier Saved' : 'Export Formal Research Dossier (.PDF)'}</span>
        </button>
      </div>
    </header>
  );
};
