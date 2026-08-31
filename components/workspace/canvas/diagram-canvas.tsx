"use client";

import React, { useMemo } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  addEdge,
  BackgroundVariant
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
}: DiagramCanvasProps) {
  
  // Register edge configurations
  const edgeTypes = useMemo(
    () => ({
      default: ThemedEdge,
      straight: ThemedEdge,
      step: ThemedEdge,
      smoothstep: ThemedEdge,
    }),
    []
  );

  // Register node configurations
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
    // Clear selection when user clicks empty canvas space
    onSelectNode(null);
    onSelectEdge(null);
  };

  return (
    <div className={`w-full h-full flex-1 relative select-none transition-colors duration-200 ${theme === "dark" ? "bg-slate-950" : "bg-slate-50"}`}>
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
        <Background variant={BackgroundVariant.Dots} size={1} gap={24} color={theme === "dark" ? "#1e293b" : "#cbd5e1"} />
        <Controls showInteractive={false} className="shadow-2xl" />
        <MiniMap 
          nodeColor={() => "#6366f1"}
          maskColor="rgba(15, 23, 42, 0.6)"
          className="hidden sm:block shadow-2xl" 
        />
      </ReactFlow>
    </div>
  );
}
