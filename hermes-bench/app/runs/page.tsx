"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { modelsData } from "@/data/models";
import { allTasks } from "@/data/tasks/index";

interface Run {
  _id: string;
  runId: string;
  benchmarkId: string;
  model: string;
  agent: string;
  task: string;
  trial: number;
  status: string;
  qualityScore?: number;
  finalScore?: number;
  latencyMs: number;
  cost: number;
  toolCallsCount: number;
  toolErrorsCount: number;
  inputTokens: number;
  outputTokens: number;
  timestamp: string;
  error?: string;
}

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (filterModel !== "all") params.set("model", filterModel);
      if (filterAgent !== "all") params.set("agent", filterAgent);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/runs?${params}`);
      const data = await res.json();
      setRuns(data.runs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [filterModel, filterAgent, filterStatus, page]);

  const modelName = (id: string) => modelsData.find((m) => m.id === id)?.name || id;
  const modelColor = (id: string) => modelsData.find((m) => m.id === id)?.color || "#6366F1";
  const taskName = (id: string) => allTasks.find((t) => t.id === id)?.title || id;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">▶ Runs</h1>
          <p className="page-subtitle">{total.toLocaleString()} total benchmark executions</p>
        </div>
        <div className="page-actions">
          <a href="/api/export?format=csv" className="btn btn-secondary btn-sm">
            ⬇ Export CSV
          </a>
          <a href="/api/export?format=json" className="btn btn-secondary btn-sm">
            ⬇ Export JSON
          </a>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label">Model</label>
          <select value={filterModel} onChange={(e) => { setFilterModel(e.target.value); setPage(1); }}>
            <option value="all">All Models</option>
            {modelsData.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Agent</label>
          <select value={filterAgent} onChange={(e) => { setFilterAgent(e.target.value); setPage(1); }}>
            <option value="all">All Agents</option>
            <option value="capacitacao">Capacitação</option>
            <option value="drive">Google Drive</option>
            <option value="comunicacao">Comunicação</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="timeout">Timeout</option>
            <option value="running">Running</option>
          </select>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
          Showing {runs.length} of {total}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : runs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">▶</div>
          <div className="empty-state-title">No runs found</div>
          <div className="empty-state-desc">
            <Link href="/benchmark" style={{ color: "var(--accent-blue)" }}>
              Start a benchmark
            </Link>{" "}
            to see runs here.
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Model</th>
                <th>Task</th>
                <th>Agent</th>
                <th>Trial</th>
                <th>Status</th>
                <th>Quality</th>
                <th>Score</th>
                <th>Cost</th>
                <th>Latency</th>
                <th>Tokens</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.runId}>
                  <td>
                    <Link
                      href={`/runs/${run.runId}`}
                      style={{ color: "var(--accent-blue)", fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem" }}
                    >
                      {run.runId.slice(0, 8)}…
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <div className="model-dot" style={{ background: modelColor(run.model) }} />
                      <span style={{ fontSize: "0.78rem", fontWeight: 500 }}>
                        {modelName(run.model).split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>
                  </td>
                  <td>
                    <Link href={`/tasks/${run.task}`} style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      <span className="badge badge-blue" style={{ marginRight: "var(--space-2)" }}>{run.task}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {taskName(run.task).slice(0, 20)}
                      </span>
                    </Link>
                  </td>
                  <td className="td-muted">{run.agent}</td>
                  <td className="td-mono td-muted">{run.trial}</td>
                  <td>
                    <span className={`badge badge-${run.status}`}>{run.status}</span>
                  </td>
                  <td className="td-mono">{run.qualityScore ?? "—"}</td>
                  <td className="td-mono">{run.finalScore?.toFixed(1) ?? "—"}</td>
                  <td className="td-mono">${run.cost.toFixed(5)}</td>
                  <td className="td-mono">{(run.latencyMs / 1000).toFixed(1)}s</td>
                  <td className="td-mono td-muted">{run.inputTokens + run.outputTokens}</td>
                  <td className="td-muted" style={{ fontSize: "0.72rem" }}>
                    {new Date(run.timestamp).toLocaleDateString("pt-BR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 50 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Prev
          </button>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem", alignSelf: "center" }}>
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= Math.ceil(total / 50)}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
