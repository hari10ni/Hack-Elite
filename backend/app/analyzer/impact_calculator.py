"""
Impact Calculator and Risk Assessment Engine.
Classifies change risks using explainable rule-based heuristics.
"""
from typing import Dict, List, Set, Any, Tuple
from ..schemas.models import (
    FileScanResult,
    CodeDiffChange,
    RiskEvidenceItem,
    TestRecommendation,
    ReleasePlan,
    ImpactAnalysisResult
)
from .graph_engine import DependencyGraphEngine

class ImpactCalculator:
    """Calculates downstream impact, transparent risk scoring, and evidence items."""

    @staticmethod
    def calculate(
        project_id: str,
        project_name: str,
        analysis_id: str,
        changed_file: str,
        change_description: str,
        diff_change: CodeDiffChange,
        scan_results: Dict[str, FileScanResult],
        graph_engine: DependencyGraphEngine
    ) -> ImpactAnalysisResult:
        norm_changed = changed_file.replace("\\", "/").lstrip("./")
        direct_files, indirect_files, paths = graph_engine.get_downstream_impact(norm_changed)

        all_affected = list(dict.fromkeys(direct_files + indirect_files))
        affected_modules = list(dict.fromkeys([
            scan_results[f].module_name for f in all_affected if f in scan_results
        ]))

        # Changed symbols from diff or changed file scan
        changed_scan = scan_results.get(norm_changed)
        all_changed_symbols: List[str] = []
        if diff_change.changed_functions:
            all_changed_symbols.extend(diff_change.changed_functions)
        elif changed_scan:
            all_changed_symbols.extend([f.name for f in changed_scan.functions])

        # Identify related test files
        related_tests: List[str] = []
        test_recommendations: List[TestRecommendation] = []

        base_changed_name = norm_changed.split("/")[-1].replace(".py", "")

        for f_path, scan in scan_results.items():
            if not scan.is_test_file:
                continue

            f_base = f_path.split("/")[-1].replace(".py", "")
            is_directly_related = (
                base_changed_name in f_base
                or norm_changed in scan.imports
                or base_changed_name in scan.imports
            )

            # Check if this test tests any of the affected files
            is_affected_related = False
            tested_affected = []
            for aff in all_affected:
                aff_base = aff.split("/")[-1].replace(".py", "")
                if aff_base in f_base or aff in scan.imports or aff_base in scan.imports:
                    is_affected_related = True
                    tested_affected.append(aff)

            if is_directly_related:
                related_tests.append(f_path)
                test_recommendations.append(TestRecommendation(
                    test_file=f_path,
                    target_component=norm_changed,
                    priority="CRITICAL",
                    relevance_reason=f"Direct test suite for changed component '{norm_changed}'. Must pass before merging.",
                    suggested_commands=[f"pytest {f_path} -v", f"python -m unittest {f_path}"]
                ))
            elif is_affected_related:
                related_tests.append(f_path)
                test_recommendations.append(TestRecommendation(
                    test_file=f_path,
                    target_component=", ".join(tested_affected),
                    priority="HIGH",
                    relevance_reason=f"Validates downstream dependent module(s) {', '.join(tested_affected)} that import '{norm_changed}'.",
                    suggested_commands=[f"pytest {f_path} -v"]
                ))

        # Risk Evidence Generation
        risk_evidence: List[RiskEvidenceItem] = []
        has_signature_changes = len(diff_change.signature_changes) > 0
        total_downstream = len(all_affected)

        for comp in all_affected:
            is_direct = comp in direct_files
            dep_path = paths.get(comp, [[norm_changed, comp]])[0]
            scan = scan_results.get(comp)

            # Determine imported symbols from changed file
            edge_key = (norm_changed, comp)
            symbols_used = graph_engine.edge_meta.get(edge_key, [])

            priority = "HIGH" if (is_direct and has_signature_changes) else ("HIGH" if is_direct and total_downstream > 3 else ("MEDIUM" if is_direct else "LOW"))

            reason = (
                f"Directly imports '{norm_changed}'"
                if is_direct else
                f"Indirectly depends on '{norm_changed}' via path: {' → '.join(dep_path)}"
            )

            potential_consequence = (
                "Runtime signature mismatch, parameter misalignment, or unhandled exceptions if caller expects old API contract."
                if has_signature_changes else
                "Behavioral divergence if return data or side-effects of shared dependency have changed."
            )

            suggested_verification = (
                f"Inspect call-sites in '{comp}', update method signatures if required, and run component unit tests."
            )

            risk_evidence.append(RiskEvidenceItem(
                component=comp,
                priority=priority,
                reason=reason,
                dependency_path=dep_path,
                changed_symbols=symbols_used or all_changed_symbols[:3],
                potential_consequence=potential_consequence,
                suggested_verification=suggested_verification,
                confidence=0.95 if is_direct else 0.80,
                is_confirmed=True # Static AST verified
            ))

        # Overall Risk Assessment
        if has_signature_changes or total_downstream >= 4:
            overall_risk = "HIGH"
            risk_score = min(95.0, 60.0 + total_downstream * 7.5 + (20 if has_signature_changes else 0))
        elif total_downstream >= 2:
            overall_risk = "MEDIUM"
            risk_score = 40.0 + total_downstream * 5.0
        else:
            overall_risk = "LOW"
            risk_score = 20.0 + total_downstream * 5.0

        # Build Safe Release Plan
        files_to_review = []
        # Changed file
        files_to_review.append({
            "file": norm_changed,
            "role": "Source of change",
            "action": "Peer code review diff, docstrings, and backward compatibility"
        })
        for f in direct_files:
            files_to_review.append({
                "file": f,
                "role": "Direct downstream dependent",
                "action": f"Verify all references to {norm_changed} match the updated implementation"
            })
        for f in indirect_files:
            files_to_review.append({
                "file": f,
                "role": "Indirect downstream dependent",
                "action": "Sanity check end-to-end integration workflows"
            })

        integration_checks = [
            f"Verify that module imports for '{norm_changed}' resolve cleanly without circular dependencies.",
            f"Run integration test matrix covering {len(all_affected)} downstream dependent file(s).",
            "Check for any environment variables, database schema migrations, or config changes tied to this modification."
        ]

        backward_compatibility_concerns = []
        if has_signature_changes:
            backward_compatibility_concerns.append(
                f"Detected {len(diff_change.signature_changes)} function signature alteration(s). Callers relying on former parameter orders will break."
            )
        else:
            backward_compatibility_concerns.append(
                "No public signature breakages detected in AST, but internal behavioral changes may alter return types or error conditions."
            )

        staging_deployment_checks = [
            "Deploy change to isolated Staging/Sandbox environment before production promotion.",
            "Execute smoke test suite on dependent API endpoints and UI dashboard flows.",
            "Inspect application error logs for unexpected NameError, TypeError, or AttributeError spikes."
        ]

        rollback_plan = [
            f"Prepare fast rollback commit or feature flag disabling recent edits to '{norm_changed}'.",
            "Maintain previous version artifact in repository release tags for zero-downtime revert.",
            "Document manual rollback triggers: any unhandled exception in core dependent modules during canary phase."
        ]

        human_approval_checklist = [
            {"item": "Code author self-review of unified diff and AST delta completed", "checked": False},
            {"item": f"At least one peer review sign-off on changes to '{norm_changed}'", "checked": False},
            {"item": f"All {len(related_tests)} recommended test suites executed and passing (100% green)", "checked": False},
            {"item": "Staging smoke tests verified by QA / Release engineer", "checked": False},
            {"item": "Rollback procedure verified and accessible to on-call engineer", "checked": False}
        ]

        assumptions = [
            "Analysis is based on Python Abstract Syntax Tree (AST) static inspection and file import statements.",
            "Dynamic imports (e.g. __import__(), importlib.import_module()) and runtime monkey-patching cannot be fully detected by static analysis.",
            "Database schema migrations or external API contracts must be independently verified by engineering team."
        ]

        release_plan = ReleasePlan(
            files_to_review=files_to_review,
            pre_release_tests=test_recommendations,
            integration_checks=integration_checks,
            backward_compatibility_concerns=backward_compatibility_concerns,
            staging_deployment_checks=staging_deployment_checks,
            rollback_plan=rollback_plan,
            human_approval_checklist=human_approval_checklist,
            assumptions_and_limitations=assumptions
        )

        return ImpactAnalysisResult(
            analysis_id=analysis_id,
            project_id=project_id,
            project_name=project_name,
            changed_file=norm_changed,
            change_description=change_description,
            files_scanned=len(scan_results),
            modules_identified=len(set(s.module_name for s in scan_results.values())),
            directly_affected_files=direct_files,
            indirectly_affected_files=indirect_files,
            potentially_affected_symbols=all_changed_symbols,
            affected_modules=affected_modules,
            related_tests=related_tests,
            dependency_paths=paths,
            risk_level=overall_risk,
            risk_score=round(risk_score, 1),
            risk_evidence=risk_evidence,
            test_recommendations=test_recommendations,
            release_plan=release_plan,
            created_at=""
        )
