/**
 * Advanced Data Structures (ADS) Structural Inspector Panel
 *
 * Real-time structural introspection of:
 * 1. Fibonacci Heap: Root list circular ring, node degrees, marked flags, cascading cuts.
 * 2. Region QuadTree: Spatial bounding coordinates, tree depth, quadrant subdivisions, point density.
 * 3. Disjoint-Set Union: Component partition sets, ranks, and path compression telemetry.
 */

import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  Layers,
  Cpu,
  Share2,
  GitBranch,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const ADSInspectorPanel: React.FC = () => {
  const {
    triageHeap,
    hazardQuadTree,
    mstResult,
    heapTelemetry,
    roads,
  } = useSimulation();

  const [activeSubTab, setActiveSubTab] = useState<'fibonacci' | 'quadtree' | 'dsu'>('fibonacci');

  // Fibonacci Heap Snapshot
  const rootTrees = triageHeap.getRootTrees();

  // QuadTree Boundaries
  const boundaries = hazardQuadTree.getAllBoundaries();
  const maxDepth = hazardQuadTree.getMaxDepth();
  const totalPoints = hazardQuadTree.size();

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none p-6">
      {/* Tab Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            FIRST-PRINCIPLES ADS STRUCTURAL INSPECTOR
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zero third-party abstractions. Direct memory pointer inspection, degree consolidation array & cascading cuts.
          </p>
        </div>

        {/* Subtab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('fibonacci')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeSubTab === 'fibonacci'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Fibonacci Heap
          </button>

          <button
            onClick={() => setActiveSubTab('quadtree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeSubTab === 'quadtree'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Region QuadTree
          </button>

          <button
            onClick={() => setActiveSubTab('dsu')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeSubTab === 'dsu'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            DSU & Kruskal MST
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto mt-6">
        {/* === 1. FIBONACCI HEAP INSPECTOR === */}
        {activeSubTab === 'fibonacci' && (
          <div className="space-y-6">
            {/* Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">TOTAL NODES</span>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-100">
                  {heapTelemetry.nodeCount}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">In active priority queue</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">ROOT LIST TREES</span>
                <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
                  {rootTrees.length}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Circular doubly linked list</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">CASCADING CUTS</span>
                <div className="mt-1 text-2xl font-bold font-mono text-red-400">
                  {heapTelemetry.cascadingCuts}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Triggered via decreaseKey()</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">CONSOLIDATION RUNS</span>
                <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
                  {heapTelemetry.consolidations}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Degree array link passes</span>
              </div>
            </div>

            {/* Degree Array Distribution Post-Consolidation */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  DEGREE ARRAY DISTRIBUTION (POST-CONSOLIDATION STATUS)
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Max Degree: <span className="text-cyan-400 font-bold">{heapTelemetry.maxDegree ?? 0}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((deg) => {
                  const count = heapTelemetry.degreeDistribution?.[deg] || 0;
                  return (
                    <div
                      key={deg}
                      className={`p-2.5 rounded-xl border text-center font-mono ${
                        count > 0
                          ? 'bg-slate-950 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-600'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400">Degree {deg}</div>
                      <div className="text-lg font-bold mt-0.5">{count} {count === 1 ? 'tree' : 'trees'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Root List Forest Tree Visualizer */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-amber-400" />
                  ACTIVE ROOT LIST CIRCULAR FOREST
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  minNode Key: <span className="text-emerald-400 font-bold">{heapTelemetry.minKey ?? 'NULL'}</span>
                </span>
              </div>

              {rootTrees.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  Fibonacci Heap is currently empty.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rootTrees.map((tree, idx) => {
                    const isMin = tree.key === heapTelemetry.minKey;

                    return (
                      <div
                        key={tree.id || idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isMin
                            ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-900/10'
                            : 'bg-slate-950/70 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-400">
                              Root #{idx + 1}
                            </span>
                            {isMin && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                                MIN POINTER
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            Degree:{' '}
                            <span
                              className={`font-bold ${
                                tree.degree > 0 ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {tree.degree}
                            </span>
                          </span>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between font-mono">
                          <span className="text-xs text-slate-500">Heap Key:</span>
                          <span className="text-base font-bold text-slate-200">{tree.key}</span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500">Cascading Marked:</span>
                          <span className={tree.isMarked ? 'text-red-400 font-bold' : 'text-slate-400'}>
                            {tree.isMarked ? 'TRUE (CUT ON NEXT)' : 'FALSE'}
                          </span>
                        </div>

                        {/* Children Hierarchy Preview */}
                        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                          <span>Children: {tree.childCount} sub-branches</span>
                          {tree.children.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {tree.children.map((child, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px]"
                                >
                                  k:{child.key} (d:{child.degree})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theoretical Mechanics Card */}
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 text-xs font-mono space-y-2 text-slate-400">
              <span className="font-bold text-slate-200">FIBONACCI HEAP AMORTIZED GUARANTEES:</span>
              <p>• Insert: O(1) amortized & worst-case via simple circular doubly-linked root list splicing.</p>
              <p>• Decrease-Key: O(1) amortized via cascading-cut mechanics. If node violates min-heap invariant with parent, it cuts immediately; parent is marked; if parent was already marked, it triggers recursive cascading cut upward.</p>
              <p>• Extract-Min: O(log N) amortized. Children are promoted to the root list, followed by degree-array consolidation linking trees of identical degrees (yielding roots of degree 1, 2, 3...).</p>
            </div>
          </div>
        )}

        {/* === 2. REGION QUADTREE INSPECTOR === */}
        {activeSubTab === 'quadtree' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">TOTAL BOUNDING CELLS</span>
                <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
                  {boundaries.length}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">NW, NE, SW, SE partitions</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">MAX TREE DEPTH</span>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-100">
                  {maxDepth}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">O(log4 N) tree height</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">INDEXED SPATIAL POINTS</span>
                <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                  {totalPoints}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Active hazard centroids</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">LEAF CAPACITY</span>
                <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
                  4 points
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Splits when threshold reached</span>
              </div>
            </div>

            {/* Quadrant List */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-200 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                GEOSPATIAL QUADRANT PARTITION TABLE (WGS84 COORDINATES)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Quadrant Depth</th>
                      <th className="pb-2">Latitude Range</th>
                      <th className="pb-2">Longitude Range</th>
                      <th className="pb-2">Contained Points</th>
                      <th className="pb-2">Subdivision State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {boundaries.slice(0, 15).map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 text-cyan-400 font-bold">Level {b.depth}</td>
                        <td className="py-2">
                          [{b.minLat.toFixed(4)}°, {b.maxLat.toFixed(4)}°]
                        </td>
                        <td className="py-2">
                          [{b.minLng.toFixed(4)}°, {b.maxLng.toFixed(4)}°]
                        </td>
                        <td className="py-2 text-emerald-400">{b.pointCount} points</td>
                        <td className="py-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {b.pointCount < 4 ? 'LEAF NODE' : 'INTERNAL NODE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === 3. DSU & KRUSKAL MST INSPECTOR === */}
        {activeSubTab === 'dsu' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">CONNECTED COMPONENTS</span>
                <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                  {mstResult.connectedComponents}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {mstResult.isFullyConnected ? 'Unified infrastructure network' : 'Disjoint sub-networks'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">MST SPANNING DISTANCE</span>
                <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
                  {Math.round(mstResult.totalCost)} m
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Total edge impedance cost</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">MST ACTIVE BACKBONE EDGES</span>
                <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
                  {mstResult.edges.length}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Selected by Kruskal union</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">TOTAL CORRIDORS</span>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-100">
                  {roads.length}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {roads.filter((r) => r.status === 'severed' || r.status === 'flooded').length} Severed / Flooded
                </span>
              </div>
            </div>

            {/* MST Edges Table */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-200 mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                KRUSKAL'S MINIMUM SPANNING TREE SELECTED EDGES
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Edge ID</th>
                      <th className="pb-2">Source Hub</th>
                      <th className="pb-2">Target Hub</th>
                      <th className="pb-2">Base Length</th>
                      <th className="pb-2">Hazard Proximity</th>
                      <th className="pb-2">Effective Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {mstResult.edges.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/40">
                        <td className="py-2 text-emerald-400 font-bold">{e.id}</td>
                        <td className="py-2">{e.source}</td>
                        <td className="py-2">{e.target}</td>
                        <td className="py-2">{Math.round(e.length)} m</td>
                        <td className="py-2 text-amber-400">{(e.hazardProximity * 100).toFixed(0)}%</td>
                        <td className="py-2 font-bold text-slate-100">{Math.round(e.weight)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
