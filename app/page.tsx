"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowRight, GitBranch, Share2, Eye, Layout, Settings, Check, HelpCircle, Code, Shield } from "lucide-react";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            DiagramForge<span className="text-primary">AI</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#types" className="hover:text-white transition-colors">Diagram Types</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-9 w-20 bg-slate-900 rounded-lg animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="py-1.5 px-4 bg-primary hover:bg-primary/95 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-sm font-semibold rounded-lg transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 text-center overflow-hidden flex flex-col items-center">
        {/* Glow rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-12 left-1/3 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Next-Generation Graph Engine</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-3xl">
            Turn ideas into diagrams with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">AI</span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Describe your architecture, workflow, database, or process in plain language and generate an editable diagram in seconds. Powered by React Flow and professional auto-layout.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="py-3 px-6 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-base"
            >
              Create your first diagram
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#types"
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 font-semibold rounded-xl transition-all text-base"
            >
              View examples
            </a>
          </div>
        </div>

        {/* Workspace Mockup Preview */}
        <div className="w-full max-w-5xl mt-16 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-3 shadow-2xl relative z-10 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="rounded-xl border border-slate-850 bg-slate-900/60 overflow-hidden aspect-video flex flex-col">
            {/* Header bar */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-slate-800" />
                <div className="h-3 w-3 rounded-full bg-slate-800" />
                <div className="h-3 w-3 rounded-full bg-slate-800" />
                <span className="text-xs text-slate-500 font-mono ml-2">workspace/saas-architecture</span>
              </div>
              <div className="h-5 w-24 bg-slate-800 rounded" />
            </div>
            {/* Split pane visual mock */}
            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/3 bg-slate-950 border-r border-slate-900 p-4 flex flex-col gap-4 text-left">
                <div className="h-6 w-1/2 bg-slate-900 rounded" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-slate-900 rounded w-full" />
                  <div className="h-3 bg-slate-900 rounded w-5/6" />
                  <div className="h-3 bg-slate-900 rounded w-4/5" />
                  <div className="h-3 bg-slate-900 rounded w-full" />
                </div>
                <div className="h-9 bg-primary/20 border border-primary/30 rounded-lg" />
              </div>
              <div className="flex-1 bg-slate-900/40 p-6 flex items-center justify-center relative">
                {/* Simulated Nodes */}
                <div className="flex items-center gap-8">
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center shadow-lg">
                    <div className="text-xs font-semibold text-slate-300">Next.js Client</div>
                  </div>
                  <div className="text-slate-600">─── HTTPS ───▶</div>
                  <div className="p-3 bg-slate-850 border border-primary/50 rounded-lg text-center shadow-lg ring-1 ring-primary/30">
                    <div className="text-xs font-semibold text-white">API Gateway</div>
                  </div>
                  <div className="text-slate-600">──────▶</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center shadow-lg">
                    <div className="text-xs font-semibold text-slate-300">Auth Service</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature section */}
      <section id="features" className="py-24 border-t border-slate-900 bg-slate-950 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need to map complex ideas</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Fully loaded workspace configured for professional software builders and systems designers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-5">
                <Code className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Configurable LLM Support</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connect your OpenAI-compatible endpoint or Gemini key. Take full ownership of your data parameters and generative limits.
              </p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-5">
                <Layout className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Automated Graph Layout</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Powered by Dagre. Nodes are structured automatically to minimize path crossings, prevent overlapping, and maintain alignment.
              </p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-5">
                <GitBranch className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Interactive Canvas Editing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Manually edit positions, override connections, customize descriptions, or adjust entities directly inside React Flow.
              </p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-fit mb-5">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Version History</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every prompt refinement is tracked. Revert back to earlier database profiles or architectures easily without losing track.
              </p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450 w-fit mb-5">
                <Share2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure Link Sharing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Create cryptographic share tokens. Share read-only access with your teammates, protected by Row Level Security (RLS).
              </p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all">
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-405 w-fit mb-5">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Supabase Isolation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Protected by strict Row Level Security. We never trust client IDs; all updates are securely bound on the server database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported diagram types */}
      <section id="types" className="py-24 border-t border-slate-900 bg-slate-950/40 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Five Specialized Architectures</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Optimized system prompts design structured nodes mapped for specific use cases.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "Flowcharts", desc: "Start, process, decision, and end workflow loops." },
              { title: "System Architectures", desc: "Frontends, APIs, queues, caching services, and databases." },
              { title: "Entity Relationship (ERD)", desc: "Database models, primary/foreign keys, and attribute models." },
              { title: "Sequence Diagrams", desc: "Chronological requests and response calls between services." },
              { title: "BPMN Diagrams", desc: "Standardized business process mappings, events, and gateway routes." }
            ].map((type, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-slate-850 transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary mb-3">0{i+1}. {type.title}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{type.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 border-t border-slate-900 bg-slate-950 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How DiagramForge AI Works</h2>
            <p className="text-slate-400">Our generation pipeline moves from textual input to fully-interactive React Flow nodes in real-time.</p>
          </div>

          <div className="relative border-l border-slate-900 ml-4 md:ml-32 pl-8 space-y-12">
            {[
              { step: "Prompt", title: "Write standard English prompts", desc: "Describe your architecture, database dependencies, or login processes inside the editor sidebar. Select from pre-coded presets to jumpstart structures." },
              { step: "Analyze & Structure", title: "AI structures diagram variables", desc: "Server handlers stream to configured OpenAI-compatible endpoints to compile a schema-validated graph JSON, strictly governed by Zod validations." },
              { step: "Auto-Layout Engine", title: "Calculate coordinate alignments", desc: "Dagre algorithms dynamically calculate optimal grid coordinates, aligning database structures or process vectors to minimize line crossings." },
              { step: "Interactive Custom Canvas", title: "Explore, edit, and export", desc: "Interact with the graph in React Flow. Move nodes, add customized fields, append properties, revert version changes, and generate share links." }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {/* Floating indicator */}
                <div className="absolute -left-12 top-0 h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-primary">
                  {idx + 1}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 border-t border-slate-900 bg-gradient-to-b from-slate-950 to-slate-900 px-6 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="text-3xl font-bold text-white mb-6">Build clean diagrams at the speed of thought</h2>
          <p className="text-slate-400 mb-8 max-w-lg leading-relaxed">
            Register your developer account to begin crafting diagrams, managing revisions, and collaborating with sharing links.
          </p>
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="py-3 px-6 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-8 text-center text-slate-600 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-slate-400">DiagramForge AI</span>
          </div>
          <p>© {new Date().getFullYear()} DiagramForge AI. All rights reserved. Built for engineering teams.</p>
        </div>
      </footer>
    </div>
  );
}
