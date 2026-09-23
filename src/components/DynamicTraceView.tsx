import React, { useState } from 'react';
import { FullExperimentOutput } from '../simulation/runner';
import {
  Clock,
  Zap,
  Activity,
  ArrowRight,
  RotateCcw,
  Sliders,
  CheckCircle,
} from 'lucide-react';

interface DynamicTraceViewProps {
  data: FullExperimentOutput;
}

export const DynamicTraceView: React.FC<DynamicTraceViewProps> = ({ data }) => {
  const [selectedStep, setSelectedStep] = useState<number>(62); // Default to near surge transition

  const s3SamcsObs = data.runtimeObservations.filter(
    (o) => o.scenarioId === 'S3' && o.system === 'SAMCS' && o.runId === 1
  );
  const s3BaseObs = data.runtimeObservations.filter(
    (o) => o.scenarioId === 'S3' && o.system === 'BASELINE' && o.runId === 1
  );
  const s3Events = data.adaptationEvents.filter(
    (e) => e.scenarioId === 'S3' && e.runId === 1
  );

  const maxStep = Math.max(
    ...s3SamcsObs.map((o) => o.step),
    ...s3BaseObs.map((o) => o.step),
    100
  );

  const currentSamcs = s3SamcsObs.find((o) => o.step === selectedStep) || s3SamcsObs[0];
  const currentBase = s3BaseObs.find((o) => o.step === selectedStep) || s3BaseObs[0];
  const currentEvent = s3Events.find((e) => e.step === selectedStep);

  return (
    <div className="space-y-8 py-4">
      {/* Dynamic Workload Response Metric Banner (Section 11.C) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Detection Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {data.s3DynamicMetrics.meanDetectionDelaySec.toFixed(2)}s
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Time from surge transition (t=58s) to WCI ≥ τ_high detection
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Adaptation Initiation Delay</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {data.s3DynamicMetrics.meanAdaptationInitiationSec.toFixed(2)}s
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Time from surge detection to first scale-up action execution
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Adaptation Actions</span>
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {(data.s3DynamicMetrics.totalAdaptationsInS3 / 30).toFixed(1)} / run
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mean dynamic actions per run in Scenario S3 (N=30)
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Post-Surge Stabilization</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {data.s3DynamicMetrics.meanStabilizationTimeSec.toFixed(2)}s
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Time to restore CPU &lt;80% and drain backlog post-surge
          </p>
        </div>
      </div>

      {/* Interactive Step Scrubber */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Runtime Observation Scrubber (Scenario S3, Reference Run 1)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag the timeline to inspect the exact computational state and meta-computing feedback loop at any second.
            </p>
          </div>
          <div className="font-mono text-xs px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 self-start sm:self-auto">
            Simulation Step: <span className="font-bold text-white">{selectedStep}</span> / {maxStep} (Time: {selectedStep}.0s)
          </div>
        </div>

        {/* Phase Navigation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setSelectedStep(14)}
            className={`px-2.5 py-1.5 rounded text-xs text-left border transition ${
              selectedStep >= 0 && selectedStep < 28
                ? 'bg-blue-950/70 border-blue-600 text-blue-200 font-semibold'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-mono text-blue-400">Phase 1 (t=0..28s)</div>
            <div>Low Stable (22 t/s)</div>
          </button>
          <button
            onClick={() => setSelectedStep(43)}
            className={`px-2.5 py-1.5 rounded text-xs text-left border transition ${
              selectedStep >= 28 && selectedStep < 58
                ? 'bg-amber-950/70 border-amber-600 text-amber-200 font-semibold'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-mono text-amber-400">Phase 2 (t=28..58s)</div>
            <div>Medium Intensity (50 t/s)</div>
          </button>
          <button
            onClick={() => setSelectedStep(66)}
            className={`px-2.5 py-1.5 rounded text-xs text-left border transition ${
              selectedStep >= 58 && selectedStep < 88
                ? 'bg-rose-950/70 border-rose-600 text-rose-200 font-semibold'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-mono text-rose-400">Phase 3 (t=58..88s)</div>
            <div>High Surge (85 t/s)</div>
          </button>
          <button
            onClick={() => setSelectedStep(96)}
            className={`px-2.5 py-1.5 rounded text-xs text-left border transition ${
              selectedStep >= 88
                ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200 font-semibold'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] uppercase font-mono text-emerald-400">Phase 4 (t=88..110s)</div>
            <div>Recovery (20 t/s)</div>
          </button>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="0"
          max={maxStep}
          value={selectedStep}
          onChange={(e) => setSelectedStep(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none mb-6"
        />

        {/* Side-by-Side State Comparison at selected step */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SYSTEM A: BASELINE */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <h4 className="font-bold text-sm text-slate-200">System A: Baseline (Fixed)</h4>
              </div>
              <span className="text-xs font-mono text-slate-400">Static 4 Cores</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">CPU UTILIZATION</div>
                <div className="text-sm font-bold text-orange-400">
                  {currentBase ? `${currentBase.cpuUtilization.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">QUEUE BACKLOG</div>
                <div className={`text-sm font-bold ${currentBase && currentBase.queueLength > 100 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {currentBase ? `${currentBase.queueLength} tasks` : '0'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">ALLOCATED CORES</div>
                <div className="text-sm font-bold text-slate-300">4 cores (Fixed)</div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">COMPUTED WCI</div>
                <div className="text-sm font-bold text-slate-400">
                  {currentBase ? currentBase.wci.toFixed(3) : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">MEMORY UTIL</div>
                <div className="text-sm font-bold text-slate-300">
                  {currentBase ? `${currentBase.memoryUtilization.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">THROUGHPUT</div>
                <div className="text-sm font-bold text-slate-300">
                  {currentBase ? `${currentBase.throughput} t/s` : 'N/A'}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded border border-slate-800/60">
              * Baseline does not modify worker resources or batch parameters during execution.
            </div>
          </div>

          {/* SYSTEM B: SAMCS */}
          <div className="bg-slate-950/70 border border-indigo-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-900/40 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <h4 className="font-bold text-sm text-indigo-200">System B: SAMCS (Self-Adaptive)</h4>
              </div>
              <span className="text-xs font-mono text-indigo-300">Dynamic Elastic Cores</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">CPU UTILIZATION</div>
                <div className="text-sm font-bold text-cyan-400">
                  {currentSamcs ? `${currentSamcs.cpuUtilization.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">QUEUE BACKLOG</div>
                <div className="text-sm font-bold text-emerald-400">
                  {currentSamcs ? `${currentSamcs.queueLength} tasks` : '0'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">ACTIVE CORES</div>
                <div className="text-sm font-bold text-indigo-300">
                  {currentSamcs ? `${currentSamcs.activeCores} cores` : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">WCI INDEX</div>
                <div className="text-sm font-bold text-purple-400">
                  {currentSamcs ? currentSamcs.wci.toFixed(3) : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">CUMULATIVE OVERHEAD</div>
                <div className="text-sm font-bold text-rose-400">
                  {currentSamcs ? `+${currentSamcs.cumulativeOverheadSec.toFixed(3)}s` : '0s'}
                </div>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 text-[10px]">THROUGHPUT</div>
                <div className="text-sm font-bold text-emerald-300">
                  {currentSamcs ? `${currentSamcs.throughput} t/s` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Event log banner if action occurred at this step */}
            <div className="mt-3">
              {currentEvent ? (
                <div className="bg-indigo-950/80 border border-indigo-700/60 p-2.5 rounded text-xs">
                  <div className="flex items-center justify-between font-mono text-indigo-300 mb-1 font-semibold">
                    <span>ACTION TRIGGERED: {currentEvent.action}</span>
                    <span className="text-amber-300">Cost: +{currentEvent.overheadCostSec}s</span>
                  </div>
                  <div className="text-slate-300 text-[11px] mb-1">
                    <strong>Trigger:</strong> {currentEvent.triggerReason}
                  </div>
                  <div className="text-slate-400 text-[10px] font-mono flex items-center gap-2">
                    <span>{currentEvent.previousState.cores} Cores</span>
                    <ArrowRight className="w-3 h-3 text-indigo-400" />
                    <span className="text-emerald-300 font-bold">{currentEvent.updatedState.cores} Cores</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/60 flex items-center justify-between">
                  <span>Decision: <strong>MAINTAIN_CONFIGURATION</strong></span>
                  <span className="text-slate-500 font-mono text-[10px]">Operating within nominal thresholds</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
