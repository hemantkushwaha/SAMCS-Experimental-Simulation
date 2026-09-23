import { StatisticalMetricSummary, HypothesisTestResult, ScenarioId } from './types';

/**
 * Rigorous Statistical Analysis Toolkit
 * Calculates exact descriptive metrics and inferential tests based strictly on raw simulation runs.
 */

export function calculateSummary(values: number[]): StatisticalMetricSummary {
  if (!values || values.length === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, ci95Low: 0, ci95High: 0 };
  }

  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Standard deviation (sample variance)
  const variance =
    n > 1
      ? sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
      : 0;
  const std = Math.sqrt(variance);

  const min = sorted[0];
  const max = sorted[n - 1];

  // 95% Confidence Interval
  // For n=30, t-critical at alpha=0.05 is 2.0452; for large n ~1.96.
  const tCrit = n >= 30 ? 2.0452 : 2.1;
  const sem = std / Math.sqrt(n);
  const ci95Low = mean - tCrit * sem;
  const ci95High = mean + tCrit * sem;

  return {
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    std: Number(std.toFixed(4)),
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    ci95Low: Number(ci95Low.toFixed(4)),
    ci95High: Number(ci95High.toFixed(4)),
  };
}

/**
 * Standard Normal CDF approximation (Abramowitz & Stegun)
 */
function standardNormalCdf(z: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (z >= 0.0) {
    const t = 1.0 / (1.0 + p * z);
    return (
      1.0 -
      c *
        Math.exp((-z * z) / 2.0) *
        t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  } else {
    const t = 1.0 / (1.0 - p * z);
    return (
      c *
      Math.exp((-z * z) / 2.0) *
      t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  }
}

/**
 * Two-tailed Paired Student's t-test calculation
 * Compares paired runs sharing identical seeds.
 */
export function performPairedTTest(
  baseline: number[],
  samcs: number[],
  scenarioId: ScenarioId,
  metricName: string,
  higherIsBetter: boolean = false
): HypothesisTestResult {
  const n = baseline.length;
  if (n !== samcs.length || n < 2) {
    throw new Error(`Sample size mismatch or insufficient runs: baseline=${n}, samcs=${samcs.length}`);
  }

  const differences = baseline.map((b, i) => b - samcs[i]);
  const diffMean = differences.reduce((acc, d) => acc + d, 0) / n;
  const diffVariance =
    differences.reduce((acc, d) => acc + Math.pow(d - diffMean, 2), 0) / (n - 1);
  const diffStd = Math.sqrt(diffVariance);
  const stdError = diffStd / Math.sqrt(n);

  const tStat = stdError > 1e-9 ? diffMean / stdError : 0;
  const df = n - 1;

  // Approximate two-tailed p-value using Hill's approximation for Student's t
  const x = tStat * Math.sqrt((df - 0.5) / (df + Math.pow(tStat, 2) / 2));
  const normP = standardNormalCdf(Math.abs(x));
  const pValue = Math.max(1e-6, Math.min(1.0, 2 * (1.0 - normP)));

  // Means & Pooled Std Dev for Cohen's d
  const baseSummary = calculateSummary(baseline);
  const samcsSummary = calculateSummary(samcs);
  const pooledStd = Math.sqrt((Math.pow(baseSummary.std, 2) + Math.pow(samcsSummary.std, 2)) / 2);
  const cohensD = pooledStd > 1e-9 ? Math.abs(baseSummary.mean - samcsSummary.mean) / pooledStd : 0;

  let percentImprovement = 0;
  if (Math.abs(baseSummary.mean) > 1e-6) {
    if (higherIsBetter) {
      percentImprovement = ((samcsSummary.mean - baseSummary.mean) / baseSummary.mean) * 100;
    } else {
      percentImprovement = ((baseSummary.mean - samcsSummary.mean) / baseSummary.mean) * 100;
    }
  }

  return {
    scenarioId,
    metric: metricName,
    baselineMean: baseSummary.mean,
    samcsMean: samcsSummary.mean,
    percentImprovement: Number(percentImprovement.toFixed(2)),
    testName: "Paired Two-Tailed Student's t-test",
    testStatistic: Number(tStat.toFixed(4)),
    pValue: Number(pValue.toFixed(6)),
    degreesOfFreedom: df,
    cohensD: Number(cohensD.toFixed(3)),
    isSignificant: pValue < 0.05,
  };
}
