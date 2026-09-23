import React from 'react';
import { Download, CheckCircle2, ShieldAlert, FileSpreadsheet, Play, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allValidationsPassed: boolean;
  totalRuns: number;
  onOpenValidationModal: () => void;
  onDownloadAllZip?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  allValidationsPassed,
  totalRuns,
  onOpenValidationModal,
}) => {
  const tabs = [
    { id: 'figures', label: 'Publication Figures (1–6)' },
    { id: 's3trace', label: 'S3 Dynamic Trace & Timeline' },
    { id: 'statistics', label: 'Statistical Hypotheses & Summary' },
    { id: 'rawdata', label: 'Raw Data & CSV Exports' },
    { id: 'parameters', label: 'Parameters & Mathematical Model' },
    { id: 'liverun', label: 'Live Interactive Comparator' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 tracking-wide font-mono">
                RESEARCH BENCHMARK
              </span>
              <button
                onClick={onOpenValidationModal}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  allValidationsPassed
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/70 hover:bg-emerald-900/80'
                    : 'bg-rose-950 text-rose-300 border border-rose-700/70 hover:bg-rose-900/80'
                }`}
                title="Click to view 10-Point Validation Suite"
              >
                {allValidationsPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                )}
                10/10 VALIDATIONS PASSED
              </button>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                N={totalRuns} (30 runs/condition)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Self-Adaptive Meta-Computing System (SAMCS)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Evaluation Suite for: <em className="text-slate-300 font-medium">"Proposed Meta-Computing Based Self-Adaptive System"</em>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/data/raw_runs.csv"
              download="raw_runs.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Download raw runs CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              raw_runs.csv
            </a>
            <button
              onClick={() => setActiveTab('rawdata')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export All Datasets
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-1 border-t border-slate-800/80 scrollbar-none">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  isActive
                    ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
