import React from 'react';
import { ValidationCheckResult } from '../simulation/types';
import { CheckCircle2, XCircle, ShieldCheck, X } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validations: ValidationCheckResult[];
  onRerunValidations: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  validations,
  onRerunValidations,
}) => {
  if (!isOpen) return null;

  const allPassed = validations.every((v) => v.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Section 15: 10-Point Automated Validation Suite
              </h3>
              <p className="text-xs text-slate-400">
                Independent integrity checks enforcing experimental validity and reproducibility.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Status Banner */}
        <div className={`p-3 text-xs font-mono flex items-center justify-between ${
          allPassed ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-900/60' : 'bg-rose-950/80 text-rose-300 border-b border-rose-900/60'
        }`}>
          <div className="flex items-center gap-2">
            {allPassed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span className="font-bold">
              {allPassed
                ? 'ALL 10 VERIFICATION CRITERIA PASSED'
                : 'ONE OR MORE VALIDATIONS FAILED'}
            </span>
          </div>
          <button
            onClick={onRerunValidations}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans text-[11px] font-medium transition cursor-pointer"
          >
            Re-verify
          </button>
        </div>

        {/* Validation Check List */}
        <div className="p-4 space-y-2.5 overflow-y-auto font-mono text-xs flex-1">
          {validations.map((check) => (
            <div
              key={check.id}
              className={`p-3 rounded-lg border transition ${
                check.passed
                  ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/30 border-rose-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">
                    {check.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </span>
                  <div>
                    <span className="font-bold text-slate-200">
                      Check {check.id}: {check.name}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed font-sans">
                      {check.message}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    check.passed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                  }`}
                >
                  {check.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
