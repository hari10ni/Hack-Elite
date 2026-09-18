export interface FunctionSignature {
  name: string;
  args: string[];
  returns: string | null;
  doc: string | null;
}

export interface ClassInfo {
  name: string;
  bases: string[];
  methods: string[];
}

export interface ScannedFile {
  filePath: string;
  moduleName: string;
  loc: number;
  imports: string[];
  fromImports: Record<string, string[]>;
  functions: FunctionSignature[];
  classes: ClassInfo[];
  functionCalls: string[];
  syntaxError: string | null;
  isTestFile: boolean;
}

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  fullPath: string;
  moduleName: string;
  isChanged: boolean;
  isDirect: boolean;
  isIndirect: boolean;
  isTest: boolean;
  loc: number;
  functionsCount: number;
  classesCount: number;
  syntaxError: string | null;
  importedSymbols: string[];
}

export interface GraphData {
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: GraphNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    label?: string;
    data?: {
      symbols: string[];
      isActiveImpact: boolean;
    };
  }>;
  summary: {
    totalNodes: number;
    totalEdges: number;
    changedFile: string | null;
    directlyAffectedCount: number;
    indirectlyAffectedCount: number;
    circularDependencies: string[][];
  };
}

export interface RiskEvidenceItem {
  component: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  dependencyPath: string[];
  changedSymbols: string[];
  potentialConsequence: string;
  suggestedVerification: string;
  confidence: number;
  isConfirmed: boolean;
}

export interface TestRecommendation {
  testFile: string;
  targetComponent: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  relevanceReason: string;
  suggestedCommands: string[];
}

export interface ReleasePlan {
  filesToReview: Array<{
    file: string;
    role: string;
    action: string;
  }>;
  preReleaseTests: TestRecommendation[];
  integrationChecks: string[];
  backwardCompatibilityConcerns: string[];
  stagingDeploymentChecks: string[];
  rollbackPlan: string[];
  humanApprovalChecklist: Array<{
    item: string;
    checked: boolean;
  }>;
  assumptionsAndLimitations: string[];
}

export interface RAGChunk {
  chunkId: string;
  filePath: string;
  symbolName: string;
  chunkType: string;
  content: string;
  score: number;
  relevanceReason: string;
}

export interface ImpactAnalysisResult {
  analysisId: string;
  projectId: string;
  projectName: string;
  changedFile: string;
  changeDescription: string;
  filesScanned: number;
  modulesIdentified: number;
  directlyAffectedFiles: string[];
  indirectlyAffectedFiles: string[];
  potentiallyAffectedSymbols: string[];
  affectedModules: string[];
  relatedTests: string[];
  dependencyPaths: Record<string, string[][]>;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  riskScore: number;
  riskEvidence: RiskEvidenceItem[];
  testRecommendations: TestRecommendation[];
  releasePlan: ReleasePlan;
  aiExplanation: string;
  ragContext?: RAGChunk[];
  graph: GraphData;
  createdAt: string;
}

export interface AnalysisHistorySummary {
  id: string;
  project_id: string;
  project_name: string;
  changed_file: string;
  change_description: string;
  risk_level: string;
  risk_score: number;
  created_at: string;
}
