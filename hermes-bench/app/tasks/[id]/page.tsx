"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { getTaskById } from "@/data/tasks/index";
import { modelsData } from "@/data/models";
import { agentsData } from "@/data/agents";
import Link from "next/link";

const DIFFICULTY_LABELS: Record<string, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
  muito_dificil: "Muito Difícil",
};

interface Run {
  runId: string;
  model: string;
  trial: number;
  status: string;
  answer: string;
  qualityScore?: number;
  finalScore?: number;
  latencyMs: number;
  cost: number;
  toolCallsCount: number;
  toolErrorsCount: number;
  successfulToolCalls: number;
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const task = getTaskById(id);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then((r) => r.json())
      .then((d) => setRuns(d.runs || []))
      .finally(() => setLoading(false));
  }, [id]);

  if (!task) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❓</div>
        <div className="empty-state-title">Task not found</div>
        <div className="empty-state-desc">
          <Link href="/tasks" style={{ color: "var(--accent-blue)" }}>← Back to tasks</Link>
        </div>
      </div>
    );
  }

  const agent = agentsData.find((a) => a.slug === task.agent);

  // Group runs by model
  const runsByModel: Record<string, Run[]> = {};
  runs.forEach((run) => {
    if (!runsByModel[run.model]) runsByModel[run.model] = [];
    runsByModel[run.model].push(run);
  });

  const modelIds = Object.keys(runsByModel);

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--space-4)", fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
        <Link href="/tasks" style={{ color: "var(--accent-blue)" }}>Tasks</Link>
        {" / "}
        <span>{task.id}</span>
      </div>

      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "var(--accent-blue)",
                background: "var(--accent-blue-dim)",
                padding: "4px 12px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {task.id}
            </span>
            <span className={`badge badge-${task.difficulty}`}>
              {DIFFICULTY_LABELS[task.difficulty]}
            </span>
            {agent && (
              <span
                className="badge"
                style={{
                  background: `${agent.color}20`,
                  color: agent.color,
                  border: `1px solid ${agent.color}40`,
                }}
              >
                {agent.icon} {agent.name}
              </span>
            )}
          </div>
          <h1 className="page-title">{task.title}</h1>
          <p className="page-subtitle">{task.description}</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Task details */}
        <div>
          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">Context</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {task.context}
            </p>
          </div>

          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">Input</span>
            </div>
            <div className="code-block">{task.input}</div>
          </div>

          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">Expected Behavior</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {task.expected_behavior}
            </p>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Evaluation Criteria</span>
            </div>
            <ol style={{ paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {task.evaluation_criteria.map((c, i) => (
                <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {c}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">Tools Required</span>
              <span className="badge badge-gray">{task.tools.length} tools</span>
            </div>
            {task.tools.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>
                No tool calls required for this task.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {task.tools.map((tool) => (
                  <div
                    key={tool}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) var(--space-3)",
                      background: "var(--bg-elevated)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "0.78rem",
                      color: "var(--accent-amber)",
                    }}
                  >
                    🔧 {tool}()
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model results */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Model Results</span>
              <span className="badge badge-gray">{runs.length} runs</span>
            </div>

            {loading ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : modelIds.length === 0 ? (
              <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.82rem" }}>
                No runs for this task yet.
              </div>
            ) : (
              <div>
                {/* Model selector */}
                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
                  {modelIds.map((modelId) => {
                    const model = modelsData.find((m) => m.id === modelId);
                    const isSelected = selectedModel === modelId || (selectedModel === null && modelIds[0] === modelId);
                    return (
                      <button
                        key={modelId}
                        onClick={() => setSelectedModel(modelId)}
                        className="btn btn-sm"
                        style={{
                          background: isSelected ? `${model?.color}20` : "var(--bg-elevated)",
                          borderColor: isSelected ? model?.color : "var(--border)",
                          color: isSelected ? model?.color : "var(--text-secondary)",
                        }}
                      >
                        {model?.name.split(" ").slice(0, 2).join(" ")}
                      </button>
                    );
                  })}
                </div>

                {/* Selected model runs */}
                {(() => {
                  const activeMid = selectedModel || modelIds[0];
                  const modelRuns = runsByModel[activeMid] || [];
                  const model = modelsData.find((m) => m.id === activeMid);
                  return (
                    <div>
                      {modelRuns.map((run) => (
                        <div
                          key={run.runId}
                          style={{
                            background: "var(--bg-surface)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-4)",
                            marginBottom: "var(--space-3)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                            <div style={{ display: "flex", gap: "var(--space-2)" }}>
                              <span className="badge badge-gray">Trial {run.trial}</span>
                              <span className={`badge badge-${run.status}`}>{run.status}</span>
                            </div>
                            <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                              {run.qualityScore && <span>Q: {run.qualityScore}</span>}
                              <span>{(run.latencyMs / 1000).toFixed(1)}s</span>
                              <span>${run.cost.toFixed(5)}</span>
                              {run.toolCallsCount > 0 && (
                                <span>🔧 {run.successfulToolCalls || run.toolCallsCount - run.toolErrorsCount}/{run.toolCallsCount}</span>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-secondary)",
                              fontFamily: "JetBrains Mono, monospace",
                              maxHeight: 120,
                              overflow: "hidden",
                              position: "relative",
                            }}
                          >
                            {run.answer.slice(0, 300)}
                            {run.answer.length > 300 && "..."}
                          </div>
                          <Link
                            href={`/runs/${run.runId}`}
                            style={{ fontSize: "0.72rem", color: "var(--accent-blue)", marginTop: "var(--space-2)", display: "inline-block" }}
                          >
                            View full run →
                          </Link>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
