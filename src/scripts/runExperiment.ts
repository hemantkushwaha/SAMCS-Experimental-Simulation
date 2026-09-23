import * as fs from 'fs';
import * as path from 'path';
import { runFullExperiment } from '../simulation/runner';
import { runValidationChecks } from '../simulation/validation';
import {
  exportRawRunsCsv,
  exportRuntimeObservationsCsv,
  exportAdaptationEventsCsv,
  exportScenarioSummaryCsv,
  exportStatisticalAnalysisCsv,
} from '../simulation/csvExporter';

async function main() {
  console.log('===============================================================');
  console.log('STARTING EXPERIMENTAL BENCHMARK EXECUTION');
  console.log('Title: "Proposed Meta-Computing Based Self-Adaptive System"');
  console.log('Systems: Baseline vs SAMCS');
  console.log('===============================================================');

  const experiment = runFullExperiment();

  console.log(`Executed ${experiment.rawRuns.length} total runs across S1, S2, S3.`);
  console.log(`Recorded ${experiment.runtimeObservations.length} detailed observations.`);
  console.log(`Recorded ${experiment.adaptationEvents.length} adaptive decision events.`);

  // Validation Checks
  console.log('\n--- EXECUTING SECTION 15 VALIDATION SUITE ---');
  const validation = runValidationChecks(experiment);

  for (const check of validation.results) {
    console.log(`[Check ${check.id}] ${check.passed ? 'PASSED' : 'FAILED'}: ${check.name}`);
    console.log(`         ${check.message}`);
  }

  if (!validation.allPassed) {
    console.error('\nCRITICAL: One or more validation checks failed. Aborting CSV generation.');
    process.exit(1);
  }
  console.log('\nALL 10 VALIDATION CHECKS PASSED WITH 100% COMPLIANCE.');

  // Ensure output directory exists
  const publicDataDir = path.resolve(process.cwd(), 'public', 'data');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  // Export CSVs
  const rawRunsCsv = exportRawRunsCsv(experiment);
  const runtimeObsCsv = exportRuntimeObservationsCsv(experiment);
  const adaptationEventsCsv = exportAdaptationEventsCsv(experiment);
  const scenarioSummaryCsv = exportScenarioSummaryCsv(experiment);
  const statisticalAnalysisCsv = exportStatisticalAnalysisCsv(experiment);

  fs.writeFileSync(path.join(publicDataDir, 'raw_runs.csv'), rawRunsCsv, 'utf-8');
  fs.writeFileSync(path.join(publicDataDir, 'runtime_observations.csv'), runtimeObsCsv, 'utf-8');
  fs.writeFileSync(path.join(publicDataDir, 'adaptation_events.csv'), adaptationEventsCsv, 'utf-8');
  fs.writeFileSync(path.join(publicDataDir, 'scenario_summary.csv'), scenarioSummaryCsv, 'utf-8');
  fs.writeFileSync(path.join(publicDataDir, 'statistical_analysis.csv'), statisticalAnalysisCsv, 'utf-8');

  // Also save a JSON snapshot of the full experiment for instant client bootstrapping
  fs.writeFileSync(
    path.join(publicDataDir, 'experiment_results.json'),
    JSON.stringify(experiment, null, 2),
    'utf-8'
  );

  console.log('\n--- EXPORTED ARTIFACTS ---');
  console.log(`1. ${path.join(publicDataDir, 'raw_runs.csv')} (${(rawRunsCsv.length / 1024).toFixed(1)} KB)`);
  console.log(`2. ${path.join(publicDataDir, 'runtime_observations.csv')} (${(runtimeObsCsv.length / 1024).toFixed(1)} KB)`);
  console.log(`3. ${path.join(publicDataDir, 'adaptation_events.csv')} (${(adaptationEventsCsv.length / 1024).toFixed(1)} KB)`);
  console.log(`4. ${path.join(publicDataDir, 'scenario_summary.csv')} (${(scenarioSummaryCsv.length / 1024).toFixed(1)} KB)`);
  console.log(`5. ${path.join(publicDataDir, 'statistical_analysis.csv')} (${(statisticalAnalysisCsv.length / 1024).toFixed(1)} KB)`);
  console.log(`6. ${path.join(publicDataDir, 'experiment_results.json')} (${(JSON.stringify(experiment).length / 1024).toFixed(1)} KB)`);

  console.log('\nSIMULATION EXECUTION AND ARTIFACT GENERATION COMPLETE.');
}

main().catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
