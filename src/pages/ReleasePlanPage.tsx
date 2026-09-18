import React from "react";
import { ReleasePlan } from "../types";
import { ReleasePlanChecklist } from "../components/ReleasePlanChecklist";
import { CheckCircle2, FileText } from "lucide-react";

interface ReleasePlanPageProps {
  plan: ReleasePlan;
  changedFile: string;
  onNavigateToHistory: () => void;
}

export const ReleasePlanPage: React.FC<ReleasePlanPageProps> = ({
  plan,
  changedFile,
  onNavigateToHistory,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#334130]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3EF] flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#C6A76B]" />
            Safe Release Plan & Verification Checklist
          </h1>
          <p className="text-xs text-[#8A9A86] mt-1">
            Human-in-the-loop release gates, test execution instructions, and AI rollback contingencies for{" "}
            <span className="font-mono text-[#F5F3EF] font-semibold">{changedFile}</span>.
          </p>
        </div>

        <button
          onClick={onNavigateToHistory}
          className="px-3.5 py-1.5 rounded-lg bg-[#243323] hover:bg-[#2E402D] text-[#F5F3EF] border border-[#3A4E38] text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-[#A2B29F]" />
          <span>Export & History</span>
        </button>
      </div>

      {/* Checklist Component */}
      <ReleasePlanChecklist plan={plan} changedFile={changedFile} />
    </div>
  );
};
