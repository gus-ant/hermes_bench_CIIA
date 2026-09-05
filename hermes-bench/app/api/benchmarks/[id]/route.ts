import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BenchmarkDoc, RunDoc } from "@/lib/db/models";

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
    return NextResponse.json(benchmark);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch benchmark" }, { status: 500 });
  }
}
