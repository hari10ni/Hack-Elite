import unittest
from login import authenticate_user, create_user_session
from database import execute_query

class TestLogin(unittest.TestCase):
    def setUp(self):
        execute_query("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT,
                password_hash TEXT,
                role TEXT,
                last_login TIMESTAMP
            )
        """)
        execute_query("DELETE FROM users")
        execute_query("INSERT INTO users VALUES (1, 'admin', 'hashed_secret123', 'ADMIN', NULL)")

    def test_auth_success(self):
        self.assertTrue(authenticate_user("admin", "secret123"))

    def test_auth_failure(self):
        self.assertFalse(authenticate_user("admin", "wrongpassword"))

    def test_session_creation(self):
        token = create_user_session(1)
        self.assertTrue(token.startswith("sess_token_1"))

if __name__ == "__main__":
    unittest.main()
