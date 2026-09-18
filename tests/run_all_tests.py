"""
Automated Test Suite Runner for AI Engineering Change Impact Analyzer.
Discovers and executes all unit and integration tests.
"""
import unittest
import sys
import os

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.discover(os.path.dirname(__file__), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    res = runner.run(suite)
    sys.exit(0 if res.wasSuccessful() else 1)
