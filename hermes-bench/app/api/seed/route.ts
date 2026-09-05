import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AgentDoc, ModelDoc, TaskDoc, RunDoc } from "@/lib/db/models";
import { agentsData } from "@/data/agents";
import { modelsData } from "@/data/models";
import { allTasks } from "@/data/tasks/index";

/**
 * POST /api/seed
 * Seeds the database with agents, models, and tasks.
 * Safe to call multiple times (uses upsert-like behavior via delete + insert).
 */
export async function POST() {
  try {
    await connectToDatabase();

    // Seed agents
    await AgentDoc.deleteMany({});
    await AgentDoc.insertMany(agentsData);

    // Seed models
    await ModelDoc.deleteMany({});
    await ModelDoc.insertMany(modelsData);

    // Seed tasks
    await TaskDoc.deleteMany({});
    await TaskDoc.insertMany(allTasks);

    return NextResponse.json({
      success: true,
      seeded: {
        agents: agentsData.length,
        models: modelsData.length,
        tasks: allTasks.length,
      },
    });
  } catch (error) {
    console.error("Seed API error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const [agents, models, tasks, runs] = await Promise.all([
      AgentDoc.countDocuments(),
      ModelDoc.countDocuments(),
      TaskDoc.countDocuments(),
      RunDoc.countDocuments(),
    ]);
    return NextResponse.json({ agents, models, tasks, runs });
  } catch (error) {
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
