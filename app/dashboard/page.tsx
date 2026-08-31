"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Sparkles, Plus, Search, LogOut, Settings, Layout, Clock, 
  Trash2, Edit2, Share2, ArrowRight, Loader2, Database, GitCommit,
  GitBranch, HelpCircle, X, ChevronRight, Activity, Grid, AlertCircle
} from "lucide-react";

interface Diagram {
  id: string;
  title: string;
  description: string | null;
  diagram_type: string;
  prompt: string | null;
  updated_at: string;
  is_public: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("updated");

  // New Diagram modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("Untitled Diagram");
  const [newType, setNewType] = useState("flowchart");
  const [newPrompt, setNewPrompt] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Rename state
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  // Toast status
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);

      // Fetch profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      setProfile(prof);

      // Fetch diagrams
      await fetchDiagrams();
    };

    checkUser();
  }, []);

  const fetchDiagrams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/diagrams");
      const data = await res.json();
      if (data.diagrams) {
        setDiagrams(data.diagrams);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleCreateDiagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) {
      setGenError("Prompt is required to generate a diagram.");
      return;
    }

    setGenLoading(true);
    setGenError(null);

    try {
      // 1. Generate the diagram structure via AI
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newPrompt,
          diagramType: newType,
        }),
      });

      const genData = await genRes.json();

      if (!genRes.ok) {
        throw new Error(genData.error || "Failed to generate diagram structure.");
      }

      // 2. Save the diagram into database diagrams table
      const saveRes = await fetch("/api/diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle || "Untitled Diagram",
          description: `AI generated flowchart for: ${newPrompt.substring(0, 50)}...`,
          diagramType: newType,
          prompt: newPrompt,
          diagramData: genData.diagram,
        }),
      });

      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveData.error || "Failed to save generated diagram.");
      }

      showToast("Diagram generated successfully!");
      setNewModalOpen(false);
      
      // Redirect to newly created workspace
      router.push(`/workspace/${saveData.diagram.id}`);
    } catch (err: any) {
      setGenError(err.message || "An error occurred.");
    } finally {
      setGenLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this diagram?")) return;

    try {
      const res = await fetch(`/api/diagrams?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete diagram");

      showToast("Diagram deleted successfully.");
      setDiagrams(diagrams.filter((d) => d.id !== id));
    } catch (err: any) {
      showToast(err.message || "Error deleting diagram", "error");
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTitle.trim()) return;

    setRenameLoading(true);
    try {
      const res = await fetch("/api/diagrams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: renameId,
          title: renameTitle,
        }),
      });

      if (!res.ok) throw new Error("Failed to rename diagram");

      showToast("Diagram renamed.");
      setDiagrams(
        diagrams.map((d) => (d.id === renameId ? { ...d, title: renameTitle } : d))
      );
      setRenameId(null);
    } catch (err: any) {
      showToast(err.message || "Rename failed", "error");
    } finally {
      setRenameLoading(false);
    }
  };

  // Filter and sort diagrams logic
  const filteredDiagrams = diagrams
    .filter((d) => {
      const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                            (d.prompt && d.prompt.toLowerCase().includes(search.toLowerCase()));
      const matchesType = filterType === "all" || d.diagram_type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "updated") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const loadPreset = (type: string, promptText: string, title: string) => {
    setNewType(type);
    setNewPrompt(promptText);
    setNewTitle(title);
  };

  return (
    <div className="flex-1 flex min-h-screen bg-slate-950 text-slate-100">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl border bg-card/90 backdrop-blur-md shadow-2xl flex items-center gap-2.5 max-w-sm animate-bounce">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 p-6 flex flex-col justify-between hidden md:flex shrink-0 select-none">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              DiagramForge<span className="text-primary">AI</span>
            </span>
          </Link>

          <div className="space-y-1.5">
            <Link
              href="/dashboard"
              className="w-full py-2 px-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm font-semibold flex items-center gap-2.5 transition-all"
            >
              <Layout className="h-4.5 w-4.5" />
              <span>My Diagrams</span>
            </Link>
            <Link
              href="/settings"
              className="w-full py-2 px-3 hover:bg-slate-900/60 border border-transparent hover:border-slate-900 rounded-lg text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2.5 transition-all"
            >
              <Settings className="h-4.5 w-4.5" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="border-t border-slate-900 pt-4 flex flex-col gap-4">
          {profile && (
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-sm text-primary uppercase">
                {profile.display_name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{profile.display_name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-destructive/15 border border-slate-850 hover:border-destructive/30 rounded-lg text-slate-400 hover:text-destructive-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 p-6 md:p-10 flex flex-col bg-slate-950 overflow-y-auto max-w-full">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Welcome back{profile ? `, ${profile.display_name}` : ""}
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage and refine your system architecture diagrams.</p>
          </div>

          <button
            onClick={() => setNewModalOpen(true)}
            className="py-2.5 px-4 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Diagram</span>
          </button>
        </div>

        {/* Dashboard Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/35 border border-slate-900 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search diagram titles or prompt details..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs placeholder:text-slate-500 text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Filtering & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Type</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-xs text-slate-350 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="flowchart">Flowchart</option>
                <option value="architecture">Architecture</option>
                <option value="erd">ERD</option>
                <option value="sequence">Sequence</option>
                <option value="bpmn">BPMN</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-xs text-slate-355 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Diagram List/Grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-sm text-slate-400">Loading diagrams persistent cache...</p>
          </div>
        ) : filteredDiagrams.length === 0 ? (
          <div className="border border-dashed border-slate-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <Grid className="h-10 w-10 text-slate-700 mb-4" />
            <h3 className="text-base font-bold text-slate-300 mb-1">No diagrams found</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              {search || filterType !== "all" 
                ? "No diagrams match your search query or selected type filter." 
                : "Describe your service dependencies, processes, or database architectures to generate your first diagram."}
            </p>
            <button
              onClick={() => setNewModalOpen(true)}
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Diagram</span>
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiagrams.map((d) => (
              <div
                key={d.id}
                className="group bg-slate-900/20 hover:bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all"
              >
                <div>
                  {/* Styled Header Badge & Thumbnail */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex py-1 px-2.5 rounded-md bg-slate-950 border border-slate-900 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {d.diagram_type}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(d.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Thumbnail Representation */}
                  <div className="h-28 w-full bg-slate-950/70 border border-slate-900/60 rounded-xl mb-4 overflow-hidden flex items-center justify-center relative select-none">
                    {/* Visual schematic indicator based on diagram type */}
                    {d.diagram_type === "erd" ? (
                      <Database className="h-8 w-8 text-indigo-500/25" />
                    ) : d.diagram_type === "sequence" ? (
                      <GitCommit className="h-8 w-8 text-indigo-500/25" />
                    ) : (
                      <GitBranch className="h-8 w-8 text-indigo-500/25" />
                    )}
                    {d.is_public && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 py-0.5 px-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-semibold font-mono">
                        <Share2 className="h-2.5 w-2.5" />
                        SHARED
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors line-clamp-1 mb-1.5">
                    {d.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-6">
                    {d.prompt || "No prompt details provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-auto">
                  <Link
                    href={`/workspace/${d.id}`}
                    className="text-xs font-semibold text-primary hover:text-white flex items-center gap-1"
                  >
                    <span>Open Workspace</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setRenameId(d.id);
                        setRenameTitle(d.title);
                      }}
                      title="Rename"
                      className="p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      title="Delete"
                      className="p-1.5 hover:bg-destructive/15 border border-transparent hover:border-destructive/30 rounded-lg text-slate-400 hover:text-destructive-foreground transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- NEW DIAGRAM AI GENERATION MODAL --- */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6.5 max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-3.5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Diagram</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Let AI compile nodes and layout coordinates.</p>
                </div>
              </div>
              <button
                onClick={() => setNewModalOpen(false)}
                className="p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {genError && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-snug">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{genError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDiagram} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Diagram Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="SaaS Core Architecture"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Diagram Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-all"
                  >
                    <option value="architecture diagram">Architecture Diagram</option>
                    <option value="flowchart">Flowchart</option>
                    <option value="class diagram">Class Diagram</option>
                    <option value="use case diagram">Use Case Diagram</option>
                    <option value="sequence diagram">Sequence Diagram</option>
                    <option value="activity diagram">Activity Diagram</option>
                    <option value="entity relationship diagram (erd)">Entity Relationship Diagram (ERD)</option>
                    <option value="component diagram">Component Diagram</option>
                    <option value="deployment diagram">Deployment Diagram</option>
                    <option value="package diagram">Package Diagram</option>
                    <option value="state machine diagram">State Machine Diagram</option>
                    <option value="data flow diagram (dfd)">Data Flow Diagram (DFD)</option>
                    <option value="system context diagram">System Context Diagram</option>
                    <option value="mind map">Mind Map</option>
                    <option value="network diagram">Network Diagram</option>
                    <option value="infrastructure diagram">Infrastructure Diagram</option>
                    <option value="database schema">Database Schema</option>
                    <option value="bpmn-style process diagram">BPMN-style Process Diagram</option>
                    <option value="timeline">Timeline</option>
                    <option value="organization chart">Organization Chart</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  AI Generation Prompt
                </label>
                <textarea
                  required
                  rows={4}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Describe the system architecture or process you want to compile..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">💡 ProTip: Use Cmd/Ctrl + Enter to trigger generation directly.</span>
              </div>

              {/* Preset Prompts Selector */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Use Preset Templates
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadPreset(
                      "architecture",
                      "Create a scalable SaaS architecture with a Next.js frontend, API backend, PostgreSQL database, Redis cache and background workers.",
                      "SaaS Architecture Model"
                    )}
                    className="py-1 px-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-lg text-[10px] text-slate-300 font-semibold cursor-pointer transition-all"
                  >
                    ⚡ SaaS Architecture
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset(
                      "flowchart",
                      "Create an e-commerce checkout workflow from cart validation, credit card payment checking, to order confirmation receipt mailing.",
                      "E-Commerce Workflow"
                    )}
                    className="py-1 px-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-lg text-[10px] text-slate-300 font-semibold cursor-pointer transition-all"
                  >
                    🛒 E-commerce Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset(
                      "sequence",
                      "Create a JWT authentication flow from user login input, token validation gateway lookup, database user check to credentials cookie set.",
                      "JWT Auth Sequence"
                    )}
                    className="py-1 px-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-lg text-[10px] text-slate-300 font-semibold cursor-pointer transition-all"
                  >
                    🔑 JWT Authentication
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset(
                      "erd",
                      "Create an ERD for an inventory management database containing: users, products, warehouses, orders and stock movement lines.",
                      "Inventory System Schema"
                    )}
                    className="py-1 px-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-lg text-[10px] text-slate-300 font-semibold cursor-pointer transition-all"
                  >
                    💾 Inventory Database
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-900 mt-6">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="py-2 px-4 border border-slate-850 hover:bg-slate-900 rounded-xl text-xs text-slate-300 font-medium cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="py-2 px-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {genLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Designing Graph Layout...
                    </>
                  ) : (
                    <>
                      <span>Generate Diagram</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RENAME DIAGRAM MODAL --- */}
      {renameId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Rename Diagram</h3>
            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                required
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <div className="flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setRenameId(null)}
                  className="py-1.5 px-3 border border-slate-850 hover:bg-slate-900 rounded-lg text-xs text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading}
                  className="py-1.5 px-4.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {renameLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
