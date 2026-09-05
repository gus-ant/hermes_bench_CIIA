import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RunDoc } from "@/lib/db/models";
import { getTaskById } from "@/data/tasks/index";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = getTaskById(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    await connectToDatabase();
    // Get all runs for this task grouped by model
    const runs = await RunDoc.find({ task: id })
      .sort({ task: 1, trial: 1 })
      .lean();

    return NextResponse.json({ task, runs });
  } catch {
    return NextResponse.json({ task, runs: [] });
  }
}
