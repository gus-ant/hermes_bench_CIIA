import { v4 as uuidv4 } from "uuid";
import { TaskDefinition, ScoreWeights, ModelDefinition } from "../lib/types";
import { MockExecutor, calculateCost } from "../lib/runner/MockExecutor";
import { getRealExecutor } from "../lib/runner/RealExecutor";
import { AutoEvaluator } from "../lib/evaluator/AutoEvaluator";
import { LLMJudgeEvaluator } from "./LLMJudgeEvaluator";
import { ScoreCalculator } from "../lib/scorer/ScoreCalculator";
import { SqliteStorage } from "./SqliteStorage";
import { CliReporter, ProgressState } from "./CliReporter";
import { allTasks } from "../data/tasks";
import { modelsData } from "../data/models";

export interface CliRunConfig {
  benchmarkId: string;
  modelIds: string[];
  agentIds: string[];
  taskIds: string[];
  trials: number;
  mode: "mock" | "real";
  judgeModel?: string;
  weights: ScoreWeights;
  verbose?: boolean;
  outputFormat?: "table" | "json" | "csv";
  dbPath?: string;
}

/**
 * CliRunner — orquestrador standalone para execução no terminal.
 *
 * Estratégia de paralelismo:
 *   - Modelos rodam em PARALELO (Promise.all por modelo)
 *   - Tasks dentro de cada modelo rodam em SÉRIE (sem rate limit)
 *   - Trials dentro de cada task rodam em SÉRIE
 *
 * Sem dependência de MongoDB ou servidor Next.js.
 */
export class CliRunner {
  private config: CliRunConfig;
  private storage: SqliteStorage;
  private reporter: CliReporter;

  // Estado compartilhado de progresso (todos os modelos escrevem aqui)
  private progress: ProgressState;

