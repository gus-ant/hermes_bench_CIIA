import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BenchmarkDoc, RunDoc } from "@/lib/db/models";
import { modelsData } from "@/data/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const benchmark = await BenchmarkDoc.findById(id).lean();
    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    }

    // Build per-model progress
    const modelProgress: Record<string, { total: number; completed: number }> = {};
    for (const modelId of benchmark.config.models) {
      const total = await RunDoc.countDocuments({ benchmarkId: id, modelId: modelId });
      const completed = await RunDoc.countDocuments({
        benchmarkId: id,
        modelId: modelId,
        status: { $in: ["completed", "failed", "timeout"] },
      });
      modelProgress[modelId] = { total, completed };
    }

    // Latest run for current indicator
    const latestRun = await RunDoc.findOne({ benchmarkId: id })
      .sort({ timestamp: -1 })
      .lean();

    return NextResponse.json({
      benchmarkId: id,
      totalRuns: benchmark.totalRuns,
      completedRuns: benchmark.completedRuns,
      failedRuns: 0,
      currentRun: latestRun
        ? { model: (latestRun as any).model, task: latestRun.task, trial: latestRun.trial }
        : undefined,
      modelProgress,
      status: benchmark.status,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
