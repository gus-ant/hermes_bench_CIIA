"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { modelsData } from "@/data/models";
import { getTaskById } from "@/data/tasks/index";

interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  success: boolean;
  error?: string;
  durationMs: number;
  sequence: number;
}

interface Evaluation {
  method: string;
  qualityScore: number;
  reasoningSummary: string;
  criteriaScores: Array<{ criterion: string; score: number; reasoning: string }>;
}

interface Score {
  qualityScore: number;
  costScore: number;
  latencyScore: number;
  toolScore: number;
  reliabilityScore: number;
  finalScore: number;
}

interface Run {
  runId: string;
  benchmarkId: string;
  model: string;
  agent: string;
  task: string;
  trial: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  timeToFirstTokenMs?: number;
  toolCallsCount: number;
  toolErrorsCount: number;
  successfulToolCalls: number;
  answer: string;
  cost: number;
  qualityScore?: number;
  finalScore?: number;
  status: string;
  error?: string;
  errorCategory?: string;
  timestamp: string;
  benchmarkVersion: string;
  modelVersion: string;
  promptVersion: string;
  taskVersion: string;
  evaluationVersion: string;
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: color || "var(--text-primary)", fontFamily: "JetBrains Mono, monospace" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginTop: "var(--space-1)" }}>{sub}</div>}
    </div>
  );
}

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [run, setRun] = useState<Run | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/runs/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setRun(d.run);
        setToolCalls(d.toolCalls || []);
        setEvaluation(d.evaluation);
        setScore(d.score);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <div style={{ marginTop: "var(--space-4)" }}>Loading run details...</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❓</div>
        <div className="empty-state-title">Run not found</div>
        <Link href="/runs" style={{ color: "var(--accent-blue)" }}>← Back to runs</Link>
      </div>
    );
  }

  const model = modelsData.find((m) => m.id === run.model);
  const task = getTaskById(run.task);

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--space-4)", fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
        <Link href="/runs" style={{ color: "var(--accent-blue)" }}>Runs</Link>
        {" / "}
        <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{run.runId.slice(0, 8)}…</span>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
            {model && (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <div className="model-dot" style={{ background: model.color }} />
                <span style={{ fontWeight: 700, color: model.color }}>{model.name}</span>
              </div>
            )}
            <span className="badge badge-blue">{run.task}</span>
            <span className={`badge badge-${run.status}`}>{run.status}</span>
            <span className="badge badge-gray">Trial {run.trial}</span>
          </div>
          <h1 className="page-title">{task?.title || run.task}</h1>
          <p className="page-subtitle" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem" }}>
            {run.runId}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <MetricCard label="Input Tokens" value={run.inputTokens.toLocaleString()} />
        <MetricCard label="Output Tokens" value={run.outputTokens.toLocaleString()} />
        <MetricCard label="Total Tokens" value={run.totalTokens.toLocaleString()} />
        <MetricCard label="Latency" value={`${(run.latencyMs / 1000).toFixed(2)}s`} color="var(--accent-cyan)" />
        {run.timeToFirstTokenMs && (
          <MetricCard label="TTFT" value={`${run.timeToFirstTokenMs}ms`} />
        )}
        <MetricCard label="Cost" value={`$${run.cost.toFixed(6)}`} color="var(--accent-amber)" />
        <MetricCard
          label="Tool Calls"
          value={`${run.successfulToolCalls}/${run.toolCallsCount}`}
          sub={`${run.toolErrorsCount} errors`}
          color={run.toolErrorsCount > 0 ? "var(--accent-red)" : "var(--accent-green)"}
        />
        {run.qualityScore != null && (
          <MetricCard label="Quality Score" value={String(run.qualityScore)} color="var(--accent-purple)" />
        )}
        {run.finalScore != null && (
          <MetricCard label="Final Score" value={run.finalScore.toFixed(1)} color="var(--accent-blue)" />
        )}
      </div>

      {run.error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-6)" }}>
          <span>⚠</span>
          <div>
            <strong>{run.errorCategory || "Error"}</strong>: {run.error}
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Tool call timeline */}
        <div>
          <div className="section-title" style={{ marginBottom: "var(--space-4)" }}>
            Agent Execution Timeline
          </div>
          <div className="timeline">
            {/* User input */}
            <div className="timeline-item">
              <div className="timeline-dot user">👤</div>
              <div className="timeline-content">
                <div className="timeline-label">User Input</div>
                <div className="timeline-text" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem" }}>
                  {task?.input?.slice(0, 200) || run.task}
                  {(task?.input?.length || 0) > 200 && "..."}
                </div>
              </div>
            </div>

            {/* Tool calls */}
            {toolCalls.map((tc, i) => (
              <div key={i} className="timeline-item">
                <div className={`timeline-dot ${tc.success ? "tool-success" : "tool-error"}`}>
                  {tc.success ? "✓" : "✗"}
                </div>
                <div className="timeline-content">
                  <div className="timeline-label">
                    Tool Call — <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{tc.toolName}()</span>
                  </div>
                  <div className="timeline-text">
                    <strong>Args:</strong>{" "}
                    <code style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {JSON.stringify(tc.args).slice(0, 100)}
                    </code>
                  </div>
                  {tc.success ? (
                    <div className="timeline-meta">
                      ✓ Success · {tc.durationMs}ms
                    </div>
                  ) : (
                    <div className="timeline-meta" style={{ color: "var(--accent-red)" }}>
                      ✗ Error: {tc.error} · {tc.durationMs}ms
                    </div>
                  )}
                </div>
              </div>
            ))}

            {toolCalls.length === 0 && (
              <div className="timeline-item">
                <div className="timeline-dot model">🤖</div>
                <div className="timeline-content">
                  <div className="timeline-label">Model (Direct Response)</div>
                  <div className="timeline-text" style={{ color: "var(--text-tertiary)", fontSize: "0.78rem" }}>
                    No tool calls made — direct text generation
                  </div>
                </div>
              </div>
            )}

            {/* Final answer */}
            <div className="timeline-item">
              <div className="timeline-dot answer">💬</div>
              <div className="timeline-content">
                <div className="timeline-label">Final Answer</div>
                <div className="timeline-text" style={{ fontSize: "0.78rem", whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>
                  {run.answer.slice(0, 500)}
                  {run.answer.length > 500 && "..."}
                </div>
                <div className="timeline-meta">
                  {run.outputTokens} tokens · {(run.latencyMs / 1000).toFixed(2)}s total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation */}
        <div>
          {evaluation && (
            <div className="card" style={{ marginBottom: "var(--space-4)" }}>
              <div className="card-header">
                <span className="card-title">Evaluation ({evaluation.method})</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-purple)", fontFamily: "JetBrains Mono, monospace" }}>
                  {evaluation.qualityScore}/100
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "var(--space-4)", lineHeight: 1.6 }}>
                {evaluation.reasoningSummary}
              </p>
              <div>
                {evaluation.criteriaScores.map((cs, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-1)",
                      padding: "var(--space-3) 0",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 500 }}>
                        {cs.criterion.slice(0, 60)}
                      </span>
                      <span
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: cs.score >= 70 ? "var(--accent-green)" : cs.score >= 50 ? "var(--accent-amber)" : "var(--accent-red)",
                        }}
                      >
                        {cs.score}
                      </span>
                    </div>
                    <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${cs.score}%`,
                          background: cs.score >= 70 ? "var(--accent-green)" : cs.score >= 50 ? "var(--accent-amber)" : "var(--accent-red)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {score && (
            <div className="card" style={{ marginBottom: "var(--space-4)" }}>
              <div className="card-header">
                <span className="card-title">Score Breakdown</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-blue)", fontFamily: "JetBrains Mono, monospace" }}>
                  {score.finalScore.toFixed(1)}
                </span>
              </div>
              <div className="score-grid">
                <div className="score-item">
                  <div className="score-item-label">Quality</div>
                  <div className="score-item-value" style={{ color: "var(--accent-purple)" }}>{score.qualityScore}</div>
                </div>
                <div className="score-item">
                  <div className="score-item-label">Cost</div>
                  <div className="score-item-value" style={{ color: "var(--accent-amber)" }}>{score.costScore}</div>
                </div>
                <div className="score-item">
                  <div className="score-item-label">Latency</div>
                  <div className="score-item-value" style={{ color: "var(--accent-cyan)" }}>{score.latencyScore}</div>
                </div>
                <div className="score-item">
                  <div className="score-item-label">Tool Use</div>
                  <div className="score-item-value" style={{ color: "var(--accent-green)" }}>{score.toolScore}</div>
                </div>
                <div className="score-item">
                  <div className="score-item-label">Reliability</div>
                  <div className="score-item-value" style={{ color: "var(--accent-pink)" }}>{score.reliabilityScore}</div>
                </div>
                <div className="score-item">
                  <div className="score-item-label">Final</div>
                  <div className="score-item-value" style={{ color: "var(--accent-blue)", fontSize: "1.3rem" }}>{score.finalScore.toFixed(1)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Versions */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Versions (Auditability)</span>
            </div>
            {[
              ["Benchmark", run.benchmarkVersion],
              ["Model", run.modelVersion],
              ["Prompt", run.promptVersion],
              ["Task", run.taskVersion],
              ["Evaluation", run.evaluationVersion],
            ].map(([label, value]) => (
              <div className="stat-row" key={label}>
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value}</span>
              </div>
            ))}
            <div className="stat-row">
              <span className="stat-label">Timestamp</span>
              <span className="stat-value" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {new Date(run.timestamp).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
