"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, ArrowRight, CheckCircle2, Clock, AlertCircle, FileText, 
  ExternalLink, Star, Phone, Mail, User, Calendar, Tag, ChevronRight,
  Sparkles, X, Download, ShieldCheck, ArrowLeft
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { parseMemberRecord, DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";
import { getTaskSurveyUrl } from "@/utils/surveyTokens";
import { resolveTaskCode } from "@/utils/taskCodeService";
import { syncCustomQuotesFromAssignees, getMemberCustomQuote } from "@/utils/memberQuote";
import { Assignee3DAvatarBadge, CHEEKY_QUOTES } from "@/components/Assignee3DAvatarBadge";

interface BriefItem {
  id: string;
  unit: string;
  coordinator_nickname?: string;
  requester_name?: string;
  requester_email?: string;
  requester_phone?: string;
  decision_maker?: string;
  project_name?: string;
  details?: any;
  notes?: string | null;
  deadline?: string | null;
  status: "pending" | "in_progress" | "completed" | "complete" | "cancelled" | string;
  created_at: string;
  in_progress_at?: string | null;
  completed_at?: string | null;
  assignee_id?: string | null;
}

function calculateTaskCode(b: BriefItem, allBriefs: BriefItem[]): string {
  if (b.details?.task_code) return b.details.task_code;
  if (b.details?.idc_code && b.details.idc_code.includes("70-")) return b.details.idc_code;
  if (b.details?.rsp_code && b.details.rsp_code.includes("70-")) return b.details.rsp_code;
  return resolveTaskCode(b, allBriefs);
}

function getUnitBadge(unit: string) {
  const u = (unit || "creative").toLowerCase();
  switch (u) {
    case "creative":
      return {
        label: "Creative Design",
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-500",
      };
    case "content":
      return {
        label: "Content Creator",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "pr":
      return {
        label: "Public Relations",
        bg: "bg-sky-50 text-sky-700 border-sky-200",
        dot: "bg-sky-500",
      };
    case "internal":
      return {
        label: "Internal Task",
        bg: "bg-zinc-100 text-zinc-700 border-zinc-200",
        dot: "bg-zinc-500",
      };
    default:
      return {
        label: u.toUpperCase(),
        bg: "bg-zinc-100 text-zinc-700 border-zinc-200",
        dot: "bg-zinc-400",
      };
  }
}

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryParam = searchParams.get("q") || searchParams.get("email") || searchParams.get("id") || "";

  const [searchInput, setSearchInput] = useState(queryParam);
  const [hasSearched, setHasSearched] = useState(Boolean(queryParam));
  const [isLoading, setIsLoading] = useState(false);
  const [allBriefs, setAllBriefs] = useState<BriefItem[]>([]);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [matchedBriefs, setMatchedBriefs] = useState<BriefItem[]>([]);
  const [selectedBriefForModal, setSelectedBriefForModal] = useState<BriefItem | null>(null);
  const [quoteVersion, setQuoteVersion] = useState(0);

  // Re-render when custom quote changes
  useEffect(() => {
    const handleQuoteUpdated = () => setQuoteVersion((v) => v + 1);
    window.addEventListener("cc_quote_updated", handleQuoteUpdated);
    return () => window.removeEventListener("cc_quote_updated", handleQuoteUpdated);
  }, []);

  // Load all briefs & assignees on mount with real-time subscription
  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      try {
        const [{ data: bData }, { data: aData }] = await Promise.all([
          supabase
            .from("briefs")
            .select("*")
            .neq("status", "purged")
            .order("created_at", { ascending: true }),
          supabase.from("assignees").select("id, name, email, unit, full_name, position, phone"),
        ]);

        if (bData) {
          const nonDeleted = bData.filter((b) => !b.details?.is_permanently_deleted);
          setAllBriefs(nonDeleted);
        }
        if (aData) {
          setAssignees(aData);
          syncCustomQuotesFromAssignees(aData);
        }
      } catch (err) {
        console.error("Failed to fetch tracking data:", err);
      }
    }

    loadData();

    // Real-time listener for instantaneous status/assignment updates
    const channel = supabase
      .channel("public:track:briefs")
      .on("postgres_changes", { event: "*", schema: "public", table: "briefs" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Perform search with fresh Supabase fetch to guarantee zero-lag data
  const executeSearch = async (term: string, fallbackList: BriefItem[] = allBriefs) => {
    const clean = term.trim().toLowerCase();
    if (!clean) {
      setMatchedBriefs([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const [{ data: bData }, { data: aData }] = await Promise.all([
        supabase
          .from("briefs")
          .select("*")
          .neq("status", "purged")
          .order("created_at", { ascending: true }),
        supabase.from("assignees").select("id, name, email, unit, full_name, position, phone"),
      ]);

      const freshBriefs = bData ? bData.filter((b) => !b.details?.is_permanently_deleted) : fallbackList;
      if (freshBriefs.length > 0) setAllBriefs(freshBriefs);
      if (aData && aData.length > 0) {
        setAssignees(aData);
        syncCustomQuotesFromAssignees(aData);
      }

      const results = freshBriefs.filter((b) => {
        const code = calculateTaskCode(b, freshBriefs).toLowerCase();
        const bId = (b.id || "").toLowerCase();
        const email = (b.requester_email || "").toLowerCase();
        const pName = (b.project_name || "").toLowerCase();
        const nick = (b.coordinator_nickname || b.requester_name || "").toLowerCase();
        const team = (b.decision_maker || b.details?.team || "").toLowerCase();
        const detailEmail = (b.details?.email || b.details?.reporter_contact || "").toLowerCase();
        const detailClient = (b.details?.client_name || b.details?.reporter_name || "").toLowerCase();
        const idcCode = (b.details?.idc_code || "").toLowerCase();
        const rspCode = (b.details?.rsp_code || "").toLowerCase();

        return (
          code.includes(clean) ||
          bId === clean ||
          email.includes(clean) ||
          pName.includes(clean) ||
          nick.includes(clean) ||
          team.includes(clean) ||
          detailEmail.includes(clean) ||
          detailClient.includes(clean) ||
          idcCode.includes(clean) ||
          rspCode.includes(clean)
        );
      });

      // Sort with latest on top
      results.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMatchedBriefs(results);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run search when allBriefs loads if queryParam exists
  useEffect(() => {
    if (allBriefs.length > 0 && queryParam) {
      setSearchInput(queryParam);
      executeSearch(queryParam, allBriefs);
    }
  }, [allBriefs.length, queryParam]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    // Update URL query param cleanly without reload
    const params = new URLSearchParams(window.location.search);
    params.set("q", searchInput.trim());
    router.replace(`/track?${params.toString()}`);

    executeSearch(searchInput, allBriefs);
  };

  const getAssigneeProfile = (brief: BriefItem) => {
    // 1. Direct assignee_id or details.assignee_id
    const targetId = brief.assignee_id || brief.details?.assignee_id;
    let found = targetId ? assignees.find((a) => a.id === targetId) : null;

    // 2. Name match in assignees table
    if (!found) {
      const nameCandidate = brief.details?.assignee_name || brief.details?.kickoff_email_sender;
      if (nameCandidate) {
        found = assignees.find((a) => 
          a.name === nameCandidate || 
          nameCandidate.includes(a.name) || 
          (a.full_name && nameCandidate.includes(a.full_name))
        );
      }
    }

    if (found) {
      return parseMemberRecord(found);
    }

    // 3. Fallback to DEFAULT_MEMBER_METADATA if name is known
    const nameCandidate = brief.details?.assignee_name || brief.details?.kickoff_email_sender;
    if (nameCandidate) {
      const matchedKey = Object.keys(DEFAULT_MEMBER_METADATA).find((k) => 
        k === nameCandidate || nameCandidate.includes(k) || DEFAULT_MEMBER_METADATA[k].fullName === nameCandidate
      );
      if (matchedKey) {
        const meta = DEFAULT_MEMBER_METADATA[matchedKey];
        return {
          id: matchedKey,
          name: matchedKey,
          fullName: meta.fullName,
          position: meta.position,
          phone: meta.phone,
          email: `${matchedKey.toLowerCase().replace(/\s+/g, '')}@step.cmu.ac.th`,
          unit: brief.unit || 'creative',
          role: 'assignee' as any,
          isActive: true
        };
      }
    }

    return null;
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-start py-10 px-4 sm:px-6 w-full max-w-4xl mx-auto min-h-[85vh]">
      {/* Page Title & Subtitle */}
      <div className="w-full text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-3">
          <Sparkles size={13} className="text-orange-600" />
          <span>CC TEAM Service Tracking</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mb-2">
          Track Your Brief
        </h1>
        <p className="text-zinc-500 text-sm sm:text-base max-w-lg mx-auto">
          ติดตามสถานะความคืบหน้าของงานที่ท่านส่งคำขอรับบริการกับทีมสร้างสรรค์และการสื่อสาร (CC TEAM)
        </p>
      </div>

      {/* Dieter Rams Minimalist Search Card */}
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-sm relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-amber-400"></div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="search" className="text-xs sm:text-sm font-bold text-zinc-700 tracking-wide uppercase">
              ค้นหาด้วยอีเมล หรือ รหัสงาน (Email or Task Code)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                id="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 text-sm sm:text-base border border-zinc-200 bg-zinc-50/70 hover:bg-white rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                placeholder="เช่น somchai@step.cmu.ac.th หรือ PR70-14, DS70-1"
                required
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setMatchedBriefs([]);
                    setHasSearched(false);
                    router.replace("/track");
                  }}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
              <span className="font-medium text-zinc-400">ตัวอย่าง:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("PR70-14");
                  executeSearch("PR70-14", allBriefs);
                }}
                className="px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
              >
                PR70-14
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("DS70-1");
                  executeSearch("DS70-1", allBriefs);
                }}
                className="px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
              >
                DS70-1
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("@step.cmu.ac.th");
                  executeSearch("@step.cmu.ac.th", allBriefs);
                }}
                className="px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
              >
                @step.cmu.ac.th
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-7 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#f05a28] to-[#ff6b35] hover:opacity-95 active:scale-[0.98] rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังค้นหา...</span>
                </>
              ) : (
                <>
                  <span>ตรวจสอบสถานะ</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-zinc-700 tracking-wide uppercase">
              ผลการค้นหา {matchedBriefs.length > 0 && `(${matchedBriefs.length} รายการ)`}
            </h2>
            <span className="text-xs text-zinc-400">
              คำค้นหา: &ldquo;{searchInput}&rdquo;
            </span>
          </div>

          {matchedBriefs.length === 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-base font-bold text-zinc-800">ไม่พบบรีฟงานที่ตรงกับคำค้นหา</h3>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
                กรุณาตรวจสอบว่ากรอกอีเมลถูกต้อง (เช่น name@step.cmu.ac.th) หรือลองค้นหาด้วยรหัสงาน หรือชื่องาน
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setMatchedBriefs([]);
                  setHasSearched(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors cursor-pointer"
              >
                ล้างคำค้นหา
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {matchedBriefs.map((brief) => {
                const taskCode = calculateTaskCode(brief, allBriefs);
                const badge = getUnitBadge(brief.unit);
                const assignee = getAssigneeProfile(brief);
                const isCompleted = brief.status === "completed" || brief.status === "complete";
                const isInProgress = brief.status === "in_progress";
                const isCancelled = brief.status === "cancelled";
                const isPending = !isCompleted && !isInProgress && !isCancelled;

                const requesterName = (
                  brief.coordinator_nickname ||
                  brief.requester_name ||
                  brief.details?.reporter_name ||
                  brief.details?.client_name ||
                  "ผู้สั่งงาน"
                ).toString().trim();
                const team = (brief.decision_maker || brief.details?.team || "-").toString().trim();
                const surveyUrl = isCompleted ? getTaskSurveyUrl(brief.id, brief.assignee_id || undefined) : "";
                const satisfactionPercent = brief.details?.satisfaction_scores?.averagePercent;

                return (
                  <div
                    key={brief.id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 p-5 sm:p-7 shadow-xs hover:shadow-md transition-all space-y-5"
                  >
                    {/* Top Row: Task Code & Category Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-zinc-900 text-white shadow-2xs">
                          {taskCode}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>
                        {brief.details?.category && (
                          <span className="text-[11px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                            {brief.details.category}
                          </span>
                        )}
                      </div>

                      {/* Status Pill */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>ส่งมอบงานเสร็จสมบูรณ์</span>
                        </span>
                      )}
                      {isInProgress && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                          <Clock size={13} className="text-blue-600" />
                          <span>กำลังดำเนินงาน</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={13} className="text-amber-600" />
                          <span>{!brief.assignee_id ? "รอมอบหมายผู้รับผิดชอบ" : "รอทำ (Pending)"}</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                          <X size={13} className="text-red-600" />
                          <span>ยกเลิกงาน</span>
                        </span>
                      )}
                    </div>

                    {/* Project Name & Requester details */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                        {brief.project_name || "ไม่ระบุชื่องาน"}
                      </h3>
                      <div className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>ผู้สั่งงาน: <strong className="text-zinc-700">{requesterName}</strong></span>
                        <span>•</span>
                        <span>ทีม: <strong className="text-zinc-700">{team}</strong></span>
                        {brief.requester_email && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-zinc-500">{brief.requester_email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Visual 4-Stage Progress Stepper */}
                    <div className="bg-zinc-50/80 rounded-xl sm:rounded-2xl p-4 border border-zinc-100">
                      <div className="grid grid-cols-4 gap-2 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-3.5 left-[12%] right-[12%] h-0.5 bg-zinc-200 -z-0"></div>

                        {/* Step 1: ยื่นเรื่อง */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                            <CheckCircle2 size={15} />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-800 mt-1.5">ยื่นเรื่องแล้ว</span>
                          <span className="text-[10px] text-zinc-400">{formatDate(brief.created_at)}</span>
                        </div>

                        {/* Step 2: จัดสรรทีมงาน */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                            isInProgress || isCompleted
                              ? "bg-emerald-500 text-white"
                              : isPending
                              ? "bg-amber-500 text-white animate-pulse"
                              : "bg-zinc-200 text-zinc-500"
                          }`}>
                            {isInProgress || isCompleted ? <CheckCircle2 size={15} /> : "2"}
                          </div>
                          <span className="text-[11px] font-bold text-zinc-800 mt-1.5">จัดสรรทีม</span>
                          <span className="text-[10px] text-zinc-400">
                            {assignee ? assignee.name : "กำลังมอบหมาย"}
                          </span>
                        </div>

                        {/* Step 3: เริ่มดำเนินงาน */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : isInProgress
                              ? "bg-blue-600 text-white animate-pulse"
                              : "bg-zinc-200 text-zinc-500"
                          }`}>
                            {isCompleted ? <CheckCircle2 size={15} /> : "3"}
                          </div>
                          <span className="text-[11px] font-bold text-zinc-800 mt-1.5">ดำเนินงาน</span>
                          <span className="text-[10px] text-zinc-400">
                            {formatDate(brief.in_progress_at)}
                          </span>
                        </div>

                        {/* Step 4: ส่งมอบเสร็จสมบูรณ์ */}
                        <div className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : "bg-zinc-200 text-zinc-500"
                          }`}>
                            {isCompleted ? <CheckCircle2 size={15} /> : "4"}
                          </div>
                          <span className="text-[11px] font-bold text-zinc-800 mt-1.5">ส่งมอบงาน</span>
                          <span className="text-[10px] text-zinc-400">
                            {formatDate(brief.completed_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Assignee Contact & Deadlines Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Assignee Box */}
                      <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-start gap-3.5">
                        <div className="shrink-0 mt-0.5">
                          {assignee ? (
                            <Assignee3DAvatarBadge name={assignee.name} size={64} showBorder />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center font-bold text-xs">
                              <User size={24} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-zinc-400 font-medium">ผู้รับผิดชอบงานจากทีม CC</div>
                          <div className="text-sm font-bold text-zinc-900 truncate">
                            {assignee ? `${assignee.fullName} (${assignee.name})` : "อยู่ระหว่างการจัดสรร"}
                          </div>
                          {assignee && (
                            <div className="text-xs text-zinc-500 truncate mt-0.5">
                              {assignee.position}
                            </div>
                          )}
                          {assignee?.phone && assignee.phone !== "-" && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600">
                              <Phone size={11} className="text-zinc-400 shrink-0" />
                              <a href={`tel:${assignee.phone}`} className="hover:text-orange-600 transition-colors font-mono font-medium">
                                {assignee.phone}
                              </a>
                            </div>
                          )}
                          {assignee && (() => {
                            const quote = getMemberCustomQuote(assignee.name) || CHEEKY_QUOTES[assignee.name]?.[0];
                            if (!quote) return null;
                            return (
                              <div className="mt-2.5 pt-2 border-t border-zinc-200/70">
                                <p className="text-xs font-bold text-amber-950 leading-snug tracking-tight bg-amber-50/70 border border-amber-200/60 rounded-xl px-2.5 py-1.5 shadow-2xs">
                                  <span className="text-amber-500 font-serif mr-1 text-sm font-black select-none">“</span>
                                  {quote}
                                  <span className="text-amber-500 font-serif ml-1 text-sm font-black select-none">”</span>
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Dates & Timeline Box */}
                      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1.5 text-xs">
                        <div className="text-[11px] text-zinc-400 font-medium">กำหนดการและวันส่งมอบ</div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">วันที่ยื่นเรื่อง:</span>
                          <span className="font-medium text-zinc-800">{formatDate(brief.created_at)}</span>
                        </div>
                        {brief.details?.draft_date && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">ต้องการดราฟแรก:</span>
                            <span className="font-medium text-zinc-800">{brief.details.draft_date}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">กำหนดส่งมอบ (Deadline):</span>
                          <span className="font-bold text-orange-600">
                            {brief.deadline ? formatDate(brief.deadline) : "ตามตกลง"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setSelectedBriefForModal(brief)}
                        className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={13} className="text-zinc-500" />
                        <span>ดูรายละเอียดบรีฟฉบับเต็ม</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isCompleted && surveyUrl && (
                          <a
                            href={surveyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 rounded-full shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Star size={13} className="fill-white" />
                            <span>
                              {satisfactionPercent !== undefined
                                ? `ประเมินแล้ว (${satisfactionPercent}%)`
                                : "ทำแบบประเมินความพึงพอใจ"}
                            </span>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {assignee?.email && (
                          <a
                            href={`mailto:${assignee.email}?subject=[สอบถามความคืบหน้า] ${taskCode} - ${brief.project_name || 'งาน'}`}
                            className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 rounded-full transition-colors flex items-center gap-1.5"
                          >
                            <Mail size={12} className="text-zinc-400" />
                            <span>สอบถามทีมงาน</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: View Full Brief Details */}
      {selectedBriefForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-zinc-200 shadow-xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-900 text-white">
                  {calculateTaskCode(selectedBriefForModal, allBriefs)}
                </span>
                <span className="text-sm font-bold text-zinc-800 truncate">
                  {selectedBriefForModal.project_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBriefForModal(null)}
                className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-zinc-700">
              <div>
                <span className="text-zinc-400 font-medium block text-xs">ชื่องาน / โครงการ:</span>
                <p className="font-semibold text-zinc-900 mt-0.5">{selectedBriefForModal.project_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-400 font-medium block text-xs">ผู้ติดต่อ/ผู้สั่งงาน:</span>
                  <p className="font-medium text-zinc-800 mt-0.5">
                    {selectedBriefForModal.coordinator_nickname || selectedBriefForModal.requester_name || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 font-medium block text-xs">ทีม/ฝ่าย:</span>
                  <p className="font-medium text-zinc-800 mt-0.5">
                    {selectedBriefForModal.decision_maker || selectedBriefForModal.details?.team || "-"}
                  </p>
                </div>
              </div>

              {selectedBriefForModal.details?.category && (
                <div>
                  <span className="text-zinc-400 font-medium block text-xs">ประเภทงาน:</span>
                  <p className="font-medium text-zinc-800 mt-0.5">{selectedBriefForModal.details.category}</p>
                </div>
              )}

              {selectedBriefForModal.details?.objective && (
                <div>
                  <span className="text-zinc-400 font-medium block text-xs">วัตถุประสงค์งาน:</span>
                  <p className="text-zinc-800 mt-0.5 whitespace-pre-line bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    {selectedBriefForModal.details.objective}
                  </p>
                </div>
              )}

              {(selectedBriefForModal.details?.details || selectedBriefForModal.details?.description) && (
                <div>
                  <span className="text-zinc-400 font-medium block text-xs">รายละเอียดบรีฟ:</span>
                  <p className="text-zinc-800 mt-0.5 whitespace-pre-line bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    {selectedBriefForModal.details.details || selectedBriefForModal.details.description}
                  </p>
                </div>
              )}

              {selectedBriefForModal.details?.target_audience && (
                <div>
                  <span className="text-zinc-400 font-medium block text-xs">กลุ่มเป้าหมาย:</span>
                  <p className="text-zinc-800 mt-0.5">{selectedBriefForModal.details.target_audience}</p>
                </div>
              )}

              {selectedBriefForModal.details?.content_text && (
                <div>
                  <span className="text-zinc-400 font-medium block text-xs">ข้อความ/เนื้อหาที่ต้องใส่ในงาน:</span>
                  <p className="text-zinc-800 mt-0.5 whitespace-pre-line bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    {selectedBriefForModal.details.content_text}
                  </p>
                </div>
              )}

              {selectedBriefForModal.notes && (
                <div>
                  <span className="text-zinc-400 font-medium block text-xs">หมายเหตุเพิ่มเติม:</span>
                  <p className="text-zinc-800 mt-0.5">{selectedBriefForModal.notes}</p>
                </div>
              )}

              {selectedBriefForModal.details?.attachments &&
                Array.isArray(selectedBriefForModal.details.attachments) &&
                selectedBriefForModal.details.attachments.length > 0 && (
                  <div>
                    <span className="text-zinc-400 font-medium block text-xs mb-1.5">ไฟล์แนบ:</span>
                    <div className="space-y-1.5">
                      {selectedBriefForModal.details.attachments.map((url: string, idx: number) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 transition-colors"
                        >
                          <span className="truncate max-w-[280px]">ไฟล์แนบ {idx + 1}</span>
                          <ExternalLink size={13} className="text-zinc-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBriefForModal(null)}
                className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Home Link */}
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>กลับสู่หน้าหลัก (Back to Home)</span>
        </Link>
      </div>
    </main>
  );
}

export default function TrackStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[70vh]">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
