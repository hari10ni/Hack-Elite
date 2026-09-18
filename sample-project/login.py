"""
Authentication and session management module.
Relies on database.py for credential verification.
"""
from database import execute_query, UserDatabase

def authenticate_user(username: str, password_plain: str) -> bool:
    """Verifies username and password against the database record."""
    user = UserDatabase.find_by_username(username)
    if not user:
        return False
    return user.get("password_hash") == f"hashed_{password_plain}"

def create_user_session(user_id: int) -> str:
    """Generates an active session token for an authenticated user."""
    execute_query(
        "UPDATE users SET last_login = datetime('now') WHERE id = :id",
        {"id": user_id}
    )
    return f"sess_token_{user_id}_auth"
