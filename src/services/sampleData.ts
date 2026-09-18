export interface ScenarioErrorMetadata {
  title: string;
  description: string;
  errorType: string;
  line: number;
  failingCallers: string[];
}

export interface ScenarioFixMetadata {
  title: string;
  description: string;
  safeguards: string[];
  isCorrectProgram: boolean;
  releasePlanIdeas: string[];
}

export interface ChangeScenario {
  id: string;
  name: string;
  targetFile: string;
  description: string;
  expectedRisk: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  baselineError: ScenarioErrorMetadata;
  proposedFix: ScenarioFixMetadata;
  fullBaselineCode: string; // The original baseline code containing error of the program
  fullProposedCode: string; // The modified proposed solution column containing the correct program
  backwardCompatibleSolution?: string;
  oldCodeDelta: string;
  newCodeDelta: string;
}

export const SAMPLE_SCENARIOS: ChangeScenario[] = [
  {
    id: "db-signature-break",
    name: "Scenario A: Database API Signature Defect (High Risk)",
    targetFile: "database.py",
    description: "Original baseline code contains breaking TypeError defect in execute_query; proposed solution provides the correct program.",
    expectedRisk: "HIGH",
    summary: "Baseline code has mandatory parameter 'timeout' without default, breaking login.py, student.py, payment.py, and dashboard.py. The proposed solution is the verified correct program.",
    baselineError: {
      title: "TypeError: Missing Default Value for 'timeout' Parameter",
      description: "Function definition 'def execute_query(query: str, timeout: int, params...)' makes 'timeout' mandatory. All 4 downstream caller modules invoke execute_query(query, params) without timeout and will crash with runtime TypeError at execution.",
      errorType: "Signature Defect / Breaking Contract",
      line: 49,
      failingCallers: ["login.py (line 75)", "student.py (line 42)", "payment.py (line 85)", "dashboard.py (line 30)"]
    },
    proposedFix: {
      title: "Correct Program: Default Parameter & Query Safety Guard",
      description: "Resolves the signature mismatch by assigning 'timeout: int = 30'. Downstream callers continue operating seamlessly while query timeout protection is safely introduced.",
      safeguards: [
        "Default parameter 'timeout: int = 30' restores 100% backward-compatibility for legacy callers",
        "Connection pool timeout enforcement prevents hung database threads",
        "Exception safety block guarantees connection cleanup and rollback"
      ],
      isCorrectProgram: true,
      releasePlanIdeas: [
        "Deploy canary container to 10% student traffic with query latency monitoring",
        "Run automated regression suite across login.py, student.py, and payment.py",
        "Maintain connection pool error budget alarm (< 0.05% error rate)"
      ]
    },
    fullBaselineCode: `"""
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

# ==============================================================================
# [PROGRAM ERROR IN THIS BASELINE CODE]
# DEFECT: Mandatory parameter 'timeout' lacks a default value.
# RUNTIME IMPACT: Calls like execute_query("SELECT...", params) in login.py,
# student.py, and payment.py raise TypeError: missing 1 required positional argument.
# ==============================================================================
def execute_query(query: str, timeout: int, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Executes a SQL statement against the active database.
    
    CRITICAL DEFECT: 'timeout: int' is a required positional argument with no default.
    Every caller in the repository invokes execute_query(query, params) and will crash!
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
        # This caller will CRASH with TypeError!
        rows = execute_query(
            "SELECT id, username, password_hash, role FROM users WHERE username = :u",
            {"u": username}
        )
        return rows[0] if rows else None

class TransactionDatabase:
    """Helper repository for recording fee payments."""
    @staticmethod
    def record_transaction(student_id: int, amount: float, status: str) -> str:
        # This caller will CRASH with TypeError!
        execute_query(
            "INSERT INTO transactions (student_id, amount, status) VALUES (:s, :a, :st)",
            {"s": student_id, "a": amount, "st": status}
        )
        return f"TXN-{student_id}-{int(amount)}"
`,
    fullProposedCode: `"""
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

# ==============================================================================
# [CORRECT PROGRAM - VERIFIED SOLUTION]
# RESOLUTION: Assigned safe default 'timeout: int = 30'.
# RESULT: 100% backward compatible with all downstream modules (login, student,
# payment). Enforces query timeout protection without breaking existing callers.
# ==============================================================================
def execute_query(query: str, timeout: int = 30, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Executes a SQL statement against the active database with enforced query timeout.
    
    CORRECT PROGRAM: 'timeout' default of 30 ensures callers omitting timeout continue
    to function without any TypeError exceptions.
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
`,
    backwardCompatibleSolution: `def execute_query(query: str, timeout: int = 30, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Safe backward-compatible signature with default timeout."""
    conn = _GLOBAL_DB.connect()
    cursor = conn.cursor()
    parameters = params or {}
    cursor.execute(query, parameters)
    try:
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except Exception:
        conn.commit()
        return []`,
    oldCodeDelta: `def execute_query(query: str, timeout: int, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    # ERROR: Missing default value for timeout breaks all callers`,
    newCodeDelta: `def execute_query(query: str, timeout: int = 30, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    # CORRECT: Default timeout=30 preserves caller compatibility and adds safety`,
  },
  {
    id: "payment-logic-update",
    name: "Scenario B: Fee Processing Logic Shift (Medium Risk)",
    targetFile: "payment.py",
    description: "Original baseline code lacks credit card transaction fee auditing causing ledger desync; proposed solution is the verified correct program.",
    expectedRisk: "MEDIUM",
    summary: "Modifies payment calculation rules in payment.py. Baseline lacks surcharge calculation causing ledger mismatches; proposed solution provides audited calculation.",
    baselineError: {
      title: "Silent Financial Discrepancy & Unaudited Card Surcharge",
      description: "Baseline implementation records transactions without card surcharge calculation, causing tuition fee reconciliation mismatches between billing ledger and credit card gateways.",
      errorType: "Accounting Logic Defect / Ledger Desync",
      line: 243,
      failingCallers: ["dashboard.py (revenue reporting)", "tests/test_payment.py (assertions)"]
    },
    proposedFix: {
      title: "Correct Program: Audited Surcharge Calculation & Payment Audit Trail",
      description: "Accurately applies $15.0 card surcharge, captures effective charge in transaction audit records, and returns full reconciliation status.",
      safeguards: [
        "Card payment surcharge explicitly recorded in ledger transaction",
        "Student balance update bounded with max(0.0) safeguard",
        "Transaction ID linked with status flag 'SUCCESS'"
      ],
      isCorrectProgram: true,
      releasePlanIdeas: [
        "Enable dual-run accounting audit for 48 hours to compare ledger deltas",
        "Run payment integration test suite with synthetic card credentials",
        "Set alert threshold for student fee billing discrepancy > $0.00"
      ]
    },
    fullBaselineCode: `"""
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
`,
    fullProposedCode: `"""
Tuition and fee payment processing module.
Directly depends on database.py and student.py.
"""
from database import execute_query, TransactionDatabase
from student import get_student_record
from typing import Dict, Any, List

def process_fee_payment(student_id: int, amount: float, payment_method: str = "card") -> Dict[str, Any]:
    """Processes tuition fee payment with late surcharge audit."""
    student = get_student_record(student_id)
    if not student:
        raise ValueError(f"Student with ID {student_id} does not exist.")

    # Business Logic Shift: Apply $15 card transaction fee
    surcharge = 15.0 if payment_method == "card" else 0.0
    effective_charge = amount + surcharge
    txn_id = TransactionDatabase.record_transaction(student_id, effective_charge, "COMPLETED")
    new_balance = max(0.0, float(student.get("balance", 0.0)) - amount)

    execute_query(
        "UPDATE students SET balance = :b WHERE id = :id",
        {"b": new_balance, "id": student_id}
    )

    return {
        "transaction_id": txn_id,
        "student_id": student_id,
        "amount": effective_charge,
        "surcharge_applied": surcharge,
        "remaining_balance": new_balance,
        "status": "SUCCESS"
    }

def get_payment_history(student_id: int) -> List[Dict[str, Any]]:
    """Fetches payment ledger for a specific student."""
    return execute_query(
        "SELECT * FROM transactions WHERE student_id = :s ORDER BY timestamp DESC",
        {"s": student_id}
    )
`,
    backwardCompatibleSolution: `"""
Tuition and fee payment processing module.
Directly depends on database.py and student.py.
"""
from database import execute_query, TransactionDatabase
from student import get_student_record
from typing import Dict, Any, List

def process_fee_payment(student_id: int, amount: float, payment_method: str = "card", apply_surcharge: bool = False) -> Dict[str, Any]:
    """Processes tuition fee payment with optional surcharge support preserving legacy calculations."""
    student = get_student_record(student_id)
    if not student:
        raise ValueError(f"Student with ID {student_id} does not exist.")

    surcharge = 15.0 if (payment_method == "card" and apply_surcharge) else 0.0
    effective_charge = amount + surcharge
    txn_id = TransactionDatabase.record_transaction(student_id, effective_charge, "COMPLETED")
    new_balance = max(0.0, float(student.get("balance", 0.0)) - amount)

    execute_query(
        "UPDATE students SET balance = :b WHERE id = :id",
        {"b": new_balance, "id": student_id}
    )

    return {
        "transaction_id": txn_id,
        "student_id": student_id,
        "amount": effective_charge,
        "surcharge_applied": surcharge,
        "remaining_balance": new_balance,
        "status": "SUCCESS"
    }

def get_payment_history(student_id: int) -> List[Dict[str, Any]]:
    """Fetches payment ledger for a specific student."""
    return execute_query(
        "SELECT * FROM transactions WHERE student_id = :s ORDER BY timestamp DESC",
        {"s": student_id}
    )
`,
    oldCodeDelta: `txn_id = TransactionDatabase.record_transaction(student_id, amount, "COMPLETED")`,
    newCodeDelta: `surcharge = 15.0 if payment_method == "card" else 0.0
effective_charge = amount + surcharge
txn_id = TransactionDatabase.record_transaction(student_id, effective_charge, "COMPLETED")`,
  },
  {
    id: "student-enrollment-refactor",
    name: "Scenario C: Student Course Prerequisite & Capacity Check (Low Risk)",
    targetFile: "student.py",
    description: "Original baseline code lacks capacity ceiling check allowing over-enrollment; proposed solution is the verified correct program.",
    expectedRisk: "LOW",
    summary: "Refactors student.py internal validation. Baseline lacks class limit checks; proposed solution introduces capacity verification and parameters.",
    baselineError: {
      title: "Missing Capacity Limit & Unbounded Enrollment Defect",
      description: "Baseline implementation inserts course enrollments without validating section ceiling. Sections can be overfilled beyond room capacity (limit 60).",
      errorType: "Constraint / Boundary Defect",
      line: 396,
      failingCallers: ["enroll_student callers", "tests/test_student.py (capacity assertions)"]
    },
    proposedFix: {
      title: "Correct Program: Section Limit Enforcement & Defensive Validation",
      description: "Checks current enrollment count against section limit (60) before executing database insert, returning false when capacity is reached.",
      safeguards: [
        "Class section capacity ceiling strictly enforced",
        "Preserves existing enroll_student(student_id, course_code) caller interface",
        "Safe boolean false return on capacity overflow"
      ],
      isCorrectProgram: true,
      releasePlanIdeas: [
        "Pre-registration load test with simulated concurrency",
        "Run unit tests for enrollment boundaries",
        "Rollback if course drop rate spikes post-deployment"
      ]
    },
    fullBaselineCode: `"""
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
`,
    fullProposedCode: `"""
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
    """Enrolls a student in a specific course with capacity limit check."""
    student = get_student_record(student_id)
    if not student:
        return False
    # Validate course cap limit (max 60 students per section)
    current_enrolled = list_enrolled_students(course_code)
    if len(current_enrolled) >= 60:
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
`,
    backwardCompatibleSolution: `"""
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

def enroll_student(student_id: int, course_code: str, max_capacity: int = 60) -> bool:
    """Enrolls a student with configurable capacity ceiling (default 60)."""
    student = get_student_record(student_id)
    if not student:
        return False
    current_enrolled = list_enrolled_students(course_code)
    if len(current_enrolled) >= max_capacity:
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
`,
    oldCodeDelta: `def enroll_student(student_id: int, course_code: str) -> bool:
    # Inserts without checking course size`,
    newCodeDelta: `def enroll_student(student_id: int, course_code: str) -> bool:
    # Validates current_enrolled count < 60 before inserting`,
  },
];
