/**
 * Seed script — populates the MongoDB database with:
 * - 3 agents
 * - 5 models
 * - 30 tasks
 * - Pricing configuration
 *
 * Run with: npx tsx scripts/seed.ts
 */

import mongoose from "mongoose";
import { AgentDoc, ModelDoc, TaskDoc } from "../lib/db/models";
import { agentsData } from "../data/agents";
import { modelsData } from "../data/models";
import { allTasks } from "../data/tasks/index";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hermes_bench";

async function seed() {
  console.log("🌱 Starting HERMES-BENCH seed...");
  console.log(`📡 Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // ─── Agents ─────────────────────────────────────────────────────────────
  console.log("\n👥 Seeding agents...");
  await AgentDoc.deleteMany({});
  const agents = await AgentDoc.insertMany(agentsData);
  console.log(`  ✅ ${agents.length} agents seeded`);

  // ─── Models ──────────────────────────────────────────────────────────────
  console.log("\n🤖 Seeding models...");
  await ModelDoc.deleteMany({});
  const models = await ModelDoc.insertMany(modelsData);
  console.log(`  ✅ ${models.length} models seeded:`);
  models.forEach((m) => console.log(`     - ${m.name} (${m.provider})`));

  // ─── Tasks ───────────────────────────────────────────────────────────────
  console.log("\n📋 Seeding tasks...");
  await TaskDoc.deleteMany({});
  const tasks = await TaskDoc.insertMany(allTasks);
  console.log(`  ✅ ${tasks.length} tasks seeded:`);

  const byAgent: Record<string, number> = {};
  tasks.forEach((t) => {
    byAgent[t.agent] = (byAgent[t.agent] || 0) + 1;
  });
  Object.entries(byAgent).forEach(([agent, count]) => {
    console.log(`     - ${agent}: ${count} tasks`);
  });

  const byDifficulty: Record<string, number> = {};
  tasks.forEach((t) => {
    byDifficulty[t.difficulty] = (byDifficulty[t.difficulty] || 0) + 1;
  });
  console.log("  📊 By difficulty:");
  Object.entries(byDifficulty).forEach(([diff, count]) => {
    console.log(`     - ${diff}: ${count} tasks`);
  });

  console.log("\n🎉 Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total agents: ${agents.length}`);
  console.log(`Total models: ${models.length}`);
  console.log(`Total tasks:  ${tasks.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
