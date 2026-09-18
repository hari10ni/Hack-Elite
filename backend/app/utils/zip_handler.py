"""
Safe ZIP extraction and path traversal validation.
Prevents zip slip attacks, restricts file sizes and counts,
and filters out unwanted directories (.git, __pycache__, node_modules, .venv).
"""
import os
import zipfile
import io
from typing import Dict, Tuple, List

MAX_FILE_COUNT = 300
MAX_TOTAL_BYTES = 25 * 1024 * 1024 # 25 MB
MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024 # 5 MB

EXCLUDED_DIR_NAMES = {
    ".git", "__pycache__", "node_modules", ".venv", "venv", "env",
    ".idea", ".vscode", ".pytest_cache", ".mypy_cache", ".tox",
    "dist", "build", "egg-info"
}

ALLOWED_EXTENSIONS = {".py", ".md", ".txt", ".json", ".yaml", ".yml", ".sql", ".ini", ".cfg"}

class SafeZipHandler:
    """Safely inspects and extracts zip archives directly into in-memory dictionary."""

    @staticmethod
    def extract_zip_bytes(zip_bytes: bytes) -> Tuple[Dict[str, str], List[str]]:
        """
        Extracts files from zip bytes safely in memory.
        Returns (valid_files_dict, warnings_list).
        """
        warnings = []
        extracted_files: Dict[str, str] = {}
        total_size = 0

        with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
            infolist = zf.infolist()

            if len(infolist) > MAX_FILE_COUNT:
                raise ValueError(f"Zip archive contains too many files ({len(infolist)}). Limit is {MAX_FILE_COUNT}.")

            for info in infolist:
                # 1. Directory entry
                if info.is_dir():
                    continue

                # 2. Path Traversal & Zip-Slip Protection
                clean_name = os.path.normpath(info.filename).replace("\\", "/")
                if clean_name.startswith("../") or "/../" in clean_name or clean_name.startswith("/"):
                    warnings.append(f"Skipped unsafe path: {info.filename}")
                    continue

                # 3. Check for excluded directory paths
                parts = clean_name.split("/")
                if any(p in EXCLUDED_DIR_NAMES for p in parts):
                    continue

                # 4. Filter for supported extensions
                ext = os.path.splitext(clean_name)[1].lower()
                if ext not in ALLOWED_EXTENSIONS:
                    continue

                # 5. Check sizes
                if info.file_size > MAX_SINGLE_FILE_BYTES:
                    warnings.append(f"Skipped file {clean_name}: size {info.file_size} exceeds limit {MAX_SINGLE_FILE_BYTES}")
                    continue

                total_size += info.file_size
                if total_size > MAX_TOTAL_BYTES:
                    raise ValueError(f"Total extracted size exceeds {MAX_TOTAL_BYTES / (1024*1024)} MB limit.")

                # Read text content safely
                try:
                    raw = zf.read(info)
                    text = raw.decode("utf-8", errors="replace")
                    extracted_files[clean_name] = text
                except Exception as e:
                    warnings.append(f"Could not decode {clean_name}: {str(e)}")

        return extracted_files, warnings
