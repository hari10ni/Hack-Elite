import unittest
from dashboard import get_admin_dashboard_summary, get_student_portal_view
from database import execute_query

class TestDashboard(unittest.TestCase):
    def setUp(self):
        execute_query("""
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT,
                major TEXT,
                gpa REAL,
                balance REAL
            )
        """)
        execute_query("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                amount REAL,
                status TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        execute_query("DELETE FROM students")
        execute_query("INSERT INTO students VALUES (301, 'Carol Danvers', 'carol@edu.org', 'Physics', 4.0, 100.0)")

    def test_dashboard_summary(self):
        summary = get_admin_dashboard_summary()
        self.assertEqual(summary["system_status"], "ONLINE")
        self.assertGreaterEqual(summary["total_active_students"], 1)

if __name__ == "__main__":
    unittest.main()
