import React from "react";
import { Handle, Position } from "@xyflow/react";
import { CircleDot } from "lucide-react";

export default function UseCaseNode({ data }: { data: any }) {
  const isSelected = data.selected;
  const label = data.label || "Use Case";
  const badge = data.metadata?.badge;

  const borderStyle = isSelected 
    ? "border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/20 shadow-xl shadow-indigo-500/10" 
    : "border-slate-250 dark:border-slate-800/90 hover:border-indigo-400/60 dark:hover:border-indigo-500/50";

  return (
    <div className={`group flex flex-col items-center justify-center px-6 py-3.5 rounded-[2.5rem] bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border transition-all duration-200 min-w-[190px] max-w-[270px] text-center shadow-md ${borderStyle}`}>
      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top-in" 
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-in" 
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
      />

      <div className="flex items-center gap-1.5 min-w-0">
        <CircleDot className="h-3 w-3 text-indigo-500 shrink-0 opacity-70" />
        <span className="font-semibold text-[12.5px] text-slate-850 dark:text-slate-100 leading-snug">
          {label}
        </span>
      </div>

      {badge && (
        <span className="text-[8.5px] font-mono font-medium px-2 py-0.5 mt-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 truncate max-w-full">
          {badge}
        </span>
      )}

      {/* Out Handles */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-out" 
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom-out" 
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
      />
    </div>
  );
}
