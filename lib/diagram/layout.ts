import dagre from "dagre";
import { DiagramData } from "@/types/diagram";

export function layoutDiagram(diagram: DiagramData, settings?: any): DiagramData {
  const g = new dagre.graphlib.Graph();

  // 1. Get rank direction based on settings or defaults
  let rankdir = "TB"; // Top-to-bottom as base flowchart default
  
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
    // Smart Defaults based on diagram type
    const diagType = (diagram.type || "").toLowerCase().trim();
    if (
      diagType === "architecture" || 
      diagType === "architecture diagram" ||
      diagType === "erd" || 
      diagType === "entity relationship diagram (erd)" || 
      diagType === "database schema" ||
      diagType === "network diagram" ||
      diagType === "infrastructure diagram" ||
      diagType === "system context diagram" ||
      diagType === "use case diagram"
    ) {
      rankdir = "LR"; // Left-to-right for systems, ERD, and context maps
    }
  }

  // Adjust rankdir based on Aspect Ratio formatting presets if no layout direction is chosen explicitly
  const customRatio = settings?.aspectRatio || "";
  if (!settings?.layoutDirection) {
    if (customRatio.includes("Portrait")) {
      rankdir = "TB"; // Vertical alignment fits Portrait formats perfectly
    } else if (customRatio.includes("Landscape") || customRatio.includes("16:9") || customRatio.includes("16:10")) {
      rankdir = "LR"; // Horizontal fits widescreen formats
    }
  }

  // 2. Node & Connector Spacing
  let nodeSep = 120;
  let rankSep = 240;
  
  const spacing = settings?.nodeSpacing || "Normal";
  if (spacing === "Compact") {
    nodeSep = 75;
    rankSep = 150;
  } else if (spacing === "Spacious") {
    nodeSep = 180;
    rankSep = 320;
  } else if (spacing === "Extra Spacious") {
    nodeSep = 260;
    rankSep = 450;
  }

  // Connector spacing adjusts ranksep
  const connSpacing = settings?.connectorSpacing || "Normal";
  if (connSpacing === "Compact") {
    rankSep = Math.max(rankSep - 40, 100);
  } else if (connSpacing === "Spacious") {
    rankSep = Math.max(rankSep + 60, 260);
  }

  // Readability controller: expands spacing to avoid edge intersection and overlap
  if (settings?.readability === "Highly Readable" || settings?.autoOptimizeReadability) {
    nodeSep = Math.max(nodeSep, 160);
    rankSep = Math.max(rankSep, 300);
  }

  g.setGraph({
    rankdir: rankdir,
    nodesep: nodeSep,
    edgesep: 50,
    ranksep: rankSep,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph layout calculation
  diagram.nodes.forEach((node) => {
    // Dynamic node size based on nodeDesign, detail level, and nodeSize configuration
    let width = 240;
    let height = 90;

    const nodeDesignSetting = settings?.nodeDesign || "";
    const nodeDetailSetting = settings?.nodeDetail || settings?.detailLevel || "";
    const nodeSizeSetting = node.metadata?.nodeSize || settings?.nodeSize || "md";

    // base sizing from node design choice
    if (nodeDesignSetting.includes("Compact") || nodeDetailSetting === "Minimal" || nodeDetailSetting === "Compact") {
      width = 190;
      height = 70;
    } else if (nodeDesignSetting.includes("Detailed") || nodeDetailSetting === "Detailed") {
      width = 280;
      height = 110;
    } else if (nodeDetailSetting === "Very Detailed") {
      width = 330;
      height = 145;
    }

    if (nodeDesignSetting.includes("Icon above") || nodeDesignSetting.includes("above")) {
      // Sizing for Icon above + Text below (taller but narrower)
      width = 160;
      height = 130;
    } else if (nodeDesignSetting.includes("Icon only") || nodeDesignSetting === "Icon only") {
      width = 80;
      height = 80;
    } else if (nodeDesignSetting.includes("Text only") || nodeDesignSetting === "Text only") {
      width = 180;
      height = 65;
    }

    // Adapt sizing for specialized block types
    const nodeType = (node.type || "").toLowerCase();
    if (nodeType === "entity" || nodeType === "database schema" || nodeType === "class") {
      width = 280;
      const attrs = node.metadata?.attributes || [];
      const methods = node.metadata?.methods || [];
      // Combine attributes and methods heights
      height = 75 + (attrs.length + methods.length) * 28;
    } else if (nodeType === "actor" || nodeType === "user") {
      width = 150;
      height = 110;
    } else if (nodeType === "decision" || nodeType === "gateway") {
      width = 160;
      height = 110;
    } else if (nodeType === "package") {
      width = 220;
      height = 130;
    } else if (nodeType === "milestone") {
      width = 200;
      height = 80;
    }

    // Apply scale multiplier for sizes
    if (nodeSizeSetting === "sm" || nodeSizeSetting === "small") {
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
    } else if (nodeSizeSetting === "lg" || nodeSizeSetting === "large") {
      width = Math.round(width * 1.2);
      height = Math.round(height * 1.2);
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
    
    // Recalculate size to offset and center position properly
    let width = 240;
    let height = 90;

    const nodeDesignSetting = settings?.nodeDesign || "";
    const nodeDetailSetting = settings?.nodeDetail || settings?.detailLevel || "";
    const nodeSizeSetting = node.metadata?.nodeSize || settings?.nodeSize || "md";

    if (nodeDesignSetting.includes("Compact") || nodeDetailSetting === "Minimal" || nodeDetailSetting === "Compact") {
      width = 190;
      height = 70;
    } else if (nodeDesignSetting.includes("Detailed") || nodeDetailSetting === "Detailed") {
      width = 280;
      height = 110;
    } else if (nodeDetailSetting === "Very Detailed") {
      width = 330;
      height = 145;
    }

    if (nodeDesignSetting.includes("Icon above") || nodeDesignSetting.includes("above")) {
      width = 160;
      height = 130;
    } else if (nodeDesignSetting.includes("Icon only") || nodeDesignSetting === "Icon only") {
      width = 80;
      height = 80;
    } else if (nodeDesignSetting.includes("Text only") || nodeDesignSetting === "Text only") {
      width = 180;
      height = 65;
    }

    const nodeType = (node.type || "").toLowerCase();
    if (nodeType === "entity" || nodeType === "database schema" || nodeType === "class") {
      width = 280;
      const attrs = node.metadata?.attributes || [];
      const methods = node.metadata?.methods || [];
      height = 75 + (attrs.length + methods.length) * 28;
    } else if (nodeType === "actor" || nodeType === "user") {
      width = 150;
      height = 110;
    } else if (nodeType === "decision" || nodeType === "gateway") {
      width = 160;
      height = 110;
    } else if (nodeType === "package") {
      width = 220;
      height = 130;
    } else if (nodeType === "milestone") {
      width = 200;
      height = 80;
    }

    if (nodeSizeSetting === "sm" || nodeSizeSetting === "small") {
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
    } else if (nodeSizeSetting === "lg" || nodeSizeSetting === "large") {
      width = Math.round(width * 1.2);
      height = Math.round(height * 1.2);
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
