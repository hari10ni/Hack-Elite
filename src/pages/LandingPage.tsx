import React from "react";
import {
  Network,
  FileCode,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface LandingPageProps {
  onLoadSample?: (scenarioId?: string) => void;
  onNavigateUpload: () => void;
  isLoading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateUpload,
}) => {
  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <section className="relative rounded-2xl border border-[#718477]/25 bg-[#FFFFFF] p-8 sm:p-12 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 rounded-full bg-[#394A3F]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-80 h-80 rounded-full bg-[#C6A76B]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#394A3F]/10 border border-[#394A3F]/25 text-[#394A3F] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#C6A76B]" />
            AI-Powered Software Change Analysis & Risk Assessment
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#202522] leading-tight">
            Predict Blast Radius Before You Merge.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#718477] leading-relaxed max-w-2xl font-normal">
            Safely identify direct and transitive downstream ripple effects, interface signature
            changes, affected tests, and explainable risk indicators using Python AST code analysis,
            directed dependency graphs, and a 5-Agent orchestrator.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              id="btn-hero-upload-project"
              onClick={onNavigateUpload}
              className="px-5 py-2.5 rounded-xl bg-[#394A3F] hover:bg-[#2D3A2A] text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              Upload Python ZIP
              <ArrowRight className="w-4 h-4 text-[#C6A76B]" />
            </button>
          </div>
        </div>
      </section>

      {/* 5-Agent Architecture Pipeline */}
      <section className="rounded-2xl border border-[#718477]/25 bg-[#FFFFFF] p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#202522] tracking-tight">
            The 5-Agent Autonomous Verification Workflow
          </h2>
          <p className="text-xs text-[#718477] mt-1">
            How the orchestrator coordinates specialized agents to analyze risk without hallucinations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              step: "01",
              name: "Change Detection",
              desc: "Parses Git diff / code delta via AST to isolate changed functions, classes, and parameter alterations.",
              color: "text-[#A63A3A]",
              border: "border-[#A63A3A]/25",
              badgeBg: "bg-[#A63A3A]/10",
            },
            {
              step: "02",
              name: "Code Dependency",
              desc: "Traverses module import graph; identifies 1-hop direct callers and multi-hop transitive paths.",
              color: "text-[#845F1E]",
              border: "border-[#C6A76B]/35",
              badgeBg: "bg-[#C6A76B]/20",
            },
            {
              step: "03",
              name: "Impact Assessment",
              desc: "Calculates blast radius severity, callers at risk, and generates explainable evidence items.",
              color: "text-[#394A3F]",
              border: "border-[#394A3F]/30",
              badgeBg: "bg-[#394A3F]/15",
            },
            {
              step: "04",
              name: "Test Recommendation",
              desc: "Identifies related test suites, ranks execution priority, and outputs direct CLI test commands.",
              color: "text-[#394A3F]",
              border: "border-[#718477]/30",
              badgeBg: "bg-[#718477]/15",
            },
            {
              step: "05",
              name: "Release Planning",
              desc: "Compiles pre-release verification checklist, backward-compatibility warnings, and rollback steps.",
              color: "text-[#845F1E]",
              border: "border-[#C6A76B]/35",
              badgeBg: "bg-[#C6A76B]/20",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-[#F7F5EF] border ${item.border} flex flex-col justify-between`}
            >
              <div>
                <span className={`font-mono text-xs font-bold ${item.color}`}>{item.step}</span>
                <h4 className="font-semibold text-sm text-[#202522] mt-1">{item.name}</h4>
                <p className="text-xs text-[#718477] mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Technical Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-[#718477]/25 bg-[#FFFFFF] space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#394A3F]/15 border border-[#394A3F]/30 flex items-center justify-center text-[#394A3F]">
            <FileCode className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-[#202522]">Deterministic AST Analysis</h3>
          <p className="text-xs text-[#718477] leading-relaxed">
            Python built-in <code>ast</code> module scans all functions, classes, calls, and imports
            without code execution. Eliminates hallucinated dependencies.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[#718477]/25 bg-[#FFFFFF] space-y-2 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#C6A76B]/20 border border-[#C6A76B]/35 flex items-center justify-center text-[#845F1E]">
            <Network className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-[#202522]">Interactive Directed Graph</h3>
          <p className="text-xs text-[#718477] leading-relaxed">
            React Flow canvas visualizes downstream dependencies, highlight hops, test linkages,
            and detects circular import hazards.
          </p>
        </div>
      </section>
    </div>
  );
};
