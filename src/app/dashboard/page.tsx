"use client";

import { useState, useEffect } from "react";
import WeatherWidget from "@/components/WeatherWidget";
import Link from "next/link";
import { ArrowLeft, Settings, Plus, LayoutDashboard, LayoutList, FileText, Shield, User, LogOut, BookOpen } from "lucide-react";
import AssignmentsView from "./components/AssignmentsView";
import DashboardsView from "./components/DashboardsView";
import DataReportsView from "./components/DataReportsView";
import SetupModal from "./components/SetupModal";
import AlertSummary from "./components/AlertSummary";
import InternalTaskModal from "./components/InternalTaskModal";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<"assignments" | "dashboards" | "data-reports" | null>(null);
  const [activeSubReport, setActiveSubReport] = useState<string | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isInternalTaskOpen, setIsInternalTaskOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "assignee">("admin");
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const savedEmail = typeof window !== "undefined" ? localStorage.getItem("cc_user_email") : null;
    if (!savedEmail) {
      window.location.href = "/login";
      return;
    }
    setIsAuthChecking(false);
    const savedName = localStorage.getItem("cc_user_name");
    if (savedName) setUserDisplayName(savedName);

    const saved = localStorage.getItem("cc_user_role");
    if (saved === "admin" || saved === "assignee") {
      setCurrentUserRole(saved);
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

  const handleToggleRole = (role: "admin" | "assignee") => {
    setCurrentUserRole(role);
    localStorage.setItem("cc_user_role", role);
  };

  if (isAuthChecking) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-2 md:px-8 md:py-3 max-w-6xl mx-auto w-full min-h-screen">
      {/* Top Navigation Bar */}
      <div className="w-full flex flex-row justify-between items-center mb-6 pb-2 animate-premium-fade print:hidden">
        {/* Left: Logo */}
        <Link href="/" className="text-left flex flex-col">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-none">CC TEAM</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
            Briefing & Management System
          </p>
        </Link>
        
        {/* Right: Actions, Theme Switcher & Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 z-30 shrink-0">
          {/* Theme Mode Switcher: Light / Dark / Auto */}
          <ThemeToggle />

          {/* Role Switcher Pill */}
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
                currentUserRole === "assignee"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Assignee: ผู้ปฏิบัติงานทั่วไป (ไม่เห็นปุ่มฟันเฟือง)"
            >
              <User size={12} />
              <span>Assignee</span>
            </button>
          </div>

          {/* Settings Cog: Visible ONLY to Admin */}
          {currentUserRole === "admin" && (
            <button 
              onClick={() => setIsSetupOpen(true)}
              className="flex items-center justify-center p-1.5 sm:p-2 rounded-full border border-surface-border bg-surface hover:bg-surface-border transition-all shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
              title="Setup OKRs, Staff & Pricing"
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
            <span className="hidden md:inline">Internal Task</span>
          </button>

          {/* User Display & Logout Button */}
          {userDisplayName && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
              <User size={13} className="text-slate-500" />
              <span>{userDisplayName}</span>
            </div>
          )}

          <button 
            onClick={() => {
              localStorage.removeItem("cc_user_email");
              localStorage.removeItem("cc_user_role");
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
      </div>

      {/* Main Content Area */}
      {!activeView ? (
        <>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2 className="text-[12vw] md:text-[160px] font-black tracking-tighter text-primary leading-none mb-12 whitespace-nowrap drop-shadow-sm">
              Control Center
            </h2>
          </div>
        </div>
        
        {/* 3 Buttons Grid: Fully Clickable with High z-index & Pointer cursor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-2 relative z-20">
            
            {/* 1. Tasks */}
            <div className="flex flex-col items-center text-center animate-premium-fade" style={{ animationDelay: '200ms' }}>
              <button 
                type="button"
                onClick={() => handleSelectView("assignments")} 
                className="flex flex-col items-center group cursor-pointer w-full focus:outline-none transition-all"
              >
                <div className="w-36 h-36 rounded-full rams-circle animate-btn-glow flex items-center justify-center transition-all duration-300 mb-3 group-hover:scale-105 group-active:scale-95 shadow-md group-hover:shadow-xl" style={{ animationDelay: '0s' }}>
                  <LayoutList size={48} className="text-foreground opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
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
                  <LayoutDashboard size={48} className="text-foreground opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
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
                  <FileText size={48} className="text-foreground opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
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
              <div className="mb-3 sm:mb-4 shrink-0 print:hidden pt-1">
                <button 
                    onClick={() => handleSelectView(null)}
                    className="group flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-5 sm:py-2.5 bg-surface border border-surface-border shadow-sm rounded-full text-xs sm:text-sm font-semibold text-foreground hover:text-primary hover:border-primary/30 hover:shadow-md transition-all active:scale-95 w-fit cursor-pointer"
                  >
                    <ArrowLeft size={16} className="text-muted-foreground group-hover:text-primary transition-colors sm:w-[18px] sm:h-[18px]" /> 
                    <span className="hidden sm:inline">Back to Control Center</span>
                    <span className="sm:hidden font-medium">Control Center</span>
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

      {/* Modals */}
      {isSetupOpen && <SetupModal onClose={() => setIsSetupOpen(false)} />}
      {isInternalTaskOpen && <InternalTaskModal onClose={() => setIsInternalTaskOpen(false)} />}
    </main>
  );
}
