#!/usr/bin/env node
/**
 * HERMES-BENCH CLI — Entry Point
 *
 * Uso:
 *   npx tsx cli/index.ts [opções]
 *   npm run cli -- [opções]
 *
 * Exemplos:
 *   npm run cli -- --mock
 *   npm run cli -- --models deepseek-v3,qwen-max --agents capacitacao --mode real
 *   npm run cli -- --mock --judge-model deepseek-v3 --output csv --verbose
 *   npm run cli -- --list-models
 *   npm run cli -- --list-agents
 */

import { Command } from "commander";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { CliRunner } from "./CliRunner";
import { modelsData } from "../data/models";
import { agentsData } from "../data/agents";
import { allTasks } from "../data/tasks";

// ─── Carrega .env.local ───────────────────────────────────────────────────

function loadEnv(): void {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// ─── Lista de Modelos / Agentes ───────────────────────────────────────────

function printModelsList(): void {
  console.log("\n📦 Modelos Disponíveis:\n");
  console.log(
    "  " +
    "ID".padEnd(32) +
    "Nome".padEnd(30) +
    "Provedor".padEnd(16) +
    "In/1M".padStart(8) +
    "Out/1M".padStart(8) +
    "  Tools"
  );
  console.log("  " + "─".repeat(100));
  for (const m of modelsData) {
    const inPrice = m.inputPricePer1M === 0 ? "FREE" : `$${m.inputPricePer1M}`;
    const outPrice = m.outputPricePer1M === 0 ? "FREE" : `$${m.outputPricePer1M}`;
    const tools = m.supportsToolCalling ? "✓" : "—";
    const thinking = m.supportsThinkingTags ? " 🧠" : "";
    console.log(
      `  ${(m.id + thinking).padEnd(32)}` +
      `${m.name.slice(0, 29).padEnd(30)}` +
      `${m.provider.slice(0, 15).padEnd(16)}` +
      `${inPrice.padStart(8)}` +
      `${outPrice.padStart(8)}` +
      `  ${tools}`
    );
  }
  console.log(
    "\n  🧠 = suporte a thinking tags (<think>) — raciocínio explícito\n"
  );
}

function printAgentsList(): void {
  console.log("\n🤖 Agentes Disponíveis:\n");
  for (const a of agentsData) {
    const taskCount = allTasks.filter((t) => t.agent === a.id).length;
    console.log(`  ${a.icon} ${a.id.padEnd(20)} ${a.name} (${taskCount} tasks)`);
  }
  console.log();
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const program = new Command();

  program
    .name("hermes-bench")
    .description("HERMES-BENCH CLI Runner — executa benchmarks no terminal sem servidor web.")
    .version("1.0.0");

  program
    .option("--mock", "Usa o MockExecutor (sem chamadas reais de API)", false)
    .option("--mode <mode>", "Modo de execução: mock | real (sobrepõe --mock)", "real")
    .option("--models <ids>", "IDs dos modelos separados por vírgula (padrão: todos)")
    .option("--agents <ids>", "IDs dos agentes separados por vírgula (padrão: todos)")
    .option("--tasks <ids>", "IDs das tasks separados por vírgula (padrão: todas)")
    .option("--trials <n>", "Número de trials por task", "1")
    .option(
      "--judge-model <model-id>",
      "Modelo a usar como juiz LLM-as-a-Judge (ex: deepseek-v3). Padrão: avaliador heurístico."
    )
    .option("--output <format>", "Formato de saída: table | json | csv", "table")
    .option("--db <path>", "Caminho para o arquivo SQLite (padrão: cli-results/results.db)")
    .option("--verbose", "Exibe resultado de cada run individualmente", false)
    .option("--list-models", "Lista todos os modelos disponíveis e encerra", false)
    .option("--list-agents", "Lista todos os agentes disponíveis e encerra", false);

  program.parse(process.argv);
  const opts = program.opts<{
    mock: boolean;
    mode: string;
    models?: string;
    agents?: string;
    tasks?: string;
    trials: string;
    judgeModel?: string;
    output: string;
    db?: string;
    verbose: boolean;
    listModels: boolean;
    listAgents: boolean;
  }>();

  // Comandos informativos
  if (opts.listModels) {
    printModelsList();
    process.exit(0);
  }
  if (opts.listAgents) {
    printAgentsList();
    process.exit(0);
  }

  // Resolve modo
  const mode: "mock" | "real" = opts.mock || opts.mode === "mock" ? "mock" : "real";

  // Resolve listas
  const modelIds = opts.models ? opts.models.split(",").map((s) => s.trim()) : [];
  const agentIds = opts.agents ? opts.agents.split(",").map((s) => s.trim()) : [];
  const taskIds = opts.tasks ? opts.tasks.split(",").map((s) => s.trim()) : [];
  const trials = Math.max(1, parseInt(opts.trials, 10) || 1);

  // Valida modelos informados
  if (modelIds.length > 0) {
    const knownIds = new Set(modelsData.map((m) => m.id));
    const unknown = modelIds.filter((id) => !knownIds.has(id));
    if (unknown.length > 0) {
      console.error(`\n❌ Modelos não reconhecidos: ${unknown.join(", ")}`);
      console.error("   Use --list-models para ver os IDs disponíveis.\n");
      process.exit(1);
    }
  }

  // Valida agentes informados
  if (agentIds.length > 0) {
    const knownIds = new Set(agentsData.map((a) => a.id));
    const unknown = agentIds.filter((id) => !knownIds.has(id));
    if (unknown.length > 0) {
      console.error(`\n❌ Agentes não reconhecidos: ${unknown.join(", ")}`);
      console.error("   Use --list-agents para ver os IDs disponíveis.\n");
      process.exit(1);
    }
  }

  const benchmarkId = uuidv4();

  const runner = new CliRunner({
    benchmarkId,
    modelIds,
    agentIds,
    taskIds,
    trials,
    mode,
    judgeModel: opts.judgeModel,
    weights: {
      quality:     parseFloat(process.env.QUALITY_WEIGHT     || "0.40"),
      tool:        parseFloat(process.env.TOOL_WEIGHT        || "0.25"),
      reliability: parseFloat(process.env.RELIABILITY_WEIGHT || "0.15"),
      latency:     parseFloat(process.env.LATENCY_WEIGHT     || "0.10"),
      cost:        parseFloat(process.env.COST_WEIGHT        || "0.10"),
    },
    verbose: opts.verbose,
    outputFormat: opts.output as "table" | "json" | "csv",
    dbPath: opts.db,
  });

  // Graceful shutdown ao Ctrl+C
  let shuttingDown = false;
  process.on("SIGINT", () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(
      "\n\n⚠  Interrompido pelo usuário (SIGINT). Os runs já completados foram salvos no SQLite.\n"
    );
    process.exit(0);
  });

  try {
    await runner.run();
  } catch (err) {
    console.error(
      "\n❌ Erro fatal no CliRunner:",
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  }
}

main();
