"""
Agent 3: Impact Assessment Agent.
Evaluates potential consequences, examines interface shifts, and generates explainable risk indicators.
"""
from typing import Dict, List
from ..schemas.models import FileScanResult, CodeDiffChange, RiskEvidenceItem

class ImpactAssessmentAgent:
    """Specialized agent evaluating risk severity and consequences across downstream components."""

    def __init__(self, name: str = "Impact Assessment Agent"):
        self.name = name

    def assess(
        self,
        changed_file: str,
        diff_change: CodeDiffChange,
        direct_files: List[str],
        indirect_files: List[str],
        dependency_paths: Dict[str, List[List[str]]],
        scan_results: Dict[str, FileScanResult]
    ) -> List[RiskEvidenceItem]:
        evidence: List[RiskEvidenceItem] = []
        has_signature_changes = len(diff_change.signature_changes) > 0
        total_downstream = len(direct_files) + len(indirect_files)

        for comp in direct_files:
            dep_path = dependency_paths.get(comp, [[changed_file, comp]])[0]
            priority = "HIGH" if (has_signature_changes or total_downstream > 3) else "MEDIUM"
            reason = f"Direct dependency: '{comp}' explicitly imports symbols from '{changed_file}'."
            consequence = (
                "High probability of regression: Callers in this module invoke functions from the modified file. Any parameter, return type, or exception change directly impacts execution."
                if has_signature_changes else
                "Moderate regression risk: Module imports the modified file. If state handling or side effects have changed, runtime behavior will shift."
            )
            evidence.append(RiskEvidenceItem(
                component=comp,
                priority=priority,
                reason=reason,
                dependency_path=dep_path,
                changed_symbols=diff_change.changed_functions[:3] or ["<module-level imports>"],
                potential_consequence=consequence,
                suggested_verification=f"Review all import call sites in '{comp}' and run targeted unit tests.",
                confidence=0.95,
                is_confirmed=True
            ))

        for comp in indirect_files:
            dep_path = dependency_paths.get(comp, [[changed_file, comp]])[0]
            priority = "MEDIUM" if has_signature_changes else "LOW"
            path_str = " → ".join(dep_path)
            reason = f"Transitive dependency: Reached via cascading import chain: {path_str}."
            consequence = (
                "Cascading regression potential: Module relies on an intermediate component that itself depends on the changed file. Data format changes may propagate downstream."
            )
            evidence.append(RiskEvidenceItem(
                component=comp,
                priority=priority,
                reason=reason,
                dependency_path=dep_path,
                changed_symbols=["Transitive contract"],
                potential_consequence=consequence,
                suggested_verification=f"Perform end-to-end integration test exercising the flow through {path_str}.",
                confidence=0.82,
                is_confirmed=True
            ))

        return evidence
