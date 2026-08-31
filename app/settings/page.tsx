"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowLeft, Loader2, Save, User, Shield, Key, Settings } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      
      if (prof) {
        setProfile(prof);
        setName(prof.display_name || "");
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name,
        })
        .eq("id", user.id);

      if (error) throw error;
      setMessage({ text: "Profile updated successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile.", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-450 mt-4">Loading configuration variables...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Settings Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 border border-slate-850 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <span className="text-base font-bold text-white">Account Settings</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-primary hover:underline font-semibold"
        >
          Back to Dashboard
        </Link>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10">
        <h1 className="text-2xl font-extrabold text-white mb-2">Workspace Configurations</h1>
        <p className="text-xs text-slate-450 mb-8 leading-relaxed">
          Manage your account profile information. These changes sync across diagrams and share links.
        </p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-900/25 border border-slate-900 rounded-2xl p-6.5">
            <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-slate-900 pb-3">
              <User className="h-4.5 w-4.5 text-primary" />
              <span>Public Details</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Account Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-900 rounded-lg text-xs text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-600 mt-1 block">Account emails cannot be changed inside configuration profile.</span>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="py-2 px-4 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 disabled:opacity-50 transition-all ml-auto mt-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security details indicator */}
          <div className="bg-slate-900/25 border border-slate-900 rounded-2xl p-6.5">
            <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-slate-900 pb-3">
              <Shield className="h-4.5 w-4.5 text-primary" />
              <span>Authentication Credentials</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-950">
                <span className="text-slate-400 font-medium">Provider</span>
                <span className="font-mono text-slate-200 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                  {user?.app_metadata?.provider || "email"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-950">
                <span className="text-slate-400 font-medium">Registered Date</span>
                <span className="text-slate-300 font-mono">
                  {user?.created_at ? new Date(user.created_at).toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-400 font-medium">Last Login Access</span>
                <span className="text-slate-300 font-mono">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
