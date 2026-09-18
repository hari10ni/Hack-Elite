"""
CLI Bridge for Python Code Analysis Engine.
Called by server or standalone terminal to perform AST analysis,
graph traversal, agent orchestration, and SQLite queries.
Outputs JSON to stdout.
"""
import sys
import os
import json
from typing import Dict, Any

# Ensure backend root is on sys.path
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

def load_sample_project() -> Dict[str, str]:
    sample_dir = os.path.join(os.path.dirname(BASE_DIR), "sample-project")
    files: Dict[str, str] = {}
    for root, _, filenames in os.walk(sample_dir):
        for fn in filenames:
            if fn.endswith(".py") or fn.endswith(".md"):
                full_p = os.path.join(root, fn)
                rel_p = os.path.relpath(full_p, sample_dir).replace("\\", "/")
                with open(full_p, "r", encoding="utf-8") as f:
                    files[rel_p] = f.read()
    return files

def cmd_scan(files: Dict[str, str], changed_file: str = None) -> Dict[str, Any]:
    scans = {}
    for path, code in files.items():
        scans[path] = ASTScanner.scan_code(path, code)

    graph_engine = DependencyGraphEngine(scans)
    rf_graph = graph_engine.to_react_flow_graph(changed_file)

    files_info = []
    for path, scan in scans.items():
        files_info.append({
            "filePath": path,
            "moduleName": scan.module_name,
            "loc": scan.loc,
            "imports": scan.imports,
            "fromImports": scan.from_imports,
            "functions": [{"name": fn.name, "args": fn.args, "returns": fn.returns, "doc": fn.docstring} for fn in scan.functions],
            "classes": [{"name": c.name, "bases": c.bases, "methods": c.methods} for c in scan.classes],
            "functionCalls": scan.function_calls,
            "syntaxError": scan.syntax_error,
            "isTestFile": scan.is_test_file
        })

    return {
        "status": "success",
        "totalFiles": len(files),
        "files": files_info,
        "graph": rf_graph,
        "circularDependencies": graph_engine.detect_cycles()
    }

