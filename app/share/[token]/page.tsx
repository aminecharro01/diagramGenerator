"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant, MarkerType,
  useNodesState, useEdgesState, type Node, type Edge 
} from "@xyflow/react";
import { createClient } from "@/lib/supabase/client";
import { DiagramData, DiagramSettings } from "@/types/diagram";
import { downloadJson, downloadSvg, downloadPng } from "@/lib/diagram/export";

import StandardNode from "@/components/workspace/canvas/nodes/StandardNode";
import EntityNode from "@/components/workspace/canvas/nodes/EntityNode";
import ThemedEdge from "@/components/workspace/canvas/edges/ThemedEdge";

import { 
  Sparkles, Download, Copy, Share2, Loader2, AlertCircle, 
  Layout, Eye, Grid, Database, GitBranch, Check, Sun, Moon
} from "lucide-react";

export default function ShareViewerPage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [title, setTitle] = useState("Loading...");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Theme states
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [nodeSize, setNodeSize] = useState<"sm" | "md" | "lg">("md");
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">("md");
  const [palette, setPalette] = useState<"indigo" | "emerald" | "amber" | "rose">("indigo");

  // Customize settings state loaded from DB
  const [settings, setSettings] = useState<DiagramSettings>({});

  // Sync theme configurations
  useEffect(() => {
    const storedTheme = localStorage.theme;
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
      document.documentElement.classList.add(storedTheme);
    } else {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Sync settings and sizing changes to React Flow node attributes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          settings: settings,
          nodeSize,
          textSize,
          palette,
        },
      }))
    );
  }, [nodeSize, textSize, palette, settings]);

  // Sync connection edge rendering styles inline reactively based on theme/settings
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        let strokeColor = theme === "dark" ? "#64748b" : "#94a3b8";
        
        if (settings.customColors?.connector) {
          strokeColor = settings.customColors.connector;
        } else if (settings.colorPalette && settings.colorPalette !== "Default" && settings.colorPalette !== "Auto Color") {
          const pal = settings.colorPalette.toLowerCase();
          if (pal.includes("indigo")) strokeColor = theme === "dark" ? "#818cf8" : "#4f46e5";
          else if (pal.includes("emerald")) strokeColor = theme === "dark" ? "#34d399" : "#059669";
          else if (pal.includes("amber")) strokeColor = theme === "dark" ? "#fbbf24" : "#d97706";
          else if (pal.includes("rose")) strokeColor = theme === "dark" ? "#f43f5e" : "#e11d48";
        }

        let strokeDasharray = undefined;
        if (settings.lineType === "Dashed") strokeDasharray = "5 5";
        else if (settings.lineType === "Dotted") strokeDasharray = "2 3";

        let strokeWidth = 2;
        if (settings.lineThickness === "Thin") strokeWidth = 1.2;
        else if (settings.lineThickness === "Thick") strokeWidth = 3.5;

        const connStyle = (settings.connectorStyle || "default").toLowerCase();
        let edgeType = "smoothstep";
        if (connStyle === "curved" || connStyle === "smart") edgeType = "default";
        else if (connStyle === "straight") edgeType = "straight";
        else if (connStyle === "step" || connStyle === "elbow") edgeType = "step";

        return {
          ...edge,
          type: edgeType,
          style: {
            ...edge.style,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            strokeDasharray: strokeDasharray,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          },
        };
      })
    );
  }, [theme, settings, setEdges]);

  // Register custom node renderers
  const nodeTypes = useMemo(
    () => ({
      service: StandardNode,
      database: StandardNode,
      cache: StandardNode,
      queue: StandardNode,
      user: StandardNode,
      external: StandardNode,
      actor: StandardNode,
      decision: StandardNode,
      gateway: StandardNode,
      start: StandardNode,
      event: StandardNode,
      end: StandardNode,
      entity: EntityNode,
      frontend: StandardNode,
      backend: StandardNode,
      api: StandardNode,
      task: StandardNode,
      process: StandardNode,
    }),
    []
  );

  // Register custom edge renderers
  const edgeTypes = useMemo(
    () => ({
      default: ThemedEdge,
      straight: ThemedEdge,
      step: ThemedEdge,
      smoothstep: ThemedEdge,
    }),
    []
  );

  useEffect(() => {
    const fetchSharedDiagram = async () => {
      setLoading(true);
      try {
        const { data, error: dbError } = await supabase
          .from("shares")
          .select(`
            diagram_id,
            diagrams (
              id,
              title,
              diagram_type,
              diagram_data,
              is_public
            )
          `)
          .eq("share_token", token)
          .single();

        if (dbError || !data || !data.diagrams) {
          throw new Error("This shared diagram does not exist or has been set to private.");
        }

        const diagram = data.diagrams as any;
        if (!diagram.is_public) {
          throw new Error("This diagram is no longer shared publicly.");
        }

        setTitle(diagram.title);
        setDiagramType(diagram.diagram_type);

        const diagData = diagram.diagram_data as DiagramData;
        if (diagData.settings) {
          setSettings(diagData.settings);
          if (diagData.settings.colorPalette && diagData.settings.colorPalette !== "Default" && diagData.settings.colorPalette !== "Auto Color") {
            setPalette(diagData.settings.colorPalette as any);
          }
        }

        // Map nodes/edges to React Flow format
        const mappedNodes = (diagData.nodes || []).map((n) => ({
          id: n.id,
          type: n.type,
          data: { 
            label: n.label, 
            description: n.description, 
            metadata: n.metadata, 
            type: n.type,
            settings: diagData.settings || {},
            nodeSize: "md",
            textSize: "md",
            palette: "indigo"
          },
          position: n.position || { x: 0, y: 0 },
        }));

        const mappedEdges = (diagData.edges || []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: e.type || "default",
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            color: theme === "dark" ? "#64748b" : "#94a3b8" 
          },
          style: {
            stroke: theme === "dark" ? "#64748b" : "#94a3b8",
            strokeWidth: 2,
          }
        }));

        setNodes(mappedNodes);
        setEdges(mappedEdges);

      } catch (err: any) {
        setError(err.message || "Failed to load shared diagram.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedDiagram();
  }, [token]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 select-none">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-slate-450 mt-4 font-semibold tracking-wide">Syncing shared diagram structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen px-6 bg-slate-950 text-slate-100 text-center select-none">
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-full mb-5">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-xs text-slate-450 max-w-sm mb-6 leading-relaxed">
          {error}
        </p>
        <Link
          href="/"
          className="py-2.5 px-5 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-xs font-semibold text-white transition-all"
        >
          Go to DiagramForge AI
        </Link>
      </div>
    );
  }

  // 1. Resolve Background Class styles
  const bgTemplate = settings.backgroundTemplate || "";
  let bgClass = theme === "dark" ? "bg-slate-950" : "bg-slate-50";
  
  if (bgTemplate === "White") bgClass = "bg-white";
  else if (bgTemplate === "Transparent") bgClass = "bg-transparent";
  else if (bgTemplate === "Light gray") bgClass = "bg-slate-100";
  else if (bgTemplate === "Dark") bgClass = "bg-slate-950";
  else if (bgTemplate === "Blueprint") bgClass = "bg-[#0b192f]";

  // 2. Resolve Background grid component settings
  const showGrid = bgTemplate === "Grid" || bgTemplate === "Dotted grid" || bgTemplate === "Blueprint" || !bgTemplate;
  const gridVariant = bgTemplate === "Grid" ? BackgroundVariant.Lines : BackgroundVariant.Dots;
  
  let gridColor = theme === "dark" ? "#1e293b" : "#cbd5e1";
  if (bgTemplate === "Blueprint") {
    gridColor = "rgba(56, 189, 248, 0.06)";
  }

  // 3. Resolve Aspect Ratio boundaries presets
  const ratio = settings.aspectRatio || "Web (16:9) / Freeform";
  let ratioStyle: React.CSSProperties = {};
  let ratioClass = "w-full h-full";

  if (ratio === "16:9") {
    ratioClass = "w-full max-w-[1060px] aspect-[16/9] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  } else if (ratio === "16:10") {
    ratioClass = "w-full max-w-[1060px] aspect-[16/10] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  } else if (ratio === "4:3") {
    ratioClass = "w-full max-w-[850px] aspect-[4/3] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  } else if (ratio === "1:1") {
    ratioClass = "w-full max-w-[700px] aspect-square shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  } else if (ratio === "A4 Portrait" || ratio === "A3 Portrait" || ratio === "Letter Portrait") {
    ratioClass = "w-full max-w-[650px] aspect-[1/1.414] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  } else if (ratio === "A4 Landscape" || ratio === "A3 Landscape" || ratio === "Letter Landscape") {
    ratioClass = "w-full max-w-[920px] aspect-[1.414/1] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  } else if (ratio === "9:16") {
    ratioClass = "w-full max-w-[400px] aspect-[9/16] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  } else if (ratio === "4:5") {
    ratioClass = "w-full max-w-[500px] aspect-[4/5] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  } else if (ratio === "Custom") {
    const customW = settings.aspectRatioCustom?.width || 800;
    const customH = settings.aspectRatioCustom?.height || 600;
    ratioStyle = { width: `${customW}px`, height: `${customH}px` };
    ratioClass = "shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg overflow-hidden";
  }

  const customBgColor = settings.customColors?.background;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-screen">
      {/* Viewer Header */}
      <header className="px-6 py-3.5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center justify-between gap-4 select-none shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-primary to-indigo-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              DiagramForge<span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="h-4.5 w-px bg-slate-900" />
          <div className="overflow-hidden">
            <h1 className="text-xs font-bold text-white leading-tight truncate">{title}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex py-0.5 px-1 bg-slate-900 border border-slate-850 text-[8px] font-bold text-slate-450 uppercase tracking-wide">
                {diagramType}
              </span>
              <span className="text-[8px] font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded font-mono">
                <Eye className="h-2.5 w-2.5" />
                READ-ONLY VIEWER
              </span>
            </div>
          </div>
        </div>

        {/* Header Options */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-slate-900/60 hover:bg-slate-850 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Node Size Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none">Node</span>
            <select
              value={nodeSize}
              onChange={(e) => setNodeSize(e.target.value as "sm" | "md" | "lg")}
              className="bg-transparent border-none text-slate-300 focus:outline-none cursor-pointer text-xs font-semibold [&>option]:bg-slate-950 [&>option]:text-slate-200"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          {/* Text Size Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none">Text</span>
            <select
              value={textSize}
              onChange={(e) => setTextSize(e.target.value as "sm" | "md" | "lg")}
              className="bg-transparent border-none text-slate-300 focus:outline-none cursor-pointer text-xs font-semibold [&>option]:bg-slate-950 [&>option]:text-slate-200"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          {/* Color Palette Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none">Palette</span>
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value as any)}
              className="bg-transparent border-none text-slate-300 focus:outline-none cursor-pointer text-xs font-semibold [&>option]:bg-slate-950 [&>option]:text-slate-200"
            >
              <option value="indigo">Cool Indigo</option>
              <option value="emerald">Forest Emerald</option>
              <option value="amber">Warm Amber</option>
              <option value="rose">Sunset Rose</option>
            </select>
          </div>

          <button
            onClick={copyLink}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-450" />
                <span>Copied Link</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Copy Share Link</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Shared Read-Only Canvas */}
      <div 
        className={`flex-1 flex items-center justify-center p-6 overflow-auto transition-colors duration-200 ${bgClass}`}
        style={customBgColor ? { backgroundColor: customBgColor } : undefined}
      >
        <div className={`relative ${ratioClass}`} style={ratioStyle}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false} // Disable dragging in read-only mode
            nodesConnectable={false} // Disable connects in read-only mode
            elementsSelectable={false}
            defaultEdgeOptions={{
              type: "default",
              style: { strokeWidth: 2 },
            }}
            fitView
          >
            {showGrid && (
              <Background 
                variant={gridVariant} 
                size={1} 
                gap={24} 
                color={gridColor} 
              />
            )}
            <Controls showInteractive={false} className="shadow-2xl" />
            <MiniMap 
              nodeColor={() => "#6366f1"}
              maskColor="rgba(15, 23, 42, 0.6)"
              className="hidden sm:block shadow-2xl" 
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
