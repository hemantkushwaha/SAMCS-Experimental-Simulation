# Self-Adaptive Meta-Computing System (SAMCS) Simulation Bench
## Research Paper: *"Proposed Meta-Computing Based Self-Adaptive System"*

This repository contains the official, fully reproducible computational simulation benchmark comparing a **Static Baseline Computing System** against the proposed **Self-Adaptive Meta-Computing System (SAMCS)**.

---

## 1. Simulation Objective

The primary objective is to quantitatively evaluate whether runtime observation and transparent, rule-based adaptive decision-making can improve computational performance, resource efficiency, and dynamic resilience across divergent workload conditions without human intervention.

The simulation directly evaluates:
1. **Execution Time ($T_{\text{exec}}$)**: Wall-clock duration required to complete target workload profiles.
2. **Resource Utilization**: Mean, variance, and peaks of CPU and memory utilization.
3. **Dynamic Workload Response**: Detection latency, adaptation initiation delay, and time-to-stabilization following non-stationary workload transitions.
4. **Adaptation Overhead**: Quantified time and compute costs incurred by telemetry polling, WCI calculation, meta-analysis, and reconfiguration.
5. **Overall Computational Efficiency ($\eta$)**: Useful tasks completed per unit of resource-time integral.
6. **Statistical Variation**: 30 paired independent trials per condition with hypothesis testing ($t$-test, $p$-value, Cohen's $d$, 95% Confidence Intervals).

---

## 2. Conceptual Architecture

The system strictly adheres to the closed-loop meta-computing control paradigm:

```
Base Computation (Workload Arrival & Queue Execution)
       ↓
Observation (Telemetry Polling & State Sampling)
       ↓
Meta-Analysis (Workload Complexity Index [WCI] Computation)
       ↓
Meta-Control (Transparent Rule-Based Adaptation Evaluation)
       ↓
Adaptive Action (Dynamic Resource Reallocation / Parameter Tuning)
       ↓
Updated Computational State (Scaled Cores, Throttled Buffers)
       ↓
Re-Observation (Feedback Loop Verification)
```

**Core Adaptive Cycle**:
$$\text{OBSERVE} \longrightarrow \text{ANALYZE} \longrightarrow \text{DECIDE} \longrightarrow \text{ADAPT} \longrightarrow \text{RE-OBSERVE}$$

---

## 3. Systems Under Evaluation

### System A — Baseline System
- Operates with a **fixed computational configuration** ($C = 4$ worker cores, static batch buffer).
- Observes runtime telemetry purely for passive metric recording.
- Performs **no dynamic resource reallocation**, **no workload redistribution**, and **no runtime parameter adjustment**.
- Represents conventional static provisioning.

### System B — SAMCS (Proposed Self-Adaptive Meta-Computing System)
- Continuously inspects computational state at discrete observation intervals ($\Delta t = 1.0\,\text{s}$).
- Calculates the multi-dimensional Workload Complexity Index ($WCI$).
- Executes transparent, deterministic meta-optimization rules.
- Autonomously issues four classes of adaptive actions:
  1. **Scale-Up**: Expands active worker cores (up to $C_{\text{max}} = 16$) under high $WCI$ or CPU saturation.
  2. **Scale-Down**: Reclaims idle cores (down to $C_{\text{min}} = 2$) under sustained low $WCI$.
  3. **Workload Redistribution**: Re-balances worker thread queues when utilization variance $V_r$ exceeds threshold.
  4. **Execution Parameter Adjustment**: Throttles batch sizes during memory surges to avoid cache thrashing.
- Explicitly accounts for all measurement, decision, and reconfiguration latencies in its total execution timeline.

---

## 4. Workload Complexity Index (WCI) Formulation

The $WCI(t)$ functions as a normalized, composite workload descriptor mapping multi-modal execution strain to the unit interval $[0.0, 1.0]$:

$$WCI(t) = \alpha C_w(t) + \beta D_w(t) + \gamma V_r(t)$$

Where:
- $C_w(t) \in [0, 1]$: **Computational Intensity**, measuring instantaneous arrival demand relative to nominal worker core capacity.
- $D_w(t) \in [0, 1]$: **Dataset Footprint / Memory Intensity**, measuring in-flight memory allocation against total buffer capacity.
- $V_r(t) \in [0, 1]$: **Resource-Utilization Variability**, measuring variance and imbalance across distributed worker execution units.

### Weight Calibration (Labeled as Simulation Parameters)
- $\alpha = 0.45$: Primary weight on computational processor demand.
- $\beta = 0.35$: Secondary weight on memory footprint and I/O buffer depth.
- $\gamma = 0.20$: Imbalance weight penalizing uneven core utilization.
- Constraint: $\alpha + \beta + \gamma = 1.00$, ensuring $0.0 \le WCI(t) \le 1.0$.

---

## 5. Adaptation Overhead Model

Adaptation overhead is not assumed to be negligible ($O \neq 0$). Every adaptive step adds simulated delay:

$$T_{\text{overhead}}(t) = O_{\text{obs}} + O_{\text{wci}} + O_{\text{meta}} + O_{\text{action}}$$

- $O_{\text{obs}} = 0.005\,\text{s}$ (5 ms telemetry sampling)
- $O_{\text{wci}} = 0.002\,\text{s}$ (2 ms normalization & linear combination)
- $O_{\text{meta}} = 0.008\,\text{s}$ (8 ms rule evaluation)
- $O_{\text{scale\_up}} = 1.250\,\text{s}$ (Worker core provisioning latency)
- $O_{\text{scale\_down}} = 0.600\,\text{s}$ (Core draining and thread release)
- $O_{\text{redistribute}} = 0.450\,\text{s}$ (Queue rebalancing cost)
- $O_{\text{param\_adjust}} = 0.300\,\text{s}$ (Batch reconfiguration cost)

All overhead costs are accumulated in $T_{\text{execution}}$.

---

## 6. Mathematical Definition of Overall Efficiency

$$\eta = \frac{W_{\text{completed}}}{\int_0^{T_{\text{exec}}} R(t) \, dt} \times 100 = \frac{W_{\text{completed}}}{\sum_{t=1}^{N} C(t) \cdot \Delta t} \times 100$$

- Unit: **Completed Tasks per 100 Core-Seconds**.
- $W_{\text{completed}}$: Total workload tasks executed.
- $R(t) = C(t)$: Active worker cores allocated at time step $t$.

---

## 7. Workload Scenarios

1. **Scenario 1 (S1) — Low-Complexity Stable Workload**:
   - Flat arrival profile ($\sim 25\,\text{tasks/s}$), low computational demand ($C_w \approx 0.22$, $D_w \approx 0.20$).
   - Total workload: 1,500 tasks.
   - Purpose: Verifies whether SAMCS avoids thrashing and gracefully conserves resources when scale-up is unneeded.

2. **Scenario 2 (S2) — High-Complexity Workload**:
   - Heavy sustained arrival ($\sim 75\,\text{tasks/s}$), high computational intensity ($C_w \approx 0.82$, $D_w \approx 0.76$).
   - Total workload: 4,500 tasks.
   - Purpose: Evaluates SAMCS's capacity to scale out and prevent catastrophic queue buildup.

3. **Scenario 3 (S3) — Dynamic Multi-Phase Workload**:
   - Phase 1 ($0 \le t < 28\,\text{s}$): Low Intensity ($22\,\text{tasks/s}$, $C_w=0.22$)
   - Phase 2 ($28 \le t < 58\,\text{s}$): Medium Intensity ($50\,\text{tasks/s}$, $C_w=0.52$)
   - Phase 3 ($58 \le t < 88\,\text{s}$): High Surge ($85\,\text{tasks/s}$, $C_w=0.88$)
   - Phase 4 ($88 \le t \le 120\,\text{s}$): Low Recovery ($20\,\text{tasks/s}$, $C_w=0.20$)
   - Total workload: 4,000 tasks.
   - Purpose: Measures dynamic response metrics (detection delay, initiation delay, stabilization time).

---

## 8. Reproducibility & Random Seed Methodology

- Uses a **deterministic Mulberry32 PRNG**.
- Runs are indexed $1 \le i \le 30$.
- Deterministic seed equation: $\text{Seed}_i = 1000 + i$.
- For every trial $i$, both **Baseline** and **SAMCS** receive the **identical random seed**, guaranteeing identical task arrival sequences, sizes, and burst perturbations.

---

## 9. Output File Descriptions

All files are located in `/public/data/`:
1. `raw_runs.csv`: 180 rows containing every individual trial's runtime, CPU/memory statistics, efficiency, overhead, and seed.
2. `runtime_observations.csv`: Discrete time-series observations detailing $C_w$, $D_w$, $V_r$, $WCI$, queue depth, and utilization step-by-step.
3. `adaptation_events.csv`: Detailed event logs of all autonomous adaptations (timestamp, trigger condition, pre-state, post-state, and cost).
4. `scenario_summary.csv`: Aggregated descriptive statistics (mean, median, standard deviation, min, max, 95% CI).
5. `statistical_analysis.csv`: Inferential statistics for all metrics across scenarios (paired Student's $t$-test, $t$-statistic, $p$-value, degrees of freedom, Cohen's $d$).
6. `experiment_results.json`: Complete JSON dump facilitating client-side visualization.

---

## 10. Execution Instructions

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Run the Simulation Benchmark
```bash
# Execute the full 180-run simulation and run all 10 validation checks
npx tsx src/scripts/runExperiment.ts
```

### Launch the Interactive Visualization Dashboard
```bash
# Start the local Vite development server
npm run dev
# Navigate to http://localhost:3000
```
