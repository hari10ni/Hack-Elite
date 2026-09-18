"""
Tuition and fee payment processing module.
Directly depends on database.py and student.py.
"""
from database import execute_query, TransactionDatabase
from student import get_student_record
from typing import Dict, Any, List

def process_fee_payment(student_id: int, amount: float, payment_method: str = "card") -> Dict[str, Any]:
    """Processes tuition fee payment and updates student account balance."""
    student = get_student_record(student_id)
    if not student:
        raise ValueError(f"Student with ID {student_id} does not exist.")

    txn_id = TransactionDatabase.record_transaction(student_id, amount, "COMPLETED")
    new_balance = max(0.0, float(student.get("balance", 0.0)) - amount)

    execute_query(
        "UPDATE students SET balance = :b WHERE id = :id",
        {"b": new_balance, "id": student_id}
    )

    return {
        "transaction_id": txn_id,
        "student_id": student_id,
        "amount": amount,
        "remaining_balance": new_balance,
        "status": "SUCCESS"
    }

def get_payment_history(student_id: int) -> List[Dict[str, Any]]:
    """Fetches payment ledger for a specific student."""
    return execute_query(
        "SELECT * FROM transactions WHERE student_id = :s ORDER BY timestamp DESC",
        {"s": student_id}
    )
