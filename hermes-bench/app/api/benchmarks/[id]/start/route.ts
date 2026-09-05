import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BenchmarkDoc } from "@/lib/db/models";
import { BenchmarkRunner } from "@/lib/runner/BenchmarkRunner";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const benchmark = await BenchmarkDoc.findById(id);
    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    }

    if (benchmark.status === "running") {
      return NextResponse.json({ error: "Benchmark is already running" }, { status: 400 });
    }

    // Start runner in background (fire-and-forget)
    const runner = new BenchmarkRunner(id, benchmark.config);
    runner.run().catch((err) => {
      console.error(`Benchmark ${id} failed:`, err);
      BenchmarkDoc.findByIdAndUpdate(id, { status: "cancelled" }).exec();
    });

    return NextResponse.json({ message: "Benchmark started", benchmarkId: id });
  } catch (error) {
    console.error("Start benchmark error:", error);
    return NextResponse.json({ error: "Failed to start benchmark" }, { status: 500 });
  }
}
