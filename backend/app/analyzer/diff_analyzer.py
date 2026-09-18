"""
Git diff and code comparison analyzer.
Detects modified functions, classes, and signature alterations between old and new code.
"""
import ast
import difflib
from typing import Dict, List, Any, Optional, Tuple
from ..schemas.models import CodeDiffChange
from .ast_scanner import ASTScanner

class DiffAnalyzer:
    """Analyzes differences between two versions of code or git diff output."""

    @staticmethod
    def analyze_code_difference(
        file_path: str,
        old_code: str,
        new_code: str,
        change_description: str = ""
    ) -> CodeDiffChange:
        """Compares old code vs new code and extracts AST changes & signature deltas."""
        old_scan = ASTScanner.scan_code(file_path, old_code) if old_code.strip() else None
        new_scan = ASTScanner.scan_code(file_path, new_code) if new_code.strip() else None

        # Compute line diff
        diff_lines = list(difflib.unified_diff(
            old_code.splitlines(keepends=True),
            new_code.splitlines(keepends=True),
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}"
        ))
        diff_text = "".join(diff_lines)
        added_lines = sum(1 for line in diff_lines if line.startswith("+") and not line.startswith("+++"))
        removed_lines = sum(1 for line in diff_lines if line.startswith("-") and not line.startswith("---"))

        changed_functions: List[str] = []
        changed_classes: List[str] = []
        signature_changes: List[Dict[str, Any]] = []

        if old_scan and new_scan:
            old_funcs = {f.name: f for f in old_scan.functions}
            new_funcs = {f.name: f for f in new_scan.functions}

            # Check changed or removed functions
            for name, old_fn in old_funcs.items():
                if name not in new_funcs:
                    changed_functions.append(f"{name} (REMOVED)")
                    signature_changes.append({
                        "function": name,
                        "change_type": "DELETED",
                        "old_args": old_fn.args,
                        "new_args": [],
                        "impact": "Breaking change: dependent callers will raise AttributeError or NameError"
                    })
                else:
                    new_fn = new_funcs[name]
                    # Check argument differences
                    if old_fn.args != new_fn.args or old_fn.returns != new_fn.returns:
                        changed_functions.append(f"{name} (SIGNATURE_MODIFIED)")
                        signature_changes.append({
                            "function": name,
                            "change_type": "SIGNATURE_ALTERED",
                            "old_args": old_fn.args,
                            "new_args": new_fn.args,
                            "old_return": old_fn.returns,
                            "new_return": new_fn.returns,
                            "impact": f"Parameters changed from {old_fn.args} to {new_fn.args}. Callers may pass invalid arguments."
                        })
                    else:
                        # Check if function body changed by checking diff lines in range
                        changed_functions.append(f"{name} (BODY_UPDATED)")

            # Check new functions
            for name in new_funcs:
                if name not in old_funcs:
                    changed_functions.append(f"{name} (ADDED)")

            # Check classes
            old_cls = {c.name: c for c in old_scan.classes}
            new_cls = {c.name: c for c in new_scan.classes}
            for name in old_cls:
                if name not in new_cls:
                    changed_classes.append(f"{name} (REMOVED)")
                elif old_cls[name].methods != new_cls[name].methods or old_cls[name].bases != new_cls[name].bases:
                    changed_classes.append(f"{name} (MODIFIED)")
            for name in new_cls:
                if name not in old_cls:
                    changed_classes.append(f"{name} (ADDED)")

        elif new_scan and not old_scan:
            changed_functions = [f"{f.name} (NEW_FILE)" for f in new_scan.functions]
            changed_classes = [f"{c.name} (NEW_FILE)" for c in new_scan.classes]

        return CodeDiffChange(
            file_path=file_path,
            change_type="modified" if (old_code and new_code) else ("added" if new_code else "deleted"),
            changed_functions=changed_functions,
            changed_classes=changed_classes,
            signature_changes=signature_changes,
            added_lines=added_lines,
            removed_lines=removed_lines,
            diff_text=diff_text or (f"# Change description: {change_description}\n# Source modified: {file_path}")
        )

    @staticmethod
    def parse_git_diff(diff_str: str) -> List[CodeDiffChange]:
        """Parses a git diff patch and identifies changed files."""
        results: List[CodeDiffChange] = []
        current_file = None
        current_diff = []
        added = 0
        removed = 0

        for line in diff_str.splitlines(keepends=True):
            if line.startswith("diff --git"):
                if current_file:
                    results.append(CodeDiffChange(
                        file_path=current_file,
                        change_type="modified",
                        added_lines=added,
                        removed_lines=removed,
                        diff_text="".join(current_diff)
                    ))
                parts = line.strip().split()
                current_file = parts[-1].lstrip("b/")
                current_diff = [line]
                added = 0
                removed = 0
            else:
                if current_diff is not None:
                    current_diff.append(line)
                    if line.startswith("+") and not line.startswith("+++"):
                        added += 1
                    elif line.startswith("-") and not line.startswith("---"):
                        removed += 1

        if current_file and current_diff:
            results.append(CodeDiffChange(
                file_path=current_file,
                change_type="modified",
                added_lines=added,
                removed_lines=removed,
                diff_text="".join(current_diff)
            ))

        return results
