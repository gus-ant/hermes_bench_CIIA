"use client";

import { useEffect, useState } from "react";
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

type SortKey = keyof LeaderboardEntry;
type SortDir = "asc" | "desc";

const CATEGORY_TABS = [
  { id: "overall", label: "Best Overall", sortKey: "overallScore" as SortKey },
  { id: "quality", label: "Best Quality", sortKey: "qualityScore" as SortKey },
  { id: "cheapest", label: "Cheapest", sortKey: "avgCost" as SortKey, asc: true },
  { id: "fastest", label: "Fastest", sortKey: "avgLatencyMs" as SortKey, asc: true },
  { id: "tools", label: "Best Tool Use", sortKey: "toolReliability" as SortKey },
  { id: "reliable", label: "Most Reliable", sortKey: "successRate" as SortKey },
];

function ScoreBar({ score, color, max = 100 }: { score: number; color: string; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="score-bar-container">
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="score-value">{typeof score === "number" ? score.toFixed(1) : "—"}</div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(CATEGORY_TABS[0]);
  const [sortKey, setSortKey] = useState<SortKey>("overallScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...leaderboard].sort((a, b) => {
    const va = a[sortKey] as number;
    const vb = b[sortKey] as number;
    if (typeof va !== "number" || typeof vb !== "number") return 0;
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleTab = (tab: typeof CATEGORY_TABS[0]) => {
    setActiveTab(tab);
    setSortKey(tab.sortKey);
    setSortDir(tab.asc ? "asc" : "desc");
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : " ↕";

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <div style={{ marginTop: "var(--space-4)" }}>Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Leaderboard</h1>
          <p className="page-subtitle">
            Rankings computed from {leaderboard.reduce((s, e) => s + e.totalRuns, 0)} benchmark runs
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="tabs">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab.id === tab.id ? "active" : ""}`}
            onClick={() => handleTab(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <div className="empty-state-title">No benchmark runs yet</div>
          <div className="empty-state-desc">
            Go to <a href="/benchmark" style={{ color: "var(--accent-blue)" }}>Run Benchmark</a> to start your first evaluation.
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th onClick={() => handleSort("modelName")}>Model{sortIndicator("modelName")}</th>
                <th onClick={() => handleSort("overallScore")}>Overall Score{sortIndicator("overallScore")}</th>
                <th onClick={() => handleSort("qualityScore")}>Quality{sortIndicator("qualityScore")}</th>
                <th onClick={() => handleSort("successRate")}>Success Rate{sortIndicator("successRate")}</th>
                <th onClick={() => handleSort("avgCost")}>Avg Cost{sortIndicator("avgCost")}</th>
                <th onClick={() => handleSort("avgLatencyMs")}>Avg Latency{sortIndicator("avgLatencyMs")}</th>
                <th onClick={() => handleSort("toolReliability")}>Tool Reliability{sortIndicator("toolReliability")}</th>
                <th onClick={() => handleSort("totalRuns")}>Runs{sortIndicator("totalRuns")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, i) => {
                const rank = i + 1;
                return (
                  <tr key={entry.modelId}>
                    <td>
                      <div
                        className={`rank-badge ${
                          rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "rank-other"
                        }`}
                      >
                        {rank}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <div className="model-dot" style={{ background: entry.color }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{entry.modelName}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>{entry.provider}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <ScoreBar score={entry.overallScore} color={entry.color} />
                    </td>
                    <td>
                      <ScoreBar score={entry.qualityScore} color="var(--accent-purple)" />
                    </td>
                    <td>
                      <span className={`badge ${entry.successRate >= 80 ? "badge-green" : entry.successRate >= 60 ? "badge-amber" : "badge-red"}`}>
                        {entry.successRate}%
                      </span>
                    </td>
                    <td className="td-mono">${entry.avgCost.toFixed(5)}</td>
                    <td className="td-mono">{(entry.avgLatencyMs / 1000).toFixed(1)}s</td>
                    <td>
                      <ScoreBar score={entry.toolReliability} color="var(--accent-cyan)" />
                    </td>
                    <td className="td-muted td-mono">{entry.totalRuns}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {sorted.length > 0 && (
        <div style={{ marginTop: "var(--space-6)", display: "flex", gap: "var(--space-8)", flexWrap: "wrap" }}>
          <div>
            <div className="section-title" style={{ marginBottom: "var(--space-3)" }}>Score Weights</div>
            <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
              {[
                { label: "Quality", w: "35%", color: "var(--accent-blue)" },
                { label: "Tool Use", w: "20%", color: "var(--accent-cyan)" },
                { label: "Cost", w: "20%", color: "var(--accent-amber)" },
                { label: "Latency", w: "15%", color: "var(--accent-purple)" },
                { label: "Reliability", w: "10%", color: "var(--accent-green)" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {item.label}: <strong style={{ color: "var(--text-primary)" }}>{item.w}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
