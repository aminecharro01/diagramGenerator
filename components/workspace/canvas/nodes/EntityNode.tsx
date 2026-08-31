import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Database, Key } from "lucide-react";

interface Attribute {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

export default function EntityNode({ data }: { data: any }) {
  const attributes: Attribute[] = data.metadata?.attributes || [];
  const isSelected = data.selected;
  const palette = data.palette || "indigo";

  // Node borders and selections matching color palette
  const borderStyle = {
    indigo: isSelected
      ? "border-indigo-500 dark:border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-indigo-500/5"
      : "border-slate-200 dark:border-slate-800/80 hover:border-indigo-350 dark:hover:border-indigo-700/80",
    emerald: isSelected
      ? "border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-emerald-500/5"
      : "border-slate-200 dark:border-slate-800/80 hover:border-emerald-350 dark:hover:border-emerald-700/80",
    amber: isSelected
      ? "border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-amber-500/5"
      : "border-slate-200 dark:border-slate-800/80 hover:border-amber-350 dark:hover:border-amber-700/80",
    rose: isSelected
      ? "border-rose-500 dark:border-rose-500/80 ring-2 ring-rose-500/20 shadow-rose-500/5"
      : "border-slate-200 dark:border-slate-800/80 hover:border-rose-350 dark:hover:border-rose-700/80",
  }[palette as "indigo" | "emerald" | "amber" | "rose"] || "border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700/80";

  const dbIconColor = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  }[palette as "indigo" | "emerald" | "amber" | "rose"] || "text-indigo-400";

  const headerBorder = {
    indigo: "border-indigo-500/10 dark:border-indigo-500/20",
    emerald: "border-emerald-500/10 dark:border-emerald-500/20",
    amber: "border-amber-500/10 dark:border-amber-500/20",
    rose: "border-rose-500/10 dark:border-rose-500/20",
  }[palette as "indigo" | "emerald" | "amber" | "rose"] || "border-slate-200 dark:border-slate-850";

  // Dynamic user-controlled sizing
  const nodeSize = data.nodeSize || "md";
  const textSize = data.textSize || "md";

  const nodeSizeClasses = {
    sm: "min-w-[210px] max-w-[260px] rounded-lg",
    md: "min-w-[250px] max-w-[320px] rounded-xl",
    lg: "min-w-[300px] max-w-[385px] rounded-2xl",
  }[nodeSize as "sm" | "md" | "lg"] || "min-w-[250px] max-w-[320px] rounded-xl";

  const headerPadding = {
    sm: "px-3 py-2 gap-1.5",
    md: "px-4 py-2.5 gap-2",
    lg: "px-5 py-3.5 gap-2.5",
  }[nodeSize as "sm" | "md" | "lg"] || "px-4 py-2.5 gap-2";

  const headerTextSize = {
    sm: "text-[11px]",
    md: "text-xs",
    lg: "text-[14.5px] font-extrabold",
  }[textSize as "sm" | "md" | "lg"] || "text-xs";

  const colTextSize = {
    sm: "text-[9.5px] px-3.5 py-1.5",
    md: "text-[11px] px-4 py-2",
    lg: "text-[13.5px] px-5 py-3",
  }[textSize as "sm" | "md" | "lg"] || "text-[11px] px-4 py-2";

  const keyIconSize = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }[textSize as "sm" | "md" | "lg"] || "h-3 w-3";

  return (
    <div className={`bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-lg dark:shadow-2xl overflow-hidden transition-all duration-200 ${nodeSizeClasses} ${borderStyle}`}>
      {/* Target points */}
      <Handle type="target" position={Position.Left} id="left-in" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} id="top-in" style={{ opacity: 0 }} />

      {/* Table Header */}
      <div className={`bg-slate-50 dark:bg-slate-950 border-b flex items-center shrink-0 ${headerPadding} ${headerBorder}`}>
        <Database className={`h-4.5 w-4.5 shrink-0 ${dbIconColor}`} />
        <span className={`font-bold text-slate-800 dark:text-white font-mono tracking-wide break-all ${headerTextSize}`}>{data.label}</span>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-slate-200/40 dark:divide-slate-850/40 bg-slate-50/10 dark:bg-slate-900/10">
        {attributes.length === 0 ? (
          <div className="p-3.5 text-[10.5px] text-slate-500 text-center italic select-none">
            No columns defined
          </div>
        ) : (
          attributes.map((attr, idx) => (
            <div key={idx} className={`flex items-center justify-between gap-4 ${colTextSize}`}>
              <div className="flex items-center gap-2 min-w-0">
                {attr.isPk && (
                  <span title="Primary Key" className="shrink-0"><Key className={`text-amber-500 dark:text-amber-400 ${keyIconSize}`} /></span>
                )}
                {attr.isFk && (
                  <span title="Foreign Key" className="shrink-0"><Key className={`text-sky-500 dark:text-sky-400 ${keyIconSize}`} /></span>
                )}
                <span className={`font-mono truncate ${attr.isPk ? "text-amber-600 dark:text-amber-455 font-semibold" : "text-slate-700 dark:text-slate-200"}`}>
                  {attr.name}
                </span>
              </div>
              <span className="font-mono text-slate-450 dark:text-slate-500 shrink-0 select-none">{attr.type}</span>
            </div>
          ))
        )}
      </div>

      {/* Source points */}
      <Handle type="source" position={Position.Right} id="right-out" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-out" style={{ opacity: 0 }} />
    </div>
  );
}
