import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RunDoc, ToolCallDoc } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const filter: Record<string, unknown> = {};

    const benchmarkId = searchParams.get("benchmarkId");
    const model = searchParams.get("model");
    const agent = searchParams.get("agent");
    const task = searchParams.get("task");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (benchmarkId) filter.benchmarkId = benchmarkId;
    if (model) filter.model = model;
    if (agent) filter.agent = agent;
    if (task) filter.task = task;
    if (status) filter.status = status;

    const total = await RunDoc.countDocuments(filter);
    const runs = await RunDoc.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      runs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Runs list error:", error);
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
  }
}
