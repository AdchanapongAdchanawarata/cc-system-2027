"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Mail, CheckCircle2, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { parseMemberRecord } from "@/utils/memberProfile";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Check if already logged in with authorized email
  useEffect(() => {
    const checkSession = async () => {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("cc_user_email") : null;
      if (savedEmail) {
        // Instant redirect to dashboard to prevent ANY ghost flash or stutter of the login UI
        router.replace("/dashboard");
        return;
      }
      setIsCheckingSession(false);
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. Authorize: STRICT WHITELIST — ONLY emails explicitly registered in Manage Team (assignees table)
      const { data: members, error: fetchErr } = await supabase
        .from("assignees")
        .select("id, name, email, unit, is_active");

      if (fetchErr) {
        throw new Error("ไม่สามารถเชื่อมต่อฐานข้อมูลเพื่อตรวจสอบสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง");
      }

      // Match against primary email or secondary cmuEmail registered in profile
      const matchedMember = members?.find((m: any) => {
        const primary = (m.email || "").toLowerCase().trim();
        const parsed = parseMemberRecord(m);
        const secondary = (parsed.cmuEmail || "").toLowerCase().trim();
        return primary === normalizedEmail || secondary === normalizedEmail;
      });

      if (!matchedMember) {
        throw new Error(
          "Access Denied: ขออภัย อีเมลของคุณไม่ได้อยู่ในรายชื่อทีมงานที่ได้รับอนุญาตใน Manage Team (Assignees & Admin) แม้จะเป็นอีเมล @step.cmu.ac.th ก็ไม่สามารถเข้าได้ กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มรายชื่อก่อนเข้าใช้งาน"
        );
      }

      const parsedProfile = parseMemberRecord(matchedMember);
      if (matchedMember.is_active === false || parsedProfile.isActive === false) {
        throw new Error(
          "Access Denied: บัญชีผู้ใช้นี้ถูกปิดการใช้งานใน Manage Team กรุณาติดต่อผู้ดูแลระบบ"
        );
      }

      // 2. Determine Role (Admin for Team Lead / adchanapong, Assignee for staff/unit leads, Viewer for read-only viewer)
      const isViewerRole = parsedProfile.role === "viewer";
      const isWa = normalizedEmail.includes("wasita") || (matchedMember.name || "").includes("วา");
      const isAdmin = 
        !isViewerRole && !isWa && (
          parsedProfile.role === "admin" ||
          normalizedEmail.includes("adchanapong") || 
          matchedMember.name?.includes("จ๊อบ")
        );
      
      const role = isViewerRole ? "viewer" : (isAdmin ? "admin" : "assignee");
      localStorage.setItem("cc_user_role", role);
      localStorage.setItem("cc_actual_role", role);
      localStorage.setItem("cc_user_email", normalizedEmail);
      localStorage.setItem("cc_user_name", matchedMember.name || parsedProfile.name);
      if (parsedProfile.fullName) {
        localStorage.setItem("cc_user_fullname", parsedProfile.fullName);
      }
      const isJobAA = 
        normalizedEmail.includes("adchanapong") || 
        (matchedMember.name || "").includes("จ๊อบ");

      if (isJobAA) {
        localStorage.setItem("cc_user_unit", "all");
      } else if (parsedProfile.unit) {
        localStorage.setItem("cc_user_unit", parsedProfile.unit);
      }

      // 3. Optional: Attempt Magic Link in background
      try {
        await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
      } catch (authErr) {
        console.warn("Supabase OTP notice:", authErr);
      }

      // 4. Instant entry into Dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto min-h-[80vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </main>
    );
  }

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
            className="text-sm font-medium text-primary hover:underline cursor-pointer"
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
            <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs md:text-sm leading-relaxed flex items-start gap-2.5">
              <ShieldAlert size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting || !email}
            className="w-full flex items-center justify-center px-4 py-3 rams-action-btn font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ CC System'} <ArrowRight size={18} className="ml-2" />
          </button>
        </form>
      </div>
    </main>
  );
}
