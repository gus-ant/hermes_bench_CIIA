import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RunDoc } from "@/lib/db/models";
import { modelsData } from "@/data/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";
    const benchmarkId = searchParams.get("benchmarkId");

    const filter: Record<string, unknown> = {};
    if (benchmarkId) filter.benchmarkId = benchmarkId;

    const runs = await RunDoc.find(filter).sort({ timestamp: -1 }).lean();

    if (format === "csv") {
      const headers = [
        "run_id", "benchmark_id", "model", "agent", "task", "trial",
        "input_tokens", "output_tokens", "total_tokens",
        "latency_ms", "ttft_ms", "tool_calls", "tool_errors",
        "cost", "quality_score", "final_score", "status", "error",
        "timestamp", "benchmark_version", "model_version",
      ];

      const rows = runs.map((r) => [
        r.runId, r.benchmarkId, r.model, r.agent, r.task, r.trial,
        r.inputTokens, r.outputTokens, r.totalTokens,
        r.latencyMs, r.timeToFirstTokenMs || "",
        r.toolCallsCount, r.toolErrorsCount,
        r.cost, r.qualityScore || "", r.finalScore || "",
        r.status, r.error || "",
        r.timestamp?.toISOString() || "",
        r.benchmarkVersion, r.modelVersion,
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="hermes-bench-export-${Date.now()}.csv"`,
        },
      });
    }

    // JSON format
    const exportData = {
      exportedAt: new Date().toISOString(),
      benchmarkId: benchmarkId || "all",
      totalRuns: runs.length,
      models: modelsData.map((m) => ({ id: m.id, name: m.name, provider: m.provider })),
      runs: runs.map((r) => ({
        run_id: r.runId,
        benchmark_id: r.benchmarkId,
        model: r.model,
        agent: r.agent,
        task: r.task,
        trial: r.trial,
        metrics: {
          input_tokens: r.inputTokens,
          output_tokens: r.outputTokens,
          total_tokens: r.totalTokens,
          latency_ms: r.latencyMs,
          ttft_ms: r.timeToFirstTokenMs,
          tool_calls: r.toolCallsCount,
          tool_errors: r.toolErrorsCount,
          cost: r.cost,
        },
        scores: {
          quality: r.qualityScore,
          final: r.finalScore,
        },
        status: r.status,
        error: r.error,
        answer: r.answer,
        timestamp: r.timestamp,
        versions: {
          benchmark: r.benchmarkVersion,
          model: r.modelVersion,
          prompt: r.promptVersion,
          task: r.taskVersion,
          evaluation: r.evaluationVersion,
        },
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="hermes-bench-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
