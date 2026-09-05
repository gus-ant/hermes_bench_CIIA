import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Model Schema ─────────────────────────────────────────────────────────

export interface IModel extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const ModelSchema = new Schema<IModel>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    provider: { type: String, required: true },
    version: { type: String, required: true },
    parameterCount: { type: String },
    contextWindow: { type: Number },
    inputPricePer1M: { type: Number, required: true },
    outputPricePer1M: { type: Number, required: true },
    endpoint: { type: String },
    modelIdentifier: { type: String, required: true },
    supportsToolCalling: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    color: { type: String, default: "#6366F1" },
    description: { type: String },
  },
  { timestamps: true }
);

export const ModelDoc: Model<IModel> =
  mongoose.models.Model || mongoose.model<IModel>("Model", ModelSchema);

// ─── Agent Schema ─────────────────────────────────────────────────────────

export interface IAgent extends Document {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  taskCodes: string[];
  highlights: string[];
}

const AgentSchema = new Schema<IAgent>({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  color: { type: String },
  taskCodes: [{ type: String }],
  highlights: [{ type: String }],
});

export const AgentDoc: Model<IAgent> =
  mongoose.models.Agent || mongoose.model<IAgent>("Agent", AgentSchema);

// ─── Task Schema ──────────────────────────────────────────────────────────

export interface ITask extends Document {
  id: string;
  agent: string;
  title: string;
  description: string;
  difficulty: string;
  context: string;
  input: string;
  tools: string[];
  expected_behavior: string;
  expected_output: string;
  evaluation_criteria: string[];
  prompt_version: string;
  task_version: string;
}

const TaskSchema = new Schema<ITask>({
  id: { type: String, required: true, unique: true },
  agent: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  difficulty: { type: String, enum: ["facil", "medio", "dificil", "muito_dificil"] },
  context: { type: String },
  input: { type: String, required: true },
  tools: [{ type: String }],
  expected_behavior: { type: String },
  expected_output: { type: String },
  evaluation_criteria: [{ type: String }],
  prompt_version: { type: String, default: "1.0" },
  task_version: { type: String, default: "1.0" },
});

export const TaskDoc: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

// ─── Benchmark Schema ─────────────────────────────────────────────────────

export interface IBenchmark extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  version: string;
  benchmarkVersion: string;
  config: {
    models: string[];
    agents: string[];
    tasks: string[];
    trials: number;
    weights: {
      quality: number;
      cost: number;
      latency: number;
      tool: number;
      reliability: number;
    };
    judgeModel?: string;
  };
  status: string;
  totalRuns: number;
  completedRuns: number;
  createdAt: Date;
  updatedAt: Date;
}

