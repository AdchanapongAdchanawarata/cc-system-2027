"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If already logged in, redirect to dashboard automatically
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Check if email is in the allowed_emails table (Allowlist)
      const { data: allowedEmail, error: checkError } = await supabase
        .from("allowed_emails")
        .select("email")
        .eq("email", email.toLowerCase())
        .single();

      if (checkError || !allowedEmail) {
        throw new Error("Access Denied: Your email is not authorized to login. Please contact an administrator.");
      }

      // 2. If allowed, send Magic Link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        throw authError;
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto min-h-[80vh]">
        <div className="bg-surface border border-surface-border p-8 rounded-md shadow-sm text-center w-full animate-premium-fade">
          <div className="inline-flex h-16 w-16 bg-primary/10 text-primary rounded-full items-center justify-center mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a magic link to <strong>{email}</strong>. Click the link to log in instantly.
          </p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Try a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto min-h-[80vh]">
      <div className="rams-card p-10 w-full relative overflow-hidden animate-premium-fade">
        {/* Physical hardware top edge highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
        
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">CC Login</h1>
          <p className="text-muted-foreground text-sm">
            Enter your authorized email to receive a magic link.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail size={18} />
              </div>
              <input 
                required 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" 
                placeholder="name@organization.com" 
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm leading-relaxed">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting || !email}
            className="w-full flex items-center justify-center px-4 py-3 rams-action-btn font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying...' : 'Send Magic Link'} <ArrowRight size={18} className="ml-2" />
          </button>
        </form>
      </div>
    </main>
  );
}
