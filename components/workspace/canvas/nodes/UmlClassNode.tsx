import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Code, Key, Hash, FileCode, CheckCircle2, ChevronRight } from "lucide-react";

interface Attribute {
  name: string;
  type?: string;
  visibility?: string; // "+", "-", "#", "~"
  isPk?: boolean;
}

function getVisibilitySymbol(vis: string = "+") {
  switch (vis) {
    case "+":
      return <span className="font-mono font-bold text-emerald-500" title="public">+</ span>;
    case "-":
      return <span className="font-mono font-bold text-rose-500" title="private">-</ span>;
    case "#":
      return <span className="font-mono font-bold text-amber-500" title="protected">#</ span>;
    case "~":
      return <span className="font-mono font-bold text-sky-500" title="package">~</ span>;
    default:
      return <span className="font-mono font-bold text-slate-400">+</ span>;
  }
}

export default function UmlClassNode({ data }: { data: any }) {
  const isSelected = data.selected;
  const isAbstract = data.metadata?.isAbstract;
  const attributes: Attribute[] = data.metadata?.attributes || [];
  const methods: string[] = data.metadata?.methods || [];
  const settings = data.settings || {};

  // Theme styling
  const visualStyle = settings.visualStyle || "Modern";
  let styleClasses = "bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border shadow-lg dark:shadow-2xl overflow-hidden rounded-xl";
  if (visualStyle === "Academic" || visualStyle === "Technical") {
    styleClasses = "border-2 border-slate-800 dark:border-slate-200 rounded-none shadow-none font-mono bg-white dark:bg-slate-900";
  } else if (visualStyle === "Corporate") {
    styleClasses = "border border-slate-300 dark:border-slate-700 rounded-md shadow-sm bg-white dark:bg-slate-900";
  }

  // Palette
  const borderStyle = isSelected 
    ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/25 shadow-indigo-500/10" 
    : "border-slate-200/90 dark:border-slate-800/80 hover:border-indigo-400/60 dark:hover:border-indigo-600/50";

  return (
    <div className={`group min-w-[260px] max-w-[340px] transition-all duration-200 relative ${styleClasses} ${borderStyle}`}>
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

      {/* Class Header */}
      <div className="bg-slate-50/95 dark:bg-slate-950/90 px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800/70 text-center">
        {isAbstract ? (
          <div className="text-[9.5px] font-mono font-bold text-amber-500 uppercase tracking-widest mb-0.5">
            «abstract class»
          </div>
        ) : (
          <div className="text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
            «entity»
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          <Code className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className={`font-bold font-mono text-[13px] text-slate-800 dark:text-white ${isAbstract ? "italic" : ""}`}>
            {data.label}
          </span>
        </div>
      </div>

      {/* Attributes Compartment */}
      <div className="px-3.5 py-2 divide-y divide-slate-100/50 dark:divide-slate-800/40 bg-white/40 dark:bg-slate-900/30 text-xs font-mono">
        {attributes.length === 0 ? (
          <div className="text-[10px] text-slate-400 italic text-center py-1">no attributes</div>
        ) : (
          attributes.map((attr, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 py-1 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-1 rounded transition-colors">
              <div className="flex items-center gap-1.5 min-w-0">
                {getVisibilitySymbol(attr.visibility)}
                <span className={`truncate text-[11px] ${attr.isPk ? "font-bold text-amber-500" : "text-slate-700 dark:text-slate-200"}`}>
                  {attr.name}
                </span>
              </div>
              {attr.type && (
                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 shrink-0">
                  {attr.type}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Methods Compartment */}
      {methods.length > 0 && (
        <div className="border-t border-slate-200/80 dark:border-slate-800/70 px-3.5 py-2 bg-slate-50/40 dark:bg-slate-950/30 text-xs font-mono space-y-1">
          {methods.map((method, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[10.5px] text-indigo-600 dark:text-indigo-400 truncate py-0.5 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 px-1 rounded">
              <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{method}</span>
            </div>
          ))}
        </div>
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
