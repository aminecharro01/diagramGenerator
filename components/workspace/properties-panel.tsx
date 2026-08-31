"use client";

import React, { useState, useEffect } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { Database, Layout, Trash2, Plus, Key, ToggleLeft, Activity, Server, FileText, GitBranch } from "lucide-react";

interface Attribute {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, updatedFields: Partial<Node>) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdge: (edgeId: string, updatedFields: Partial<Edge>) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export default function PropertiesPanel({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onDeleteNode,
  onUpdateEdge,
  onDeleteEdge,
}: PropertiesPanelProps) {
  // Node fields
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("service");
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Edge fields
  const [edgeLabel, setEdgeLabel] = useState("");
  const [edgeType, setEdgeType] = useState("default");
  const [edgeStyle, setEdgeStyle] = useState("solid");
  const [edgeAnimated, setEdgeAnimated] = useState(false);

  // Sync state variables when node selection changes
  useEffect(() => {
    if (selectedNode) {
      setLabel((selectedNode.data?.label as string) || "");
      setDescription((selectedNode.data?.description as string) || "");
      setType(selectedNode.type || "service");
      
      const meta = selectedNode.data?.metadata as any;
      setAttributes(meta?.attributes || []);
    }
  }, [selectedNode]);

  // Sync state variables when edge selection changes
  useEffect(() => {
    if (selectedEdge) {
      setEdgeLabel(typeof selectedEdge.label === "string" ? selectedEdge.label : "");
      setEdgeType(selectedEdge.type || "default");
      const isDashed = selectedEdge.style?.strokeDasharray === "5,5";
      const isDotted = selectedEdge.style?.strokeDasharray === "2,2";
      setEdgeStyle(isDashed ? "dashed" : isDotted ? "dotted" : "solid");
      setEdgeAnimated(!!selectedEdge.animated);
    }
  }, [selectedEdge]);

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="w-80 border-l border-slate-900 bg-slate-950 p-6 flex flex-col justify-center items-center text-center select-none shrink-0">
        <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-2xl text-slate-705 mb-4">
          <Layout className="h-6 w-6 text-slate-655" />
        </div>
        <h4 className="text-sm font-bold text-slate-300 mb-1">Properties Inspector</h4>
        <p className="text-xs text-slate-550 max-w-[200px] leading-relaxed">
          Select any node or relation line on the diagram canvas to view and edit its values.
        </p>
      </aside>
    );
  }

  // Handle relation (edge) properties updates
  const triggerEdgeUpdate = (updated: Record<string, any>) => {
    if (selectedEdge) {
      onUpdateEdge(selectedEdge.id, updated);
    }
  };

  const handleEdgeLabelChange = (val: string) => {
    setEdgeLabel(val);
    triggerEdgeUpdate({ label: val });
  };

  const handleEdgeTypeChange = (newType: string) => {
    setEdgeType(newType);
    triggerEdgeUpdate({ type: newType });
  };

  const handleEdgeStyleChange = (newStyle: string) => {
    setEdgeStyle(newStyle);
    let strokeDasharray = undefined;
    if (newStyle === "dashed") strokeDasharray = "5,5";
    if (newStyle === "dotted") strokeDasharray = "2,2";
    
    triggerEdgeUpdate({
      style: {
        strokeWidth: 2,
        strokeDasharray,
      }
    });
  };

  const handleEdgeAnimatedChange = (animated: boolean) => {
    setEdgeAnimated(animated);
    triggerEdgeUpdate({ animated });
  };

  if (selectedEdge) {
    return (
      <aside className="w-80 border-l border-slate-900 bg-slate-950 flex flex-col shrink-0 max-h-full overflow-y-auto">
        {/* Panel Header */}
        <div className="p-5 border-b border-slate-900 flex items-center justify-between select-none">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <GitBranch className="h-4.5 w-4.5 text-primary" />
            <span>Relation Properties</span>
          </h4>
          <button
            onClick={() => onDeleteEdge(selectedEdge.id)}
            className="p-1.5 hover:bg-destructive/15 border border-transparent hover:border-destructive/30 rounded-lg text-slate-400 hover:text-destructive-foreground transition-all cursor-pointer"
            title="Delete Connection"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Relation Label (Name)
              </label>
              <input
                type="text"
                value={edgeLabel}
                onChange={(e) => handleEdgeLabelChange(e.target.value)}
                placeholder="e.g. HTTPS, sends payload, query"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Line Shape / Router
              </label>
              <select
                value={edgeType}
                onChange={(e) => handleEdgeTypeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-all"
              >
                <option value="default">Bezier Curve</option>
                <option value="straight">Straight Line</option>
                <option value="step">Step Line</option>
                <option value="smoothstep">Smooth Step</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Line Style
              </label>
              <select
                value={edgeStyle}
                onChange={(e) => handleEdgeStyleChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-all"
              >
                <option value="solid">Solid Line</option>
                <option value="dashed">Dashed Line</option>
                <option value="dotted">Dotted Line</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-350">
                <input
                  type="checkbox"
                  checked={edgeAnimated}
                  onChange={(e) => handleEdgeAnimatedChange(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-850 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="font-semibold text-slate-200">Animate Flow Path</span>
              </label>
              <span className="text-[10px] text-slate-500 mt-1 block leading-normal">
                Shows moving signals along the connection line.
              </span>
            </div>
          </div>
        </div>
      </aside>
    );
  }  // Handle standard node properties updates
  const triggerUpdate = (updated: Record<string, any>) => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, {
        ...updated,
        data: {
          ...selectedNode.data,
          ...updated.data,
        },
      });
    }
  };

  const handleLabelChange = (val: string) => {
    setLabel(val);
    triggerUpdate({ data: { label: val } });
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    triggerUpdate({ data: { description: val } });
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (selectedNode) {
      onUpdateNode(selectedNode.id, {
        type: newType,
        data: {
          ...selectedNode.data,
          type: newType,
        },
      });
    }
  };
  // ERD columns editing operations
  const handleAttrChange = (index: number, field: keyof Attribute, value: any) => {
    const updated = attributes.map((attr, idx) => {
      if (idx === index) {
        return { ...attr, [field]: value };
      }
      return attr;
    });
    setAttributes(updated);
    triggerUpdate({
      data: {
        metadata: {
          ...selectedNode!.data?.metadata as any,
          attributes: updated,
        },
      },
    });
  };

  const handleAddAttribute = () => {
    const newAttr: Attribute = { name: "new_column", type: "VARCHAR", isPk: false, isFk: false };
    const updated = [...attributes, newAttr];
    setAttributes(updated);
    triggerUpdate({
      data: {
        metadata: {
          ...selectedNode!.data?.metadata as any,
          attributes: updated,
        },
      },
    });
  };

  const handleDeleteAttribute = (index: number) => {
    const updated = attributes.filter((_, idx) => idx !== index);
    setAttributes(updated);
    triggerUpdate({
      data: {
        metadata: {
          ...selectedNode!.data?.metadata as any,
          attributes: updated,
        },
      },
    });
  };

  return (
    <aside className="w-80 border-l border-slate-900 bg-slate-950 flex flex-col shrink-0 max-h-full overflow-y-auto">
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-900 flex items-center justify-between select-none">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-primary" />
          <span>Properties</span>
        </h4>
        <button
          onClick={() => onDeleteNode(selectedNode!.id)}
          className="p-1.5 hover:bg-destructive/15 border border-transparent hover:border-destructive/30 rounded-lg text-slate-400 hover:text-destructive-foreground transition-all cursor-pointer"
          title="Delete Node"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Basic Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Node Name (Label)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => handleDescChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Component Type
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-all"
            >
              <option value="service">Core Service</option>
              <option value="database">Database System</option>
              <option value="cache">Cache Service</option>
              <option value="queue">Queue Service</option>
              <option value="user">User Client</option>
              <option value="external">External API</option>
              <option value="actor">Actor Participant</option>
              <option value="decision">Decision Choice</option>
              <option value="gateway">BPMN Gateway</option>
              <option value="start">Start Process</option>
              <option value="event">Workflow Event</option>
              <option value="end">End Process</option>
              <option value="entity">Database Entity (ERD Table)</option>
            </select>
          </div>
        </div>

        {/* Dynamic ERD Attribute Table Editor */}
        {type === "entity" && (
          <div className="space-y-4 pt-4 border-t border-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Table Columns
              </span>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="py-1 px-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-md text-[10px] font-semibold text-primary flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>Add Column</span>
              </button>
            </div>

            <div className="space-y-3">
              {attributes.map((attr, idx) => (
                <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => handleAttrChange(idx, "name", e.target.value)}
                      placeholder="column_name"
                      className="bg-slate-950 border border-slate-850 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary w-28"
                    />
                    <input
                      type="text"
                      value={attr.type}
                      onChange={(e) => handleAttrChange(idx, "type", e.target.value)}
                      placeholder="VARCHAR"
                      className="bg-slate-950 border border-slate-850 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary w-20"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteAttribute(idx)}
                      className="p-1 hover:bg-destructive/10 hover:border-destructive/20 text-slate-500 hover:text-destructive rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1 cursor-pointer select-none text-[9px] text-slate-400">
                      <input
                        type="checkbox"
                        checked={!!attr.isPk}
                        onChange={(e) => handleAttrChange(idx, "isPk", e.target.checked)}
                        className="rounded bg-slate-950 border-slate-850 text-primary focus:ring-primary"
                      />
                      <Key className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                      <span>Primary Key</span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer select-none text-[9px] text-slate-400">
                      <input
                        type="checkbox"
                        checked={!!attr.isFk}
                        onChange={(e) => handleAttrChange(idx, "isFk", e.target.checked)}
                        className="rounded bg-slate-950 border-slate-850 text-primary focus:ring-primary"
                      />
                      <Key className="h-2.5 w-2.5 text-sky-400 shrink-0" />
                      <span>Foreign Key</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
