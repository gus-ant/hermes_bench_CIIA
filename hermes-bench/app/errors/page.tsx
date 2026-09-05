"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { modelsData } from "@/data/models";

const ERROR_CATEGORIES = [
  { id: "wrong_answer", label: "Wrong Answer", color: "var(--accent-red)" },
  { id: "tool_error", label: "Tool Error", color: "var(--accent-amber)" },
  { id: "invalid_tool_call", label: "Invalid Tool Call", color: "var(--accent-orange, #F97316)" },
  { id: "hallucination", label: "Hallucination", color: "var(--accent-purple)" },
  { id: "incomplete_task", label: "Incomplete Task", color: "var(--accent-blue)" },
  { id: "timeout", label: "Timeout", color: "var(--accent-cyan)" },
  { id: "api_error", label: "API Error", color: "var(--accent-pink)" },
  { id: "parsing_error", label: "Parsing Error", color: "#F97316" },
  { id: "safety_error", label: "Safety Error", color: "#BE123C" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip-label">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="custom-tooltip-item">
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ErrorsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/errors")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const totalFailed = data?.totalFailed || 0;
  const errorsByModel: Array<{ _id: string; count: number }> = data?.errorsByModel || [];
  const errorsByAgent: Array<{ _id: string; count: number }> = data?.errorsByAgent || [];

  const modelBarData = errorsByModel.map((e) => ({
    name: modelsData.find((m) => m.id === e._id)?.name.split(" ").slice(0, 2).join(" ") || e._id,
    errors: e.count,
    color: modelsData.find((m) => m.id === e._id)?.color || "#6366F1",
  }));

  const agentBarData = errorsByAgent.map((e) => ({
    name: e._id === "capacitacao" ? "Capacitação" : e._id === "drive" ? "Google Drive" : "Comunicação",
    errors: e.count,
    color: e._id === "capacitacao" ? "#8B5CF6" : e._id === "drive" ? "#F59E0B" : "#EC4899",
  }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚠ Error Analysis</h1>
          <p className="page-subtitle">
            {totalFailed} failed runs analyzed across all benchmarks
          </p>
        </div>
      </div>

      {totalFailed === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">No errors recorded</div>
          <div className="empty-state-desc">
            Run a benchmark to see error analysis. Or all runs succeeded — congratulations!
          </div>
        </div>
      ) : (
        <>
          {/* Error category legend */}
          <div className="card" style={{ marginBottom: "var(--space-6)" }}>
            <div className="card-header">
              <span className="card-title">Error Categories</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
              {ERROR_CATEGORIES.map((cat) => {
                const catErrors = (data?.errorsByCategory || []).filter((e: any) => e._id?.category === cat.id);
                const total = catErrors.reduce((s: number, e: any) => s + e.count, 0);
                if (total === 0) return null;
                return (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-2) var(--space-4)",
                      background: "var(--bg-elevated)",
                      border: `1px solid var(--border)`,
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color }} />
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{cat.label}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: cat.color, fontFamily: "JetBrains Mono, monospace" }}>
                      {total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chart-grid">
            {/* Errors by model */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Errors by Model</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Lower = better</span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={modelBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="errors" name="Errors" radius={[4, 4, 0, 0]}>
                      {modelBarData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Errors by agent */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Errors by Agent</span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={agentBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="errors" name="Errors" radius={[4, 4, 0, 0]}>
                      {agentBarData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
