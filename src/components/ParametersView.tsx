import React from 'react';
import { FullExperimentOutput } from '../simulation/runner';
import { ShieldCheck, BookOpen, AlertCircle, Settings, Layers } from 'lucide-react';

interface ParametersViewProps {
  data: FullExperimentOutput;
}

export const ParametersView: React.FC<ParametersViewProps> = ({ data }) => {
  const p = data.parameters;

  return (
    <div className="space-y-8 py-4">
      {/* SECTION 16: RESEARCH INTEGRITY NOTICE */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
              Section 16: Research-Integrity Requirement Notice
            </h3>
            <p className="text-xs text-amber-300/90 leading-relaxed">
              In strict adherence to experimental integrity standards, this benchmarking system makes explicit, formal distinctions between the following four categories:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-2 text-xs font-mono">
              <div className="bg-slate-950/80 p-2.5 rounded border border-amber-900/50">
                <div className="text-amber-400 font-bold mb-1">A. SIMULATION PARAMETERS</div>
                <div className="text-slate-400 text-[11px] font-sans">
                  Assumed computational model constants ($\alpha, \beta, \gamma$, thresholds, latencies). Explicitly documented as simulation parameters, not empirical hardware truths.
                </div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded border border-amber-900/50">
                <div className="text-sky-400 font-bold mb-1">B. SIMULATED OBSERVATIONS</div>
                <div className="text-slate-400 text-[11px] font-sans">
                  Deterministic runtime measurements ($C_w, D_w, V_r$, queue length, CPU/memory samples) recorded from the execution engine.
                </div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded border border-amber-900/50">
                <div className="text-emerald-400 font-bold mb-1">C. CALCULATED RESULTS</div>
                <div className="text-slate-400 text-[11px] font-sans">
                  Pure mathematical derivations from observations (means, std dev, 95% CIs, paired t-tests, Cohen's $d$, efficiency $\eta$).
                </div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded border border-amber-900/50">
                <div className="text-purple-400 font-bold mb-1">D. INTERPRETATION</div>
                <div className="text-slate-400 text-[11px] font-sans">
                  Comparative scientific evaluation of SAMCS vs Baseline behavior under non-stationary workload pressure.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PARAMETER CONFIGURATION TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Experimental Configuration & Parameter Table (Section 9)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Exportable & Fully Documented
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 font-mono">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Parameter</th>
                <th className="px-3 py-2">Assigned Value</th>
                <th className="px-3 py-2">Units / Bounds</th>
                <th className="px-3 py-2">Scientific Rationale & Nature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="px-3 py-2 text-indigo-300 font-bold">Resources</td>
                <td className="px-3 py-2 text-white">initialCores</td>
                <td className="px-3 py-2 font-bold text-emerald-400">{p.initialCores}</td>
                <td className="px-3 py-2">cores</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Baseline static allocation; SAMCS initial state.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-indigo-300 font-bold">Resources</td>
                <td className="px-3 py-2 text-white">minCores / maxCores</td>
                <td className="px-3 py-2 font-bold text-emerald-400">{p.minCores} / {p.maxCores}</td>
                <td className="px-3 py-2">cores</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Physical dynamic scaling envelope for SAMCS workers.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-indigo-300 font-bold">Resources</td>
                <td className="px-3 py-2 text-white">coreCapacityFlops</td>
                <td className="px-3 py-2 font-bold text-emerald-400">{p.coreCapacityFlops}</td>
                <td className="px-3 py-2">FLOP/s / core</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Nominal worker throughput constant (Simulation Parameter).</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-sky-300 font-bold">WCI Formula</td>
                <td className="px-3 py-2 text-white">alpha (α)</td>
                <td className="px-3 py-2 font-bold text-purple-400">{p.alpha}</td>
                <td className="px-3 py-2">dimensionless [0..1]</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Weight for computational intensity $C_w(t)$ (Simulation Parameter).</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-sky-300 font-bold">WCI Formula</td>
                <td className="px-3 py-2 text-white">beta (β)</td>
                <td className="px-3 py-2 font-bold text-purple-400">{p.beta}</td>
                <td className="px-3 py-2">dimensionless [0..1]</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Weight for dataset footprint $D_w(t)$ (Simulation Parameter).</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-sky-300 font-bold">WCI Formula</td>
                <td className="px-3 py-2 text-white">gamma (γ)</td>
                <td className="px-3 py-2 font-bold text-purple-400">{p.gamma}</td>
                <td className="px-3 py-2">dimensionless [0..1]</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Weight for core utilization variance $V_r(t)$ (Simulation Parameter).</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-amber-300 font-bold">Thresholds</td>
                <td className="px-3 py-2 text-white">wciHighThreshold (τ_high)</td>
                <td className="px-3 py-2 font-bold text-amber-400">{p.wciHighThreshold}</td>
                <td className="px-3 py-2">[0.0, 1.0]</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Trigger for resource scale-up (+2 worker cores).</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-amber-300 font-bold">Thresholds</td>
                <td className="px-3 py-2 text-white">wciLowThreshold (τ_low)</td>
                <td className="px-3 py-2 font-bold text-amber-400">{p.wciLowThreshold}</td>
                <td className="px-3 py-2">[0.0, 1.0]</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Trigger for resource scale-down (-2 cores) to conserve resources.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-amber-300 font-bold">Thresholds</td>
                <td className="px-3 py-2 text-white">varianceThreshold (τ_var)</td>
                <td className="px-3 py-2 font-bold text-amber-400">{p.varianceThreshold}</td>
                <td className="px-3 py-2">[0.0, 1.0]</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Trigger for worker queue redistribution.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-rose-300 font-bold">Overhead Model</td>
                <td className="px-3 py-2 text-white">overheadObservationSec</td>
                <td className="px-3 py-2 font-bold text-rose-400">{p.overheadObservationSec}s (5 ms)</td>
                <td className="px-3 py-2">seconds</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Telemetry gathering latency per observation step.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-rose-300 font-bold">Overhead Model</td>
                <td className="px-3 py-2 text-white">overheadScaleUpSec</td>
                <td className="px-3 py-2 font-bold text-rose-400">{p.overheadScaleUpSec}s (1250 ms)</td>
                <td className="px-3 py-2">seconds</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Thread spawning, worker initialization, context allocation cost.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-rose-300 font-bold">Overhead Model</td>
                <td className="px-3 py-2 text-white">overheadRedistributeSec</td>
                <td className="px-3 py-2 font-bold text-rose-400">{p.overheadRedistributeSec}s (450 ms)</td>
                <td className="px-3 py-2">seconds</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Queue rebalancing and inter-core task migration latency.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-emerald-300 font-bold">Repetition</td>
                <td className="px-3 py-2 text-white">runsPerScenario</td>
                <td className="px-3 py-2 font-bold text-white">{p.runsPerScenario}</td>
                <td className="px-3 py-2">independent runs</td>
                <td className="px-3 py-2 text-slate-400 font-sans">30 runs per condition (Section 10 requirement: 180 total runs).</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-emerald-300 font-bold">Repetition</td>
                <td className="px-3 py-2 text-white">baseRandomSeed</td>
                <td className="px-3 py-2 font-bold text-amber-300">{p.baseRandomSeed}</td>
                <td className="px-3 py-2">integer</td>
                <td className="px-3 py-2 text-slate-400 font-sans">Deterministic seed mapping: Seed(i) = baseRandomSeed + i.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* WCI MATHEMATICAL FORMULATION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">
            Workload Complexity Index ($WCI$) Mathematical Formulation (Section 4)
          </h3>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-purple-300 mb-4 border border-purple-900/50">
          WCI(t) = α · Cw(t) + β · Dw(t) + γ · Vr(t)
          <br />
          Where: α = 0.45, β = 0.35, γ = 0.20 (α + β + γ = 1.00, WCI ∈ [0.0, 1.0])
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-slate-300">
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <h4 className="font-bold text-indigo-300 mb-1 font-mono">1. Cw(t): Computational Intensity</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Normalized arrival demand relative to nominal worker core capacity. Gauges instantaneous processor saturation and queue pressure.
            </p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <h4 className="font-bold text-sky-300 mb-1 font-mono">2. Dw(t): Dataset Size / Memory Pressure</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Normalized memory footprint and buffer saturation. Detects potential cache thrashing and memory exhaustion.
            </p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <h4 className="font-bold text-emerald-300 mb-1 font-mono">3. Vr(t): Resource-Utilization Variability</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Normalized variance of thread queue distribution across worker cores. Identifies load imbalance requiring queue redistribution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
