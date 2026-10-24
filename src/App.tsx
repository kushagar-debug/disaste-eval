import React from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { Navbar } from './components/Navbar';
import { GeospatialMap } from './components/map/GeospatialMap';
import { TelemetryHUD } from './components/TelemetryHUD';
import { ADSInspectorPanel } from './components/ADSInspectorPanel';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { TheoryPanel } from './components/TheoryPanel';

const MainWorkstation: React.FC = () => {
  const { activeTab, tickCount, simSpeed, isPlaying, metrics, heapTelemetry, mstResult } = useSimulation();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Tab Views */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {activeTab === 'workstation' && (
          <>
            <main className="flex-1 h-full relative overflow-hidden">
              <GeospatialMap />
            </main>
            <TelemetryHUD />
          </>
        )}

        {activeTab === 'inspector' && (
          <div className="flex-1 h-full overflow-hidden">
            <ADSInspectorPanel />
          </div>
        )}

        {activeTab === 'benchmark' && (
          <div className="flex-1 h-full overflow-hidden">
            <BenchmarkPanel />
          </div>
        )}

        {activeTab === 'theory' && (
          <div className="flex-1 h-full overflow-hidden">
            <TheoryPanel />
          </div>
        )}
      </div>

      {/* High-Density Command-Center Status Bar */}
      <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-200 font-semibold">{isPlaying ? 'SIMULATION RUNNING' : 'PAUSED'}</span>
          </div>
          <span>CYCLE TICK: <span className="text-cyan-400 font-bold">{tickCount}</span> ({simSpeed}x)</span>
          <span className="hidden md:inline">FIBONACCI MIN: <span className="text-amber-400 font-bold">{heapTelemetry.minKey ?? 'N/A'}</span></span>
          <span className="hidden md:inline">MST COMPONENTS: <span className="text-emerald-400 font-bold">{mstResult.connectedComponents}</span></span>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <span className="hidden lg:inline">QUADTREE PARTITIONS: {metrics.activeHazardsCount} fronts</span>
          <span className="text-slate-400 font-semibold">SENDAI RISK INDEX: {metrics.disasterRiskIndex}</span>
          <span className="text-cyan-500 font-bold">DISASTE-EVAL ENGINE V2.4</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <SimulationProvider>
      <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
        <Navbar />
        <MainWorkstation />
      </div>
    </SimulationProvider>
  );
}

export default App;
