import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Database, Key, Hash } from "lucide-react";

interface Attribute {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

// Syntax highlighting for SQL data types
function getTypeBadgeStyle(rawType: string): string {
  const t = (rawType || "").toUpperCase();
  if (t.includes("UUID") || t.includes("ID")) {
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40";
  }
  if (t.includes("VARCHAR") || t.includes("TEXT") || t.includes("CHAR") || t.includes("STRING")) {
    return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/40";
  }
  if (t.includes("INT") || t.includes("DECIMAL") || t.includes("FLOAT") || t.includes("NUMERIC") || t.includes("BIGINT") || t.includes("SERIAL")) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40";
  }
  if (t.includes("TIME") || t.includes("DATE") || t.includes("TIMESTAMP")) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40";
  }
  if (t.includes("BOOL")) {
    return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40";
  }
  if (t.includes("JSON")) {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40";
  }
  return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/40";
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
    styleClasses = "bg-white/40 dark:bg-slate-950/35 backdrop-blur-md border border-white/50 dark:border-slate-800/50 shadow-xl";
  } else if (visualStyle === "Flat") {
    styleClasses = "border border-slate-200 dark:border-slate-800 rounded-none shadow-none bg-slate-50 dark:bg-slate-900";
  } else if (visualStyle === "High Contrast") {
    styleClasses = "bg-white dark:bg-black text-slate-950 dark:text-white border-2 border-slate-950 dark:border-white shadow-none rounded-none";
  } else {
    // Default is Modern
    styleClasses = "bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border shadow-lg dark:shadow-2xl overflow-hidden rounded-xl";
  }

  // 2. Custom Colors and Auto-coloring Routing
  let activePalette = settings.colorPalette || data.palette || "indigo";
  if (activePalette === "Auto Color" || activePalette === "Default") {
    activePalette = "amber"; // Amber is standard for databases/entities
  }

  const paletteColors = {
    indigo: {
      borderDefault: "border-slate-200/90 dark:border-slate-800/80 hover:border-indigo-400/60 dark:hover:border-indigo-600/50",
      borderSelected: "border-indigo-500 dark:border-indigo-500/90 ring-2 ring-indigo-500/25 shadow-indigo-500/10",
      dbIcon: "text-indigo-500 dark:text-indigo-400",
      headerBorder: "border-indigo-500/15 dark:border-indigo-500/25",
      handle: "!bg-indigo-500",
    },
    emerald: {
      borderDefault: "border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400/60 dark:hover:border-emerald-600/50",
      borderSelected: "border-emerald-500 dark:border-emerald-500/90 ring-2 ring-emerald-500/25 shadow-emerald-500/10",
      dbIcon: "text-emerald-500 dark:text-emerald-400",
      headerBorder: "border-emerald-500/15 dark:border-emerald-500/25",
      handle: "!bg-emerald-500",
    },
    amber: {
      borderDefault: "border-slate-200/90 dark:border-slate-800/80 hover:border-amber-400/60 dark:hover:border-amber-600/50",
      borderSelected: "border-amber-500 dark:border-amber-500/90 ring-2 ring-amber-500/25 shadow-amber-500/10",
      dbIcon: "text-amber-500 dark:text-amber-400",
      headerBorder: "border-amber-500/15 dark:border-amber-500/25",
      handle: "!bg-amber-500",
    },
    rose: {
      borderDefault: "border-slate-200/90 dark:border-slate-800/80 hover:border-rose-400/60 dark:hover:border-rose-600/50",
      borderSelected: "border-rose-500 dark:border-rose-500/90 ring-2 ring-rose-500/25 shadow-rose-500/10",
      dbIcon: "text-rose-500 dark:text-rose-400",
      headerBorder: "border-rose-500/15 dark:border-rose-500/25",
      handle: "!bg-rose-500",
    },
  }[activePalette as "indigo" | "emerald" | "amber" | "rose"] || {
    borderDefault: "border-slate-200 dark:border-slate-800",
    borderSelected: "border-slate-500 ring-2 ring-slate-500/20",
    dbIcon: "text-amber-400",
    headerBorder: "border-slate-200 dark:border-slate-800",
    handle: "!bg-slate-500",
  };

  const borderStyle = isSelected ? paletteColors.borderSelected : paletteColors.borderDefault;

  // Custom colors override
  const customColors = settings.customColors || {};
  let inlineContainerStyle: React.CSSProperties = {};
  let inlineIconStyle: React.CSSProperties = {};
  let inlineTextStyle: React.CSSProperties = {};
  let inlineHeaderStyle: React.CSSProperties = {};

  if (customColors.node) inlineContainerStyle.backgroundColor = customColors.node;
  if (customColors.border) {
    inlineContainerStyle.borderColor = isSelected 
      ? (customColors.accent || customColors.border) 
      : customColors.border;
    inlineHeaderStyle.borderBottomColor = customColors.border;
  }
  if (customColors.text) inlineTextStyle.color = customColors.text;
  if (customColors.accent) inlineIconStyle.color = customColors.accent;

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
    "Small": "text-[11px]",
    "Medium": "text-[12.5px]",
    "Large": "text-[14px] font-extrabold",
    "Extra Large": "text-[16px] font-extrabold",
  };
  const headerTextSize = headerTextSizeMap[fontSize] || "text-[12.5px]";

  const colTextSizeMap: Record<string, string> = {
    "Small": "text-[10px] px-3.5 py-1.5",
    "Medium": "text-[11.5px] px-4 py-2",
    "Large": "text-[13px] px-4.5 py-2.5",
    "Extra Large": "text-[14.5px] px-5 py-3",
  };
  const colTextSize = colTextSizeMap[fontSize] || "text-[11.5px] px-4 py-2";

  // Dynamic user-controlled sizing
  const nodeSize = data.nodeSize || settings.nodeSize || "md";
  const nodeSizeClasses = {
    sm: "min-w-[230px] max-w-[270px] rounded-lg",
    md: "min-w-[280px] max-w-[340px] rounded-xl",
    lg: "min-w-[320px] max-w-[400px] rounded-2xl",
  }[nodeSize as "sm" | "md" | "lg"] || "min-w-[280px] max-w-[340px] rounded-xl";

  const headerPadding = {
    sm: "px-3.5 py-2 gap-2",
    md: "px-4 py-2.5 gap-2.5",
    lg: "px-5 py-3.5 gap-3",
  }[nodeSize as "sm" | "md" | "lg"] || "px-4 py-2.5 gap-2.5";

  const labelInlineStyle = { ...fontFamilyStyle, ...inlineTextStyle };
  const attributeInlineStyle = { ...fontFamilyStyle, ...inlineTextStyle };

  return (
    <div 
      className={`group bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border overflow-hidden transition-all duration-200 relative ${nodeSizeClasses} ${styleClasses} ${borderStyle}`}
      style={inlineContainerStyle}
    >
      {/* Sleek connection handles that appear on hover */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-in" 
        className={`!w-2.5 !h-2.5 ${paletteColors.handle} !border-2 !border-white dark:!border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200`} 
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top-in" 
        className={`!w-2.5 !h-2.5 ${paletteColors.handle} !border-2 !border-white dark:!border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200`} 
      />

      {/* Table Header with database icon, table name, and columns count pill */}
      <div 
        className={`bg-slate-50/90 dark:bg-slate-950/90 border-b flex items-center justify-between shrink-0 ${headerPadding} ${paletteColors.headerBorder}`}
        style={inlineHeaderStyle}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Database className={`h-4 w-4 shrink-0 ${paletteColors.dbIcon}`} style={inlineIconStyle} />
          <span 
            className={`font-bold text-slate-800 dark:text-white font-mono tracking-wide truncate ${headerTextSize}`}
            style={labelInlineStyle}
          >
            {data.label}
          </span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-medium shrink-0">
          {attributes.length} cols
        </span>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white/40 dark:bg-slate-900/30">
        {attributes.length === 0 ? (
          <div className="p-4 text-[11px] text-slate-400 text-center italic select-none" style={fontFamilyStyle}>
            No columns defined
          </div>
        ) : (
          attributes.map((attr, idx) => (
            <div key={idx} className={`flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${colTextSize}`} style={attributeInlineStyle}>
              <div className="flex items-center gap-2 min-w-0">
                {attr.isPk ? (
                  <span title="Primary Key (PK)" className="shrink-0">
                    <Key className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                  </span>
                ) : attr.isFk ? (
                  <span title="Foreign Key (FK)" className="shrink-0">
                    <Key className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  </span>
                ) : (
                  <span className="h-3.5 w-3.5 flex items-center justify-center shrink-0 opacity-20">
                    <Hash className="h-2.5 w-2.5" />
                  </span>
                )}
                <span className={`font-mono truncate ${attr.isPk ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-700 dark:text-slate-200"}`}>
                  {attr.name}
                </span>
              </div>
              <span className={`font-mono text-[9.5px] px-1.5 py-0.5 rounded border font-medium shrink-0 select-none ${getTypeBadgeStyle(attr.type)}`}>
                {attr.type}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Source connection handles */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-out" 
        className={`!w-2.5 !h-2.5 ${paletteColors.handle} !border-2 !border-white dark:!border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200`} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom-out" 
        className={`!w-2.5 !h-2.5 ${paletteColors.handle} !border-2 !border-white dark:!border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200`} 
      />
    </div>
  );
}
