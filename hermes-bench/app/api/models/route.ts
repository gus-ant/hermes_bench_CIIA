import { NextRequest, NextResponse } from "next/server";
import { modelsData } from "@/data/models";

export async function GET() {
  return NextResponse.json({ models: modelsData });
}
