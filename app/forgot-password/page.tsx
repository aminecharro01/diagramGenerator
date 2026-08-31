"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In production, configure redirectUrl to point to your /reset-password page
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to submit reset request.");
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center min-h-screen px-4 bg-radial from-slate-900 to-black select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 group mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-white shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              DiagramForge<span className="text-primary">AI</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Recover access to your diagram dashboard
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Reset Link Sent!
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                If the email is associated with a registered user, we have sent a secure password reset link to <span className="font-semibold text-white">{email}</span>.
              </p>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Return to Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-snug">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full px-4 py-2.5 bg-background border border-border/70 rounded-xl text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-primary hover:bg-primary/95 active:scale-[0.98] disabled:active:scale-100 disabled:opacity-50 text-primary-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Auth Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6 select-none">
          Remembered your password?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
