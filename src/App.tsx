import React, { useState, useMemo, useEffect } from 'react';
import { runFullExperiment, FullExperimentOutput } from './simulation/runner';
import { runValidationChecks } from './simulation/validation';
import { Header } from './components/Header';
import { FiguresView } from './components/FiguresView';
import { DynamicTraceView } from './components/DynamicTraceView';
import { StatisticalTable } from './components/StatisticalTable';
import { DataCenter } from './components/DataCenter';
import { ParametersView } from './components/ParametersView';
import { LiveSimRunner } from './components/LiveSimRunner';
import { ValidationModal } from './components/ValidationModal';
import { ShieldCheck, BookOpen, AlertCircle, FileSpreadsheet, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('figures');
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);

  // Run or load deterministic experimental benchmark
  const experimentData: FullExperimentOutput = useMemo(() => {
    return runFullExperiment();
  }, []);

  // Run Section 15 validation suite
  const [validationState, setValidationState] = useState(() =>
    runValidationChecks(experimentData)
  );

  const handleRerunValidations = () => {
    const updated = runValidationChecks(experimentData);
    setValidationState(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allValidationsPassed={validationState.allPassed}
        totalRuns={experimentData.rawRuns.length}
        onOpenValidationModal={() => setIsValidationModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Research Integrity Notification Pill */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>
              <strong>Research Integrity Rule Enforced:</strong> 180 runs algorithmically generated with deterministic PRNG (Seed 1001–1030). Zero fabricated or manually entered values.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsValidationModalOpen(true)}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline"
            >
              Inspect 10 Validation Checks
            </button>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'figures' && <FiguresView data={experimentData} />}
        {activeTab === 's3trace' && <DynamicTraceView data={experimentData} />}
        {activeTab === 'statistics' && <StatisticalTable data={experimentData} />}
        {activeTab === 'rawdata' && <DataCenter data={experimentData} />}
        {activeTab === 'parameters' && <ParametersView data={experimentData} />}
        {activeTab === 'liverun' && <LiveSimRunner />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-400">
              "Proposed Meta-Computing Based Self-Adaptive System"
            </span>{' '}
            — Computational Simulation Benchmark Engine
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Mulberry32 PRNG</span>
            <span>•</span>
            <span>N=180 Trials</span>
            <span>•</span>
            <span>RFC 4180 CSV Compliant</span>
          </div>
        </div>
      </footer>

      {/* 10-Point Validation Modal */}
      <ValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        validations={validationState.results}
        onRerunValidations={handleRerunValidations}
      />
    </div>
  );
}
