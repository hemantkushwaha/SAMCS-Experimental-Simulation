import { DEFAULT_SIMULATION_PARAMETERS, SCENARIO_DEFINITIONS } from './config';
import { SimulationEngine } from './engine';
import { calculateSummary, performPairedTTest } from './statistics';
import {
  AdaptationEvent,
  HypothesisTestResult,
  RunResult,
  RuntimeObservation,
  ScenarioId,
  ScenarioSystemSummary,
  SimulationParameters,
  SystemType,
} from './types';

export interface FullExperimentOutput {
  parameters: SimulationParameters;
  rawRuns: RunResult[];
  runtimeObservations: RuntimeObservation[];
  adaptationEvents: AdaptationEvent[];
  scenarioSummaries: ScenarioSystemSummary[];
  hypothesisTests: HypothesisTestResult[];
  s3DynamicMetrics: {
    meanDetectionDelaySec: number;
    meanAdaptationInitiationSec: number;
    meanStabilizationTimeSec: number;
    totalAdaptationsInS3: number;
  };
}

/**
 * Executes the full benchmark experiment suite.
 * Generates 100% reproducible results from the deterministic engine.
 */
export function runFullExperiment(
  customParams?: Partial<SimulationParameters>
): FullExperimentOutput {
  const params: SimulationParameters = {
    ...DEFAULT_SIMULATION_PARAMETERS,
    ...customParams,
  };

  const engine = new SimulationEngine(params);
  const rawRuns: RunResult[] = [];
  const runtimeObservations: RuntimeObservation[] = [];
  const adaptationEvents: AdaptationEvent[] = [];

  const scenarios: ScenarioId[] = ['S1', 'S2', 'S3'];
  const systems: SystemType[] = ['BASELINE', 'SAMCS'];

  // Execute 30 independent runs for each condition
  for (const scenId of scenarios) {
    const scenarioDef = SCENARIO_DEFINITIONS[scenId];

    for (let runId = 1; runId <= params.runsPerScenario; runId++) {
      // Deterministic seed: paired Baseline & SAMCS receive IDENTICAL seed
      const seed = params.baseRandomSeed + runId;

      for (const sys of systems) {
        const output = engine.executeRun(scenarioDef, sys, runId, seed);
        rawRuns.push(output.runResult);

        // Preserve all adaptation events
        adaptationEvents.push(...output.adaptationEvents);

        // For runtime time-series observations:
        // Always preserve all observations for run 1 (reference trace) for each scenario/system,
        // plus keep sampled observations to maintain deep trace records
        if (runId <= 3) {
          runtimeObservations.push(...output.observations);
        }
      }
    }
  }

  // Compute Scenario Summaries
  const scenarioSummaries: ScenarioSystemSummary[] = [];

  for (const scenId of scenarios) {
    for (const sys of systems) {
      const conditionRuns = rawRuns.filter(
        (r) => r.scenarioId === scenId && r.system === sys
      );

      scenarioSummaries.push({
        scenarioId: scenId,
        system: sys,
        sampleSize: conditionRuns.length,
        executionTime: calculateSummary(conditionRuns.map((r) => r.tExecution)),
        cpuUtilization: calculateSummary(conditionRuns.map((r) => r.cpuMean)),
        memoryUtilization: calculateSummary(conditionRuns.map((r) => r.memMean)),
        efficiency: calculateSummary(conditionRuns.map((r) => r.efficiency)),
        adaptationOverhead: calculateSummary(
          conditionRuns.map((r) => r.totalAdaptationOverheadSec)
        ),
        adaptationCount: calculateSummary(
          conditionRuns.map((r) => r.adaptationEventsCount)
        ),
      });
    }
  }

  // Statistical Hypothesis Tests (Paired Student's t-test + Cohen's d)
  const hypothesisTests: HypothesisTestResult[] = [];

  for (const scenId of scenarios) {
    const baselineRuns = rawRuns.filter(
      (r) => r.scenarioId === scenId && r.system === 'BASELINE'
    );
    const samcsRuns = rawRuns.filter(
      (r) => r.scenarioId === scenId && r.system === 'SAMCS'
    );

    // 1. Execution Time (lower is better)
    hypothesisTests.push(
      performPairedTTest(
        baselineRuns.map((r) => r.tExecution),
        samcsRuns.map((r) => r.tExecution),
        scenId,
        'Execution Time (s)',
        false
      )
    );

    // 2. Efficiency (higher is better)
    hypothesisTests.push(
      performPairedTTest(
        baselineRuns.map((r) => r.efficiency),
        samcsRuns.map((r) => r.efficiency),
        scenId,
        'Computational Efficiency (Tasks / Core-Sec)',
        true
      )
    );

    // 3. CPU Utilization
    hypothesisTests.push(
      performPairedTTest(
        baselineRuns.map((r) => r.cpuMean),
        samcsRuns.map((r) => r.cpuMean),
        scenId,
        'Mean CPU Utilization (%)',
        false
      )
    );
  }

  // Dynamic Workload (S3) Specific Metrics
  const s3SamcsRuns = rawRuns.filter(
    (r) => r.scenarioId === 'S3' && r.system === 'SAMCS'
  );

  const detectionDelays = s3SamcsRuns
    .map((r) => r.detectionDelaySec)
    .filter((d): d is number => d !== undefined);
  const initiationDelays = s3SamcsRuns
    .map((r) => r.adaptationInitiationSec)
    .filter((d): d is number => d !== undefined);
  const stabilizationTimes = s3SamcsRuns
    .map((r) => r.stabilizationTimeSec)
    .filter((d): d is number => d !== undefined);

  const meanDetectionDelaySec =
    detectionDelays.length > 0
      ? Number(
          (
            detectionDelays.reduce((a, b) => a + b, 0) / detectionDelays.length
          ).toFixed(2)
        )
      : 0;

  const meanAdaptationInitiationSec =
    initiationDelays.length > 0
      ? Number(
          (
            initiationDelays.reduce((a, b) => a + b, 0) / initiationDelays.length
          ).toFixed(2)
        )
      : 0;

  const meanStabilizationTimeSec =
    stabilizationTimes.length > 0
      ? Number(
          (
            stabilizationTimes.reduce((a, b) => a + b, 0) /
            stabilizationTimes.length
          ).toFixed(2)
        )
      : 0;

  const totalAdaptationsInS3 = s3SamcsRuns.reduce(
    (sum, r) => sum + r.adaptationEventsCount,
    0
  );

  return {
    parameters: params,
    rawRuns,
    runtimeObservations,
    adaptationEvents,
    scenarioSummaries,
    hypothesisTests,
    s3DynamicMetrics: {
      meanDetectionDelaySec,
      meanAdaptationInitiationSec,
      meanStabilizationTimeSec,
      totalAdaptationsInS3,
    },
  };
}
