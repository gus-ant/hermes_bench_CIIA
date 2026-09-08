import initSqlJs, { Database } from "sql.js";
import path from "path";
import fs from "fs";

let _SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

async function getSqlJs() {
  if (!_SQL) {
    _SQL = await initSqlJs();
  }
  return _SQL;
}

/**
 * SqliteStorage — persistência leve para o CLI Runner usando sql.js (WebAssembly).
 * Zero dependências nativas (sem node-gyp). Compatível com qualquer Node.js.
 * Salva em hermes-bench/cli-results/results.db
 */
export class SqliteStorage {
  private db!: Database;
  private dbPath: string;
  private saveInterval: ReturnType<typeof setInterval> | null = null;

  constructor(dbPath?: string) {
    const dir = dbPath
      ? path.dirname(dbPath)
      : path.resolve(process.cwd(), "cli-results");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.dbPath = dbPath || path.join(dir, "results.db");
  }

  async init(): Promise<void> {
    const SQL = await getSqlJs();

    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    this.initSchema();

    // Persiste no disco a cada 5 segundos em background
    this.saveInterval = setInterval(() => this.persist(), 5000);
  }

  private persist(): void {
    if (!this.db) return;
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  private initSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS benchmarks (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        version     TEXT NOT NULL DEFAULT '1.0',
        status      TEXT NOT NULL DEFAULT 'running',
        models      TEXT NOT NULL,
        agents      TEXT NOT NULL,
        tasks       TEXT NOT NULL,
        trials      INTEGER NOT NULL DEFAULT 1,
        total_runs  INTEGER NOT NULL DEFAULT 0,
        done_runs   INTEGER NOT NULL DEFAULT 0,
        failed_runs INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runs (
        id                    TEXT PRIMARY KEY,
        benchmark_id          TEXT NOT NULL,
        model_id              TEXT NOT NULL,
        agent                 TEXT NOT NULL,
        task                  TEXT NOT NULL,
        trial                 INTEGER NOT NULL DEFAULT 1,
        status                TEXT NOT NULL,
        answer                TEXT,
        input_tokens          INTEGER DEFAULT 0,
        output_tokens         INTEGER DEFAULT 0,
        total_tokens          INTEGER DEFAULT 0,
        latency_ms            INTEGER DEFAULT 0,
        ttft_ms               INTEGER DEFAULT 0,
        tool_calls_count      INTEGER DEFAULT 0,
        tool_errors_count     INTEGER DEFAULT 0,
        successful_tool_calls INTEGER DEFAULT 0,
        cost                  REAL DEFAULT 0,
        quality_score         REAL,
        final_score           REAL,
        error                 TEXT,
        error_category        TEXT,
        reasoning             TEXT,
        timestamp             TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS evaluations (
        id                TEXT PRIMARY KEY,
        run_id            TEXT NOT NULL,
        method            TEXT NOT NULL DEFAULT 'auto',
        quality_score     REAL NOT NULL,
        reasoning_summary TEXT,
        criteria_scores   TEXT,
        judge_model       TEXT,
        evaluated_at      TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS scores (
        id                TEXT PRIMARY KEY,
        run_id            TEXT NOT NULL,
        benchmark_id      TEXT NOT NULL,
        model_id          TEXT NOT NULL,
        agent             TEXT NOT NULL,
        task              TEXT NOT NULL,
        trial             INTEGER NOT NULL DEFAULT 1,
        quality_score     REAL NOT NULL,
        cost_score        REAL NOT NULL,
        latency_score     REAL NOT NULL,
        tool_score        REAL NOT NULL,
        reliability_score REAL NOT NULL,
        final_score       REAL NOT NULL,
        calculated_at     TEXT NOT NULL
      );
    `);
  }

  // ─── Utilitário: run statement com binding ───────────────────────────────

  private run(sql: string, params: unknown[] = []): void {
    this.db.run(sql, params as Parameters<Database["run"]>[1]);
  }

  private query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as Parameters<Database["run"]>[1]);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return rows;
  }

  // ─── Benchmarks ──────────────────────────────────────────────────────────

  createBenchmark(params: {
    id: string;
    name: string;
    models: string[];
    agents: string[];
    tasks: string[];
    trials: number;
    totalRuns: number;
  }): void {
    const now = new Date().toISOString();
    this.run(
      `INSERT INTO benchmarks
       (id, name, version, status, models, agents, tasks, trials, total_runs, done_runs, failed_runs, created_at, updated_at)
       VALUES (?, ?, '1.0', 'running', ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [
        params.id,
        params.name,
        JSON.stringify(params.models),
        JSON.stringify(params.agents),
        JSON.stringify(params.tasks),
        params.trials,
        params.totalRuns,
        now,
        now,
      ]
    );
  }

  updateBenchmarkProgress(id: string, doneRuns: number, failedRuns: number): void {
    this.run(
      `UPDATE benchmarks SET done_runs = ?, failed_runs = ?, updated_at = ? WHERE id = ?`,
      [doneRuns, failedRuns, new Date().toISOString(), id]
    );
  }

  completeBenchmark(id: string): void {
    this.run(
      `UPDATE benchmarks SET status = 'completed', updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  }

  // ─── Runs ────────────────────────────────────────────────────────────────

  saveRun(params: {
    id: string;
    benchmarkId: string;
    modelId: string;
    agent: string;
    task: string;
    trial: number;
    status: string;
    answer: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latencyMs: number;
    ttftMs: number;
    toolCallsCount: number;
    toolErrorsCount: number;
    successfulToolCalls: number;
    cost: number;
    error?: string;
    errorCategory?: string;
    reasoning?: string;
  }): void {
    this.run(
      `INSERT INTO runs
       (id, benchmark_id, model_id, agent, task, trial, status, answer,
        input_tokens, output_tokens, total_tokens, latency_ms, ttft_ms,
        tool_calls_count, tool_errors_count, successful_tool_calls,
        cost, error, error_category, reasoning, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.id, params.benchmarkId, params.modelId, params.agent,
        params.task, params.trial, params.status, params.answer,
        params.inputTokens, params.outputTokens, params.totalTokens,
        params.latencyMs, params.ttftMs,
        params.toolCallsCount, params.toolErrorsCount, params.successfulToolCalls,
        params.cost, params.error ?? null, params.errorCategory ?? null,
        params.reasoning ?? null, new Date().toISOString(),
      ]
    );
  }

  updateRunScores(runId: string, qualityScore: number, finalScore: number): void {
    this.run(
      `UPDATE runs SET quality_score = ?, final_score = ? WHERE id = ?`,
      [qualityScore, finalScore, runId]
    );
  }

  // ─── Evaluations ─────────────────────────────────────────────────────────

  saveEvaluation(params: {
    id: string;
    runId: string;
    method: string;
    qualityScore: number;
    reasoningSummary: string;
    criteriaScores: unknown[];
    judgeModel?: string;
  }): void {
    this.run(
      `INSERT INTO evaluations
       (id, run_id, method, quality_score, reasoning_summary, criteria_scores, judge_model, evaluated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.id, params.runId, params.method, params.qualityScore,
        params.reasoningSummary, JSON.stringify(params.criteriaScores),
        params.judgeModel ?? null, new Date().toISOString(),
      ]
    );
  }

  // ─── Scores ──────────────────────────────────────────────────────────────

  saveScore(params: {
    id: string;
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
  }): void {
    this.run(
      `INSERT INTO scores
       (id, run_id, benchmark_id, model_id, agent, task, trial,
        quality_score, cost_score, latency_score, tool_score, reliability_score, final_score, calculated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.id, params.runId, params.benchmarkId, params.modelId,
        params.agent, params.task, params.trial,
        params.qualityScore, params.costScore, params.latencyScore,
        params.toolScore, params.reliabilityScore, params.finalScore,
        new Date().toISOString(),
      ]
    );
  }

  // ─── Leaderboard ─────────────────────────────────────────────────────────

  getLeaderboard(benchmarkId: string): LeaderboardRow[] {
    return this.query<LeaderboardRow>(
      `SELECT
        r.model_id,
        COUNT(*)                                                  AS total_runs,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END)  AS completed_runs,
        AVG(s.final_score)                                        AS avg_final_score,
        AVG(s.quality_score)                                      AS avg_quality,
        AVG(s.cost_score)                                         AS avg_cost_score,
        AVG(s.latency_score)                                      AS avg_latency_score,
        AVG(s.tool_score)                                         AS avg_tool_score,
        AVG(r.latency_ms)                                         AS avg_latency_ms,
        SUM(r.cost)                                               AS total_cost,
        AVG(r.cost)                                               AS avg_cost
       FROM runs r
       LEFT JOIN scores s ON r.id = s.run_id
       WHERE r.benchmark_id = ?
       GROUP BY r.model_id
       ORDER BY avg_final_score DESC`,
      [benchmarkId]
    );
  }

  // ─── Export ──────────────────────────────────────────────────────────────

  exportRunsToJson(benchmarkId: string): object[] {
    return this.query(
      `SELECT * FROM runs WHERE benchmark_id = ? ORDER BY timestamp`,
      [benchmarkId]
    );
  }

  exportRunsToCsv(benchmarkId: string): string {
    const runs = this.query<Record<string, unknown>>(
      `SELECT * FROM runs WHERE benchmark_id = ? ORDER BY timestamp`,
      [benchmarkId]
    );
    if (runs.length === 0) return "";
    const headers = Object.keys(runs[0]).join(",");
    const rows = runs.map((r) =>
      Object.values(r)
        .map((v) =>
          typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v ?? ""
        )
        .join(",")
    );
    return [headers, ...rows].join("\n");
  }

  // ─── Fecha e persiste ─────────────────────────────────────────────────────

  close(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    this.persist();
    this.db.close();
  }
}

export interface LeaderboardRow {
  model_id: string;
  total_runs: number;
  completed_runs: number;
  avg_final_score: number;
  avg_quality: number;
  avg_cost_score: number;
  avg_latency_score: number;
  avg_tool_score: number;
  avg_latency_ms: number;
  total_cost: number;
  avg_cost: number;
}
