import { TaskDefinition, MockRunResult } from "@/lib/types";

/**
 * RealExecutor — implementações reais de chamadas de API por provedor.
 * Todos os provedores usam o formato OpenAI-compatible (exceto Gemini).
 * Chaves de API são lidas exclusivamente de variáveis de ambiente.
 */

export interface RealExecutorConfig {
  modelIdentifier: string;
  endpoint: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export type RealRunResult = MockRunResult;

// ─── Utilitário: Parser de thinking tags ────────────────────────────────────

/**
 * Remove <think>...</think> do conteúdo de modelos com raciocínio explícito
 * (DeepSeek-R1, QwQ). Retorna o raciocínio separado e a resposta limpa.
 */
export function parseThinkingTags(content: string): {
  reasoning: string;
  answer: string;
} {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/i);
  if (!thinkMatch) {
    return { reasoning: "", answer: content.trim() };
  }
  const reasoning = thinkMatch[1].trim();
  const answer = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  return { reasoning, answer };
}

// ─── Utilitário: Chamada OpenAI-compatible ───────────────────────────────────

async function callOpenAICompatible(
  config: RealExecutorConfig,
  task: TaskDefinition,
  extraHeaders: Record<string, string> = {}
): Promise<RealRunResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: config.modelIdentifier,
        messages: [
          { role: "system", content: task.context },
          { role: "user", content: task.input },
        ],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const endTime = Date.now();
    const latencyMs = endTime - startTime;

    const rawContent: string = data.choices?.[0]?.message?.content || "";
    const { answer } = parseThinkingTags(rawContent);

    const inputTokens: number = data.usage?.prompt_tokens || 0;
    const outputTokens: number = data.usage?.completion_tokens || 0;

    return {
      answer,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      latencyMs,
      timeToFirstTokenMs: latencyMs,
      toolCallsCount: 0,
      toolErrorsCount: 0,
      successfulToolCalls: 0,
      toolCalls: [],
      status: "completed",
    };
  } catch (err) {
    const endTime = Date.now();
    return {
      answer: "",
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs: endTime - startTime,
      timeToFirstTokenMs: 0,
      toolCallsCount: 0,
      toolErrorsCount: 0,
      successfulToolCalls: 0,
      toolCalls: [],
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown API error",
    };
  }
}

// ─── OpenAI (GPT-5 Mini) ──────────────────────────────────────────────────

export async function executeOpenAI(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("OPENAI_API_KEY not configured");
  }
  return callOpenAICompatible({ ...config, apiKey }, task, {
    "User-Agent": "hermes-bench/1.0",
  });
}

// ─── Google Gemini ────────────────────────────────────────────────────────

export async function executeGemini(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.GOOGLE_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("GOOGLE_API_KEY not configured");
  }

  const startTime = Date.now();
  const url = `${config.endpoint}/${config.modelIdentifier}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: task.context }] },
        contents: [{ role: "user", parts: [{ text: task.input }] }],
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const endTime = Date.now();

    const answer: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const inputTokens: number =
      data.usageMetadata?.promptTokenCount || 0;
    const outputTokens: number =
      data.usageMetadata?.candidatesTokenCount || 0;

    return {
      answer,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      latencyMs: endTime - startTime,
      timeToFirstTokenMs: endTime - startTime,
      toolCallsCount: 0,
      toolErrorsCount: 0,
      successfulToolCalls: 0,
      toolCalls: [],
      status: "completed",
    };
  } catch (err) {
    const endTime = Date.now();
    return {
      answer: "",
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs: endTime - startTime,
      timeToFirstTokenMs: 0,
      toolCallsCount: 0,
      toolErrorsCount: 0,
      successfulToolCalls: 0,
      toolCalls: [],
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown Gemini error",
    };
  }
}

// ─── Mistral ──────────────────────────────────────────────────────────────

export async function executeMistral(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.MISTRAL_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("MISTRAL_API_KEY not configured");
  }
  return callOpenAICompatible({ ...config, apiKey }, task);
}

// ─── Together AI (Qwen3, Llama 4) ────────────────────────────────────────

export async function executeTogetherAI(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.TOGETHER_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("TOGETHER_API_KEY not configured");
  }
  return callOpenAICompatible({ ...config, apiKey }, task);
}

// ─── OpenRouter ─────────────────────────────────────────────────────────────

export async function executeOpenRouter(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("OPENROUTER_API_KEY not configured");
  }
  return callOpenAICompatible({ ...config, apiKey }, task, {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Hermes-Bench",
  });
}

// ─── DeepSeek (V3 + R1) ───────────────────────────────────────────────────

export async function executeDeepSeek(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("DEEPSEEK_API_KEY not configured");
  }
  // R1 usa endpoint /chat/completions normal mas retorna <think> tags
  return callOpenAICompatible({ ...config, apiKey }, task);
}

// ─── SiliconFlow (Qwen-Max, Yi Lightning) ────────────────────────────────

export async function executeSiliconFlow(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.SILICONFLOW_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("SILICONFLOW_API_KEY not configured");
  }
  return callOpenAICompatible({ ...config, apiKey }, task);
}

// ─── Moonshot AI (Kimi) ──────────────────────────────────────────────────

export async function executeMoonshot(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.MOONSHOT_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("MOONSHOT_API_KEY not configured");
  }
  return callOpenAICompatible({ ...config, apiKey }, task);
}

// ─── Zhipu AI (GLM-4-Plus) ───────────────────────────────────────────────

export async function executeZhipu(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  const apiKey = config.apiKey || process.env.ZHIPU_API_KEY || "";
  if (!apiKey) {
    return makeSkippedResult("ZHIPU_API_KEY not configured");
  }
  return callOpenAICompatible({ ...config, apiKey }, task);
}

// ─── Utilitário: Run ignorado por falta de chave ─────────────────────────

function makeSkippedResult(reason: string): RealRunResult {
  return {
    answer: "",
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    latencyMs: 0,
    timeToFirstTokenMs: 0,
    toolCallsCount: 0,
    toolErrorsCount: 0,
    successfulToolCalls: 0,
    toolCalls: [],
    status: "failed",
    error: `Skipped: ${reason}`,
  };
}

// ─── Provider Router ──────────────────────────────────────────────────────

const PROVIDER_MAP: Record<
  string,
  (config: RealExecutorConfig, task: TaskDefinition) => Promise<RealRunResult>
> = {
  OpenAI: executeOpenAI,
  Google: executeGemini,
  "Mistral AI": executeMistral,
  "Alibaba Cloud": executeTogetherAI,
  Meta: executeTogetherAI,
  OpenRouter: executeOpenRouter,
  // Provedores chineses
  DeepSeek: executeDeepSeek,
  SiliconFlow: executeSiliconFlow,
  "Moonshot AI": executeMoonshot,
  "Zhipu AI": executeZhipu,
  "01.AI": executeSiliconFlow,
};

export function getRealExecutor(
  provider: string
): (config: RealExecutorConfig, task: TaskDefinition) => Promise<RealRunResult> {
  const executor = PROVIDER_MAP[provider];
  if (!executor) {
    throw new Error(`No real executor found for provider: ${provider}`);
  }
  return executor;
}
