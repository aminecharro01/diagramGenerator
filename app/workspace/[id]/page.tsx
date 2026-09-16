"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  useNodesState, useEdgesState, addEdge, type Node, type Edge, type Connection, MarkerType 
} from "@xyflow/react";
import { createClient } from "@/lib/supabase/client";
import { DiagramData, DiagramSettings } from "@/types/diagram";
import { layoutDiagram } from "@/lib/diagram/layout";
import { downloadJson, downloadSvg, downloadPng } from "@/lib/diagram/export";
import { parsePlantUml } from "@/lib/diagram/plantuml-parser";

import DiagramCanvas from "@/components/workspace/canvas/diagram-canvas";
import PropertiesPanel from "@/components/workspace/properties-panel";
import ExportModal from "@/components/workspace/export-modal";
import SamplesModal from "@/components/workspace/samples-modal";

import { 
  Sparkles, ArrowLeft, Loader2, Undo, Redo, ZoomIn, ZoomOut, Maximize, 
  Play, Save, ChevronRight, Layout, Settings, Share2, Download, Copy,
  Check, AlertCircle, RefreshCw, History, Code, MessageSquare, Shield,
  Globe, X, Terminal, Sun, Moon, Database, HelpCircle, Layers, Folder,
  Plus, Trash2, Clock, AlignJustify, BookOpen, Upload, FileCode
} from "lucide-react";

function ServerIcon(props: any) { return <span className="text-[10px]">🖥️</span>; }
function ActivityIcon() { return <span className="text-[10px]">📈</span>; }
function CodeIcon() { return <span className="text-[10px]">💻</span>; }
function UserIcon() { return <span className="text-[10px]">👤</span>; }
function ChevronRightIcon() { return <span className="text-[10px]">➡️</span>; }
function PlayIcon() { return <span className="text-[10px]">▶️</span>; }
function DatabaseIcon() { return <span className="text-[10px]">🗄️</span>; }
function LayersIcon() { return <span className="text-[10px]">📚</span>; }
function FolderIcon() { return <span className="text-[10px]">📁</span>; }
function GitCommitIcon() { return <span className="text-[10px]">📍</span>; }
function RefreshCwIcon() { return <span className="text-[10px]">🔄</span>; }
function GlobeIcon() { return <span className="text-[10px]">🌍</span>; }
function HelpCircleIcon() { return <span className="text-[10px]">❓</span>; }
function NetworkIcon() { return <span className="text-[10px]">🌐</span>; }
function CloudIcon() { return <span className="text-[10px]">☁️</span>; }
function ClockIcon() { return <span className="text-[10px]">🕒</span>; }

