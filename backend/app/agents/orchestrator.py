"""
Main Agent Orchestrator.
Coordinates the workflow:
Change Detection -> Dependency Analysis -> Impact Assessment -> Test Recommendations -> Safe Release Plan -> Final Report.
"""
import uuid
import datetime
from typing import Dict, List, Optional
from ..schemas.models import (
    FileScanResult,
    CodeDiffChange,
    ImpactAnalysisResult
)
from .change_detection_agent import ChangeDetectionAgent
from .dependency_agent import CodeDependencyAgent
from .impact_assessment_agent import ImpactAssessmentAgent
from .test_recommendation_agent import TestRecommendationAgent
from .release_planning_agent import ReleasePlanningAgent
from ..analyzer.impact_calculator import ImpactCalculator

class AnalysisOrchestrator:
    """Coordinates the 5 specialized agents to deliver end-to-end change impact analysis."""

    def __init__(self):
        self.change_agent = ChangeDetectionAgent()
        self.dependency_agent = CodeDependencyAgent()
        self.impact_agent = ImpactAssessmentAgent()
        self.test_agent = TestRecommendationAgent()
        self.release_agent = ReleasePlanningAgent()

    def run_pipeline(
        self,
        project_id: str,
        project_name: str,
        changed_file: str,
        scan_results: Dict[str, FileScanResult],
        old_code: str = "",
        new_code: str = "",
        change_description: str = "",
        ai_insights: Optional[str] = None
    ) -> ImpactAnalysisResult:
        analysis_id = str(uuid.uuid4())[:8]

        # Stage 1: Change Detection Agent
        diff_change = self.change_agent.inspect_change(
            file_path=changed_file,
            old_code=old_code,
            new_code=new_code,
            change_description=change_description
        )

        # Stage 2: Code Dependency Agent
        graph_engine, direct, indirect, paths = self.dependency_agent.build_and_trace(
            scan_results=scan_results,
            changed_file=changed_file
        )

        # Stage 3: Impact Assessment Agent
        evidence = self.impact_agent.assess(
            changed_file=changed_file,
            diff_change=diff_change,
            direct_files=direct,
            indirect_files=indirect,
            dependency_paths=paths,
            scan_results=scan_results
        )

        # Stage 4: Test Recommendation Agent
        tests = self.test_agent.recommend(
            changed_file=changed_file,
            affected_files=direct + indirect,
            scan_results=scan_results
        )

        # Stage 5: Release Planning Agent
        release_plan = self.release_agent.generate_plan(
            changed_file=changed_file,
            diff_change=diff_change,
            direct_files=direct,
            indirect_files=indirect,
            tests=tests,
            evidence=evidence
        )

        # Stage 6: Calculate final impact metric scores
        result = ImpactCalculator.calculate(
            project_id=project_id,
            project_name=project_name,
            analysis_id=analysis_id,
            changed_file=changed_file,
            change_description=change_description or f"Modified {changed_file}",
            diff_change=diff_change,
            scan_results=scan_results,
            graph_engine=graph_engine
        )

        result.created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Synthesize explainable summary
        rule_explanation = (
            f"### Change Impact Assessment for `{changed_file}`\n\n"
            f"**1. Scope of Modification:**\n"
            f"- Changed file: `{changed_file}`\n"
            f"- Modified functions/classes: {', '.join(diff_change.changed_functions) if diff_change.changed_functions else 'Direct module modification'}\n"
            f"- Signature alterations detected: {len(diff_change.signature_changes)}\n\n"
            f"**2. Downstream Blast Radius:**\n"
            f"- **{len(direct)} Direct Dependent(s):** {', '.join(f'`{f}`' for f in direct) if direct else 'None'}\n"
            f"- **{len(indirect)} Indirect Dependent(s):** {', '.join(f'`{f}`' for f in indirect) if indirect else 'None'}\n"
            f"- Total affected modules: {len(result.affected_modules)}\n\n"
            f"**3. Risk Level: {result.risk_level} (Score: {result.risk_score}/100)**\n"
            f"- Rationale: Classified as **{result.risk_level}** due to {len(direct)} direct dependent files and "
            f"{len(diff_change.signature_changes)} interface signature shifts across the project dependency tree.\n\n"
            f"**4. Verification Plan:**\n"
            f"- Identified **{len(result.related_tests)}** related test suites that must be executed prior to merge.\n"
            f"- Review priority items: {len(result.risk_evidence)} evidence points cataloged."
        )

        result.ai_explanation = ai_insights or rule_explanation
        result.release_plan = release_plan

        return result
