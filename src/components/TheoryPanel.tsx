/**
 * Scientific Mathematical Formulations & UNDRR Sendai / NDMA Reference Panel
 *
 * Provides formal theoretical foundations for:
 * 1. Disaster Risk Index: R = (H * V) / C
 * 2. Dynamic Casualty Triage Score: Priority = w1*Severity + w2*Hazard + w3*Delta_t
 * 3. Formal Academic ADS Citations & Invariant Proofs
 */

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Calculator, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

export const TheoryPanel: React.FC = () => {
  // Interactive formula tester
  const [w1, setW1] = useState<number>(0.45);
  const [w2, setW2] = useState<number>(0.35);
  const [w3, setW3] = useState<number>(0.20);

  const [sampleSeverity, setSampleSeverity] = useState<number>(8.5);
  const [sampleExposure, setSampleExposure] = useState<number>(6.2);
  const [sampleWaitMinutes, setSampleWaitMinutes] = useState<number>(24);

  const timeFactor = Math.min(10, sampleWaitMinutes * 0.25);
  const rawUrgency = w1 * sampleSeverity * 10 + w2 * sampleExposure * 10 + w3 * timeFactor * 10;
  const simulatedHeapKey = Math.max(0.1, 100 - rawUrgency);

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none p-6">
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          SCIENTIFIC EVALUATION & MATHEMATICAL FORMULATIONS
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Grounded in the United Nations Disaster Risk Reduction (UNDRR) Sendai Framework and NDMA Guidelines.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto mt-6 space-y-6">
        {/* Section 1: Disaster Risk Index Formulation */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold font-mono text-cyan-400">
              1. DISASTER RISK INDEX FORMULATION (UNDRR SENDAI PRIORITY 1 & 4)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              EQUATION 1.1
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-center text-lg text-slate-200">
            <span className="text-red-400 font-bold">R</span> ={' '}
            <span className="text-amber-400 font-bold">(Hazard Proximity · Vulnerability Factor)</span> /{' '}
            <span className="text-emerald-400 font-bold">Capacity Margin</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1">Hazard Threat (H)</span>
              Aggregated threat potential computed from active spatial hazard fronts (rising flood, toxic cloud ppm, fire thermal corona):
              <div className="mt-2 text-slate-400 text-[11px]">
                H = (1 / |H|) · ∑ [ Severity_h · (Radius_h / 30) ]
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-red-400 font-bold block mb-1">Vulnerability Factor (V)</span>
              Demographic vulnerability weight accounting for pediatric (&lt;12) and geriatric (&gt;65) demographics combined with physical exposure:
              <div className="mt-2 text-slate-400 text-[11px]">
                V = (1 / |C|) · ∑ [ Age_Risk · (Severity_c / 5) ]
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">Capacity Margin (C)</span>
              Buffer capacity of undamaged safe hospital beds and emergency shelters divided by active casualty queue load:
              <div className="mt-2 text-slate-400 text-[11px]">
                C = (Shelter_Capacity + Staff) / (Casualties · 1.5)
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dynamic Casualty Triage Score & Interactive Calculator */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold font-mono text-amber-400">
              2. DYNAMIC CASUALTY TRIAGE SCORE (DCTS) & INTERACTIVE WEIGHT CALIBRATOR
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              EQUATION 2.1
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-center text-lg text-slate-200">
            <span className="text-amber-400 font-bold">Priority Urgency</span> ={' '}
            <span className="text-red-400 font-bold">(w₁ · Severity)</span> +{' '}
            <span className="text-purple-400 font-bold">(w₂ · Environmental Hazard)</span> +{' '}
            <span className="text-cyan-400 font-bold">(w₃ · Δt)</span>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Adjust the mathematical weights below to verify how clinical shock vitals, spatial hazard proximity from the QuadTree, and elapsed physiological delay Δt dynamically modulate the Fibonacci Min-Heap key:
          </p>

          {/* Interactive Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>w₁ (Clinical Severity):</span>
                <span className="text-red-400 font-bold">{w1.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={w1}
                onChange={e => setW1(parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>w₂ (Environmental Hazard):</span>
                <span className="text-purple-400 font-bold">{w2.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={w2}
                onChange={e => setW2(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>w₃ (Waiting Time Δt):</span>
                <span className="text-cyan-400 font-bold">{w3.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={w3}
                onChange={e => setW3(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Live Calculated Output */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-1 font-mono text-xs">
              <span className="text-slate-400">Sample Patient [GCS: 8.5/10 | Exposure: 6.2 | Wait: 24 min]:</span>
              <div className="text-slate-200">
                Calculated Raw Urgency: <span className="text-amber-400 font-bold text-sm">{rawUrgency.toFixed(2)}</span> / 100
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-slate-400 text-xs block">Fibonacci Min-Heap Key:</span>
              <span className="text-xl font-bold text-emerald-400">{simulatedHeapKey.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block">(Lowest key = Top extraction)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Formal Academic References */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-400">
          <span className="text-sm font-bold text-slate-200 block mb-2">
            3. PEER-REVIEWED THEORETICAL CITATIONS
          </span>
          <p>
            [1] Fredman, M. L., & Tarjan, R. E. (1987). "Fibonacci heaps and their uses in improved network optimization algorithms." Journal of the ACM (JACM), 34(3), 596-615.
          </p>
          <p>
            [2] Finkel, R. A., & Bentley, J. L. (1974). "Quad trees: A data structure for retrieval on composite keys." Acta Informatica, 4(1), 1-9.
          </p>
          <p>
            [3] Tarjan, R. E. (1975). "Efficiency of a good but not linear set union algorithm." Journal of the ACM (JACM), 22(2), 215-225.
          </p>
          <p>
            [4] United Nations Office for Disaster Risk Reduction (UNDRR). (2015). "Sendai Framework for Disaster Risk Reduction 2015-2030."
          </p>
          <p>
            [5] National Disaster Management Authority (NDMA). (2019). "National Disaster Management Guidelines: Mass Casualty Management."
          </p>
        </div>
      </div>
    </div>
  );
};
