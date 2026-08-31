import React, { useMemo } from "react";
import { 
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection
} from "@xyflow/react";

import StandardNode from "./nodes/StandardNode";
import EntityNode from "./nodes/EntityNode";
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
  settings?: any; // Customizable visual settings configuration payload
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
    gridColor = "rgba(56, 189, 248, 0.06)"; // Blueprint lines opacity color
  }

  // 3. Resolve Aspect Ratio boundaries presets
  const ratio = settings.aspectRatio || "Web (16:9) / Freeform";
  let ratioStyle: React.CSSProperties = {};
  let ratioClass = "w-full h-full"; // Default is full freeform viewport

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
    <div 
      className={`w-full h-full flex-1 flex items-center justify-center p-6 overflow-auto transition-colors duration-200 ${bgClass}`}
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
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: "default",
            style: { strokeWidth: 2 },
          }}
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
  );
}
