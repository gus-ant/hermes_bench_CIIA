/**
 * run_benchmark.ts — Script de execução via MongoDB (modo legado / integrado ao dashboard).
 *
 * ⚠  ATENÇÃO: Para execuções leves no terminal SEM servidor Next.js nem MongoDB,
 *    use o CLI Runner standalone:
 *
 *      npm run cli -- --help
 *      npm run cli -- --mock
 *      npm run cli -- --models deepseek-v3,qwen-max --agents capacitacao --mode real
 *
 *    O CLI salva os resultados em SQLite (cli-results/results.db) e imprime
 *    um leaderboard direto no terminal, consumindo muito menos memória RAM.
 */
import fs from "fs";
import path from "path";
import dns from "dns";
import mongoose from "mongoose";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}
import { connectToDatabase } from "../lib/db/mongoose";
import { BenchmarkDoc } from "../lib/db/models";
import { BenchmarkRunner } from "../lib/runner/BenchmarkRunner";
import { modelsData } from "../data/models";
import { agentsData } from "../data/agents";
import { allTasks } from "../data/tasks";

async function main() {
  console.log("🚀 Starting HERMES-BENCH execution script...");

  // Load .env.local if present
  const envLocalPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envLocalPath)) {
    const envConfig = fs.readFileSync(envLocalPath, "utf-8");
    for (const line of envConfig.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...values] = trimmed.split("=");
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join("=").trim();
        }
      }
    }
  }

  await connectToDatabase();

  const benchmark = await BenchmarkDoc.create({
    name: `CLI Benchmark Run - ${new Date().toISOString()}`,
    version: "1.0",
    benchmarkVersion: "v1.0",
    config: {
      models: modelsData.map((m) => m.id),
      agents: agentsData.map((a) => a.id),
      tasks: allTasks.map((t) => t.id),
      trials: 1,
      weights: {
        quality: 0.35,
        cost: 0.20,
        latency: 0.15,
        tool: 0.20,
        reliability: 0.10,
      },
    },
    status: "draft",
    totalRuns: 0,
    completedRuns: 0,
  });

  const benchmarkId = (benchmark._id as mongoose.Types.ObjectId).toString();
  console.log(`\n✅ Benchmark created with ID: ${benchmarkId}`);

  let lastCompleted = -1;
  const runner = new BenchmarkRunner(benchmarkId, benchmark.config, (progress) => {
    if (progress.completedRuns !== lastCompleted) {
      lastCompleted = progress.completedRuns;
      console.log(
        ` progress: [${progress.completedRuns}/${progress.totalRuns}] runs completed (Failed: ${progress.failedRuns})`
      );
    }
  });

  console.log("\n▶ Executing benchmark runner...");
  await runner.run();

  console.log("\n🎉 Benchmark execution complete!");
  const finalBm = await BenchmarkDoc.findById(benchmarkId);
  console.log(`Status: ${finalBm?.status}`);
  console.log(`Completed runs: ${finalBm?.completedRuns} / ${finalBm?.totalRuns}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Benchmark execution failed:", err);
  process.exit(1);
});
