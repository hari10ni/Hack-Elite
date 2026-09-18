import { ImpactAnalysisResult, AnalysisHistorySummary, GraphData, ScannedFile } from "../types";

export interface SampleProjectResponse {
  projectId: string;
  projectName: string;
  files: Record<string, string>;
  scan: {
    totalFiles: number;
    files: ScannedFile[];
    graph: GraphData;
    circularDependencies: string[][];
  };
}

export const api = {
  async checkHealth() {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error("Backend unavailable");
    return res.json();
  },

  async loadSampleProject(): Promise<SampleProjectResponse> {
    const res = await fetch("/api/sample-project");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to load sample project");
    }
    return res.json();
  },

  async analyzeProject(files: Record<string, string>, changedFile?: string): Promise<{
    totalFiles: number;
    files: ScannedFile[];
    graph: GraphData;
    circularDependencies: string[][];
  }> {
    const res = await fetch("/api/projects/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, changed_file: changedFile }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Project analysis failed");
    }
    return res.json();
  },

  async analyzeChange(params: {
    projectId: string;
    projectName: string;
    changedFile: string;
    files: Record<string, string>;
    oldCode?: string;
    newCode?: string;
    changeDescription?: string;
    useAi?: boolean;
  }): Promise<ImpactAnalysisResult> {
    const res = await fetch("/api/changes/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: params.projectId,
        project_name: params.projectName,
        changed_file: params.changedFile,
        files: params.files,
        old_code: params.oldCode,
        new_code: params.newCode,
        change_description: params.changeDescription,
        use_ai: params.useAi !== false,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Change impact analysis failed");
    }
    return res.json();
  },

  async getHistory(): Promise<AnalysisHistorySummary[]> {
    const res = await fetch("/api/history");
    if (!res.ok) throw new Error("Failed to fetch analysis history");
    return res.json();
  },

  async proposeSolution(params: {
    fileName: string;
    baselineCode: string;
    changeGoal: string;
    preserveBackwardCompatibility?: boolean;
    downstreamContext?: string[];
  }): Promise<{
    status: string;
    detected_error?: {
      title: string;
      description: string;
      error_type: string;
      estimated_line: number;
      failing_callers: string[];
    };
    proposed_code: string;
    summary: string;
    is_correct_program?: boolean;
    is_backward_compatible: boolean;
    caller_safeguards: string[];
    release_plan_ideas?: string[];
  }> {
    const res = await fetch("/api/changes/propose-solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_name: params.fileName,
        baseline_code: params.baselineCode,
        change_goal: params.changeGoal,
        preserve_backward_compatibility: params.preserveBackwardCompatibility !== false,
        downstream_context: params.downstreamContext || [],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate proposed solution via Google API");
    }
    return res.json();
  },

  async generateReleasePlanIdeas(params: {
    changedFile: string;
    changeDescription: string;
    riskLevel: string;
    riskScore: number;
    directlyAffectedFiles?: string[];
    indirectlyAffectedFiles?: string[];
    potentiallyAffectedSymbols?: string[];
    relatedTests?: string[];
    proposedCode?: string;
  }): Promise<{
    status: string;
    release_strategy: string;
    strategic_recommendation: string;
    ai_innovative_ideas: Array<{ title: string; description: string; benefit: string }>;
    rollout_phases: Array<{
      phase: string;
      traffic_percent: number;
      duration: string;
      action: string;
      success_criteria: string;
    }>;
    targeted_test_commands: Array<{
      command: string;
      purpose: string;
      target_module: string;
    }>;
    circuit_breakers_and_safeguards: Array<{
      name: string;
      threshold: string;
      automated_action: string;
    }>;
    emergency_rollback_procedure: string[];
  }> {
    const res = await fetch("/api/release-plan/generate-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changed_file: params.changedFile,
        change_description: params.changeDescription,
        risk_level: params.riskLevel,
        risk_score: params.riskScore,
        directly_affected_files: params.directlyAffectedFiles || [],
        indirectly_affected_files: params.indirectlyAffectedFiles || [],
        potentially_affected_symbols: params.potentiallyAffectedSymbols || [],
        related_tests: params.relatedTests || [],
        proposed_code: params.proposedCode || "",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate release plan ideas from Gemini");
    }
    return res.json();
  },

  async getReport(analysisId: string): Promise<ImpactAnalysisResult> {
    const res = await fetch(`/api/reports/${analysisId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Report not found");
    }
    return res.json();
  },

  async deleteReport(analysisId: string): Promise<{ success: boolean; analysisId: string }> {
    const res = await fetch(`/api/reports/${analysisId}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete report");
    }
    return res.json();
  },

  async runAutomatedTests(): Promise<{ success: boolean; exitCode: number; output: string }> {
    const res = await fetch("/api/run-tests", { method: "POST" });
    if (!res.ok) throw new Error("Failed to execute automated test runner");
    return res.json();
  }
};
