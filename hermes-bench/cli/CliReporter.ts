import { LeaderboardRow } from "./SqliteStorage";

/**
 * CliReporter — output visual rico no terminal.
 * Usa apenas ANSI escape codes nativos do Node.js (sem dependências extras).
 * Desativa cores automaticamente se o stdout não for um TTY.
 */

const IS_TTY = process.stdout.isTTY ?? false;
const NO_COLOR = process.env.NO_COLOR !== undefined || !IS_TTY;

// ─── ANSI ─────────────────────────────────────────────────────────────────

const C = {
  reset:   NO_COLOR ? "" : "\x1b[0m",
  bold:    NO_COLOR ? "" : "\x1b[1m",
  dim:     NO_COLOR ? "" : "\x1b[2m",
  green:   NO_COLOR ? "" : "\x1b[32m",
  yellow:  NO_COLOR ? "" : "\x1b[33m",
  blue:    NO_COLOR ? "" : "\x1b[34m",
  cyan:    NO_COLOR ? "" : "\x1b[36m",
  magenta: NO_COLOR ? "" : "\x1b[35m",
  red:     NO_COLOR ? "" : "\x1b[31m",
  gray:    NO_COLOR ? "" : "\x1b[90m",
  white:   NO_COLOR ? "" : "\x1b[97m",
};

// ─── Progress State ────────────────────────────────────────────────────────

export interface ProgressState {
  total: number;
  completed: number;
  failed: number;
  currentModel?: string;
  currentTask?: string;
  currentTrial?: number;
  startTime: number;
  modelProgress: Record<string, { total: number; completed: number; failed: number }>;
}

export class CliReporter {
  private lastLineCount = 0;
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  // ─── Banner de Início ──────────────────────────────────────────────────

  printBanner(
    benchmarkId: string,
    models: string[],
    agents: string[],
    trials: number,
    mode: string,
    judgeModel?: string
  ): void {
    const line = "─".repeat(60);
    process.stdout.write(
      `\n${C.bold}${C.cyan}╔════════════════════════════════════════════════════════════╗${C.reset}\n` +
      `${C.bold}${C.cyan}║          HERMES-BENCH CLI Runner v1.0                      ║${C.reset}\n` +
      `${C.bold}${C.cyan}╚════════════════════════════════════════════════════════════╝${C.reset}\n\n` +
      `${C.gray}ID        : ${C.reset}${C.white}${benchmarkId}${C.reset}\n` +
      `${C.gray}Modelos   : ${C.reset}${C.yellow}${models.join(", ")}${C.reset}\n` +
      `${C.gray}Agentes   : ${C.reset}${C.cyan}${agents.join(", ")}${C.reset}\n` +
      `${C.gray}Trials    : ${C.reset}${trials}\n` +
      `${C.gray}Modo      : ${C.reset}${mode === "mock" ? `${C.magenta}MOCK${C.reset}` : `${C.green}REAL${C.reset}`}\n` +
      (judgeModel ? `${C.gray}Judge     : ${C.reset}${C.blue}${judgeModel}${C.reset}\n` : "") +
      `\n${C.gray}${line}${C.reset}\n\n`
    );
  }

  // ─── Progresso (sobrescreve a linha anterior) ─────────────────────────

  updateProgress(state: ProgressState): void {
    if (!IS_TTY) {
      // Em modo não-TTY (pipe, CI), imprime linha simples
      process.stdout.write(
        `[${state.completed}/${state.total}] ` +
        (state.currentModel ? `${state.currentModel} @ ${state.currentTask} T${state.currentTrial}` : "") +
        (state.failed > 0 ? ` | falhas: ${state.failed}` : "") +
        "\n"
      );
      return;
    }

    // Limpa as linhas anteriores
    this.clearPreviousLines();

    const pct = state.total > 0 ? state.completed / state.total : 0;
    const barWidth = 35;
    const filled = Math.round(pct * barWidth);
    const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

    const elapsed = (Date.now() - state.startTime) / 1000;
    const eta =
      pct > 0 && pct < 1
        ? formatDuration(((elapsed / pct) * (1 - pct)))
        : "--:--";

    const lines: string[] = [];

    lines.push(
      `${C.bold}Progresso:${C.reset} ${C.cyan}[${bar}]${C.reset} ` +
      `${C.bold}${state.completed}${C.reset}/${state.total} runs ` +
      `${C.gray}| falhas: ${state.failed} | ETA: ${eta}${C.reset}`
    );

    if (state.currentModel) {
      lines.push(
        `${C.gray}  Executando:${C.reset} ` +
        `${C.yellow}${state.currentModel}${C.reset}` +
        ` ${C.gray}→${C.reset} ` +
        `${C.cyan}${state.currentTask}${C.reset} ` +
        `${C.gray}(trial ${state.currentTrial})${C.reset}`
      );
    }

    // Progresso por modelo
    for (const [modelId, mp] of Object.entries(state.modelProgress)) {
      const mPct = mp.total > 0 ? mp.completed / mp.total : 0;
      const mBarWidth = 20;
      const mFilled = Math.round(mPct * mBarWidth);
      const mBar = "▪".repeat(mFilled) + "·".repeat(mBarWidth - mFilled);
      const failLabel = mp.failed > 0 ? ` ${C.red}✗${mp.failed}${C.reset}` : "";
      lines.push(
        `  ${C.gray}${modelId.padEnd(30)}${C.reset} ${C.dim}[${mBar}]${C.reset} ` +
        `${mp.completed}/${mp.total}${failLabel}`
      );
    }

    process.stdout.write(lines.join("\n") + "\n");
    this.lastLineCount = lines.length;
  }

