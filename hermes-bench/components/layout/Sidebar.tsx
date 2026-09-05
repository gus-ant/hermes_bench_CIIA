"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    section: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: "⬡" },
      { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
    ],
  },
  {
    section: "Analysis",
    items: [
      { href: "/compare", label: "Model Comparison", icon: "⚖" },
      { href: "/tasks", label: "Task Explorer", icon: "📋" },
      { href: "/runs", label: "Runs", icon: "▶" },
      { href: "/errors", label: "Error Analysis", icon: "⚠" },
      { href: "/costs", label: "Cost Analysis", icon: "💰" },
    ],
  },
  {
    section: "Agents",
    items: [
      { href: "/agents/capacitacao", label: "Capacitação", icon: "🎓" },
      { href: "/agents/drive", label: "Google Drive", icon: "📁" },
      { href: "/agents/comunicacao", label: "Comunicação", icon: "📢" },
    ],
  },
  {
    section: "Runner",
    items: [
      { href: "/benchmark", label: "Run Benchmark", icon: "🚀" },
    ],
  },
];

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">⬡</div>
        <div>
          <div className="sidebar-brand-name">HERMES-BENCH</div>
          <div className="sidebar-brand-sub">CIIA Benchmark Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span style={{ fontSize: "0.9rem" }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="mock-badge">MOCK MODE</span>
        <div style={{ marginTop: "8px", fontSize: "0.68rem", color: "var(--text-tertiary)" }}>
          v1.0 · HERMES-BENCH
        </div>
      </div>
    </aside>
  );
}
