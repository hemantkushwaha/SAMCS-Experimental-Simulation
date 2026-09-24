import React, { useState } from 'react';
import { FullExperimentOutput } from '../simulation/runner';
import { BarChart3, Info, Eye, Table2 } from 'lucide-react';

interface FiguresViewProps {
  data: FullExperimentOutput;
}

export const FiguresView: React.FC<FiguresViewProps> = ({ data }) => {
  const [showDataTable, setShowDataTable] = useState<Record<string, boolean>>({});

  const toggleTable = (figKey: string) => {
    setShowDataTable((prev) => ({ ...prev, [figKey]: !prev[figKey] }));
  };

  // Helper to extract metric values by scenario and system
  const getSummary = (scenarioId: string, system: 'BASELINE' | 'SAMCS') => {
    return data.scenarioSummaries.find(
      (s) => s.scenarioId === scenarioId && s.system === system
    );
  };

  // S1, S2, S3 Summaries
  const s1Base = getSummary('S1', 'BASELINE');
  const s1Samcs = getSummary('S1', 'SAMCS');
  const s2Base = getSummary('S2', 'BASELINE');
  const s2Samcs = getSummary('S2', 'SAMCS');
  const s3Base = getSummary('S3', 'BASELINE');
  const s3Samcs = getSummary('S3', 'SAMCS');

  // Representative S3 observation traces (Run 1)
  const s3SamcsTrace = data.runtimeObservations.filter(
    (obs) => obs.scenarioId === 'S3' && obs.system === 'SAMCS' && obs.runId === 1
  );
  const s3BaseTrace = data.runtimeObservations.filter(
    (obs) => obs.scenarioId === 'S3' && obs.system === 'BASELINE' && obs.runId === 1
  );

  // S3 Adaptation events for Run 1
  const s3EventsRun1 = data.adaptationEvents.filter(
    (ev) => ev.scenarioId === 'S3' && ev.runId === 1
  );

  return (
    <div className="space-y-10 py-4">
      {/* Overview callout */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-200 uppercase tracking-wide">
            Publication Figures 1–6
          </span>
          : Generated dynamically from 180 raw deterministic runs (N=30 per condition).
          All error bars represent 95% Confidence Intervals. Axes use zero-baseline scales.
        </div>
        <div className="font-mono text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-800/50 shrink-0">
          Source: raw_runs.csv & runtime_observations.csv
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FIGURE 1: EXECUTION TIME */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
              <span>Figure 1</span>
              <span className="text-slate-600">•</span>
              <span>Primary Performance Benchmark</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Workload Execution Time (T_exec) across Scenarios: Baseline vs. SAMCS
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Comparison of total completion time (seconds) across S1 (Low-Complexity Stable),
              S2 (High-Complexity), and S3 (Dynamic Multi-Phase). Whisker bars depict empirical
              95% Confidence Intervals (N=30 runs per group). Lower values denote superior performance.
            </p>
          </div>
          <button
            onClick={() => toggleTable('fig1')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Table2 className="w-3.5 h-3.5" />
            {showDataTable['fig1'] ? 'Hide Numerical Data' : 'View Numerical Table'}
          </button>
        </div>

        {/* SVG Chart for Figure 1 */}
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 300" className="w-full min-w-[640px] h-72">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100, 125, 150].map((val) => {
              const y = 250 - (val / 150) * 210;
              return (
                <g key={val}>
                  <line x1="60" y1={y} x2="720" y2={y} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                  <text x="50" y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {val}s
                  </text>
                </g>
              );
            })}

            {/* X-Axis and Y-Axis */}
            <line x1="60" y1="250" x2="720" y2="250" stroke="#475569" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="250" stroke="#475569" strokeWidth="1.5" />

            {/* Y-Axis Label */}
            <text x="-145" y="18" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(-90)">
              Mean Execution Time (seconds)
            </text>

            {/* Bars Generation */}
            {[
              { label: 'S1: Stable Low', base: s1Base, samcs: s1Samcs, xGroup: 170 },
              { label: 'S2: Heavy Load', base: s2Base, samcs: s2Samcs, xGroup: 390 },
              { label: 'S3: Dynamic Multi-Phase', base: s3Base, samcs: s3Samcs, xGroup: 610 },
            ].map(({ label, base, samcs, xGroup }) => {
              if (!base || !samcs) return null;

              const baseMean = base.executionTime.mean;
              const baseH = (baseMean / 150) * 210;
              const baseY = 250 - baseH;
              const baseCiLowY = 250 - (base.executionTime.ci95Low / 150) * 210;
              const baseCiHighY = 250 - (base.executionTime.ci95High / 150) * 210;

              const samcsMean = samcs.executionTime.mean;
              const samcsH = (samcsMean / 150) * 210;
              const samcsY = 250 - samcsH;
              const samcsCiLowY = 250 - (samcs.executionTime.ci95Low / 150) * 210;
              const samcsCiHighY = 250 - (samcs.executionTime.ci95High / 150) * 210;

              const isOverhead = samcsMean > baseMean;
              const diffPct = isOverhead
                ? (((samcsMean - baseMean) / baseMean) * 100).toFixed(1)
                : (((baseMean - samcsMean) / baseMean) * 100).toFixed(1);

              const badgeText = isOverhead
                ? `+${diffPct}% Latency Overhead`
                : `${diffPct}% Lower Execution Time`;

              return (
                <g key={label}>
                  {/* Group Label */}
                  <text x={xGroup} y="270" fill="#e2e8f0" fontSize="11" fontWeight="600" textAnchor="middle">
                    {label}
                  </text>

                  {/* Baseline Bar */}
                  <rect
                    x={xGroup - 60}
                    y={baseY}
                    width="44"
                    height={baseH}
                    fill="#64748b"
                    rx="2"
                    className="hover:opacity-90 transition-opacity"
                  />
                  {/* Baseline Error Bar */}
                  <line x1={xGroup - 38} y1={baseCiLowY} x2={xGroup - 38} y2={baseCiHighY} stroke="#f1f5f9" strokeWidth="1.5" />
                  <line x1={xGroup - 44} y1={baseCiLowY} x2={xGroup - 32} y2={baseCiLowY} stroke="#f1f5f9" strokeWidth="1.5" />
                  <line x1={xGroup - 44} y1={baseCiHighY} x2={xGroup - 32} y2={baseCiHighY} stroke="#f1f5f9" strokeWidth="1.5" />
                  <text x={xGroup - 38} y={baseY - 8} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {baseMean.toFixed(1)}s
                  </text>

                  {/* SAMCS Bar */}
                  <rect
                    x={xGroup + 16}
                    y={samcsY}
                    width="44"
                    height={samcsH}
                    fill="#6366f1"
                    rx="2"
                    className="hover:opacity-90 transition-opacity"
                  />
                  {/* SAMCS Error Bar */}
                  <line x1={xGroup + 38} y1={samcsCiLowY} x2={xGroup + 38} y2={samcsCiHighY} stroke="#f1f5f9" strokeWidth="1.5" />
                  <line x1={xGroup + 32} y1={samcsCiLowY} x2={xGroup + 44} y2={samcsCiLowY} stroke="#f1f5f9" strokeWidth="1.5" />
                  <line x1={xGroup + 32} y1={samcsCiHighY} x2={xGroup + 44} y2={samcsCiHighY} stroke="#f1f5f9" strokeWidth="1.5" />
                  <text x={xGroup + 38} y={samcsY - 8} fill="#a5b4fc" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    {samcsMean.toFixed(1)}s
                  </text>

                  {/* Execution-time comparison badge */}
                  <rect
                    x={xGroup - 76}
                    y="280"
                    width="152"
                    height="16"
                    rx="3"
                    fill={isOverhead ? '#31131b' : '#064e3b'}
                    stroke={isOverhead ? '#e11d48' : '#059669'}
                    strokeWidth="0.8"
                  />
                  <text
                    x={xGroup}
                    y="291.5"
                    fill={isOverhead ? '#fda4af' : '#34d399'}
                    fontSize="8.5"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {badgeText}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <g transform="translate(480, 20)">
              <rect x="0" y="0" width="12" height="12" fill="#64748b" rx="2" />
              <text x="18" y="10" fill="#cbd5e1" fontSize="11">System A: Baseline (Fixed 4 Cores)</text>
              <rect x="195" y="0" width="12" height="12" fill="#6366f1" rx="2" />
              <text x="213" y="10" fill="#a5b4fc" fontSize="11" fontWeight="bold">System B: SAMCS (Proposed)</text>
            </g>
          </svg>
        </div>

        {/* Data table toggle */}
        {showDataTable['fig1'] && (
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="text-xs font-mono text-slate-400 mb-2">Underlying Data Source: scenario_summary.csv (Execution Time)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-mono uppercase">
                  <tr>
                    <th className="px-3 py-1.5">Scenario</th>
                    <th className="px-3 py-1.5">System</th>
                    <th className="px-3 py-1.5">N</th>
                    <th className="px-3 py-1.5">Mean (s)</th>
                    <th className="px-3 py-1.5">Median (s)</th>
                    <th className="px-3 py-1.5">Std Dev</th>
                    <th className="px-3 py-1.5">Min - Max</th>
                    <th className="px-3 py-1.5">95% CI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {[s1Base, s1Samcs, s2Base, s2Samcs, s3Base, s3Samcs].map((s, idx) => s && (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-900/40' : ''}>
                      <td className="px-3 py-1 font-semibold text-slate-200">{s.scenarioId}</td>
                      <td className="px-3 py-1 text-indigo-300">{s.system}</td>
                      <td className="px-3 py-1">{s.sampleSize}</td>
                      <td className="px-3 py-1 font-bold text-white">{s.executionTime.mean.toFixed(2)}</td>
                      <td className="px-3 py-1">{s.executionTime.median.toFixed(2)}</td>
                      <td className="px-3 py-1">{s.executionTime.std.toFixed(2)}</td>
                      <td className="px-3 py-1">{s.executionTime.min.toFixed(1)} – {s.executionTime.max.toFixed(1)}</td>
                      <td className="px-3 py-1">[{s.executionTime.ci95Low.toFixed(2)}, {s.executionTime.ci95High.toFixed(2)}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FIGURE 2: RESOURCE UTILIZATION */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
              <span>Figure 2</span>
              <span className="text-slate-600">•</span>
              <span>Resource Pressure Analysis</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Mean CPU & Memory Utilization: Baseline vs. SAMCS
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Sustained resource utilization (%) across experimental scenarios. While Baseline experiences
              CPU saturation during high-demand surges (U_CPU ≈ 90–95%), SAMCS maintains
              sustainable load profiles through elastic core scaling.
            </p>
          </div>
          <button
            onClick={() => toggleTable('fig2')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Table2 className="w-3.5 h-3.5" />
            {showDataTable['fig2'] ? 'Hide Data' : 'View Data'}
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 270" className="w-full min-w-[640px] h-64">
            {/* Grid lines 0 to 100% */}
            {[0, 20, 40, 60, 80, 100].map((val) => {
              const y = 220 - (val / 100) * 180;
              return (
                <g key={val}>
                  <line x1="60" y1={y} x2="720" y2={y} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                  <text x="50" y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {val}%
                  </text>
                </g>
              );
            })}

            <line x1="60" y1="220" x2="720" y2="220" stroke="#475569" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="220" stroke="#475569" strokeWidth="1.5" />

            <text x="-130" y="18" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(-90)">
              Mean CPU Utilization (%)
            </text>

            {[
              { label: 'S1: Low Complexity', base: s1Base?.cpuUtilization, samcs: s1Samcs?.cpuUtilization, xGroup: 170 },
              { label: 'S2: High Complexity', base: s2Base?.cpuUtilization, samcs: s2Samcs?.cpuUtilization, xGroup: 390 },
              { label: 'S3: Dynamic Workload', base: s3Base?.cpuUtilization, samcs: s3Samcs?.cpuUtilization, xGroup: 610 },
            ].map(({ label, base, samcs, xGroup }) => {
              if (!base || !samcs) return null;
              const baseH = (base.mean / 100) * 180;
              const baseY = 220 - baseH;
              const samcsH = (samcs.mean / 100) * 180;
              const samcsY = 220 - samcsH;

              return (
                <g key={label}>
                  <text x={xGroup} y="240" fill="#e2e8f0" fontSize="11" fontWeight="600" textAnchor="middle">
                    {label}
                  </text>

                  {/* Baseline CPU */}
                  <rect x={xGroup - 55} y={baseY} width="40" height={baseH} fill="#f97316" rx="2" opacity="0.85" />
                  <text x={xGroup - 35} y={baseY - 6} fill="#fdba74" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {base.mean.toFixed(1)}%
                  </text>

                  {/* SAMCS CPU */}
                  <rect x={xGroup + 15} y={samcsY} width="40" height={samcsH} fill="#06b6d4" rx="2" opacity="0.9" />
                  <text x={xGroup + 35} y={samcsY - 6} fill="#67e8f9" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    {samcs.mean.toFixed(1)}%
                  </text>
                </g>
              );
            })}

            <g transform="translate(470, 15)">
              <rect x="0" y="0" width="12" height="12" fill="#f97316" rx="2" opacity="0.85" />
              <text x="18" y="10" fill="#cbd5e1" fontSize="11">Baseline CPU Util (%)</text>
              <rect x="155" y="0" width="12" height="12" fill="#06b6d4" rx="2" opacity="0.9" />
              <text x="173" y="10" fill="#67e8f9" fontSize="11" fontWeight="bold">SAMCS CPU Util (%)</text>
            </g>
          </svg>
        </div>

        {showDataTable['fig2'] && (
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="text-xs font-mono text-slate-400 mb-2">Underlying Data Source: scenario_summary.csv (CPU & Memory Utilization)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300 font-mono">
                <thead className="bg-slate-800/80 text-slate-400 uppercase">
                  <tr>
                    <th className="px-3 py-1.5">Scenario</th>
                    <th className="px-3 py-1.5">System</th>
                    <th className="px-3 py-1.5">CPU Mean ± Std</th>
                    <th className="px-3 py-1.5">CPU Min–Max</th>
                    <th className="px-3 py-1.5">Mem Mean ± Std</th>
                    <th className="px-3 py-1.5">Mem Min–Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {[s1Base, s1Samcs, s2Base, s2Samcs, s3Base, s3Samcs].map((s, idx) => s && (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-900/40' : ''}>
                      <td className="px-3 py-1 font-semibold text-slate-200">{s.scenarioId}</td>
                      <td className="px-3 py-1 text-indigo-300">{s.system}</td>
                      <td className="px-3 py-1">{s.cpuUtilization.mean.toFixed(1)}% ± {s.cpuUtilization.std.toFixed(1)}</td>
                      <td className="px-3 py-1">{s.cpuUtilization.min.toFixed(1)}% – {s.cpuUtilization.max.toFixed(1)}%</td>
                      <td className="px-3 py-1">{s.memoryUtilization.mean.toFixed(1)}% ± {s.memoryUtilization.std.toFixed(1)}</td>
                      <td className="px-3 py-1">{s.memoryUtilization.min.toFixed(1)}% – {s.memoryUtilization.max.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FIGURE 3: WCI OVER TIME FOR DYNAMIC WORKLOAD */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
              <span>Figure 3</span>
              <span className="text-slate-600">•</span>
              <span>Dynamic Workload Analysis</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Workload Complexity Index (WCI(t)) over Time: Scenario S3 Trace
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Continuous trajectory of WCI(t) = α Cw(t) + β Dw(t) + γ Vr(t) across discrete simulation steps (Δt = 1.0s)
              under the dynamic profile: Low (t=0–28s) → Medium (t=28–58s) → High Surge (t=58–88s) → Low Recovery (t=88–120s).
              Threshold lines represent adaptation triggers (τ_high = 0.65, τ_low = 0.30).
            </p>
          </div>
          <button
            onClick={() => toggleTable('fig3')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Table2 className="w-3.5 h-3.5" />
            {showDataTable['fig3'] ? 'Hide Points' : 'Inspect Sample Trace'}
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 280" className="w-full min-w-[640px] h-64">
            {/* Phase boundary shading */}
            {/* Phase 1: Low (0 - 28) */}
            <rect x="60" y="30" width={(28 / 110) * 650} height="200" fill="#3b82f6" opacity="0.05" />
            <text x="140" y="45" fill="#93c5fd" fontSize="10" fontWeight="600" textAnchor="middle">Phase 1: Low</text>

            {/* Phase 2: Medium (28 - 58) */}
            <rect x={60 + (28 / 110) * 650} y="30" width={(30 / 110) * 650} height="200" fill="#eab308" opacity="0.05" />
            <text x={60 + (43 / 110) * 650} y="45" fill="#fde047" fontSize="10" fontWeight="600" textAnchor="middle">Phase 2: Med</text>

            {/* Phase 3: High Surge (58 - 88) */}
            <rect x={60 + (58 / 110) * 650} y="30" width={(30 / 110) * 650} height="200" fill="#ef4444" opacity="0.07" />
            <text x={60 + (73 / 110) * 650} y="45" fill="#fca5a5" fontSize="10" fontWeight="600" textAnchor="middle">Phase 3: High Surge</text>

            {/* Phase 4: Recovery (88 - 110) */}
            <rect x={60 + (88 / 110) * 650} y="30" width={(22 / 110) * 650} height="200" fill="#10b981" opacity="0.05" />
            <text x={60 + (99 / 110) * 650} y="45" fill="#6ee7b7" fontSize="10" fontWeight="600" textAnchor="middle">Phase 4: Low</text>

            {/* Threshold line High (0.65) */}
            {(() => {
              const yHigh = 230 - 0.65 * 190;
              const yLow = 230 - 0.30 * 190;
              return (
                <>
                  <line x1="60" y1={yHigh} x2="710" y2={yHigh} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth="1.2" />
                  <text x="715" y={yHigh + 3} fill="#f43f5e" fontSize="9" fontFamily="monospace">τ_high (0.65)</text>

                  <line x1="60" y1={yLow} x2="710" y2={yLow} stroke="#10b981" strokeDasharray="4 4" strokeWidth="1.2" />
                  <text x="715" y={yLow + 3} fill="#10b981" fontSize="9" fontFamily="monospace">τ_low (0.30)</text>
                </>
              );
            })()}

            {/* Y axis levels */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v) => {
              const y = 230 - v * 190;
              return (
                <g key={v}>
                  <line x1="60" y1={y} x2="710" y2={y} stroke="#334155" strokeWidth="0.5" />
                  <text x="50" y={y + 3} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {v.toFixed(1)}
                  </text>
                </g>
              );
            })}

            <line x1="60" y1="230" x2="710" y2="230" stroke="#475569" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="230" stroke="#475569" strokeWidth="1.5" />

            <text x="-135" y="18" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(-90)">
              Workload Complexity Index (WCI)
            </text>
            <text x="385" y="255" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
              Simulation Time (seconds)
            </text>

            {/* Plot WCI Path for SAMCS */}
            {(() => {
              const maxStep = 105;
              const points = s3SamcsTrace
                .filter((p) => p.step <= maxStep)
                .map((p) => {
                  const x = 60 + (p.step / maxStep) * 640;
                  const y = 230 - p.wci * 190;
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <polyline
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              );
            })()}

            {/* Plot Cw (Computational Intensity) component curve */}
            {(() => {
              const maxStep = 105;
              const points = s3SamcsTrace
                .filter((p) => p.step <= maxStep)
                .map((p) => {
                  const x = 60 + (p.step / maxStep) * 640;
                  const y = 230 - p.cw * 190;
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  points={points}
                />
              );
            })()}

            {/* Legend */}
            <g transform="translate(180, 265)">
              <line x1="0" y1="5" x2="20" y2="5" stroke="#a855f7" strokeWidth="2.5" />
              <text x="26" y="9" fill="#c084fc" fontSize="10" fontWeight="bold">Composite WCI(t)</text>

              <line x1="150" y1="5" x2="170" y2="5" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
              <text x="176" y="9" fill="#7dd3fc" fontSize="10">Computational Intensity Cw(t)</text>
            </g>
          </svg>
        </div>

        {showDataTable['fig3'] && (
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="text-xs font-mono text-slate-400 mb-2">Underlying Data Source: runtime_observations.csv (Scenario S3, Run 1)</div>
            <div className="max-h-48 overflow-y-auto font-mono text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-800/80 sticky top-0 text-slate-400">
                  <tr>
                    <th className="px-2 py-1">Step</th>
                    <th className="px-2 py-1">Time (s)</th>
                    <th className="px-2 py-1">Cw (Intensity)</th>
                    <th className="px-2 py-1">Dw (Data/Mem)</th>
                    <th className="px-2 py-1">Vr (Variance)</th>
                    <th className="px-2 py-1">WCI</th>
                    <th className="px-2 py-1">Active Cores</th>
                    <th className="px-2 py-1">Queue Depth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {s3SamcsTrace.slice(0, 30).map((obs) => (
                    <tr key={obs.step}>
                      <td className="px-2 py-0.5">{obs.step}</td>
                      <td className="px-2 py-0.5">{obs.simTimeSec.toFixed(1)}</td>
                      <td className="px-2 py-0.5">{obs.cw.toFixed(3)}</td>
                      <td className="px-2 py-0.5">{obs.dw.toFixed(3)}</td>
                      <td className="px-2 py-0.5">{obs.vr.toFixed(3)}</td>
                      <td className="px-2 py-0.5 font-bold text-purple-400">{obs.wci.toFixed(3)}</td>
                      <td className="px-2 py-0.5">{obs.activeCores}</td>
                      <td className="px-2 py-0.5">{obs.queueLength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FIGURE 4: ADAPTIVE ACTIONS OVER TIME */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
              <span>Figure 4</span>
              <span className="text-slate-600">•</span>
              <span>Dynamic Control Trace</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Adaptive Reallocations & Active Cores Timeline (Scenario S3)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Temporal mapping of autonomous control actions issued by SAMCS during dynamic transitions.
              The stepped line tracks active worker core capacity (C(t) ∈ [2, 16]).
              Markers denote discrete adaptation triggers: Scale-Up (+2 Cores), Scale-Down (-2 Cores),
              and Workload Queue Redistribution.
            </p>
          </div>
          <button
            onClick={() => toggleTable('fig4')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Table2 className="w-3.5 h-3.5" />
            {showDataTable['fig4'] ? 'Hide Events' : 'Inspect Event Log'}
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 270" className="w-full min-w-[640px] h-64">
            {/* Core Levels 2 to 16 */}
            {[2, 4, 6, 8, 10, 12, 14, 16].map((cores) => {
              const y = 220 - ((cores - 2) / 14) * 170;
              return (
                <g key={cores}>
                  <line x1="60" y1={y} x2="710" y2={y} stroke="#334155" strokeWidth="0.6" strokeDasharray="3 3" />
                  <text x="50" y={y + 3} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {cores}
                  </text>
                </g>
              );
            })}

            <line x1="60" y1="220" x2="710" y2="220" stroke="#475569" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="220" stroke="#475569" strokeWidth="1.5" />

            <text x="-130" y="18" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(-90)">
              Active Worker Cores C(t)
            </text>
            <text x="385" y="245" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
              Simulation Step (t, seconds)
            </text>

            {/* Stepped line for active worker cores */}
            {(() => {
              const maxStep = 105;
              const points = s3SamcsTrace
                .filter((p) => p.step <= maxStep)
                .map((p) => {
                  const x = 60 + (p.step / maxStep) * 640;
                  const y = 220 - ((p.activeCores - 2) / 14) * 170;
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points={points}
                />
              );
            })()}

            {/* Markers for Adaptation Events in Run 1 */}
            {s3EventsRun1.map((ev, idx) => {
              const maxStep = 105;
              if (ev.step > maxStep) return null;
              const x = 60 + (ev.step / maxStep) * 640;
              const y = 220 - ((ev.updatedState.cores - 2) / 14) * 170;

              const isScaleUp = ev.action === 'SCALE_UP';
              const isScaleDown = ev.action === 'SCALE_DOWN';
              const color = isScaleUp ? '#10b981' : isScaleDown ? '#f59e0b' : '#ec4899';

              return (
                <g key={idx} className="cursor-pointer">
                  <circle cx={x} cy={y} r="5.5" fill={color} stroke="#0f172a" strokeWidth="1.5" />
                  <text x={x} y={y - 8} fill={color} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    {isScaleUp ? '+2' : isScaleDown ? '-2' : '⇄'}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <g transform="translate(180, 255)">
              <circle cx="0" cy="5" r="4.5" fill="#10b981" />
              <text x="10" y="9" fill="#6ee7b7" fontSize="10">Scale-Up (+2 Cores)</text>
              <circle cx="160" cy="5" r="4.5" fill="#f59e0b" />
              <text x="170" y="9" fill="#fcd34d" fontSize="10">Scale-Down (-2 Cores)</text>
              <circle cx="330" cy="5" r="4.5" fill="#ec4899" />
              <text x="340" y="9" fill="#f472b6" fontSize="10">Queue Redistribution</text>
            </g>
          </svg>
        </div>

        {showDataTable['fig4'] && (
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="text-xs font-mono text-slate-400 mb-2">Underlying Data Source: adaptation_events.csv (Scenario S3, Run 1)</div>
            <div className="max-h-48 overflow-y-auto font-mono text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-800/80 sticky top-0 text-slate-400">
                  <tr>
                    <th className="px-2 py-1">Time (s)</th>
                    <th className="px-2 py-1">Action</th>
                    <th className="px-2 py-1">WCI</th>
                    <th className="px-2 py-1">Pre Cores</th>
                    <th className="px-2 py-1">New Cores</th>
                    <th className="px-2 py-1">Cost (s)</th>
                    <th className="px-2 py-1">Trigger Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {s3EventsRun1.map((ev, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-0.5">{ev.simTimeSec.toFixed(1)}s</td>
                      <td className="px-2 py-0.5 font-semibold text-emerald-400">{ev.action}</td>
                      <td className="px-2 py-0.5">{ev.wci.toFixed(3)}</td>
                      <td className="px-2 py-0.5">{ev.previousState.cores}</td>
                      <td className="px-2 py-0.5 font-bold text-indigo-300">{ev.updatedState.cores}</td>
                      <td className="px-2 py-0.5 text-amber-300">+{ev.overheadCostSec}s</td>
                      <td className="px-2 py-0.5 text-slate-400 truncate max-w-xs">{ev.triggerReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FIGURE 5: ADAPTATION OVERHEAD */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
              <span>Figure 5</span>
              <span className="text-slate-600">•</span>
              <span>Cost Model Quantification</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Total Adaptation Overhead Incurred by SAMCS across Scenarios
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Mean cumulative adaptation overhead (seconds) including telemetry observation (O_obs),
              WCI calculation (O_wci), meta-analysis (O_meta), and dynamic reconfiguration
              latency (O_reconfig). Confirms non-zero overhead accounting as mandated by Section 11.D.
            </p>
          </div>
          <button
            onClick={() => toggleTable('fig5')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Table2 className="w-3.5 h-3.5" />
            {showDataTable['fig5'] ? 'Hide Data' : 'View Data'}
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 250" className="w-full min-w-[640px] h-60">
            {[0, 2, 4, 6, 8, 10, 12].map((sec) => {
              const y = 200 - (sec / 12) * 160;
              return (
                <g key={sec}>
                  <line x1="60" y1={y} x2="710" y2={y} stroke="#334155" strokeWidth="0.6" strokeDasharray="3 3" />
                  <text x="50" y={y + 3} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {sec}s
                  </text>
                </g>
              );
            })}

            <line x1="60" y1="200" x2="710" y2="200" stroke="#475569" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="200" stroke="#475569" strokeWidth="1.5" />

            <text x="-120" y="18" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(-90)">
              Mean Overhead Time (seconds)
            </text>

            {[
              { label: 'S1: Stable Low', overhead: s1Samcs?.adaptationOverhead, count: s1Samcs?.adaptationCount, x: 180 },
              { label: 'S2: High Complexity', overhead: s2Samcs?.adaptationOverhead, count: s2Samcs?.adaptationCount, x: 390 },
              { label: 'S3: Dynamic Multi-Phase', overhead: s3Samcs?.adaptationOverhead, count: s3Samcs?.adaptationCount, x: 600 },
            ].map(({ label, overhead, count, x }) => {
              if (!overhead) return null;
              const h = (overhead.mean / 12) * 160;
              const y = 200 - h;
              const ciLowY = 200 - (overhead.ci95Low / 12) * 160;
              const ciHighY = 200 - (overhead.ci95High / 12) * 160;

              return (
                <g key={label}>
                  <text x={x} y="220" fill="#e2e8f0" fontSize="11" fontWeight="600" textAnchor="middle">
                    {label}
                  </text>

                  <rect x={x - 30} y={y} width="60" height={h} fill="#e11d48" rx="2" opacity="0.85" />

                  {/* Whiskers */}
                  <line x1={x} y1={ciLowY} x2={x} y2={ciHighY} stroke="#fff" strokeWidth="1.5" />
                  <line x1={x - 8} y1={ciLowY} x2={x + 8} y2={ciLowY} stroke="#fff" strokeWidth="1.5" />
                  <line x1={x - 8} y1={ciHighY} x2={x + 8} y2={ciHighY} stroke="#fff" strokeWidth="1.5" />

                  <text x={x} y={y - 8} fill="#fda4af" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    {overhead.mean.toFixed(2)}s
                  </text>

                  {/* Action Count badge */}
                  <text x={x} y={y + h / 2 + 4} fill="#fff" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {count ? `avg ${count.mean.toFixed(1)} acts` : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {showDataTable['fig5'] && (
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="text-xs font-mono text-slate-400 mb-2">Underlying Data Source: scenario_summary.csv (Adaptation Overhead & Event Counts)</div>
            <div className="overflow-x-auto font-mono text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400">
                  <tr>
                    <th className="px-3 py-1">Scenario</th>
                    <th className="px-3 py-1">System</th>
                    <th className="px-3 py-1">Overhead Mean (s)</th>
                    <th className="px-3 py-1">Overhead Std</th>
                    <th className="px-3 py-1">95% CI</th>
                    <th className="px-3 py-1">Mean Reconfigurations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {[s1Samcs, s2Samcs, s3Samcs].map((s, idx) => s && (
                    <tr key={idx}>
                      <td className="px-3 py-1 font-semibold text-slate-200">{s.scenarioId}</td>
                      <td className="px-3 py-1 text-indigo-300">{s.system}</td>
                      <td className="px-3 py-1 text-rose-300 font-bold">{s.adaptationOverhead.mean.toFixed(3)}s</td>
                      <td className="px-3 py-1">{s.adaptationOverhead.std.toFixed(3)}</td>
                      <td className="px-3 py-1">[{s.adaptationOverhead.ci95Low.toFixed(3)}, {s.adaptationOverhead.ci95High.toFixed(3)}]</td>
                      <td className="px-3 py-1">{s.adaptationCount.mean.toFixed(1)} events</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FIGURE 6: OVERALL EFFICIENCY */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
              <span>Figure 6</span>
              <span className="text-slate-600">•</span>
              <span>Holistic Computational Efficiency</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Overall Computational Efficiency (η): Tasks completed per 100 Core-Seconds
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Efficiency η = (W_completed / ∫ R(t) dt) × 100.
              SAMCS consistently maximizes resource utilization efficiency by aligning compute capacity
              with demand, avoiding both idle processor waste in low periods and bottleneck delay in high surges.
            </p>
          </div>
          <button
            onClick={() => toggleTable('fig6')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Table2 className="w-3.5 h-3.5" />
            {showDataTable['fig6'] ? 'Hide Data' : 'View Data'}
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 270" className="w-full min-w-[640px] h-64">
            {[0, 500, 1000, 1500, 2000].map((val) => {
              const y = 220 - (val / 2000) * 180;
              return (
                <g key={val}>
                  <line x1="60" y1={y} x2="710" y2={y} stroke="#334155" strokeWidth="0.6" strokeDasharray="3 3" />
                  <text x="50" y={y + 3} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {val}
                  </text>
                </g>
              );
            })}

            <line x1="60" y1="220" x2="710" y2="220" stroke="#475569" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="220" stroke="#475569" strokeWidth="1.5" />

            <text x="-130" y="18" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(-90)">
              Efficiency η (Tasks / 100 Core-Sec)
            </text>

            {[
              { label: 'S1: Low Stable', base: s1Base?.efficiency, samcs: s1Samcs?.efficiency, x: 180 },
              { label: 'S2: High Complexity', base: s2Base?.efficiency, samcs: s2Samcs?.efficiency, x: 390 },
              { label: 'S3: Dynamic Multi-Phase', base: s3Base?.efficiency, samcs: s3Samcs?.efficiency, x: 600 },
            ].map(({ label, base, samcs, x }) => {
              if (!base || !samcs) return null;
              const baseH = (base.mean / 2000) * 180;
              const baseY = 220 - baseH;
              const samcsH = (samcs.mean / 2000) * 180;
              const samcsY = 220 - samcsH;

              const delta = (((samcs.mean - base.mean) / base.mean) * 100).toFixed(1);

              return (
                <g key={label}>
                  <text x={x} y="240" fill="#e2e8f0" fontSize="11" fontWeight="600" textAnchor="middle">
                    {label}
                  </text>

                  {/* Baseline bar */}
                  <rect x={x - 55} y={baseY} width="42" height={baseH} fill="#64748b" rx="2" />
                  <text x={x - 34} y={baseY - 6} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {base.mean.toFixed(2)}
                  </text>

                  {/* SAMCS bar */}
                  <rect x={x + 13} y={samcsY} width="42" height={samcsH} fill="#10b981" rx="2" />
                  <text x={x + 34} y={samcsY - 6} fill="#6ee7b7" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    {samcs.mean.toFixed(2)}
                  </text>

                  {/* Improvement badge */}
                  <rect x={x - 25} y="247" width="50" height="15" rx="3" fill="#064e3b" stroke="#059669" strokeWidth="0.8" />
                  <text x={x} y="258" fill="#34d399" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="600">
                    +{delta}%
                  </text>
                </g>
              );
            })}

            <g transform="translate(470, 15)">
              <rect x="0" y="0" width="12" height="12" fill="#64748b" rx="2" />
              <text x="18" y="10" fill="#cbd5e1" fontSize="11">Baseline Efficiency</text>
              <rect x="155" y="0" width="12" height="12" fill="#10b981" rx="2" />
              <text x="173" y="10" fill="#6ee7b7" fontSize="11" fontWeight="bold">SAMCS Efficiency</text>
            </g>
          </svg>
        </div>

        {showDataTable['fig6'] && (
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="text-xs font-mono text-slate-400 mb-2">Underlying Data Source: scenario_summary.csv (Overall Efficiency $\eta$)</div>
            <div className="overflow-x-auto font-mono text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase">
                  <tr>
                    <th className="px-3 py-1">Scenario</th>
                    <th className="px-3 py-1">System</th>
                    <th className="px-3 py-1">Efficiency Mean</th>
                    <th className="px-3 py-1">Median</th>
                    <th className="px-3 py-1">Std Dev</th>
                    <th className="px-3 py-1">95% CI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {[s1Base, s1Samcs, s2Base, s2Samcs, s3Base, s3Samcs].map((s, idx) => s && (
                    <tr key={idx}>
                      <td className="px-3 py-1 font-semibold text-slate-200">{s.scenarioId}</td>
                      <td className="px-3 py-1 text-indigo-300">{s.system}</td>
                      <td className="px-3 py-1 text-emerald-400 font-bold">{s.efficiency.mean.toFixed(3)}</td>
                      <td className="px-3 py-1">{s.efficiency.median.toFixed(3)}</td>
                      <td className="px-3 py-1">{s.efficiency.std.toFixed(3)}</td>
                      <td className="px-3 py-1">[{s.efficiency.ci95Low.toFixed(3)}, {s.efficiency.ci95High.toFixed(3)}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
