"""
Python AST Static Code Scanner.
Safely analyzes Python source code without executing it.
"""
import ast
import os
from typing import Dict, List, Any, Optional
from ..schemas.models import FileScanResult, FunctionSignature, ClassInfo

class ASTScanner:
    """Scans Python files and extracts structural and dependency information using ast."""

    @staticmethod
    def scan_code(file_path: str, source_code: str) -> FileScanResult:
        """Parse source code string and extract AST information."""
        norm_path = file_path.replace("\\", "/").lstrip("./")
        module_name = ASTScanner._file_path_to_module(norm_path)
        is_test = (
            "test" in norm_path.lower()
            or os.path.basename(norm_path).startswith("test_")
            or os.path.basename(norm_path).endswith("_test.py")
        )
        
        lines = source_code.splitlines()
        loc = len([line for line in lines if line.strip() and not line.strip().startswith("#")])

        try:
            tree = ast.parse(source_code, filename=file_path)
        except SyntaxError as e:
            return FileScanResult(
                file_path=norm_path,
                module_name=module_name,
                loc=loc,
                syntax_error=f"SyntaxError at line {e.lineno}: {e.msg}",
                is_test_file=is_test
            )
        except Exception as e:
            return FileScanResult(
                file_path=norm_path,
                module_name=module_name,
                loc=loc,
                syntax_error=f"Parse error: {str(e)}",
                is_test_file=is_test
            )

        imports: List[str] = []
        from_imports: Dict[str, List[str]] = {}
        functions: List[FunctionSignature] = []
        classes: List[ClassInfo] = []
        function_calls: List[str] = []

        for node in ast.walk(tree):
            # Normal imports: import os, sys, database
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)

            # From imports: from database import execute_query
            elif isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                # Handle relative imports e.g. .database
                if node.level and node.level > 0:
                    prefix = "." * node.level
                    mod = prefix + mod
                
                imported_names = [alias.name for alias in node.names]
                if mod in from_imports:
                    from_imports[mod].extend(imported_names)
                else:
                    from_imports[mod] = imported_names
                
                if mod not in imports and mod:
                    imports.append(mod)

            # Function calls: obj.method() or func()
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    function_calls.append(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    function_calls.append(node.func.attr)

        # Iterate top-level and class-level definitions preserving line ranges
        for item in tree.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                functions.append(ASTScanner._extract_function(item))
            elif isinstance(item, ast.ClassDef):
                cls_info = ASTScanner._extract_class(item)
                classes.append(cls_info)
                # Also include methods in functions list with Class.method naming
                for body_item in item.body:
                    if isinstance(body_item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        fn = ASTScanner._extract_function(body_item, parent_class=item.name)
                        functions.append(fn)

        # Deduplicate function calls
        unique_calls = list(dict.fromkeys(function_calls))

        return FileScanResult(
            file_path=norm_path,
            module_name=module_name,
            imports=list(dict.fromkeys(imports)),
            from_imports=from_imports,
            functions=functions,
            classes=classes,
            function_calls=unique_calls,
            loc=loc,
            syntax_error=None,
            is_test_file=is_test
        )

    @staticmethod
    def _extract_function(node: Any, parent_class: Optional[str] = None) -> FunctionSignature:
        name = f"{parent_class}.{node.name}" if parent_class else node.name
        args = []
        for a in node.args.args:
            args.append(a.arg)
        if node.args.vararg:
            args.append(f"*{node.args.vararg.arg}")
        if node.args.kwarg:
            args.append(f"**{node.args.kwarg.arg}")

        returns = None
        if getattr(node, "returns", None):
            try:
                returns = ast.unparse(node.returns)
            except Exception:
                returns = None

        docstring = ast.get_docstring(node)
        line_start = getattr(node, "lineno", 0)
        line_end = getattr(node, "end_lineno", line_start)

        return FunctionSignature(
            name=name,
            args=args,
            returns=returns,
            docstring=docstring,
            line_start=line_start,
            line_end=line_end
        )

    @staticmethod
    def _extract_class(node: ast.ClassDef) -> ClassInfo:
        bases = []
        for base in node.bases:
            try:
                bases.append(ast.unparse(base))
            except Exception:
                if isinstance(base, ast.Name):
                    bases.append(base.id)

        methods = []
        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                methods.append(item.name)

        docstring = ast.get_docstring(node)
        line_start = getattr(node, "lineno", 0)
        line_end = getattr(node, "end_lineno", line_start)

        return ClassInfo(
            name=node.name,
            bases=bases,
            methods=methods,
            docstring=docstring,
            line_start=line_start,
            line_end=line_end
        )

    @staticmethod
    def _file_path_to_module(file_path: str) -> str:
        """Convert 'path/to/module.py' -> 'path.to.module' or 'module'."""
        path = file_path.replace("\\", "/")
        if path.endswith(".py"):
            path = path[:-3]
        parts = [p for p in path.split("/") if p and p != "."]
        return ".".join(parts)
