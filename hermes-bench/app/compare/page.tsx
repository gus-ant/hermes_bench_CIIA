"use client";

import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { modelsData } from "@/data/models";

interface LeaderboardEntry {
  rank: number;
  modelId: string;
  modelName: string;
  provider: string;
  color: string;
  overallScore: number;
  qualityScore: number;
  successRate: number;
  avgCost: number;
  avgLatencyMs: number;
  toolReliability: number;
  totalRuns: number;
  completedRuns: number;
  totalCost: number;
  avgTokens: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip-label" style={{ color: d.color }}>
          {d.modelName}
        </div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="custom-tooltip-item">
            {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(3) : p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ComparePage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(modelsData.map((m) => m.id))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .finally(() => setLoading(false));
  }, []);

  const toggleModel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = leaderboard.filter((e) => selected.has(e.modelId));

  // Quality × Cost data
  const qcData = filtered.map((e) => ({
    x: e.avgCost * 1000,
    y: e.qualityScore,
    modelName: e.modelName,
    color: e.color,
    modelId: e.modelId,
  }));

  // Quality × Latency data
  const qlData = filtered.map((e) => ({
    x: e.avgLatencyMs / 1000,
    y: e.qualityScore,
    modelName: e.modelName,
    color: e.color,
    modelId: e.modelId,
  }));

  // Cost per successful run
  const cpsData = filtered.map((e) => ({
    name: e.modelName.split(" ").slice(0, 2).join(" "),
    costPerSuccess:
      e.completedRuns > 0 ? (e.totalCost / e.completedRuns) * 1000 : 0,
    color: e.color,
  }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚖ Model Comparison</h1>
          <p className="page-subtitle">
            Compare quality, cost, latency, and tool reliability across models
          </p>
        </div>
      </div>

      {/* Model selector */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-header">
          <span className="card-title">Select Models</span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
            {selected.size} of {modelsData.length} selected
          </span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          {modelsData.map((model) => {
            const isSelected = selected.has(model.id);
            return (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${isSelected ? model.color : "var(--border)"}`,
                  background: isSelected ? `${model.color}20` : "var(--bg-elevated)",
                  color: isSelected ? model.color : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  transition: "all var(--transition)",
                }}
              >
                <div
                  className="model-dot"
                  style={{
                    background: isSelected ? model.color : "var(--text-tertiary)",
                  }}
                />
                {model.name}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <div style={{ marginTop: "var(--space-4)" }}>Loading comparison data...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No benchmark data</div>
          <div className="empty-state-desc">
            Run a benchmark first to compare models.
          </div>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="chart-grid" style={{ marginBottom: "var(--space-8)" }}>
            {/* Quality × Cost */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Quality × Cost</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                  Higher quality + lower cost = better
                </span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="x"
                      name="Avg Cost (m$)"
                      label={{ value: "Avg Cost (m$)", position: "bottom", fill: "var(--text-secondary)", fontSize: 11 }}
                      tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    />
                    <YAxis
                      dataKey="y"
                      name="Quality Score"
                      domain={[0, 100]}
                      label={{ value: "Quality", angle: -90, position: "insideLeft", fill: "var(--text-secondary)", fontSize: 11 }}
                      tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {filtered.map((entry) => (
                      <Scatter
                        key={entry.modelId}
                        data={qcData.filter((d) => d.modelId === entry.modelId)}
                        fill={entry.color}
                        name={entry.modelName}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quality × Latency */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Quality × Latency</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                  Higher quality + lower latency = better
                </span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="x"
                      name="Avg Latency (s)"
                      label={{ value: "Avg Latency (s)", position: "bottom", fill: "var(--text-secondary)", fontSize: 11 }}
                      tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    />
                    <YAxis
                      dataKey="y"
                      name="Quality Score"
                      domain={[0, 100]}
                      label={{ value: "Quality", angle: -90, position: "insideLeft", fill: "var(--text-secondary)", fontSize: 11 }}
                      tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {filtered.map((entry) => (
                      <Scatter
                        key={entry.modelId}
                        data={qlData.filter((d) => d.modelId === entry.modelId)}
                        fill={entry.color}
                        name={entry.modelName}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost per successful task */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Cost per Successful Task</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                  Millidollars per successful run
                </span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cpsData} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="costPerSuccess" name="Cost (m$)" radius={[4, 4, 0, 0]}>
                      {cpsData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side-by-side metrics table */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Metrics Comparison</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ fontSize: "0.78rem" }}>
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Score</th>
                      <th>Quality</th>
                      <th>Success</th>
                      <th>Cost</th>
                      <th>Latency</th>
                      <th>Tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr key={entry.modelId}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <div className="model-dot" style={{ background: entry.color }} />
                            <span style={{ fontWeight: 600, fontSize: "0.78rem" }}>
                              {entry.modelName.split(" ").slice(0, 2).join(" ")}
                            </span>
                          </div>
                        </td>
                        <td className="td-mono">{entry.overallScore.toFixed(1)}</td>
                        <td className="td-mono">{entry.qualityScore}</td>
                        <td>
                          <span className={`badge ${entry.successRate >= 80 ? "badge-green" : entry.successRate >= 60 ? "badge-amber" : "badge-red"}`}>
                            {entry.successRate}%
                          </span>
                        </td>
                        <td className="td-mono">${entry.avgCost.toFixed(5)}</td>
                        <td className="td-mono">{(entry.avgLatencyMs / 1000).toFixed(1)}s</td>
                        <td className="td-mono">{entry.toolReliability}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
