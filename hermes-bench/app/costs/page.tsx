"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { modelsData } from "@/data/models";
import { allTasks } from "@/data/tasks/index";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip-label">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="custom-tooltip-item">
            <span style={{ color: p.fill || p.stroke }}>●</span>
            {p.name}: <strong>${typeof p.value === "number" ? p.value.toFixed(5) : p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CostsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksPerMonth, setTasksPerMonth] = useState(500);

  useEffect(() => {
    fetch("/api/runs?limit=5000")
      .then((r) => r.json())
      .then((d) => setRuns(d.runs || []))
      .finally(() => setLoading(false));
  }, []);

  const totalCost = runs.reduce((s, r) => s + (r.cost || 0), 0);

  // Cost by model
  const costByModel: Record<string, number> = {};
  for (const run of runs) {
    costByModel[run.model] = (costByModel[run.model] || 0) + (run.cost || 0);
  }

  const modelCostData = Object.entries(costByModel).map(([modelId, cost]) => ({
    name: modelsData.find((m) => m.id === modelId)?.name.split(" ").slice(0, 2).join(" ") || modelId,
    cost,
    color: modelsData.find((m) => m.id === modelId)?.color || "#6366F1",
  })).sort((a, b) => b.cost - a.cost);

  // Cost by agent
  const costByAgent: Record<string, number> = {};
  for (const run of runs) {
    costByAgent[run.agent] = (costByAgent[run.agent] || 0) + (run.cost || 0);
  }

  const agentCostData = Object.entries(costByAgent).map(([agent, cost]) => ({
    name: agent === "capacitacao" ? "Capacitação" : agent === "drive" ? "Google Drive" : "Comunicação",
    cost,
    color: agent === "capacitacao" ? "#8B5CF6" : agent === "drive" ? "#F59E0B" : "#EC4899",
  }));

  // Avg cost per successful task per model
  const successfulByModel: Record<string, { cost: number; count: number }> = {};
  for (const run of runs.filter((r) => r.status === "completed")) {
    if (!successfulByModel[run.model]) successfulByModel[run.model] = { cost: 0, count: 0 };
    successfulByModel[run.model].cost += run.cost || 0;
    successfulByModel[run.model].count++;
  }

  const costPerSuccessData = Object.entries(successfulByModel).map(([modelId, s]) => ({
    name: modelsData.find((m) => m.id === modelId)?.name.split(" ").slice(0, 2).join(" ") || modelId,
    costPerSuccess: s.count > 0 ? s.cost / s.count : 0,
    color: modelsData.find((m) => m.id === modelId)?.color || "#6366F1",
  })).sort((a, b) => a.costPerSuccess - b.costPerSuccess);

  // Monthly projection
  const avgCostPerRun = runs.length > 0 ? totalCost / runs.length : 0;
  const projectedMonthly = avgCostPerRun * tasksPerMonth;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Cost Analysis</h1>
          <p className="page-subtitle">
            Financial breakdown across {runs.length} benchmark runs
          </p>
        </div>
        <div className="page-actions">
          <a href="/api/export?format=csv" className="btn btn-secondary btn-sm">
            ⬇ Export CSV
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: "var(--space-8)" }}>
        <div className="kpi-card" style={{ "--kpi-color": "var(--accent-amber)" } as React.CSSProperties}>
          <div className="kpi-icon">💰</div>
          <div className="kpi-label">Total Benchmark Cost</div>
          <div className="kpi-value">${totalCost.toFixed(4)}</div>
          <div className="kpi-sub">{runs.length} runs total</div>
        </div>
        <div className="kpi-card" style={{ "--kpi-color": "var(--accent-green)" } as React.CSSProperties}>
          <div className="kpi-icon">📊</div>
          <div className="kpi-label">Avg Cost / Run</div>
          <div className="kpi-value">${avgCostPerRun.toFixed(5)}</div>
          <div className="kpi-sub">all models combined</div>
        </div>
        <div className="kpi-card" style={{ "--kpi-color": "var(--accent-blue)" } as React.CSSProperties}>
          <div className="kpi-icon">🤖</div>
          <div className="kpi-label">Cheapest Model</div>
          <div className="kpi-value" style={{ fontSize: "1rem" }}>
            {costPerSuccessData[0]?.name || "N/A"}
          </div>
          <div className="kpi-sub">
            {costPerSuccessData[0] ? `$${costPerSuccessData[0].costPerSuccess.toFixed(5)}/success` : "no data"}
          </div>
        </div>
        <div className="kpi-card" style={{ "--kpi-color": "var(--accent-purple)" } as React.CSSProperties}>
          <div className="kpi-icon">📅</div>
          <div className="kpi-label">Projected Monthly</div>
          <div className="kpi-value">${projectedMonthly.toFixed(2)}</div>
          <div className="kpi-sub">at {tasksPerMonth} tasks/month</div>
        </div>
      </div>

      <div className="chart-grid" style={{ marginBottom: "var(--space-8)" }}>
        {/* Cost by model */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Total Cost by Model</span>
          </div>
          {modelCostData.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-8)" }}>
              <div className="empty-state-title">No data yet</div>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={modelCostData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cost" name="Total Cost ($)" radius={[4, 4, 0, 0]}>
                    {modelCostData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Cost per successful task */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cost per Successful Task</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Lower = more efficient</span>
          </div>
          {costPerSuccessData.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-8)" }}>
              <div className="empty-state-title">No data yet</div>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={costPerSuccessData} layout="vertical" margin={{ top: 10, right: 40, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="costPerSuccess" name="Cost/Success ($)" radius={[0, 4, 4, 0]}>
                    {costPerSuccessData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Monthly projection */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Monthly Cost Projection</span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-8)", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <label className="filter-label" style={{ display: "block", marginBottom: "var(--space-2)" }}>
              Tasks per month
            </label>
            <input
              type="number"
              value={tasksPerMonth}
              onChange={(e) => setTasksPerMonth(parseInt(e.target.value) || 0)}
              min={0}
              max={100000}
              style={{ width: 150 }}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
            {modelsData.map((model) => {
              const avgRunCost = costByModel[model.id]
                ? costByModel[model.id] / (runs.filter((r) => r.model === model.id).length || 1)
                : 0;
              const projected = avgRunCost * tasksPerMonth;
              return (
                <div key={model.id} style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                    <div className="model-dot" style={{ background: model.color }} />
                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {model.name.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: model.color, fontFamily: "JetBrains Mono, monospace" }}>
                    ${projected.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)" }}>
                    ${avgRunCost.toFixed(5)}/run
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
