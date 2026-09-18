import unittest
from student import get_student_record, enroll_student, list_enrolled_students
from database import execute_query

class TestStudent(unittest.TestCase):
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
            CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                course_code TEXT
            )
        """)
        execute_query("DELETE FROM students")
        execute_query("DELETE FROM enrollments")
        execute_query("INSERT INTO students VALUES (101, 'Alice Smith', 'alice@edu.org', 'CS', 3.8, 1500.0)")

    def test_get_student_record(self):
        record = get_student_record(101)
        self.assertIsNotNone(record)
        self.assertEqual(record["name"], "Alice Smith")

    def test_enroll_student(self):
        res = enroll_student(101, "CS401")
        self.assertTrue(res)

if __name__ == "__main__":
    unittest.main()
