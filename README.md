# Hack-Elite: AI Engineering Change Impact Analyzer

Pre-deployment safety checker for software changes.

An AI-powered web application for software change impact analysis, dependency graph visualization, risk evidence explainability, test recommendation, and safe release planning.

## Key Features

1. **Deterministic Python AST Code Analysis:** Extracts all functions, classes, imports, and calls without code execution.
2. **Interactive React Flow Directed Graph:** Visualizes module relationships, color-coded blast radius hops (Modified, Direct, Indirect, Tests), and detects circular import cycles.
3. **5-Agent Autonomous Orchestrator:**
   - Change Detection Agent
   - Code Dependency Agent
   - Impact Assessment Agent
   - Test Recommendation Agent
   - Release Planning Agent
4. **Explainable Risk Evidence Table:** Full audit trail with step-by-step dependency breadcrumbs, signature break flags, and recommended remediation.
5. **Safe Release Plan & Human Sign-Off Gate:** Required reviewers, test execution commands, rollback contingency steps, and interactive approval checkboxes.
6. **Retrieval-Augmented Generation (RAG):** BM25 / TF-IDF code chunk indexing and semantic citation retrieval.
7. **Built-in Sample Scenarios & SQLite History:** Includes ready-to-run Student Information System scenarios and persistent history in SQLite.
8. **Automated Unit & Integration Test Suite:** Verifies AST parsing, cycle detection, diff signatures, and ZIP security.

## Quickstart (Windows, Mac, Linux)

```bash
# 1. Install dependencies
npm install

# 2. Run the application
npm run dev
```

Open your browser at `http://localhost:3000`.

## Running Automated Tests

```bash
python3 tests/run_all_tests.py
```
