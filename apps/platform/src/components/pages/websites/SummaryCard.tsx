import React from "react";
import { type LucideIcon } from "lucide-react";

interface SummaryCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: string | number;
  status: string;
  statusColor: string;
  statusIcon: LucideIcon;
  trendIcon?: LucideIcon;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon: Icon,
  iconColor,
  title,
  value,
  status,
  statusColor,
  statusIcon: StatusIcon,
  trendIcon: TrendIcon,
}) => {
  return (
    <div className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 p-6 floating-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {TrendIcon && <TrendIcon className="w-5 h-5 text-green-500 opacity-60" />}
      </div>
      <div className="text-sm text-slate-500 mb-2">{title}</div>
      <div className="text-3xl font-bold font-heading text-slate-800 mb-1">
        {value}
      </div>
      <div className={`text-xs ${statusColor} flex items-center gap-1`}>
        <StatusIcon className="w-3 h-3" />
        {status}
      </div>
    </div>
  );
};

export default SummaryCard;