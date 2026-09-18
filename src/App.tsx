import React, { useState, useEffect } from "react";
import { Navbar, NavTab } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { UploadPage } from "./pages/UploadPage";
import { ProjectDashboardPage } from "./pages/ProjectDashboardPage";
import { ChangeAnalysisPage } from "./pages/ChangeAnalysisPage";
import { ImpactDashboardPage } from "./pages/ImpactDashboardPage";
import { DependencyGraphPage } from "./pages/DependencyGraphPage";
import { RiskEvidencePage } from "./pages/RiskEvidencePage";
import { ReleasePlanPage } from "./pages/ReleasePlanPage";
import { ReportHistoryPage } from "./pages/ReportHistoryPage";
import { api } from "./services/api";
import { SAMPLE_SCENARIOS } from "./services/sampleData";
import {
  ScannedFile,
  GraphData,
  ImpactAnalysisResult,
  AnalysisHistorySummary,
} from "./types";
import { AlertCircle, Loader2 } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("landing");
  const [projectId, setProjectId] = useState<string>("sample-sis-project");
  const [projectName, setProjectName] = useState<string>(
    "Student Information System (Sample)"
  );
  const [files, setFiles] = useState<Record<string, string>>({});
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
    summary: {
      totalNodes: 0,
      totalEdges: 0,
      changedFile: null,
      directlyAffectedCount: 0,
      indirectlyAffectedCount: 0,
      circularDependencies: [],
    },
  });
  const [selectedFile, setSelectedFile] = useState<string>("database.py");
  const [currentAnalysis, setCurrentAnalysis] =
    useState<ImpactAnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisHistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-load sample project on start for instant interactivity
  useEffect(() => {
    loadSampleProjectInitial();
    fetchHistory();
  }, []);

  // Refresh history whenever navigating to the Reports & History tab
  useEffect(() => {
    if (currentTab === "history") {
      fetchHistory();
    }
  }, [currentTab]);

  const fetchHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch {
      // benign on cold start
    }
  };

  const loadSampleProjectInitial = async () => {
    try {
      const sample = await api.loadSampleProject();
      setProjectId(sample.projectId);
      setProjectName(sample.projectName);
      setFiles(sample.files);
      setScannedFiles(sample.scan.files);
      setGraphData(sample.scan.graph);

      // Auto-load primary scenario real analysis so Impact Dashboard is never empty
      const scenario = SAMPLE_SCENARIOS[0];
      try {
        const analysisResult = await api.analyzeChange({
          projectId: sample.projectId,
          projectName: sample.projectName,
          changedFile: scenario.targetFile,
          files: sample.files,
          oldCode: sample.files[scenario.targetFile],
          newCode: scenario.newCodeDelta,
          changeDescription: scenario.description,
          useAi: true,
        });
        setCurrentAnalysis(analysisResult);
        setGraphData(analysisResult.graph);
      } catch (innerErr) {
        console.warn("Initial analysis auto-run skipped:", innerErr);
      }
    } catch (e: any) {
      console.warn("Initial sample load skipped:", e.message);
    }
  };

  // User clicked "Load Sample Project"
  const handleLoadSample = async (scenarioId?: string) => {
    setIsLoading(true);
    setLoadingMessage("Scanning Python AST and constructing dependency graph...");
    setErrorMessage(null);
    try {
      const sample = await api.loadSampleProject();
      setProjectId(sample.projectId);
      setProjectName(sample.projectName);
      setFiles(sample.files);
      setScannedFiles(sample.scan.files);
      setGraphData(sample.scan.graph);

      // If a scenario was chosen (e.g. database.py signature alteration), automatically trigger analysis!
      const scenario =
        SAMPLE_SCENARIOS.find((s) => s.id === scenarioId) ||
        SAMPLE_SCENARIOS[0];

      setSelectedFile(scenario.targetFile);

      setLoadingMessage("Executing 5 AI Agents (Change, Dependency, Impact, Tests, Release)...");
      const analysisResult = await api.analyzeChange({
        projectId: sample.projectId,
        projectName: sample.projectName,
        changedFile: scenario.targetFile,
        files: sample.files,
        oldCode: sample.files[scenario.targetFile],
        newCode: scenario.newCodeDelta,
        changeDescription: scenario.description,
        useAi: true,
      });

      setCurrentAnalysis(analysisResult);
      setGraphData(analysisResult.graph);
      await fetchHistory();
      setCurrentTab("impact");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load sample project");
    } finally {
      setIsLoading(false);
    }
  };

  // User uploaded custom project files
  const handleFilesReady = async (name: string, uploadedFiles: Record<string, string>) => {
    setIsLoading(true);
    setLoadingMessage("Parsing AST tokens and analyzing imports...");
    setErrorMessage(null);
    try {
      const scanResult = await api.analyzeProject(uploadedFiles);
      const newProjId = `proj-${Date.now()}`;
      setProjectId(newProjId);
      setProjectName(name);
      setFiles(uploadedFiles);
      setScannedFiles(scanResult.files);
      setGraphData(scanResult.graph);
      setSelectedFile(Object.keys(uploadedFiles)[0] || "");
      setCurrentTab("dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to scan uploaded project");
    } finally {
      setIsLoading(false);
    }
  };

  // User triggered "Run Impact Analysis"
  const handleRunAnalysis = async (params: {
    changedFile: string;
    oldCode: string;
    newCode: string;
    changeDescription: string;
    useAi: boolean;
  }) => {
    setIsLoading(true);
    setLoadingMessage(
      "5 Agents executing: Detecting changes → Tracing blast radius → Assessing severity..."
    );
    setErrorMessage(null);
    try {
      const result = await api.analyzeChange({
        projectId,
        projectName,
        changedFile: params.changedFile,
        files,
        oldCode: params.oldCode,
        newCode: params.newCode,
        changeDescription: params.changeDescription,
        useAi: params.useAi,
      });

      setCurrentAnalysis(result);
      setGraphData(result.graph);
      setSelectedFile(params.changedFile);
      await fetchHistory();
      setCurrentTab("impact");
    } catch (err: any) {
      setErrorMessage(err.message || "Impact analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-scan AST
  const handleReAnalyze = async () => {
    setIsLoading(true);
    setLoadingMessage("Re-evaluating AST tokens...");
    try {
      const scan = await api.analyzeProject(files, selectedFile);
      setScannedFiles(scan.files);
      setGraphData(scan.graph);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Select and preview report within History page without kicking out of tab
  const handleSelectHistoryReport = async (analysisId: string) => {
    setIsLoading(true);
    setLoadingMessage("Loading analysis report from SQLite...");
    try {
      const report = await api.getReport(analysisId);
      setCurrentAnalysis(report);
      if (report.graph) {
        setGraphData(report.graph);
      }
      setSelectedFile(report.changedFile);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an analysis record from SQLite
  const handleDeleteHistoryReport = async (analysisId: string) => {
    try {
      await api.deleteReport(analysisId);
      setHistory((prev) => prev.filter((item) => item.id !== analysisId));
      if (currentAnalysis?.analysisId === analysisId) {
        const remaining = history.filter((item) => item.id !== analysisId);
        if (remaining.length > 0) {
          await handleSelectHistoryReport(remaining[0].id);
        } else {
          setCurrentAnalysis(null);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete report from history");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202522] flex flex-col font-sans selection:bg-[#394A3F] selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasProject={scannedFiles.length > 0}
        hasAnalysis={Boolean(currentAnalysis)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-[#202522]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#718477]/25 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl space-y-3">
            <Loader2 className="w-8 h-8 text-[#394A3F] animate-spin mx-auto" />
            <h3 className="font-bold text-sm text-[#202522]">Analyzing Software Delta</h3>
            <p className="text-xs text-[#718477] leading-relaxed font-mono">
              {loadingMessage || "Please wait..."}
            </p>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="p-3.5 rounded-xl bg-[#A63A3A]/10 border border-[#A63A3A]/30 text-[#A63A3A] text-xs flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-[#A63A3A] shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-2 py-0.5 rounded text-[11px] bg-[#A63A3A]/20 hover:bg-[#A63A3A]/30 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {currentTab === "landing" && (
          <LandingPage
            onLoadSample={handleLoadSample}
            onNavigateUpload={() => setCurrentTab("upload")}
            isLoading={isLoading}
          />
        )}

        {currentTab === "upload" && (
          <UploadPage
            onFilesReady={handleFilesReady}
            onLoadSample={() => handleLoadSample()}
            isLoading={isLoading}
            currentFilesCount={Object.keys(files).length}
          />
        )}

        {currentTab === "dashboard" && (
          <ProjectDashboardPage
            projectName={projectName}
            files={scannedFiles}
            graphData={graphData}
            onSelectFileForChange={(filePath) => {
              setSelectedFile(filePath);
              setCurrentTab("change");
            }}
            onNavigateToGraph={() => setCurrentTab("graph")}
            onReAnalyze={handleReAnalyze}
          />
        )}

        {currentTab === "change" && (
          <ChangeAnalysisPage
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {currentTab === "impact" && currentAnalysis && (
          <ImpactDashboardPage
            analysis={currentAnalysis}
            onNavigateToGraph={() => setCurrentTab("graph")}
            onNavigateToEvidence={() => setCurrentTab("evidence")}
            onNavigateToRelease={() => setCurrentTab("release")}
            onNavigateToHistory={() => setCurrentTab("history")}
          />
        )}

        {currentTab === "graph" && (
          <DependencyGraphPage
            graphData={graphData}
            changedFile={currentAnalysis?.changedFile || null}
            onNavigateToEvidence={() => setCurrentTab("evidence")}
          />
        )}

        {currentTab === "evidence" && currentAnalysis && (
          <RiskEvidencePage
            evidence={currentAnalysis.riskEvidence}
            changedFile={currentAnalysis.changedFile}
            onNavigateToRelease={() => setCurrentTab("release")}
          />
        )}

        {currentTab === "release" && currentAnalysis && (
          <ReleasePlanPage
            plan={currentAnalysis.releasePlan}
            changedFile={currentAnalysis.changedFile}
            onNavigateToHistory={() => setCurrentTab("history")}
          />
        )}

        {currentTab === "history" && (
          <ReportHistoryPage
            history={history}
            currentAnalysis={currentAnalysis}
            onSelectReport={handleSelectHistoryReport}
            onOpenDashboard={() => setCurrentTab("impact")}
            onOpenGraph={() => setCurrentTab("graph")}
            onDeleteReport={handleDeleteHistoryReport}
            onRefreshHistory={fetchHistory}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-400">
              AI Engineering Change Impact Analyzer
            </span>{" "}
            • College Capstone Mini-Project
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Python 3.10 AST</span>
            <span>•</span>
            <span>React Flow</span>
            <span>•</span>
            <span>Gemini 3.8 Flash</span>
            <span>•</span>
            <span>SQLite Database</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
