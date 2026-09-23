import { DeterministicRNG } from './prng';
import {
  AdaptationEvent,
  AdaptiveActionType,
  RunResult,
  RuntimeObservation,
  ScenarioDefinition,
  SimulationParameters,
  SystemType,
} from './types';

export interface SimulationExecutionOutput {
  runResult: RunResult;
  observations: RuntimeObservation[];
  adaptationEvents: AdaptationEvent[];
}

/**
 * Execution Engine for SAMCS and Baseline Meta-Computing Simulation
 */
export class SimulationEngine {
  private params: SimulationParameters;

  constructor(params: SimulationParameters) {
    this.params = params;
  }

  /**
   * Executes a single simulation run deterministically given scenario, system type, and seed.
   */
  public executeRun(
    scenario: ScenarioDefinition,
    system: SystemType,
    runId: number,
    seed: number
  ): SimulationExecutionOutput {
    const rng = new DeterministicRNG(seed);
    const observations: RuntimeObservation[] = [];
    const adaptationEvents: AdaptationEvent[] = [];

    // Computational State Initialization
    let activeCores = this.params.initialCores;
    let batchSize = 32; // Nominal batch parameter
    let pendingQueueTasks = 0;
    let completedTasks = 0;
    let cumulativeOverheadSec = 0;
    let stepsSinceLastAdaptation = this.params.adaptationCooldownSteps; // Cooldown ready

    // Tracking for statistics
    const cpuReadings: number[] = [];
    const memReadings: number[] = [];
    let totalCoreSeconds = 0;

    // S3 Dynamic Response Tracking
    let dynamicTransitionDetected = false;
    let detectionDelaySec: number | undefined = undefined;
    let adaptationInitiationSec: number | undefined = undefined;
    let stabilizationTimeSec: number | undefined = undefined;
    const transitionSurgeStep = scenario.id === 'S3' ? 58 : -1; // Phase 3 surge start
    let postTransitionSteps = 0;
    let isStabilized = false;

    const tStart = 0;
    let simTimeSec = 0;
    let currentStep = 0;

    // Simulation Loop (OBSERVE -> ANALYZE -> DECIDE -> ADAPT -> RE-OBSERVE)
    while (
      currentStep < scenario.maxSimulationSteps &&
      (completedTasks < scenario.targetTaskCount || pendingQueueTasks > 0 || currentStep < 30)
    ) {
      // 1. WORKLOAD ARRIVAL (Base Computation Demand Generator)
      // Determine active scenario phase
      const currentPhase =
        scenario.phases.find(
          (p) => currentStep >= p.startStep && currentStep < p.endStep
        ) || scenario.phases[scenario.phases.length - 1];

      // Poisson-distributed task arrival using deterministic PRNG
      const incomingTasks = rng.nextPoisson(currentPhase.baseArrivalRate);
      pendingQueueTasks += incomingTasks;

      // Computational Intensity Cw(t) [normalized 0..1]
      const rawCw =
        currentPhase.taskComplexityMean +
        rng.nextGaussian(0, 0.03) +
        (rng.next() < currentPhase.burstProbability ? 0.25 : 0.0);
      const cw = Math.max(0.05, Math.min(1.0, rawCw));

      // Dataset Size / Memory Footprint Dw(t) [normalized 0..1]
      const rawDw =
        currentPhase.dataVolumeMean +
        (pendingQueueTasks / 600) * 0.2 +
        rng.nextGaussian(0, 0.02);
      const dw = Math.max(0.05, Math.min(1.0, rawDw));

      // 2. RESOURCE EXECUTION CAPACITY
      // Baseline uses fixed initial cores; SAMCS dynamically scales activeCores
      const coreCapacity = this.params.coreCapacityFlops;
      const batchMultiplier = 1.0 + Math.log2(batchSize / 16) * 0.06; // Parameter efficiency
      const nominalStepCapacity = activeCores * coreCapacity * batchMultiplier * 0.35;

      const processedTasks = Math.min(pendingQueueTasks, Math.round(nominalStepCapacity));
      pendingQueueTasks -= processedTasks;
      completedTasks += processedTasks;

      // CPU Utilization: ratio of processed demand to nominal capacity (normalized fraction [0.0..1.0])
      const rawCpuRatio = processedTasks / Math.max(1, nominalStepCapacity);
      const cpuLoadPressure = pendingQueueTasks > 50 ? 0.15 : 0.0;
      const cpuFraction = Math.max(
        0.05,
        Math.min(1.0, rawCpuRatio * 0.85 + cpuLoadPressure + rng.nextGaussian(0, 0.02))
      );
      const cpuUtil = Number((cpuFraction * 100).toFixed(2));

      // Memory Utilization (normalized fraction [0.0..1.0])
      const activeMemoryMb =
        this.params.initialMemoryMb * (0.35 + dw * 0.55) +
        (pendingQueueTasks * 0.8) +
        rng.nextGaussian(0, 20);
      const memFraction = Math.max(
        0.10,
        Math.min(0.995, activeMemoryMb / this.params.maxMemoryMb)
      );
      const memUtil = Number((memFraction * 100).toFixed(2));

      // Resource Utilization Variability Vr(t) [normalized 0..1]
      // Simulates imbalance among distributed worker core thread pools
      let rawVr = 0.15 + cpuFraction * 0.35 + rng.nextGaussian(0, 0.04);
      if (pendingQueueTasks > 200) {
        rawVr += 0.25; // Imbalance amplifies under persistent queue strain identically for both systems
      }
      const vr = Math.max(0.02, Math.min(1.0, rawVr));

      // 3. WORKLOAD COMPLEXITY INDEX (WCI) CALCULATION
      // WCI(t) = alpha * Cw(t) + beta * Dw(t) + gamma * Vr(t)
      const wci = Number(
        (
          this.params.alpha * cw +
          this.params.beta * dw +
          this.params.gamma * vr
        ).toFixed(4)
      );

      // Overhead tracking for current step
      let stepOverheadSec = 0;

      // 4. META-ANALYSIS & DECISION (SAMCS only; Baseline observes but maintains fixed state)
      if (system === 'SAMCS') {
        // Routine observation, telemetry & meta-analysis overhead
        stepOverheadSec +=
          this.params.overheadObservationSec +
          this.params.overheadWciCalcSec +
          this.params.overheadMetaAnalysisSec;

        // Dynamic detection tracking for S3 transition surge (using consistent fraction units)
        if (
          scenario.id === 'S3' &&
          currentStep >= transitionSurgeStep &&
          !dynamicTransitionDetected
        ) {
          if (wci >= this.params.wciHighThreshold || cpuFraction >= this.params.cpuHighThreshold) {
            dynamicTransitionDetected = true;
            detectionDelaySec = (currentStep - transitionSurgeStep) * this.params.stepSizeSec;
          }
        }

        // Adaptive Meta-Optimization Rules
        let decision = 'MAINTAIN_CONFIGURATION';
        let chosenAction: AdaptiveActionType = 'MAINTAIN';
        let actionCost = 0;
        let triggerReason = 'Workload within nominal operating parameters';
        let decisionCondition = 'None (nominal)';
        let triggerThreshold = 0;

        const prevState = {
          cores: activeCores,
          batchSize,
          cpuUtil,
          vr,
        };

        // Check if cooldown has elapsed
        if (stepsSinceLastAdaptation >= this.params.adaptationCooldownSteps) {
          const isWciHigh = wci >= this.params.wciHighThreshold;
          const isCpuHigh = cpuFraction >= this.params.cpuHighThreshold;

          const isWciLow = wci <= this.params.wciLowThreshold;
          const isCpuLow = cpuFraction <= this.params.cpuLowThreshold;

          const isVrHigh = vr >= this.params.varianceThreshold;
          const isDwHigh = dw >= this.params.dataVolumeThreshold;

          // Rule 1: High Workload Pressure -> Scale Up
          if ((isWciHigh || isCpuHigh) && activeCores < this.params.maxCores) {
            decision = 'TRIGGER_ADAPTATION';
            chosenAction = 'SCALE_UP';
            const coresToAdd = Math.min(2, this.params.maxCores - activeCores);
            activeCores += coresToAdd;
            actionCost = this.params.overheadScaleUpSec;
            stepsSinceLastAdaptation = 0;

            if (isWciHigh && isCpuHigh) {
              triggerThreshold = this.params.wciHighThreshold;
              decisionCondition = `WCI (${wci.toFixed(4)}) >= ${this.params.wciHighThreshold} AND CPU (${cpuUtil.toFixed(1)}%) >= ${(this.params.cpuHighThreshold * 100).toFixed(1)}%`;
              triggerReason = `High complexity (WCI=${wci.toFixed(2)} >= ${this.params.wciHighThreshold}) and CPU saturation (${cpuUtil.toFixed(1)}% >= ${(this.params.cpuHighThreshold * 100).toFixed(1)}%)`;
            } else if (isWciHigh) {
              triggerThreshold = this.params.wciHighThreshold;
              decisionCondition = `WCI (${wci.toFixed(4)}) >= ${this.params.wciHighThreshold}`;
              triggerReason = `High complexity: WCI=${wci.toFixed(2)} >= ${this.params.wciHighThreshold}`;
            } else {
              triggerThreshold = this.params.cpuHighThreshold;
              decisionCondition = `CPU (${cpuUtil.toFixed(1)}%) >= ${(this.params.cpuHighThreshold * 100).toFixed(1)}%`;
              triggerReason = `CPU saturation: ${cpuUtil.toFixed(1)}% >= ${(this.params.cpuHighThreshold * 100).toFixed(1)}%`;
            }
          }
          // Rule 2: Low Workload Pressure -> Scale Down to Conserve Resources
          else if (
            isWciLow &&
            isCpuLow &&
            activeCores > this.params.minCores &&
            pendingQueueTasks < 20
          ) {
            decision = 'TRIGGER_ADAPTATION';
            chosenAction = 'SCALE_DOWN';
            const coresToRemove = Math.min(2, activeCores - this.params.minCores);
            activeCores -= coresToRemove;
            actionCost = this.params.overheadScaleDownSec;
            stepsSinceLastAdaptation = 0;
            triggerThreshold = this.params.wciLowThreshold;
            decisionCondition = `WCI (${wci.toFixed(4)}) <= ${this.params.wciLowThreshold} AND CPU (${cpuUtil.toFixed(1)}%) <= ${(this.params.cpuLowThreshold * 100).toFixed(1)}%`;
            triggerReason = `Low workload pressure (WCI=${wci.toFixed(2)} <= ${this.params.wciLowThreshold}) and CPU underutilization (${cpuUtil.toFixed(1)}% <= ${(this.params.cpuLowThreshold * 100).toFixed(1)}%)`;
          }
          // Rule 3: High Worker Load Imbalance -> Redistribute Workload
          else if (isVrHigh && pendingQueueTasks > 40) {
            decision = 'TRIGGER_ADAPTATION';
            chosenAction = 'REDISTRIBUTE_WORKLOAD';
            actionCost = this.params.overheadRedistributeSec;
            stepsSinceLastAdaptation = 0;
            triggerThreshold = this.params.varianceThreshold;
            decisionCondition = `Vr (${vr.toFixed(4)}) >= ${this.params.varianceThreshold} AND queueLength (${pendingQueueTasks}) > 40`;
            triggerReason = `Core load variance exceeds threshold (Vr=${vr.toFixed(2)} >= ${this.params.varianceThreshold}) with queue backlog (${pendingQueueTasks} tasks)`;
          }
          // Rule 4: High Data Volume / Memory Pressure -> Parameter Adjustment
          else if (isDwHigh && batchSize > 16) {
            decision = 'TRIGGER_ADAPTATION';
            chosenAction = 'ADJUST_PARAMETERS';
            const oldBatch = batchSize;
            batchSize = Math.max(16, batchSize - 8); // Throttles memory footprint
            actionCost = this.params.overheadParamAdjustSec;
            stepsSinceLastAdaptation = 0;
            triggerThreshold = this.params.dataVolumeThreshold;
            decisionCondition = `Dw (${dw.toFixed(4)}) >= ${this.params.dataVolumeThreshold} AND batchSize (${oldBatch}) > 16`;
            triggerReason = `Data volume intensity elevated (Dw=${dw.toFixed(2)} >= ${this.params.dataVolumeThreshold}), throttling batch size (${oldBatch} -> ${batchSize})`;
          }
        }

        stepsSinceLastAdaptation++;
        stepOverheadSec += actionCost;
        cumulativeOverheadSec += stepOverheadSec;

        // Log adaptation event if action was taken
        if (chosenAction !== 'MAINTAIN') {
          if (
            scenario.id === 'S3' &&
            currentStep >= transitionSurgeStep &&
            adaptationInitiationSec === undefined
          ) {
            adaptationInitiationSec = (currentStep - transitionSurgeStep) * this.params.stepSizeSec;
          }

          adaptationEvents.push({
            step: currentStep,
            simTimeSec: Number(simTimeSec.toFixed(2)),
            scenarioId: scenario.id,
            system,
            runId,
            seed,
            wci,
            threshold: triggerThreshold,
            currentWorkloadIntensity: cw,
            currentResourceAllocation: activeCores,
            decision,
            decisionCondition,
            action: chosenAction,
            previousState: prevState,
            updatedState: {
              cores: activeCores,
              batchSize,
              expectedCapacity: activeCores * coreCapacity * batchMultiplier * 0.35,
            },
            overheadCostSec: Number(actionCost.toFixed(4)),
            triggerReason,
          });
        }
      } else {
        // Baseline: No adaptation overhead, activeCores fixed
        cumulativeOverheadSec = 0;
      }

      // S3 Stabilization Tracking post-surge
      if (scenario.id === 'S3' && currentStep >= transitionSurgeStep) {
        postTransitionSteps++;
        if (!isStabilized && postTransitionSteps > 5) {
          if (cpuFraction < 0.80 && pendingQueueTasks < 80) {
            isStabilized = true;
            stabilizationTimeSec = postTransitionSteps * this.params.stepSizeSec;
          }
        }
      }

      // Record telemetry readings
      cpuReadings.push(cpuUtil);
      memReadings.push(memUtil);
      totalCoreSeconds += activeCores * this.params.stepSizeSec;

      // Add observation
      observations.push({
        step: currentStep,
        simTimeSec: Number(simTimeSec.toFixed(2)),
        scenarioId: scenario.id,
        system,
        runId,
        seed,
        arrivalRate: incomingTasks,
        queueLength: pendingQueueTasks,
        completedTasks,
        activeCores,
        batchSize,
        cw: Number(cw.toFixed(4)),
        dw: Number(dw.toFixed(4)),
        vr: Number(vr.toFixed(4)),
        wci,
        cpuUtilization: Number(cpuUtil.toFixed(2)),
        memoryUtilization: Number(memUtil.toFixed(2)),
        throughput: processedTasks,
        stepOverheadSec: Number(stepOverheadSec.toFixed(4)),
        cumulativeOverheadSec: Number(cumulativeOverheadSec.toFixed(4)),
      });

      // Advance clock: step duration + any real adaptation penalty
      simTimeSec += this.params.stepSizeSec + stepOverheadSec;
      currentStep++;
    }

    // Workload Completion Time
    const tEnd = Number(simTimeSec.toFixed(3));
    const tExecution = Number((tEnd - tStart).toFixed(3));

    // Calculate Resource Utilization Metrics
    const cpuSum = cpuReadings.reduce((a, b) => a + b, 0);
    const cpuMean = Number((cpuSum / cpuReadings.length).toFixed(2));
    const cpuMin = Number(Math.min(...cpuReadings).toFixed(2));
    const cpuMax = Number(Math.max(...cpuReadings).toFixed(2));
    const cpuVar =
      cpuReadings.reduce((a, b) => a + Math.pow(b - cpuMean, 2), 0) /
      Math.max(1, cpuReadings.length - 1);
    const cpuStd = Number(Math.sqrt(cpuVar).toFixed(2));

    const memSum = memReadings.reduce((a, b) => a + b, 0);
    const memMean = Number((memSum / memReadings.length).toFixed(2));
    const memMin = Number(Math.min(...memReadings).toFixed(2));
    const memMax = Number(Math.max(...memReadings).toFixed(2));
    const memVar =
      memReadings.reduce((a, b) => a + Math.pow(b - memMean, 2), 0) /
      Math.max(1, memReadings.length - 1);
    const memStd = Number(Math.sqrt(memVar).toFixed(2));

    // Overall Efficiency Definition:
    // Efficiency eta = (Total Completed Tasks / Total Core-Seconds Expended) * 100
    // Measured in Tasks per 100 Core-Seconds
    const efficiency =
      totalCoreSeconds > 0
        ? Number(((completedTasks / totalCoreSeconds) * 100).toFixed(4))
        : 0;

    const runResult: RunResult = {
      runId,
      scenarioId: scenario.id,
      system,
      seed,
      tStart,
      tEnd,
      tExecution,
      tasksCompleted: completedTasks,
      cpuMean,
      cpuMin,
      cpuMax,
      cpuStd,
      memMean,
      memMin,
      memMax,
      memStd,
      totalCoreSeconds: Number(totalCoreSeconds.toFixed(2)),
      efficiency,
      totalAdaptationOverheadSec: Number(cumulativeOverheadSec.toFixed(3)),
      adaptationEventsCount: adaptationEvents.length,
      detectionDelaySec: detectionDelaySec !== undefined ? Number(detectionDelaySec.toFixed(2)) : undefined,
      adaptationInitiationSec:
        adaptationInitiationSec !== undefined ? Number(adaptationInitiationSec.toFixed(2)) : undefined,
      stabilizationTimeSec:
        stabilizationTimeSec !== undefined ? Number(stabilizationTimeSec.toFixed(2)) : undefined,
    };

    return {
      runResult,
      observations,
      adaptationEvents,
    };
  }
}
