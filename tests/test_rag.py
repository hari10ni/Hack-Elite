import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.rag.knowledge_retriever import ProjectKnowledgeRetriever

class TestRAGRetriever(unittest.TestCase):
    def test_indexing_and_retrieval(self):
        files = {
            "database.py": "def execute_query(sql):\n    '''Executes SQL database statements.'''\n    return []\n",
            "student.py": "import database\ndef register_student(name):\n    database.execute_query('INSERT INTO students')\n",
        }
        retriever = ProjectKnowledgeRetriever(files)
        results = retriever.retrieve("execute_query database SQL", top_k=2)
        self.assertGreater(len(results), 0)
        top = results[0]
        self.assertIn("database.py", top.file_path)
        self.assertGreater(top.score, 0)
        self.assertTrue(len(top.relevance_reason) > 0)

if __name__ == "__main__":
    unittest.main()
