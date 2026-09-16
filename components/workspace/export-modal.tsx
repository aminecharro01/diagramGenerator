import React, { useState } from "react";
import { DiagramData } from "@/types/diagram";
import { downloadPng, downloadSvg, downloadPdf, downloadJson, downloadPlantUmlFile } from "@/lib/diagram/export";
import { 
  Download, X, FileImage, FileCode, Printer, Sparkles, Check, 
  Layers, Shield, Palette, FileText 
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  diagramData: DiagramData;
  theme: "light" | "dark";
  showToast: (msg: string, type?: "success" | "error") => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  title,
  diagramData,
  theme,
  showToast,
}: ExportModalProps) {
  const [activeFormat, setActiveFormat] = useState<"png" | "svg" | "pdf" | "puml" | "json">("png");
  const [scale, setScale] = useState<number>(2);
  const [bgMode, setBgMode] = useState<"white" | "transparent" | "dark" | "blueprint">("white");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    const safeTitle = (title || "diagram").toLowerCase().replace(/[^a-z0-9_-]/g, "_");

    try {
      if (activeFormat === "png") {
        await downloadPng(`${safeTitle}_${scale}x.png`, { scale, bgMode });
        showToast(`Exported PNG (${scale}x HD) successfully!`);
      } else if (activeFormat === "svg") {
        await downloadSvg(`${safeTitle}.svg`, { bgMode });
        showToast("Exported Scalable SVG successfully!");
      } else if (activeFormat === "pdf") {
        await downloadPdf(`${safeTitle}.pdf`, { bgMode });
        showToast("Generated printable PDF successfully!");
      } else if (activeFormat === "puml") {
        downloadPlantUmlFile(diagramData, `${safeTitle}.puml`);
        showToast("Exported PlantUML (.puml) successfully!");
      } else if (activeFormat === "json") {
        downloadJson(diagramData, `${safeTitle}.json`);
        showToast("Exported JSON structure successfully!");
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast("Export failed. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-900 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Export Diagram</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                High-definition export with 100% full bounding-box capture (no cutoffs).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              1. Choose Export Format
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: "png", label: "PNG", sub: "Ultra-HD Image", icon: FileImage },
                { id: "svg", label: "SVG", sub: "Vector Graphics", icon: FileCode },
                { id: "pdf", label: "PDF", sub: "Printable Report", icon: Printer },
                { id: "puml", label: "PUML", sub: "PlantUML DSL", icon: FileText },
                { id: "json", label: "JSON", sub: "Graph Data", icon: Layers },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const active = activeFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setActiveFormat(fmt.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      active
                        ? "bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                        : "bg-slate-900/40 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1.5 ${active ? "text-indigo-400" : "text-slate-400"}`} />
                    <span className="font-bold text-xs">{fmt.label}</span>
                    <span className="text-[8.5px] text-slate-500 mt-0.5">{fmt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PNG Quality Options */}
          {activeFormat === "png" && (
            <div className="space-y-2 pt-2 border-t border-slate-900">
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                2. Resolution & Print Quality
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 1, label: "1x Standard", desc: "Web / Preview" },
                  { value: 2, label: "2x Retina", desc: "Crisp Screen HD" },
                  { value: 3, label: "3x Super HD", desc: "Presentations" },
                  { value: 4, label: "4x Ultra HD", desc: "300 DPI Thesis/Print" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setScale(opt.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      scale === opt.value
                        ? "bg-indigo-600/15 border-indigo-500 text-white"
                        : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Background Mode Options (for PNG / SVG) */}
          {(activeFormat === "png" || activeFormat === "svg") && (
            <div className="space-y-2 pt-2 border-t border-slate-900">
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                3. Background Appearance
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "white", label: "Clean White", desc: "Ideal for Docs & Thesis" },
                  { value: "transparent", label: "Transparent", desc: "Clean overlays" },
                  { value: "dark", label: "Dark Slate", desc: "Modern dark mode" },
                  { value: "blueprint", label: "Blueprint", desc: "Engineering style" },
                ].map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => setBgMode(bg.value as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      bgMode === bg.value
                        ? "bg-indigo-600/15 border-indigo-500 text-white"
                        : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-xs">{bg.label}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{bg.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-900 flex items-center justify-between bg-slate-900/30">
          <span className="text-[10.5px] text-slate-500 font-mono">
            {diagramData.nodes.length} nodes • {diagramData.edges.length} edges
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Exporting..." : `Download ${activeFormat.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
