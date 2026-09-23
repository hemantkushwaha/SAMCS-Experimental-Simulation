import React, { useState } from 'react';
import { SimulationEngine } from '../simulation/engine';
import { DEFAULT_SIMULATION_PARAMETERS, SCENARIO_DEFINITIONS } from '../simulation/config';
import { ScenarioId } from '../simulation/types';
import { Play, RotateCw, CheckCircle2, ArrowRight } from 'lucide-react';

export const LiveSimRunner: React.FC = () => {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('S3');
  const [seed, setSeed] = useState<number>(1042);
  const [alpha, setAlpha] = useState<number>(0.45);
  const [beta, setBeta] = useState<number>(0.35);
  const [gamma, setGamma] = useState<number>(0.20);
  const [isRunning, setIsRunning] = useState(false);
  const [lastOutput, setLastOutput] = useState<{
    baseline: any;
    samcs: any;
  } | null>(null);

  const handleRunLive = () => {
    setIsRunning(true);
    setTimeout(() => {
      const params = {
        ...DEFAULT_SIMULATION_PARAMETERS,
        alpha,
        beta,
        gamma,
      };

      const engine = new SimulationEngine(params);
      const scenario = SCENARIO_DEFINITIONS[scenarioId];

      const baseOut = engine.executeRun(scenario, 'BASELINE', 999, seed);
      const samcsOut = engine.executeRun(scenario, 'SAMCS', 999, seed);

      setLastOutput({
        baseline: baseOut,
        samcs: samcsOut,
      });
      setIsRunning(false);
    }, 150);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Live Interactive Simulation Comparator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute a synchronized single trial with identical random seeds to observe real-time Baseline vs. SAMCS divergence.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-950 rounded-lg border border-slate-800 mb-6 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Scenario</label>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value as ScenarioId)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
            >
              <option value="S1">S1: Low-Complexity Stable</option>
              <option value="S2">S2: High-Complexity</option>
              <option value="S3">S3: Dynamic Multi-Phase</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Deterministic Seed</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">WCI Alpha (α: Cw)</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-purple-300 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">WCI Beta (β: Dw)</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={beta}
              onChange={(e) => setBeta(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-purple-300 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunLive}
              disabled={isRunning}
              className="w-full py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Simulating...' : 'Execute Live Run'}
            </button>
          </div>
        </div>

        {/* Live Output Compare */}
        {lastOutput ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Baseline Result */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <h4 className="font-bold text-sm text-slate-200">Baseline Run (Seed: {seed})</h4>
                  <span className="text-xs font-mono text-slate-400">Fixed 4 Cores</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Execution Time (T_exec):</span>
                    <span className="font-bold text-white">{lastOutput.baseline.runResult.tExecution.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tasks Completed:</span>
                    <span className="text-slate-300">{lastOutput.baseline.runResult.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mean CPU Utilization:</span>
                    <span className="text-orange-400">{lastOutput.baseline.runResult.cpuMean.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Computational Efficiency (η):</span>
                    <span className="text-slate-300">{lastOutput.baseline.runResult.efficiency.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Core-Seconds:</span>
                    <span className="text-slate-400">{lastOutput.baseline.runResult.totalCoreSeconds.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* SAMCS Result */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-900/40 mb-3">
                  <h4 className="font-bold text-sm text-indigo-200">SAMCS Run (Seed: {seed})</h4>
                  <span className="text-xs font-mono text-indigo-300">Self-Adaptive Elastic</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Execution Time (T_exec):</span>
                    <span className="font-bold text-emerald-300">{lastOutput.samcs.runResult.tExecution.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tasks Completed:</span>
                    <span className="text-slate-300">{lastOutput.samcs.runResult.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mean CPU Utilization:</span>
                    <span className="text-cyan-400">{lastOutput.samcs.runResult.cpuMean.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Computational Efficiency (η):</span>
                    <span className="font-bold text-emerald-400">{lastOutput.samcs.runResult.efficiency.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Adaptation Actions Taken:</span>
                    <span className="text-indigo-300">{lastOutput.samcs.adaptationEvents.length} events</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cumulative Overhead:</span>
                    <span className="text-rose-300">+{lastOutput.samcs.runResult.totalAdaptationOverheadSec.toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Timeline in this run */}
            {lastOutput.samcs.adaptationEvents.length > 0 && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase mb-3">
                  Live Adaptive Decisions in this Trial ({lastOutput.samcs.adaptationEvents.length} events)
                </h4>
                <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto">
                  {lastOutput.samcs.adaptationEvents.map((ev: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <span className="text-slate-400">Step {ev.step} ({ev.simTimeSec.toFixed(1)}s)</span>
                      <span className="font-bold text-emerald-400">{ev.action}</span>
                      <span className="text-slate-300">WCI: {ev.wci.toFixed(3)}</span>
                      <span className="text-indigo-300">
                        {ev.previousState.cores} → {ev.updatedState.cores} cores
                      </span>
                      <span className="text-amber-300">Cost: +{ev.overheadCostSec}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-500 font-mono">
            Click "Execute Live Run" to perform a deterministic simulation trial with custom inputs.
          </div>
        )}
      </div>
    </div>
  );
};
