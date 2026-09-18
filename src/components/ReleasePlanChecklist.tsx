import React, { useState } from "react";
import { ReleasePlan } from "../types";
import { api } from "../services/api";
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  UserCheck,
  ShieldCheck,
  Terminal,
  FileCheck,
  Sparkles,
  Lightbulb,
  Cpu,
  Layers,
  Copy,
  Check,
  Activity,
} from "lucide-react";

interface ReleasePlanChecklistProps {
  plan: ReleasePlan;
  changedFile: string;
}

export const ReleasePlanChecklist: React.FC<ReleasePlanChecklistProps> = ({
  plan,
  changedFile,
}) => {
  const [checklist, setChecklist] = useState(
    plan.humanApprovalChecklist.map((c) => ({ ...c }))
  );

  // Dynamic Gemini AI Release Ideas State
  const [isGeneratingAiIdeas, setIsGeneratingAiIdeas] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [aiReleaseData, setAiReleaseData] = useState<{
    release_strategy: string;
    strategic_recommendation: string;
    ai_innovative_ideas: Array<{ title: string; description: string; benefit: string }>;
    rollout_phases: Array<{
      phase: string;
      traffic_percent: number;
      duration: string;
      action: string;
      success_criteria: string;
    }>;
    targeted_test_commands: Array<{
      command: string;
      purpose: string;
      target_module: string;
    }>;
    circuit_breakers_and_safeguards: Array<{
      name: string;
      threshold: string;
      automated_action: string;
    }>;
    emergency_rollback_procedure: string[];
  } | null>(null);

  const toggleChecklist = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, checked: !item.checked } : item))
    );
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const allApproved = checklist.every((c) => c.checked);

  // Call Gemini API to generate real-time AI release ideas
  const handleGenerateAiIdeas = async () => {
    setIsGeneratingAiIdeas(true);
    try {
      const res = await api.generateReleasePlanIdeas({
        changedFile,
        changeDescription: `Release planning for ${changedFile}`,
        riskLevel: "HIGH",
        riskScore: 88,
        directlyAffectedFiles: ["login.py", "student.py", "payment.py"],
        indirectlyAffectedFiles: ["dashboard.py"],
        potentiallyAffectedSymbols: ["execute_query"],
        relatedTests: ["tests/test_database.py", "tests/test_student.py"],
      });
      if (res.status === "success") {
        setAiReleaseData(res);
      }
    } catch (err: any) {
      console.error("Gemini release ideas error:", err);
    } finally {
      setIsGeneratingAiIdeas(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
          allApproved
            ? "bg-[#1E2B1E] border-[#394A3F] text-[#D3E0CE]"
            : "bg-[#182218] border-[#334130] text-[#D6DFD2]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg border ${
              allApproved
                ? "bg-[#394A3F]/30 border-[#394A3F] text-[#C6A76B]"
                : "bg-[#C6A76B]/15 border-[#C6A76B]/30 text-[#C6A76B]"
            }`}
          >
            {allApproved ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#F5F3EF]">
              {allApproved
                ? "Safe Release Gate: APPROVED FOR PRODUCTION MERGE"
                : "Pre-Release Verification & Human Sign-off Pending"}
            </h3>
            <p className="text-xs text-[#8A9A86] mt-0.5">
              {checklist.filter((c) => c.checked).length} of {checklist.length} gates signed off for target file <span className="font-mono text-[#F5F3EF]">{changedFile}</span>.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateAiIdeas}
          disabled={isGeneratingAiIdeas}
          className="px-3.5 py-2 rounded-lg bg-[#273725] hover:bg-[#344832] border border-[#445B41] text-[#F5F3EF] text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-[#C6A76B]" />
          {isGeneratingAiIdeas ? "Generating with Gemini..." : "Generate AI Release Ideas (Gemini API)"}
        </button>
      </div>

      {/* AI Release Plan Ideas Module (Powered by Gemini API) */}
      <div className="rounded-xl border border-[#3A4A37] bg-[#1A2419] p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#334130] pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#C6A76B]" />
            <h4 className="font-bold text-xs text-[#F5F3EF] uppercase tracking-wider">
              Gemini AI Strategic Release Plan & Rollout Ideas
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#253323] text-[#A2B29F] border border-[#3A4A37]">
            gemini-3.8-flash
          </span>
        </div>

        {/* Strategy & Recommendation */}
        <div className="p-3.5 rounded-lg bg-[#141C13] border border-[#2F3D2E] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#C6A76B] font-mono">
              STRATEGY: {aiReleaseData?.release_strategy || "Canary Rollout with Shadow Traffic & Dynamic Circuit Breakers"}
            </span>
          </div>
          <p className="text-xs text-[#D6DFD2] leading-relaxed">
            {aiReleaseData?.strategic_recommendation ||
              `When introducing core interface modifications or safety enhancements to ${changedFile}, downstream modules (login.py, student.py, payment.py) require signature preservation. Utilize backward-compatible default parameters, mirror 15% traffic for telemetry verification, and enforce automated error-budget circuit breakers.`}
          </p>
        </div>

        {/* AI Innovative Ideas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(aiReleaseData?.ai_innovative_ideas || [
            {
              title: "Backward-Compatibility Signature Shim",
              description: "Maintain a legacy adapter for 2 release cycles to allow downstream callers to migrate without runtime disruption.",
              benefit: "Zero downtime for legacy callers"
            },
            {
              title: "Dark Launch & Shadow Traffic Replay",
              description: "Mirror 15% of real read queries to the new proposed code path without writing to database to measure latency deltas.",
              benefit: "Validates real performance"
            },
            {
              title: "Feature Flag with Granular Tenant Kill-Switch",
              description: "Wrap the changed module in a runtime feature toggle with immediate 1-second remote kill switch.",
              benefit: "Instant blast radius isolation"
            }
          ]).map((idea, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#141C13] border border-[#2D3B2C] flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-[#F5F3EF] mb-1">{idea.title}</div>
                <p className="text-[11px] text-[#8A9A86] leading-relaxed">{idea.description}</p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-[#253224] flex items-center gap-1.5 text-[10px] text-[#C6A76B] font-medium">
                <CheckCircle2 className="w-3 h-3 text-[#C6A76B]" />
                <span>{idea.benefit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Phased Rollout Schedule */}
        <div className="space-y-2 pt-1">
          <h5 className="text-[11px] font-semibold text-[#C4D1BF] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#A2B29F]" />
            Phased Rollout Schedule & Gate Milestones
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(aiReleaseData?.rollout_phases || [
              {
                phase: "Phase 1: Pre-Flight & Internal Smoke",
                traffic_percent: 0,
                duration: "15 mins",
                action: "Run full pytest suite and execute synthetic transactions in staging environment",
                success_criteria: "Zero regressions, 100% assertions green"
              },
              {
                phase: "Phase 2: Canary Deployment (10%)",
                traffic_percent: 10,
                duration: "1 hour",
                action: "Route 10% of real queries to the modified container instance with latency monitoring",
                success_criteria: "Error rate < 0.01%, P99 latency within 10% baseline"
              },
              {
                phase: "Phase 3: Broad Production (100%)",
                traffic_percent: 100,
                duration: "Full Release",
                action: "Shift remaining fleet traffic to verified version and archive old container image",
                success_criteria: "Full health check pass across all nodes"
              }
            ]).map((phase, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#141C13] border border-[#2D3B2C] text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F5F3EF] text-[11px]">{phase.phase}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#233122] text-[#C6A76B] font-bold border border-[#3A4E38]">
                    {phase.traffic_percent}% Traffic
                  </span>
                </div>
                <div className="text-[10px] text-[#C6A76B] font-mono">Duration: {phase.duration}</div>
                <p className="text-[11px] text-[#C4D1BF] leading-tight">{phase.action}</p>
                <div className="text-[10px] text-[#C6A76B]/90 pt-1 border-t border-[#253224]">
                  Gate: {phase.success_criteria}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Required File Reviews */}
        <div className="rounded-xl border border-[#334130] bg-[#182218] p-4">
          <h4 className="font-semibold text-xs text-[#C4D1BF] uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#A2B29F]" />
            Mandatory File Reviews ({plan.filesToReview.length})
          </h4>
          <div className="space-y-2">
            {plan.filesToReview.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#121911] border border-[#2E3C2B] text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-[#F5F3EF]">{item.file}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#243323] text-[#A2B29F] border border-[#3A4A37]">
                    {item.role}
                  </span>
                </div>
                <p className="text-[#8A9A86] text-[11px]">{item.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Recommended Test Execution */}
        <div className="rounded-xl border border-[#334130] bg-[#182218] p-4">
          <h4 className="font-semibold text-xs text-[#C4D1BF] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-[#C6A76B]" />
            Recommended Pre-Release Tests ({plan.preReleaseTests.length})
          </h4>
          <div className="space-y-2.5">
            {plan.preReleaseTests.map((t, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#121911] border border-[#2E3C2B] text-xs flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-[#F5F3EF]">{t.testFile}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      t.priority === "CRITICAL"
                        ? "bg-[#A63A3A]/20 text-[#E59898] border-[#A63A3A]/40"
                        : "bg-[#C6A76B]/20 text-[#C6A76B] border-[#C6A76B]/40"
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <p className="text-[#8A9A86] text-[11px]">{t.relevanceReason}</p>
                {t.suggestedCommands.length > 0 && (
                  <div className="bg-[#172016] px-2.5 py-1.5 rounded font-mono text-[11px] text-[#C6A76B] border border-[#2B3A29] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <Terminal className="w-3 h-3 text-[#5C6D57] shrink-0" />
                      <span className="truncate">{t.suggestedCommands[0]}</span>
                    </div>
                    <button
                      onClick={() => copyCommand(t.suggestedCommands[0])}
                      className="text-[#8A9A86] hover:text-[#F5F3EF] shrink-0"
                      title="Copy test command"
                    >
                      {copiedCmd === t.suggestedCommands[0] ? (
                        <Check className="w-3.5 h-3.5 text-[#C6A76B]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Circuit Breakers & Automated Safeguards */}
        <div className="rounded-xl border border-[#334130] bg-[#182218] p-4">
          <h4 className="font-semibold text-xs text-[#C4D1BF] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#C6A76B]" />
            Circuit Breakers & Automated Safeguards
          </h4>
          <div className="space-y-2">
            {(aiReleaseData?.circuit_breakers_and_safeguards || [
              {
                name: "P99 Latency Circuit Breaker",
                threshold: "Latency > 120ms for > 3 consecutive minutes",
                automated_action: "Instantly shed canary traffic back to baseline release"
              },
              {
                name: "Exception Spike Guard",
                threshold: "TypeError or DatabaseError count > 0",
                automated_action: "Trigger automated git revert and alert on-call engineer"
              }
            ]).map((guard, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-[#121911] border border-[#2E3C2B] text-xs text-[#D6DFD2] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between font-semibold text-[#C6A76B] text-[11px]">
                  <span>{guard.name}</span>
                  <span className="font-mono text-[10px] text-[#E59898]">THRESHOLD: {guard.threshold}</span>
                </div>
                <p className="text-[11px] text-[#8A9A86]">Action: {guard.automated_action}</p>
              </div>
            ))}
            {plan.backwardCompatibilityConcerns.map((concern, idx) => (
              <div
                key={`concern-${idx}`}
                className="p-2 rounded bg-[#C6A76B]/15 border border-[#C6A76B]/30 text-xs text-[#C6A76B] flex items-start gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#C6A76B] shrink-0 mt-0.5" />
                <span>{concern}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Emergency Rollback Procedure */}
        <div className="rounded-xl border border-[#334130] bg-[#182218] p-4">
          <h4 className="font-semibold text-xs text-[#C4D1BF] uppercase tracking-wider mb-3 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#A63A3A]" />
            Emergency Rollback Procedure & Triggers
          </h4>
          <div className="space-y-2">
            {(aiReleaseData?.emergency_rollback_procedure || [
              "Step 1: Execute feature flag kill-switch to immediately bypass the modified module",
              "Step 2: Revert deployment artifact to previous verified container hash",
              "Step 3: Flush local query caches and inspect SQLite connection pool state",
              "Step 4: Notify downstream team leads and confirm zero corrupted ledger records"
            ]).map((step, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-[#121911] border border-[#2E3C2B] text-xs text-[#D6DFD2] flex items-start gap-2"
              >
                <span className="text-[#A63A3A] font-mono text-xs shrink-0">{idx + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5: Human Sign-Off Interactive Gate */}
      <div className="rounded-xl border border-[#334130] bg-[#182218] p-4">
        <h4 className="font-semibold text-xs text-[#C4D1BF] uppercase tracking-wider mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#A2B29F]" />
          Interactive Release Gate Sign-Off (Requires Human Verification)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {checklist.map((item, idx) => (
            <label
              key={idx}
              className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 select-none ${
                item.checked
                  ? "bg-[#1E2B1E] border-[#394A3F] text-[#D3E0CE]"
                  : "bg-[#121911] border-[#2E3C2B] text-[#D6DFD2] hover:border-[#445540]"
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleChecklist(idx)}
                className="mt-0.5 rounded border-[#3A4A37] text-[#394A3F] focus:ring-[#394A3F]/20 bg-[#172016]"
              />
              <span className="text-xs font-medium leading-relaxed">{item.item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