  private clearPreviousLines(): void {
    if (this.lastLineCount === 0) return;
    // Move cursor up and clear lines
    for (let i = 0; i < this.lastLineCount; i++) {
      process.stdout.write("\x1b[1A\x1b[2K");
    }
    this.lastLineCount = 0;
  }

  // ─── Log de run individual ────────────────────────────────────────────

  logRunResult(
    modelId: string,
    taskId: string,
    trial: number,
    status: string,
    latencyMs: number,
    finalScore?: number
  ): void {
    if (!this.verbose) return;
    const icon = status === "completed" ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
    const scoreStr =
      finalScore !== undefined
        ? ` ${C.yellow}score=${finalScore.toFixed(1)}${C.reset}`
        : "";
    process.stdout.write(
      `  ${icon} ${C.bold}${modelId}${C.reset} / ${C.cyan}${taskId}${C.reset}` +
      ` T${trial} — ${latencyMs}ms${scoreStr}\n`
    );
  }

  // ─── Tabela de Leaderboard Final ──────────────────────────────────────

  printLeaderboard(
    rows: LeaderboardRow[],
    modelNames: Record<string, string>,
    elapsedMs: number
  ): void {
    if (!IS_TTY) {
      this.clearPreviousLines();
    } else {
      this.clearPreviousLines();
    }

    const elapsed = formatDuration(elapsedMs / 1000);
    process.stdout.write(
      `\n${C.bold}${C.green}✅ Benchmark concluído em ${elapsed}${C.reset}\n\n` +
      `${C.bold}${C.white}🏆 LEADERBOARD FINAL${C.reset}\n` +
      `${C.gray}${"─".repeat(95)}${C.reset}\n`
    );

    // Cabeçalho
    process.stdout.write(
      `${C.bold}` +
      `${"#".padEnd(3)} ` +
      `${"Modelo".padEnd(28)} ` +
      `${"Score".padStart(7)} ` +
      `${"Qualidade".padStart(10)} ` +
      `${"Tool".padStart(6)} ` +
      `${"Latência".padStart(10)} ` +
      `${"Custo/run".padStart(10)} ` +
      `${"Sucesso".padStart(8)} ` +
      `${"Runs".padStart(5)}` +
      `${C.reset}\n` +
      `${C.gray}${"─".repeat(95)}${C.reset}\n`
    );

    rows.forEach((row, idx) => {
      const name = modelNames[row.model_id] || row.model_id;
      const successRate =
        row.total_runs > 0
          ? ((row.completed_runs / row.total_runs) * 100).toFixed(0) + "%"
          : "—";
      const avgCost =
        row.avg_cost > 0 ? `$${row.avg_cost.toFixed(5)}` : "FREE";
      const score = row.avg_final_score?.toFixed(1) ?? "—";
      const quality = row.avg_quality?.toFixed(1) ?? "—";
      const toolScore = row.avg_tool_score?.toFixed(1) ?? "—";
      const latency =
        row.avg_latency_ms > 0 ? `${Math.round(row.avg_latency_ms)}ms` : "—";

      const rankColor =
        idx === 0 ? C.yellow : idx === 1 ? C.gray : idx === 2 ? C.magenta : C.reset;

      process.stdout.write(
        `${rankColor}${String(idx + 1).padEnd(3)}${C.reset} ` +
        `${C.bold}${name.slice(0, 27).padEnd(28)}${C.reset} ` +
        `${C.cyan}${score.padStart(7)}${C.reset} ` +
        `${quality.padStart(10)} ` +
        `${toolScore.padStart(6)} ` +
        `${latency.padStart(10)} ` +
        `${avgCost.padStart(10)} ` +
        `${successRate.padStart(8)} ` +
        `${String(row.total_runs).padStart(5)}\n`
      );
    });

    process.stdout.write(`${C.gray}${"─".repeat(95)}${C.reset}\n\n`);
  }

  // ─── Mensagens de Status ──────────────────────────────────────────────

  info(msg: string): void {
    process.stdout.write(`${C.blue}ℹ${C.reset}  ${msg}\n`);
  }

  success(msg: string): void {
    process.stdout.write(`${C.green}✓${C.reset}  ${msg}\n`);
  }

  warn(msg: string): void {
    process.stdout.write(`${C.yellow}⚠${C.reset}  ${msg}\n`);
  }

  error(msg: string): void {
    process.stderr.write(`${C.red}✗${C.reset}  ${msg}\n`);
  }
}

// ─── Utilitários ──────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
