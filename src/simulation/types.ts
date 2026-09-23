/**
 * Simulation Types and Domain Model for:
 * "Proposed Meta-Computing Based Self-Adaptive System"
 *
 * Distinguishes strictly between:
 * 1. Simulation Parameters
 * 2. Simulated Observations
 * 3. Calculated Results
 * 4. Interpretation
 */

export type ScenarioId = 'S1' | 'S2' | 'S3';
export type SystemType = 'BASELINE' | 'SAMCS';

export interface WorkloadPhase {
  name: string;
  startStep: number;
  endStep: number;
  baseArrivalRate: number; // tasks per second
  taskComplexityMean: number; // floating point demand (FLOPs / nominal worker cap)
  dataVolumeMean: number; // memory footprint (MB)
  burstProbability: number; // prob of transient variance surge
}

export interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  description: string;
  targetTaskCount: number;
  maxSimulationSteps: number;
  phases: WorkloadPhase[];
}

export interface SimulationParameters {
  // Computational Resources
  initialCores: number;
  minCores: number;
  maxCores: number;
  coreCapacityFlops: number; // nominal task processing capability per core/sec
  initialMemoryMb: number;
  maxMemoryMb: number;

  // Observation & Sampling
  observationIntervalSec: number; // Delta t for observe loop

  // WCI Formula Weights (alpha + beta + gamma = 1.0)
  alpha: number; // Weight for computational intensity Cw
  beta: number; // Weight for dataset size / memory variability Dw
  gamma: number; // Weight for resource utilization variability Vr

  // Dynamic Adaptation Thresholds
  wciHighThreshold: number; // Above this, trigger scale-up
  wciLowThreshold: number; // Below this, trigger scale-down
  cpuHighThreshold: number; // Emergency CPU scale-up (>82%)
  cpuLowThreshold: number; // Idle CPU scale-down (<35%)
  varianceThreshold: number; // Vr threshold for workload redistribution
  dataVolumeThreshold: number; // Dw threshold for execution parameter adjustment

  // Adaptation Overheads (seconds of execution delay / penalty)
  overheadObservationSec: number; // Base telemetry cost
  overheadWciCalcSec: number; // WCI calculation cost
  overheadMetaAnalysisSec: number; // Meta-analysis / decision cost
  overheadScaleUpSec: number; // Worker spawn / allocation latency
  overheadScaleDownSec: number; // Worker drain / release latency
  overheadRedistributeSec: number; // Load-balancing queue shuffle
  overheadParamAdjustSec: number; // Batch size / chunk tuning

  // Experiment Execution
  runsPerScenario: number; // Minimum 30
  baseRandomSeed: number;
  stepSizeSec: number;
  adaptationCooldownSteps: number; // Prevent thrashing
}

export interface RuntimeObservation {
  step: number;
  simTimeSec: number;
  scenarioId: ScenarioId;
  system: SystemType;
  runId: number;
  seed: number;

  // State descriptors
  arrivalRate: number;
  queueLength: number;
  completedTasks: number;
  activeCores: number;
  batchSize: number;

  // WCI Components (normalized [0, 1])
  cw: number; // Computational intensity
  dw: number; // Data volume / memory intensity
  vr: number; // Resource utilization variability
  wci: number; // alpha*Cw + beta*Dw + gamma*Vr

  // Resource Metrics
  cpuUtilization: number; // [0, 100%]
  memoryUtilization: number; // [0, 100%]
  throughput: number; // tasks/sec

  // Overhead Tracking
  stepOverheadSec: number;
  cumulativeOverheadSec: number;
}

export type AdaptiveActionType =
  | 'SCALE_UP'
  | 'SCALE_DOWN'
  | 'REDISTRIBUTE_WORKLOAD'
  | 'ADJUST_PARAMETERS'
  | 'MAINTAIN';

export interface AdaptationEvent {
  step: number;
  simTimeSec: number;
  scenarioId: ScenarioId;
  runId: number;
  seed: number;
  wci: number;
  currentWorkloadIntensity: number;
  currentResourceAllocation: number;
  decision: string;
  action: AdaptiveActionType;
  previousState: {
    cores: number;
    batchSize: number;
    cpuUtil: number;
    vr: number;
  };
  updatedState: {
    cores: number;
    batchSize: number;
    expectedCapacity: number;
  };
  overheadCostSec: number;
  triggerReason: string;
}

export interface RunResult {
  runId: number;
  scenarioId: ScenarioId;
  system: SystemType;
  seed: number;
  tStart: number;
  tEnd: number;
  tExecution: number;
  tasksCompleted: number;

  // Resource Statistics
  cpuMean: number;
  cpuMin: number;
  cpuMax: number;
  cpuStd: number;

  memMean: number;
  memMin: number;
  memMax: number;
  memStd: number;

  // Efficiency and Overhead
  totalCoreSeconds: number; // Integral of active cores over time
  efficiency: number; // tasksCompleted / totalCoreSeconds
  totalAdaptationOverheadSec: number;
  adaptationEventsCount: number;

  // S3 Dynamic Response Metrics (null for S1/S2)
  detectionDelaySec?: number;
  adaptationInitiationSec?: number;
  stabilizationTimeSec?: number;
}

export interface StatisticalMetricSummary {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  ci95Low: number;
  ci95High: number;
}

export interface ScenarioSystemSummary {
  scenarioId: ScenarioId;
  system: SystemType;
  sampleSize: number;
  executionTime: StatisticalMetricSummary;
  cpuUtilization: StatisticalMetricSummary;
  memoryUtilization: StatisticalMetricSummary;
  efficiency: StatisticalMetricSummary;
  adaptationOverhead: StatisticalMetricSummary;
  adaptationCount: StatisticalMetricSummary;
}

export interface HypothesisTestResult {
  scenarioId: ScenarioId;
  metric: string;
  baselineMean: number;
  samcsMean: number;
  percentImprovement: number;
  testName: string;
  testStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
  cohensD: number;
  isSignificant: boolean;
}

export interface DynamicResponseMetrics {
  runId: number;
  transitionStep: number;
  transitionTimeSec: number;
  detectionTimeSec: number;
  detectionDelaySec: number;
  adaptationInitiationSec: number;
  adaptationCountInPhase: number;
  stabilizationTimeSec: number;
}

export interface ValidationCheckResult {
  id: number;
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}
