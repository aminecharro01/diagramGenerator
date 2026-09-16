import React, { useMemo, useEffect } from "react";
import { 
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useReactFlow,
  type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection
} from "@xyflow/react";

import StandardNode from "./nodes/StandardNode";
import EntityNode from "./nodes/EntityNode";
import UmlClassNode from "./nodes/UmlClassNode";
import ActorNode from "./nodes/ActorNode";
import UseCaseNode from "./nodes/UseCaseNode";
import NoteNode from "./nodes/NoteNode";
import ThemedEdge from "./edges/ThemedEdge";

interface DiagramCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onSelectNode: (node: Node | null) => void;
  onSelectEdge: (edge: Edge | null) => void;
  theme?: "light" | "dark";
  settings?: any;
}

// Inner helper component that triggers auto-fit on diagram changes
function AutoFitHandler({ nodesLength }: { nodesLength: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodesLength > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.15, duration: 400 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodesLength, fitView]);

  return null;
}

export default function DiagramCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectNode,
  onSelectEdge,
  theme = "dark",
  settings = {},
}: DiagramCanvasProps) {
  
  // Register custom edge connection renderers
  const edgeTypes = useMemo(
    () => ({
      default: ThemedEdge,
      straight: ThemedEdge,
      step: ThemedEdge,
      smoothstep: ThemedEdge,
    }),
    []
  );

  // Register custom node card components
  const nodeTypes = useMemo(
    () => ({
      service: StandardNode,
      database: StandardNode,
      cache: StandardNode,
      queue: StandardNode,
      user: StandardNode,
      external: StandardNode,
      actor: ActorNode,
      usecase: UseCaseNode,
      class: UmlClassNode,
      note: NoteNode,
      entity: EntityNode,
      system: StandardNode,
      decision: StandardNode,
      gateway: StandardNode,
      start: StandardNode,
      event: StandardNode,
      end: StandardNode,
      frontend: StandardNode,
      backend: StandardNode,
      api: StandardNode,
      task: StandardNode,
      process: StandardNode,
      package: StandardNode,
      component: StandardNode,
      interface: StandardNode,
      device: StandardNode,
      node: StandardNode,
      state: StandardNode,
      choice: StandardNode,
      fork: StandardNode,
      join: StandardNode,
      milestone: StandardNode,
      topic: StandardNode,
      subtopic: StandardNode,
      router: StandardNode,
      switch: StandardNode,
      firewall: StandardNode,
      compute: StandardNode,
      storage: StandardNode,
      manager: StandardNode,
      employee: StandardNode,
      department: StandardNode,
    }),
    []
  );

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    onSelectNode(node);
  };

  const handleEdgeClick = (_event: React.MouseEvent, edge: Edge) => {
    onSelectEdge(edge);
  };

  const handlePaneClick = () => {
    onSelectNode(null);
    onSelectEdge(null);
  };

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

  // 3. Aspect Ratio container - made flexible so large diagrams are never clipped or hidden
  const ratio = settings.aspectRatio || "Web (16:9) / Freeform";
  let ratioStyle: React.CSSProperties = { width: "100%", height: "100%" };
  let ratioClass = "w-full h-full";

  if (ratio === "Custom") {
    const customW = settings.aspectRatioCustom?.width || 1200;
    const customH = settings.aspectRatioCustom?.height || 800;
    ratioStyle = { width: `${customW}px`, height: `${customH}px` };
    ratioClass = "shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-lg";
  }

  const customBgColor = settings.customColors?.background;

  return (
    <div 
      className={`w-full h-full flex-1 relative overflow-hidden transition-colors duration-200 ${bgClass}`}
      style={customBgColor ? { backgroundColor: customBgColor } : undefined}
    >
      <div className={`relative ${ratioClass}`} style={ratioStyle}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15, includeHiddenNodes: false }}
          minZoom={0.05}
          maxZoom={2.5}
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: "default",
            style: { strokeWidth: 2 },
          }}
        >
          <AutoFitHandler nodesLength={nodes.length} />
          {showGrid && (
            <Background 
              variant={gridVariant} 
              size={1} 
              gap={24} 
              color={gridColor} 
            />
          )}
          <Controls showInteractive={false} className="shadow-2xl !bg-slate-900 !border-slate-800" />
          <MiniMap 
            nodeColor={() => "#6366f1"}
            maskColor="rgba(15, 23, 42, 0.6)"
            className="hidden sm:block shadow-2xl !bg-slate-950 !border-slate-800" 
          />
        </ReactFlow>
      </div>
    </div>
  );
}
