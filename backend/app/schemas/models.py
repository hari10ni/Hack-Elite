"""
Pydantic and data schemas for AI Engineering Change Impact Analyzer
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
import json

@dataclass
class FunctionSignature:
    name: str
    args: List[str]
    returns: Optional[str] = None
    docstring: Optional[str] = None
    line_start: int = 0
    line_end: int = 0

@dataclass
class ClassInfo:
    name: str
    bases: List[str]
    methods: List[str]
    docstring: Optional[str] = None
    line_start: int = 0
    line_end: int = 0

@dataclass
class FileScanResult:
    file_path: str
    module_name: str
    imports: List[str] = field(default_factory=list) # e.g. ["database", "os", "math"]
    from_imports: Dict[str, List[str]] = field(default_factory=dict) # e.g. {"database": ["execute_query"]}
    functions: List[FunctionSignature] = field(default_factory=list)
    classes: List[ClassInfo] = field(default_factory=list)
    function_calls: List[str] = field(default_factory=list) # detected called function names
    loc: int = 0
    syntax_error: Optional[str] = None
    is_test_file: bool = False

@dataclass
class DependencyEdge:
    source: str # dependency module (e.g. database.py)
    target: str # dependent module (e.g. student.py)
    symbols_imported: List[str] = field(default_factory=list)
    is_circular: bool = False

@dataclass
class CodeDiffChange:
    file_path: str
    change_type: str # "modified", "added", "deleted"
    changed_functions: List[str] = field(default_factory=list)
    changed_classes: List[str] = field(default_factory=list)
    signature_changes: List[Dict[str, Any]] = field(default_factory=list)
    added_lines: int = 0
    removed_lines: int = 0
    diff_text: str = ""

@dataclass
class RiskEvidenceItem:
    component: str # e.g. student.py
    priority: str # "HIGH", "MEDIUM", "LOW"
    reason: str
    dependency_path: List[str] # ["database.py", "student.py"]
    changed_symbols: List[str]
    potential_consequence: str
    suggested_verification: str
    confidence: float # 0.0 - 1.0
    is_confirmed: bool # True for static AST link, False for dynamic runtime hypothesis

@dataclass
class TestRecommendation:
    test_file: str
    target_component: str
    relevance_reason: str
    priority: str # "CRITICAL", "HIGH", "MEDIUM"
    suggested_commands: List[str] = field(default_factory=list)

@dataclass
class ReleasePlan:
    files_to_review: List[Dict[str, Any]] = field(default_factory=list)
    pre_release_tests: List[TestRecommendation] = field(default_factory=list)
    integration_checks: List[str] = field(default_factory=list)
    backward_compatibility_concerns: List[str] = field(default_factory=list)
    staging_deployment_checks: List[str] = field(default_factory=list)
    rollback_plan: List[str] = field(default_factory=list)
    human_approval_checklist: List[Dict[str, Any]] = field(default_factory=list)
    assumptions_and_limitations: List[str] = field(default_factory=list)

@dataclass
class ImpactAnalysisResult:
    analysis_id: str
    project_id: str
    project_name: str
    changed_file: str
    change_description: str
    files_scanned: int
    modules_identified: int
    directly_affected_files: List[str]
    indirectly_affected_files: List[str]
    potentially_affected_symbols: List[str]
    affected_modules: List[str]
    related_tests: List[str]
    dependency_paths: Dict[str, List[List[str]]] # target_file -> list of paths
    risk_level: str # "HIGH", "MEDIUM", "LOW"
    risk_score: float # 0-100
    risk_evidence: List[RiskEvidenceItem] = field(default_factory=list)
    test_recommendations: List[TestRecommendation] = field(default_factory=list)
    ai_explanation: str = ""
    release_plan: Optional[ReleasePlan] = None
    created_at: str = ""
