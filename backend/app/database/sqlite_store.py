"""
SQLite Database Layer for AI Engineering Change Impact Analyzer.
Stores project metadata, scanned files, analysis history, and exported reports.
"""
import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "impact_analyzer.db")

class SQLiteStore:
    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    files_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS project_files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    content TEXT NOT NULL,
                    loc INTEGER DEFAULT 0,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS analyses (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    project_name TEXT NOT NULL,
                    changed_file TEXT NOT NULL,
                    change_description TEXT,
                    risk_level TEXT,
                    risk_score REAL,
                    data_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects(id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id TEXT PRIMARY KEY,
                    analysis_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content_md TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (analysis_id) REFERENCES analyses(id)
                )
            """)
            conn.commit()

    def save_project(self, project_id: str, name: str, files: Dict[str, str]):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO projects (id, name, files_count) VALUES (?, ?, ?)",
                (project_id, name, len(files))
            )
            # Delete old files if re-saving
            cursor.execute("DELETE FROM project_files WHERE project_id = ?", (project_id,))
            for f_path, content in files.items():
                loc = len([line for line in content.splitlines() if line.strip() and not line.strip().startswith("#")])
                cursor.execute(
                    "INSERT INTO project_files (project_id, file_path, content, loc) VALUES (?, ?, ?, ?)",
                    (project_id, f_path, content, loc)
                )
            conn.commit()

    def get_project_files(self, project_id: str) -> Dict[str, str]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT file_path, content FROM project_files WHERE project_id = ?", (project_id,))
            rows = cursor.fetchall()
            return {r["file_path"]: r["content"] for r in rows}

    def list_projects(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, files_count, created_at FROM projects ORDER BY created_at DESC")
            return [dict(r) for r in cursor.fetchall()]

    def save_analysis(self, analysis_data: Dict[str, Any]):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO analyses 
                (id, project_id, project_name, changed_file, change_description, risk_level, risk_score, data_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                analysis_data["analysis_id"],
                analysis_data["project_id"],
                analysis_data["project_name"],
                analysis_data["changed_file"],
                analysis_data.get("change_description", ""),
                analysis_data.get("risk_level", "UNKNOWN"),
                analysis_data.get("risk_score", 0.0),
                json.dumps(analysis_data)
            ))
            conn.commit()

    def get_analysis(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT data_json FROM analyses WHERE id = ?", (analysis_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row["data_json"])
            return None

    def list_analyses(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, project_id, project_name, changed_file, change_description, risk_level, risk_score, created_at 
                FROM analyses ORDER BY created_at DESC
            """)
            return [dict(r) for r in cursor.fetchall()]

    def delete_analysis(self, analysis_id: str) -> bool:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM reports WHERE analysis_id = ?", (analysis_id,))
            cursor.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
            conn.commit()
            return cursor.rowcount > 0
