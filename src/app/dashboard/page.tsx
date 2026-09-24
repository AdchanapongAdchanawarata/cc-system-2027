"use client";

import { useState, useEffect } from "react";
import WeatherWidget from "@/components/WeatherWidget";
import Link from "next/link";
import { ArrowLeft, Settings, Plus, LayoutDashboard, LayoutList, FileText, Shield, User, LogOut, BookOpen, Menu, X } from "lucide-react";
import AssignmentsView from "./components/AssignmentsView";
import DashboardsView from "./components/DashboardsView";
import DataReportsView from "./components/DataReportsView";
import SetupModal from "./components/SetupModal";
import AlertSummary from "./components/AlertSummary";
import InternalTaskModal from "./components/InternalTaskModal";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<"assignments" | "dashboards" | "data-reports" | null>(null);
  const [activeSubReport, setActiveSubReport] = useState<string | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isInternalTaskOpen, setIsInternalTaskOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "assignee">("admin");
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);
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
    <main className="flex-1 flex flex-col items-center px-2.5 sm:px-4 md:px-8 py-2 md:py-3 max-w-6xl mx-auto w-full min-h-screen overflow-x-hidden">
      {/* Top Navigation Bar */}
      <div className="w-full flex flex-row justify-between items-center mb-4 sm:mb-6 pb-2 animate-premium-fade print:hidden relative z-30">
        {/* Left: Logo */}
        <Link href="/" className="text-left inline-flex flex-col w-fit min-w-0 pr-2 select-none group">
          <h1 className="text-2xl sm:text-3xl md:text-[38px] font-black tracking-[0.055em] text-foreground leading-none group-hover:text-primary transition-colors">
            CC TEAM
          </h1>
          <p className="text-muted-foreground text-[8.5px] sm:text-[10.5px] md:text-[13px] font-medium tracking-[0.005em] mt-1 leading-none whitespace-nowrap">
            Briefing & Management System
          </p>
        </Link>
        
        {/* Desktop Actions: Visible on md+ */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-3 z-30 shrink-0">
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
            <span>Internal Task</span>
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

            {/* Role Switcher */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                บทบาทของคุณ (Role)
              </label>
              <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-surface-border gap-1">
                <button
                  onClick={() => {
                    handleToggleRole("admin");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentUserRole === "admin"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shield size={14} className={currentUserRole === "admin" ? "text-amber-400" : ""} />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => {
                    handleToggleRole("assignee");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentUserRole === "assignee"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User size={14} />
                  <span>Assignee</span>
                </button>
              </div>
            </div>

            {/* Action List */}
            <div className="space-y-2 pt-1">
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

              {/* Settings / Setup: Admin Only */}
              {currentUserRole === "admin" && (
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
                  <span className="text-muted-foreground text-[10px]">เฉพาะแอดมิน</span>
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
                    {currentUserRole === "admin" ? "สิทธิ์ผู้ดูแลระบบ" : "ผู้ปฏิบัติงาน"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("cc_user_email");
                  localStorage.removeItem("cc_user_role");
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-2 relative z-20">
            
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

      {/* Modals */}
      {isSetupOpen && <SetupModal onClose={() => setIsSetupOpen(false)} />}
      {isInternalTaskOpen && <InternalTaskModal onClose={() => setIsInternalTaskOpen(false)} />}
    </main>
  );
}
