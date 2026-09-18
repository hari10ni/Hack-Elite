import React from "react";
import { RiskEvidenceTable } from "../components/RiskEvidenceTable";
import { RiskEvidenceItem } from "../types";
import { ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

interface RiskEvidencePageProps {
  evidence: RiskEvidenceItem[];
  changedFile: string;
  onNavigateToRelease: () => void;
}

export const RiskEvidencePage: React.FC<RiskEvidencePageProps> = ({
  evidence,
  changedFile,
  onNavigateToRelease,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#718477]/25">
        <div>
          <h1 className="text-2xl font-bold text-[#202522] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#A63A3A]" />
            Explainable Risk Evidence & Audit Log
          </h1>
          <p className="text-xs text-[#718477] mt-1">
            Auditable justification and dependency path traces for each component in the blast radius of{" "}
            <span className="font-mono text-[#202522] font-semibold">{changedFile}</span>.
          </p>
        </div>

        <button
          onClick={onNavigateToRelease}
          className="px-3.5 py-1.5 rounded-lg bg-[#394A3F] hover:bg-[#2D3A2A] text-[#FFFFFF] text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Proceed to Release Plan
        </button>
      </div>

      {/* Table */}
      <RiskEvidenceTable evidence={evidence} changedFile={changedFile} />
    </div>
  );
};
