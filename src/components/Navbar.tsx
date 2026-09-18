import React from "react";
import {
  GitPullRequest,
  Layers,
  Network,
  CheckCircle2,
  FileText,
  Upload,
  PlayCircle,
  Activity,
} from "lucide-react";

export type NavTab =
  | "landing"
  | "upload"
  | "dashboard"
  | "change"
  | "impact"
  | "graph"
  | "evidence"
  | "release"
  | "history";

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasProject: boolean;
  hasAnalysis: boolean;
  onOpenDemoModal?: () => void;
  onRunTests?: () => void;
  isRunningTests?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  hasProject,
  hasAnalysis,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#394A3F] border-b border-[#2C3A31] text-[#F7F5EF] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onSelectTab("landing")}
            id="brand-header-home"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFFFFF]/15 border border-[#C6A76B]/40 flex items-center justify-center text-[#C6A76B] group-hover:bg-[#FFFFFF]/25 transition-all shadow-sm">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#FFFFFF] text-base tracking-tight">
                  Change Impact Analyzer
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C6A76B] text-[#202522]">
                  AST v1.0
                </span>
              </div>
              <p className="text-xs text-[#F7F5EF]/80 font-normal">
                Multi-Agent Code Blast Radius & Risk Assessment
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-[#FFFFFF]/15 text-xs font-medium scrollbar-none">
          <button
            id="tab-nav-overview"
            onClick={() => onSelectTab("landing")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentTab === "landing"
                ? "bg-[#FFFFFF] text-[#394A3F] font-bold shadow-sm"
                : "text-[#F7F5EF]/80 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            id="tab-nav-upload"
            onClick={() => onSelectTab("upload")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentTab === "upload"
                ? "bg-[#FFFFFF] text-[#394A3F] font-bold shadow-sm"
                : "text-[#F7F5EF]/80 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Project Files
          </button>

          <button
            id="tab-nav-dashboard"
            onClick={() => onSelectTab("dashboard")}
            disabled={!hasProject}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              currentTab === "dashboard"
                ? "bg-[#FFFFFF] text-[#394A3F] font-bold shadow-sm"
                : "text-[#F7F5EF]/80 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            AST Analysis
          </button>

          <button
            id="tab-nav-change"
            onClick={() => onSelectTab("change")}
            disabled={!hasProject}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              currentTab === "change"
                ? "bg-[#FFFFFF] text-[#394A3F] font-bold shadow-sm"
                : "text-[#F7F5EF]/80 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            Change Scenarios
          </button>

          <button
            id="tab-nav-impact"
            onClick={() => onSelectTab("impact")}
            disabled={!hasAnalysis}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              currentTab === "impact"
                ? "bg-[#FFFFFF] text-[#394A3F] font-bold shadow-sm"
                : "text-[#F7F5EF]/80 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#C6A76B]" />
            Impact Dashboard
          </button>

          <button
            id="tab-nav-graph"
            onClick={() => onSelectTab("graph")}
            disabled={!hasProject}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              currentTab === "graph"
                ? "bg-[#FFFFFF] text-[#394A3F] font-bold shadow-sm"
                : "text-[#F7F5EF]/80 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Dependency Graph
          </button>

          <button
            id="tab-nav-release"
            onClick={() => onSelectTab("release")}
            disabled={!hasAnalysis}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              currentTab === "release"
                ? "bg-[#FFFFFF] text-[#394A3F] font-bold shadow-sm"
                : "text-[#F7F5EF]/80 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Release Plan
          </button>

          <button
            id="tab-nav-history"
            onClick={() => onSelectTab("history")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              currentTab === "history"
                ? "bg-[#FFFFFF] text-[#394A3F] font-bold shadow-sm"
                : "text-[#F7F5EF]/80 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Reports & History
          </button>
        </nav>
      </div>
    </header>
  );
};
