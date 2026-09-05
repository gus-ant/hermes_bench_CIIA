"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { allTasks } from "@/data/tasks/index";
import { agentsData } from "@/data/agents";
import { modelsData } from "@/data/models";

const DIFFICULTY_LABELS: Record<string, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
  muito_dificil: "Muito Difícil",
};

export default function TasksPage() {
  const [agent, setAgent] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = allTasks.filter((t) => {
    if (agent !== "all" && t.agent !== agent) return false;
    if (difficulty !== "all" && t.difficulty !== difficulty) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const agentInfo = (slug: string) => agentsData.find((a) => a.slug === slug);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Task Explorer</h1>
          <p className="page-subtitle">
            Browse all {allTasks.length} benchmark tasks across 3 agents
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label">Agent</label>
          <select value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="all">All Agents</option>
            {agentsData.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="all">All</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
            <option value="muito_dificil">Muito Difícil</option>
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label className="filter-label">Search</label>
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", maxWidth: 300 }}
          />
        </div>
        <div style={{ marginLeft: "auto", color: "var(--text-tertiary)", fontSize: "0.78rem" }}>
          {filtered.length} of {allTasks.length} tasks
        </div>
      </div>

      {/* Agent sections */}
      {agent === "all" ? (
        agentsData.map((ag) => {
          const agentTasks = filtered.filter((t) => t.agent === ag.id);
          if (agentTasks.length === 0) return null;
          return (
            <div key={ag.id} className="section">
              <div className="section-title" style={{ color: ag.color }}>
                <span>{ag.icon}</span>
                {ag.name}
                <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 400 }}>
                  {agentTasks.length} tasks
                </span>
              </div>
              <div className="task-grid">
                {agentTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="task-card">
                    <div className="task-card-header">
                      <span className="task-card-id">{task.id}</span>
                      <span className={`badge badge-${task.difficulty}`}>
                        {DIFFICULTY_LABELS[task.difficulty]}
                      </span>
                    </div>
                    <div className="task-card-title">{task.title}</div>
                    <div className="task-card-desc">{task.description}</div>
                    <div className="task-card-footer">
                      {task.tools.slice(0, 3).map((tool) => (
                        <span key={tool} className="badge badge-amber">
                          🔧 {tool}
                        </span>
                      ))}
                      {task.tools.length === 0 && (
                        <span className="badge badge-gray">No tools</span>
                      )}
                      {task.tools.length > 3 && (
                        <span className="badge badge-gray">+{task.tools.length - 3}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="task-grid">
          {filtered.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="task-card">
              <div className="task-card-header">
                <span className="task-card-id">{task.id}</span>
                <span className={`badge badge-${task.difficulty}`}>
                  {DIFFICULTY_LABELS[task.difficulty]}
                </span>
              </div>
              <div className="task-card-title">{task.title}</div>
              <div className="task-card-desc">{task.description}</div>
              <div className="task-card-footer">
                {task.tools.slice(0, 3).map((tool) => (
                  <span key={tool} className="badge badge-amber">
                    🔧 {tool}
                  </span>
                ))}
                {task.tools.length === 0 && (
                  <span className="badge badge-gray">No tools</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No tasks found</div>
          <div className="empty-state-desc">Try adjusting your filters.</div>
        </div>
      )}
    </div>
  );
}
