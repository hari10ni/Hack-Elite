"""
FastAPI Standalone Backend for AI Engineering Change Impact Analyzer.
Provides RESTful API endpoints for project upload, AST scanning,
change impact analysis, dependency graphs, AI explanations, and report export.
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import os
import sys

# Add app directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.analyzer.ast_scanner import ASTScanner
from app.analyzer.graph_engine import DependencyGraphEngine
from app.analyzer.diff_analyzer import DiffAnalyzer
from app.agents.orchestrator import AnalysisOrchestrator
from app.rag.knowledge_retriever import ProjectKnowledgeRetriever
from app.database.sqlite_store import SQLiteStore
from app.utils.zip_handler import SafeZipHandler

app = FastAPI(
    title="AI Engineering Change Impact Analyzer API",
    description="Backend service for Python AST static analysis, dependency graphs, and change risk assessment",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = SQLiteStore()
orchestrator = AnalysisOrchestrator()

# Schemas
class AnalyzeProjectRequest(BaseModel):
    project_id: str
    files: Dict[str, str]

class AnalyzeChangeRequest(BaseModel):
    project_id: str
    project_name: str
    changed_file: str
    files: Dict[str, str]
    old_code: Optional[str] = ""
    new_code: Optional[str] = ""
    change_description: Optional[str] = ""

class DiffAnalysisRequest(BaseModel):
    file_path: str
    diff_text: str

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Engineering Change Impact Analyzer",
        "version": "1.0.0"
    }

@app.post("/api/projects/upload")
async def upload_project(file: UploadFile = File(...), project_name: str = Form("Uploaded Project")):
    content = await file.read()
    try:
        files, warnings = SafeZipHandler.extract_zip_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    project_id = f"proj-{abs(hash(file.filename)) % 100000}"
    db.save_project(project_id, project_name, files)

    return {
        "projectId": project_id,
        "projectName": project_name,
        "filesCount": len(files),
        "files": list(files.keys()),
        "warnings": warnings
    }

@app.post("/api/projects/analyze")
def analyze_project(req: AnalyzeProjectRequest):
    scans = {p: ASTScanner.scan_code(p, c) for p, c in req.files.items()}
    graph_engine = DependencyGraphEngine(scans)
    rf_graph = graph_engine.to_react_flow_graph()

    return {
        "projectId": req.project_id,
        "totalFiles": len(req.files),
        "graph": rf_graph,
        "circularDependencies": graph_engine.detect_cycles()
    }

@app.get("/api/projects/{project_id}/files")
def get_project_files(project_id: str):
    files = db.get_project_files(project_id)
    if not files:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"projectId": project_id, "files": files}

@app.post("/api/changes/analyze")
def analyze_change(req: AnalyzeChangeRequest):
    scans = {}
    for path, code in req.files.items():
        code_to_use = req.new_code if (path == req.changed_file and req.new_code) else code
        scans[path] = ASTScanner.scan_code(path, code_to_use)

    result = orchestrator.run_pipeline(
        project_id=req.project_id,
        project_name=req.project_name,
        changed_file=req.changed_file,
        scan_results=scans,
        old_code=req.old_code or req.files.get(req.changed_file, ""),
        new_code=req.new_code or req.files.get(req.changed_file, ""),
        change_description=req.change_description
    )

    # RAG retrieval
    retriever = ProjectKnowledgeRetriever()
    retriever.index_project(req.files)
    retrieved = retriever.retrieve(f"{req.changed_file} {req.change_description}", top_k=4)

    graph_engine = DependencyGraphEngine(scans)
    rf_graph = graph_engine.to_react_flow_graph(req.changed_file)

    res_data = {
        "analysisId": result.analysis_id,
        "projectId": result.project_id,
        "projectName": result.project_name,
        "changedFile": result.changed_file,
        "changeDescription": result.change_description,
        "filesScanned": result.files_scanned,
        "modulesIdentified": result.modules_identified,
        "directlyAffectedFiles": result.directly_affected_files,
        "indirectlyAffectedFiles": result.indirectly_affected_files,
        "potentiallyAffectedSymbols": result.potentially_affected_symbols,
        "affectedModules": result.affected_modules,
        "relatedTests": result.related_tests,
        "dependencyPaths": result.dependency_paths,
        "riskLevel": result.risk_level,
        "riskScore": result.risk_score,
        "riskEvidence": [ev.__dict__ for ev in result.risk_evidence],
        "testRecommendations": [tr.__dict__ for tr in result.test_recommendations],
        "releasePlan": result.release_plan.__dict__ if result.release_plan else None,
        "aiExplanation": result.ai_explanation,
        "ragContext": [rc.__dict__ for rc in retrieved],
        "graph": rf_graph,
        "createdAt": result.created_at
    }

    db.save_analysis({
        "analysis_id": result.analysis_id,
        "project_id": result.project_id,
        "project_name": result.project_name,
        "changed_file": result.changed_file,
        "change_description": result.change_description,
        "risk_level": result.risk_level,
        "risk_score": result.risk_score,
        **res_data
    })

    return res_data

@app.post("/api/changes/diff")
def analyze_diff(req: DiffAnalysisRequest):
    diff_results = DiffAnalyzer.parse_git_diff(req.diff_text)
    return {"diffs": [d.__dict__ for d in diff_results]}

@app.get("/api/changes/{analysis_id}/impact")
def get_impact(analysis_id: str):
    data = db.get_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis ID not found")
    return data

@app.get("/api/reports/{analysis_id}")
def get_report(analysis_id: str):
    data = db.get_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Report not found")
    return data

@app.get("/api/history")
def get_history():
    return db.list_analyses()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
