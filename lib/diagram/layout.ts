import dagre from "dagre";
import { DiagramData } from "@/types/diagram";

export function layoutDiagram(diagram: DiagramData): DiagramData {
  const g = new dagre.graphlib.Graph();

  // Set default direction of hierarchical mapping
  let rankdir = "TB"; // Top-to-bottom for flowcharts/BPMN
  if (diagram.type === "erd" || diagram.type === "architecture") {
    rankdir = "LR"; // Left-to-right for databases & architectures
  }

  g.setGraph({
    rankdir: rankdir,
    nodesep: 120, // Increased from 80 for cleaner vertical spacing
    edgesep: 50,
    ranksep: 240, // Increased from 100 for wider horizontal layouts
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph layout calculation
  diagram.nodes.forEach((node) => {
    let width = 240; // Increased from 200
    let height = 90; // Increased from 80

    // Expand size constraints dynamically for specific nodes
    if (node.type === "entity") {
      width = 280; // Increased from 250
      const attrs = node.metadata?.attributes || [];
      height = 70 + attrs.length * 30; // Dynamic height for ERD tables
    } else if (node.type === "actor") {
      width = 160;
      height = 100;
    } else if (node.type === "decision" || node.type === "gateway") {
      width = 160;
      height = 110;
    }

    g.setNode(node.id, { width, height });
  });

  // Add edges to mapping
  diagram.edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate layout coordinates
  dagre.layout(g);

  // Map calculated values back to nodes
  const layoutedNodes = diagram.nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;
    
    let width = 240; // Matches calculations above
    let height = 90;
    if (node.type === "entity") {
      width = 280;
      const attrs = node.metadata?.attributes || [];
      height = 70 + attrs.length * 30;
    } else if (node.type === "actor") {
      width = 160;
      height = 100;
    } else if (node.type === "decision" || node.type === "gateway") {
      width = 160;
      height = 110;
    }

    return {
      ...node,
      position: {
        x: Math.round(dagreNode.x - width / 2),
        y: Math.round(dagreNode.y - height / 2),
      },
    };
  });

  return {
    ...diagram,
    nodes: layoutedNodes,
  };
}
