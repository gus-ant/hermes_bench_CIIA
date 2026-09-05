"use client";

import { useState, useEffect, useRef } from "react";
import { modelsData } from "@/data/models";
import { agentsData } from "@/data/agents";
import { allTasks } from "@/data/tasks/index";
import Link from "next/link";

interface BenchmarkProgress {
  benchmarkId: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  currentRun?: { model: string; task: string; trial: number };
  modelProgress: Record<string, { total: number; completed: number }>;
  status: string;
}

interface Benchmark {
  _id: string;
  id: string;
  name: string;
  status: string;
  totalRuns: number;
  completedRuns: number;
  createdAt: string;
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar-fill"
        style={{
          width: `${pct}%`,
          background: color,
        }}
      />
    </div>
  );
}

export default function BenchmarkPage() {
  const [name, setName] = useState("HERMES-BENCH Run #1");
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set(modelsData.map((m) => m.id)));
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set(agentsData.map((a) => a.id)));
  const [trials, setTrials] = useState(3);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<BenchmarkProgress | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const filteredTasks = allTasks.filter((t) => selectedAgents.has(t.agent));
  const totalPlannedRuns = selectedModels.size * filteredTasks.length * trials;

  useEffect(() => {
    fetch("/api/benchmarks")
      .then((r) => r.json())
      .then((d) => setBenchmarks(d.benchmarks || []));
  }, []);

  // Poll progress when running
  useEffect(() => {
    if (!activeBenchmarkId || !running) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/benchmarks/${activeBenchmarkId}/progress`);
        const data = await res.json();
        setProgress(data);
        if (data.status === "completed" || data.status === "cancelled") {
          setRunning(false);
          if (pollRef.current) clearInterval(pollRef.current);
          // Refresh benchmark list
          fetch("/api/benchmarks")
            .then((r) => r.json())
            .then((d) => setBenchmarks(d.benchmarks || []));
        }
      } catch {
        // ignore poll errors
      }
    };

    pollRef.current = setInterval(poll, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeBenchmarkId, running]);

  const toggleModel = (id: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 0) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStart = async () => {
    if (!name.trim()) { setError("Please enter a benchmark name."); return; }
    if (selectedModels.size === 0) { setError("Select at least one model."); return; }
    if (selectedAgents.size === 0) { setError("Select at least one agent."); return; }

    setError(null);
    setRunning(true);
    setProgress(null);

    try {
      // Create benchmark
      const createRes = await fetch("/api/benchmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          models: Array.from(selectedModels),
          agents: Array.from(selectedAgents),
          trials,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create benchmark");

      const benchmarkId = createData.benchmark.id;
      setActiveBenchmarkId(benchmarkId);

      // Start benchmark
      const startRes = await fetch(`/api/benchmarks/${benchmarkId}/start`, { method: "POST" });
      if (!startRes.ok) {
        const startData = await startRes.json();
        throw new Error(startData.error || "Failed to start benchmark");
      }

      // Set initial progress
      setProgress({
        benchmarkId,
        totalRuns: totalPlannedRuns,
        completedRuns: 0,
        failedRuns: 0,
        modelProgress: Object.fromEntries(
          Array.from(selectedModels).map((m) => [m, { total: filteredTasks.length * trials, completed: 0 }])
        ),
        status: "running",
      });

      // Refresh benchmark list
      fetch("/api/benchmarks")
        .then((r) => r.json())
        .then((d) => setBenchmarks(d.benchmarks || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setRunning(false);
    }
  };

  const pct = progress ? Math.round((progress.completedRuns / progress.totalRuns) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚀 Run Benchmark</h1>
          <p className="page-subtitle">
            Configure and launch a new HERMES-BENCH evaluation
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Configuration */}
        <div>
          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">1 — Benchmark Name</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={running}
              style={{ width: "100%" }}
            />
          </div>

          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">2 — Select Models</span>
              <span className="badge badge-blue">{selectedModels.size} selected</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {modelsData.map((model) => {
                const isSelected = selectedModels.has(model.id);
                return (
                  <label
                    key={model.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      padding: "var(--space-3) var(--space-4)",
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${isSelected ? model.color : "var(--border)"}`,
                      background: isSelected ? `${model.color}10` : "var(--bg-elevated)",
                      cursor: running ? "not-allowed" : "pointer",
                      transition: "all var(--transition)",
                      opacity: running ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleModel(model.id)}
                      disabled={running}
                      style={{ accentColor: model.color }}
                    />
                    <div className="model-dot" style={{ background: model.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{model.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                        {model.provider} · ${model.inputPricePer1M}/1M in · ${model.outputPricePer1M}/1M out
                      </div>
                    </div>
                    {isSelected && <span className="badge" style={{ background: `${model.color}20`, color: model.color }}>✓</span>}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">3 — Select Agents</span>
              <span className="badge badge-blue">{selectedAgents.size} selected</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {agentsData.map((agent) => {
                const isSelected = selectedAgents.has(agent.id);
                const agentTasks = allTasks.filter((t) => t.agent === agent.id);
                return (
                  <label
                    key={agent.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      padding: "var(--space-3) var(--space-4)",
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${isSelected ? agent.color : "var(--border)"}`,
                      background: isSelected ? `${agent.color}10` : "var(--bg-elevated)",
                      cursor: running ? "not-allowed" : "pointer",
                      transition: "all var(--transition)",
                      opacity: running ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAgent(agent.id)}
                      disabled={running}
                      style={{ accentColor: agent.color }}
                    />
                    <span style={{ fontSize: "1.2rem" }}>{agent.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{agent.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                        {agentTasks.length} tasks
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">4 — Number of Trials</span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {[1, 2, 3, 5, 10].map((t) => (
                <button
                  key={t}
                  onClick={() => setTrials(t)}
                  disabled={running}
                  className="btn btn-sm"
                  style={{
                    background: trials === t ? "var(--accent-blue-dim)" : "var(--bg-elevated)",
                    borderColor: trials === t ? "var(--accent-blue)" : "var(--border)",
                    color: trials === t ? "var(--accent-blue)" : "var(--text-secondary)",
                  }}
                >
                  {t} trial{t !== 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="card" style={{ background: "var(--accent-blue-dim)", borderColor: "rgba(79,123,255,0.3)" }}>
            <div style={{ fontWeight: 700, color: "var(--accent-blue)", marginBottom: "var(--space-3)" }}>
              📊 Run Summary
            </div>
            {[
              ["Models", selectedModels.size],
              ["Tasks", filteredTasks.length],
              ["Trials", trials],
              ["Total Runs", totalPlannedRuns],
            ].map(([label, value]) => (
              <div className="stat-row" key={String(label)}>
                <span className="stat-label" style={{ color: "var(--text-accent)" }}>{label}</span>
                <span className="stat-value" style={{ color: "var(--accent-blue)" }}>{value}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: "var(--space-4)" }}>
              <span>⚠</span> {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "var(--space-4)", fontSize: "1rem" }}
            onClick={handleStart}
            disabled={running || selectedModels.size === 0 || selectedAgents.size === 0}
          >
            {running ? (
              <>
                <span className="spinner" />
                Running...
              </>
            ) : (
              "🚀 Start Benchmark"
            )}
          </button>
        </div>

        {/* Progress + history */}
        <div>
          {/* Live progress */}
          {(running || progress) && (
            <div className="card" style={{ marginBottom: "var(--space-6)", border: "1px solid var(--accent-blue)", background: "var(--bg-surface)" }}>
              <div className="card-header">
                <span className="card-title" style={{ color: "var(--accent-blue)" }}>
                  {running ? "⚡ Running..." : progress?.status === "completed" ? "✅ Completed" : "📊 Progress"}
                </span>
                {progress && (
                  <span
                    className={`badge ${progress.status === "completed" ? "badge-green" : progress.status === "running" ? "badge-running" : "badge-gray"}`}
                  >
                    {progress.status}
                  </span>
                )}
              </div>

              {progress && (
                <>
                  {/* Overall progress */}
                  <div style={{ marginBottom: "var(--space-6)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        Overall Progress
                      </span>
                      <span style={{ fontSize: "0.82rem", fontFamily: "JetBrains Mono, monospace", color: "var(--accent-blue)" }}>
                        {progress.completedRuns} / {progress.totalRuns} runs ({pct}%)
                      </span>
                    </div>
                    <ProgressBar pct={pct} color="linear-gradient(90deg, var(--accent-blue), var(--accent-purple))" />
                    {progress.failedRuns > 0 && (
                      <div style={{ fontSize: "0.72rem", color: "var(--accent-red)", marginTop: "var(--space-1)" }}>
                        ⚠ {progress.failedRuns} runs failed
                      </div>
                    )}
                  </div>

                  {/* Per-model progress */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    {Object.entries(progress.modelProgress).map(([modelId, mp]) => {
                      const model = modelsData.find((m) => m.id === modelId);
                      const modelPct = mp.total > 0 ? Math.round((mp.completed / mp.total) * 100) : 0;
                      return (
                        <div key={modelId} className="run-progress-item">
                          <div className="run-progress-header">
                            <div className="run-progress-model">
                              <div className="model-dot" style={{ background: model?.color || "#6366F1" }} />
                              {model?.name.split(" ").slice(0, 2).join(" ") || modelId}
                            </div>
                            <div className="run-progress-count">
                              {mp.completed}/{mp.total} ({modelPct}%)
                            </div>
                          </div>
                          <ProgressBar pct={modelPct} color={model?.color || "#6366F1"} />
                        </div>
                      );
                    })}
                  </div>

                  {progress.currentRun && (
                    <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      Current: {modelsData.find((m) => m.id === progress.currentRun?.model)?.name || progress.currentRun?.model}
                      {" → "}{progress.currentRun?.task} Trial {progress.currentRun?.trial}
                    </div>
                  )}

                  {progress.status === "completed" && (
                    <div style={{ marginTop: "var(--space-4)" }}>
                      <Link
                        href="/leaderboard"
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        🏆 View Leaderboard
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Past benchmarks */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Past Benchmarks</span>
              <span className="badge badge-gray">{benchmarks.length}</span>
            </div>
            {benchmarks.length === 0 ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.82rem" }}>
                No benchmarks run yet.
              </div>
            ) : (
              <div>
                {benchmarks.map((b) => (
                  <div
                    key={b._id}
                    className="stat-row"
                    style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--space-2)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{b.name}</span>
                      <span className={`badge badge-${b.status}`}>{b.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "0.72rem", color: "var(--text-tertiary)", width: "100%" }}>
                      <span>{b.completedRuns}/{b.totalRuns} runs</span>
                      <span style={{ marginLeft: "auto" }}>
                        {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {b.totalRuns > 0 && (
                      <div style={{ width: "100%" }}>
                        <ProgressBar
                          pct={Math.round((b.completedRuns / b.totalRuns) * 100)}
                          color={b.status === "completed" ? "var(--accent-green)" : "var(--accent-blue)"}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
