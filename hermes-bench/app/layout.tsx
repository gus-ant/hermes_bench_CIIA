import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "HERMES-BENCH | CIIA AI Benchmark Platform",
  description:
    "Professional AI model benchmarking platform for evaluating HERMES agents at CIIA. Compare quality, cost, latency, and tool reliability across models.",
  keywords: ["AI benchmark", "LLM evaluation", "CIIA", "HERMES", "model comparison"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            <div className="page-wrapper">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
