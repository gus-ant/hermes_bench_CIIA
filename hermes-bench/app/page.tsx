"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { modelsData } from "@/data/models";

interface OverviewStats {
  modelsTested: number;
  totalTasks: number;
  totalRuns: number;
  successRate: number;
  avgCost: number;
  avgLatencyMs: number;
  bestModel: string | null;
  bestModelScore: number;
  totalCost: number;
  avgQuality: number;
  runsByStatus: Record<string, number>;
  recentBenchmarks: Array<{ _id: string; name: string; status: string; completedRuns: number; totalRuns: number; createdAt: string }>;
}

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
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color?: string;
}) {
  return (
    <div
      className="kpi-card"
      style={{ "--kpi-color": color || "var(--accent-blue)" } as React.CSSProperties}
    >
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="score-bar-container">
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <div className="score-value">{score.toFixed(1)}</div>
    </div>
  );
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

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, lbRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/leaderboard"),
      ]);
      const statsData = await statsRes.json();
      const lbData = await lbRes.json();
      setStats(statsData);
      setLeaderboard(lbData.leaderboard || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Database seeded!\n${data.seeded.agents} agents, ${data.seeded.models} models, ${data.seeded.tasks} tasks`);
        fetchData();
      }
    } catch {
      alert("❌ Seeding failed — is MongoDB running?");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = leaderboard.slice(0, 5).map((m) => ({
    name: m.modelName.split(" ").slice(0, 2).join(" "),
    score: m.overallScore,
    quality: m.qualityScore,
    color: m.color,
  }));

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            HERMES-BENCH{" "}
            <span style={{ color: "var(--accent-blue)", fontSize: "1rem" }}>v1.0</span>
          </h1>
          <p className="page-subtitle">
            AI Model Benchmark Platform for CIIA HERMES Agents
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Seeding...
              </>
            ) : (
              "🌱 Seed DB"
            )}
          </button>
          <Link href="/benchmark" className="btn btn-primary">
            🚀 Run Benchmark
          </Link>
        </div>
      </div>

      {/* Mock mode alert */}
      <div className="alert alert-warning" style={{ marginBottom: "var(--space-8)" }}>
        <span>⚡</span>
        <span>
          <strong>MOCK MODE ACTIVE</strong> — No real API calls are being made. All data is
          simulated. Set <code>MOCK_MODE=false</code> and configure API keys to run real benchmarks.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <StatCard
          label="Models Tested"
          value={loading ? "—" : (stats?.modelsTested ?? modelsData.length)}
          sub="AI models configured"
          icon="🤖"
          color="var(--accent-blue)"
        />
        <StatCard
          label="Tasks"
          value={loading ? "—" : (stats?.totalTasks ?? 30)}
          sub="across 3 agents"
          icon="📋"
          color="var(--accent-purple)"
        />
        <StatCard
          label="Total Runs"
          value={loading ? "—" : stats?.totalRuns?.toLocaleString() ?? 0}
          sub="benchmark executions"
          icon="▶"
          color="var(--accent-cyan)"
        />
        <StatCard
          label="Success Rate"
          value={loading ? "—" : `${stats?.successRate ?? 0}%`}
          sub="completed successfully"
          icon="✓"
          color="var(--accent-green)"
        />
        <StatCard
          label="Avg Cost"
          value={loading ? "—" : stats?.avgCost ? `$${stats.avgCost.toFixed(5)}` : "$0.00000"}
          sub="per run"
          icon="💰"
          color="var(--accent-amber)"
        />
        <StatCard
          label="Avg Latency"
          value={loading ? "—" : stats?.avgLatencyMs ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s` : "0.0s"}
          sub="per execution"
          icon="⚡"
          color="var(--accent-pink)"
        />
        <StatCard
          label="Best Model"
          value={loading ? "—" : stats?.bestModel ?? "N/A"}
          sub={stats?.bestModelScore ? `Score: ${stats.bestModelScore.toFixed(1)}` : "No runs yet"}
          icon="🏆"
          color="var(--accent-amber)"
        />
        <StatCard
          label="Total Cost"
          value={loading ? "—" : `$${(stats?.totalCost ?? 0).toFixed(4)}`}
          sub="benchmark spend"
          icon="📊"
          color="var(--accent-red)"
        />
      </div>

      <div className="grid-2">
        {/* Leaderboard preview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏆 Current Rankings</span>
            <Link href="/leaderboard" className="btn btn-ghost btn-sm">
              View All →
            </Link>
          </div>
          {leaderboard.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-8)" }}>
              <div className="empty-state-icon">🏆</div>
              <div className="empty-state-title">No runs yet</div>
              <div className="empty-state-desc">
                Run a benchmark to see model rankings here.
              </div>
            </div>
          ) : (
            <div>
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div
                  key={entry.modelId}
                  className="stat-row"
                  style={{ alignItems: "center" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div
                      className={`rank-badge ${
                        i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "rank-other"
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <div
                          className="model-dot"
                          style={{ background: entry.color }}
                        />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {entry.modelName}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                        {entry.provider}
                      </div>
                    </div>
                  </div>
                  <ScoreBar score={entry.overallScore} color={entry.color} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Model Scores</span>
            <Link href="/compare" className="btn btn-ghost btn-sm">
              Compare →
            </Link>
          </div>
          {chartData.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-8)" }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No data yet</div>
              <div className="empty-state-desc">Run a benchmark to see charts.</div>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Final Score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Models overview */}
      <div className="section" style={{ marginTop: "var(--space-8)" }}>
        <div className="section-title">Configured Models</div>
        <div className="grid-4">
          {modelsData.map((model) => (
            <div
              key={model.id}
              className="card card-sm"
              style={{ borderTop: `2px solid ${model.color}` }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "var(--space-3)",
                }}
              >
                <span
                  className="badge"
                  style={{
                    background: `${model.color}20`,
                    color: model.color,
                    border: `1px solid ${model.color}40`,
                  }}
                >
                  {model.provider}
                </span>
                {model.enabled ? (
                  <span className="badge badge-green">Active</span>
                ) : (
                  <span className="badge badge-gray">Disabled</span>
                )}
              </div>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {model.name}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-tertiary)",
                  marginBottom: "var(--space-3)",
                }}
              >
                {model.parameterCount} params · {(model.contextWindow / 1000).toFixed(0)}K ctx
              </div>
              <div className="stat-row" style={{ padding: "var(--space-2) 0" }}>
                <span className="stat-label">Input</span>
                <span className="stat-value">${model.inputPricePer1M}/1M</span>
              </div>
              <div className="stat-row" style={{ padding: "var(--space-2) 0" }}>
                <span className="stat-label">Output</span>
                <span className="stat-value">${model.outputPricePer1M}/1M</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="section">
        <div className="section-title">Quick Navigation</div>
        <div className="grid-3">
          {[
            { href: "/leaderboard", icon: "🏆", title: "Leaderboard", desc: "Full ranking by score, quality, cost, and reliability" },
            { href: "/compare", icon: "⚖", title: "Model Comparison", desc: "Quality × Cost and Quality × Latency scatter charts" },
            { href: "/errors", icon: "⚠", title: "Error Analysis", desc: "Breakdown of failures by model, agent, and category" },
            { href: "/costs", icon: "💰", title: "Cost Analysis", desc: "Financial breakdown and monthly projections" },
            { href: "/tasks", icon: "📋", title: "Task Explorer", desc: "Browse all 30 tasks and compare model responses" },
            { href: "/benchmark", icon: "🚀", title: "Run Benchmark", desc: "Configure and launch a new benchmark run" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="card card-sm" style={{ display: "block", textDecoration: "none" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "var(--space-2)" }}>{item.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: "var(--space-1)", color: "var(--text-primary)" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
