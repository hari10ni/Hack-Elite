"""
Database connectivity and query execution engine for Student Information System.
Shared dependency across login, student, payment, and test modules.
"""
import sqlite3
from typing import List, Dict, Any, Optional

class DatabaseConnection:
    """Manages SQLite database pool connection."""
    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self._connection: Optional[sqlite3.Connection] = None

    def connect(self) -> sqlite3.Connection:
        if self._connection is None:
            self._connection = sqlite3.connect(self.db_path)
            self._connection.row_factory = sqlite3.Row
        return self._connection

    def close(self):
        if self._connection:
            self._connection.close()
            self._connection = None

_GLOBAL_DB = DatabaseConnection()

def execute_query(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Executes a SQL statement against the active database.
    
    Args:
        query: SQL string to execute
        params: Optional dictionary of bound query parameters
        
    Returns:
        List of row dictionaries
    """
    conn = _GLOBAL_DB.connect()
    cursor = conn.cursor()
    parameters = params or {}
    cursor.execute(query, parameters)
    try:
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except Exception:
        conn.commit()
        return []

class UserDatabase:
    """Helper repository for querying user accounts."""
    @staticmethod
    def find_by_username(username: str) -> Optional[Dict[str, Any]]:
        rows = execute_query(
            "SELECT id, username, password_hash, role FROM users WHERE username = :u",
            {"u": username}
        )
        return rows[0] if rows else None

class TransactionDatabase:
    """Helper repository for recording fee payments."""
    @staticmethod
    def record_transaction(student_id: int, amount: float, status: str) -> str:
        execute_query(
            "INSERT INTO transactions (student_id, amount, status) VALUES (:s, :a, :st)",
            {"s": student_id, "a": amount, "st": status}
        )
        return f"TXN-{student_id}-{int(amount)}"
