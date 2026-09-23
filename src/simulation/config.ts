import { ScenarioDefinition, SimulationParameters } from './types';

/**
 * DEFAULT SIMULATION PARAMETERS
 *
 * All values are explicitly defined, justified, and exportable.
 * LABELED: SIMULATION PARAMETERS (Computational model configuration, not empirical real-world hardware constants)
 */
export const DEFAULT_SIMULATION_PARAMETERS: SimulationParameters = {
  // Computational Resources
  initialCores: 4, // Initial baseline worker count
  minCores: 2, // Minimum allowed worker cores under downscaling
  maxCores: 16, // Maximum worker core capacity
  coreCapacityFlops: 100, // Nominal execution capacity: 100 task FLOP equivalents per core per second
  initialMemoryMb: 4096, // 4 GB base system allocation
  maxMemoryMb: 16384, // 16 GB peak working buffer

  // Observation & Sampling
  observationIntervalSec: 1.0, // Meta-computing observation window Delta t = 1.0 s
  stepSizeSec: 1.0, // Discrete simulation clock delta

  // WCI Formula Weights (alpha + beta + gamma = 1.0)
  // RATIONALE:
  // - alpha (0.45): Computational intensity (CPU demand) is the primary driver of execution bottlenecks.
  // - beta (0.35): Data footprint/memory pressure is secondary, dictating memory bandwidth & cache limits.
  // - gamma (0.20): Workload imbalance / utilization variance penalizes skewed distribution.
  alpha: 0.45,
  beta: 0.35,
  gamma: 0.20,

  // Transparent Rule-Based Adaptation Thresholds
  wciHighThreshold: 0.65, // WCI > 0.65 indicates severe resource pressure -> trigger scale-up
  wciLowThreshold: 0.30, // WCI < 0.30 indicates idle/underutilized compute -> trigger scale-down
  cpuHighThreshold: 0.82, // CPU > 82% triggers scale-up even if data footprint is low
  cpuLowThreshold: 0.35, // CPU < 35% allows scale-down if cores > minCores
  varianceThreshold: 0.40, // Vr > 0.40 indicates core load imbalance -> trigger workload redistribution
  dataVolumeThreshold: 0.70, // Dw > 0.70 triggers parameter adjustment (batch size throttling)

  // Adaptation Overheads (seconds)
  // RATIONALE:
  // Every adaptive stage introduces computational overhead that is accumulated and added to execution time:
  overheadObservationSec: 0.005, // Telemetry & metrics polling (5 ms)
  overheadWciCalcSec: 0.002, // Normalization and linear combination (2 ms)
  overheadMetaAnalysisSec: 0.008, // Rule evaluation & decision logic (8 ms)
  overheadScaleUpSec: 1.25, // Core provisioning, context init, thread allocation (1250 ms)
  overheadScaleDownSec: 0.60, // Task draining, graceful thread deallocation (600 ms)
  overheadRedistributeSec: 0.45, // Queue re-indexing and task migration across cores (450 ms)
  overheadParamAdjustSec: 0.30, // Batch buffer reconfiguration (300 ms)

  // Execution & Statistical Settings
  runsPerScenario: 30, // Required minimum 30 independent runs per condition
  baseRandomSeed: 1000, // Deterministic seed generator: seed = baseRandomSeed + runId
  adaptationCooldownSteps: 4, // 4-second hysteresis to prevent high-frequency flapping/thrashing
};

/**
 * THREE PRIMARY WORKLOAD SCENARIOS (Section 7)
 *
 * S1: Low-Complexity Stable Workload
 * S2: High-Complexity Workload
 * S3: Dynamic Workload (LOW -> MEDIUM -> HIGH -> LOW)
 */
export const SCENARIO_DEFINITIONS: Record<string, ScenarioDefinition> = {
  S1: {
    id: 'S1',
    name: 'Low-Complexity Stable Workload',
    description:
      'Uniform, low-intensity computational arrival pattern. Evaluates whether SAMCS behaves stably without over-adapting or incurring wasteful overhead.',
    targetTaskCount: 1500,
    maxSimulationSteps: 80,
    phases: [
      {
        name: 'Stable Low Intensity',
        startStep: 0,
        endStep: 80,
        baseArrivalRate: 25, // 25 tasks/sec
        taskComplexityMean: 0.22, // Low Cw
        dataVolumeMean: 0.20, // Low Dw
        burstProbability: 0.02, // Minimal jitter
      },
    ],
  },
  S2: {
    id: 'S2',
    name: 'High-Complexity Workload',
    description:
      'Substantially higher computational demand and heavy memory footprint. Evaluates whether SAMCS detects saturation and expands resources to prevent queue explosion.',
    targetTaskCount: 4500,
    maxSimulationSteps: 110,
    phases: [
      {
        name: 'Sustained High Intensity',
        startStep: 0,
        endStep: 110,
        baseArrivalRate: 75, // 75 tasks/sec
        taskComplexityMean: 0.82, // High Cw
        dataVolumeMean: 0.76, // High Dw
        burstProbability: 0.08, // Moderate variance
      },
    ],
  },
  S3: {
    id: 'S3',
    name: 'Dynamic Multi-Phase Workload',
    description:
      'Multi-phase non-stationary workload with explicit transitions: Phase 1 (Low) -> Phase 2 (Medium) -> Phase 3 (High) -> Phase 4 (Low). Evaluates dynamic detection, adaptation latency, and stabilization.',
    targetTaskCount: 4000,
    maxSimulationSteps: 120,
    phases: [
      {
        name: 'Phase 1: Low Intensity',
        startStep: 0,
        endStep: 28,
        baseArrivalRate: 22,
        taskComplexityMean: 0.22,
        dataVolumeMean: 0.20,
        burstProbability: 0.02,
      },
      {
        name: 'Phase 2: Medium Intensity',
        startStep: 28,
        endStep: 58,
        baseArrivalRate: 50,
        taskComplexityMean: 0.52,
        dataVolumeMean: 0.48,
        burstProbability: 0.05,
      },
      {
        name: 'Phase 3: High Intensity Surge',
        startStep: 58,
        endStep: 88,
        baseArrivalRate: 85,
        taskComplexityMean: 0.88,
        dataVolumeMean: 0.82,
        burstProbability: 0.12,
      },
      {
        name: 'Phase 4: Low Recovery',
        startStep: 88,
        endStep: 120,
        baseArrivalRate: 20,
        taskComplexityMean: 0.20,
        dataVolumeMean: 0.18,
        burstProbability: 0.02,
      },
    ],
  },
};
