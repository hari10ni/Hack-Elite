import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.analyzer.ast_scanner import ASTScanner
from backend.app.agents.orchestrator import AnalysisOrchestrator

class TestAgents(unittest.TestCase):
    def test_orchestrator_pipeline(self):
        files = {
            "core.py": "def init_engine(): pass",
            "app.py": "import core\ndef start(): core.init_engine()",
            "tests/test_core.py": "import core\ndef test_init(): pass"
        }
        scans = {p: ASTScanner.scan_code(p, c) for p, c in files.items()}
        orchestrator = AnalysisOrchestrator()
        result = orchestrator.run_pipeline(
            project_id="test-proj",
            project_name="Test Project",
            changed_file="core.py",
            scan_results=scans,
            old_code="def init_engine(): pass",
            new_code="def init_engine(verbose=True, max_conns=10): pass",
            change_description="Added parameters to init_engine"
        )
        self.assertEqual(result.changed_file, "core.py")
        self.assertIn("app.py", result.directly_affected_files)
        self.assertIn("tests/test_core.py", result.related_tests)
        self.assertIsNotNone(result.release_plan)
        self.assertGreaterEqual(len(result.risk_evidence), 1)

if __name__ == "__main__":
    unittest.main()
