import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BenchmarkDoc } from "@/lib/db/models";
import { BenchmarkRunner } from "@/lib/runner/BenchmarkRunner";
import { loadWeightsFromEnv } from "@/lib/scorer/ScoreCalculator";
import { modelsData } from "@/data/models";
import { allTasks } from "@/data/tasks/index";
import { agentsData } from "@/data/agents";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const benchmarks = await BenchmarkDoc.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return NextResponse.json({ benchmarks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch benchmarks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      name,
      models: selectedModels = modelsData.map((m) => m.id),
      agents: selectedAgents = agentsData.map((a) => a.id),
      tasks: selectedTasks = [],
      trials = parseInt(process.env.DEFAULT_TRIALS || "3"),
      customWeights,
    } = body;

    const weights = customWeights || loadWeightsFromEnv();

    // Validate
    if (!name) {
      return NextResponse.json({ error: "Benchmark name is required" }, { status: 400 });
    }

    const validModels = selectedModels.filter((id: string) =>
      modelsData.find((m) => m.id === id && m.enabled)
    );
    if (validModels.length === 0) {
      return NextResponse.json({ error: "No valid models selected" }, { status: 400 });
    }

    const benchmark = await BenchmarkDoc.create({
      name,
      version: "1.0",
      benchmarkVersion: "v1.0",
      config: {
        models: validModels,
        agents: selectedAgents,
        tasks: selectedTasks,
        trials,
        weights,
        judgeModel: process.env.JUDGE_MODEL || "gpt-4o",
      },
      status: "draft",
      totalRuns: 0,
      completedRuns: 0,
    });

    return NextResponse.json({
      benchmark: {
        id: benchmark._id.toString(),
        name: benchmark.name,
        status: benchmark.status,
        config: benchmark.config,
      },
    });
  } catch (error) {
    console.error("Create benchmark error:", error);
    return NextResponse.json({ error: "Failed to create benchmark" }, { status: 500 });
  }
}
