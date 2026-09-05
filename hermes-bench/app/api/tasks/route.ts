import { NextRequest, NextResponse } from "next/server";
import { allTasks } from "@/data/tasks/index";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const agent = searchParams.get("agent");
  const difficulty = searchParams.get("difficulty");

  let tasks = allTasks;
  if (agent) tasks = tasks.filter((t) => t.agent === agent);
  if (difficulty) tasks = tasks.filter((t) => t.difficulty === difficulty);

  return NextResponse.json({ tasks, total: tasks.length });
}
