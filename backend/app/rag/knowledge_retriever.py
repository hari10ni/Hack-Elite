"""
Retrieval-Augmented Generation (RAG) Knowledge Retriever.
Indexes source code chunks, docstrings, tests, and READMEs,
and retrieves contextually relevant snippets for change impact explanations.
"""
import math
import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

@dataclass
class RetrievedChunk:
    chunk_id: str
    file_path: str
    symbol_name: str
    chunk_type: str # "function", "class", "docstring", "test", "readme"
    content: str
    score: float
    relevance_reason: str

class ProjectKnowledgeRetriever:
    """Indexes project files into searchable semantic/lexical chunks."""

    def __init__(self, files: Optional[Dict[str, str]] = None):
        self.chunks: List[Dict[str, Any]] = []
        self.vocabulary: Dict[str, int] = {}
        self.doc_freq: Dict[str, int] = {}
        if files:
            self.index_project(files)

    def index_project(self, files: Dict[str, str]):
        """Index all project files (code, tests, markdown)."""
        self.chunks = []
        chunk_idx = 0

        for file_path, content in files.items():
            norm_path = file_path.replace("\\", "/").lstrip("./")
            is_test = "test" in norm_path.lower()
            is_readme = "readme" in norm_path.lower() or norm_path.endswith(".md")

            if is_readme:
                # Chunk markdown by sections
                sections = re.split(r"\n(?=#{1,3}\s)", content)
                for sec in sections:
                    if sec.strip():
                        self.chunks.append({
                            "chunk_id": f"chunk-{chunk_idx}",
                            "file_path": norm_path,
                            "symbol_name": "Documentation",
                            "chunk_type": "readme",
                            "content": sec.strip()[:1000],
                            "tokens": self._tokenize(sec)
                        })
                        chunk_idx += 1
            else:
                # Chunk code by function, class or 40-line blocks
                lines = content.splitlines()
                current_block: List[str] = []
                current_symbol = norm_path

                for line in lines:
                    if line.startswith("def ") or line.startswith("class "):
                        if current_block:
                            block_text = "\n".join(current_block)
                            self.chunks.append({
                                "chunk_id": f"chunk-{chunk_idx}",
                                "file_path": norm_path,
                                "symbol_name": current_symbol,
                                "chunk_type": "test" if is_test else "code",
                                "content": block_text[:1200],
                                "tokens": self._tokenize(block_text)
                            })
                            chunk_idx += 1
                            current_block = []
                        sym_match = re.match(r"(def|class)\s+([a-zA-Z0-9_]+)", line)
                        current_symbol = sym_match.group(2) if sym_match else norm_path

                    current_block.append(line)

                if current_block:
                    block_text = "\n".join(current_block)
                    self.chunks.append({
                        "chunk_id": f"chunk-{chunk_idx}",
                        "file_path": norm_path,
                        "symbol_name": current_symbol,
                        "chunk_type": "test" if is_test else "code",
                        "content": block_text[:1200],
                        "tokens": self._tokenize(block_text)
                    })
                    chunk_idx += 1

        self._build_df()

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r"[a-zA-Z_][a-zA-Z0-9_]*", text.lower())
        return [w for w in words if len(w) > 2]

    def _build_df(self):
        self.doc_freq = {}
        for ch in self.chunks:
            unique_tokens = set(ch["tokens"])
            for t in unique_tokens:
                self.doc_freq[t] = self.doc_freq.get(t, 0) + 1

    def retrieve(self, query: str, top_k: int = 5) -> List[RetrievedChunk]:
        """BM25/TF-IDF scored retrieval of project chunks matching the query."""
        if not self.chunks:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        num_docs = len(self.chunks)
        scores = []

        for ch in self.chunks:
            doc_tokens = ch["tokens"]
            doc_len = len(doc_tokens)
            if doc_len == 0:
                continue

            score = 0.0
            matched_terms = []
            for qt in query_tokens:
                if qt in doc_tokens:
                    tf = doc_tokens.count(qt) / doc_len
                    df = self.doc_freq.get(qt, 1)
                    idf = math.log((num_docs + 1) / (df + 0.5)) + 1
                    score += tf * idf
                    matched_terms.append(qt)

            if score > 0:
                unique_matched = sorted(list(set(matched_terms)))[:4]
                reason = f"Contains related keywords: {', '.join(unique_matched)}"
                scores.append((score, ch, reason))

        scores.sort(key=lambda x: x[0], reverse=True)
        results = []

        for sc, ch, reason in scores[:top_k]:
            results.append(RetrievedChunk(
                chunk_id=ch["chunk_id"],
                file_path=ch["file_path"],
                symbol_name=ch["symbol_name"],
                chunk_type=ch["chunk_type"],
                content=ch["content"],
                score=round(float(sc), 3),
                relevance_reason=reason
            ))

        return results
