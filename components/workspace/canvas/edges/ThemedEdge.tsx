import React from "react";
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath, 
  getSmoothStepPath, 
  getStraightPath, 
  type EdgeProps 
} from "@xyflow/react";

function getLabelBadgeStyle(label: string): { container: string; pill?: string } {
  const norm = label.trim();
  const lower = norm.toLowerCase();

  // Conditionals
  if (lower === "yes" || lower === "true" || lower === "success" || lower === "valid") {
    return {
      container: "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold",
    };
  }
  if (lower === "no" || lower === "false" || lower === "error" || lower === "invalid" || lower === "fail") {
    return {
      container: "bg-rose-500/10 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold",
    };
  }

  // ERD Cardinalities
  if (norm.includes("1:") || norm.includes(":N") || norm.includes(":M") || norm.includes("N:M")) {
    return {
      container: "bg-purple-500/10 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-mono font-bold",
    };
  }

  // Protocols
  if (norm.includes("HTTPS") || norm.includes("REST") || norm.includes("gRPC") || norm.includes("SQL") || norm.includes("WSS") || norm.includes("Kafka") || norm.includes("pub/sub")) {
    return {
      container: "bg-white/95 dark:bg-[#0f172a]/95 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10.5px]",
    };
  }

  // Default
  return {
    container: "bg-white/95 dark:bg-[#0f172a]/95 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 text-[11px]",
  };
}

export default function ThemedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  type,
}: EdgeProps) {
  let edgePath = "";
  let labelX = 0;
  let labelY = 0;

  // Calculate path shape and label coordinates based on line type
  if (type === "straight") {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else if (type === "step") {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 0,
    });
  } else if (type === "smoothstep") {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 12,
    });
  } else {
    // Default is Bezier curve
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  const labelBadge = label && typeof label === "string" ? getLabelBadgeStyle(label) : null;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      
      {label && typeof label === "string" && labelBadge && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              zIndex: 1000,
            }}
            className="nodrag nopan select-none"
          >
            <div className={`backdrop-blur-sm border px-2.5 py-0.5 rounded-lg shadow-sm transition-all select-none whitespace-nowrap ${labelBadge.container}`}>
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
