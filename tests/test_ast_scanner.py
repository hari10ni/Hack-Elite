import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.analyzer.ast_scanner import ASTScanner

class TestASTScanner(unittest.TestCase):
    def test_basic_functions_and_imports(self):
        code = """
import os
import math
from database import execute_query, UserDatabase

def calculate_fee(student_id: int, base: float = 100.0) -> float:
    \"\"\"Calculates total fee.\"\"\"
    res = execute_query("SELECT 1")
    return base * 1.05

class Manager:
    def process(self):
        pass
"""
        res = ASTScanner.scan_code("service/fee.py", code)
        self.assertIn("os", res.imports)
        self.assertIn("database", res.from_imports)
        self.assertEqual(res.from_imports["database"], ["execute_query", "UserDatabase"])
        self.assertEqual(len(res.classes), 1)
        self.assertEqual(res.classes[0].name, "Manager")
        func_names = [f.name for f in res.functions]
        self.assertIn("calculate_fee", func_names)
        self.assertIn("Manager.process", func_names)
        self.assertIn("execute_query", res.function_calls)
        self.assertIsNone(res.syntax_error)

    def test_syntax_error_resilience(self):
        broken_code = "def broken(x:\n   return invalid syntax here"
        res = ASTScanner.scan_code("broken.py", broken_code)
        self.assertIsNotNone(res.syntax_error)
        self.assertTrue("SyntaxError" in res.syntax_error)

if __name__ == "__main__":
    unittest.main()
