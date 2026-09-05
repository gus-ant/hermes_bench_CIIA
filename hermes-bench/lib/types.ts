// ─── Core Domain Types ────────────────────────────────────────────────────

export type Difficulty = "facil" | "medio" | "dificil" | "muito_dificil";
export type RunStatus = "pending" | "running" | "completed" | "failed" | "timeout";
export type EvaluationMethod = "auto" | "judge" | "manual";
export type BenchmarkStatus = "draft" | "running" | "completed" | "cancelled";
export type ErrorCategory =
  | "wrong_answer"
  | "tool_error"
  | "invalid_tool_call"
  | "hallucination"
  | "incomplete_task"
  | "timeout"
  | "api_error"
  | "parsing_error"
  | "safety_error";

// ─── Task ─────────────────────────────────────────────────────────────────

export interface TaskDefinition {
  id: string;
  agent: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  context: string;
  input: string;
  tools: string[];
  expected_behavior: string;
  expected_output: string;
  evaluation_criteria: string[];
  prompt_version: string;
  task_version: string;
}

// ─── Model ────────────────────────────────────────────────────────────────

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  version: string;
  parameterCount: string;
  contextWindow: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  endpoint: string;
  modelIdentifier: string;
  supportsToolCalling: boolean;
  enabled: boolean;
  color: string;
  description: string;
}

// ─── Agent ────────────────────────────────────────────────────────────────

export interface AgentDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  taskCodes: string[];
  highlights: string[];
}

// ─── Benchmark ────────────────────────────────────────────────────────────

export interface BenchmarkConfig {
  models: string[];
  agents: string[];
  tasks: string[];
  trials: number;
  weights: ScoreWeights;
  judgeModel?: string;
}

export interface BenchmarkDocument {
  _id: string;
  name: string;
  version: string;
  benchmarkVersion: string;
  config: BenchmarkConfig;
  status: BenchmarkStatus;
  totalRuns: number;
  completedRuns: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Tool Call ────────────────────────────────────────────────────────────

export interface ToolCallRecord {
  _id?: string;
  runId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  success: boolean;
  error?: string;
  durationMs: number;
  sequence: number;
}

// ─── Run ──────────────────────────────────────────────────────────────────

export interface RunDocument {
  _id: string;
  runId: string;
  benchmarkId: string;
  model: string;
  agent: string;
  task: string;
  trial: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  timeToFirstTokenMs?: number;
  toolCallsCount: number;
  toolErrorsCount: number;
  successfulToolCalls: number;
  answer: string;
  cost: number;
  qualityScore?: number;
  finalScore?: number;
  status: RunStatus;
  error?: string;
  errorCategory?: ErrorCategory;
  timestamp: Date;
  benchmarkVersion: string;
  modelVersion: string;
  promptVersion: string;
  taskVersion: string;
  evaluationVersion: string;
  toolCalls?: ToolCallRecord[];
}

// ─── Evaluation ───────────────────────────────────────────────────────────

export interface CriteriaScore {
  criterion: string;
  score: number;
  reasoning: string;
}

export interface EvaluationDocument {
  _id?: string;
  runId: string;
  method: EvaluationMethod;
  qualityScore: number;
  reasoningSummary: string;
  criteriaScores: CriteriaScore[];
  judgeModel?: string;
  evaluatedAt: Date;
  evaluationVersion: string;
}

// ─── Score ────────────────────────────────────────────────────────────────

export interface ScoreWeights {
  quality: number;
  cost: number;
  latency: number;
  tool: number;
  reliability: number;
}

export interface ScoreDocument {
  _id?: string;
  runId: string;
  benchmarkId: string;
  model: string;
  agent: string;
  task: string;
  trial: number;
  qualityScore: number;
  costScore: number;
  latencyScore: number;
  toolScore: number;
  reliabilityScore: number;
  finalScore: number;
  weights: ScoreWeights;
  calculatedAt: Date;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  modelId: string;
  modelName: string;
  provider: string;
  color: string;
  overallScore: number;
  qualityScore: number;
  successRate: number;
  avgCost: number;
  avgLatencyMs: number;
  toolReliability: number;
  totalRuns: number;
  completedRuns: number;
  totalCost: number;
  avgTokens: number;
}

// ─── Stats ────────────────────────────────────────────────────────────────

export interface OverviewStats {
  modelsTested: number;
  totalTasks: number;
  totalRuns: number;
  successRate: number;
  avgCost: number;
  avgLatencyMs: number;
  bestModel: string;
  bestModelScore: number;
  totalCost: number;
  runsByStatus: Record<RunStatus, number>;
}

// ─── Mock Executor ────────────────────────────────────────────────────────

export interface MockRunResult {
  answer: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  timeToFirstTokenMs: number;
  toolCallsCount: number;
  toolErrorsCount: number;
  successfulToolCalls: number;
  toolCalls: ToolCallRecord[];
  status: RunStatus;
  error?: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────

export interface BenchmarkProgress {
  benchmarkId: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  currentRun?: {
    model: string;
    task: string;
    trial: number;
  };
  modelProgress: Record<string, { total: number; completed: number }>;
  estimatedRemainingMs?: number;
  status: BenchmarkStatus;
}

// ─── Export ───────────────────────────────────────────────────────────────

export interface ExportOptions {
  format: "csv" | "json";
  benchmarkId?: string;
  modelIds?: string[];
  agentIds?: string[];
  includeToolCalls?: boolean;
  includeEvaluations?: boolean;
}
