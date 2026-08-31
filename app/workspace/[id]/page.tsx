"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  useNodesState, useEdgesState, addEdge, type Node, type Edge, type Connection, MarkerType 
} from "@xyflow/react";
import { createClient } from "@/lib/supabase/client";
import { DiagramData } from "@/types/diagram";
import { layoutDiagram } from "@/lib/diagram/layout";
import { downloadJson, downloadSvg, downloadPng } from "@/lib/diagram/export";

import DiagramCanvas from "@/components/workspace/canvas/diagram-canvas";
import PropertiesPanel from "@/components/workspace/properties-panel";

import { 
  Sparkles, ArrowLeft, Loader2, Undo, Redo, ZoomIn, ZoomOut, Maximize, 
  Play, Save, ChevronRight, Layout, Settings, Share2, Download, Copy,
  Check, AlertCircle, RefreshCw, History, Code, MessageSquare, Shield,
  Globe, X, Terminal, Sun, Moon
} from "lucide-react";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const diagramId = params.id as string;
  const supabase = createClient();

  // Core diagram metadata
  const [title, setTitle] = useState("Loading...");
  const [description, setDescription] = useState("");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // React Flow Nodes/Edges States
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const handleSelectNode = useCallback((node: Node | null) => {
    setSelectedNode(node);
    if (node) setSelectedEdge(null);
  }, []);

  const handleSelectEdge = useCallback((edge: Edge | null) => {
    setSelectedEdge(edge);
    if (edge) setSelectedNode(null);
  }, []);

  // Undo/Redo history stack
  const [past, setPast] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);

  // Workspace layout state
  const [activeTab, setActiveTab] = useState<"ai" | "code" | "history">("ai");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "error">("synced");

  // AI Refinement state
  const [refinePrompt, setRefinePrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);

  // Sharing states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  // Version history states
  const [versions, setVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);

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
  }, [nodeSize, textSize, palette, setNodes]);

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
  }, [theme, setEdges]);

  // Refs for debouncing save operations
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // General Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Fetch Diagram details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data: userSession } = await supabase.auth.getUser();
        if (!userSession.user) {
          router.push("/login");
          return;
        }

        const { data: diagram, error } = await supabase
          .from("diagrams")
          .select("*")
          .eq("id", diagramId)
          .single();

        if (error || !diagram) {
          showToast("Diagram not found or access denied.", "error");
          router.push("/dashboard");
          return;
        }

        setTitle(diagram.title);
        setDescription(diagram.description || "");
        setDiagramType(diagram.diagram_type);
        setOriginalPrompt(diagram.prompt || "");
        setIsPublic(diagram.is_public);

        const diagData = diagram.diagram_data as DiagramData;
        
        // Ensure nodes have standard React Flow formats
        const mappedNodes = (diagData.nodes || []).map((n) => ({
          id: n.id,
          type: n.type,
          data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type },
          position: n.position || { x: 0, y: 0 },
        }));

        const mappedEdges = (diagData.edges || []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: e.type || "default",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
        }));

        setNodes(mappedNodes);
        setEdges(mappedEdges);
        setJsonText(JSON.stringify(diagData, null, 2));

        // Retrieve sharing credentials
        const { data: share } = await supabase
          .from("shares")
          .select("share_token")
          .eq("diagram_id", diagramId)
          .maybeSingle();

        if (share) {
          setShareToken(share.share_token);
        }

        // Initialize history stack after load
        setTimeout(() => {
          initialLoadRef.current = false;
        }, 1000);

      } catch (err) {
        console.error(err);
      }
    };

    fetchDetails();
  }, [diagramId]);

  // 2. Fetch versions helper
  const fetchVersions = async () => {
    setVersionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("diagram_versions")
        .select("*")
        .eq("diagram_id", diagramId)
        .order("version_number", { ascending: false });

      if (!error && data) {
        setVersions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVersionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchVersions();
    }
  }, [activeTab]);

  // 3. Save diagram details to Supabase (PUT request)
  const saveToServer = async (
    currentNodes: Node[], 
    currentEdges: Edge[], 
    currentTitle: string,
    createVersion = false,
    versionPrompt = ""
  ) => {
    setSaveStatus("saving");
    try {
      // Re-map nodes back to our clean structural types
      const cleanNodes = currentNodes.map((n) => ({
        id: n.id,
        label: (n.data?.label as string) || "",
        type: n.type || "service",
        description: (n.data?.description as string) || "",
        position: n.position,
        metadata: (n.data?.metadata as Record<string, any>) || {},
      }));

      const cleanEdges = currentEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : "",
        type: e.type || "default",
      }));

      const diagramData: DiagramData = {
        title: currentTitle,
        type: diagramType,
        nodes: cleanNodes,
        edges: cleanEdges,
      };

      const res = await fetch("/api/diagrams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diagramId,
          title: currentTitle,
          diagramData,
          createVersion,
          versionPrompt,
        }),
      });

      if (!res.ok) throw new Error("Failed to save diagram");
      
      setSaveStatus("synced");
      setJsonText(JSON.stringify(diagramData, null, 2));
    } catch (e) {
      console.error("Save error:", e);
      setSaveStatus("error");
    }
  };

  // Debounced auto-save hook triggers on canvas updates
  const queueAutosave = useCallback((updatedNodes: Node[], updatedEdges: Edge[], updatedTitle: string) => {
    if (initialLoadRef.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      saveToServer(updatedNodes, updatedEdges, updatedTitle);
    }, 2500); // 2.5 second debounce delay
  }, [diagramType]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Update history stacks for undo/redo
  const pushToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (initialLoadRef.current) return;
    
    // Save snapshot of previous states
    setPast((prev) => [...prev, { nodes, edges }]);
    setFuture([]); // clear redo stack on new action
  }, [nodes, edges]);

  // 4. React Flow Events Handlers
  const handleNodesChangeWrapper = (changes: any) => {
    // Intercept changes to trigger save/history operations
    const hasPositionOrDimChange = changes.some(
      (c: any) => c.type === "position" && c.dragging === false
    );
    
    if (hasPositionOrDimChange) {
      pushToHistory(nodes, edges);
    }

    onNodesChange(changes);

    // Call autosave
    setNodes((currentNodes) => {
      queueAutosave(currentNodes, edges, title);
      return currentNodes;
    });
  };

  const handleEdgesChangeWrapper = (changes: any) => {
    pushToHistory(nodes, edges);
    onEdgesChange(changes);
    setEdges((currentEdges) => {
      queueAutosave(nodes, currentEdges, title);
      return currentEdges;
    });
  };

  const onConnect = useCallback((params: Connection) => {
    pushToHistory(nodes, edges);
    const newEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      type: "default",
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: theme === "dark" ? "#64748b" : "#94a3b8" 
      },
      style: {
        stroke: theme === "dark" ? "#64748b" : "#94a3b8",
        strokeWidth: 2,
      }
    };
    
    setEdges((eds) => {
      const updated = addEdge(newEdge as Edge, eds);
      queueAutosave(nodes, updated, title);
      return updated;
    });
  }, [nodes, edges, queueAutosave, pushToHistory, title]);

  // Properties Updates handler
  const handleUpdateNode = useCallback((nodeId: string, updatedFields: Partial<Node>) => {
    pushToHistory(nodes, edges);
    
    setNodes((nds) => {
      const updated = nds.map((node) => {
        if (node.id === nodeId) {
          // Merge styles
          return {
            ...node,
            ...updatedFields,
            data: {
              ...node.data,
              ...updatedFields.data,
            },
          };
        }
        return node;
      });

      queueAutosave(updated, edges, title);
      return updated;
    });

    // Update active selected node state
    setSelectedNode((curr) => {
      if (curr?.id === nodeId) {
        return {
          ...curr,
          ...updatedFields,
          data: {
            ...curr.data,
            ...updatedFields.data,
          },
        };
      }
      return curr;
    });
  }, [nodes, edges, queueAutosave, pushToHistory, title]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    pushToHistory(nodes, edges);
    setNodes((nds) => {
      const updatedNds = nds.filter((n) => n.id !== nodeId);
      setEdges((eds) => {
        const updatedEds = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
        queueAutosave(updatedNds, updatedEds, title);
        return updatedEds;
      });
      return updatedNds;
    });
    setSelectedNode(null);
    showToast("Node removed from canvas.");
  }, [nodes, edges, queueAutosave, pushToHistory, title]);

  const handleUpdateEdge = useCallback((edgeId: string, updatedFields: Partial<Edge>) => {
    pushToHistory(nodes, edges);

    setEdges((eds) => {
      const updated = eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            ...updatedFields,
            style: {
              ...edge.style,
              ...updatedFields.style,
            },
          };
        }
        return edge;
      });

      queueAutosave(nodes, updated, title);
      return updated;
    });

    // Update active selected edge state
    setSelectedEdge((curr) => {
      if (curr?.id === edgeId) {
        return {
          ...curr,
          ...updatedFields,
          style: {
            ...curr.style,
            ...updatedFields.style,
          },
        };
      }
      return curr;
    });
  }, [nodes, edges, queueAutosave, pushToHistory, title]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    pushToHistory(nodes, edges);
    setEdges((eds) => {
      const updated = eds.filter((e) => e.id !== edgeId);
      queueAutosave(nodes, updated, title);
      return updated;
    });
    setSelectedEdge(null);
    showToast("Connection relation removed.");
  }, [nodes, edges, queueAutosave, pushToHistory, title]);

  // 5. Undo & Redo implementations
  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture((prev) => [...prev, { nodes, edges }]);
    setPast(newPast);

    setNodes(previous.nodes);
    setEdges(previous.edges);
    
    saveToServer(previous.nodes, previous.edges, title);
    showToast("Action undone.");
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const newFuture = future.slice(0, future.length - 1);

    setPast((prev) => [...prev, { nodes, edges }]);
    setFuture(newFuture);

    setNodes(next.nodes);
    setEdges(next.edges);

    saveToServer(next.nodes, next.edges, title);
    showToast("Action redone.");
  };

  // Trigger manual layout algorithm re-calculation
  const handleAutoLayout = () => {
    pushToHistory(nodes, edges);
    
    const currentDiagram: DiagramData = {
      title,
      type: diagramType,
      nodes: nodes.map((n) => ({
        id: n.id,
        label: (n.data?.label as string) || "",
        type: n.type || "service",
        description: (n.data?.description as string) || "",
        position: n.position,
        metadata: (n.data?.metadata as Record<string, any>) || {},
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : "",
        type: e.type || "default",
      })),
    };

    const reCalculated = layoutDiagram(currentDiagram);
    
    const reNodes = reCalculated.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type },
      position: n.position,
    }));

    setNodes(reNodes);
    saveToServer(reNodes, edges, title);
    showToast("Re-aligned layout nodes.");
  };

  // 6. AI Refinement Submitter
  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim()) return;

    setAiLoading(true);
    setAiError(null);
    
    // Animate loader steps
    const steps = [
      "Understanding modifications request...",
      "Analyzing graph entities...",
      "Refining coordinates matrix...",
      "Redrawing canvas..."
    ];
    let stepIdx = 0;
    setAiStep(steps[0]);
    const timer = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setAiStep(steps[stepIdx]);
      }
    }, 1500);

    try {
      const currentDiagram: DiagramData = {
        title,
        type: diagramType,
        nodes: nodes.map((n) => ({
          id: n.id,
          label: (n.data?.label as string) || "",
          type: n.type || "service",
          description: (n.data?.description as string) || "",
          position: n.position,
          metadata: (n.data?.metadata as Record<string, any>) || {},
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: typeof e.label === "string" ? e.label : "",
          type: e.type || "default",
        })),
      };

      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingDiagram: currentDiagram,
          instruction: refinePrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refinement failed");

      // Apply refinements
      const refinedData = data.diagram as DiagramData;

      const refinedNodes = (refinedData.nodes || []).map((n) => ({
        id: n.id,
        type: n.type,
        data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type },
        position: n.position,
      }));

      const refinedEdges = (refinedData.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: e.type || "default",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      }));

      pushToHistory(nodes, edges);
      setNodes(refinedNodes);
      setEdges(refinedEdges);
      setJsonText(JSON.stringify(refinedData, null, 2));
      
      // Save changes immediately and commit a database version snapshot
      await saveToServer(refinedNodes, refinedEdges, title, true, refinePrompt);
      
      setRefinePrompt("");
      showToast("Diagram modified successfully.");
    } catch (err: any) {
      setAiError(err.message || "An AI error occurred.");
    } finally {
      clearInterval(timer);
      setAiLoading(false);
    }
  };

  // 7. Manual JSON Code edit parser
  const handleCodeChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val) as DiagramData;
      
      // Basic validations
      if (!parsed.nodes || !parsed.edges) {
        setJsonError("JSON must contain 'nodes' and 'edges' arrays.");
        return;
      }

      setJsonError(null);

      // Map positions and details
      const parsedNodes = parsed.nodes.map((n) => ({
        id: n.id,
        type: n.type || "service",
        data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type },
        position: n.position || { x: 0, y: 0 },
      }));

      const parsedEdges = parsed.edges.map((e) => ({
        id: e.id || `edge-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: e.type || "default",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      }));

      pushToHistory(nodes, edges);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      
      // Save
      queueAutosave(parsedNodes, parsedEdges, title);

    } catch (e: any) {
      setJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  // 8. Restore specific version snapshot
  const handleRestoreVersion = async (version: any) => {
    const diagData = version.diagram_data as DiagramData;
    
    const mappedNodes = (diagData.nodes || []).map((n) => ({
      id: n.id,
      type: n.type,
      data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type },
      position: n.position,
    }));

    const mappedEdges = (diagData.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: e.type || "default",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
    }));

    pushToHistory(nodes, edges);
    setNodes(mappedNodes);
    setEdges(mappedEdges);
    setJsonText(JSON.stringify(diagData, null, 2));

    // Save and commit restoration record
    await saveToServer(mappedNodes, mappedEdges, title, true, `Restored Version ${version.version_number}`);
    
    // Refresh history
    await fetchVersions();
    showToast(`Restored Version ${version.version_number}`);
  };

  // 9. Link Sharing toggles
  const handleEnableShare = async () => {
    setShareLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagramId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to share");

      setShareToken(data.shareToken);
      setIsPublic(true);
      showToast("Link sharing enabled.");
    } catch (e: any) {
      showToast("Error generating share link", "error");
    } finally {
      setShareLoading(false);
    }
  };

  const handleDisableShare = async () => {
    setShareLoading(true);
    try {
      const res = await fetch(`/api/share?diagramId=${diagramId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke sharing");

      setShareToken(null);
      setIsPublic(false);
      showToast("Sharing link revoked.");
    } catch (e: any) {
      showToast("Error revoking share link", "error");
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url);
    showToast("Share link copied to clipboard!");
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-screen">
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl border bg-card/90 backdrop-blur-md shadow-2xl flex items-center gap-2 max-w-sm animate-bounce">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Workspace Header Toolbar */}
      <header className="px-6 py-3.5 border-b border-slate-900 bg-slate-950 flex items-center justify-between gap-4 select-none shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 border border-slate-850 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white leading-tight truncate">{title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center py-0.5 px-1.5 rounded bg-slate-900 border border-slate-850 text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                {diagramType}
              </span>
              <span className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                {saveStatus === "saving" ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    Saving changes...
                  </>
                ) : saveStatus === "error" ? (
                  <>
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    Error syncing
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 text-emerald-450" />
                    Cloud Synced
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-900/40 border border-slate-900 rounded-xl p-0.5">
            <button
              onClick={handleUndo}
              disabled={past.length === 0}
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
              title="Redo"
            >
              <Redo className="h-3.5 w-3.5" />
            </button>
          </div>

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
            onClick={handleAutoLayout}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl text-xs font-semibold text-slate-350 flex items-center gap-1.5 cursor-pointer transition-all"
            title="Auto layout with Dagre engine"
          >
            <Layout className="h-3.5 w-3.5" />
            <span>Format Diagram</span>
          </button>

          <button
            onClick={() => setShareModalOpen(true)}
            className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>

          {/* Export dropdown */}
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

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden max-w-full">
        
        {/* Left pane: Control panels (AI refine, Code editor, History) */}
        <div className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col shrink-0 select-none">
          {/* Tabs header */}
          <div className="flex border-b border-slate-900 bg-slate-950/40 p-1">
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "ai"
                  ? "bg-slate-900 border border-slate-850 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>AI Refine</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "code"
                  ? "bg-slate-900 border border-slate-850 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Code className="h-3 w-3" />
              <span>JSON Code</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-slate-900 border border-slate-850 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <History className="h-3 w-3" />
              <span>Versions</span>
            </button>
          </div>

          {/* Tab content area */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col max-h-full">
            {activeTab === "ai" && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div>
                  <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    <span>AI Assistant Refinement</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Write instructions to adjust components. AI updates the existing model without regenerating the whole structure.
                  </p>
                </div>

                {aiError && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-[11px] rounded-xl leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                <form onSubmit={handleRefine} className="space-y-4.5 mt-auto">
                  <textarea
                    rows={4}
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    disabled={aiLoading}
                    placeholder="e.g. 'Add Redis cache linked to the backend API', 'Add authentication validation steps'..."
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !refinePrompt.trim()}
                    className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 transition-all"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Refining...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        <span>Apply Instruction</span>
                      </>
                    )}
                  </button>
                </form>

                {aiLoading && (
                  <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                    <span className="text-xs font-bold text-white">{aiStep}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "code" && (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                <div className="shrink-0">
                  <h3 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                    <Terminal className="h-4.5 w-4.5 text-primary" />
                    <span>Raw Schema Editor</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Manually update JSON. Edges and layout coordinates recompile automatically.
                  </p>
                </div>

                {jsonError && (
                  <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-[9.5px] font-mono leading-normal break-all">
                    {jsonError}
                  </div>
                )}

                <textarea
                  value={jsonText}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="flex-1 w-full bg-slate-900 border border-slate-850 rounded-xl p-3.5 font-mono text-[9.5px] text-slate-350 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none overflow-y-auto leading-normal h-full"
                />
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4 flex-1 flex flex-col max-h-full">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1.5">Version Snapshots</h3>
                  <p className="text-[10px] text-slate-500">Restore previous architectures easily without losing work.</p>
                </div>

                {versionsLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-5 w-5 text-primary animate-spin mb-2" />
                    <span className="text-[10px] text-slate-500">Syncing history...</span>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-900 rounded-xl text-slate-500 text-[10px] italic">
                    No versions found. Saving important changes creates versions automatically.
                  </div>
                ) : (
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                    {versions.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 bg-slate-900 border border-slate-850 hover:border-primary/40 rounded-xl text-left transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5 select-none">
                          <span className="text-[10px] font-bold text-white">Version {v.version_number}</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {v.prompt || "Manual update"}
                        </p>
                        <button
                          onClick={() => handleRestoreVersion(v)}
                          className="py-1 px-2.5 bg-slate-950 hover:bg-primary border border-slate-850 hover:border-primary rounded-lg text-[9px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          Restore Version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Canvas Workspace area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <DiagramCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChangeWrapper}
              onEdgesChange={handleEdgesChangeWrapper}
              onConnect={onConnect}
              onSelectNode={handleSelectNode}
              onSelectEdge={handleSelectEdge}
              theme={theme}
            />
          </div>
        </div>

        {/* Right side: properties inspector */}
        <PropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
        />
      </div>

      {/* --- SHARING MODAL --- */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6.5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-900 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Share Diagram</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Control public links access parameters.</p>
                </div>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-900">
                <div className="text-xs">
                  <span className="block font-semibold text-white">Public Share Link</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {isPublic ? "Active: Anyone with token can view." : "Disabled: Private to you."}
                  </span>
                </div>
                
                {isPublic ? (
                  <button
                    onClick={handleDisableShare}
                    disabled={shareLoading}
                    className="py-1 px-2.5 bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 rounded-md text-[10px] font-semibold text-destructive cursor-pointer transition-all"
                  >
                    Disable Link
                  </button>
                ) : (
                  <button
                    onClick={handleEnableShare}
                    disabled={shareLoading}
                    className="py-1 px-3 bg-primary hover:bg-primary/95 rounded-md text-[10px] font-semibold text-white cursor-pointer transition-all"
                  >
                    Enable Share
                  </button>
                )}
              </div>

              {isPublic && shareToken && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Cryptographic Token URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/share/${shareToken}`}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs font-mono text-slate-350 select-all focus:outline-none"
                    />
                    <button
                      onClick={copyShareLink}
                      className="p-2 border border-slate-850 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-900 mt-6">
              <button
                onClick={() => setShareModalOpen(false)}
                className="py-1.5 px-4 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-xl text-xs text-slate-300 font-semibold cursor-pointer transition-all"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
