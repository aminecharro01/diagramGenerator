import React from "react";
import { Handle, Position } from "@xyflow/react";
import { 
  Database, Server, User, Cloud, RefreshCw, Cpu, HelpCircle,
  GitCommit, Activity, Key, CornerRightDown, Monitor, Network
} from "lucide-react";

export default function StandardNode({ data }: { data: any }) {
  const type = data.type || "service";
  const isSelected = data.selected;
  const palette = data.palette || "indigo";

  const iconColor = {
    indigo: "text-indigo-600 dark:text-indigo-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  }[palette as "indigo" | "emerald" | "amber" | "rose"] || "text-indigo-600 dark:text-indigo-400";

  // Render icons corresponding to the specific block type
  const getIcon = () => {
    switch (type) {
      case "database":
        return <Database className={`h-4 w-4 ${iconColor}`} />;
      case "cache":
        return <Cpu className={`h-4 w-4 ${iconColor}`} />;
      case "queue":
        return <RefreshCw className={`h-4 w-4 ${iconColor}`} />;
      case "user":
        return <User className={`h-4 w-4 ${iconColor}`} />;
      case "external":
        return <Cloud className={`h-4 w-4 ${iconColor}`} />;
      case "actor":
        return <User className={`h-4 w-4 ${iconColor}`} />;
      case "decision":
      case "gateway":
        return <GitCommit className={`h-4 w-4 ${iconColor}`} />;
      case "start":
      case "event":
        return <Activity className={`h-4 w-4 ${iconColor}`} />;
      case "end":
        return <CornerRightDown className={`h-4 w-4 ${iconColor}`} />;
      case "frontend":
        return <Monitor className={`h-4 w-4 ${iconColor}`} />;
      case "backend":
        return <Server className={`h-4 w-4 ${iconColor}`} />;
      case "api":
        return <Network className={`h-4 w-4 ${iconColor}`} />;
      case "task":
      case "process":
        return <Activity className={`h-4 w-4 ${iconColor}`} />;
      default:
        return <Server className={`h-4 w-4 ${iconColor}`} />;
    }
  };

  // Node borders and selections matching color palette
  const borderStyle = {
    indigo: isSelected
      ? "border-indigo-500 dark:border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-indigo-500/5"
      : "border-slate-200 dark:border-slate-800/80 hover:border-indigo-400/50 dark:hover:border-indigo-900/30",
    emerald: isSelected
      ? "border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-emerald-500/5"
      : "border-slate-200 dark:border-slate-800/80 hover:border-emerald-400/50 dark:hover:border-emerald-900/30",
    amber: isSelected
      ? "border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-amber-500/5"
      : "border-slate-200 dark:border-slate-800/80 hover:border-amber-400/50 dark:hover:border-amber-900/30",
    rose: isSelected
      ? "border-rose-500 dark:border-rose-500/80 ring-2 ring-rose-500/20 shadow-rose-500/5"
      : "border-slate-200 dark:border-slate-800/80 hover:border-rose-400/50 dark:hover:border-rose-900/30",
  }[palette as "indigo" | "emerald" | "amber" | "rose"] || "border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700/80";

  const iconWrapperClasses = {
    indigo: "bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40",
    emerald: "bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40",
    amber: "bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40",
    rose: "bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40",
  }[palette as "indigo" | "emerald" | "amber" | "rose"] || "bg-slate-100 dark:bg-[#121a2e] border border-slate-200 dark:border-slate-800";

  // Dynamic user-controlled sizing
  const nodeSize = data.nodeSize || "md";
  const textSize = data.textSize || "md";

  const nodeSizeClasses = {
    sm: "min-w-[190px] max-w-[220px] px-3.5 py-2.5 rounded-lg",
    md: "min-w-[220px] max-w-[260px] px-4 py-3 rounded-xl",
    lg: "min-w-[260px] max-w-[310px] px-5 py-4.5 rounded-2xl",
  }[nodeSize as "sm" | "md" | "lg"] || "min-w-[220px] max-w-[260px] px-4 py-3 rounded-xl";

  const labelSizeClasses = {
    sm: "text-[11.5px] leading-tight",
    md: "text-[13px] leading-snug",
    lg: "text-[15.5px] leading-normal font-bold",
  }[textSize as "sm" | "md" | "lg"] || "text-[13px] leading-snug";

  const descSizeClasses = {
    sm: "text-[9.5px] mt-0.5 leading-normal",
    md: "text-[10.5px] mt-1 leading-relaxed",
    lg: "text-[12.5px] mt-1.5 leading-relaxed",
  }[textSize as "sm" | "md" | "lg"] || "text-[10.5px] mt-1 leading-relaxed";

  const iconPaddingClasses = {
    sm: "p-1.5 rounded-md",
    md: "p-2 rounded-lg",
    lg: "p-2.5 rounded-xl",
  }[nodeSize as "sm" | "md" | "lg"] || "p-2 rounded-lg";

  return (
    <div className={`bg-white/95 dark:bg-[#0d1324]/90 backdrop-blur-md border shadow-lg dark:shadow-xl transition-all duration-200 relative ${nodeSizeClasses} ${borderStyle}`}>
      {/* Target points */}
      <Handle type="target" position={Position.Left} id="left-in" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} id="top-in" style={{ opacity: 0 }} />
      
      <div className="flex items-start gap-3">
        <div className={`shrink-0 flex items-center justify-center ${iconPaddingClasses} ${iconWrapperClasses}`}>
          {getIcon()}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className={`font-semibold text-slate-800 dark:text-slate-100 break-words ${labelSizeClasses}`}>{data.label}</div>
          {data.description && (
            <div className={`text-slate-500 dark:text-slate-400 break-words ${descSizeClasses}`}>{data.description}</div>
          )}
        </div>
      </div>
      
      {/* Source points */}
      <Handle type="source" position={Position.Right} id="right-out" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-out" style={{ opacity: 0 }} />
    </div>
  );
}
