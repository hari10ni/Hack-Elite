import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  id?: string;
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: "default" | "danger" | "warning" | "success" | "olive" | "sand" | "indigo";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  label,
  value,
  subtext,
  icon: Icon,
  variant = "default",
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case "danger":
        return "bg-[#A63A3A]/10 text-[#A63A3A] border-[#A63A3A]/30";
      case "warning":
      case "sand":
        return "bg-[#C6A76B]/20 text-[#845F1E] border-[#C6A76B]/40";
      case "success":
      case "olive":
      case "indigo":
        return "bg-[#394A3F]/15 text-[#394A3F] border-[#394A3F]/30";
      default:
        return "bg-[#718477]/15 text-[#394A3F] border-[#718477]/30";
    }
  };

  return (
    <div
      id={id}
      className="p-4 rounded-xl bg-[#FFFFFF] border border-[#718477]/25 shadow-[0_1px_4px_rgba(32,37,34,0.05)] flex items-start justify-between transition-all hover:shadow-[0_4px_12px_rgba(32,37,34,0.08)]"
    >
      <div>
        <p className="text-[11px] font-semibold text-[#718477] uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-2xl font-bold text-[#202522] tracking-tight">{value}</p>
        {subtext && <p className="mt-1 text-xs text-[#718477] font-medium">{subtext}</p>}
      </div>
      <div className={`p-2.5 rounded-lg border ${getBadgeColors()}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

