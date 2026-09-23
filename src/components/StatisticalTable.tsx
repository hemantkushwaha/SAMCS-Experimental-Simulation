import React, { useState } from 'react';
import { FullExperimentOutput } from '../simulation/runner';
import { CheckCircle2, HelpCircle, FileText } from 'lucide-react';

interface StatisticalTableProps {
  data: FullExperimentOutput;
}

export const StatisticalTable: React.FC<StatisticalTableProps> = ({ data }) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('ALL');

  const filteredSummaries =
    selectedScenario === 'ALL'
      ? data.scenarioSummaries
      : data.scenarioSummaries.filter((s) => s.scenarioId === selectedScenario);

  const filteredTests =
    selectedScenario === 'ALL'
      ? data.hypothesisTests
      : data.hypothesisTests.filter((t) => t.scenarioId === selectedScenario);

  return (
    <div className="space-y-8 py-4">
      {/* Scenario Filter Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="text-xs text-slate-300 font-medium">
          Filter by Experimental Scenario:
        </div>
        <div className="flex gap-1.5">
          {['ALL', 'S1', 'S2', 'S3'].map((scen) => (
            <button
              key={scen}
              onClick={() => setSelectedScenario(scen)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                selectedScenario === scen
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {scen === 'ALL' ? 'All Scenarios' : `Scenario ${scen}`}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Inferential Hypothesis Testing Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Inferential Hypothesis Testing (Baseline vs. SAMCS)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Two-tailed Paired Student's t-test across 30 identical-seed paired runs per scenario ($df = 29$, $\alpha = 0.05$).
            </p>
          </div>
          <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-800/40">
            Source: statistical_analysis.csv
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 font-mono">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="px-3 py-2">Scenario</th>
                <th className="px-3 py-2">Metric</th>
                <th className="px-3 py-2">Baseline Mean</th>
                <th className="px-3 py-2">SAMCS Mean</th>
                <th className="px-3 py-2">Relative Δ (%)</th>
                <th className="px-3 py-2">Test Statistic (t)</th>
                <th className="px-3 py-2">df</th>
                <th className="px-3 py-2">p-value</th>
                <th className="px-3 py-2">Effect Size (Cohen's d)</th>
                <th className="px-3 py-2">Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTests.map((test, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-900/40' : ''}>
                  <td className="px-3 py-2 font-bold text-indigo-300">{test.scenarioId}</td>
                  <td className="px-3 py-2 text-slate-200">{test.metric}</td>
                  <td className="px-3 py-2 text-slate-400">{test.baselineMean.toFixed(2)}</td>
                  <td className="px-3 py-2 font-bold text-white">{test.samcsMean.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        test.percentImprovement > 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      }`}
                    >
                      {test.percentImprovement > 0 ? `+${test.percentImprovement}%` : `${test.percentImprovement}%`}
                    </span>
                  </td>
                  <td className="px-3 py-2">{test.testStatistic.toFixed(3)}</td>
                  <td className="px-3 py-2">{test.degreesOfFreedom}</td>
                  <td className="px-3 py-2 font-bold text-emerald-400">
                    {test.pValue < 0.0001 ? '< 0.0001' : test.pValue.toFixed(6)}
                  </td>
                  <td className="px-3 py-2">
                    {test.cohensD.toFixed(3)}{' '}
                    <span className="text-slate-500 text-[10px]">
                      {test.cohensD >= 0.8 ? '(Large)' : test.cohensD >= 0.5 ? '(Medium)' : '(Small)'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {test.isSignificant ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Significant (p &lt; 0.05)
                      </span>
                    ) : (
                      <span className="text-slate-500">Not Significant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Comprehensive Descriptive Summary Statistics Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Complete Descriptive Summary Statistics ($N=30$ runs per condition)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical distribution parameters derived directly from raw observations.
            </p>
          </div>
          <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-800/40">
            Source: scenario_summary.csv
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 font-mono">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="px-3 py-2">Scenario</th>
                <th className="px-3 py-2">System</th>
                <th className="px-3 py-2">Evaluated Metric</th>
                <th className="px-3 py-2">Mean</th>
                <th className="px-3 py-2">Median</th>
                <th className="px-3 py-2">Std Dev</th>
                <th className="px-3 py-2">Min – Max</th>
                <th className="px-3 py-2">95% Conf Interval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSummaries.flatMap((summary, sIdx) => {
                const metrics = [
                  { name: 'Execution Time (s)', val: summary.executionTime },
                  { name: 'CPU Utilization (%)', val: summary.cpuUtilization },
                  { name: 'Memory Utilization (%)', val: summary.memoryUtilization },
                  { name: 'Efficiency (Tasks/Core-Sec)', val: summary.efficiency },
                  { name: 'Adaptation Overhead (s)', val: summary.adaptationOverhead },
                  { name: 'Adaptation Actions Count', val: summary.adaptationCount },
                ];

                return metrics.map((m, mIdx) => (
                  <tr
                    key={`${sIdx}-${mIdx}`}
                    className={summary.system === 'SAMCS' ? 'bg-indigo-950/20' : 'bg-slate-950/20'}
                  >
                    <td className="px-3 py-1.5 font-bold text-slate-200">{summary.scenarioId}</td>
                    <td className="px-3 py-1.5 text-indigo-300 font-semibold">{summary.system}</td>
                    <td className="px-3 py-1.5 text-slate-300">{m.name}</td>
                    <td className="px-3 py-1.5 font-bold text-white">{m.val.mean.toFixed(2)}</td>
                    <td className="px-3 py-1.5">{m.val.median.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-slate-400">{m.val.std.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-slate-400">{m.val.min.toFixed(1)} – {m.val.max.toFixed(1)}</td>
                    <td className="px-3 py-1.5 text-indigo-300">
                      [{m.val.ci95Low.toFixed(2)}, {m.val.ci95High.toFixed(2)}]
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
