import { FullExperimentOutput } from './runner';

/**
 * SECTION 12: CSV DATA EXPORTERS
 * Produces valid, standard RFC 4180 CSV strings for all 5 required experimental datasets.
 */

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportRawRunsCsv(experiment: FullExperimentOutput): string {
  const headers = [
    'scenario_id',
    'system_type',
    'run_id',
    'random_seed',
    't_start_sec',
    't_end_sec',
    't_execution_sec',
    'tasks_completed',
    'cpu_mean_pct',
    'cpu_min_pct',
    'cpu_max_pct',
    'cpu_std_pct',
    'mem_mean_pct',
    'mem_min_pct',
    'mem_max_pct',
    'mem_std_pct',
    'total_core_seconds',
    'efficiency_tasks_per_core_sec',
    'adaptation_overhead_sec',
    'adaptation_events_count',
    's3_detection_delay_sec',
    's3_adaptation_initiation_sec',
    's3_stabilization_time_sec',
    'param_alpha',
    'param_beta',
    'param_gamma',
    'param_initial_cores',
  ];

  const rows = experiment.rawRuns.map((r) => [
    r.scenarioId,
    r.system,
    r.runId,
    r.seed,
    r.tStart,
    r.tEnd,
    r.tExecution,
    r.tasksCompleted,
    r.cpuMean,
    r.cpuMin,
    r.cpuMax,
    r.cpuStd,
    r.memMean,
    r.memMin,
    r.memMax,
    r.memStd,
    r.totalCoreSeconds,
    r.efficiency,
    r.totalAdaptationOverheadSec,
    r.adaptationEventsCount,
    r.detectionDelaySec ?? '',
    r.adaptationInitiationSec ?? '',
    r.stabilizationTimeSec ?? '',
    experiment.parameters.alpha,
    experiment.parameters.beta,
    experiment.parameters.gamma,
    experiment.parameters.initialCores,
  ]);

  return [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');
}

export function exportRuntimeObservationsCsv(
  experiment: FullExperimentOutput
): string {
  const headers = [
    'step',
    'sim_time_sec',
    'scenario_id',
    'system_type',
    'run_id',
    'random_seed',
    'arrival_rate',
    'queue_length',
    'completed_tasks',
    'active_cores',
    'batch_size',
    'cw_computational_intensity',
    'dw_data_volume_intensity',
    'vr_utilization_variability',
    'wci_index',
    'cpu_utilization_pct',
    'memory_utilization_pct',
    'throughput_tasks_sec',
    'step_overhead_sec',
    'cumulative_overhead_sec',
  ];

  const rows = experiment.runtimeObservations.map((obs) => [
    obs.step,
    obs.simTimeSec,
    obs.scenarioId,
    obs.system,
    obs.runId,
    obs.seed,
    obs.arrivalRate,
    obs.queueLength,
    obs.completedTasks,
    obs.activeCores,
    obs.batchSize,
    obs.cw,
    obs.dw,
    obs.vr,
    obs.wci,
    obs.cpuUtilization,
    obs.memoryUtilization,
    obs.throughput,
    obs.stepOverheadSec,
    obs.cumulativeOverheadSec,
  ]);

  return [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');
}

export function exportAdaptationEventsCsv(
  experiment: FullExperimentOutput
): string {
  const headers = [
    'step',
    'sim_time_sec',
    'scenario_id',
    'run_id',
    'random_seed',
    'wci',
    'workload_intensity_cw',
    'resource_allocation_cores',
    'decision',
    'action',
    'prev_cores',
    'prev_batch_size',
    'prev_cpu_util',
    'prev_vr',
    'updated_cores',
    'updated_batch_size',
    'overhead_cost_sec',
    'trigger_reason',
  ];

  const rows = experiment.adaptationEvents.map((ev) => [
    ev.step,
    ev.simTimeSec,
    ev.scenarioId,
    ev.runId,
    ev.seed,
    ev.wci,
    ev.currentWorkloadIntensity,
    ev.currentResourceAllocation,
    ev.decision,
    ev.action,
    ev.previousState.cores,
    ev.previousState.batchSize,
    ev.previousState.cpuUtil,
    ev.previousState.vr,
    ev.updatedState.cores,
    ev.updatedState.batchSize,
    ev.overheadCostSec,
    ev.triggerReason,
  ]);

  return [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');
}

export function exportScenarioSummaryCsv(
  experiment: FullExperimentOutput
): string {
  const headers = [
    'scenario_id',
    'system_type',
    'sample_size',
    'metric_name',
    'mean',
    'median',
    'std_dev',
    'min',
    'max',
    'ci_95_low',
    'ci_95_high',
  ];

  const rows: any[][] = [];

  for (const s of experiment.scenarioSummaries) {
    const metrics: [string, typeof s.executionTime][] = [
      ['Execution Time (s)', s.executionTime],
      ['CPU Utilization (%)', s.cpuUtilization],
      ['Memory Utilization (%)', s.memoryUtilization],
      ['Efficiency (Tasks/Core-Sec)', s.efficiency],
      ['Adaptation Overhead (s)', s.adaptationOverhead],
      ['Adaptation Events Count', s.adaptationCount],
    ];

    for (const [mName, mVal] of metrics) {
      rows.push([
        s.scenarioId,
        s.system,
        s.sampleSize,
        mName,
        mVal.mean,
        mVal.median,
        mVal.std,
        mVal.min,
        mVal.max,
        mVal.ci95Low,
        mVal.ci95High,
      ]);
    }
  }

  return [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');
}

export function exportStatisticalAnalysisCsv(
  experiment: FullExperimentOutput
): string {
  const headers = [
    'scenario_id',
    'metric_name',
    'baseline_mean',
    'samcs_mean',
    'percent_delta',
    'test_type',
    'test_statistic_t',
    'degrees_of_freedom',
    'p_value',
    'cohens_d_effect_size',
    'statistically_significant_at_alpha_0_05',
  ];

  const rows = experiment.hypothesisTests.map((t) => [
    t.scenarioId,
    t.metric,
    t.baselineMean,
    t.samcsMean,
    t.percentImprovement,
    t.testName,
    t.testStatistic,
    t.degreesOfFreedom,
    t.pValue,
    t.cohensD,
    t.isSignificant ? 'TRUE' : 'FALSE',
  ]);

  return [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');
}
