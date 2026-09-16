import React from "react";
import { Handle, Position } from "@xyflow/react";
import { User, Shield, GraduationCap, Briefcase, HelpCircle, UserCheck } from "lucide-react";

export default function ActorNode({ data }: { data: any }) {
  const isSelected = data.selected;
  const label = data.label || "Actor";
  const badge = data.metadata?.badge;
  const settings = data.settings || {};

  // Palette
  const borderStyle = isSelected 
    ? "border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/20 shadow-xl shadow-indigo-500/10" 
    : "border-slate-200/90 dark:border-slate-800/80 hover:border-indigo-400/60 dark:hover:border-indigo-500/50";

  // Pick actor avatar icon based on name
  const norm = label.toLowerCase();
  const getActorIcon = () => {
    if (norm.includes("admin") || norm.includes("super")) return <Shield className="h-6 w-6 text-indigo-500" />;
    if (norm.includes("tudiant") || norm.includes("apprenant")) return <GraduationCap className="h-6 w-6 text-emerald-500" />;
    if (norm.includes("formateur") || norm.includes("tuteur")) return <Briefcase className="h-6 w-6 text-amber-500" />;
    if (norm.includes("visiteur") || norm.includes("tiers") || norm.includes("recruteur")) return <UserCheck className="h-6 w-6 text-sky-500" />;
    return <User className="h-6 w-6 text-indigo-500" />;
  };

  return (
    <div className={`group flex flex-col items-center justify-center p-3 rounded-2xl bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border transition-all duration-200 min-w-[150px] max-w-[200px] text-center shadow-md ${borderStyle}`}>
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

      {/* Silhouette Circle */}
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-inner mb-2 group-hover:scale-105 transition-transform">
        {getActorIcon()}
      </div>

      {/* Actor Label */}
      <div className="font-bold text-[12.5px] text-slate-800 dark:text-slate-100 leading-tight">
        {label}
      </div>

      {/* Role / Badge Subtitle */}
      {badge && (
        <span className="text-[9px] font-mono font-medium px-2 py-0.5 mt-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400">
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
