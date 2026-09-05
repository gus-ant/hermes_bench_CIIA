import { ScoreWeights } from "@/lib/types";

export interface ScoreInput {
  qualityScore: number; // 0–100
  cost: number; // in USD
  latencyMs: number;
  toolCallsCount: number;
  toolErrorsCount: number;
  successfulToolCalls: number;
  status: string;
  allRunsForTask: { status: string; qualityScore?: number }[];
}

export interface ScoreOutput {
  qualityScore: number;
  costScore: number;
  latencyScore: number;
  toolScore: number;
  reliabilityScore: number;
  finalScore: number;
}

/**
 * ScoreCalculator computes all 6 scores using configurable weights.
 * Weights are loaded from environment — never hardcoded.
 */
export class ScoreCalculator {
  private weights: ScoreWeights;

  // Normalization reference ranges (can be updated as benchmark data grows)
  private static readonly COST_REFERENCE = {
    best: 0.00001,  // $0.00001 per run (very cheap)
    worst: 0.01,    // $0.01 per run (expensive)
  };
  private static readonly LATENCY_REFERENCE = {
    best: 500,      // 500ms (very fast)
    worst: 30000,   // 30s (slow)
  };

  constructor(weights: ScoreWeights) {
    this.weights = weights;
  }

  calculate(input: ScoreInput): ScoreOutput {
    const qualityScore = input.qualityScore;
    const costScore = this.normalizeCost(input.cost);
    const latencyScore = this.normalizeLatency(input.latencyMs);
    const toolScore = this.calculateToolScore(input);
    const reliabilityScore = this.calculateReliabilityScore(input);

    const finalScore =
      qualityScore * this.weights.quality +
      costScore * this.weights.cost +
      latencyScore * this.weights.latency +
      toolScore * this.weights.tool +
      reliabilityScore * this.weights.reliability;

    return {
      qualityScore: Math.round(qualityScore),
      costScore: Math.round(costScore),
      latencyScore: Math.round(latencyScore),
      toolScore: Math.round(toolScore),
      reliabilityScore: Math.round(reliabilityScore),
      finalScore: Math.round(finalScore * 10) / 10,
    };
  }

  /** Normalize cost: 100 = best (cheapest), 0 = worst (most expensive) */
  private normalizeCost(cost: number): number {
    if (cost <= 0) return 100;
    const { best, worst } = ScoreCalculator.COST_REFERENCE;
    const score = 100 * (1 - (Math.log(cost) - Math.log(best)) / (Math.log(worst) - Math.log(best)));
    return Math.max(0, Math.min(100, score));
  }

  /** Normalize latency: 100 = fastest, 0 = slowest */
  private normalizeLatency(latencyMs: number): number {
    const { best, worst } = ScoreCalculator.LATENCY_REFERENCE;
    const score = 100 * (1 - (latencyMs - best) / (worst - best));
    return Math.max(0, Math.min(100, score));
  }

  /** Tool score: penalizes tool errors, rewards correct tool usage */
  private calculateToolScore(input: ScoreInput): number {
    if (input.toolCallsCount === 0) {
      // No tools required or used — neutral score
      return 80;
    }

    const successRate = input.successfulToolCalls / input.toolCallsCount;
    const errorPenalty = (input.toolErrorsCount / input.toolCallsCount) * 30;

    return Math.max(0, Math.min(100, successRate * 100 - errorPenalty));
  }

  /** Reliability score based on task success across trials */
  private calculateReliabilityScore(input: ScoreInput): number {
    const isSuccess = input.status === "completed";

    if (input.allRunsForTask.length === 0) {
      return isSuccess ? 80 : 20;
    }

    const successCount = input.allRunsForTask.filter(
      (r) => r.status === "completed"
    ).length;
    const successRate = successCount / input.allRunsForTask.length;

    return Math.round(successRate * 100);
  }
}

/**
 * Load score weights from environment variables.
 * Falls back to sensible defaults if not set.
 */
export function loadWeightsFromEnv(): ScoreWeights {
  return {
    quality: parseFloat(process.env.QUALITY_WEIGHT || "0.35"),
    cost: parseFloat(process.env.COST_WEIGHT || "0.20"),
    latency: parseFloat(process.env.LATENCY_WEIGHT || "0.15"),
    tool: parseFloat(process.env.TOOL_WEIGHT || "0.20"),
    reliability: parseFloat(process.env.RELIABILITY_WEIGHT || "0.10"),
  };
}

/**
 * ConsistencyCalculator computes cross-trial statistics.
 */
export class ConsistencyCalculator {
  static calculate(scores: number[]): {
    mean: number;
    stdDev: number;
    successRate: number;
    passAt1: number;
    passAt3: number;
  } {
    if (scores.length === 0) {
      return { mean: 0, stdDev: 0, successRate: 0, passAt1: 0, passAt3: 0 };
    }

    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const variance =
      scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const successThreshold = 60;
    const successes = scores.filter((s) => s >= successThreshold).length;
    const successRate = successes / scores.length;

    // pass@k approximation
    const passAt1 = successRate;
    const passAt3 =
      scores.length >= 3 ? 1 - Math.pow(1 - successRate, 3) : successRate;

    return {
      mean: Math.round(mean * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      successRate: Math.round(successRate * 100),
      passAt1: Math.round(passAt1 * 100),
      passAt3: Math.round(passAt3 * 100),
    };
  }
}
