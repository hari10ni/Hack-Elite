# AI Engineering Change Impact Analyzer — College Project & Viva Guide

An AI-Powered Web Application for Software Change Impact Analysis, Dependency Graph Visualization, and Safe Release Planning.

---

## 1. Project Title & Abstract

### Project Title
**AI Engineering Change Impact Analyzer: Multi-Agent Software Blast Radius Prediction & Static AST Dependency Verification**

### Abstract
In software engineering, modifying a core component (such as database access layer or authentication module) often introduces breaking changes across downstream services, modules, APIs, and test suites. Manual impact tracing is error-prone, while generic LLM code generation often suffers from hallucinations when inferring dependency structures.

This project delivers a **standalone, functional full-stack web application** that integrates deterministic **Python Abstract Syntax Tree (AST)** static code analysis with a **5-Agent Autonomous Pipeline**, **Interactive React Flow Directed Graphs**, and **Retrieval-Augmented Generation (RAG)**. The system isolates code deltas, traces 1-hop and transitive dependency blast radii, pinpoints interface signature breaks, prioritizes regression tests, and compiles human-audited safe release plans before code is merged.

---

## 2. Core Problem Statement

1. **Hidden Downstream Breakages:** Direct callers and transitive multi-hop dependencies are often forgotten during pull request reviews.
2. **Breaking Signature Alterations:** Adding required positional parameters or modifying return types produces runtime `TypeError` and crashes.
3. **Inefficient or Skipped Testing:** Developers either execute the entire slow test suite or skip tests, leading to production regressions.
4. **AI Hallucination Risk:** Asking a general-purpose LLM to guess imports across multi-file repositories regularly invents phantom files or links. Ground-truth AST parsing solves this.

---

## 3. System Architecture & Tech Stack

```
+-------------------------------------------------------------------------------+
|                       REACT 18 + VITE FRONTEND                                |
|  - React Flow Directed Dependency Graph (Zoom, Pan, Minimap, Node Filtering)  |
|  - Side-by-Side & Unified Diff Viewer with Line Highlighting                  |
|  - Explainable Risk Evidence Table with Dependency Chain Breadcrumbs          |
|  - Interactive Safe Release Gate Sign-Off & Markdown Report Exporter          |
+---------------------------------------+---------------------------------------+
                                        | (REST API JSON / Port 3000)
+---------------------------------------v---------------------------------------+
|                    EXPRESS FULL-STACK BACKEND SERVER                          |
|  - Node.js Service Layer & Safe ZIP File Extraction                           |
|  - Subprocess Bridge to Python Analysis Engine                                |
|  - Google Gemini 3.8 Flash SDK Client (Architectural Reasoning & Explanations)|
+---------------------------------------+---------------------------------------+
                                        | (Subprocess CLI Stdin/Stdout)
+---------------------------------------v---------------------------------------+
|                 PYTHON 3.10 STATIC CODE ANALYSIS & AGENTS                     |
|  - ast_scanner.py         -> Non-executing AST import & symbol parsing        |
|  - graph_engine.py        -> NetworkX-style Directed Graph & BFS blast radius |
|  - diff_analyzer.py       -> AST function signature comparison                |
|  - 5 Logical AI Agents    -> Change Detection, Dependency, Impact, Tests,     |
|                              Release Planning                                 |
|  - knowledge_retriever.py -> BM25 / TF-IDF Semantic Code Chunk Retrieval (RAG)|
|  - sqlite_store.py        -> Local SQLite database for history & reports      |
+-------------------------------------------------------------------------------+
```

---

## 4. The 5 Logical AI Agents

1. **Change Detection Agent:** Compiles ASTs of original and modified code. Detects added/removed functions, classes, and parameter alterations.
2. **Code Dependency Agent:** Traverses module import DAG. Identifies direct (1-hop) and transitive downstream callers; detects circular import cycles.
3. **Impact Assessment Agent:** Computes blast radius score (0-100), assigns High/Medium/Low risk levels, and generates explainable evidence items.
4. **Test Recommendation Agent:** Inspects test suites (`test_*.py`), matches test function targets against modified files, and emits executable `pytest` commands.
5. **Release Planning Agent:** Compiles reviewer assignments, backward-compatibility warnings, rollback contingency steps, and human sign-off checkboxes.

---

## 5. Local Setup on Windows (VS Code)

### Prerequisites
- Node.js 18+ (Download from https://nodejs.org)
- Python 3.10+ (Check with `python --version`)

### Step-by-Step Execution
1. **Clone or Open Folder in VS Code:**
   ```bash
   code .
   ```
2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```
3. **Run Dev Server:**
   ```bash
   npm run dev
   ```
   Open your browser at: `http://localhost:3000`

4. **Run Automated Test Suite:**
   ```bash
   python tests/run_all_tests.py
   ```

---

## 6. Examiner Viva Q&A Cheat Sheet

**Q1: Why is static AST parsing superior to pure LLM prompt engineering for dependency analysis?**  
*Answer:* Pure LLMs suffer from context window limits and hallucinations. Python's built-in `ast` module parses code into a deterministic syntax tree without running the code. It guarantees 100% mathematical accuracy on all imports, function signatures, and call expressions. The LLM is then used for architectural risk synthesis rather than guessing imports.

**Q2: How is the downstream blast radius calculated?**  
*Answer:* The dependency graph is modeled as a Directed Acyclic Graph (DAG) $G = (V, E)$, where $V$ represents Python files and $E$ represents import statements $(A \to B$ means $A$ imports $B$). Downstream impact is computed via Breadth-First Search (BFS) starting from the modified file, categorizing 1-hop as direct impact and 2+ hops as indirect/transitive impact.

**Q3: How does the system handle breaking function signatures?**  
*Answer:* The `DiffAnalyzer` parses both the old and new ASTs of the changed file. It compares `FunctionDef.args` (positional args, keyword-only args, and defaults). If required parameters are added without defaults or parameters are renamed, it flags a `SIGNATURE_ALTERED` event and prioritizes callers as HIGH risk.

**Q4: Is the uploaded code executed on the server?**  
*Answer:* No. The system strictly uses `ast.parse()`, which only converts text into an abstract syntax tree. It never calls `exec()` or `eval()`, preventing arbitrary code execution vulnerabilities. Additionally, the `SafeZipHandler` verifies canonical paths to prevent Zip-Slip path traversal attacks.

---

## 7. Sample Project Scenarios (Student Information System)

- **Scenario 1 (HIGH RISK):** Alter `database.py` function signature for `execute_query(sql, timeout=30)` by introducing a required parameter. Cascades to `student.py`, `login.py`, and `payment.py`.
- **Scenario 2 (MEDIUM RISK):** Modify `payment.py` transaction validation rules. Affects `student.py` and `dashboard.py`.
- **Scenario 3 (LOW RISK):** Modify non-breaking logic in `dashboard.py`. Downstream blast radius is zero.
