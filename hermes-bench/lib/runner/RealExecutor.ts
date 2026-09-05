import { TaskDefinition, MockRunResult } from "@/lib/types";

/**
 * RealExecutor stubs for live API calls.
 * Replace the stub bodies with actual API calls when ready.
 * API keys are loaded from environment variables — never hardcoded.
 */

export interface RealExecutorConfig {
  modelIdentifier: string;
  endpoint: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RealRunResult {
  answer: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  timeToFirstTokenMs: number;
  toolCallsCount: number;
  toolErrorsCount: number;
  successfulToolCalls: number;
  rawResponse?: unknown;
}

// ─── OpenAI (GPT-5 Mini) ──────────────────────────────────────────────────

export async function executeOpenAI(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  // TODO: Replace stub with real OpenAI API call
  // const openai = new OpenAI({ apiKey: config.apiKey });
  // const response = await openai.chat.completions.create({...});
  throw new Error(
    "OpenAI executor not yet implemented. Set MOCK_MODE=true or implement this stub."
  );
}

// ─── Google Gemini ────────────────────────────────────────────────────────

export async function executeGemini(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  // TODO: Replace stub with real Gemini API call
  // const { GoogleGenerativeAI } = await import("@google/generative-ai");
  // const genAI = new GoogleGenerativeAI(config.apiKey);
  throw new Error(
    "Gemini executor not yet implemented. Set MOCK_MODE=true or implement this stub."
  );
}

// ─── Mistral ──────────────────────────────────────────────────────────────

export async function executeMistral(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  // TODO: Replace stub with real Mistral API call
  // const { Mistral } = await import("@mistralai/mistralai");
  // const client = new Mistral({ apiKey: config.apiKey });
  throw new Error(
    "Mistral executor not yet implemented. Set MOCK_MODE=true or implement this stub."
  );
}

// ─── Together AI (Qwen3, Llama 4) ────────────────────────────────────────

export async function executeTogetherAI(
  config: RealExecutorConfig,
  task: TaskDefinition
): Promise<RealRunResult> {
  // TODO: Replace stub with real Together AI API call
  // Uses OpenAI-compatible endpoint
  throw new Error(
    "Together AI executor not yet implemented. Set MOCK_MODE=true or implement this stub."
  );
}

// ─── Provider Router ──────────────────────────────────────────────────────

const PROVIDER_MAP: Record<string, (config: RealExecutorConfig, task: TaskDefinition) => Promise<RealRunResult>> = {
  "OpenAI": executeOpenAI,
  "Google": executeGemini,
  "Mistral AI": executeMistral,
  "Alibaba Cloud": executeTogetherAI,
  "Meta": executeTogetherAI,
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
