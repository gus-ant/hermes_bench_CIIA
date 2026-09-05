"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { agentsData } from "@/data/agents";
import { modelsData } from "@/data/models";
import { getTasksByAgent } from "@/data/tasks/index";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

interface AgentStats {
  model: string;
  avgScore: number;
  successRate: number;
  avgQuality: number;
  toolSuccessRate: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip-label">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="custom-tooltip-item">
            <span style={{ color: p.fill || p.color }}>●</span>
            {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const agent = agentsData.find((a) => a.slug === slug);
  const tasks = getTasksByAgent(slug);

  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/runs?agent=${slug}&limit=1000`)
      .then((r) => r.json())
      .then((d) => setRuns(d.runs || []))
      .finally(() => setLoading(false));
  }, [slug]);

  if (!agent) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❓</div>
        <div className="empty-state-title">Agent not found</div>
        <Link href="/" style={{ color: "var(--accent-blue)" }}>← Go home</Link>
      </div>
    );
  }

  // Compute per-model stats
  const modelStats: Record<string, { scores: number[]; success: number; total: number; quality: number[]; toolCalls: number; toolSuccess: number }> = {};
  for (const run of runs) {
    if (!modelStats[run.model]) {
      modelStats[run.model] = { scores: [], success: 0, total: 0, quality: [], toolCalls: 0, toolSuccess: 0 };
    }
    const stats = modelStats[run.model];
    stats.total++;
    if (run.status === "completed") {
      stats.success++;
      if (run.finalScore != null) stats.scores.push(run.finalScore);
      if (run.qualityScore != null) stats.quality.push(run.qualityScore);
    }
    stats.toolCalls += run.toolCallsCount || 0;
    stats.toolSuccess += run.successfulToolCalls || 0;
  }

  const agentStatsArr: AgentStats[] = Object.entries(modelStats).map(([modelId, s]) => ({
    model: modelId,
    avgScore: s.scores.length > 0 ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0,
    successRate: s.total > 0 ? (s.success / s.total) * 100 : 0,
    avgQuality: s.quality.length > 0 ? s.quality.reduce((a, b) => a + b, 0) / s.quality.length : 0,
    toolSuccessRate: s.toolCalls > 0 ? (s.toolSuccess / s.toolCalls) * 100 : 100,
  })).sort((a, b) => b.avgScore - a.avgScore);

  // Per-task breakdown
  const taskBarData = tasks.map((task) => {
    const taskRuns = runs.filter((r) => r.task === task.id && r.status === "completed");
    const avgScore = taskRuns.length > 0
      ? taskRuns.reduce((s: number, r: any) => s + (r.qualityScore || 0), 0) / taskRuns.length
      : 0;
    return { name: task.id, score: Math.round(avgScore), title: task.title };
  });

  const radarData = agentStatsArr.slice(0, 5).length > 0 ? [
    { metric: "Quality", ...Object.fromEntries(agentStatsArr.slice(0, 5).map(s => [s.model.split("-").slice(0, 2).join("-"), s.avgQuality])) },
    { metric: "Success", ...Object.fromEntries(agentStatsArr.slice(0, 5).map(s => [s.model.split("-").slice(0, 2).join("-"), s.successRate])) },
    { metric: "Tools", ...Object.fromEntries(agentStatsArr.slice(0, 5).map(s => [s.model.split("-").slice(0, 2).join("-"), s.toolSuccessRate])) },
  ] : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
            <span style={{ fontSize: "1.8rem" }}>{agent.icon}</span>
            <span
              className="badge"
              style={{ background: `${agent.color}20`, color: agent.color, border: `1px solid ${agent.color}40` }}
            >
              Agent
            </span>
          </div>
          <h1 className="page-title" style={{ color: agent.color }}>{agent.name}</h1>
          <p className="page-subtitle">{agent.description}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="kpi-grid" style={{ marginBottom: "var(--space-8)" }}>
        <div className="kpi-card" style={{ "--kpi-color": agent.color } as React.CSSProperties}>
          <div className="kpi-icon">📋</div>
          <div className="kpi-label">Tasks</div>
          <div className="kpi-value">{tasks.length}</div>
          <div className="kpi-sub">{tasks.filter(t => t.tools.length > 0).length} require tools</div>
        </div>
        <div className="kpi-card" style={{ "--kpi-color": agent.color } as React.CSSProperties}>
          <div className="kpi-icon">▶</div>
          <div className="kpi-label">Total Runs</div>
          <div className="kpi-value">{runs.length}</div>
          <div className="kpi-sub">benchmark executions</div>
        </div>
        <div className="kpi-card" style={{ "--kpi-color": agent.color } as React.CSSProperties}>
          <div className="kpi-icon">✓</div>
          <div className="kpi-label">Success Rate</div>
          <div className="kpi-value">
            {runs.length > 0 ? Math.round((runs.filter(r => r.status === "completed").length / runs.length) * 100) : 0}%
          </div>
          <div className="kpi-sub">completed runs</div>
        </div>
        <div className="kpi-card" style={{ "--kpi-color": agent.color } as React.CSSProperties}>
          <div className="kpi-icon">🏆</div>
          <div className="kpi-label">Best Model</div>
          <div className="kpi-value" style={{ fontSize: "1rem" }}>
            {agentStatsArr[0] ? modelsData.find(m => m.id === agentStatsArr[0].model)?.name.split(" ").slice(0, 2).join(" ") || "N/A" : "N/A"}
          </div>
          <div className="kpi-sub">{agentStatsArr[0] ? `Score: ${agentStatsArr[0].avgScore.toFixed(1)}` : "no runs"}</div>
        </div>
      </div>

      <div className="chart-grid">
        {/* Model comparison bar chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Model Performance</span>
          </div>
          {agentStatsArr.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-8)" }}>
              <div className="empty-state-icon">{agent.icon}</div>
              <div className="empty-state-title">No runs yet</div>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={agentStatsArr.map(s => ({
                    name: modelsData.find(m => m.id === s.model)?.name.split(" ").slice(0, 2).join(" ") || s.model,
                    score: Math.round(s.avgScore),
                    color: modelsData.find(m => m.id === s.model)?.color || "#6366F1",
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Avg Score" radius={[4, 4, 0, 0]}>
                    {agentStatsArr.map((entry, idx) => (
                      <Cell key={idx} fill={modelsData.find(m => m.id === entry.model)?.color || "#6366F1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Per-task performance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Per-Task Quality</span>
          </div>
          {taskBarData.every(d => d.score === 0) ? (
            <div className="empty-state" style={{ padding: "var(--space-8)" }}>
              <div className="empty-state-title">No task data yet</div>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={taskBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Avg Quality" fill={agent.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Agent highlights */}
      <div className="section" style={{ marginTop: "var(--space-8)" }}>
        <div className="section-title">Agent Highlights</div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {agent.highlights.map((h) => (
            <span
              key={h}
              className="badge"
              style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}30`, padding: "6px 14px" }}
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="section">
        <div className="section-title">Tasks ({tasks.length})</div>
        <div className="task-grid">
          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="task-card">
              <div className="task-card-header">
                <span className="task-card-id">{task.id}</span>
                <span className={`badge badge-${task.difficulty}`}>
                  {task.difficulty === "muito_dificil" ? "Muito Difícil" : task.difficulty === "facil" ? "Fácil" : task.difficulty === "medio" ? "Médio" : "Difícil"}
                </span>
              </div>
              <div className="task-card-title">{task.title}</div>
              <div className="task-card-desc">{task.description}</div>
              <div className="task-card-footer">
                {task.tools.length > 0
                  ? task.tools.slice(0, 2).map(t => <span key={t} className="badge badge-amber">🔧 {t}</span>)
                  : <span className="badge badge-gray">No tools</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
