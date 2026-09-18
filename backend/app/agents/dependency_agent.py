"""
Agent 2: Code Dependency Agent.
Analyzes imports and code relationships, constructs directed dependency graph,
and identifies direct and indirect downstream affected components.
"""
from typing import Dict, List, Tuple
from ..analyzer.graph_engine import DependencyGraphEngine
from ..schemas.models import FileScanResult

class CodeDependencyAgent:
    """Specialized agent responsible for module relationships and downstream path tracing."""

    def __init__(self, name: str = "Code Dependency Agent"):
        self.name = name

    def build_and_trace(
        self,
        scan_results: Dict[str, FileScanResult],
        changed_file: str
    ) -> Tuple[DependencyGraphEngine, List[str], List[str], Dict[str, List[List[str]]]]:
        graph_engine = DependencyGraphEngine(scan_results)
        direct, indirect, paths = graph_engine.get_downstream_impact(changed_file)
        return graph_engine, direct, indirect, paths
