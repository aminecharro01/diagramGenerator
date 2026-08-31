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
  
  // Retrieve settings
  const settings = data.settings || {};

  // 1. Theme Style Classes
  const visualStyle = settings.visualStyle || "Modern";
  let styleClasses = "";
  
  if (visualStyle === "Minimal") {
    styleClasses = "border-none shadow-none rounded-none bg-transparent dark:bg-transparent backdrop-blur-none";
  } else if (visualStyle === "Academic" || visualStyle === "Technical") {
    styleClasses = "border-2 border-slate-800 dark:border-slate-200 rounded-none shadow-none font-mono bg-white dark:bg-slate-900";
  } else if (visualStyle === "Corporate" || visualStyle === "Professional") {
    styleClasses = "border border-slate-300 dark:border-slate-700/80 rounded-md shadow-sm bg-white dark:bg-slate-900";
  } else if (visualStyle === "Hand-drawn") {
    styleClasses = "border-2 border-slate-500/80 dark:border-slate-400/80 border-dashed rounded-xl shadow-none bg-white dark:bg-slate-900";
  } else if (visualStyle === "Blueprint") {
    styleClasses = "bg-[#0b192f] border-2 border-indigo-400/80 text-blue-100 rounded-none shadow-none font-mono";
  } else if (visualStyle === "Glassmorphism") {
    styleClasses = "bg-white/30 dark:bg-slate-950/25 backdrop-blur-md border border-white/40 dark:border-slate-800/40 shadow-xl";
  } else if (visualStyle === "Flat") {
    styleClasses = "border border-slate-200 dark:border-slate-800 rounded-none shadow-none bg-slate-50 dark:bg-slate-900";
  } else if (visualStyle === "High Contrast") {
    styleClasses = "bg-white dark:bg-black text-slate-950 dark:text-white border-2 border-slate-950 dark:border-white shadow-none rounded-none";
  } else {
    // Default is Modern
    styleClasses = "bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-lg dark:shadow-2xl overflow-hidden rounded-xl";
  }

  // 2. Custom Colors and Auto-coloring Routing
  let activePalette = settings.colorPalette || data.palette || "indigo";
  if (activePalette === "Auto Color") {
    // Database tables map to amber in auto color mode
    activePalette = "amber";
  }

  const paletteColors = {
    indigo: {
      borderDefault: "border-slate-200 dark:border-slate-800/80 hover:border-indigo-350 dark:hover:border-indigo-700/80",
      borderSelected: "border-indigo-500 dark:border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-indigo-500/5",
      dbIcon: "text-indigo-400",
      headerBorder: "border-indigo-500/10 dark:border-indigo-500/20",
    },
    emerald: {
      borderDefault: "border-slate-200 dark:border-slate-800/80 hover:border-emerald-350 dark:hover:border-emerald-700/80",
      borderSelected: "border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-emerald-500/5",
      dbIcon: "text-emerald-400",
      headerBorder: "border-emerald-500/10 dark:border-emerald-500/20",
    },
    amber: {
      borderDefault: "border-slate-200 dark:border-slate-800/80 hover:border-amber-350 dark:hover:border-amber-700/80",
      borderSelected: "border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-amber-500/5",
      dbIcon: "text-amber-400",
      headerBorder: "border-amber-500/10 dark:border-amber-500/20",
    },
    rose: {
      borderDefault: "border-slate-200 dark:border-slate-800/80 hover:border-rose-350 dark:hover:border-rose-700/80",
      borderSelected: "border-rose-500 dark:border-rose-500/80 ring-2 ring-rose-500/20 shadow-rose-500/5",
      dbIcon: "text-rose-400",
      headerBorder: "border-rose-500/10 dark:border-rose-500/20",
    },
  }[activePalette as "indigo" | "emerald" | "amber" | "rose"] || {
    borderDefault: "border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700/80",
    borderSelected: "border-slate-500 ring-2 ring-slate-500/20",
    dbIcon: "text-indigo-400",
    headerBorder: "border-slate-200 dark:border-slate-850",
  };

  const borderStyle = isSelected ? paletteColors.borderSelected : paletteColors.borderDefault;

  // Custom colors override
  const customColors = settings.customColors || {};
  let inlineContainerStyle: React.CSSProperties = {};
  let inlineIconStyle: React.CSSProperties = {};
  let inlineTextStyle: React.CSSProperties = {};
  let inlineHeaderStyle: React.CSSProperties = {};

  if (customColors.node) {
    inlineContainerStyle.backgroundColor = customColors.node;
  }
  if (customColors.border) {
    inlineContainerStyle.borderColor = isSelected 
      ? (customColors.accent || customColors.border) 
      : customColors.border;
    inlineHeaderStyle.borderBottomColor = customColors.border;
  }
  if (customColors.text) {
    inlineTextStyle.color = customColors.text;
  }
  if (customColors.accent) {
    inlineIconStyle.color = customColors.accent;
  }

  // 3. Typography Styles
  const fontFamily = settings.fontFamily || "Inter";
  const fontFamilyMap: Record<string, { fontFamily: string }> = {
    "Poppins": { fontFamily: "'Poppins', sans-serif" },
    "Inter": { fontFamily: "'Inter', sans-serif" },
    "Roboto": { fontFamily: "'Roboto', sans-serif" },
    "IBM Plex Sans": { fontFamily: "'IBM Plex Sans', sans-serif" },
    "JetBrains Mono": { fontFamily: "'JetBrains Mono', monospace" },
    "System": { fontFamily: "system-ui, sans-serif" },
  };
  const fontFamilyStyle = fontFamilyMap[fontFamily] || { fontFamily: "inherit" };

  const fontSize = settings.fontSize || "Medium";
  const headerTextSizeMap: Record<string, string> = {
    "Small": "text-[10px]",
    "Medium": "text-xs",
    "Large": "text-[14px] font-extrabold",
    "Extra Large": "text-[16px] font-extrabold",
  };
  const headerTextSize = headerTextSizeMap[fontSize] || "text-xs";

  const colTextSizeMap: Record<string, string> = {
    "Small": "text-[9px] px-3 py-1.2",
    "Medium": "text-[11px] px-4 py-2",
    "Large": "text-[13px] px-5 py-2.8",
    "Extra Large": "text-[14.5px] px-5.5 py-3.2",
  };
  const colTextSize = colTextSizeMap[fontSize] || "text-[11px] px-4 py-2";

  const keyIconSizeMap: Record<string, string> = {
    "Small": "h-2 w-2",
    "Medium": "h-3 w-3",
    "Large": "h-3.8 w-3.8",
    "Extra Large": "h-4.5 w-4.5",
  };
  const keyIconSize = keyIconSizeMap[fontSize] || "h-3 w-3";

  // Dynamic user-controlled sizing
  const nodeSize = data.nodeSize || settings.nodeSize || "md";
  const nodeSizeClasses = {
    sm: "min-w-[210px] max-w-[260px] rounded-lg",
    md: "min-w-[260px] max-w-[330px] rounded-xl",
    lg: "min-w-[310px] max-w-[390px] rounded-2xl",
  }[nodeSize as "sm" | "md" | "lg"] || "min-w-[260px] max-w-[330px] rounded-xl";

  const headerPadding = {
    sm: "px-3 py-2 gap-1.5",
    md: "px-4 py-2.5 gap-2",
    lg: "px-5 py-3.5 gap-2.5",
  }[nodeSize as "sm" | "md" | "lg"] || "px-4 py-2.5 gap-2";

  const labelInlineStyle = { ...fontFamilyStyle, ...inlineTextStyle };
  const attributeInlineStyle = { ...fontFamilyStyle, ...inlineTextStyle };

  return (
    <div 
      className={`bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border overflow-hidden transition-all duration-200 ${nodeSizeClasses} ${styleClasses} ${borderStyle}`}
      style={inlineContainerStyle}
    >
      {/* Target points */}
      <Handle type="target" position={Position.Left} id="left-in" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} id="top-in" style={{ opacity: 0 }} />

      {/* Table Header */}
      <div 
        className={`bg-slate-50/80 dark:bg-slate-950/80 border-b flex items-center shrink-0 ${headerPadding} ${paletteColors.headerBorder}`}
        style={inlineHeaderStyle}
      >
        <Database className={`h-4.5 w-4.5 shrink-0 ${paletteColors.dbIcon}`} style={inlineIconStyle} />
        <span 
          className={`font-bold text-slate-800 dark:text-white font-mono tracking-wide break-all ${headerTextSize}`}
          style={labelInlineStyle}
        >
          {data.label}
        </span>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-slate-200/40 dark:divide-slate-850/40 bg-slate-50/10 dark:bg-slate-900/10">
        {attributes.length === 0 ? (
          <div className="p-3.5 text-[10px] text-slate-500 text-center italic select-none" style={fontFamilyStyle}>
            No columns defined
          </div>
        ) : (
          attributes.map((attr, idx) => (
            <div key={idx} className={`flex items-center justify-between gap-4 ${colTextSize}`} style={attributeInlineStyle}>
              <div className="flex items-center gap-2 min-w-0">
                {attr.isPk && (
                  <span title="Primary Key" className="shrink-0">
                    <Key className={`text-amber-500 dark:text-amber-400 ${keyIconSize}`} />
                  </span>
                )}
                {attr.isFk && (
                  <span title="Foreign Key" className="shrink-0">
                    <Key className={`text-sky-500 dark:text-sky-400 ${keyIconSize}`} />
                  </span>
                )}
                <span className={`font-mono truncate ${attr.isPk ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-700 dark:text-slate-200"}`}>
                  {attr.name}
                </span>
              </div>
              <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0 select-none">{attr.type}</span>
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
