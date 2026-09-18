"""
Directed Dependency Graph Engine.
Constructs dependency graphs, traces downstream impact paths, detects circular dependencies,
and formats data for React Flow visualization.
"""
from typing import Dict, List, Set, Tuple, Optional, Any
from ..schemas.models import FileScanResult, DependencyEdge

class DependencyGraphEngine:
    """
    Manages directed dependency graph.
    Edge convention: Dependency Module -> Dependent Module
    e.g. database.py -> student.py (database changes affect student)
    """

    def __init__(self, scan_results: Dict[str, FileScanResult]):
        self.scan_results = scan_results # file_path -> FileScanResult
        # Adjacency list: node -> set of nodes that depend on it (downstream dependents)
        self.adj: Dict[str, Set[str]] = {}
        # Reverse adjacency list: node -> set of dependencies it relies upon (upstream dependencies)
        self.reverse_adj: Dict[str, Set[str]] = {}
        # Edge metadata: (source, target) -> symbols imported
        self.edge_meta: Dict[Tuple[str, str], List[str]] = {}
        # Module lookup maps
        self.module_to_file: Dict[str, str] = {}
        self.file_to_module: Dict[str, str] = {}

        self._build_lookups()
        self._build_graph()

    def _build_lookups(self):
        for file_path, scan in self.scan_results.items():
            norm_path = file_path.replace("\\", "/").lstrip("./")
            self.adj[norm_path] = set()
            self.reverse_adj[norm_path] = set()
            self.file_to_module[norm_path] = scan.module_name
            # Map module name and base name
            self.module_to_file[scan.module_name] = norm_path
            base_name = norm_path.split("/")[-1]
            if base_name.endswith(".py"):
                self.module_to_file[base_name[:-3]] = norm_path
                self.module_to_file[base_name] = norm_path

    def _build_graph(self):
        """Analyze imports from each file and create directed edges: dependency -> dependent."""
        for dependent_path, scan in self.scan_results.items():
            norm_dep_path = dependent_path.replace("\\", "/").lstrip("./")

            # Check direct imports
            for imp in scan.imports:
                resolved_dep = self._resolve_module_to_file(imp, norm_dep_path)
                if resolved_dep and resolved_dep != norm_dep_path:
                    self._add_edge(resolved_dep, norm_dep_path, symbols=[])

            # Check from_imports with specific symbols
            for mod, symbols in scan.from_imports.items():
                resolved_dep = self._resolve_module_to_file(mod, norm_dep_path)
                if resolved_dep and resolved_dep != norm_dep_path:
                    self._add_edge(resolved_dep, norm_dep_path, symbols=symbols)

    def _add_edge(self, source_dependency: str, target_dependent: str, symbols: List[str]):
        self.adj[source_dependency].add(target_dependent)
        self.reverse_adj[target_dependent].add(source_dependency)
        key = (source_dependency, target_dependent)
        if key not in self.edge_meta:
            self.edge_meta[key] = []
        for s in symbols:
            if s not in self.edge_meta[key]:
                self.edge_meta[key].append(s)

    def _resolve_module_to_file(self, module_str: str, current_file: str) -> Optional[str]:
        """Resolve an import string (including relative imports) to a known project file path."""
        # 1. Direct match in module_to_file
        if module_str in self.module_to_file:
            return self.module_to_file[module_str]

        # 2. Relative import handling (.module or ..module)
        if module_str.startswith("."):
            curr_dir = "/".join(current_file.split("/")[:-1])
            dots = len(module_str) - len(module_str.lstrip("."))
            mod_part = module_str.lstrip(".")
            dir_parts = [p for p in curr_dir.split("/") if p]
            if dots > 1 and len(dir_parts) >= (dots - 1):
                dir_parts = dir_parts[:-(dots - 1)]
            target_parts = dir_parts + ([mod_part] if mod_part else [])
            candidate = "/".join(target_parts) + ".py"
            if candidate in self.scan_results:
                return candidate
            if "/".join(target_parts) in self.module_to_file:
                return self.module_to_file["/".join(target_parts)]

        # 3. Try matching by filename suffix (e.g. database -> database.py or src/database.py)
        clean_name = module_str.split(".")[-1]
        for f in self.scan_results.keys():
            base = f.split("/")[-1]
            if base == f"{clean_name}.py" or base == clean_name:
                return f

        return None

    def get_downstream_impact(self, changed_file: str) -> Tuple[List[str], List[str], Dict[str, List[List[str]]]]:
        """
        Calculates:
        - directly affected files (distance 1)
        - indirectly affected files (distance > 1)
        - all directed paths from changed_file to each affected file
        """
        norm_changed = changed_file.replace("\\", "/").lstrip("./")
        if norm_changed not in self.adj:
            return [], [], {}

        direct: List[str] = sorted(list(self.adj.get(norm_changed, set())))
        indirect_set: Set[str] = set()
        paths: Dict[str, List[List[str]]] = {}

        # BFS / DFS traversal to find all paths
        visited_in_path: Set[str] = {norm_changed}

        def dfs_paths(current: str, current_path: List[str]):
            for neighbor in self.adj.get(current, set()):
                new_path = current_path + [neighbor]
                if neighbor not in paths:
                    paths[neighbor] = []
                if new_path not in paths[neighbor]:
                    paths[neighbor].append(new_path)

                if neighbor not in direct and neighbor != norm_changed:
                    indirect_set.add(neighbor)

                if neighbor not in visited_in_path:
                    visited_in_path.add(neighbor)
                    dfs_paths(neighbor, new_path)
                    visited_in_path.remove(neighbor)

        dfs_paths(norm_changed, [norm_changed])

        indirect: List[str] = sorted(list(indirect_set))
        return direct, indirect, paths

    def detect_cycles(self) -> List[List[str]]:
        """Detect circular dependencies in the project."""
        visited: Dict[str, int] = {} # 0: unvisited, 1: visiting, 2: visited
        cycles: List[List[str]] = []

        for node in self.adj.keys():
            visited[node] = 0

        def dfs(node: str, stack: List[str]):
            visited[node] = 1
            stack.append(node)

            for neighbor in self.adj.get(node, set()):
                if visited.get(neighbor, 0) == 1:
                    # Cycle detected
                    idx = stack.index(neighbor)
                    cycle = stack[idx:] + [neighbor]
                    cycles.append(cycle)
                elif visited.get(neighbor, 0) == 0:
                    dfs(neighbor, stack)

            stack.pop()
            visited[node] = 2

        for node in self.adj.keys():
            if visited[node] == 0:
                dfs(node, [])

        return cycles

    def to_react_flow_graph(self, changed_file: Optional[str] = None) -> Dict[str, Any]:
        """
        Converts internal graph to React Flow format:
        nodes: [{ id, data: { label, isChanged, isDirect, isIndirect, loc, ... }, position }]
        edges: [{ id, source, target, animated, label, style }]
        """
        direct_set: Set[str] = set()
        indirect_set: Set[str] = set()
        norm_changed = changed_file.replace("\\", "/").lstrip("./") if changed_file else None

        if norm_changed:
            d, ind, _ = self.get_downstream_impact(norm_changed)
            direct_set = set(d)
            indirect_set = set(ind)

        # Compute layered positions using simple topological / BFS leveling
        levels: Dict[str, int] = {}
        for node in self.adj.keys():
            levels[node] = 0

        if norm_changed:
            levels[norm_changed] = 0
            queue = [(norm_changed, 0)]
            seen = {norm_changed}
            while queue:
                curr, lvl = queue.pop(0)
                for nxt in self.adj.get(curr, set()):
                    levels[nxt] = max(levels.get(nxt, 0), lvl + 1)
                    if nxt not in seen:
                        seen.add(nxt)
                        queue.append((nxt, lvl + 1))

        # Group nodes by level
        level_groups: Dict[int, List[str]] = {}
        for node, lvl in levels.items():
            if lvl not in level_groups:
                level_groups[lvl] = []
            level_groups[lvl].append(node)

        nodes = []
        for lvl, group in level_groups.items():
            for idx, node in enumerate(group):
                x = 80 + lvl * 280
                y = 80 + idx * 120
                scan = self.scan_results.get(node)
                is_changed = (node == norm_changed)
                is_direct = (node in direct_set)
                is_indirect = (node in indirect_set)
                is_test = scan.is_test_file if scan else False

                nodes.append({
                    "id": node,
                    "type": "customNode",
                    "position": {"x": x, "y": y},
                    "data": {
                        "label": node.split("/")[-1],
                        "fullPath": node,
                        "moduleName": scan.module_name if scan else node,
                        "isChanged": is_changed,
                        "isDirect": is_direct,
                        "isIndirect": is_indirect,
                        "isTest": is_test,
                        "loc": scan.loc if scan else 0,
                        "functionsCount": len(scan.functions) if scan else 0,
                        "classesCount": len(scan.classes) if scan else 0,
                        "syntaxError": scan.syntax_error if scan else None,
                        "importedSymbols": [
                            f"{k}: {', '.join(v)}" for k, v in (scan.from_imports.items() if scan else [])
                        ]
                    }
                })

        edges = []
        edge_id = 0
        for (src, tgt), symbols in self.edge_meta.items():
            is_active_impact = False
            if norm_changed:
                if (src == norm_changed and tgt in direct_set) or (src in direct_set and tgt in indirect_set) or (src in indirect_set and tgt in indirect_set):
                    is_active_impact = True

            edges.append({
                "id": f"e-{edge_id}",
                "source": src,
                "target": tgt,
                "animated": is_active_impact,
                "label": ", ".join(symbols[:2]) if symbols else "",
                "data": {
                    "symbols": symbols,
                    "isActiveImpact": is_active_impact
                }
            })
            edge_id += 1

        return {
            "nodes": nodes,
            "edges": edges,
            "summary": {
                "totalNodes": len(nodes),
                "totalEdges": len(edges),
                "changedFile": norm_changed,
                "directlyAffectedCount": len(direct_set),
                "indirectlyAffectedCount": len(indirect_set),
                "circularDependencies": self.detect_cycles()
            }
        }
