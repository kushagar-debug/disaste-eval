/**
 * Empirical Benchmarking Lab
 *
 * Runs browser-side performance benchmark trials comparing:
 * 1. Fibonacci Heap vs Binary Heap across N = 200 to 25,000
 * 2. Region QuadTree vs Brute-Force Linear Scan across N = 200 to 25,000
 *
 * Visualizes empirical latency curves vs theoretical Big-O reference curves.
 */

import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { BenchmarkEngine, HeapBenchmarkDataPoint, SpatialBenchmarkDataPoint } from '../scientific/BenchmarkEngine';
import {
  Play,
  RotateCcw,
  Cpu,
  Layers,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

export const BenchmarkPanel: React.FC = () => {
  const {
    heapBenchmarks,
    setHeapBenchmarks,
    spatialBenchmarks,
    setSpatialBenchmarks,
  } = useSimulation();

  const [isRunningHeap, setIsRunningHeap] = useState<boolean>(false);
  const [isRunningSpatial, setIsRunningSpatial] = useState<boolean>(false);
  const [heapProgress, setHeapProgress] = useState<string>('');
  const [spatialProgress, setSpatialProgress] = useState<string>('');

  const [activeBenchmarkView, setActiveBenchmarkView] = useState<'heap' | 'spatial'>('heap');

  const runHeapTest = () => {
    setIsRunningHeap(true);
    setHeapProgress('Initializing benchmark suites...');

    setTimeout(() => {
      try {
        const sizes = [200, 1000, 3000, 8000, 15000, 25000];
        const res = BenchmarkEngine.runHeapBenchmark(sizes, (cur, total) => {
          setHeapProgress(`Executing Scale N = ${sizes[cur - 1]} (${cur}/${total})...`);
        });
        setHeapBenchmarks(res);
        setHeapProgress('Benchmark Completed Successfully.');
      } catch (e) {
        console.error(e);
      } finally {
        setIsRunningHeap(false);
      }
    }, 50);
  };

  const runSpatialTest = () => {
    setIsRunningSpatial(true);
    setSpatialProgress('Constructing QuadTree test partitions...');

    setTimeout(() => {
      try {
        const sizes = [200, 1000, 3000, 8000, 15000, 25000];
        const res = BenchmarkEngine.runSpatialBenchmark(sizes, (cur, total) => {
          setSpatialProgress(`Evaluating Range Queries N = ${sizes[cur - 1]} (${cur}/${total})...`);
        });
        setSpatialBenchmarks(res);
        setSpatialProgress('Spatial Benchmark Completed.');
      } catch (e) {
        console.error(e);
      } finally {
        setIsRunningSpatial(false);
      }
    }, 50);
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            EMPIRICAL ALGORITHMIC BENCHMARKING LAB
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time execution latency profiling across varying input scales (N = 200 to 25,000).
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveBenchmarkView('heap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeBenchmarkView === 'heap'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Fibonacci vs Binary Heap
          </button>

          <button
            onClick={() => setActiveBenchmarkView('spatial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeBenchmarkView === 'spatial'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            QuadTree vs Linear Scan
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto mt-6 space-y-6">
        {/* === 1. HEAP BENCHMARK VIEW === */}
        {activeBenchmarkView === 'heap' && (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-bold font-mono text-slate-200">
                  PRIORITY QUEUE TRIAL: FIBONACCI HEAP (O(1) Dec-Key) VS BINARY HEAP (O(log N))
                </span>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Benchmarks continuous dynamic triage updates: batch insertion, 50% decreaseKey operations, 25% extractMin extractions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {heapProgress && (
                  <span className="text-xs font-mono text-amber-400 animate-pulse">
                    {heapProgress}
                  </span>
                )}

                <button
                  id="btn-run-heap-benchmark"
                  onClick={runHeapTest}
                  disabled={isRunningHeap}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-lg shadow-amber-900/20 disabled:opacity-50 transition-all"
                >
                  {isRunningHeap ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Run Live Heap Trials (N=25K)</span>
                </button>
              </div>
            </div>

            {/* Interactive SVG Chart for Heap Benchmarks */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-200 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                EMPIRICAL DECREASE-KEY LATENCY CURVE (FIBONACCI O(1) VS BINARY O(log N))
              </h3>

              {heapBenchmarks.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-mono text-xs">
                  Click "Run Live Heap Trials" above to execute benchmark suite.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* SVG Chart */}
                  <div className="w-full h-64 bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-end">
                    <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-2 border-b border-slate-800">
                      {heapBenchmarks.map((b, idx) => {
                        const maxMs = Math.max(...heapBenchmarks.map(item => Math.max(item.binTotalMs, item.fibTotalMs)), 1);
                        const fibHeight = Math.max(6, (b.fibDecreaseKeyMs / maxMs) * 180);
                        const binHeight = Math.max(6, (b.binDecreaseKeyMs / maxMs) * 180);

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex items-end justify-center gap-1.5 h-48">
                              {/* Fibonacci Bar */}
                              <div
                                style={{ height: `${fibHeight}px` }}
                                className="w-1/2 bg-amber-500 rounded-t transition-all hover:brightness-125"
                                title={`Fibonacci Decrease-Key: ${b.fibDecreaseKeyMs} ms`}
                              />
                              {/* Binary Bar */}
                              <div
                                style={{ height: `${binHeight}px` }}
                                className="w-1/2 bg-rose-500 rounded-t transition-all hover:brightness-125"
                                title={`Binary Heap Decrease-Key: ${b.binDecreaseKeyMs} ms`}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 mt-1">
                              N={b.n >= 1000 ? `${b.n / 1000}k` : b.n}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-center gap-6 pt-3 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-amber-500 rounded" />
                        <span className="text-amber-400 font-bold">Fibonacci Heap (Amortized O(1))</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-rose-500 rounded" />
                        <span className="text-rose-400 font-bold">Binary Heap (Worst/Avg O(log N))</span>
                      </div>
                    </div>
                  </div>

                  {/* Benchmark Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2">Sample Size (N)</th>
                          <th className="pb-2 text-amber-400">Fib Insert (ms)</th>
                          <th className="pb-2 text-rose-400">Bin Insert (ms)</th>
                          <th className="pb-2 text-amber-400 font-bold">Fib Dec-Key (ms)</th>
                          <th className="pb-2 text-rose-400 font-bold">Bin Dec-Key (ms)</th>
                          <th className="pb-2 text-amber-400">Fib Total (ms)</th>
                          <th className="pb-2 text-rose-400">Bin Total (ms)</th>
                          <th className="pb-2 text-emerald-400">Speedup</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {heapBenchmarks.map((b, idx) => {
                          const speedup = (b.binDecreaseKeyMs / Math.max(0.001, b.fibDecreaseKeyMs)).toFixed(1);
                          return (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="py-2.5 font-bold text-slate-100">N = {b.n.toLocaleString()}</td>
                              <td className="py-2.5 text-amber-300">{b.fibInsertMs}</td>
                              <td className="py-2.5 text-rose-300">{b.binInsertMs}</td>
                              <td className="py-2.5 text-amber-400 font-bold">{b.fibDecreaseKeyMs}</td>
                              <td className="py-2.5 text-rose-400 font-bold">{b.binDecreaseKeyMs}</td>
                              <td className="py-2.5 text-amber-300">{b.fibTotalMs}</td>
                              <td className="py-2.5 text-rose-300">{b.binTotalMs}</td>
                              <td className="py-2.5 text-emerald-400 font-bold">{speedup}x faster</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === 2. SPATIAL BENCHMARK VIEW === */}
        {activeBenchmarkView === 'spatial' && (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-bold font-mono text-slate-200">
                  SPATIAL PARTITION TRIAL: REGION QUADTREE (O(log N)) VS LINEAR SCAN (O(N))
                </span>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Benchmarks 200 random bounding-box range queries across 2D spatial coordinate fields up to N = 25,000 points.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {spatialProgress && (
                  <span className="text-xs font-mono text-cyan-400 animate-pulse">
                    {spatialProgress}
                  </span>
                )}

                <button
                  onClick={runSpatialTest}
                  disabled={isRunningSpatial}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 transition-all"
                >
                  {isRunningSpatial ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Run Live Spatial Trials (N=25K)</span>
                </button>
              </div>
            </div>

            {/* Spatial Benchmark Results Table */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-200 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                SPATIAL RANGE QUERY PERFORMANCE & SPEEDUP FACTOR
              </h3>

              {spatialBenchmarks.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-mono text-xs">
                  Click "Run Live Spatial Trials" above to profile QuadTree range queries against linear scans.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">Sample Points (N)</th>
                        <th className="pb-2 text-cyan-400">QuadTree Build (ms)</th>
                        <th className="pb-2 text-slate-400">Linear Build (ms)</th>
                        <th className="pb-2 text-cyan-400 font-bold">QuadTree 200 Queries (ms)</th>
                        <th className="pb-2 text-rose-400 font-bold">Linear 200 Queries (ms)</th>
                        <th className="pb-2 text-emerald-400 font-bold">Empirical Speedup</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {spatialBenchmarks.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 font-bold text-slate-100">N = {s.n.toLocaleString()}</td>
                          <td className="py-2.5 text-cyan-300">{s.quadBuildMs}</td>
                          <td className="py-2.5 text-slate-400">{s.linearBuildMs}</td>
                          <td className="py-2.5 text-cyan-400 font-bold">{s.quadQueryMs}</td>
                          <td className="py-2.5 text-rose-400 font-bold">{s.linearQueryMs}</td>
                          <td className="py-2.5 text-emerald-400 font-bold text-sm">
                            {s.speedupFactor}x faster
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
