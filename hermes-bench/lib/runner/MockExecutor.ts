import { v4 as uuidv4 } from "uuid";
import { TaskDefinition, MockRunResult, ToolCallRecord, RunStatus } from "@/lib/types";
import { toolRegistry, getTool } from "@/lib/tools";

/**
 * MockExecutor generates realistic simulated responses for benchmark runs.
 * Used when MOCK_MODE=true. No real API calls are made.
 */
export class MockExecutor {
  private modelId: string;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  async execute(task: TaskDefinition): Promise<MockRunResult> {
    const startTime = Date.now();
    const ttft = Math.floor(Math.random() * 500 + 100);

    // Simulate TTFT delay
    await this.delay(ttft);

    // Generate realistic token counts based on task complexity
    const inputTokens = this.estimateInputTokens(task);
    const outputTokens = this.estimateOutputTokens(task);

    // Simulate tool calls if task requires tools
    const toolResults = await this.simulateToolCalls(task);

    // Generate mock answer
    const answer = this.generateMockAnswer(task);

    // Simulate remaining generation time
    const generationTime = Math.floor((outputTokens / this.getTokensPerSecond()) * 1000);
    await this.delay(generationTime);

    const totalLatency = Date.now() - startTime;

    // Determine success with model-specific bias
    const successRate = this.getModelSuccessRate(task.difficulty);
    const success = Math.random() < successRate;

    let status: RunStatus = "completed";
    let error: string | undefined;
    let errorCategory: string | undefined;

    if (!success) {
      const errorType = this.pickErrorType();
      status = errorType.status as RunStatus;
      error = errorType.message;
      errorCategory = errorType.category;
    }

    return {
      answer: success ? answer : this.generateFailedAnswer(error || ""),
      inputTokens,
      outputTokens: success ? outputTokens : Math.floor(outputTokens * 0.3),
      totalTokens: inputTokens + (success ? outputTokens : Math.floor(outputTokens * 0.3)),
      latencyMs: totalLatency,
      timeToFirstTokenMs: ttft,
      toolCallsCount: toolResults.calls.length,
      toolErrorsCount: toolResults.errors,
      successfulToolCalls: toolResults.successful,
      toolCalls: toolResults.records,
      status: success ? "completed" : status,
      error: success ? undefined : error,
    };
  }

  private async simulateToolCalls(
    task: TaskDefinition
  ): Promise<{
    calls: string[];
    errors: number;
    successful: number;
    records: ToolCallRecord[];
  }> {
    const records: ToolCallRecord[] = [];
    let errors = 0;
    let successful = 0;

    if (!task.tools || task.tools.length === 0) {
      return { calls: [], errors: 0, successful: 0, records: [] };
    }

    // Determine how many tools to call based on task complexity
    const numCalls = this.getToolCallCount(task);
    const toolsToCall = task.tools.slice(0, numCalls);

    for (let i = 0; i < toolsToCall.length; i++) {
      const toolName = toolsToCall[i];
      const tool = getTool(toolName);

      if (!tool) {
        errors++;
        records.push({
          runId: "",
          toolName,
          args: {},
          result: null,
          success: false,
          error: `Tool '${toolName}' not found in registry`,
          durationMs: 0,
          sequence: i + 1,
        });
        continue;
      }

      // Generate mock args
      const args = this.generateMockArgs(toolName);
      const validation = tool.validate(args);

      if (!validation.valid) {
        errors++;
        records.push({
          runId: "",
          toolName,
          args,
          result: null,
          success: false,
          error: `Validation failed: ${validation.errors.join(", ")}`,
          durationMs: 0,
          sequence: i + 1,
        });
        continue;
      }

      // Execute tool with occasional random failure
      const shouldFail = Math.random() < 0.08; // 8% tool failure rate
      if (shouldFail) {
        errors++;
        records.push({
          runId: "",
          toolName,
          args,
          result: null,
          success: false,
          error: "Simulated tool execution error",
          durationMs: Math.floor(Math.random() * 100),
          sequence: i + 1,
        });
        continue;
      }

      const result = await tool.execute(args);
      if (result.success) {
        successful++;
      } else {
        errors++;
      }

      records.push({
        runId: "",
        toolName,
        args,
        result: result.data || null,
        success: result.success,
        error: result.error,
        durationMs: result.durationMs,
        sequence: i + 1,
      });
    }

    return { calls: toolsToCall, errors, successful, records };
  }