const BenchmarkSchema = new Schema<IBenchmark>(
  {
    name: { type: String, required: true },
    version: { type: String, default: "1.0" },
    benchmarkVersion: { type: String, default: "v1.0" },
    config: {
      models: [String],
      agents: [String],
      tasks: [String],
      trials: { type: Number, default: 3 },
      weights: {
        quality: { type: Number, default: 0.35 },
        cost: { type: Number, default: 0.2 },
        latency: { type: Number, default: 0.15 },
        tool: { type: Number, default: 0.2 },
        reliability: { type: Number, default: 0.1 },
      },
      judgeModel: String,
    },
    status: {
      type: String,
      enum: ["draft", "running", "completed", "cancelled"],
      default: "draft",
    },
    totalRuns: { type: Number, default: 0 },
    completedRuns: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BenchmarkDoc: Model<IBenchmark> =
  mongoose.models.Benchmark || mongoose.model<IBenchmark>("Benchmark", BenchmarkSchema);

// ─── Run Schema ───────────────────────────────────────────────────────────

export interface IRun extends Document {
  _id: mongoose.Types.ObjectId;
  runId: string;
  benchmarkId: string;
  modelId: string;
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
  status: string;
  error?: string;
  errorCategory?: string;
  timestamp: Date;
  benchmarkVersion: string;
  modelVersion: string;
  promptVersion: string;
  taskVersion: string;
  evaluationVersion: string;
}

const RunSchema = new Schema<IRun>({
  runId: { type: String, required: true, unique: true, index: true },
  benchmarkId: { type: String, required: true, index: true },
  modelId: { type: String, required: true, index: true },
  agent: { type: String, required: true, index: true },
  task: { type: String, required: true, index: true },
  trial: { type: Number, required: true },
  inputTokens: { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  timeToFirstTokenMs: { type: Number },
  toolCallsCount: { type: Number, default: 0 },
  toolErrorsCount: { type: Number, default: 0 },
  successfulToolCalls: { type: Number, default: 0 },
  answer: { type: String, default: "" },
  cost: { type: Number, default: 0 },
  qualityScore: { type: Number },
  finalScore: { type: Number },
  status: {
    type: String,
    enum: ["pending", "running", "completed", "failed", "timeout"],
    default: "pending",
  },
  error: { type: String },
  errorCategory: { type: String },
  timestamp: { type: Date, default: Date.now },
  benchmarkVersion: { type: String, default: "v1.0" },
  modelVersion: { type: String, default: "1.0" },
  promptVersion: { type: String, default: "1.0" },
  taskVersion: { type: String, default: "1.0" },
  evaluationVersion: { type: String, default: "1.0" },
});

export const RunDoc: Model<IRun> =
  mongoose.models.Run || mongoose.model<IRun>("Run", RunSchema);

// ─── Tool Call Schema ─────────────────────────────────────────────────────

export interface IToolCall extends Document {
  runId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  success: boolean;
  error?: string;
  durationMs: number;
  sequence: number;
}

const ToolCallSchema = new Schema<IToolCall>({
  runId: { type: String, required: true, index: true },
  toolName: { type: String, required: true },
  args: { type: Schema.Types.Mixed },
  result: { type: Schema.Types.Mixed },
  success: { type: Boolean, default: false },
  error: { type: String },
  durationMs: { type: Number, default: 0 },
  sequence: { type: Number, required: true },
});

export const ToolCallDoc: Model<IToolCall> =
  mongoose.models.ToolCall || mongoose.model<IToolCall>("ToolCall", ToolCallSchema);

// ─── Evaluation Schema ────────────────────────────────────────────────────

export interface IEvaluation extends Document {
  runId: string;
  method: string;
  qualityScore: number;
  reasoningSummary: string;
  criteriaScores: Array<{ criterion: string; score: number; reasoning: string }>;
  judgeModel?: string;
  evaluatedAt: Date;
  evaluationVersion: string;
}

const EvaluationSchema = new Schema<IEvaluation>({
  runId: { type: String, required: true, index: true },
  method: { type: String, enum: ["auto", "judge", "manual"], default: "auto" },
  qualityScore: { type: Number, required: true },
  reasoningSummary: { type: String },
  criteriaScores: [
    {
      criterion: String,
      score: Number,
      reasoning: String,
    },
  ],
  judgeModel: { type: String },
  evaluatedAt: { type: Date, default: Date.now },
  evaluationVersion: { type: String, default: "1.0" },
});

export const EvaluationDoc: Model<IEvaluation> =
  mongoose.models.Evaluation ||
  mongoose.model<IEvaluation>("Evaluation", EvaluationSchema);

// ─── Score Schema ─────────────────────────────────────────────────────────

export interface IScore extends Document {
  runId: string;
  benchmarkId: string;
  modelId: string;
  agent: string;
  task: string;
  trial: number;
  qualityScore: number;
  costScore: number;
  latencyScore: number;
  toolScore: number;
  reliabilityScore: number;
  finalScore: number;
  weights: {
    quality: number;
    cost: number;
    latency: number;
    tool: number;
    reliability: number;
  };
  calculatedAt: Date;
}

const ScoreSchema = new Schema<IScore>({
  runId: { type: String, required: true, unique: true, index: true },
  benchmarkId: { type: String, required: true, index: true },
  modelId: { type: String, required: true, index: true },
  agent: { type: String, required: true },
  task: { type: String, required: true },
  trial: { type: Number, required: true },
  qualityScore: { type: Number, default: 0 },
  costScore: { type: Number, default: 0 },
  latencyScore: { type: Number, default: 0 },
  toolScore: { type: Number, default: 0 },
  reliabilityScore: { type: Number, default: 0 },
  finalScore: { type: Number, default: 0 },
  weights: {
    quality: { type: Number },
    cost: { type: Number },
    latency: { type: Number },
    tool: { type: Number },
    reliability: { type: Number },
  },
  calculatedAt: { type: Date, default: Date.now },
});

export const ScoreDoc: Model<IScore> =
  mongoose.models.Score || mongoose.model<IScore>("Score", ScoreSchema);
