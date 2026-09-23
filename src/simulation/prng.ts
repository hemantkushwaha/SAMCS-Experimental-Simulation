/**
 * Deterministic Mulberry32 Pseudo-Random Number Generator (PRNG)
 * Ensures 100% reproducibility of simulation runs.
 * Every run uses a recorded integer seed.
 */

export class DeterministicRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    // Warm up state
    this.next();
    this.next();
  }

  /**
   * Generates a floating point number in [0, 1)
   */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a floating point number in [min, max)
   */
  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generates a normally distributed value via Box-Muller transform
   */
  public nextGaussian(mean: number = 0, stdDev: number = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    while (u1 <= 1e-15) {
      u1 = this.next();
    }
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Generates a Poisson random variable with parameter lambda
   */
  public nextPoisson(lambda: number): number {
    if (lambda < 30) {
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1.0;
      do {
        k++;
        p *= this.next();
      } while (p > L);
      return k - 1;
    } else {
      // Gaussian approximation for large lambda
      const val = Math.round(this.nextGaussian(lambda, Math.sqrt(lambda)));
      return Math.max(0, val);
    }
  }

  /**
   * Returns current internal state
   */
  public getState(): number {
    return this.state;
  }
}
