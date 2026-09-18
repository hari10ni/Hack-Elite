"""
Student records and academic enrollment management module.
Relies on database.py for student database operations.
"""
from database import execute_query
from typing import Dict, List, Any, Optional

def get_student_record(student_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves full profile details for a given student ID."""
    rows = execute_query(
        "SELECT id, name, email, major, gpa, balance FROM students WHERE id = :id",
        {"id": student_id}
    )
    return rows[0] if rows else None

def enroll_student(student_id: int, course_code: str) -> bool:
    """Enrolls a student in a specific course."""
    student = get_student_record(student_id)
    if not student:
        return False
    execute_query(
        "INSERT INTO enrollments (student_id, course_code) VALUES (:sid, :code)",
        {"sid": student_id, "code": course_code}
    )
    return True

def list_enrolled_students(course_code: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns all students currently enrolled in the university or course."""
    if course_code:
        return execute_query(
            "SELECT s.* FROM students s JOIN enrollments e ON s.id = e.student_id WHERE e.course_code = :c",
            {"c": course_code}
        )
    return execute_query("SELECT * FROM students ORDER BY name ASC")
