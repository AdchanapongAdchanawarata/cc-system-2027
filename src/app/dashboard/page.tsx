"use client";

import { useState, useEffect } from "react";
import WeatherWidget from "@/components/WeatherWidget";
import Link from "next/link";
import { ArrowLeft, Settings, Plus, LayoutDashboard, LayoutList, FileText, Shield, User, LogOut, BookOpen, Menu, X, Eye, Sparkles } from "lucide-react";
import AssignmentsView from "./components/AssignmentsView";
import DashboardsView from "./components/DashboardsView";
import DataReportsView from "./components/DataReportsView";
import dynamic from "next/dynamic";

const SetupModal = dynamic(() => import("./components/SetupModal"), { ssr: false });
const InternalTaskModal = dynamic(() => import("./components/InternalTaskModal"), { ssr: false });
const Avatar3DStudioModal = dynamic(() => import("@/components/Avatar3DStudioModal").then(mod => mod.Avatar3DStudioModal), { ssr: false });
import AlertSummary from "./components/AlertSummary";
import AnimatedMascotLogo from "@/components/AnimatedMascotLogo";
import { Assignee3DAvatarBadge } from "@/components/Assignee3DAvatarBadge";
import { createClient } from "@/utils/supabase/client";
import { syncCustomQuotesFromAssignees } from "@/utils/memberQuote";
import { syncAvatarsFromAssignees } from "@/utils/avatar3dPresets";
import ActiveAssignmentNotifier from "@/components/ActiveAssignmentNotifier";
import DailyMissionModal from "@/components/DailyMissionModal";
import { computeDailyMission, DailyMissionResult } from "@/utils/dailyMissionService";
import { logActivity, getCurrentActor } from "@/utils/auditLogger";
import HalloweenBats from "@/components/HalloweenBats";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<"assignments" | "dashboards" | "data-reports" | null>(null);
  const [activeSubReport, setActiveSubReport] = useState<string | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isInternalTaskOpen, setIsInternalTaskOpen] = useState(false);
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
  const [dailyMission, setDailyMission] = useState<DailyMissionResult | null>(null);
  const [assigneesList, setAssigneesList] = useState<{ id: string; name: string }[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "assignee" | "viewer">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_user_role");
      if (saved === "admin" || saved === "assignee" || saved === "viewer") return saved;
    }
    return "admin";
  });
  const [actualUserRole, setActualUserRole] = useState<"admin" | "assignee" | "viewer">(() => {
    if (typeof window !== "undefined") {
      const actual = localStorage.getItem("cc_actual_role");
      if (actual === "admin" || actual === "assignee" || actual === "viewer") return actual;
      const email = (localStorage.getItem("cc_user_email") || "").toLowerCase().trim();
      const name = localStorage.getItem("cc_user_name") || "";
      if (email.includes("adchanapong") || name.includes("จ๊อบ")) return "admin";
      const saved = localStorage.getItem("cc_user_role");
      if (saved === "admin" || saved === "assignee" || saved === "viewer") return saved;
    }
    return "assignee";
  });
  const isActualAdmin = actualUserRole === "admin";
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cc_user_name") || "";
    }
    return "";
  });
  const [isAuthChecking, setIsAuthChecking] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("cc_user_email");
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedEmail = typeof window !== "undefined" ? localStorage.getItem("cc_user_email") : null;
    if (!savedEmail) {
      window.location.href = "/login";
      return;
    }
    setIsAuthChecking(false);
    const savedName = localStorage.getItem("cc_user_name");
    if (savedName) setUserDisplayName(savedName);

    const savedActual = localStorage.getItem("cc_actual_role");
    if (savedActual === "admin" || savedActual === "assignee" || savedActual === "viewer") {
      setActualUserRole(savedActual);
    } else {
      const email = (savedEmail || "").toLowerCase().trim();
      const name = savedName || "";
      if (email.includes("adchanapong") || name.includes("จ๊อบ")) {
        setActualUserRole("admin");
      }
    }

    const saved = localStorage.getItem("cc_user_role");
    if (saved === "admin" || saved === "assignee" || saved === "viewer") {
      setCurrentUserRole(saved);
    }

    // Load assignees list & sync custom quotes & avatars
    const supabase = createClient();
    supabase.from("assignees").select("id, name, unit").then(({ data }) => {
      if (data && data.length > 0) {
        setAssigneesList(data.map((d: any) => ({ id: d.id, name: d.name })));
        syncCustomQuotesFromAssignees(data);
        syncAvatarsFromAssignees(data);
      }
    });

    // Check Mission of the Day (First visit of the day or forced reset)
    const todayStr = new Date().toISOString().split("T")[0];
    const missionKey = `cc_mission_ack_${todayStr}`;
    
    // Check if user requested mission reset via query param e.g. ?reset_mission=1
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isResetRequested = urlParams?.get("reset_mission") === "1" || urlParams?.get("mission") === "reset";
    if (isResetRequested) {
      try {
        localStorage.removeItem(missionKey);
      } catch {}
    }

    const alreadySeen = !isResetRequested && localStorage.getItem(missionKey);

    if (!alreadySeen) {
      supabase
        .from("briefs")
        .select("*")
        .neq("status", "purged")
        .then(({ data: briefsData }) => {
          if (briefsData && briefsData.length > 0) {
            const currentName = savedName || "";
            const currentEmail = savedEmail || "";
            const calculatedMission = computeDailyMission(briefsData, currentName, currentEmail);
            setDailyMission(calculatedMission);
          }
        });
    }

    // Read view from URL query if present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("idc_form") === "public") {
        window.location.href = "/idc-form";
        return;
      }
      const v = params.get("view");
      const r = params.get("report");
      if (v === "assignments" || v === "dashboards" || v === "data-reports") {
        setActiveView(v);
      } else if (r) {
        setActiveView("data-reports");
      }

      const handlePopState = () => {
        const p = new URLSearchParams(window.location.search);
        const curView = p.get("view");
        const curR = p.get("report");
        if (curView === "assignments" || curView === "dashboards" || curView === "data-reports") {
          setActiveView(curView);
        } else if (curR) {
          setActiveView("data-reports");
        } else {
          setActiveView(null);
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  const handleSelectView = (view: "assignments" | "dashboards" | "data-reports" | null) => {
    setActiveView(view);
    setActiveSubReport(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (view) {
        url.searchParams.set("view", view);
      } else {
        url.searchParams.delete("view");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleToggleRole = (role: "admin" | "assignee" | "viewer") => {
    setCurrentUserRole(role);
    localStorage.setItem("cc_user_role", role);
  };

  if (isAuthChecking) {
    return <main className="flex-1 min-h-screen bg-background" />;
  }

  return (
    <main className="flex-1 flex flex-col items-center py-2 md:py-3 w-full min-h-screen overflow-x-hidden">
      <div className={`w-full mx-auto px-3 sm:px-5 md:px-8 transition-all flex flex-col flex-1 ${
        activeView ? "max-w-[1920px]" : "max-w-6xl"
      }`}>
        {/* Top Navigation Bar */}
        <div className="w-full flex flex-row justify-between items-center mb-3 sm:mb-4 pb-2 animate-premium-fade print:hidden relative z-30">
          {/* Left: Logo */}
        <Link href="/" className="text-left inline-flex items-center gap-2.5 sm:gap-3.5 w-fit min-w-0 pr-2 select-none group">
          <AnimatedMascotLogo sizeClassName="w-8 h-8 sm:w-[38px] sm:h-[38px] md:w-[44px] md:h-[44px]" />
          <div className="flex flex-col w-fit">
            <h1 className="text-2xl sm:text-3xl md:text-[38px] font-black tracking-[0.055em] text-foreground leading-none group-hover:text-primary transition-colors whitespace-nowrap">
              CC TEAM
            </h1>
            <p className="w-full text-foreground text-[9.5px] sm:text-[11.85px] md:text-[15px] font-medium leading-none whitespace-nowrap text-justify [text-align-last:justify] select-none box-border mt-0.5 sm:mt-0.5 md:mt-1">
              Creative and Comunication
            </p>
          </div>
        </Link>
        
        {/* Desktop Actions: Visible on md+ */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-3 z-30 shrink-0">
          {/* Role Switcher Pill: Visible only to Admin, and hidden in Assignee view */}
          {isActualAdmin && currentUserRole !== "assignee" && (
            <div className="flex bg-surface border border-surface-border rounded-full p-0.5 shadow-sm">
              <button
                onClick={() => handleToggleRole("admin")}
                className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                  currentUserRole === "admin"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Admin: จัดการทีม, กำหนด KPI, และปรับราคางานหลังบ้านได้"
              >
                <Shield size={12} className={currentUserRole === "admin" ? "text-amber-400" : ""} />
                <span>Admin</span>
              </button>
              <button
                onClick={() => handleToggleRole("assignee")}
                className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                  (currentUserRole as string) === "assignee"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Assignee: ผู้ปฏิบัติงานทั่วไป"
              >
                <User size={12} />
                <span>Assignee</span>
              </button>
              <button
                onClick={() => handleToggleRole("viewer")}
                className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                  currentUserRole === "viewer"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Viewer: ผู้เข้าชม - สิทธิ์ดูได้ทุกอย่าง เหมือน Admin แต่เป็นโหมดอ่านอย่างเดียว (Read-Only) ไม่สามารถแก้ไขได้"
              >
                <Eye size={12} />
                <span>Viewer</span>
              </button>
            </div>
          )}

          {/* Settings Cog: Visible to Admin and Viewer */}
          {(currentUserRole === "admin" || currentUserRole === "viewer") && (
            <button 
              onClick={() => setIsSetupOpen(true)}
              className="flex items-center justify-center p-1.5 sm:p-2 rounded-full border border-surface-border bg-surface hover:bg-surface-border transition-all shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
              title={currentUserRole === "viewer" ? "Setup & Settings (Viewer - อ่านอย่างเดียว)" : "Setup OKRs, Staff & Pricing"}
            >
              <Settings size={18} className="text-foreground sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Manual Link */}
          <a
            href="/manual.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 rounded-full border border-surface-border bg-surface hover:bg-surface-border transition-all shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md cursor-pointer text-slate-600 hover:text-primary"
            title="คู่มือการใช้งานระบบ (Manual - HTML / PDF)"
          >
            <BookOpen size={18} />
          </a>

          <button 
            onClick={() => setIsInternalTaskOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-foreground bg-surface px-5 py-2 rounded-full border border-surface-border shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md hover:text-primary transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Internal Task</span>
          </button>

          {/* User Display & Avatar Button (Click to open Avatar Studio) */}
          {userDisplayName && (
            <button
              onClick={() => setIsAvatarStudioOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-surface-border shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md transition-all cursor-pointer group"
              title="คลิกเพื่อปรับแต่ง 2D Avatar ของคุณ"
            >
              <Assignee3DAvatarBadge name={userDisplayName} size={24} showBorder={false} />
              <span className="font-bold">{userDisplayName}</span>
            </button>
          )}

          <button 
            onClick={() => {
              localStorage.removeItem("cc_user_email");
              localStorage.removeItem("cc_user_role");
              localStorage.removeItem("cc_actual_role");
              localStorage.removeItem("cc_user_name");
              localStorage.removeItem("cc_user_fullname");
              window.location.href = "/login";
            }}
            className="flex items-center justify-center p-2 rounded-full border border-surface-border bg-surface hover:bg-rose-50 hover:text-rose-600 transition-all shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md cursor-pointer text-slate-600"
            title="ออกจากระบบ (Logout)"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Mobile Hamburger Button (3 lines icon): Visible ONLY on mobile (< md) */}
        <div className="flex md:hidden items-center z-30 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-surface-border text-foreground hover:bg-slate-100 transition-all shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] cursor-pointer"
            aria-label="Toggle Mobile Menu"
            title="เมนูหลัก (3 ขีด)"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Slide-Down Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-start">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Card */}
          <div className="relative z-10 m-3 mt-14 bg-surface border border-surface-border rounded-2xl shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
            
            {/* Header inside drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-sm font-bold text-foreground">เมนูจัดการระบบ</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Role Switcher: Visible only to Admin and hidden in Assignee view */}
            {isActualAdmin && currentUserRole !== "assignee" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  บทบาทของคุณ (Role)
                </label>
                <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl border border-surface-border gap-1">
                  <button
                    onClick={() => {
                      handleToggleRole("admin");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currentUserRole === "admin"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Shield size={13} className={currentUserRole === "admin" ? "text-amber-400" : ""} />
                    <span>Admin</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleRole("assignee");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      (currentUserRole as string) === "assignee"
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <User size={13} />
                    <span>Assignee</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleRole("viewer");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currentUserRole === "viewer"
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye size={13} />
                    <span>Viewer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action List */}
            <div className="space-y-2 pt-1">
              {/* 2D Avatar Studio Button */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAvatarStudioOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200/60 text-foreground text-xs font-bold transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Assignee3DAvatarBadge name={userDisplayName || "จ๊อบ AA"} size={26} showBorder={false} />
                  <span>2D Avatar Illustration Studio</span>
                </span>
                <span className="text-amber-600 text-[10px] font-semibold flex items-center gap-1">
                  <Sparkles size={11} /> ปรับแต่ง
                </span>
              </button>

              {/* Internal Task Button */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsInternalTaskOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-surface-border text-foreground text-xs font-bold transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                    <Plus size={16} />
                  </span>
                  <span>+ สร้างงานภายใน (Internal Task)</span>
                </span>
                <span className="text-muted-foreground text-[10px]">บันทึกงาน</span>
              </button>

              {/* Settings / Setup: Admin & Viewer */}
              {(currentUserRole === "admin" || currentUserRole === "viewer") && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSetupOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-surface-border text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-slate-200 text-slate-700">
                      <Settings size={16} />
                    </span>
                    <span>ตั้งค่าระบบ (Setup OKRs & Pricing)</span>
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {currentUserRole === "viewer" ? "โหมดเข้าชม" : "เฉพาะแอดมิน"}
                  </span>
                </button>
              )}

              {/* Manual Link */}
              <a
                href="/manual.html"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-surface-border text-foreground text-xs font-bold transition-all cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                    <BookOpen size={16} />
                  </span>
                  <span>คู่มือการใช้งานระบบ (Manual)</span>
                </span>
                <span className="text-muted-foreground text-[10px]">HTML/PDF</span>
              </a>
            </div>

            {/* Footer: User Display & Logout */}
            <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <User size={15} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-bold text-foreground truncate">
                    {userDisplayName || "CC Member"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {currentUserRole === "admin" ? "สิทธิ์ผู้ดูแลระบบ (Admin)" : currentUserRole === "viewer" ? "ผู้เข้าชม (Viewer - Read-Only)" : "ผู้ปฏิบัติงาน (Assignee)"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("cc_user_email");
                  localStorage.removeItem("cc_user_role");
                  localStorage.removeItem("cc_actual_role");
                  localStorage.removeItem("cc_user_name");
                  localStorage.removeItem("cc_user_fullname");
                  window.location.href = "/login";
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <LogOut size={14} />
                <span>ออกจากระบบ</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!activeView ? (
        <>
        <HalloweenBats />
        {/* Viewer Mode Banner */}
        {currentUserRole === "viewer" && (
          <div className="w-full mb-3 px-4 py-2.5 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center justify-between text-cyan-900 text-xs font-semibold shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Eye size={15} className="text-cyan-600 shrink-0" />
              <span>โหมดผู้เข้าชม (Viewer Mode) • คุณสามารถเข้าดูข้อมูล รายงาน และตัวชี้วัดทุกระบบได้แบบอ่านอย่างเดียว (Read-Only)</span>
            </div>
            <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-cyan-300">
              Read Only
            </span>
          </div>
        )}

        {/* Back to Home Button on Main Control Center */}
        <div className="w-full flex justify-start mb-2 print:hidden z-30 relative">
          <Link 
            href="/" 
            className="group flex items-center gap-2 px-4 py-2 bg-surface border border-surface-border shadow-sm rounded-full text-xs md:text-sm font-semibold text-foreground hover:text-primary hover:border-primary/30 hover:shadow-md transition-all active:scale-95 w-fit cursor-pointer"
            title="Home page"
          >
            <ArrowLeft size={16} className="text-muted-foreground group-hover:text-primary transition-colors -ml-0.5" />
            <span>Home page</span>
          </Link>
        </div>
        
        {/* Dashboard Weather & Quote Widget - Header Section (pointer-events-none ensures it never blocks clicks below) */}
        <div className="w-full animate-premium-fade relative pointer-events-none select-none" style={{ animationDelay: '100ms' }}>
          <div aria-hidden="true">
            <WeatherWidget variant="quoteOnly" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
            <h2 className="text-4xl sm:text-6xl md:text-[120px] lg:text-[150px] font-black tracking-tighter text-primary leading-none mb-6 sm:mb-12 drop-shadow-sm text-center max-w-full">
              Control Center
            </h2>
          </div>
        </div>
        
        {/* 3 Buttons Grid: Fully Clickable with High z-index & Pointer cursor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-6 sm:mt-8 md:mt-10 lg:mt-12 relative z-20">
            
            {/* 1. Tasks */}
            <div className="flex flex-col items-center text-center animate-premium-fade" style={{ animationDelay: '200ms' }}>
              <button 
                type="button"
                onClick={() => handleSelectView("assignments")} 
                className="flex flex-col items-center group cursor-pointer w-full focus:outline-none transition-all"
              >
                <div className="w-36 h-36 rounded-full rams-circle animate-btn-glow flex items-center justify-center transition-all duration-300 mb-3 group-hover:scale-105 group-active:scale-95 shadow-md group-hover:shadow-xl" style={{ animationDelay: '0s' }}>
                  <LayoutList size={48} className="text-slate-800 opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground tracking-wide group-hover:text-primary transition-colors">Tasks</h2>
                <p className="text-sm text-muted-foreground/80 leading-relaxed font-light px-2 max-w-[250px] group-hover:text-foreground/90 transition-colors">
                  บริหารจัดการงานประจำวันของทีม<br/>กระจายภาระงาน (Workloads)<br/>และอัปเดตความคืบหน้าโปรเจกต์
                </p>
              </button>
            </div>

            {/* 2. Insights */}
            <div className="flex flex-col items-center text-center animate-premium-fade" style={{ animationDelay: '200ms' }}>
              <button 
                type="button"
                onClick={() => handleSelectView("dashboards")} 
                className="flex flex-col items-center group cursor-pointer w-full focus:outline-none transition-all"
              >
                <div className="w-36 h-36 rounded-full rams-circle animate-btn-glow flex items-center justify-center transition-all duration-300 mb-3 group-hover:scale-105 group-active:scale-95 shadow-md group-hover:shadow-xl" style={{ animationDelay: '0s' }}>
                  <LayoutDashboard size={48} className="text-slate-800 opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground tracking-wide group-hover:text-primary transition-colors">Insights</h2>
                <p className="text-sm text-muted-foreground/80 leading-relaxed font-light px-2 max-w-[250px] group-hover:text-foreground/90 transition-colors">
                  ติดตามผลการดำเนินงานและเป้าหมาย<br/>ภาพรวม OKRs, ความคืบหน้า KR/R/TIP<br/>และดูสรุปรายงานสถานะการเงิน
                </p>
              </button>
            </div>

            {/* 3. Back of House */}
            <div className="flex flex-col items-center text-center animate-premium-fade" style={{ animationDelay: '250ms' }}>
              <button 
                type="button"
                onClick={() => handleSelectView("data-reports")} 
                className="flex flex-col items-center group cursor-pointer w-full focus:outline-none transition-all"
              >
                <div className="w-36 h-36 rounded-full rams-circle animate-btn-glow flex items-center justify-center transition-all duration-300 mb-3 group-hover:scale-105 group-active:scale-95 shadow-md group-hover:shadow-xl" style={{ animationDelay: '0s' }}>
                  <FileText size={48} className="text-slate-800 opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground tracking-wide group-hover:text-primary transition-colors">Back of House</h2>
                <p className="text-sm text-muted-foreground/80 leading-relaxed font-light px-2 max-w-[250px] group-hover:text-foreground/90 transition-colors">
                  รายงานข้อมูล RSP, เอกสาร ISO เช่น WI<br/>ประเมินความเสี่ยง, การอบรม, การประชุม<br/>และรวบรวมข้อมูลการทำงาน
                </p>
              </button>
            </div>

          </div>
          </>
        ) : (
        // Show selected view
          <div className="w-full flex-1 min-h-0 flex flex-col animate-premium-fade">
            {!activeSubReport && (
              <div className="mb-2 sm:mb-4 shrink-0 print:hidden pt-0.5 sm:pt-1">
                <button 
                  onClick={() => handleSelectView(null)}
                  className="group flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-surface border border-surface-border shadow-xs rounded-full text-xs sm:text-sm font-semibold text-foreground hover:text-primary hover:border-primary/30 hover:shadow-md transition-all active:scale-95 w-fit cursor-pointer"
                >
                  <ArrowLeft size={14} className="text-muted-foreground group-hover:text-primary transition-colors -ml-0.5" />
                  <span>Control Center</span>
                </button>
              </div>
            )}
          
          {activeView === "assignments" && <AssignmentsView />}
          {activeView === "dashboards" && <DashboardsView currentUserRole={currentUserRole} />}
          {activeView === "data-reports" && (
            <DataReportsView onSubReportChange={(subId) => setActiveSubReport(subId)} />
          )}
        </div>
      )}
      </div>

      {/* Modals */}
      {isSetupOpen && (
        <SetupModal 
          onClose={() => setIsSetupOpen(false)} 
          isReadOnly={currentUserRole === "viewer"} 
        />
      )}
      {isInternalTaskOpen && <InternalTaskModal onClose={() => setIsInternalTaskOpen(false)} />}
      <Avatar3DStudioModal
        isOpen={isAvatarStudioOpen}
        onClose={() => setIsAvatarStudioOpen(false)}
        currentMemberName={userDisplayName || "จ๊อบ AA"}
        assignees={assigneesList}
      />
      {dailyMission && (
        <DailyMissionModal
          mission={dailyMission}
          onAcknowledge={async () => {
            const todayStr = new Date().toISOString().split("T")[0];
            const missionKey = `cc_mission_ack_${todayStr}`;
            try {
              localStorage.setItem(missionKey, new Date().toISOString());

              // 1. Log to Advice History / Audit Trail
              const actor = getCurrentActor();
              await logActivity({
                action: "DAILY_MISSION_ACK",
                actor_name: actor.name,
                actor_email: actor.email,
                actor_role: actor.role,
                details: {
                  headline: dailyMission.headline,
                  missions: dailyMission.missions,
                  urgentTasksCount: dailyMission.urgentTasksCount,
                  unassignedCount: dailyMission.unassignedCount,
                  overdueCount: dailyMission.overdueCount,
                  positiveImpact: dailyMission.positiveImpact,
                  riskImpact: dailyMission.riskImpact,
                  acknowledged_at: new Date().toISOString(),
                },
              });

              // 2. Also record to notification history drawer for quick review
              const notifHistory = JSON.parse(localStorage.getItem("cc_recent_assignment_alerts") || "[]");
              const missionAlert = {
                id: `mission_${todayStr}`,
                projectName: `🎯 ภารกิจประจำวัน: ${dailyMission.headline}`,
                taskCode: "MISSION",
                deadline: todayStr,
                requesterName: "ระบบชี้แจงเป้าหมายประจำวัน",
                unit: dailyMission.roleTitle,
                alertType: "assigned",
                timestamp: Date.now(),
              };
              const updated = [missionAlert, ...notifHistory.filter((h: any) => h.id !== missionAlert.id)].slice(0, 30);
              localStorage.setItem("cc_recent_assignment_alerts", JSON.stringify(updated));
              window.dispatchEvent(new CustomEvent("cc_notif_history_updated"));
            } catch (err) {
              console.warn("Failed to log mission ack:", err);
            }
            setDailyMission(null);
          }}
        />
      )}
      {/* Floating Admin Switcher: Only visible when an authentic Admin is simulating Assignee view */}
      {isActualAdmin && currentUserRole === "assignee" && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300 text-xs select-none">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">มุมมอง Assignee</span>
          </span>
          <div className="h-3.5 w-px bg-slate-700" />
          <button
            onClick={() => handleToggleRole("admin")}
            className="flex items-center gap-1.5 font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="คลิกเพื่อกลับสู่โหมด Admin"
          >
            <Shield size={13} />
            <span>กลับเป็น Admin</span>
          </button>
        </div>
      )}

      {/* Active Assignment Desktop & Sound Notifier */}
      <ActiveAssignmentNotifier
        currentMemberName={userDisplayName}
        currentMemberEmail={typeof window !== "undefined" ? (localStorage.getItem("cc_user_email") || "") : ""}
        assigneesList={assigneesList}
        onOpenTask={(taskId) => {
          handleSelectView("assignments");
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("view", "assignments");
            url.searchParams.set("highlightId", taskId);
            window.history.pushState({}, "", url.toString());
          }
        }}
      />
    </main>
  );
}
