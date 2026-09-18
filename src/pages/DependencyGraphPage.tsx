import React from "react";
import { GraphData } from "../types";
import { DependencyGraphView } from "../components/DependencyGraphView";
import { Network, Info, ArrowRight } from "lucide-react";

interface DependencyGraphPageProps {
  graphData: GraphData;
  changedFile: string | null;
  onNavigateToEvidence: () => void;
}

export const DependencyGraphPage: React.FC<DependencyGraphPageProps> = ({
  graphData,
  changedFile,
  onNavigateToEvidence,
}) => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#718477]/25">
        <div>
          <h1 className="text-2xl font-bold text-[#202522] flex items-center gap-2">
            <Network className="w-6 h-6 text-[#394A3F]" />
            Interactive Dependency Graph
          </h1>
          <p className="text-xs text-[#718477] mt-1">
            Visualizing directed imports:{" "}
            {changedFile ? (
              <span>
                Simulating downstream blast radius for{" "}
                <span className="font-mono text-[#A63A3A] font-semibold">{changedFile}</span>
              </span>
            ) : (
              "Global architecture view of all module imports"
            )}
          </p>
        </div>

        <button
          onClick={onNavigateToEvidence}
          className="px-3.5 py-1.5 rounded-lg bg-[#394A3F] hover:bg-[#2D3A2A] text-[#FFFFFF] border border-[#394A3F] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <span>View Risk Evidence Table</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C6A76B]" />
        </button>
      </div>

      {/* Graph Canvas */}
      <DependencyGraphView graphData={graphData} changedFile={changedFile} />
    </div>
  );
};
