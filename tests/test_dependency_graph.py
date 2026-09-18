import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.analyzer.ast_scanner import ASTScanner
from backend.app.analyzer.graph_engine import DependencyGraphEngine

class TestDependencyGraph(unittest.TestCase):
    def setUp(self):
        self.files = {
            "db.py": "def query(): pass",
            "model.py": "import db\ndef get_data(): db.query()",
            "service.py": "import model\ndef run(): model.get_data()",
            "test_db.py": "import db\ndef test_q(): pass"
        }
        self.scans = {p: ASTScanner.scan_code(p, c) for p, c in self.files.items()}
        self.engine = DependencyGraphEngine(self.scans)

    def test_direct_and_indirect_downstream(self):
        direct, indirect, paths = self.engine.get_downstream_impact("db.py")
        self.assertIn("model.py", direct)
        self.assertIn("test_db.py", direct)
        self.assertIn("service.py", indirect)
        self.assertIn("service.py", paths)
        # Check that path is db.py -> model.py -> service.py
        expected_path = ["db.py", "model.py", "service.py"]
        self.assertIn(expected_path, paths["service.py"])

    def test_cycle_detection(self):
        cycle_files = {
            "a.py": "import b",
            "b.py": "import a"
        }
        scans = {p: ASTScanner.scan_code(p, c) for p, c in cycle_files.items()}
        engine = DependencyGraphEngine(scans)
        cycles = engine.detect_cycles()
        self.assertGreaterEqual(len(cycles), 1)

if __name__ == "__main__":
    unittest.main()
