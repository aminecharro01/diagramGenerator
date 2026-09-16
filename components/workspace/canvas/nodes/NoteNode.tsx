import React from "react";
import { Handle, Position } from "@xyflow/react";
import { StickyNote, Pin } from "lucide-react";

export default function NoteNode({ data }: { data: any }) {
  const isSelected = data.selected;
  const description = data.description || data.label || "";

  return (
    <div className={`group relative p-3.5 rounded-xl bg-amber-50/95 dark:bg-[#1a1710]/95 border border-amber-300/80 dark:border-amber-600/50 shadow-md min-w-[200px] max-w-[280px] text-left transition-all ${
      isSelected ? "ring-2 ring-amber-500 shadow-amber-500/20" : "hover:border-amber-400"
    }`}>
      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top-in" 
        className="!w-2 !h-2 !bg-amber-500 !border !border-white opacity-0 group-hover:opacity-100" 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-in" 
        className="!w-2 !h-2 !bg-amber-500 !border !border-white opacity-0 group-hover:opacity-100" 
      />

      <div className="flex items-center gap-1.5 mb-1.5 text-amber-700 dark:text-amber-400">
        <Pin className="h-3 w-3 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Note</span>
      </div>

      <div className="text-[11px] text-amber-950 dark:text-amber-100 font-sans leading-relaxed whitespace-pre-wrap">
        {description}
      </div>

      {/* Out Handles */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-out" 
        className="!w-2 !h-2 !bg-amber-500 !border !border-white opacity-0 group-hover:opacity-100" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom-out" 
        className="!w-2 !h-2 !bg-amber-500 !border !border-white opacity-0 group-hover:opacity-100" 
      />
    </div>
  );
}
