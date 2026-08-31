"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ReactFlow, Background, Controls, MiniMap, 
  type Node, type Edge, MarkerType, BackgroundVariant 
} from "@xyflow/react";
import { createClient } from "@/lib/supabase/client";
import { DiagramData } from "@/types/diagram";
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

  const [title, setTitle] = useState("Shared Diagram");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Theme and scaling states
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [nodeSize, setNodeSize] = useState<"sm" | "md" | "lg">("md");
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">("md");
  const [palette, setPalette] = useState<"indigo" | "emerald" | "amber" | "rose">("indigo");

  // Read initial theme from localStorage/documentElement on client-side mount
  useEffect(() => {
    const storedTheme = localStorage.theme;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (storedTheme === "dark" || (!storedTheme && systemPrefersDark)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Sync theme state changes dynamically to documentElement classList
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

  // Sync size and palette changes to all loaded React Flow nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          nodeSize,
          textSize,
          palette,
        },
      }))
    );
  }, [nodeSize, textSize, palette]);

  // Sync edge style and markers when theme changes
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: theme === "dark" ? "#64748b" : "#94a3b8",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: theme === "dark" ? "#64748b" : "#94a3b8",
        },
      }))
    );
  }, [theme]);

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
        // Query joint share record using public token
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

        // Map nodes/edges to React Flow format
        const mappedNodes = (diagData.nodes || []).map((n) => ({
          id: n.id,
          type: n.type,
          data: { 
            label: n.label, 
            description: n.description, 
            metadata: n.metadata, 
            type: n.type,
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

          {/* Export options */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="py-1.5 px-3 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2.5 w-48 bg-card border border-border rounded-xl shadow-2xl py-1.5 z-[90] text-xs">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none border-b border-slate-900 mb-1">
                  Export PNG
                </div>
                <button
                  onClick={() => {
                    downloadPng(`${title}_1x.png`, 1);
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer font-medium"
                >
                  PNG (1x Quality)
                </button>
                <button
                  onClick={() => {
                    downloadPng(`${title}_2x.png`, 2);
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer font-medium"
                >
                  PNG (2x High Quality)
                </button>
                <button
                  onClick={() => {
                    downloadPng(`${title}_4x.png`, 4);
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer font-medium"
                >
                  PNG (4x Ultra Quality)
                </button>
                <div className="border-t border-slate-900 my-1"></div>
                <button
                  onClick={() => {
                    downloadSvg(`${title}.svg`);
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-900 text-slate-350 hover:text-white transition-all cursor-pointer font-medium"
                >
                  Download SVG
                </button>
                <button
                  onClick={() => {
                    const cleanNodes = nodes.map((n) => ({
                      id: n.id,
                      label: (n.data?.label as string) || "",
                      type: n.type || "service",
                      description: (n.data?.description as string) || "",
                      position: n.position,
                      metadata: (n.data?.metadata as Record<string, any>) || {},
                    }));
                    const cleanEdges = edges.map((e) => ({
                      id: e.id,
                      source: e.source,
                      target: e.target,
                      label: typeof e.label === "string" ? e.label : "",
                      type: e.type || "default",
                    }));
                    downloadJson({ title, type: diagramType, nodes: cleanNodes, edges: cleanEdges }, `${title}.json`);
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-900 text-slate-350 hover:text-white transition-all cursor-pointer font-medium"
                >
                  Download JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Shared Read-Only Canvas */}
      <div className={`flex-1 relative select-none transition-colors duration-200 ${theme === "dark" ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="absolute inset-0">
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
            <Background variant={BackgroundVariant.Dots} size={1} gap={24} color={theme === "dark" ? "#1e293b" : "#cbd5e1"} />
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
