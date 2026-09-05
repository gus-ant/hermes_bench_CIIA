import { capacitacaoTasks } from "@/data/tasks/capacitacao";
import { driveTasks } from "@/data/tasks/drive";
import { comunicacaoTasks } from "@/data/tasks/comunicacao";
import { TaskDefinition } from "@/lib/types";

export const allTasks: TaskDefinition[] = [
  ...capacitacaoTasks,
  ...driveTasks,
  ...comunicacaoTasks,
];

export { capacitacaoTasks, driveTasks, comunicacaoTasks };

export function getTaskById(id: string): TaskDefinition | undefined {
  return allTasks.find((t) => t.id === id);
}

export function getTasksByAgent(agent: string): TaskDefinition[] {
  return allTasks.filter((t) => t.agent === agent);
}