  private generateMockArgs(toolName: string): Record<string, unknown> {
    switch (toolName) {
      case "search_file":
        return { query: "documento", folder: "/CIIA" };
      case "read_file":
        return { path: "/CIIA/Administrativo/Atas/2025/ata_admin_reuniao-board_2025-03.pdf" };
      case "move_file":
        return {
          source: "/CIIA/Inbox/arquivo.pdf",
          destination: "/CIIA/Administrativo/Atas/2025",
        };
      case "create_folder":
        return { path: "/CIIA/Administrativo/Parcerias" };
      case "list_folder":
        return { path: "/CIIA/Administrativo" };
      default:
        return {};
    }
  }

  private estimateInputTokens(task: TaskDefinition): number {
    const baseLength = (task.context + task.input + task.description).length;
    const toolsLen = task.tools.length * 200; // tool schema tokens
    return Math.floor((baseLength / 4) + toolsLen + 150 + Math.random() * 100);
  }

  private estimateOutputTokens(task: TaskDefinition): number {
    const difficultyMultiplier = {
      facil: 1,
      medio: 1.5,
      dificil: 2.2,
      muito_dificil: 3,
    }[task.difficulty] || 1.5;

    return Math.floor(300 * difficultyMultiplier + Math.random() * 200);
  }

  private getTokensPerSecond(): number {
    const speeds: Record<string, number> = {
      "gemini-2-5-flash-lite": 180,
      "llama-4-scout": 120,
      "mistral-small-3-2-24b": 100,
      "qwen3-32b": 80,
      "gpt-5-mini": 90,
    };
    return speeds[this.modelId] || 100;
  }

  private getModelSuccessRate(difficulty: string): number {
    const modelBase: Record<string, number> = {
      "gpt-5-mini": 0.93,
      "gemini-2-5-flash-lite": 0.90,
      "qwen3-32b": 0.88,
      "mistral-small-3-2-24b": 0.82,
      "llama-4-scout": 0.79,
    };
    const difficultyPenalty: Record<string, number> = {
      facil: 0,
      medio: -0.05,
      dificil: -0.12,
      muito_dificil: -0.22,
    };
    const base = modelBase[this.modelId] || 0.85;
    const penalty = difficultyPenalty[difficulty] || 0;
    return Math.max(0.3, Math.min(0.99, base + penalty));
  }

  private getToolCallCount(task: TaskDefinition): number {
    if (!task.tools.length) return 0;
    return Math.min(task.tools.length, Math.floor(Math.random() * task.tools.length) + 1);
  }

  private pickErrorType(): { status: string; message: string; category: string } {
    const types = [
      { status: "failed", message: "Answer did not meet evaluation criteria", category: "wrong_answer" },
      { status: "failed", message: "Required elements missing from response", category: "incomplete_task" },
      { status: "failed", message: "Tool call returned unexpected result", category: "tool_error" },
      { status: "failed", message: "Response contained factual inaccuracies", category: "hallucination" },
      { status: "timeout", message: "Execution timed out after 30 seconds", category: "timeout" },
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateMockAnswer(task: TaskDefinition): string {
    const modelPersonality = this.getModelPersonality();
    return `${modelPersonality}\n\n## Resposta para: ${task.title}\n\n${this.generateContent(task)}`;
  }

  private generateFailedAnswer(error: string): string {
    return `[ERRO] A execução falhou: ${error}`;
  }

  private getModelPersonality(): string {
    const personalities: Record<string, string> = {
      "gpt-5-mini": "Análise estruturada e abrangente:",
      "gemini-2-5-flash-lite": "Resposta gerada com precisão e eficiência:",
      "qwen3-32b": "Raciocínio detalhado e resposta completa:",
      "mistral-small-3-2-24b": "Resposta direta e pragmática:",
      "llama-4-scout": "Análise contextual e resposta elaborada:",
    };
    return personalities[this.modelId] || "Resposta:";
  }

  private generateContent(task: TaskDefinition): string {
    const lines = [
      `**Tarefa:** ${task.id} — ${task.title}`,
      `**Agente:** ${task.agent}`,
      `**Dificuldade:** ${task.difficulty}`,
      "",
      "### Análise",
      `Com base no contexto fornecido, esta tarefa requer ${task.evaluation_criteria.length} critérios de avaliação.`,
      "",
      "### Resposta Principal",
      `${task.expected_behavior}`,
      "",
      "### Detalhamento",
      task.evaluation_criteria.map((c, i) => `${i + 1}. ✅ ${c}`).join("\n"),
      "",
      "### Conclusão",
      `Esta resposta atende aos requisitos de ${task.title} conforme as diretrizes do CIIA.`,
    ];
    return lines.join("\n");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Calculate cost for a run based on model pricing.
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  inputPricePer1M: number,
  outputPricePer1M: number
): number {
  const inputCost = (inputTokens / 1_000_000) * inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * outputPricePer1M;
  return Number((inputCost + outputCost).toFixed(8));
}
