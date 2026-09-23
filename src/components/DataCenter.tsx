import React, { useState } from 'react';
import { FullExperimentOutput } from '../simulation/runner';
import { Download, Search, FileSpreadsheet, Filter, CheckCircle2 } from 'lucide-react';
import {
  exportRawRunsCsv,
  exportRuntimeObservationsCsv,
  exportAdaptationEventsCsv,
  exportScenarioSummaryCsv,
  exportStatisticalAnalysisCsv,
} from '../simulation/csvExporter';

interface DataCenterProps {
  data: FullExperimentOutput;
}

export const DataCenter: React.FC<DataCenterProps> = ({ data }) => {
  const [activeDataset, setActiveDataset] = useState<
    'raw_runs' | 'runtime_obs' | 'adaptation_events' | 'scenario_summary' | 'statistical_analysis'
  >('raw_runs');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScenario, setFilterScenario] = useState<string>('ALL');
  const [filterSystem, setFilterSystem] = useState<string>('ALL');

  // Direct download handler (uses generated CSV string or served static file)
  const handleDownloadCsv = (name: string, csvString: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const csvPayloads = {
    raw_runs: { name: 'raw_runs.csv', data: exportRawRunsCsv(data) },
    runtime_obs: { name: 'runtime_observations.csv', data: exportRuntimeObservationsCsv(data) },
    adaptation_events: { name: 'adaptation_events.csv', data: exportAdaptationEventsCsv(data) },
    scenario_summary: { name: 'scenario_summary.csv', data: exportScenarioSummaryCsv(data) },
    statistical_analysis: { name: 'statistical_analysis.csv', data: exportStatisticalAnalysisCsv(data) },
  };

  return (
    <div className="space-y-6 py-4">
      {/* File Export Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { id: 'raw_runs', title: 'raw_runs.csv', count: `${data.rawRuns.length} rows`, desc: 'Individual trial results & seeds' },
          { id: 'runtime_obs', title: 'runtime_observations.csv', count: `${data.runtimeObservations.length} samples`, desc: 'Time-series telemetry & WCI' },
          { id: 'adaptation_events', title: 'adaptation_events.csv', count: `${data.adaptationEvents.length} events`, desc: 'Adaptive decisions & costs' },
          { id: 'scenario_summary', title: 'scenario_summary.csv', count: `${data.scenarioSummaries.length * 6} records`, desc: 'Summary metrics & 95% CIs' },
          { id: 'statistical_analysis', title: 'statistical_analysis.csv', count: `${data.hypothesisTests.length} tests`, desc: 't-tests, p-values, Cohen d' },
        ].map((card) => {
          const isSelected = activeDataset === card.id;
          return (
            <div
              key={card.id}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => setActiveDataset(card.id as any)}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-300">{card.title}</span>
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-[11px] text-slate-400 mb-2">{card.desc}</div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">{card.count}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = csvPayloads[card.id as keyof typeof csvPayloads];
                    handleDownloadCsv(p.name, p.data);
                  }}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white transition"
                  title="Download CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dataset Browser Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              Dataset Inspector: {csvPayloads[activeDataset].name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified deterministic data generated by the computational simulation engine.
            </p>
          </div>
          <button
            onClick={() => {
              const p = csvPayloads[activeDataset];
              handleDownloadCsv(p.name, p.data);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow transition shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download Current Table ({csvPayloads[activeDataset].name})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 my-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search table values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Scenario:</span>
            <select
              value={filterScenario}
              onChange={(e) => setFilterScenario(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
            >
              <option value="ALL">All Scenarios</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
            </select>

            <span className="text-slate-400 ml-2">System:</span>
            <select
              value={filterSystem}
              onChange={(e) => setFilterSystem(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
            >
              <option value="ALL">All Systems</option>
              <option value="BASELINE">BASELINE</option>
              <option value="SAMCS">SAMCS</option>
            </select>
          </div>
        </div>

        {/* Table Renderers */}
        <div className="overflow-x-auto max-h-[500px]">
          {activeDataset === 'raw_runs' && (
            <table className="w-full text-xs text-left text-slate-300 font-mono">
              <thead className="bg-slate-800 sticky top-0 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-2.5 py-2">Scenario</th>
                  <th className="px-2.5 py-2">System</th>
                  <th className="px-2.5 py-2">Run ID</th>
                  <th className="px-2.5 py-2 text-amber-300">Random Seed</th>
                  <th className="px-2.5 py-2">T_exec (s)</th>
                  <th className="px-2.5 py-2">Tasks Done</th>
                  <th className="px-2.5 py-2">CPU Mean</th>
                  <th className="px-2.5 py-2">Mem Mean</th>
                  <th className="px-2.5 py-2">Efficiency</th>
                  <th className="px-2.5 py-2">Overhead (s)</th>
                  <th className="px-2.5 py-2">Actions Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.rawRuns
                  .filter(
                    (r) =>
                      (filterScenario === 'ALL' || r.scenarioId === filterScenario) &&
                      (filterSystem === 'ALL' || r.system === filterSystem) &&
                      (searchTerm === '' ||
                        r.seed.toString().includes(searchTerm) ||
                        r.runId.toString().includes(searchTerm))
                  )
                  .map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="px-2.5 py-1.5 font-bold text-slate-200">{r.scenarioId}</td>
                      <td className="px-2.5 py-1.5 text-indigo-300">{r.system}</td>
                      <td className="px-2.5 py-1.5">{r.runId}</td>
                      <td className="px-2.5 py-1.5 text-amber-300 font-semibold">{r.seed}</td>
                      <td className="px-2.5 py-1.5 font-bold text-white">{r.tExecution.toFixed(2)}</td>
                      <td className="px-2.5 py-1.5">{r.tasksCompleted}</td>
                      <td className="px-2.5 py-1.5">{r.cpuMean.toFixed(1)}%</td>
                      <td className="px-2.5 py-1.5">{r.memMean.toFixed(1)}%</td>
                      <td className="px-2.5 py-1.5 text-emerald-400">{r.efficiency.toFixed(3)}</td>
                      <td className="px-2.5 py-1.5 text-rose-300">{r.totalAdaptationOverheadSec.toFixed(2)}</td>
                      <td className="px-2.5 py-1.5">{r.adaptationEventsCount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeDataset === 'adaptation_events' && (
            <table className="w-full text-xs text-left text-slate-300 font-mono">
              <thead className="bg-slate-800 sticky top-0 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-2 py-2">Step</th>
                  <th className="px-2 py-2">Time</th>
                  <th className="px-2 py-2">Scenario</th>
                  <th className="px-2 py-2">Run</th>
                  <th className="px-2 py-2">Action</th>
                  <th className="px-2 py-2">WCI</th>
                  <th className="px-2 py-2">Cores (Pre → Post)</th>
                  <th className="px-2 py-2">Overhead Cost</th>
                  <th className="px-2 py-2">Trigger Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.adaptationEvents
                  .filter(
                    (e) =>
                      (filterScenario === 'ALL' || e.scenarioId === filterScenario) &&
                      (searchTerm === '' ||
                        e.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.triggerReason.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((e, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="px-2 py-1.5">{e.step}</td>
                      <td className="px-2 py-1.5">{e.simTimeSec.toFixed(1)}s</td>
                      <td className="px-2 py-1.5 font-bold text-slate-200">{e.scenarioId}</td>
                      <td className="px-2 py-1.5">{e.runId}</td>
                      <td className="px-2 py-1.5 font-bold text-emerald-400">{e.action}</td>
                      <td className="px-2 py-1.5 text-purple-300">{e.wci.toFixed(3)}</td>
                      <td className="px-2 py-1.5 text-indigo-300">
                        {e.previousState.cores} → {e.updatedState.cores}
                      </td>
                      <td className="px-2 py-1.5 text-amber-300">+{e.overheadCostSec}s</td>
                      <td className="px-2 py-1.5 text-slate-400 truncate max-w-sm">{e.triggerReason}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeDataset === 'runtime_obs' && (
            <table className="w-full text-xs text-left text-slate-300 font-mono">
              <thead className="bg-slate-800 sticky top-0 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-2 py-2">Step</th>
                  <th className="px-2 py-2">Time</th>
                  <th className="px-2 py-2">Scen</th>
                  <th className="px-2 py-2">Sys</th>
                  <th className="px-2 py-2">Run</th>
                  <th className="px-2 py-2">Arrival</th>
                  <th className="px-2 py-2">Cw</th>
                  <th className="px-2 py-2">Dw</th>
                  <th className="px-2 py-2">Vr</th>
                  <th className="px-2 py-2 text-purple-400">WCI</th>
                  <th className="px-2 py-2">Cores</th>
                  <th className="px-2 py-2">CPU %</th>
                  <th className="px-2 py-2">Queue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.runtimeObservations
                  .filter(
                    (obs) =>
                      (filterScenario === 'ALL' || obs.scenarioId === filterScenario) &&
                      (filterSystem === 'ALL' || obs.system === filterSystem)
                  )
                  .slice(0, 100)
                  .map((obs, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="px-2 py-1">{obs.step}</td>
                      <td className="px-2 py-1">{obs.simTimeSec.toFixed(1)}</td>
                      <td className="px-2 py-1">{obs.scenarioId}</td>
                      <td className="px-2 py-1 text-indigo-300">{obs.system}</td>
                      <td className="px-2 py-1">{obs.runId}</td>
                      <td className="px-2 py-1">{obs.arrivalRate}</td>
                      <td className="px-2 py-1">{obs.cw.toFixed(2)}</td>
                      <td className="px-2 py-1">{obs.dw.toFixed(2)}</td>
                      <td className="px-2 py-1">{obs.vr.toFixed(2)}</td>
                      <td className="px-2 py-1 text-purple-300 font-bold">{obs.wci.toFixed(3)}</td>
                      <td className="px-2 py-1">{obs.activeCores}</td>
                      <td className="px-2 py-1">{obs.cpuUtilization.toFixed(1)}%</td>
                      <td className="px-2 py-1">{obs.queueLength}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeDataset === 'scenario_summary' && (
            <div className="p-2">
              <pre className="text-[11px] font-mono bg-slate-950 p-4 rounded text-slate-300 overflow-x-auto">
                {csvPayloads.scenario_summary.data}
              </pre>
            </div>
          )}

          {activeDataset === 'statistical_analysis' && (
            <div className="p-2">
              <pre className="text-[11px] font-mono bg-slate-950 p-4 rounded text-slate-300 overflow-x-auto">
                {csvPayloads.statistical_analysis.data}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
