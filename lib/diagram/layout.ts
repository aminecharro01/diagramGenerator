import dagre from "dagre";
import { DiagramData, DiagramNode, DiagramEdge } from "@/types/diagram";

export function layoutDiagram(diagram: DiagramData, settings?: any): DiagramData {
  const g = new dagre.graphlib.Graph();

  // 1. Resolve Rank Direction based on settings or smart architectural defaults
  let rankdir = "LR"; // Default to Left-to-Right for rich UML/Cloud architectures
  
  const customDir = settings?.layoutDirection || "";
  if (customDir === "Left → Right" || customDir === "LR" || customDir === "horizontal" || customDir === "Horizontal") {
    rankdir = "LR";
  } else if (customDir === "Top → Bottom" || customDir === "TB" || customDir === "vertical" || customDir === "Vertical") {
    rankdir = "TB";
  } else if (customDir === "Right → Left" || customDir === "RL") {
    rankdir = "RL";
  } else if (customDir === "Bottom → Top" || customDir === "BT") {
    rankdir = "BT";
  } else {
    const diagType = (diagram.type || "").toLowerCase().trim();
    if (
      diagType === "flowchart" ||
      diagType === "activity diagram" ||
      diagType === "bpmn-style process diagram" ||
      diagType === "timeline" ||
      diagType === "organization chart"
    ) {
      rankdir = "TB";
    } else {
      rankdir = "LR";
    }
  }

  // 2. Resolve React Flow Handle Positioning
  let targetPosition = "top";
  let sourcePosition = "bottom";
  let defaultSourceHandle = "bottom-out";
  let defaultTargetHandle = "top-in";

  if (rankdir === "LR") {
    targetPosition = "left";
    sourcePosition = "right";
    defaultSourceHandle = "right-out";
    defaultTargetHandle = "left-in";
  } else if (rankdir === "RL") {
    targetPosition = "right";
    sourcePosition = "left";
    defaultSourceHandle = "left-in";
    defaultTargetHandle = "right-out";
  } else if (rankdir === "TB") {
    targetPosition = "top";
    sourcePosition = "bottom";
    defaultSourceHandle = "bottom-out";
    defaultTargetHandle = "top-in";
  } else if (rankdir === "BT") {
    targetPosition = "bottom";
    sourcePosition = "top";
    defaultSourceHandle = "top-in";
    defaultTargetHandle = "bottom-out";
  }

  // 3. Node & Connector Spacing tuned for high readability
  let nodeSep = 90;
  let rankSep = 180;
  
  const spacing = settings?.nodeSpacing || "Normal";
  if (spacing === "Compact") {
    nodeSep = 60;
    rankSep = 130;
  } else if (spacing === "Spacious") {
    nodeSep = 140;
    rankSep = 260;
  } else if (spacing === "Extra Spacious") {
    nodeSep = 200;
    rankSep = 360;
  }

  // Configure Dagre Graph with optimal layout parameters
  g.setGraph({
    rankdir: rankdir,
    nodesep: nodeSep,
    edgesep: 50,
    ranksep: rankSep,
    ranker: "network-simplex",
    align: "UL",
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Helper to calculate exact bounding box dimensions for Dagre layout
  const computeNodeDimensions = (node: DiagramNode) => {
    let width = 250;
    let height = 95;

    const nodeType = (node.type || "").toLowerCase();

    if (nodeType === "usecase") {
      width = 240;
      height = 70;
    } else if (nodeType === "actor" || nodeType === "user") {
      width = 160;
      height = 120;
    } else if (nodeType === "class") {
      width = 290;
      const attrs = node.metadata?.attributes || [];
      const methods = node.metadata?.methods || [];
      height = 75 + attrs.length * 26 + methods.length * 24;
    } else if (nodeType === "entity" || nodeType === "database schema") {
      width = 290;
      const attrs = node.metadata?.attributes || [];
      height = 80 + attrs.length * 30;
    } else if (nodeType === "note") {
      width = 240;
      const textLen = (node.description || "").length;
      height = Math.max(90, Math.min(220, 60 + Math.ceil(textLen / 25) * 18));
    } else if (nodeType === "decision" || nodeType === "gateway") {
      width = 170;
      height = 115;
    } else if (nodeType === "package") {
      width = 230;
      height = 135;
    } else if (nodeType === "milestone") {
      width = 210;
      height = 85;
    }

    if (node.metadata?.tech || node.metadata?.layer) {
      height += 24;
    }

    return { width, height };
  };

  // Add nodes to Dagre graph
  diagram.nodes.forEach((node) => {
    const { width, height } = computeNodeDimensions(node);
    g.setNode(node.id, { width, height });
  });

  // Add edges to Dagre graph
  diagram.edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate layout coordinates
  dagre.layout(g);

  // Map calculated values back to nodes with directional handle positioning
  const layoutedNodes: DiagramNode[] = diagram.nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    const { width, height } = computeNodeDimensions(node);

    return {
      ...node,
      targetPosition,
      sourcePosition,
      position: {
        x: Math.round(dagreNode.x - width / 2),
        y: Math.round(dagreNode.y - height / 2),
      },
    };
  });

  // Map edges with proper sourceHandle, targetHandle, and smoothstep routing
  const preferredConnector = settings?.connectorStyle || "Smart";
  let edgeType = "smoothstep";
  if (preferredConnector === "Straight") edgeType = "straight";
  else if (preferredConnector === "Curved") edgeType = "default";
  else if (preferredConnector === "Step") edgeType = "step";

  const layoutedEdges: DiagramEdge[] = diagram.edges.map((edge) => {
    return {
      ...edge,
      type: edge.type && edge.type !== "default" ? edge.type : edgeType,
      sourceHandle: edge.sourceHandle || defaultSourceHandle,
      targetHandle: edge.targetHandle || defaultTargetHandle,
    };
  });

  return {
    ...diagram,
    nodes: layoutedNodes,
    edges: layoutedEdges,
  };
}
