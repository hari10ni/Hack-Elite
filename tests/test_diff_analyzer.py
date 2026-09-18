import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.analyzer.diff_analyzer import DiffAnalyzer

class TestDiffAnalyzer(unittest.TestCase):
    def test_signature_change_detection(self):
        old_code = """
def process(data, mode="fast"):
    return True
"""
        new_code = """
def process(data, mode="fast", timeout=60, retries=3):
    return True
"""
        diff = DiffAnalyzer.analyze_code_difference("worker.py", old_code, new_code)
        self.assertEqual(len(diff.signature_changes), 1)
        self.assertEqual(diff.signature_changes[0]["function"], "process")
        self.assertEqual(diff.signature_changes[0]["change_type"], "SIGNATURE_ALTERED")

if __name__ == "__main__":
    unittest.main()
