import React from "react";
import { Handle, Position } from "@xyflow/react";
import { 
  Database, Server, User, Cloud, RefreshCw, Cpu, HelpCircle,
  GitCommit, Activity, CornerRightDown, Monitor, Network,
  Layers, Folder, Shield, Code, ChevronRight, Play, AlertCircle,
  CheckCircle2, Radio, CircleDot, Globe, Users, HardDrive, Box
} from "lucide-react";

export default function StandardNode({ data }: { data: any }) {
  const type = data.type || "service";
  const isSelected = data.selected;
  
  // Retrieve customization settings from node or global settings
  const settings = data.settings || {};
  const metadata = data.metadata || {};
  const tech = metadata.tech || data.tech;
  const layer = metadata.layer || data.layer;
  const badge = metadata.badge || data.badge;
  const status = metadata.status || data.status;
  
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
    styleClasses = "bg-white/95 dark:bg-[#0d1324]/95 backdrop-blur-md border shadow-lg dark:shadow-xl rounded-xl";
  }

  // 2. Custom Colors and Auto-coloring Routing
  let activePalette = settings.colorPalette || data.palette || "indigo";
  if (activePalette === "Auto Color" || activePalette === "Default") {
    // Semantic auto coloring based on node type and layer
    const normType = (data.type || "").toLowerCase();
    const normCategory = (metadata.category || "").toLowerCase();
    
    if (normCategory === "frontend" || normType === "frontend" || normType === "user" || normType === "actor" || normType === "employee") {
      activePalette = "indigo";
    } else if (normCategory === "backend" || normType === "backend" || normType === "service" || normType === "process" || normType === "task" || normType === "action") {
      activePalette = "emerald";
    } else if (normCategory === "database" || normType === "database" || normType === "cache" || normType === "entity" || normType === "datastore") {
      activePalette = "amber";
    } else if (normCategory === "queue" || normType === "queue" || normType === "event" || normType === "stream") {
      activePalette = "indigo";
    } else if (normCategory === "external" || normType === "external" || normType === "api" || normType === "gateway" || normType === "router" || normType === "firewall") {
      activePalette = "rose";
    } else {
      activePalette = "indigo";
    }
  }

  const paletteColors = {
    indigo: {
      borderDefault: "border-slate-200/90 dark:border-slate-800/80 hover:border-indigo-400/60 dark:hover:border-indigo-600/50",
      borderSelected: "border-indigo-500 dark:border-indigo-500/90 ring-2 ring-indigo-500/25 shadow-indigo-500/10",
      icon: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40",
      accent: "indigo-500",
      tag: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50",
      handle: "!bg-indigo-500",
    },
    emerald: {
      borderDefault: "border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400/60 dark:hover:border-emerald-600/50",
      borderSelected: "border-emerald-500 dark:border-emerald-500/90 ring-2 ring-emerald-500/25 shadow-emerald-500/10",
      icon: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40",
      accent: "emerald-500",
      tag: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
      handle: "!bg-emerald-500",
    },
    amber: {
      borderDefault: "border-slate-200/90 dark:border-slate-800/80 hover:border-amber-400/60 dark:hover:border-amber-600/50",
      borderSelected: "border-amber-500 dark:border-amber-500/90 ring-2 ring-amber-500/25 shadow-amber-500/10",
      icon: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40",
      accent: "amber-500",
      tag: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
      handle: "!bg-amber-500",
    },
    rose: {
      borderDefault: "border-slate-200/90 dark:border-slate-800/80 hover:border-rose-400/60 dark:hover:border-rose-600/50",
      borderSelected: "border-rose-500 dark:border-rose-500/90 ring-2 ring-rose-500/25 shadow-rose-500/10",
      icon: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40",
      accent: "rose-500",
      tag: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
      handle: "!bg-rose-500",
    },
  }[activePalette as "indigo" | "emerald" | "amber" | "rose"] || {
    borderDefault: "border-slate-200 dark:border-slate-800",
    borderSelected: "border-slate-500 ring-2 ring-slate-500/20",
    icon: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800",
    accent: "slate-500",
    tag: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    handle: "!bg-slate-500",
  };

  const borderStyle = isSelected ? paletteColors.borderSelected : paletteColors.borderDefault;

  // Custom colors override
  const customColors = settings.customColors || {};
  let inlineContainerStyle: React.CSSProperties = {};
  let inlineIconStyle: React.CSSProperties = {};
  let inlineTextStyle: React.CSSProperties = {};

  if (customColors.node) inlineContainerStyle.backgroundColor = customColors.node;
  if (customColors.border) {
    inlineContainerStyle.borderColor = isSelected 
      ? (customColors.accent || customColors.border) 
      : customColors.border;
  }
  if (customColors.text) inlineTextStyle.color = customColors.text;
  if (customColors.accent) {
    inlineIconStyle.color = customColors.accent;
    inlineIconStyle.borderColor = customColors.accent;
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
  const labelSizeClassesMap: Record<string, string> = {
    "Small": "text-[11.5px] leading-tight",
    "Medium": "text-[13px] leading-snug",
    "Large": "text-[15px] leading-normal font-bold",
    "Extra Large": "text-[17px] leading-normal font-extrabold",
  };
  const labelSizeClasses = labelSizeClassesMap[fontSize] || "text-[13px] leading-snug";

  const descSizeClassesMap: Record<string, string> = {
    "Small": "text-[9.5px] mt-0.5 leading-normal",
    "Medium": "text-[10.5px] mt-1 leading-relaxed",
    "Large": "text-[12px] mt-1 leading-relaxed",
    "Extra Large": "text-[13.5px] mt-1.5 leading-relaxed",
  };
  const descSizeClasses = descSizeClassesMap[fontSize] || "text-[10.5px] mt-1 leading-relaxed";

  const fontWeight = settings.fontWeight || "Semibold";
  const fontWeightClassMap: Record<string, string> = {
    "Regular": "font-normal",
    "Medium": "font-medium",
    "Semibold": "font-semibold",
    "Bold": "font-bold",
  };
  const fontWeightClass = fontWeightClassMap[fontWeight] || "font-semibold";

  const labelInlineStyle = { ...fontFamilyStyle, ...inlineTextStyle };
  const descInlineStyle = { ...fontFamilyStyle, ...inlineTextStyle, opacity: 0.82 };

  // 4. Icons Mapping
  const useIcons = settings.useIcons !== false;
  const getIcon = () => {
    const iconColor = paletteColors.icon;
    switch (type) {
      case "database":
      case "datastore":
        return <Database className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "cache":
        return <Cpu className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "queue":
        return <RefreshCw className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "user":
      case "employee":
      case "actor":
        return <User className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "external":
        return <Cloud className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "decision":
      case "gateway":
      case "choice":
        return <GitCommit className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "start":
      case "event":
        return <Activity className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "end":
        return <CornerRightDown className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "frontend":
        return <Monitor className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "backend":
      case "service":
        return <Server className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "api":
        return <Network className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "task":
      case "process":
      case "action":
        return <Activity className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "router":
      case "switch":
        return <Network className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "firewall":
        return <Shield className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "class":
        return <Code className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "package":
        return <Folder className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "component":
        return <Layers className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "usecase":
        return <CircleDot className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "system":
        return <Globe className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "department":
      case "manager":
      case "employee":
        return <Users className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      case "storage":
      case "compute":
        return <HardDrive className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
      default:
        return <Server className={`h-4 w-4 ${iconColor}`} style={inlineIconStyle} />;
    }
  };

  // 5. Sizing and Padding Configs
  const nodeSize = data.nodeSize || settings.nodeSize || "md";
  const nodeSizeClasses = {
    sm: "min-w-[200px] max-w-[240px] px-3.5 py-2.5 rounded-lg",
    md: "min-w-[250px] max-w-[290px] px-4 py-3.5 rounded-xl",
    lg: "min-w-[290px] max-w-[340px] px-5 py-4 rounded-2xl",
  }[nodeSize as "sm" | "md" | "lg"] || "min-w-[250px] max-w-[290px] px-4 py-3.5 rounded-xl";

  const iconPaddingClasses = {
    sm: "p-1.5 rounded-md",
    md: "p-2 rounded-lg",
    lg: "p-2.5 rounded-xl",
  }[nodeSize as "sm" | "md" | "lg"] || "p-2 rounded-lg";

  // 6. Node Design Options
  const nodeDesign = settings.nodeDesign || "Icon + text inside node";
  const isMinimalDetail = settings.nodeDetail === "Minimal";

  // Render Top Header / Tier Indicator if layer or badge exists
  const renderHeaderBadge = () => {
    if (!layer && !badge && !status) return null;
    return (
      <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/70 w-full select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          {layer && (
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 truncate">
              {layer}
            </span>
          )}
          {badge && (
            <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-medium">
              {badge}
            </span>
          )}
        </div>
        {status && (
          <span 
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${status === "syncing" ? "bg-amber-500 animate-spin" : "bg-emerald-500 animate-pulse"}`} 
            title={`Status: ${status}`}
          />
        )}
      </div>
    );
  };

  // Render Technology Stack Pill if tech metadata exists
  const renderTechPill = () => {
    if (!tech) return null;
    return (
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between w-full">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
          <Code className="h-2.5 w-2.5 text-slate-400 dark:text-slate-500" />
          {tech}
        </span>
      </div>
    );
  };

  // Build content container based on Node Design choice
  const renderNodeContent = () => {
    if (nodeDesign === "Icon only") {
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[50px]">
          <div className={`${iconPaddingClasses} ${paletteColors.iconBg}`}>
            {getIcon()}
          </div>
        </div>
      );
    }

    if (nodeDesign === "Text only" || !useIcons) {
      return (
        <div className="text-left w-full">
          {renderHeaderBadge()}
          <div className={`${fontWeightClass} text-slate-900 dark:text-slate-100 break-words ${labelSizeClasses}`} style={labelInlineStyle}>
            {data.label}
          </div>
          {data.description && !isMinimalDetail && (
            <div className={`text-slate-500 dark:text-slate-400 break-words ${descSizeClasses}`} style={descInlineStyle}>
              {data.description}
            </div>
          )}
          {renderTechPill()}
        </div>
      );
    }

    if (nodeDesign === "Icon above + text below" || nodeDesign === "Icon above + text") {
      return (
        <div className="flex flex-col items-center text-center w-full gap-2">
          {renderHeaderBadge()}
          <div className={`${iconPaddingClasses} ${paletteColors.iconBg} shrink-0`}>
            {getIcon()}
          </div>
          <div className="w-full">
            <div className={`${fontWeightClass} text-slate-900 dark:text-slate-100 break-words ${labelSizeClasses}`} style={labelInlineStyle}>
              {data.label}
            </div>
            {data.description && !isMinimalDetail && (
              <div className={`text-slate-500 dark:text-slate-400 break-words ${descSizeClasses}`} style={descInlineStyle}>
                {data.description}
              </div>
            )}
            {renderTechPill()}
          </div>
        </div>
      );
    }

    // Default: "Icon + text inside node"
    return (
      <div className="w-full">
        {renderHeaderBadge()}
        <div className="flex items-start gap-3 w-full">
          <div className={`shrink-0 flex items-center justify-center ${iconPaddingClasses} ${paletteColors.iconBg}`}>
            {getIcon()}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className={`${fontWeightClass} text-slate-900 dark:text-slate-100 break-words ${labelSizeClasses}`} style={labelInlineStyle}>
              {data.label}
            </div>
            {data.description && !isMinimalDetail && (
              <div className={`text-slate-500 dark:text-slate-400 break-words ${descSizeClasses}`} style={descInlineStyle}>
                {data.description}
              </div>
            )}
          </div>
        </div>
        {renderTechPill()}
      </div>
    );
  };

  // UML Use Case custom shape styling (oval/capsule)
  const shapeClasses = type === "usecase" ? "!rounded-[2rem] px-5 py-3" : "";

  return (
    <div 
      className={`group border transition-all duration-200 relative ${nodeSizeClasses} ${styleClasses} ${borderStyle} ${shapeClasses}`}
      style={inlineContainerStyle}
    >
      {/* Sleek connection handles that appear on card hover */}
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
      
      {renderNodeContent()}
      
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
