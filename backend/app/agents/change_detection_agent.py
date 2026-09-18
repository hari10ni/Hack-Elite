"""
Agent 1: Change Detection Agent.
Inspects changed files or Git diffs, detects modified functions and classes, and provides structured summary.
"""
from typing import Dict, Any, Optional
from ..analyzer.diff_analyzer import DiffAnalyzer
from ..schemas.models import CodeDiffChange

class ChangeDetectionAgent:
    """Specialized agent responsible for inspecting and characterizing code changes."""

    def __init__(self, name: str = "Change Detection Agent"):
        self.name = name

    def inspect_change(
        self,
        file_path: str,
        old_code: str,
        new_code: str,
        change_description: str = ""
    ) -> CodeDiffChange:
        """Analyzes delta between code versions and extracts changed AST symbols."""
        diff_result = DiffAnalyzer.analyze_code_difference(
            file_path=file_path,
            old_code=old_code,
            new_code=new_code,
            change_description=change_description
        )
        return diff_result
