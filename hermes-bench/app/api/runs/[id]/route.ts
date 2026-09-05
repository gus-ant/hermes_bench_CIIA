import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RunDoc, ToolCallDoc, EvaluationDoc, ScoreDoc } from "@/lib/db/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const run = await RunDoc.findOne({ runId: id }).lean();
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const [toolCalls, evaluation, score] = await Promise.all([
      ToolCallDoc.find({ runId: id }).sort({ sequence: 1 }).lean(),
      EvaluationDoc.findOne({ runId: id }).lean(),
      ScoreDoc.findOne({ runId: id }).lean(),
    ]);

    return NextResponse.json({ run, toolCalls, evaluation, score });
  } catch (error) {
    console.error("Run detail error:", error);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }
}
