"""
Agent 5: Release Planning Agent.
Combines impact findings into an actionable pre-release checklist with rollback considerations.
"""
from typing import Dict, List, Any
from ..schemas.models import (
    CodeDiffChange,
    RiskEvidenceItem,
    TestRecommendation,
    ReleasePlan
)

class ReleasePlanningAgent:
    """Specialized agent compiling verified impact results into safe release procedures."""

    def __init__(self, name: str = "Release Planning Agent"):
        self.name = name

    def generate_plan(
        self,
        changed_file: str,
        diff_change: CodeDiffChange,
        direct_files: List[str],
        indirect_files: List[str],
        tests: List[TestRecommendation],
        evidence: List[RiskEvidenceItem]
    ) -> ReleasePlan:
        files_to_review = [{
            "file": changed_file,
            "role": "Source of Change (Primary)",
            "action": "Complete code review of AST diff, parameter changes, and comments"
        }]

        for f in direct_files:
            files_to_review.append({
                "file": f,
                "role": "Direct Dependent (High Priority)",
                "action": f"Verify all import calls to {changed_file} remain valid"
            })

        for f in indirect_files:
            files_to_review.append({
                "file": f,
                "role": "Indirect Dependent (Regression Scope)",
                "action": "Verify overall business logic flow and integration data integrity"
            })

        integration_checks = [
            f"Verify clean static import resolution across all {len(direct_files) + len(indirect_files)} dependent files.",
            f"Verify all {len(diff_change.signature_changes)} modified function signatures have corresponding updates in calling code.",
            "Verify environment configurations and dependency compatibility."
        ]

        backward_compatibility = [
            f"Signature alterations: {len(diff_change.signature_changes)} detected."
            if diff_change.signature_changes else
            "No breaking signature changes detected in public symbols."
        ]

        staging_checks = [
            "Deploy candidate branch to staging environment.",
            "Run end-to-end integration test suite.",
            "Monitor server telemetry and logs for TypeError or AttributeError events."
        ]

        rollback_plan = [
            f"Automated git revert commit ready for '{changed_file}'.",
            "Maintain container image tag of previous stable release.",
            "Rollback trigger: Any critical regression reported in staging or canary traffic."
        ]

        human_checklist = [
            {"item": f"Code author self-verified changes in '{changed_file}'", "checked": False},
            {"item": "At least one independent peer approval on pull request", "checked": False},
            {"item": f"All {len(tests)} recommended test suites executed successfully", "checked": False},
            {"item": "Staging environment validation passed", "checked": False},
            {"item": "Release Manager / Tech Lead final sign-off", "checked": False}
        ]

        assumptions = [
            "Static analysis relies on explicit Python imports and AST tokens.",
            "Does not replace comprehensive QA testing or human architectural review.",
            "External database schemas or third-party webhooks must be manually reviewed."
        ]

        return ReleasePlan(
            files_to_review=files_to_review,
            pre_release_tests=tests,
            integration_checks=integration_checks,
            backward_compatibility_concerns=backward_compatibility,
            staging_deployment_checks=staging_checks,
            rollback_plan=rollback_plan,
            human_approval_checklist=human_checklist,
            assumptions_and_limitations=assumptions
        )