def cmd_analyze_change(
    project_id: str,
    project_name: str,
    changed_file: str,
    files: Dict[str, str],
    old_code: str = "",
    new_code: str = "",
    change_description: str = "",
    ai_insights: str = None
) -> Dict[str, Any]:
    scans = {}
    for path, code in files.items():
        # If new_code provided for changed_file, use it
        code_to_use = new_code if path == changed_file and new_code else code
        scans[path] = ASTScanner.scan_code(path, code_to_use)

    orchestrator = AnalysisOrchestrator()
    result = orchestrator.run_pipeline(
        project_id=project_id,
        project_name=project_name,
        changed_file=changed_file,
        scan_results=scans,
        old_code=old_code or files.get(changed_file, ""),
        new_code=new_code or files.get(changed_file, ""),
        change_description=change_description,
        ai_insights=ai_insights
    )

    # RAG retrieval on changed symbol and description
    retriever = ProjectKnowledgeRetriever()
    retriever.index_project(files)
    query = f"{changed_file} {' '.join(result.potentially_affected_symbols)} {change_description}"
    retrieved_chunks = retriever.retrieve(query, top_k=4)

    # Graph with changed highlighting
    graph_engine = DependencyGraphEngine(scans)
    rf_graph = graph_engine.to_react_flow_graph(changed_file)

    res_dict = {
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
        "riskEvidence": [
            {
                "component": ev.component,
                "priority": ev.priority,
                "reason": ev.reason,
                "dependencyPath": ev.dependency_path,
                "changedSymbols": ev.changed_symbols,
                "potentialConsequence": ev.potential_consequence,
                "suggestedVerification": ev.suggested_verification,
                "confidence": ev.confidence,
                "isConfirmed": ev.is_confirmed
            } for ev in result.risk_evidence
        ],
        "testRecommendations": [
            {
                "testFile": tr.test_file,
                "targetComponent": tr.target_component,
                "priority": tr.priority,
                "relevanceReason": tr.relevance_reason,
                "suggestedCommands": tr.suggested_commands
            } for tr in result.test_recommendations
        ],
        "releasePlan": {
            "filesToReview": result.release_plan.files_to_review,
            "preReleaseTests": [
                {
                    "testFile": tr.test_file,
                    "targetComponent": tr.target_component,
                    "priority": tr.priority,
                    "relevanceReason": tr.relevance_reason,
                    "suggestedCommands": tr.suggested_commands
                } for tr in result.release_plan.pre_release_tests
            ],
            "integrationChecks": result.release_plan.integration_checks,
            "backwardCompatibilityConcerns": result.release_plan.backward_compatibility_concerns,
            "stagingDeploymentChecks": result.release_plan.staging_deployment_checks,
            "rollbackPlan": result.release_plan.rollback_plan,
            "humanApprovalChecklist": result.release_plan.human_approval_checklist,
            "assumptionsAndLimitations": result.release_plan.assumptions_and_limitations
        },
        "aiExplanation": result.ai_explanation,
        "ragContext": [
            {
                "chunkId": rc.chunk_id,
                "filePath": rc.file_path,
                "symbolName": rc.symbol_name,
                "chunkType": rc.chunk_type,
                "content": rc.content,
                "score": rc.score,
                "relevanceReason": rc.relevance_reason
            } for rc in retrieved_chunks
        ],
        "graph": rf_graph,
        "createdAt": result.created_at
    }

    # Save to SQLite database
    db = SQLiteStore()
    db.save_analysis({
        "analysis_id": result.analysis_id,
        "project_id": result.project_id,
        "project_name": result.project_name,
        "changed_file": result.changed_file,
        "change_description": result.change_description,
        "risk_level": result.risk_level,
        "risk_score": result.risk_score,
        **res_dict
    })

    return res_dict

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1]

    try:
        if cmd == "load-sample":
            files = load_sample_project()
            db = SQLiteStore()
            project_id = "sample-sis-project"
            project_name = "Student Information System (Sample)"
            db.save_project(project_id, project_name, files)
            scan_res = cmd_scan(files)
            print(json.dumps({
                "projectId": project_id,
                "projectName": project_name,
                "files": files,
                "scan": scan_res
            }))

        elif cmd == "scan-input":
            # Reads JSON payload from stdin
            payload = json.loads(sys.stdin.read())
            files = payload.get("files", {})
            changed_file = payload.get("changed_file")
            res = cmd_scan(files, changed_file)
            print(json.dumps(res))

        elif cmd == "analyze-change":
            # Reads JSON payload from stdin
            payload = json.loads(sys.stdin.read())
            project_id = payload.get("project_id", "default-proj")
            project_name = payload.get("project_name", "Python Project")
            changed_file = payload.get("changed_file", "")
            files = payload.get("files", {})
            old_code = payload.get("old_code", "")
            new_code = payload.get("new_code", "")
            desc = payload.get("change_description", "")
            ai_insights = payload.get("ai_insights")

            res = cmd_analyze_change(
                project_id=project_id,
                project_name=project_name,
                changed_file=changed_file,
                files=files,
                old_code=old_code,
                new_code=new_code,
                change_description=desc,
                ai_insights=ai_insights
            )
            print(json.dumps(res))

        elif cmd == "list-analyses":
            db = SQLiteStore()
            analyses = db.list_analyses()
            print(json.dumps(analyses))

        elif cmd == "get-analysis":
            analysis_id = sys.argv[2]
            db = SQLiteStore()
            data = db.get_analysis(analysis_id)
            print(json.dumps(data or {"error": "Analysis not found"}))

        elif cmd == "delete-analysis":
            analysis_id = sys.argv[2]
            db = SQLiteStore()
            deleted = db.delete_analysis(analysis_id)
            print(json.dumps({"success": deleted, "analysisId": analysis_id}))

        else:
            print(json.dumps({"error": f"Unknown command: {cmd}"}))
            sys.exit(1)

    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    main()
