import React, { useState } from "react";
import { ELEARNING_SAMPLES, ELearningSample } from "@/lib/diagram/elearning-samples";
import { 
  X, FolderOpen, Upload, Code, CheckCircle, FileText, 
  Layers, ChevronRight, Sparkles, BookOpen, Database, Activity, Server 
} from "lucide-react";

interface SamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPuml: (pumlContent: string, title?: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export default function SamplesModal({
  isOpen,
  onClose,
  onSelectPuml,
  showToast,
}: SamplesModalProps) {
  const [activeTab, setActiveTab] = useState<"elearning" | "import">("elearning");
  const [customPumlText, setCustomPumlText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  // Filter samples by category
  const categories = [
    {
      name: "Architecture & Déploiement",
      icon: Server,
      samples: ELEARNING_SAMPLES.filter(s => s.id.includes("architecture") || s.id.includes("deploiement")),
    },
    {
      name: "Cas d'Utilisation",
      icon: Activity,
      samples: ELEARNING_SAMPLES.filter(s => s.id.includes("cas_utilisation")),
    },
    {
      name: "Diagrammes de Classes (UML)",
      icon: Database,
      samples: ELEARNING_SAMPLES.filter(s => s.id.includes("classes")),
    },
    {
      name: "Diagrammes de Séquence (8 Workflows)",
      icon: Layers,
      samples: ELEARNING_SAMPLES.filter(s => s.id.includes("sequence")),
    },
  ];

  const handleSelectSample = (sample: ELearningSample) => {
    onSelectPuml(sample.puml, sample.title);
    onClose();
  };

  const handleImportCustom = () => {
    if (!customPumlText.trim()) {
      showToast("Please enter PlantUML code or choose a file.", "error");
      return;
    }
    onSelectPuml(customPumlText, "Imported Diagram");
    onClose();
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          onSelectPuml(text, fileName);
          onClose();
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          onSelectPuml(text, fileName);
          onClose();
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-900 flex items-center justify-between bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">PlantUML Diagrams & E-learning Library</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Load any of the 14 IAT Academy diagrams or import your own PlantUML code.
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

        {/* Tab switcher */}
        <div className="px-6 pt-3 flex border-b border-slate-900 bg-slate-950/50 gap-4 shrink-0">
          <button
            onClick={() => setActiveTab("elearning")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "elearning"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>E-learning Diagrams ({ELEARNING_SAMPLES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "import"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Import / Paste PlantUML</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "elearning" ? (
            <div className="space-y-6">
              {categories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={idx} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      <Icon className="h-4 w-4" />
                      <span>{cat.name}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {cat.samples.map((sample) => (
                        <div
                          key={sample.id}
                          onClick={() => handleSelectSample(sample)}
                          className="group p-3.5 rounded-xl border border-slate-850 bg-slate-900/40 hover:bg-slate-900/90 hover:border-indigo-500/60 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors truncate">
                              {sample.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                              {sample.filename}
                            </div>
                          </div>
                          <span className="shrink-0 p-1.5 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white transition-all">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-900/20 hover:border-slate-700"
                }`}
              >
                <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2 opacity-80" />
                <div className="text-xs font-bold text-white mb-1">
                  Drag and drop your .puml or .json diagram file here
                </div>
                <div className="text-[10.5px] text-slate-500 mb-3">
                  Supports PlantUML (.puml, .plantuml) and Diagram JSON
                </div>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept=".puml,.plantuml,.txt,.json"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste PlantUML code */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Or Paste PlantUML Code Directly
                </label>
                <textarea
                  value={customPumlText}
                  onChange={(e) => setCustomPumlText(e.target.value)}
                  placeholder="@startuml&#10;actor User&#10;participant API&#10;User -> API : GET /dashboard&#10;@enduml"
                  rows={8}
                  className="w-full p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleImportCustom}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Parse & Render Diagram</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
