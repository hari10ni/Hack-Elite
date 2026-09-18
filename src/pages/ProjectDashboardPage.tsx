import React, { useState, useMemo } from "react";
import { ScannedFile, GraphData } from "../types";
import { MetricCard } from "../components/MetricCard";
import {
  FileCode,
  Layers,
  Code2,
  Boxes,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowRight,
  RefreshCw,
  GitPullRequest,
} from "lucide-react";

interface ProjectDashboardPageProps {
  projectName: string;
  files: ScannedFile[];
  graphData: GraphData;
  onSelectFileForChange: (filePath: string) => void;
  onNavigateToGraph: () => void;
  onReAnalyze: () => void;
}

export const ProjectDashboardPage: React.FC<ProjectDashboardPageProps> = ({
  projectName,
  files,
  graphData,
  onSelectFileForChange,
  onNavigateToGraph,
  onReAnalyze,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "SOURCE" | "TESTS">("ALL");

  const totalLoc = useMemo(() => files.reduce((acc, f) => acc + f.loc, 0), [files]);
  const totalFunctions = useMemo(
    () => files.reduce((acc, f) => acc + f.functions.length, 0),
    [files]
  );
  const totalClasses = useMemo(() => files.reduce((acc, f) => acc + f.classes.length, 0), [files]);
  const testFilesCount = useMemo(() => files.filter((f) => f.isTestFile).length, [files]);
  const circularDeps = graphData.summary.circularDependencies || [];

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        f.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.moduleName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === "ALL" ||
        (filterType === "TESTS" ? f.isTestFile : !f.isTestFile);
      return matchesSearch && matchesType;
    });
  }, [files, searchTerm, filterType]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#718477]/25">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#202522]">{projectName}</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#394A3F]/10 text-[#394A3F] border border-[#394A3F]/25 font-mono font-semibold">
              AST Verified
            </span>
          </div>
          <p className="text-xs text-[#718477] mt-1">
            Static AST structure, dependency mapping, and module relationships
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReAnalyze}
            className="px-3 py-1.5 rounded-lg bg-[#F7F5EF] hover:bg-[#EAE6DA] text-[#202522] text-xs font-medium border border-[#718477]/30 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#718477]" />
            Re-scan AST
          </button>
          <button
            onClick={onNavigateToGraph}
            className="px-3.5 py-1.5 rounded-lg bg-[#394A3F] hover:bg-[#2D3A2A] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-[#C6A76B]" />
            Explore Dependency Graph
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          id="metric-files-scanned"
          label="Files Scanned"
          value={files.length}
          subtext={`${totalLoc} Total LOC`}
          icon={FileCode}
          variant="olive"
        />
        <MetricCard
          id="metric-modules"
          label="Modules"
          value={files.length}
          subtext="Directly Parsed"
          icon={Boxes}
          variant="default"
        />
        <MetricCard
          id="metric-functions"
          label="Functions"
          value={totalFunctions}
          subtext="Call Targets"
          icon={Code2}
          variant="default"
        />
        <MetricCard
          id="metric-classes"
          label="Classes"
          value={totalClasses}
          subtext="OOP Repositories"
          icon={Layers}
          variant="default"
        />
        <MetricCard
          id="metric-dependencies"
          label="Graph Edges"
          value={graphData.edges.length}
          subtext="Import Links"
          icon={Activity}
          variant="default"
        />
        <MetricCard
          id="metric-test-suites"
          label="Test Suites"
          value={testFilesCount}
          subtext="Unit & Integration"
          icon={CheckCircle2}
          variant="olive"
        />
      </div>

      {/* Circular Dependencies Alert */}
      {circularDeps.length > 0 ? (
        <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#A63A3A]/40 text-[#A63A3A] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#A63A3A] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-xs text-[#A63A3A]">Circular Dependencies Detected!</h4>
            <p className="text-xs text-[#A63A3A]/80 mt-0.5">
              Cycles in module imports can cause runtime <code>ImportError</code> exceptions.
            </p>
            <div className="mt-2 space-y-1 font-mono text-[11px]">
              {circularDeps.map((cycle, i) => (
                <div key={i} className="bg-[#FFFFFF] p-1.5 rounded border border-[#A63A3A]/30 text-[#A63A3A]">
                  {cycle.join(" → ")}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#718477]/25 text-xs text-[#202522] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#394A3F]" />
            <span>Circular Dependency Audit: <strong>Zero Cycles Detected</strong> (Acyclic Directed Structure)</span>
          </div>
          <span className="text-[10px] font-mono text-[#718477]">Tarjan Cycle Check</span>
        </div>
      )}

      {/* Files Table Section */}
      <div className="space-y-4">
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFFFF] p-3 rounded-xl border border-[#718477]/25 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#718477] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search file path or module name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F7F5EF] border border-[#718477]/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#202522] placeholder-[#718477] focus:outline-none focus:border-[#394A3F]"
            />
          </div>

          <div className="flex items-center gap-2">
            {(["ALL", "SOURCE", "TESTS"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterType === t
                    ? "bg-[#394A3F] text-[#FFFFFF]"
                    : "text-[#718477] hover:text-[#202522] hover:bg-[#F7F5EF]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Scanned Files Table */}
        <div className="rounded-xl border border-[#718477]/25 bg-[#FFFFFF] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5EF] text-[#718477] uppercase tracking-wider text-[10px] font-mono border-b border-[#718477]/25">
                <tr>
                  <th className="py-3 px-4">File Path</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">LOC</th>
                  <th className="py-3 px-4">AST Functions</th>
                  <th className="py-3 px-4">Imports</th>
                  <th className="py-3 px-4">Syntax Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#718477]/15">
                {filteredFiles.map((file, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F5EF]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#202522] whitespace-nowrap">
                      {file.filePath}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {file.isTestFile ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#394A3F]/10 text-[#394A3F] border border-[#394A3F]/25">
                          TEST SUITE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F5EF] text-[#718477] border border-[#718477]/30">
                          SOURCE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#202522]">{file.loc}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs font-mono text-[11px] text-[#202522]">
                        {file.functions.slice(0, 3).map((fn, fIdx) => (
                          <span
                            key={fIdx}
                            className="bg-[#F7F5EF] px-1.5 py-0.5 rounded border border-[#718477]/25 text-[#202522] truncate"
                            title={fn.name}
                          >
                            {fn.name}()
                          </span>
                        ))}
                        {file.functions.length > 3 && (
                          <span className="text-[#718477] text-[10px]">
                            +{file.functions.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#718477] max-w-xs truncate">
                      {Object.keys(file.fromImports).join(", ") || file.imports.join(", ") || "None"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {file.syntaxError ? (
                        <span className="inline-flex items-center gap-1 text-[#A63A3A] font-mono text-[11px] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Syntax Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#394A3F] font-mono text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          AST Clean
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectFileForChange(file.filePath)}
                        className="px-2.5 py-1 rounded bg-[#F7F5EF] hover:bg-[#394A3F] hover:text-[#FFFFFF] text-[#394A3F] border border-[#718477]/30 transition-colors font-semibold text-xs inline-flex items-center gap-1 shadow-2xs"
                      >
                        <GitPullRequest className="w-3 h-3" />
                        Simulate Change
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
