import unittest
from database import DatabaseConnection, execute_query

class TestDatabase(unittest.TestCase):
    def test_connection(self):
        db = DatabaseConnection(":memory:")
        conn = db.connect()
        self.assertIsNotNone(conn)
        db.close()

    def test_execute_query(self):
        rows = execute_query("SELECT 1 AS num")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["num"], 1)

if __name__ == "__main__":
    unittest.main()
