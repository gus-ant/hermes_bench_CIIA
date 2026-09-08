import { TaskDefinition, MockRunResult } from "../lib/types";
import { EvaluationResult } from "../lib/evaluator/AutoEvaluator";

/**
 * LLMJudgeEvaluator — avalia respostas usando um LLM real como juiz.
 * Usa o mesmo formato OpenAI-compatible do RealExecutor.
 * Ativado com a flag --judge-model <model-id>.
 */
export class LLMJudgeEvaluator {
  private judgeModelId: string;

  constructor(judgeModelId: string) {
    this.judgeModelId = judgeModelId;
  }

  async evaluate(
    task: TaskDefinition,
    result: MockRunResult
  ): Promise<EvaluationResult> {
    if (result.status !== "completed") {
      return {
        qualityScore: 0,
        reasoningSummary: `Run não completado: ${result.error || "erro desconhecido"}`,
        criteriaScores: task.evaluation_criteria.map((c) => ({
          criterion: c,
          score: 0,
          reasoning: "Run falhou — critério não avaliado",
        })),
      };
    }

    // Resolve endpoint e chave da API do modelo juiz
    const { endpoint, apiKey } = this.resolveJudgeConfig();

    if (!apiKey) {
      console.warn(
        `⚠  LLMJudgeEvaluator: chave de API não encontrada para "${this.judgeModelId}". ` +
        `Usando AutoEvaluator heurístico como fallback.`
      );
      const { AutoEvaluator } = await import("../lib/evaluator/AutoEvaluator");
      return new AutoEvaluator().evaluate(task, result);
    }

    const systemPrompt = this.buildSystemPrompt(task);
    const userPrompt = this.buildUserPrompt(task, result.answer);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.resolveModelIdentifier(),
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Judge API Error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      let rawContent: string = data.choices?.[0]?.message?.content || "{}";

      // Remove thinking tags se presentes (ex: DeepSeek-R1 como juiz)
      rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      const parsed = JSON.parse(rawContent);
      return this.parseJudgeResponse(parsed, task);
    } catch (err) {
      console.warn(
        `⚠  LLMJudgeEvaluator: erro ao chamar o juiz (${err instanceof Error ? err.message : err}). ` +
        `Usando AutoEvaluator heurístico como fallback.`
      );
      const { AutoEvaluator } = await import("../lib/evaluator/AutoEvaluator");
      return new AutoEvaluator().evaluate(task, result);
    }
  }

  // ─── Prompts ──────────────────────────────────────────────────────────────

  private buildSystemPrompt(task: TaskDefinition): string {
    return `Você é um avaliador especialista em qualidade de respostas de agentes de IA.
Sua tarefa é avaliar objetivamente se a resposta de um agente de IA atende aos critérios de qualidade da tarefa.

Contexto da tarefa:
- Agente: ${task.agent}
- Dificuldade: ${task.difficulty}
- Objetivo: ${task.description}
- Comportamento esperado: ${task.expected_behavior}
- Output esperado: ${task.expected_output}

Critérios de avaliação (avalie cada um de 0 a 100):
${task.evaluation_criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Responda EXCLUSIVAMENTE em JSON válido com esta estrutura:
{
  "qualityScore": <número 0-100, média ponderada de todos os critérios>,
  "reasoningSummary": "<resumo em português em 2-3 frases>",
  "criteriaScores": [
    {
      "criterion": "<nome do critério>",
      "score": <0-100>,
      "reasoning": "<justificativa curta em português>"
    }
  ]
}`;
  }

  private buildUserPrompt(task: TaskDefinition, answer: string): string {
    return `## Prompt que foi dado ao agente:

**Contexto:** ${task.context}

**Entrada:** ${task.input}

## Resposta do agente a ser avaliada:

${answer}

---
Avalie a resposta acima segundo os critérios definidos. Responda apenas com o JSON solicitado.`;
  }

  // ─── Parseia a resposta do juiz ───────────────────────────────────────────

  private parseJudgeResponse(
    parsed: Record<string, unknown>,
    task: TaskDefinition
  ): EvaluationResult {
    const qualityScore = Math.max(
      0,
      Math.min(100, Number(parsed.qualityScore ?? 50))
    );
    const reasoningSummary =
      typeof parsed.reasoningSummary === "string"
        ? parsed.reasoningSummary
        : "Avaliação LLM-as-a-Judge concluída.";

    let criteriaScores: EvaluationResult["criteriaScores"] = [];
    if (Array.isArray(parsed.criteriaScores)) {
      criteriaScores = (parsed.criteriaScores as Record<string, unknown>[]).map((c) => ({
        criterion: String(c.criterion ?? ""),
        score: Math.max(0, Math.min(100, Number(c.score ?? 50))),
        reasoning: String(c.reasoning ?? ""),
      }));
    } else {
      // Fallback se o juiz não retornou criteriaScores
      criteriaScores = task.evaluation_criteria.map((c) => ({
        criterion: c,
        score: qualityScore,
        reasoning: "Score agregado pelo juiz.",
      }));
    }

    return { qualityScore, reasoningSummary, criteriaScores };
  }

  // ─── Resolve endpoint e chave da API do juiz ─────────────────────────────

  private resolveJudgeConfig(): { endpoint: string; apiKey: string } {
    const modelId = this.judgeModelId.toLowerCase();

    if (modelId.startsWith("deepseek")) {
      return {
        endpoint: "https://api.deepseek.com/v1/chat/completions",
        apiKey: process.env.DEEPSEEK_API_KEY || "",
      };
    }
    if (modelId.startsWith("gpt") || modelId.startsWith("o1") || modelId.startsWith("o3")) {
      return {
        endpoint: "https://api.openai.com/v1/chat/completions",
        apiKey: process.env.OPENAI_API_KEY || "",
      };
    }
    if (modelId.startsWith("gemini")) {
      return {
        endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${this.judgeModelId}:generateContent`,
        apiKey: process.env.GOOGLE_API_KEY || "",
      };
    }
    if (modelId.startsWith("qwen") || modelId.startsWith("qwq")) {
      return {
        endpoint: "https://api.siliconflow.cn/v1/chat/completions",
        apiKey: process.env.SILICONFLOW_API_KEY || "",
      };
    }
    if (modelId.startsWith("moonshot") || modelId.startsWith("kimi")) {
      return {
        endpoint: "https://api.moonshot.cn/v1/chat/completions",
        apiKey: process.env.MOONSHOT_API_KEY || "",
      };
    }
    if (modelId.startsWith("glm")) {
      return {
        endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        apiKey: process.env.ZHIPU_API_KEY || "",
      };
    }
    if (modelId.includes("claude")) {
      return {
        endpoint: "https://api.anthropic.com/v1/messages",
        apiKey: process.env.ANTHROPIC_API_KEY || "",
      };
    }
    // Default: OpenRouter (suporta todos os modelos acima via unified API)
    return {
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY || "",
    };
  }

  private resolveModelIdentifier(): string {
    // Se o usuário passou o ID do catálogo (ex: "deepseek-v3"),
    // tenta mapear para o model identifier real
    const idMap: Record<string, string> = {
      "deepseek-v3": "deepseek-chat",
      "deepseek-r1": "deepseek-reasoner",
      "qwen-max": "Qwen/Qwen2.5-72B-Instruct",
      "moonshot-v1-32k": "moonshot-v1-32k",
      "glm-4-plus": "glm-4-plus",
      "gpt-5-mini": "gpt-5-mini",
      "gemini-2-5-flash-lite": "gemini-2.5-flash-lite-preview-06-17",
    };
    return idMap[this.judgeModelId] || this.judgeModelId;
  }
}
