import React, { useState } from "react";
import {
  X,
  GraduationCap,
  Layers,
  Network,
  Cpu,
  ShieldCheck,
  Terminal,
  HelpCircle,
  FileText,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { api } from "../services/api";

interface CollegePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollegePresentationModal: React.FC<CollegePresentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "architecture" | "viva" | "tests">("overview");
  const [testResult, setTestResult] = useState<{ success: boolean; output: string } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  if (!isOpen) return null;

  const handleRunLiveTests = async () => {
    setIsRunningTests(true);
    setTestResult(null);
    try {
      const res = await api.runAutomatedTests();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, output: e.message });
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-[#718477]/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#718477]/25 bg-[#F7F5EF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#394A3F]/15 text-[#394A3F] border border-[#394A3F]/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#202522]">
                College Project Guide & Technical Architecture
              </h2>
              <p className="text-xs text-[#718477]">
                AI Engineering Change Impact Analyzer • Academic Viva & Demonstration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#718477] hover:text-[#202522] hover:bg-[#EAE6DA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2 bg-[#F7F5EF] border-b border-[#718477]/25 text-xs font-medium overflow-x-auto">
          {[
            { id: "overview", label: "Project Abstract", icon: FileText },
            { id: "agents", label: "5 Logical AI Agents", icon: Cpu },
            { id: "architecture", label: "Architecture & Dataflow", icon: Layers },
            { id: "viva", label: "Viva Examiner Q&A", icon: HelpCircle },
            { id: "tests", label: "Live Test Verification", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#394A3F] text-white font-semibold"
                    : "text-[#718477] hover:text-[#202522] hover:bg-[#EAE6DA]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-[#202522] text-xs leading-relaxed space-y-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#718477]/25">
                <h3 className="font-semibold text-sm text-[#202522] mb-2">Project Abstract</h3>
                <p className="text-[#202522] text-xs leading-relaxed">
                  In modern software engineering, modifying a single core module (e.g. <code>database.py</code>)
                  often causes catastrophic cascading failures across downstream services, modules, and API endpoints.
                  This project presents a functional, standalone <strong>AI Engineering Change Impact Analyzer</strong>.
                  By coupling deterministic Python <strong>Abstract Syntax Tree (AST)</strong> parsing and directed graph traversal
                  with an autonomous 5-Agent AI pipeline and optional Retrieval-Augmented Generation (RAG), the system delivers
                  zero-hallucination blast-radius identification, explainable risk evidence, targeted test recommendations,
                  and an audited safe release plan before code is merged.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#718477]/25">
                  <h4 className="font-semibold text-[#202522] mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#394A3F]" />
                    Problem Addressed
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-[#718477]">
                    <li>Hidden downstream dependencies in growing codebases</li>
                    <li>Uncaught function signature alterations and runtime TypeErrors</li>
                    <li>Excessive manual regression testing or skipped tests</li>
                    <li>AI code generation hallucinations when lacking static verification</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#718477]/25">
                  <h4 className="font-semibold text-[#202522] mb-1.5 flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-[#394A3F]" />
                    Key Innovation
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-[#718477]">
                    <li><strong>Ground Truth AST Verification:</strong> Static analysis guarantees zero invented links</li>
                    <li><strong>Multi-Agent Division of Labor:</strong> 5 specialized analytical roles</li>
                    <li><strong>Interactive React Flow Canvas:</strong> Visual node traversal and color-coded impact hops</li>
                    <li><strong>Explainable Risk Evidence:</strong> 100% auditable dependency paths</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "agents" && (
            <div className="space-y-3">
              {[
                {
                  number: "Agent 1",
                  title: "Change Detection Agent",
                  desc: "Inspects targeted files or Git diffs, parses abstract syntax trees, and extracts added/modified functions, classes, and parameter signature alterations.",
                  output: "CodeDiffChange object with exact signature delta",
                },
                {
                  number: "Agent 2",
                  title: "Code Dependency Agent",
                  desc: "Analyzes module imports, builds the directed acyclic graph (DAG), traces 1-hop direct dependents and multi-hop transitive paths, and flags circular references.",
                  output: "DependencyGraphEngine and downstream paths map",
                },
                {
                  number: "Agent 3",
                  title: "Impact Assessment Agent",
                  desc: "Evaluates the potential architectural consequences of the changes on each downstream caller. Categorizes risk severity into HIGH, MEDIUM, and LOW based on caller density and signature breaks.",
                  output: "List of explainable RiskEvidenceItem objects",
                },
                {
                  number: "Agent 4",
                  title: "Test Recommendation Agent",
                  desc: "Scans project test suites, matches modified modules and downstream dependents against test imports and test function naming conventions, and generates minimal regression test commands.",
                  output: "Prioritized TestRecommendation list with pytest commands",
                },
                {
                  number: "Agent 5",
                  title: "Release Planning Agent",
                  desc: "Synthesizes impact results into an actionable pre-release checklist: mandatory file reviewers, integration verifications, rollback contingency plan, and human release gate.",
                  output: "Complete structured ReleasePlan",
                },
              ].map((agent, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F7F5EF] border border-[#718477]/25">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#394A3F]/15 text-[#394A3F] font-semibold border border-[#394A3F]/30">
                        {agent.number}
                      </span>
                      <span className="font-semibold text-[#202522] text-xs">{agent.title}</span>
                    </div>
                    <span className="text-[10px] text-[#718477] font-mono">Specialized Role</span>
                  </div>
                  <p className="text-[#718477] text-xs mt-1">{agent.desc}</p>
                  <p className="text-[11px] text-[#394A3F] font-mono font-semibold mt-1.5">
                    → Artifact: {agent.output}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "architecture" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#718477]/25 font-mono text-[11px] text-[#202522] whitespace-pre leading-relaxed overflow-x-auto">
{`+-------------------------------------------------------------------------------+
|                       REACT 18 + VITE FRONTEND                                |
|  - React Flow Directed Graph Canvas    - Risk Evidence Explainability Table   |
|  - Unified & Side-by-Side Diff Viewer  - Interactive Human Release Gates      |
+---------------------------------------+---------------------------------------+
                                        | (HTTP / REST API)
+---------------------------------------v---------------------------------------+
|                    EXPRESS FULL-STACK SERVER (PORT 3000)                      |
|  - Node.js Service Layer               - Safe ZIP / File Extraction           |
|  - Gemini 3.8 Flash SDK Client         - Subprocess Python Bridge             |
+---------------------------------------+---------------------------------------+
                                        | (Subprocess CLI Stdin/Stdout)
+---------------------------------------v---------------------------------------+
|               PYTHON 3.10 STATIC CODE ANALYSIS & AGENTS                       |
|  [ast_scanner]    -> Extracts imports, functions, classes, and calls safely   |
|  [graph_engine]   -> Directed Graph construction & downstream path tracing    |
|  [diff_analyzer]  -> Parameter signature changes & AST symbol comparison      |
|  [5 AI Agents]    -> Detection, Dependency, Impact, Tests, and Release Plan   |
|  [RAG Retriever]  -> TF-IDF / BM25 semantic chunk retrieval                   |
|  [SQLite Store]   -> Projects metadata, scanned files, and analysis history   |
+-------------------------------------------------------------------------------+`}
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#718477]/25 text-xs">
                <h4 className="font-semibold text-[#202522] mb-2">Safety & Security Highlights:</h4>
                <ul className="list-disc list-inside space-y-1 text-[#718477]">
                  <li><strong>Non-Executing Analysis:</strong> Python <code>ast.parse</code> parses syntax trees without executing user code.</li>
                  <li><strong>Zip-Slip Protection:</strong> Archive paths are sanitized and checked against path traversal attacks.</li>
                  <li><strong>Zero Invented Links:</strong> Every dependency edge is grounded in concrete AST import tokens.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "viva" && (
            <div className="space-y-3">
              {[
                {
                  q: "Q1: Why use Abstract Syntax Tree (AST) instead of simply prompting an LLM with code?",
                  a: "LLMs frequently suffer from hallucinations, token window limits, and inability to track complex multi-hop imports across 20+ files. Python's built-in AST module provides mathematically deterministic ground truth on all imports and symbol definitions. The LLM is then used to synthesize architectural reasoning rather than guessing dependencies.",
                },
                {
                  q: "Q2: What is the computational complexity of the dependency graph traversal?",
                  a: "The directed dependency graph is constructed in O(V + E) time, where V is the number of files and E is the number of module import edges. Downstream blast radius computation uses Breadth-First Search (BFS), also executing in O(V + E) time with cycle detection.",
                },
                {
                  q: "Q3: How does the system detect breaking signature changes?",
                  a: "The DiffAnalyzer compiles the AST of both the original file and the proposed change. It extracts the parameter lists and keyword arguments of all functions. If positional parameters are added without default values or required arguments are rearranged, it flags a SIGNATURE_ALTERED risk event.",
                },
                {
                  q: "Q4: How does the system handle circular dependencies?",
                  a: "The graph engine runs Tarjan's or cycle-detection DFS algorithms. Any detected circular dependency is highlighted in the project dashboard, as circular imports cause subtle runtime ImportError issues in Python.",
                },
              ].map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#718477]/25">
                  <p className="font-semibold text-[#394A3F] mb-1">{item.q}</p>
                  <p className="text-[#202522] text-xs leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "tests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#202522]">Automated System Test Verification</h4>
                  <p className="text-[#718477] text-xs">
                    Executes unittest suite covering AST parsing, graph traversal, diff analysis, agent orchestration, and ZIP security.
                  </p>
                </div>
                <button
                  onClick={handleRunLiveTests}
                  disabled={isRunningTests}
                  className="px-3 py-1.5 rounded-lg bg-[#394A3F] hover:bg-[#2D3A2A] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#C6A76B]" />
                  {isRunningTests ? "Running Suite..." : "Execute Tests Now"}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border font-mono text-xs ${
                    testResult.success
                      ? "bg-[#F7F5EF] border-[#394A3F]/40 text-[#394A3F]"
                      : "bg-[#F7F5EF] border-[#A63A3A]/40 text-[#A63A3A]"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {testResult.success
                      ? "All Automated Tests PASSED (Exit Code 0)"
                      : "Test Suite Failed"}
                  </div>
                  <pre className="text-[11px] whitespace-pre-wrap bg-[#FFFFFF] p-2.5 rounded border border-[#718477]/25 text-[#202522]">
                    {testResult.output}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#718477]/25 bg-[#F7F5EF] flex items-center justify-between text-xs text-[#718477]">
          <span>AI Engineering Change Impact Analyzer • College Mini-Project</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#EAE6DA] text-[#202522] border border-[#718477]/30 font-medium transition-colors shadow-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
