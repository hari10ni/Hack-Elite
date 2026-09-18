import unittest
from payment import process_fee_payment, get_payment_history
from database import execute_query

class TestPayment(unittest.TestCase):
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
        execute_query("DELETE FROM transactions")
        execute_query("INSERT INTO students VALUES (202, 'Bob Jones', 'bob@edu.org', 'EE', 3.5, 2000.0)")

    def test_process_fee_payment(self):
        res = process_fee_payment(202, 500.0)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["remaining_balance"], 1500.0)

if __name__ == "__main__":
    unittest.main()
