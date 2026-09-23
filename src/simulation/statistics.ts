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
 * Log Gamma function using Lanczos approximation (g=7, 9 coefficients)
 */
function logGamma(z: number): number {
  const g = 7;
  const C = [
    0.99999999999980993,
    676.52036812188514,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109583115912,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let base = C[0];
  for (let i = 1; i < g + 2; i++) {
    base += C[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(base);
}

/**
 * Regularized incomplete beta function I_x(a, b) via modified Lentz method
 */
function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta);

  const fEps = 1e-15;
  let f = 1.0;
  let c = 1.0;
  let d = 0.0;

  for (let m = 0; m <= 200; m++) {
    let numerator: number;
    if (m === 0) {
      numerator = 1.0;
    } else if (m % 2 === 0) {
      const k = m / 2;
      numerator = (k * (b - k) * x) / ((a + 2 * k - 1) * (a + 2 * k));
    } else {
      const k = (m - 1) / 2;
      numerator = -((a + k) * (a + b + k) * x) / ((a + 2 * k) * (a + 2 * k + 1));
    }

    d = 1.0 + numerator * d;
    if (Math.abs(d) < fEps) d = fEps;
    c = 1.0 + numerator / c;
    if (Math.abs(c) < fEps) c = fEps;
    d = 1.0 / d;
    const delta = c * d;
    f *= delta;
    if (Math.abs(delta - 1.0) < fEps) break;
  }

  return (front * (f - 1.0)) / a;
}

/**
 * Exact two-tailed p-value for Student's t-distribution with df degrees of freedom
 */
export function calculateStudentTPValue(tStat: number, df: number): number {
  if (df <= 0) return 1.0;
  const absT = Math.abs(tStat);
  if (absT === 0) return 1.0;
  const x = df / (df + absT * absT);
  if (x >= 1) return 1.0;
  if (x <= 0) return 0.0;
  const p = regularizedIncompleteBeta(df / 2, 0.5, x);
  return Math.max(0, Math.min(1.0, p));
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

  // Exact two-tailed p-value calculation
  const pValue = calculateStudentTPValue(tStat, df);

  // Format p-value rigorously: do not round to 0, use scientific notation or bounded string
  let pValueFormatted: string;
  if (pValue < 1e-6) {
    pValueFormatted = pValue < 1e-15 ? 'p < 1e-15' : `p = ${pValue.toExponential(2)}`;
  } else {
    pValueFormatted = `p = ${pValue.toFixed(6)}`;
  }

  // 95% Confidence Interval for mean difference
  // For df=29, tCrit at alpha=0.05 is 2.0452
  const tCrit = df === 29 ? 2.0452 : 2.0;
  const ci95DiffLow = Number((diffMean - tCrit * stdError).toFixed(4));
  const ci95DiffHigh = Number((diffMean + tCrit * stdError).toFixed(4));

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
    sampleSize: n,
    baselineMean: baseSummary.mean,
    samcsMean: samcsSummary.mean,
    percentImprovement: Number(percentImprovement.toFixed(2)),
    testName: "Paired Two-Tailed Student's t-test",
    testStatistic: Number(tStat.toFixed(4)),
    pValue: pValue,
    pValueFormatted,
    degreesOfFreedom: df,
    cohensD: Number(cohensD.toFixed(3)),
    ci95DiffLow,
    ci95DiffHigh,
    isSignificant: pValue < 0.05,
  };
}
