import React, { useState } from "react";
import { Plus, Minus, FileCode, CheckCircle2, AlertOctagon, ShieldCheck, Copy, Check } from "lucide-react";

interface DiffViewerProps {
  fileName: string;
  oldCode: string;
  newCode: string;
  description?: string;
  onCodeChange?: (newCode: string) => void;
  isEditable?: boolean;
  baselineError?: {
    title: string;
    description: string;
    errorType?: string;
    line?: number;
    failingCallers?: string[];
  };
  proposedFix?: {
    title: string;
    description: string;
    safeguards?: string[];
    isCorrectProgram?: boolean;
  };
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  fileName,
  oldCode,
  newCode,
  description,
  onCodeChange,
  isEditable = false,
  baselineError,
  proposedFix,
}) => {
  const [viewMode, setViewMode] = useState<"side" | "unified">("side");
  const [copiedColumn, setCopiedColumn] = useState<"baseline" | "proposed" | null>(null);

  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");

  const copyToClipboard = (text: string, col: "baseline" | "proposed") => {
    navigator.clipboard.writeText(text);
    setCopiedColumn(col);
    setTimeout(() => setCopiedColumn(null), 2000);
  };

  return (
    <div className="rounded-xl border border-[#334130] bg-[#162015] overflow-hidden shadow-lg">
      {/* Top Header Controls */}
      <div className="px-4 py-3 bg-[#1D271C] border-b border-[#334130] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#A2B29F]" />
          <span className="font-mono text-xs sm:text-sm font-semibold text-[#F5F3EF]">{fileName}</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#273525] text-[#C4D1BF] font-mono border border-[#3A4A37]">
            {oldLines.length} baseline / {newLines.length} proposed lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#121911] border border-[#334130] rounded-md p-0.5 flex text-xs">
            <button
              onClick={() => setViewMode("side")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewMode === "side"
                  ? "bg-[#2D3A2A] text-[#F5F3EF] font-medium shadow-sm border border-[#445540]"
                  : "text-[#8A9A86] hover:text-[#F5F3EF]"
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode("unified")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewMode === "unified"
                  ? "bg-[#2D3A2A] text-[#F5F3EF] font-medium shadow-sm border border-[#445540]"
                  : "text-[#8A9A86] hover:text-[#F5F3EF]"
              }`}
            >
              Unified
            </button>
          </div>
        </div>
      </div>

      {/* Code Diffs: Side-by-Side (Columns) */}
      {viewMode === "side" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#334130] font-mono text-xs">
          {/* COLUMN 1: Original Baseline Code (Contains Program Error) */}
          <div className="bg-[#131B12] flex flex-col">
            {/* Column 1 Title Header */}
            <div className="p-3 bg-[#1C251B] border-b border-[#334130] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A63A3A] animate-pulse" />
                <span className="text-xs font-bold text-[#E59898] uppercase tracking-wider flex items-center gap-1.5">
                  <Minus className="w-3.5 h-3.5 text-[#A63A3A]" />
                  Original Baseline Code (Contains Program Error)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A63A3A]/20 text-[#E59898] border border-[#A63A3A]/40 font-semibold">
                  DEFECT PRESENT
                </span>
                <button
                  onClick={() => copyToClipboard(oldCode, "baseline")}
                  className="p-1 text-[#8A9A86] hover:text-[#F5F3EF] transition-colors"
                  title="Copy baseline code"
                >
                  {copiedColumn === "baseline" ? <Check className="w-3.5 h-3.5 text-[#C6A76B]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Baseline Error Diagnostic Banner */}
            {baselineError && (
              <div className="p-3 bg-[#A63A3A]/15 border-b border-[#A63A3A]/30 text-xs">
                <div className="flex items-start gap-2 text-[#E59898] font-semibold mb-1">
                  <AlertOctagon className="w-4 h-4 text-[#A63A3A] shrink-0 mt-0.5" />
                  <span>{baselineError.title}</span>
                </div>
                <p className="text-[11px] text-[#E0B8B8] leading-relaxed pl-6">
                  {baselineError.description}
                </p>
                {baselineError.failingCallers && baselineError.failingCallers.length > 0 && (
                  <div className="mt-2 pl-6 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-[#E59898] font-sans font-medium">Downstream Callers Crashing:</span>
                    {baselineError.failingCallers.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-[#A63A3A]/30 text-[#E59898] border border-[#A63A3A]/40 font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Code Content */}
            <div className="p-3 max-h-[440px] overflow-y-auto">
              <pre className="text-[#D6DFD2] whitespace-pre-wrap leading-relaxed">
                {oldLines.map((line, idx) => {
                  const isDifferent = !newLines.includes(line);
                  const isErrorLine = baselineError?.line === idx + 1;
                  return (
                    <div
                      key={idx}
                      className={`flex ${
                        isErrorLine
                          ? "bg-[#A63A3A]/40 text-[#FFC4C4] -mx-3 px-3 border-l-2 border-[#A63A3A] font-semibold"
                          : isDifferent
                          ? "bg-[#A63A3A]/20 text-[#E59898] -mx-3 px-3"
                          : ""
                      }`}
                    >
                      <span className="w-9 select-none text-[#5C6D57] shrink-0 text-right pr-2">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{line || " "}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>

          {/* COLUMN 2: Modified Proposed Solution (Correct Program) */}
          <div className="bg-[#131B12] flex flex-col">
            {/* Column 2 Title Header */}
            <div className="p-3 bg-[#1C251B] border-b border-[#334130] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6A76B]" />
                <span className="text-xs font-bold text-[#E6EFE4] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#C6A76B]" />
                  Modified Proposed Solution (Correct Program)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#394A3F]/50 text-[#C6A76B] border border-[#394A3F] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#C6A76B]" />
                  CORRECT PROGRAM
                </span>
                <button
                  onClick={() => copyToClipboard(newCode, "proposed")}
                  className="p-1 text-[#8A9A86] hover:text-[#F5F3EF] transition-colors"
                  title="Copy correct program"
                >
                  {copiedColumn === "proposed" ? <Check className="w-3.5 h-3.5 text-[#C6A76B]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Proposed Solution Resolution Banner */}
            {proposedFix && (
              <div className="p-3 bg-[#394A3F]/25 border-b border-[#394A3F]/40 text-xs">
                <div className="flex items-start gap-2 text-[#E6EFE4] font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#C6A76B] shrink-0 mt-0.5" />
                  <span>{proposedFix.title}</span>
                </div>
                <p className="text-[11px] text-[#C4D1BF] leading-relaxed pl-6">
                  {proposedFix.description}
                </p>
                {proposedFix.safeguards && proposedFix.safeguards.length > 0 && (
                  <div className="mt-2 pl-6 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {proposedFix.safeguards.map((sg, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-[#394A3F]/40 text-[#E6EFE4] border border-[#718477]/40 font-mono">
                        ✓ {sg}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Code Content / Interactive Editor */}
            <div className="p-3 max-h-[440px] overflow-y-auto">
              {isEditable ? (
                <textarea
                  value={newCode}
                  onChange={(e) => onCodeChange && onCodeChange(e.target.value)}
                  className="w-full h-[380px] bg-[#0E150D] text-[#F5F3EF] p-2.5 font-mono text-xs border border-[#334130] rounded focus:border-[#5C6D57] focus:outline-none leading-relaxed resize-none"
                  spellCheck={false}
                  placeholder="Enter or view modified proposed solution..."
                />
              ) : (
                <pre className="text-[#D6DFD2] whitespace-pre-wrap leading-relaxed">
                  {newLines.map((line, idx) => {
                    const isDifferent = !oldLines.includes(line);
                    return (
                      <div
                        key={idx}
                        className={`flex ${
                          isDifferent ? "bg-[#394A3F]/35 text-[#E6EFE4] -mx-3 px-3 border-l border-[#C6A76B]/60" : ""
                        }`}
                      >
                        <span className="w-9 select-none text-[#5C6D57] shrink-0 text-right pr-2">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{line || " "}</span>
                      </div>
                    );
                  })}
                </pre>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Unified View */
        <div className="bg-[#131B12] p-4 font-mono text-xs max-h-[460px] overflow-y-auto leading-relaxed">
          {newLines.map((line, idx) => {
            const isAdded = !oldLines.includes(line);
            return (
              <div
                key={idx}
                className={`flex py-0.5 ${
                  isAdded
                    ? "bg-[#394A3F]/40 text-[#E6EFE4] -mx-4 px-4 border-l-2 border-[#C6A76B]"
                    : "text-[#D6DFD2]"
                }`}
              >
                <span className="w-10 select-none text-[#5C6D57] shrink-0 text-right pr-3">
                  {idx + 1}
                </span>
                <span className="flex-1">{line || " "}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
