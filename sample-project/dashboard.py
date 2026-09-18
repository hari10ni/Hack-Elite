"""
Executive analytics and student portal dashboard module.
Depends on login.py, student.py, and payment.py (indirectly depends on database.py).
"""
from login import authenticate_user
from student import list_enrolled_students, get_student_record
from payment import get_payment_history
from typing import Dict, Any

def get_admin_dashboard_summary() -> Dict[str, Any]:
    """Compiles high-level campus metrics for university administrators."""
    students = list_enrolled_students()
    total_students = len(students)
    total_outstanding = sum(float(s.get("balance", 0.0)) for s in students)

    return {
        "total_active_students": total_students,
        "total_outstanding_tuition": total_outstanding,
        "system_status": "ONLINE"
    }

def get_student_portal_view(student_id: int) -> Dict[str, Any]:
    """Assembles customized portal view for an individual logged-in student."""
    record = get_student_record(student_id)
    payments = get_payment_history(student_id)

    return {
        "profile": record,
        "recent_payments": payments,
        "notifications": ["Spring semester registration is open."]
    }
