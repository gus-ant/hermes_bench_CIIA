import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RunDoc, BenchmarkDoc } from "@/lib/db/models";
import { modelsData } from "@/data/models";
import { allTasks } from "@/data/tasks/index";

export async function GET() {
  try {
    await connectToDatabase();

    const [totalRuns, completedRuns, benchmarks] = await Promise.all([
      RunDoc.countDocuments(),
      RunDoc.countDocuments({ status: "completed" }),
      BenchmarkDoc.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Aggregate stats
    const pipeline = await RunDoc.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          avgCost: { $avg: "$cost" },
          avgLatency: { $avg: "$latencyMs" },
          totalCost: { $sum: "$cost" },
          avgQuality: { $avg: "$qualityScore" },
        },
      },
    ]);

    const agg = pipeline[0] || {
      avgCost: 0,
      avgLatency: 0,
      totalCost: 0,
      avgQuality: 0,
    };

    // Best model by average final score
    const modelScores = await RunDoc.aggregate([
      { $match: { status: "completed", finalScore: { $ne: null } } },
      {
        $group: {
          _id: "$model",
          avgScore: { $avg: "$finalScore" },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 1 },
    ]);

    const bestModelId = modelScores[0]?._id;
    const bestModel = modelsData.find((m) => m.id === bestModelId);

    // Run status breakdown
    const statusBreakdown = await RunDoc.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const runsByStatus: Record<string, number> = {};
    for (const item of statusBreakdown) {
      runsByStatus[item._id] = item.count;
    }

    const successRate =
      totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

    return NextResponse.json({
      modelsTested: modelsData.filter((m) => m.enabled).length,
      totalTasks: allTasks.length,
      totalRuns,
      successRate,
      avgCost: agg.avgCost || 0,
      avgLatencyMs: agg.avgLatency || 0,
      bestModel: bestModel?.name || null,
      bestModelScore: modelScores[0]?.avgScore || 0,
      totalCost: agg.totalCost || 0,
      avgQuality: agg.avgQuality || 0,
      runsByStatus,
      recentBenchmarks: benchmarks,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to compute stats" }, { status: 500 });
  }
}
