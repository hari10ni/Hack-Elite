import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GraphData, GraphNodeData } from "../types";
import { Info, Code2, AlertTriangle, CheckCircle, FileCode } from "lucide-react";

interface DependencyGraphViewProps {
  graphData: GraphData;
  changedFile?: string | null;
  onSelectNode?: (nodeId: string) => void;
}

// Custom Node Component
const CustomNodeComponent = ({ data, selected }: { data: GraphNodeData; selected?: boolean }) => {
  const getBadgeStyle = () => {
    if (data.isChanged) {
      return {
        bg: "bg-[#2D1B1B] border-[#A63A3A] text-[#FFB3B3]",
        tag: "CHANGED",
        tagBg: "bg-[#A63A3A]/25 text-[#FFB3B3] border-[#A63A3A]/40",
      };
    }
    if (data.isDirect) {
      return {
        bg: "bg-[#2E281C] border-[#C6A76B] text-[#E8DFD0]",
        tag: "DIRECT DEPENDENT",
        tagBg: "bg-[#C6A76B]/25 text-[#E8DFD0] border-[#C6A76B]/40",
      };
    }
    if (data.isIndirect) {
      return {
        bg: "bg-[#1E2B22] border-[#718477] text-[#D6DFD2]",
        tag: "INDIRECT DEPENDENT",
        tagBg: "bg-[#718477]/25 text-[#D6DFD2] border-[#718477]/40",
      };
    }
    if (data.isTest) {
      return {
        bg: "bg-[#1E2B1E] border-[#394A3F] text-[#C4D1BF]",
        tag: "TEST SUITE",
        tagBg: "bg-[#394A3F]/35 text-[#C4D1BF] border-[#394A3F]/50",
      };
    }
    return {
      bg: "bg-[#202522] border-[#3A453C] text-[#F7F5EF]",
      tag: "MODULE",
      tagBg: "bg-[#333D35] text-[#A2B29F] border-[#4A5844]",
    };
  };

  const style = getBadgeStyle();

  return (
    <div
      className={`min-w-[190px] rounded-lg border-2 shadow-lg transition-all px-3 py-2.5 ${style.bg} ${
        selected ? "ring-2 ring-[#C6A76B] ring-offset-2 ring-offset-[#131B12]" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#C6A76B] !w-2 !h-2" />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-mono text-xs font-semibold truncate max-w-[130px]" title={data.label}>
          {data.label}
        </span>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${style.tagBg}`}>
          {style.tag}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-[#A2B29F] border-t border-[#3A453C] pt-1.5 mt-1 font-mono">
        <span>{data.loc} LOC</span>
        <span>•</span>
        <span>{data.functionsCount} fn</span>
        {data.classesCount > 0 && (
          <>
            <span>•</span>
            <span>{data.classesCount} cls</span>
          </>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#C6A76B] !w-2 !h-2" />
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNodeComponent,
};

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({
  graphData,
  changedFile,
  onSelectNode,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Convert graph data to React Flow nodes and edges
  const initialNodes: Node[] = useMemo(() => {
    return graphData.nodes.map((n) => ({
      id: n.id,
      type: "customNode",
      position: n.position,
      data: n.data,
    }));
  }, [graphData]);

  const initialEdges: Edge[] = useMemo(() => {
    return graphData.edges.map((e) => {
      const isHighlighted =
        e.data?.isActiveImpact ||
        (changedFile && (e.source === changedFile || e.target === changedFile));

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isHighlighted || false,
        label: e.label ? e.label.slice(0, 24) : undefined,
        style: {
          stroke: isHighlighted ? "#A63A3A" : "#4A5844",
          strokeWidth: isHighlighted ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighlighted ? "#A63A3A" : "#718477",
        },
        labelStyle: { fill: "#C4D1BF", fontSize: 9, fontFamily: "monospace" },
        labelBgStyle: { fill: "#1E2B1E", fillOpacity: 0.9 },
      };
    });
  }, [graphData, changedFile]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId)?.data || null;
  }, [selectedNodeId, graphData]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      if (onSelectNode) onSelectNode(node.id);
    },
    [onSelectNode]
  );

  return (
    <div className="relative w-full h-[620px] bg-[#131B12] rounded-xl border border-[#718477]/30 overflow-hidden flex flex-col md:flex-row shadow-lg">
      {/* React Flow Canvas */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#253424" gap={18} size={1} />
          <Controls className="!bg-[#1E2B1E] !border-[#394A3F]/50 !text-[#F7F5EF]" />
          <MiniMap
            className="!bg-[#1E2B1E] !border-[#394A3F]/50"
            nodeColor={(node: any) => {
              if (node.data?.isChanged) return "#A63A3A";
              if (node.data?.isDirect) return "#C6A76B";
              if (node.data?.isIndirect) return "#718477";
              if (node.data?.isTest) return "#394A3F";
              return "#333D35";
            }}
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <div className="absolute top-3 left-3 bg-[#1E2B1E]/95 backdrop-blur border border-[#394A3F]/60 p-2.5 rounded-lg text-xs space-y-1 z-10 font-sans shadow-md">
          <p className="font-semibold text-[#F7F5EF] text-[11px] uppercase tracking-wider mb-1.5">
            Graph Conventions
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A63A3A]" />
            <span className="text-[#C4D1BF]">Changed File (Origin)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C6A76B]" />
            <span className="text-[#C4D1BF]">Direct Dependent (1-Hop)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#718477]" />
            <span className="text-[#C4D1BF]">Indirect Dependent (Transitive)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#394A3F] border border-[#718477]/40" />
            <span className="text-[#C4D1BF]">Test Suite</span>
          </div>
          <p className="text-[10px] text-[#A2B29F] pt-1 border-t border-[#394A3F]/60 mt-1">
            Arrow direction: <span className="font-mono text-[#E8DFD0]">dependency → dependent</span>
          </p>
        </div>
      </div>

      {/* Node Inspector Sidebar */}
      <div className="w-full md:w-80 bg-[#182218] border-t md:border-t-0 md:border-l border-[#394A3F]/40 p-4 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#394A3F]/40">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C6A76B]" />
            <span className="font-semibold text-sm text-[#F7F5EF]">Node Inspector</span>
          </div>
          {selectedNodeData && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#263325] text-[#C4D1BF] border border-[#394A3F]/50">
              {selectedNodeData.label}
            </span>
          )}
        </div>

        {selectedNodeData ? (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <p className="text-[#A2B29F] font-medium mb-1">Full Path</p>
              <p className="font-mono text-[#F7F5EF] bg-[#121911] p-2 rounded border border-[#334130] break-all">
                {selectedNodeData.fullPath}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#121911] p-2.5 rounded border border-[#334130]">
                <span className="text-[#A2B29F] block text-[10px]">Lines of Code</span>
                <span className="text-base font-semibold text-[#F7F5EF] font-mono">
                  {selectedNodeData.loc}
                </span>
              </div>
              <div className="bg-[#121911] p-2.5 rounded border border-[#334130]">
                <span className="text-[#A2B29F] block text-[10px]">Role in Impact</span>
                <span
                  className={`text-xs font-semibold block mt-0.5 ${
                    selectedNodeData.isChanged
                      ? "text-[#FFB3B3]"
                      : selectedNodeData.isDirect
                      ? "text-[#E8DFD0]"
                      : selectedNodeData.isIndirect
                      ? "text-[#D6DFD2]"
                      : selectedNodeData.isTest
                      ? "text-[#C4D1BF]"
                      : "text-[#A2B29F]"
                  }`}
                >
                  {selectedNodeData.isChanged
                    ? "Change Origin"
                    : selectedNodeData.isDirect
                    ? "Direct Dependent"
                    : selectedNodeData.isIndirect
                    ? "Indirect Dependent"
                    : selectedNodeData.isTest
                    ? "Target Test Suite"
                    : "Neutral Component"}
                </span>
              </div>
            </div>

            {selectedNodeData.importedSymbols && selectedNodeData.importedSymbols.length > 0 && (
              <div>
                <p className="text-[#A2B29F] font-medium mb-1.5 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[#C6A76B]" />
                  Imported Modules & Symbols
                </p>
                <div className="space-y-1">
                  {selectedNodeData.importedSymbols.map((sym, i) => (
                    <div
                      key={i}
                      className="font-mono text-[11px] bg-[#121911] px-2 py-1 rounded border border-[#334130] text-[#D6DFD2] truncate"
                    >
                      {sym}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNodeData.syntaxError && (
              <div className="p-2.5 rounded bg-[#2D1B1B] border border-[#A63A3A]/40 text-[#FFB3B3]">
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#A63A3A]" />
                  Syntax Issue
                </div>
                <p className="font-mono text-[11px]">{selectedNodeData.syntaxError}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#718477]">
            <FileCode className="w-8 h-8 mb-2 opacity-40 text-[#C6A76B]" />
            <p className="font-medium text-[#F7F5EF] text-xs">Click any node in the graph</p>
            <p className="text-[11px] mt-1 text-[#A2B29F]">
              Examine imported symbols, lines of code, and exact callers in the blast radius.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