// List of 20 Diagram Types sorted by popularity/usage
const DIAGRAM_TYPES = [
  { value: "architecture diagram", name: "Architecture Diagram", desc: "Visualize system components, databases, APIs, and relationships.", icon: ServerIcon },
  { value: "flowchart", name: "Flowchart", desc: "Define processes, decisions, and sequential workflow operations.", icon: ActivityIcon },
  { value: "class diagram", name: "Class Diagram", desc: "Generate UML classes with attributes, methods, and relationships.", icon: CodeIcon },
  { value: "use case diagram", name: "Use Case Diagram", desc: "Generate actors, use cases, and interaction boundaries.", icon: UserIcon },
  { value: "sequence diagram", name: "Sequence Diagram", desc: "Generate chronological sequence of message transfers.", icon: ChevronRightIcon },
  { value: "activity diagram", name: "Activity Diagram", desc: "Model parallel activity flows, forks, and joins.", icon: PlayIcon },
  { value: "entity relationship diagram (erd)", name: "Entity Relationship Diagram (ERD)", desc: "Model database entities, keys, and cardinalities.", icon: DatabaseIcon },
  { value: "component diagram", name: "Component Diagram", desc: "UML structural organization of component blocks.", icon: LayersIcon },
  { value: "deployment diagram", name: "Deployment Diagram", desc: "Model server hosting nodes, devices, and artifacts.", icon: ServerIcon },
  { value: "package diagram", name: "Package Diagram", desc: "Group files, folders, or modules inside packages.", icon: FolderIcon },
  { value: "state machine diagram", name: "State Machine Diagram", desc: "Model event-triggered state transitions.", icon: GitCommitIcon },
  { value: "data flow diagram (dfd)", name: "Data Flow Diagram (DFD)", desc: "Model data input/output flows through processes.", icon: RefreshCwIcon },
  { value: "system context diagram", name: "System Context Diagram", desc: "Overview of actors and external system dependencies.", icon: GlobeIcon },
  { value: "mind map", name: "Mind Map", desc: "Brainstorm topics branching radially from center.", icon: HelpCircleIcon },
  { value: "network diagram", name: "Network Diagram", desc: "Visualize routers, switches, subnets, and host devices.", icon: NetworkIcon },
  { value: "infrastructure diagram", name: "Infrastructure Diagram", desc: "Cloud infrastructure mapping (AWS/Azure/GCP).", icon: CloudIcon },
  { value: "database schema", name: "Database Schema", desc: "Visual structure of tables, primary keys, and types.", icon: DatabaseIcon },
  { value: "bpmn-style process diagram", name: "BPMN-style Process Diagram", desc: "Standard business process workflow swimlanes.", icon: ActivityIcon },
  { value: "timeline", name: "Timeline", desc: "Chronological roadmap events and milestones.", icon: ClockIcon },
  { value: "organization chart", name: "Organization Chart", desc: "Manager-employee reporting structures.", icon: UserIcon },
];

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
  const [activeTab, setActiveTab] = useState<"ai" | "customize" | "code" | "history">("ai");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "error">("synced");

  // AI Generation & Refinement state
  const [generationMode, setGenerationMode] = useState<"refine" | "generate">("refine");
  const [newPrompt, setNewPrompt] = useState("");
  const [newType, setNewType] = useState("architecture diagram");
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

  // Export & Samples Modals
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [samplesModalOpen, setSamplesModalOpen] = useState(false);

  // Theme and legacy scaling states
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [nodeSize, setNodeSize] = useState<"sm" | "md" | "lg">("md");
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">("md");
  const [palette, setPalette] = useState<"indigo" | "emerald" | "amber" | "rose">("indigo");

  // Customize settings state
  const [settings, setSettings] = useState<DiagramSettings>({
    visualStyle: "Modern",
    nodeDesign: "Icon + text inside node",
    nodeDetail: "Standard",
    useIcons: true,
    iconSource: "Technology icons",
    colorPalette: "Default",
    customColors: {
      background: "",
      node: "",
      border: "",
      text: "",
      connector: "",
      accent: "",
    },
    fontFamily: "Inter",
    fontSize: "Medium",
    fontWeight: "Semibold",
    layoutDirection: "Left → Right",
    nodeSpacing: "Normal",
    connectorSpacing: "Normal",
    aspectRatio: "Web (16:9) / Freeform",
    aspectRatioCustom: {
      width: 800,
      height: 600,
      dpi: 72,
    },
    readability: "Balanced",
    autoOptimizeReadability: true,
    diagramDensity: "Medium",
    connectorStyle: "Smart",
    arrowStyle: "Standard",
    lineThickness: "Medium",
    lineType: "Solid",
    relationshipLabels: "Always visible",
    backgroundTemplate: "Dotted grid",
  });

  // Custom style presets state
  const [presets, setPresets] = useState<any[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("style");

  // Read initial theme from localStorage/documentElement
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

  // Sync theme changes
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

  // Preset manager localStorage lifecycle
  useEffect(() => {
    try {
      const stored = localStorage.getItem("diagram_design_presets");
      if (stored) {
        setPresets(JSON.parse(stored));
      } else {
        const defaults = [
          {
            id: "blueprint-preset",
            name: "Classic Blueprint",
            settings: {
              visualStyle: "Blueprint",
              nodeDesign: "Icon + text inside node",
              nodeDetail: "Standard",
              useIcons: true,
              colorPalette: "Default",
              fontFamily: "JetBrains Mono",
              fontSize: "Medium",
              fontWeight: "Semibold",
              layoutDirection: "Left → Right",
              nodeSpacing: "Spacious",
              connectorSpacing: "Normal",
              aspectRatio: "A4 Landscape",
              backgroundTemplate: "Blueprint",
            }
          },
          {
            id: "minimal-preset",
            name: "Modern Minimalist",
            settings: {
              visualStyle: "Minimal",
              nodeDesign: "Text only",
              nodeDetail: "Compact",
              useIcons: false,
              colorPalette: "Default",
              fontFamily: "Inter",
              fontSize: "Small",
              fontWeight: "Regular",
              layoutDirection: "Top → Bottom",
              nodeSpacing: "Compact",
              connectorSpacing: "Compact",
              aspectRatio: "Web (16:9) / Freeform",
              backgroundTemplate: "White",
            }
          }
        ];
        localStorage.setItem("diagram_design_presets", JSON.stringify(defaults));
        setPresets(defaults);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync settings and sizing changes to React Flow node attributes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          settings: settings,
          nodeSize: nodeSize,
          textSize: settings.fontSize === "Small" ? "sm" : settings.fontSize === "Large" ? "lg" : "md",
          palette: settings.colorPalette === "Auto Color" ? "indigo" : settings.colorPalette || palette,
        },
      }))
    );
  }, [settings, nodeSize, palette, setNodes]);

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

        // Route curved vs straight vs step routers
        const connStyle = (settings.connectorStyle || "smart").toLowerCase();
        let edgeType = "smoothstep";
        if (connStyle === "curved") edgeType = "default";
        else if (connStyle === "straight") edgeType = "straight";
        else if (connStyle === "step" || connStyle === "elbow") edgeType = "step";
        else if (connStyle === "smart" || connStyle === "smooth") edgeType = "smoothstep";

        const hasCustomDash = settings.lineType === "Dashed" || settings.lineType === "Dotted";

        return {
          ...edge,
          type: edge.type || edgeType,
          animated: edge.animated,
          style: {
            ...edge.style,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            strokeDasharray: hasCustomDash ? strokeDasharray : (edge.style?.strokeDasharray || strokeDasharray),
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          },
        };
      })
    );
  }, [theme, settings, setEdges]);

  // Refs for autosave hooks
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Notifications Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Save diagram details to Supabase (PUT request)
  const saveToServer = useCallback(async (
    currentNodes: Node[], 
    currentEdges: Edge[], 
    currentTitle: string,
    createVersion = false,
    versionPrompt = ""
  ) => {
    setSaveStatus("saving");
    try {
      const cleanNodes = currentNodes.map((n) => ({
        id: n.id,
        label: (n.data?.label as string) || "",
        type: n.type || "service",
        description: (n.data?.description as string) || "",
        position: n.position,
        targetPosition: n.targetPosition,
        sourcePosition: n.sourcePosition,
        metadata: (n.data?.metadata as Record<string, any>) || {},
      }));

      const cleanEdges = currentEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: typeof e.label === "string" ? e.label : "",
        type: e.type || "default",
        animated: e.animated,
        style: e.style,
      }));

      const diagramData: DiagramData = {
        title: currentTitle,
        type: diagramType,
        nodes: cleanNodes,
        edges: cleanEdges,
        settings: settings, // Include customization settings!
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
  }, [diagramId, diagramType, settings, supabase]);

  // Debounced auto-save hook triggers on canvas updates
  const queueAutosave = useCallback((updatedNodes: Node[], updatedEdges: Edge[], updatedTitle: string) => {
    if (initialLoadRef.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      saveToServer(updatedNodes, updatedEdges, updatedTitle);
    }, 2500);
  }, [diagramType, settings, saveToServer]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Update history stacks for undo/redo
  const pushToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (initialLoadRef.current) return;
    setPast((prev) => [...prev, { nodes: newNodes, edges: newEdges }]);
    setFuture([]);
  }, []);

  // PlantUML and sample diagram loader
  const handleLoadPuml = useCallback((pumlCode: string, sampleTitle?: string) => {
    try {
      const parsed = parsePlantUml(pumlCode);
      const diagramTitle = sampleTitle || parsed.title || title;
      
      const layouted = layoutDiagram({
        ...parsed,
        title: diagramTitle,
        settings: settings,
      }, settings);

      const mappedNodes: Node[] = layouted.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: {
          label: n.label,
          description: n.description,
          metadata: n.metadata,
          type: n.type,
          settings: settings,
        },
        position: n.position || { x: 0, y: 0 },
        targetPosition: n.targetPosition,
        sourcePosition: n.sourcePosition,
      }));

      const mappedEdges: Edge[] = layouted.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: e.type || "default",
        animated: e.animated,
        style: e.style,
        markerEnd: { type: MarkerType.ArrowClosed, color: theme === "dark" ? "#64748b" : "#94a3b8" },
      }));

      pushToHistory(nodes, edges);
      setNodes(mappedNodes);
      setEdges(mappedEdges);
      setTitle(diagramTitle);
      setDiagramType(parsed.type || "architecture diagram");
      setJsonText(JSON.stringify(layouted, null, 2));

      saveToServer(mappedNodes, mappedEdges, diagramTitle, true, `Loaded: ${diagramTitle}`);
      showToast(`Loaded "${diagramTitle}" successfully!`);
    } catch (err: any) {
      console.error("Failed to load PlantUML diagram:", err);
      showToast(`Failed to parse PlantUML: ${err.message}`, "error");
    }
  }, [nodes, edges, settings, theme, title, pushToHistory, saveToServer]);

  // Fetch Diagram Details on Mount
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
        if (diagData.settings) {
          setSettings(diagData.settings);
          if (diagData.settings.colorPalette && diagData.settings.colorPalette !== "Default") {
            setPalette(diagData.settings.colorPalette as any);
          }
        }
        
        // Ensure nodes have standard React Flow formats
        const mappedNodes = (diagData.nodes || []).map((n) => ({
          id: n.id,
          type: n.type,
          data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type, settings: diagData.settings },
          position: n.position || { x: 0, y: 0 },
          targetPosition: n.targetPosition,
          sourcePosition: n.sourcePosition,
        }));

        const mappedEdges = (diagData.edges || []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: e.label,
          type: e.type || "default",
          animated: e.animated,
          style: e.style,
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

  // Fetch version list helper
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

  // React Flow onConnect event
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
  }, [nodes, edges, theme, queueAutosave, pushToHistory, title]);

  // Properties Updates handler
  const handleUpdateNode = useCallback((nodeId: string, updatedFields: Partial<Node>) => {
    pushToHistory(nodes, edges);
    
    setNodes((nds) => {
      const updated = nds.map((node) => {
        if (node.id === nodeId) {
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

  // Undo & Redo implementations
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
      settings: settings, // Include settings during re-alignment!
    };

    const reCalculated = layoutDiagram(currentDiagram, settings);
    
    const reNodes = reCalculated.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type, settings: settings },
      position: n.position,
      targetPosition: n.targetPosition,
      sourcePosition: n.sourcePosition,
    }));

    const reEdges = reCalculated.edges.map((e) => ({
      ...e,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      animated: e.animated,
      markerEnd: { type: MarkerType.ArrowClosed, color: theme === "dark" ? "#64748b" : "#94a3b8" },
    }));

    setNodes(reNodes);
    setEdges(reEdges);
    saveToServer(reNodes, reEdges, title);
    showToast("Re-aligned layout nodes.");
  };

  // AI Refinement Submitter
  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim()) return;

    setAiLoading(true);
    setAiError(null);
    
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
        settings: settings,
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
        data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type, settings: settings },
        position: n.position,
        targetPosition: n.targetPosition,
        sourcePosition: n.sourcePosition,
      }));

      const refinedEdges = (refinedData.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: e.type || "default",
        animated: e.animated,
        style: e.style,
        markerEnd: { type: MarkerType.ArrowClosed, color: theme === "dark" ? "#64748b" : "#94a3b8" },
      }));

      pushToHistory(nodes, edges);
      setNodes(refinedNodes);
      setEdges(refinedEdges);
      setJsonText(JSON.stringify(refinedData, null, 2));
      
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

  // AI Re-generation Submitter (custom styles + prompt before creation)
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    setAiLoading(true);
    setAiError(null);
    
    const steps = [
      "Analyzing layout requirements...",
      "Generating block architecture...",
      "Mapping relation paths...",
      "Optimizing coordinates..."
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
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newPrompt,
          diagramType: newType,
          settings: settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate diagram");

      const generated = data.diagram as DiagramData;

      const newNodes = (generated.nodes || []).map((n) => ({
        id: n.id,
        type: n.type,
        data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type, settings: settings },
        position: n.position,
        targetPosition: n.targetPosition,
        sourcePosition: n.sourcePosition,
      }));

      const newEdges = (generated.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: e.type || "default",
        animated: e.animated,
        style: e.style,
        markerEnd: { type: MarkerType.ArrowClosed, color: theme === "dark" ? "#64748b" : "#94a3b8" },
      }));

      pushToHistory(nodes, edges);
      setNodes(newNodes);
      setEdges(newEdges);
      setDiagramType(newType);
      setOriginalPrompt(newPrompt);
      setJsonText(JSON.stringify(generated, null, 2));

      await saveToServer(newNodes, newEdges, title, true, `Generated: ${newPrompt}`);
      showToast("Diagram generated successfully!");
      setNewPrompt("");
      setGenerationMode("refine"); // switch back to refinement console
    } catch (err: any) {
      setAiError(err.message || "An AI error occurred.");
    } finally {
      clearInterval(timer);
      setAiLoading(false);
    }
  };

  // Manual JSON Code edit parser
  const handleCodeChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val) as DiagramData;
      
      if (!parsed.nodes || !parsed.edges) {
        setJsonError("JSON must contain 'nodes' and 'edges' arrays.");
        return;
      }

      setJsonError(null);

      const parsedNodes = parsed.nodes.map((n) => ({
        id: n.id,
        type: n.type || "service",
        data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type, settings: settings },
        position: n.position || { x: 0, y: 0 },
        targetPosition: n.targetPosition,
        sourcePosition: n.sourcePosition,
      }));

      const parsedEdges = parsed.edges.map((e) => ({
        id: e.id || `edge-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: e.type || "default",
        animated: e.animated,
        style: e.style,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      }));

      pushToHistory(nodes, edges);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      
      queueAutosave(parsedNodes, parsedEdges, title);
    } catch (e: any) {
      setJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  // Restore specific version snapshot
  const handleRestoreVersion = async (version: any) => {
    const diagData = version.diagram_data as DiagramData;
    
    const mappedNodes = (diagData.nodes || []).map((n) => ({
      id: n.id,
      type: n.type,
      data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type, settings: diagData.settings || settings },
      position: n.position,
      targetPosition: n.targetPosition,
      sourcePosition: n.sourcePosition,
    }));

    const mappedEdges = (diagData.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      type: e.type || "default",
      animated: e.animated,
      style: e.style,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
    }));

    pushToHistory(nodes, edges);
    setNodes(mappedNodes);
    setEdges(mappedEdges);
    if (diagData.settings) setSettings(diagData.settings);
    setJsonText(JSON.stringify(diagData, null, 2));

    await saveToServer(mappedNodes, mappedEdges, title, true, `Restored Version ${version.version_number}`);
    await fetchVersions();
    showToast(`Restored Version ${version.version_number}`);
  };

  // Link Sharing toggles
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

  // Local storage Presets CRUD handlers
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName,
      settings: settings,
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("diagram_design_presets", JSON.stringify(updated));
    setNewPresetName("");
    showToast(`Preset "${newPreset.name}" saved!`);
  };

  const handleLoadPreset = (preset: any) => {
    setSettings(preset.settings);
    
    // Auto-layout and save to server
    setTimeout(() => {
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
        settings: preset.settings,
      };
      const reCalculated = layoutDiagram(currentDiagram, preset.settings);
      
      const mappedNodes = reCalculated.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type, settings: preset.settings },
        position: n.position,
        targetPosition: n.targetPosition,
        sourcePosition: n.sourcePosition,
      }));

      const mappedEdges = reCalculated.edges.map((e) => ({
        ...e,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        animated: e.animated,
        markerEnd: { type: MarkerType.ArrowClosed, color: theme === "dark" ? "#64748b" : "#94a3b8" },
      }));

      setNodes(mappedNodes);
      setEdges(mappedEdges);
      saveToServer(mappedNodes, mappedEdges, title);
    }, 100);

    showToast(`Loaded preset "${preset.name}".`);
  };

  const handleDeletePreset = (presetId: string, name: string) => {
    const updated = presets.filter((p) => p.id !== presetId);
    setPresets(updated);
    localStorage.setItem("diagram_design_presets", JSON.stringify(updated));
    showToast(`Preset "${name}" removed.`);
  };

  // One-click spacing optimization when diagrams get too dense for printing
  const isA4 = settings.aspectRatio?.includes("A4") || settings.aspectRatio?.includes("A3");
  const isDense = nodes.length > 10;
  const showWarning = isA4 && isDense;

  const optimizeForA4 = () => {
    const updatedSettings = {
      ...settings,
      nodeSpacing: "Compact",
      nodeDetail: "Compact",
      readability: "Highly Readable",
      autoOptimizeReadability: true,
      layoutDirection: "Top → Bottom", // Prefer vertical layout for Portrait printing
    };
    setSettings(updatedSettings);
    
    setTimeout(() => {
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
        settings: updatedSettings,
      };
      const reCalculated = layoutDiagram(currentDiagram, updatedSettings);
      
      const mappedNodes = reCalculated.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: { label: n.label, description: n.description, metadata: n.metadata, type: n.type, settings: updatedSettings },
        position: n.position,
        targetPosition: n.targetPosition,
        sourcePosition: n.sourcePosition,
      }));

      const mappedEdges = reCalculated.edges.map((e) => ({
        ...e,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        animated: e.animated,
        markerEnd: { type: MarkerType.ArrowClosed, color: theme === "dark" ? "#64748b" : "#94a3b8" },
      }));

      setNodes(mappedNodes);
      setEdges(mappedEdges);
      saveToServer(mappedNodes, mappedEdges, title);
    }, 100);

    showToast("Optimized coordinates spacing for A4 printing.");
  };

  // Predefined custom color changes handler
  const handleCustomColorChange = (key: string, value: string) => {
    const updatedColors = {
      ...settings.customColors,
      [key]: value,
    };
    const updatedSettings = {
      ...settings,
      colorPalette: "Custom", // Auto switch palette selection to custom
      customColors: updatedColors,
    };
    setSettings(updatedSettings);
    queueAutosave(nodes, edges, title);
  };

  const handleSettingsChange = (key: keyof DiagramSettings, value: any) => {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(updatedSettings);
    queueAutosave(nodes, edges, title);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-screen">
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl border border-slate-900 bg-slate-950/90 backdrop-blur-md shadow-2xl flex items-center gap-2 max-w-sm">
          <Sparkles className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
          <span className="text-xs font-semibold text-white">{toast.message}</span>
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
              <span className="inline-flex items-center py-0.5 px-1.5 rounded bg-slate-900 border border-slate-850 text-[8px] font-bold text-slate-450 uppercase tracking-wide">
                {diagramType}
              </span>
              <span className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                {saveStatus === "saving" ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    Saving...
                  </>
                ) : saveStatus === "error" ? (
                  <>
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    Sync Error
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 text-emerald-450" />
                    Synced
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

          {/* Sizing warning helper */}
          {showWarning && (
            <button
              onClick={optimizeForA4}
              className="py-1.5 px-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all hover:bg-amber-500/20"
              title="Click to automatically optimize node coordinates spacing for print sizes."
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Optimize Spacing</span>
            </button>
          )}

          {/* Responsive Preview Format Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none">Format</span>
            <select
              value={settings.aspectRatio || "Web (16:9) / Freeform"}
              onChange={(e) => handleSettingsChange("aspectRatio", e.target.value)}
              className="bg-transparent border-none text-slate-300 focus:outline-none cursor-pointer text-xs font-semibold [&>option]:bg-slate-950 [&>option]:text-slate-200"
            >
              <option value="Web (16:9) / Freeform">Desktop (Freeform)</option>
              <option value="16:9">Presentation (16:9)</option>
              <option value="1:1">Social (1:1)</option>
              <option value="9:16">Mobile (9:16)</option>
              <option value="A4 Portrait">A4 Portrait</option>
              <option value="A4 Landscape">A4 Landscape</option>
              <option value="A3 Landscape">A3 Landscape</option>
              <option value="Custom">Custom Size</option>
            </select>
          </div>

          {/* Samples & Import Modal Trigger */}
          <button
            onClick={() => setSamplesModalOpen(true)}
            className="py-1.5 px-3 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Open E-learning diagrams library or import PlantUML"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span>Library & Import</span>
          </button>

          <button
            onClick={handleAutoLayout}
            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
            title="Auto layout with Dagre engine"
          >
            <Layout className="h-3.5 w-3.5" />
            <span>Format</span>
          </button>

          <button
            onClick={() => setShareModalOpen(true)}
            className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>

          {/* Export button */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="py-1.5 px-3.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden max-w-full">
        
        {/* Left pane: Control panels (AI refine, Customize, Code editor, History) */}
        <div className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col shrink-0 select-none">
          {/* Tabs header */}
          <div className="flex border-b border-slate-900 bg-slate-950/40 p-0.5 overflow-x-auto select-none no-scrollbar">
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "ai"
                  ? "bg-slate-900 border border-slate-850 text-white shadow-sm"
                  : "text-slate-550 hover:text-slate-350"
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>Refine</span>
            </button>
            <button
              onClick={() => setActiveTab("customize")}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "customize"
                  ? "bg-slate-900 border border-slate-850 text-white shadow-sm"
                  : "text-slate-550 hover:text-slate-355"
              }`}
            >
              <Settings className="h-3 w-3" />
              <span>Style</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "code"
                  ? "bg-slate-900 border border-slate-850 text-white shadow-sm"
                  : "text-slate-550 hover:text-slate-355"
              }`}
            >
              <Code className="h-3 w-3" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-slate-900 border border-slate-850 text-white shadow-sm"
                  : "text-slate-555 hover:text-slate-355"
              }`}
            >
              <History className="h-3 w-3" />
              <span>History</span>
            </button>
          </div>

          {/* Tab content area */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col max-h-full scrollbar-thin">
            {activeTab === "ai" && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex bg-slate-900/50 p-1 border border-slate-900 rounded-xl select-none">
                    <button
                      onClick={() => setGenerationMode("refine")}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        generationMode === "refine" ? "bg-slate-950 text-white border border-slate-900" : "text-slate-500"
                      }`}
                    >
                      Tweak/Edit
                    </button>
                    <button
                      onClick={() => setGenerationMode("generate")}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        generationMode === "generate" ? "bg-slate-950 text-white border border-slate-900" : "text-slate-500"
                      }`}
                    >
                      Re-generate
                    </button>
                  </div>

                  {generationMode === "refine" ? (
                    <>
                      <div>
                        <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1">
                          <Sparkles className="h-4.5 w-4.5 text-primary" />
                          <span>AI Refine Modifications</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Tweak existing diagrams inline. Explain modifications like adding databases, removing API blocks, etc.
                        </p>
                      </div>

                      {aiError && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-[11px] rounded-xl leading-relaxed">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{aiError}</span>
                        </div>
                      )}

                      <form onSubmit={handleRefine} className="space-y-4">
                        <textarea
                          rows={4}
                          value={refinePrompt}
                          onChange={(e) => setRefinePrompt(e.target.value)}
                          disabled={aiLoading}
                          placeholder="e.g. 'Add Redis cache linked to backend', 'Add OAuth workflow layers'..."
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all text-slate-200"
                        />
                        <button
                          type="submit"
                          disabled={aiLoading || !refinePrompt.trim()}
                          className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 transition-all font-sans"
                        >
                          {aiLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Refining...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              <span>Apply Tweak</span>
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-xs font-bold text-white mb-1.5">AI Create & Generate</h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Re-generate the diagram entirely based on the prompt below, integrating all layout, ratio, and custom style options chosen in the <b>Style</b> tab.
                        </p>
                      </div>

                      {aiError && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-[11px] rounded-xl leading-relaxed">
                          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                          <span>{aiError}</span>
                        </div>
                      )}

                      <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Diagram Type
                          </label>
                          <select
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                          >
                            {DIAGRAM_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Prompt / Description
                          </label>
                          <textarea
                            rows={4}
                            value={newPrompt}
                            onChange={(e) => setNewPrompt(e.target.value)}
                            disabled={aiLoading}
                            placeholder="Describe what you want to construct..."
                            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all text-slate-200"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={aiLoading || !newPrompt.trim()}
                          className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 transition-all font-sans"
                        >
                          {aiLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                              <span>Generate Diagram</span>
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>

                {aiLoading && (
                  <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                    <span className="text-xs font-bold text-white">{aiStep}</span>
                  </div>
                )}
              </div>
            )}

            {/* CUSTOMIZATION PANEL TAB */}
            {activeTab === "customize" && (
              <div className="space-y-4 text-xs select-none">
                
                {/* 1. General Style Accordion */}
                <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "style" ? null : "style")}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-white hover:bg-slate-900/40 transition-all text-xs"
                  >
                    <span>General Style & Node Design</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${openSection === "style" ? "rotate-90" : ""}`} />
                  </button>

                  {openSection === "style" && (
                    <div className="p-4 border-t border-slate-900 space-y-4 bg-slate-950/50">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Visual Style</label>
                        <select
                          value={settings.visualStyle || "Modern"}
                          onChange={(e) => handleSettingsChange("visualStyle", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Modern">Modern (Clean)</option>
                          <option value="Minimal">Minimal (Borderless)</option>
                          <option value="Professional">Professional</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Technical">Technical</option>
                          <option value="Academic">Academic</option>
                          <option value="Hand-drawn">Hand-drawn (Dashed)</option>
                          <option value="Blueprint">Blueprint (Deep Blue)</option>
                          <option value="Glassmorphism">Glassmorphism</option>
                          <option value="Flat">Flat Colors</option>
                          <option value="High Contrast">High Contrast</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Node Design Layout</label>
                        <select
                          value={settings.nodeDesign || "Icon + text inside node"}
                          onChange={(e) => handleSettingsChange("nodeDesign", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Icon + text inside node">Icon + Text Inside (Default)</option>
                          <option value="Icon above + text below">Icon Above + Text Below</option>
                          <option value="Text inside node">Text Inside (No Icon)</option>
                          <option value="Icon only">Icon Only</option>
                          <option value="Text only">Text Only</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Node Detail Level</label>
                        <select
                          value={settings.nodeDetail || "Standard"}
                          onChange={(e) => handleSettingsChange("nodeDetail", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Minimal">Minimal (Title Only)</option>
                          <option value="Compact">Compact</option>
                          <option value="Standard">Standard</option>
                          <option value="Detailed">Detailed</option>
                          <option value="Very Detailed">Very Detailed</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Icons & Readability Accordion */}
                <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "icons" ? null : "icons")}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-white hover:bg-slate-900/40 transition-all text-xs"
                  >
                    <span>Icons & Readability</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${openSection === "icons" ? "rotate-90" : ""}`} />
                  </button>

                  {openSection === "icons" && (
                    <div className="p-4 border-t border-slate-900 space-y-4.5 bg-slate-950/50">
                      <div className="flex items-center justify-between select-none">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Use Icons</span>
                        <input
                          type="checkbox"
                          checked={settings.useIcons !== false}
                          onChange={(e) => handleSettingsChange("useIcons", e.target.checked)}
                          className="rounded border-slate-800 bg-slate-900 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        />
                      </div>

                      {settings.useIcons !== false && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Icon Categories</label>
                          <select
                            value={settings.iconSource || "Technology icons"}
                            onChange={(e) => handleSettingsChange("iconSource", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                          >
                            <option value="Technology icons">Technology Icons</option>
                            <option value="Generic icons">Generic Icons</option>
                            <option value="UML icons">UML Symbols</option>
                            <option value="Cloud provider icons">Cloud Provider (AWS/Azure)</option>
                            <option value="Database icons">Database Blocks</option>
                          </select>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Readability Mode</label>
                        <select
                          value={settings.readability || "Balanced"}
                          onChange={(e) => handleSettingsChange("readability", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Compact">Compact Spacing</option>
                          <option value="Balanced">Balanced</option>
                          <option value="Highly Readable">Highly Readable (Wide Spacing)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between select-none">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Auto Optimize Spacing</span>
                        <input
                          type="checkbox"
                          checked={settings.autoOptimizeReadability !== false}
                          onChange={(e) => handleSettingsChange("autoOptimizeReadability", e.target.checked)}
                          className="rounded border-slate-800 bg-slate-900 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Colors & Palettes Accordion */}
                <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "colors" ? null : "colors")}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-white hover:bg-slate-900/40 transition-all text-xs"
                  >
                    <span>Colors & Themes</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${openSection === "colors" ? "rotate-90" : ""}`} />
                  </button>

                  {openSection === "colors" && (
                    <div className="p-4 border-t border-slate-900 space-y-4 bg-slate-950/50">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Color Palette</label>
                        <select
                          value={settings.colorPalette || "Default"}
                          onChange={(e) => {
                            handleSettingsChange("colorPalette", e.target.value);
                            if (e.target.value !== "Custom" && e.target.value !== "Auto Color" && e.target.value !== "Default") {
                              setPalette(e.target.value.toLowerCase() as any);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Default">Indigo (Default)</option>
                          <option value="Emerald">Emerald Green</option>
                          <option value="Amber">Amber Orange</option>
                          <option value="Rose">Rose Pink</option>
                          <option value="Auto Color">Auto Color (AI Semantic)</option>
                          <option value="Custom">Custom Colors...</option>
                        </select>
                      </div>

                      {/* Custom colors pickers block */}
                      {settings.colorPalette === "Custom" && (
                        <div className="border border-slate-900 p-3 rounded-lg bg-slate-950 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">Background</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={settings.customColors?.background || ""}
                                onChange={(e) => handleCustomColorChange("background", e.target.value)}
                                placeholder="#000000"
                                className="w-20 px-1 py-0.5 bg-slate-900 border border-slate-800 text-[10.5px] font-mono focus:outline-none text-slate-200 text-center"
                              />
                              <input
                                type="color"
                                value={settings.customColors?.background || "#0b0f19"}
                                onChange={(e) => handleCustomColorChange("background", e.target.value)}
                                className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">Node fill</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={settings.customColors?.node || ""}
                                onChange={(e) => handleCustomColorChange("node", e.target.value)}
                                placeholder="#ffffff"
                                className="w-20 px-1 py-0.5 bg-slate-900 border border-slate-800 text-[10.5px] font-mono focus:outline-none text-slate-200 text-center"
                              />
                              <input
                                type="color"
                                value={settings.customColors?.node || "#0d1324"}
                                onChange={(e) => handleCustomColorChange("node", e.target.value)}
                                className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">Border stroke</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={settings.customColors?.border || ""}
                                onChange={(e) => handleCustomColorChange("border", e.target.value)}
                                placeholder="#e2e8f0"
                                className="w-20 px-1 py-0.5 bg-slate-900 border border-slate-880 text-[10.5px] font-mono focus:outline-none text-slate-200 text-center"
                              />
                              <input
                                type="color"
                                value={settings.customColors?.border || "#1f2937"}
                                onChange={(e) => handleCustomColorChange("border", e.target.value)}
                                className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">Connector line</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={settings.customColors?.connector || ""}
                                onChange={(e) => handleCustomColorChange("connector", e.target.value)}
                                placeholder="#64748b"
                                className="w-20 px-1 py-0.5 bg-slate-900 border border-slate-880 text-[10.5px] font-mono focus:outline-none text-slate-200 text-center"
                              />
                              <input
                                type="color"
                                value={settings.customColors?.connector || "#64748b"}
                                onChange={(e) => handleCustomColorChange("connector", e.target.value)}
                                className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Typography Accordion */}
                <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "fonts" ? null : "fonts")}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-white hover:bg-slate-900/40 transition-all text-xs"
                  >
                    <span>Typography & Font Sizes</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${openSection === "fonts" ? "rotate-90" : ""}`} />
                  </button>

                  {openSection === "fonts" && (
                    <div className="p-4 border-t border-slate-900 space-y-4 bg-slate-950/50">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Font Family</label>
                        <select
                          value={settings.fontFamily || "Inter"}
                          onChange={(e) => handleSettingsChange("fontFamily", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Inter">Inter (Sans)</option>
                          <option value="Poppins">Poppins (Modern)</option>
                          <option value="Roboto">Roboto</option>
                          <option value="IBM Plex Sans">IBM Plex Sans</option>
                          <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
                          <option value="System">System UI</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Font Size Scale</label>
                        <select
                          value={settings.fontSize || "Medium"}
                          onChange={(e) => handleSettingsChange("fontSize", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Small">Small</option>
                          <option value="Medium">Medium</option>
                          <option value="Large">Large</option>
                          <option value="Extra Large">Extra Large</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Font Weight</label>
                        <select
                          value={settings.fontWeight || "Semibold"}
                          onChange={(e) => handleSettingsChange("fontWeight", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Regular">Regular</option>
                          <option value="Medium">Medium</option>
                          <option value="Semibold">Semibold</option>
                          <option value="Bold">Bold</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Layout & Spacing Accordion */}
                <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "layout" ? null : "layout")}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-white hover:bg-slate-900/40 transition-all text-xs"
                  >
                    <span>Layout & Node Spacing</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${openSection === "layout" ? "rotate-90" : ""}`} />
                  </button>

                  {openSection === "layout" && (
                    <div className="p-4 border-t border-slate-900 space-y-4 bg-slate-950/50">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Layout Direction</label>
                        <select
                          value={settings.layoutDirection || "Left → Right"}
                          onChange={(e) => {
                            handleSettingsChange("layoutDirection", e.target.value);
                            // Auto re-align on direction switch
                            setTimeout(handleAutoLayout, 100);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Left → Right">Left → Right (Horizontal)</option>
                          <option value="Top → Bottom">Top → Bottom (Vertical)</option>
                          <option value="Right → Left">Right → Left</option>
                          <option value="Bottom → Top">Bottom → Top</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Node Grid Spacing</label>
                        <select
                          value={settings.nodeSpacing || "Normal"}
                          onChange={(e) => {
                            handleSettingsChange("nodeSpacing", e.target.value);
                            setTimeout(handleAutoLayout, 100);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Compact">Compact</option>
                          <option value="Normal">Normal</option>
                          <option value="Spacious">Spacious</option>
                          <option value="Extra Spacious">Extra Spacious</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Connector & Arrows Accordion */}
                <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "connectors" ? null : "connectors")}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-white hover:bg-slate-900/40 transition-all text-xs"
                  >
                    <span>Connectors & Edge Lines</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${openSection === "connectors" ? "rotate-90" : ""}`} />
                  </button>

                  {openSection === "connectors" && (
                    <div className="p-4 border-t border-slate-900 space-y-4 bg-slate-950/50">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Line Router Type</label>
                        <select
                          value={settings.connectorStyle || "Smart"}
                          onChange={(e) => handleSettingsChange("connectorStyle", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Smart">Smart Bezier</option>
                          <option value="Straight">Straight Lines</option>
                          <option value="Step">Orthogonal (Step)</option>
                          <option value="Curved">Curved Bezier</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Line Thickness</label>
                        <select
                          value={settings.lineThickness || "Medium"}
                          onChange={(e) => handleSettingsChange("lineThickness", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Thin">Thin</option>
                          <option value="Medium">Medium</option>
                          <option value="Thick">Thick</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Line Pattern</label>
                        <select
                          value={settings.lineType || "Solid"}
                          onChange={(e) => handleSettingsChange("lineType", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Solid">Solid</option>
                          <option value="Dashed">Dashed</option>
                          <option value="Dotted">Dotted</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Canvas Background Accordion */}
                <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "bg" ? null : "bg")}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-white hover:bg-slate-900/40 transition-all text-xs"
                  >
                    <span>Canvas Background & Format</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${openSection === "bg" ? "rotate-90" : ""}`} />
                  </button>

                  {openSection === "bg" && (
                    <div className="p-4 border-t border-slate-900 space-y-4 bg-slate-950/50">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Background Template</label>
                        <select
                          value={settings.backgroundTemplate || "Dotted grid"}
                          onChange={(e) => handleSettingsChange("backgroundTemplate", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-200 cursor-pointer focus:outline-none"
                        >
                          <option value="Dotted grid">Dotted Grid</option>
                          <option value="Grid">Solid Grid Lines</option>
                          <option value="Blueprint">Blueprint (Navy blue grid)</option>
                          <option value="White">Plain White (Reports)</option>
                          <option value="Light gray">Plain Light Gray</option>
                          <option value="Dark">Plain Dark Slate</option>
                          <option value="Transparent">Transparent</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. Presets CRUD Manager Accordion */}
                <div className="border border-slate-900 bg-slate-900/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "presets" ? null : "presets")}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-white hover:bg-slate-900/40 transition-all text-xs"
                  >
                    <span>Saved Presets & Templates</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${openSection === "presets" ? "rotate-90" : ""}`} />
                  </button>

                  {openSection === "presets" && (
                    <div className="p-4 border-t border-slate-900 space-y-4.5 bg-slate-950/50">
                      
                      {/* Presets List */}
                      {presets.length === 0 ? (
                        <div className="text-[10px] text-slate-500 italic text-center py-2">No custom presets saved yet.</div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {presets.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-2 p-2 bg-slate-900/60 border border-slate-850 rounded-lg hover:border-slate-700 transition-all">
                              <button
                                onClick={() => handleLoadPreset(p)}
                                className="flex-1 text-left text-slate-200 font-semibold truncate hover:text-white"
                              >
                                {p.name}
                              </button>
                              <button
                                onClick={() => handleDeletePreset(p.id, p.name)}
                                className="text-slate-500 hover:text-red-400 p-1 cursor-pointer transition-all"
                                title="Delete preset"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-slate-900 pt-3 mt-1.5">
                        <form onSubmit={handleSavePreset} className="space-y-2">
                          <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Save Current Style</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              placeholder="e.g. 'My Corporate Light'..."
                              className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-xs placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-primary text-slate-200"
                            />
                            <button
                              type="submit"
                              disabled={!newPresetName.trim()}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-[10.5px] font-bold cursor-pointer transition-all"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>

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
                  className="flex-1 w-full bg-slate-900 border border-slate-850 rounded-xl p-3.5 font-mono text-[9.5px] text-slate-355 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none overflow-y-auto leading-normal h-full"
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
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectNode={handleSelectNode}
              onSelectEdge={handleSelectEdge}
              theme={theme}
              settings={settings}
            />
          </div>
        </div>

        {/* Right side: properties inspector panel */}
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

      {/* --- EXPORT MODAL --- */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title={title}
        diagramData={{
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
            animated: e.animated,
            style: e.style,
          })),
          settings,
        }}
        theme={theme}
        showToast={showToast}
      />

      {/* --- SAMPLES & PLANTUML IMPORT MODAL --- */}
      <SamplesModal
        isOpen={samplesModalOpen}
        onClose={() => setSamplesModalOpen(false)}
        onSelectPuml={handleLoadPuml}
        showToast={showToast}
      />
    </div>
  );
}
