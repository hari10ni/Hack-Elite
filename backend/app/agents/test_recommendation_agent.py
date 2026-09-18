"""
Agent 4: Test Recommendation Agent.
Identifies relevant test suites based on affected modules and explains why each test is critical.
"""
from typing import Dict, List
from ..schemas.models import FileScanResult, TestRecommendation

class TestRecommendationAgent:
    """Specialized agent matching code changes with test suites."""

    def __init__(self, name: str = "Test Recommendation Agent"):
        self.name = name

    def recommend(
        self,
        changed_file: str,
        affected_files: List[str],
        scan_results: Dict[str, FileScanResult]
    ) -> List[TestRecommendation]:
        recommendations: List[TestRecommendation] = []
        base_changed = changed_file.split("/")[-1].replace(".py", "")

        for f_path, scan in scan_results.items():
            if not scan.is_test_file:
                continue

            f_base = f_path.split("/")[-1].replace(".py", "")

            # Check if this test tests the changed file
            if base_changed in f_base or changed_file in scan.imports or base_changed in scan.imports:
                recommendations.append(TestRecommendation(
                    test_file=f_path,
                    target_component=changed_file,
                    priority="CRITICAL",
                    relevance_reason=f"Direct unit test suite for the modified file '{changed_file}'. Validates internal module contracts.",
                    suggested_commands=[f"pytest {f_path} -v", f"python -m unittest {f_path}"]
                ))
                continue

            # Check if this test tests any downstream affected file
            for aff in affected_files:
                aff_base = aff.split("/")[-1].replace(".py", "")
                if aff_base in f_base or aff in scan.imports or aff_base in scan.imports:
                    recommendations.append(TestRecommendation(
                        test_file=f_path,
                        target_component=aff,
                        priority="HIGH",
                        relevance_reason=f"Integration/Regression test for downstream dependent '{aff}' which consumes '{changed_file}'.",
                        suggested_commands=[f"pytest {f_path} -v"]
                    ))
                    break

        return recommendations