  constructor(config: CliRunConfig) {
    this.config = config;
    this.storage = new SqliteStorage(config.dbPath);
    this.reporter = new CliReporter(config.verbose ?? false);

    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      startTime: Date.now(),
      modelProgress: {},
    };
  }

  async run(): Promise<void> {
    const { benchmarkId, trials, mode, judgeModel, weights } = this.config;

    // Inicializa o banco SQLite (sql.js é assíncrono na inicialização)
    await this.storage.init();

    // Filtra tasks e modelos de acordo com a config
    const tasks = this.resolveTasks();
    const models = this.resolveModels();

    if (models.length === 0) {
      this.reporter.error("Nenhum modelo válido encontrado. Verifique os IDs informados.");
      return;
    }
    if (tasks.length === 0) {
      this.reporter.error("Nenhuma task encontrada para os agentes/tasks selecionados.");
      return;
    }

    const totalRuns = models.length * tasks.length * trials;

    // Inicializa estado de progresso
    this.progress.total = totalRuns;
    for (const model of models) {
      this.progress.modelProgress[model.id] = {
        total: tasks.length * trials,
        completed: 0,
        failed: 0,
      };
    }

    // Persiste o benchmark
    this.storage.createBenchmark({
      id: benchmarkId,
      name: `CLI Benchmark — ${new Date().toISOString()}`,
      models: models.map((m) => m.id),
      agents: this.config.agentIds,
      tasks: tasks.map((t) => t.id),
      trials,
      totalRuns,
    });

    // Banner
    this.reporter.printBanner(
      benchmarkId,
      models.map((m) => m.name),
      this.config.agentIds,
      trials,
      mode,
      judgeModel
    );
    this.reporter.updateProgress(this.progress);

    // Escolhe o avaliador
    const evaluator =
      judgeModel
        ? new LLMJudgeEvaluator(judgeModel)
        : new AutoEvaluator();

    const scorer = new ScoreCalculator(weights);

    // ── Execução: modelos em PARALELO, tasks em série ────────────────────
    await Promise.all(
      models.map((model) =>
        this.runModel(model, tasks, trials, mode, evaluator, scorer)
      )
    );

    // Finaliza
    this.storage.completeBenchmark(benchmarkId);

    // Leaderboard
    const leaderboardRows = this.storage.getLeaderboard(benchmarkId);
    const modelNames = Object.fromEntries(
      models.map((m) => [m.id, m.name])
    );
    this.reporter.printLeaderboard(
      leaderboardRows,
      modelNames,
      Date.now() - this.progress.startTime
    );

    // Exportação (se pedida)
    await this.handleExport();

    this.storage.close();
  }

  // ─── Executa todas as tasks de um modelo (série) ────────────────────────

  private async runModel(
    model: ModelDefinition,
    tasks: TaskDefinition[],
    trials: number,
    mode: "mock" | "real",
    evaluator: AutoEvaluator | LLMJudgeEvaluator,
    scorer: ScoreCalculator
  ): Promise<void> {
    const { benchmarkId, weights } = this.config;

    for (const task of tasks) {
      for (let trial = 1; trial <= trials; trial++) {
        const runId = uuidv4();

        // Atualiza display
        this.progress.currentModel = model.id;
        this.progress.currentTask = task.id;
        this.progress.currentTrial = trial;
        this.reporter.updateProgress(this.progress);

        let result;
        try {
          if (mode === "mock") {
            const executor = new MockExecutor(model.id);
            result = await executor.execute(task);
          } else {
            const executeReal = getRealExecutor(model.provider);
            const apiKey = this.getApiKey(model.provider);
            result = await executeReal(
              {
                modelIdentifier: model.modelIdentifier,
                endpoint: model.endpoint,
                apiKey,
                temperature: 0.7,
                maxTokens: 2048,
              },
              task
            );
          }

          const cost = calculateCost(
            result.inputTokens,
            result.outputTokens,
            model.inputPricePer1M,
            model.outputPricePer1M
          );

          // Salva o run
          this.storage.saveRun({
            id: runId,
            benchmarkId,
            modelId: model.id,
            agent: task.agent,
            task: task.id,
            trial,
            status: result.status,
            answer: result.answer,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            totalTokens: result.totalTokens,
            latencyMs: result.latencyMs,
            ttftMs: result.timeToFirstTokenMs,
            toolCallsCount: result.toolCallsCount,
            toolErrorsCount: result.toolErrorsCount,
            successfulToolCalls: result.successfulToolCalls,
            cost,
            error: result.error,
            reasoning: undefined,
          });

          // Avalia e pontua se completou
          if (result.status === "completed") {
            const evaluation = await evaluator.evaluate(task, result);

            this.storage.saveEvaluation({
              id: uuidv4(),
              runId,
              method: this.config.judgeModel ? "judge" : "auto",
              qualityScore: evaluation.qualityScore,
              reasoningSummary: evaluation.reasoningSummary,
              criteriaScores: evaluation.criteriaScores,
              judgeModel: this.config.judgeModel,
            });

            const scores = scorer.calculate({
              qualityScore: evaluation.qualityScore,
              cost,
              latencyMs: result.latencyMs,
              toolCallsCount: result.toolCallsCount,
              toolErrorsCount: result.toolErrorsCount,
              successfulToolCalls: result.successfulToolCalls,
              status: result.status,
              allRunsForTask: [],
            });

            this.storage.saveScore({
              id: uuidv4(),
              runId,
              benchmarkId,
              modelId: model.id,
              agent: task.agent,
              task: task.id,
              trial,
              ...scores,
            });

            this.storage.updateRunScores(runId, evaluation.qualityScore, scores.finalScore);

            this.reporter.logRunResult(
              model.id,
              task.id,
              trial,
              result.status,
              result.latencyMs,
              scores.finalScore
            );
          } else {
            this.reporter.logRunResult(model.id, task.id, trial, result.status, result.latencyMs);
          }

          // Contadores
          if (result.status !== "completed") {
            this.progress.failed++;
            this.progress.modelProgress[model.id].failed++;
          }
        } catch (err) {
          // Run com erro de exceção
          this.storage.saveRun({
            id: runId,
            benchmarkId,
            modelId: model.id,
            agent: task.agent,
            task: task.id,
            trial,
            status: "failed",
            answer: "",
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            latencyMs: 0,
            ttftMs: 0,
            toolCallsCount: 0,
            toolErrorsCount: 0,
            successfulToolCalls: 0,
            cost: 0,
            error: err instanceof Error ? err.message : "Unknown error",
            errorCategory: "api_error",
          });
          this.progress.failed++;
          this.progress.modelProgress[model.id].failed++;
          this.reporter.logRunResult(model.id, task.id, trial, "failed", 0);
        }

        this.progress.completed++;
        this.progress.modelProgress[model.id].completed++;
        this.storage.updateBenchmarkProgress(
          benchmarkId,
          this.progress.completed,
          this.progress.failed
        );
        this.reporter.updateProgress(this.progress);

        // Delay entre tasks em modo real (evita rate limit)
        if (mode === "real") {
          await delay(300);
        }
      }
    }
  }

  // ─── Resolução de tasks e modelos ────────────────────────────────────────

  private resolveTasks(): TaskDefinition[] {
    return allTasks.filter((t) => {
      const agentOk =
        this.config.agentIds.length === 0 ||
        this.config.agentIds.includes(t.agent);
      const taskOk =
        this.config.taskIds.length === 0 ||
        this.config.taskIds.includes(t.id);
      return agentOk && taskOk;
    });
  }

  private resolveModels(): ModelDefinition[] {
    return modelsData.filter(
      (m) =>
        m.enabled &&
        (this.config.modelIds.length === 0 ||
          this.config.modelIds.includes(m.id))
    );
  }

  // ─── Chave de API por provedor ────────────────────────────────────────────

  private getApiKey(provider: string): string {
    const map: Record<string, string> = {
      OpenAI: process.env.OPENAI_API_KEY || "",
      Google: process.env.GOOGLE_API_KEY || "",
      "Mistral AI": process.env.MISTRAL_API_KEY || "",
      "Alibaba Cloud": process.env.TOGETHER_API_KEY || "",
      Meta: process.env.TOGETHER_API_KEY || "",
      OpenRouter: process.env.OPENROUTER_API_KEY || "",
      DeepSeek: process.env.DEEPSEEK_API_KEY || "",
      SiliconFlow: process.env.SILICONFLOW_API_KEY || "",
      "Moonshot AI": process.env.MOONSHOT_API_KEY || "",
      "Zhipu AI": process.env.ZHIPU_API_KEY || "",
      "01.AI": process.env.SILICONFLOW_API_KEY || "",
    };
    return map[provider] || "";
  }

  // ─── Exportação ───────────────────────────────────────────────────────────

  private async handleExport(): Promise<void> {
    const fmt = this.config.outputFormat;
    if (!fmt || fmt === "table") return;

    const { default: fs } = await import("fs");
    const { default: path } = await import("path");

    const outDir = path.resolve(process.cwd(), "cli-results");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `bench-${this.config.benchmarkId.slice(0, 8)}-${timestamp}`;

    if (fmt === "json") {
      const data = this.storage.exportRunsToJson(this.config.benchmarkId);
      const outPath = path.join(outDir, `${fileName}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
      this.reporter.success(`Exportado: ${outPath}`);
    } else if (fmt === "csv") {
      const csv = this.storage.exportRunsToCsv(this.config.benchmarkId);
      const outPath = path.join(outDir, `${fileName}.csv`);
      fs.writeFileSync(outPath, csv);
      this.reporter.success(`Exportado: ${outPath}`);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
