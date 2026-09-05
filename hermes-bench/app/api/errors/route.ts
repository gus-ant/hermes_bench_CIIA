import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RunDoc } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const benchmarkId = searchParams.get("benchmarkId");
    const filter: Record<string, unknown> = {};
    if (benchmarkId) filter.benchmarkId = benchmarkId;

    // Error analysis aggregation
    const errorsByCategory = await RunDoc.aggregate([
      { $match: { ...filter, status: { $in: ["failed", "timeout"] } } },
      {
        $group: {
          _id: { category: "$errorCategory", model: "$model" },
          count: { $sum: 1 },
        },
      },
    ]);

    const errorsByModel = await RunDoc.aggregate([
      { $match: { ...filter, status: { $in: ["failed", "timeout"] } } },
      { $group: { _id: "$model", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const errorsByAgent = await RunDoc.aggregate([
      { $match: { ...filter, status: { $in: ["failed", "timeout"] } } },
      { $group: { _id: "$agent", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const totalFailed = await RunDoc.countDocuments({
      ...filter,
      status: { $in: ["failed", "timeout"] },
    });

    return NextResponse.json({
      totalFailed,
      errorsByCategory,
      errorsByModel,
      errorsByAgent,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch errors" }, { status: 500 });
  }
}
