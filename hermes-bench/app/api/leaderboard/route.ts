import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RunDoc, ScoreDoc, ModelDoc, AgentDoc, TaskDoc } from "@/lib/db/models";
import { modelsData } from "@/data/models";
import { agentsData } from "@/data/agents";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const benchmarkId = searchParams.get("benchmarkId");

    const filter: Record<string, unknown> = {};
    if (benchmarkId) filter.benchmarkId = benchmarkId;

    // Aggregate per-model stats
    const runs = await RunDoc.find(filter).lean();

    if (runs.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Group by model
    const modelStats: Record<string, {
      totalRuns: number;
      completedRuns: number;
      totalCost: number;
      totalLatency: number;
      totalTokens: number;
      qualityScores: number[];
      finalScores: number[];
      toolCallsTotal: number;
      toolErrorsTotal: number;
    }> = {};

    for (const run of runs) {
      if (!modelStats[run.modelId]) {
        modelStats[run.modelId] = {
          totalRuns: 0,
          completedRuns: 0,
          totalCost: 0,
          totalLatency: 0,
          totalTokens: 0,
          qualityScores: [],
          finalScores: [],
          toolCallsTotal: 0,
          toolErrorsTotal: 0,
        };
      }

      const stats = modelStats[run.modelId];
      stats.totalRuns++;
      stats.totalCost += run.cost || 0;
      stats.totalLatency += run.latencyMs || 0;
      stats.totalTokens += run.totalTokens || 0;
      stats.toolCallsTotal += run.toolCallsCount || 0;
      stats.toolErrorsTotal += run.toolErrorsCount || 0;

      if (run.status === "completed") {
        stats.completedRuns++;
        if (run.qualityScore != null) stats.qualityScores.push(run.qualityScore);
        if (run.finalScore != null) stats.finalScores.push(run.finalScore);
      }
    }

    // Build leaderboard entries
    const entries = Object.entries(modelStats).map(([modelId, stats]) => {
      const model = modelsData.find((m) => m.id === modelId);
      const avgQuality =
        stats.qualityScores.length > 0
          ? stats.qualityScores.reduce((s, v) => s + v, 0) / stats.qualityScores.length
          : 0;
      const avgFinalScore =
        stats.finalScores.length > 0
          ? stats.finalScores.reduce((s, v) => s + v, 0) / stats.finalScores.length
          : 0;
      const toolReliability =
        stats.toolCallsTotal > 0
          ? ((stats.toolCallsTotal - stats.toolErrorsTotal) / stats.toolCallsTotal) * 100
          : 100;

      return {
        modelId,
        modelName: model?.name || modelId,
        provider: model?.provider || "Unknown",
        color: model?.color || "#6366F1",
        overallScore: Math.round(avgFinalScore * 10) / 10,
        qualityScore: Math.round(avgQuality),
        successRate: Math.round((stats.completedRuns / stats.totalRuns) * 100),
        avgCost: stats.totalRuns > 0 ? stats.totalCost / stats.totalRuns : 0,
        avgLatencyMs: stats.totalRuns > 0 ? stats.totalLatency / stats.totalRuns : 0,
        toolReliability: Math.round(toolReliability),
        totalRuns: stats.totalRuns,
        completedRuns: stats.completedRuns,
        totalCost: stats.totalCost,
        avgTokens: stats.totalRuns > 0 ? Math.round(stats.totalTokens / stats.totalRuns) : 0,
      };
    });

    // Sort by overall score descending
    entries.sort((a, b) => b.overallScore - a.overallScore);
    const ranked = entries.map((e, i) => ({ ...e, rank: i + 1 }));

    return NextResponse.json({ leaderboard: ranked });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to compute leaderboard" }, { status: 500 });
  }
}
