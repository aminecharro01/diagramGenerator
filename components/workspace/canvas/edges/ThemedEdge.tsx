import React from "react";
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath, 
  getSmoothStepPath, 
  getStraightPath, 
  type EdgeProps 
} from "@xyflow/react";

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
      borderRadius: 16,
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

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      
      {label && typeof label === "string" && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan select-none"
          >
            <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800/80 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-md text-slate-800 dark:text-slate-200 transition-all select-none whitespace-nowrap">
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
