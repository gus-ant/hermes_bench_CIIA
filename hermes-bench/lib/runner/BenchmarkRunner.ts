import { v4 as uuidv4 } from "uuid";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  BenchmarkDoc,
  RunDoc,
  ToolCallDoc,
  ScoreDoc,
  EvaluationDoc,
  ModelDoc,
  TaskDoc,
} from "@/lib/db/models";
import { MockExecutor, calculateCost } from "@/lib/runner/MockExecutor";
import { AutoEvaluator } from "@/lib/evaluator/AutoEvaluator";
import { ScoreCalculator } from "@/lib/scorer/ScoreCalculator";
import { BenchmarkConfig, BenchmarkProgress, ScoreWeights } from "@/lib/types";
import { allTasks } from "@/data/tasks";
import { modelsData } from "@/data/models";

/**
 * BenchmarkRunner orchestrates the full model × agent × task × trial matrix.
 * Supports MOCK_MODE (no real API calls) and real execution (stubs ready).
 */
export class BenchmarkRunner {
  private benchmarkId: string;
  private config: BenchmarkConfig;
  private isMockMode: boolean;
  private progressCallback?: (progress: BenchmarkProgress) => void;

  constructor(
    benchmarkId: string,
    config: BenchmarkConfig,
    progressCallback?: (progress: BenchmarkProgress) => void
  ) {
    this.benchmarkId = benchmarkId;
    this.config = config;
    this.isMockMode = process.env.MOCK_MODE === "true";
    this.progressCallback = progressCallback;
  }

  async run(): Promise<void> {
    await connectToDatabase();

    // Update benchmark status to running
    await BenchmarkDoc.findByIdAndUpdate(this.benchmarkId, { status: "running" });

    const tasks = allTasks.filter(
      (t) =>
        this.config.agents.includes(t.agent) &&
        (this.config.tasks.length === 0 || this.config.tasks.includes(t.id))
    );

    const models = modelsData.filter(
      (m) => this.config.models.includes(m.id) && m.enabled
    );

    const totalRuns = models.length * tasks.length * this.config.trials;
    let completedRuns = 0;
    let failedRuns = 0;

    // Build progress state
    const modelProgress: Record<string, { total: number; completed: number }> = {};
    for (const model of models) {
      modelProgress[model.id] = {
        total: tasks.length * this.config.trials,
        completed: 0,
      };
    }

    await BenchmarkDoc.findByIdAndUpdate(this.benchmarkId, { totalRuns });

    this.emitProgress({
      benchmarkId: this.benchmarkId,
      totalRuns,
      completedRuns: 0,
      failedRuns: 0,
      modelProgress,
      status: "running",
    });

    // Execute matrix: model × task × trial
    for (const model of models) {
      for (const task of tasks) {
        for (let trial = 1; trial <= this.config.trials; trial++) {
          const runId = uuidv4();

          try {
            // Execute run
            const executor = new MockExecutor(model.id);
            const result = await executor.execute(task);

            // Calculate cost from pricing config
            const cost = calculateCost(
              result.inputTokens,
              result.outputTokens,
              model.inputPricePer1M,
              model.outputPricePer1M
            );

            // Save run to DB
            const run = await RunDoc.create({
              runId,
              benchmarkId: this.benchmarkId,
              modelId: model.id,
              agent: task.agent,
              task: task.id,
              trial,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              totalTokens: result.totalTokens,
              latencyMs: result.latencyMs,
              timeToFirstTokenMs: result.timeToFirstTokenMs,
              toolCallsCount: result.toolCallsCount,
              toolErrorsCount: result.toolErrorsCount,
              successfulToolCalls: result.successfulToolCalls,
              answer: result.answer,
              cost,
              status: result.status,
              error: result.error,
              timestamp: new Date(),
              benchmarkVersion: "v1.0",
              modelVersion: model.version,
              promptVersion: task.prompt_version,
              taskVersion: task.task_version,
              evaluationVersion: "1.0",
            });

            // Save tool calls
            if (result.toolCalls.length > 0) {
              await ToolCallDoc.insertMany(
                result.toolCalls.map((tc) => ({ ...tc, runId }))
              );
            }

            // Auto-evaluate if completed
            if (result.status === "completed") {
              const evaluator = new AutoEvaluator();
              const evaluation = await evaluator.evaluate(task, result);

              await EvaluationDoc.create({
                runId,
                method: "auto",
                qualityScore: evaluation.qualityScore,
                reasoningSummary: evaluation.reasoningSummary,
                criteriaScores: evaluation.criteriaScores,
                evaluatedAt: new Date(),
                evaluationVersion: "1.0",
              });

              // Calculate scores
              const scorer = new ScoreCalculator(this.config.weights);
              const scores = scorer.calculate({
                qualityScore: evaluation.qualityScore,
                cost,
                latencyMs: result.latencyMs,
                toolCallsCount: result.toolCallsCount,
                toolErrorsCount: result.toolErrorsCount,
                successfulToolCalls: result.successfulToolCalls,
                status: result.status,
                allRunsForTask: [], // filled in consistency pass
              });

              await ScoreDoc.create({
                runId,
                benchmarkId: this.benchmarkId,
                modelId: model.id,
                agent: task.agent,
                task: task.id,
                trial,
                ...scores,
                weights: this.config.weights,
                calculatedAt: new Date(),
              });

              // Update run with scores
              await RunDoc.findOneAndUpdate(
                { runId },
                {
                  qualityScore: evaluation.qualityScore,
                  finalScore: scores.finalScore,
                }
              );
            }

            completedRuns++;
            modelProgress[model.id].completed++;

            if (result.status !== "completed") failedRuns++;
          } catch (err) {
            failedRuns++;
            completedRuns++;
            modelProgress[model.id].completed++;

            // Save failed run
            await RunDoc.create({
              runId,
              benchmarkId: this.benchmarkId,
              modelId: model.id,
              agent: task.agent,
              task: task.id,
              trial,
              status: "failed",
              error: err instanceof Error ? err.message : "Unknown error",
              errorCategory: "api_error",
              answer: "",
              cost: 0,
              timestamp: new Date(),
              benchmarkVersion: "v1.0",
              modelVersion: model.version,
              promptVersion: task.prompt_version,
              taskVersion: task.task_version,
              evaluationVersion: "1.0",
            });
          }

          // Update DB progress
          await BenchmarkDoc.findByIdAndUpdate(this.benchmarkId, {
            completedRuns,
          });

          this.emitProgress({
            benchmarkId: this.benchmarkId,
            totalRuns,
            completedRuns,
            failedRuns,
            currentRun: { model: model.id, task: task.id, trial },
            modelProgress: { ...modelProgress },
            status: "running",
          });

          // Small delay between runs to avoid overwhelming in real mode
          if (!this.isMockMode) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      }
    }

    // Mark benchmark as completed
    await BenchmarkDoc.findByIdAndUpdate(this.benchmarkId, {
      status: "completed",
      completedRuns,
    });

    this.emitProgress({
      benchmarkId: this.benchmarkId,
      totalRuns,
      completedRuns,
      failedRuns,
      modelProgress: { ...modelProgress },
      status: "completed",
    });
  }

  private emitProgress(progress: BenchmarkProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}
