import React, { useState, useMemo } from "react";
import { RiskEvidenceItem } from "../types";
import { Search, ShieldAlert, CheckCircle2, HelpCircle, ArrowRight, Filter } from "lucide-react";

interface RiskEvidenceTableProps {
  evidence: RiskEvidenceItem[];
  changedFile: string;
}

export const RiskEvidenceTable: React.FC<RiskEvidenceTableProps> = ({ evidence, changedFile }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  const filteredEvidence = useMemo(() => {
    return evidence.filter((item) => {
      const matchesSearch =
        item.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.potentialConsequence.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority =
        priorityFilter === "ALL" || item.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [evidence, searchTerm, priorityFilter]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-[#A63A3A]/10 text-[#A63A3A] border-[#A63A3A]/30";
      case "MEDIUM":
        return "bg-[#C6A76B]/20 text-[#845F1E] border-[#C6A76B]/40";
      case "LOW":
        return "bg-[#718477]/15 text-[#394A3F] border-[#718477]/30";
      default:
        return "bg-[#F7F5EF] text-[#718477] border-[#718477]/30";
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFFFF] p-3 rounded-xl border border-[#718477]/25 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#718477] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search affected components, reasons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7F5EF] border border-[#718477]/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#202522] placeholder-[#718477] focus:outline-none focus:border-[#394A3F] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#718477]" />
          <span className="text-xs text-[#718477] font-medium">Priority:</span>
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                priorityFilter === p
                  ? "bg-[#394A3F] text-[#FFFFFF] font-semibold border border-[#394A3F]"
                  : "text-[#718477] hover:text-[#202522] hover:bg-[#F7F5EF]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-[#718477]/25 bg-[#FFFFFF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5EF] text-[#718477] uppercase tracking-wider text-[10px] font-mono border-b border-[#718477]/25">
              <tr>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Dependency Chain</th>
                <th className="py-3 px-4">Flagged Reason & Impact</th>
                <th className="py-3 px-4">Suggested Verification</th>
                <th className="py-3 px-4 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#718477]/15 font-sans">
              {filteredEvidence.length > 0 ? (
                filteredEvidence.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F5EF]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#202522] whitespace-nowrap">
                      {item.component}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${getPriorityBadge(
                          item.priority
                        )}`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-[#202522] flex-wrap">
                        {item.dependencyPath.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                step === changedFile
                                  ? "bg-[#A63A3A]/10 text-[#A63A3A] border border-[#A63A3A]/30 font-semibold"
                                  : "bg-[#F7F5EF] text-[#718477] border border-[#718477]/25"
                              }`}
                            >
                              {step}
                            </span>
                            {sIdx < item.dependencyPath.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-[#718477]" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-[#202522] font-semibold">{item.reason}</p>
                      <p className="text-[#718477] text-[11px] mt-1 leading-relaxed">
                        {item.potentialConsequence}
                      </p>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-[#718477] text-[11px]">
                      {item.suggestedVerification}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-[#394A3F] font-mono text-xs font-semibold bg-[#394A3F]/10 border border-[#394A3F]/20 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {Math.round(item.confidence * 100)}% AST
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#718477] text-xs">
                    No risk evidence matches the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
