"use client";

import { useState, useEffect } from "react";
import { 
  BellRing, Send, CalendarCheck, AlertCircle, CheckCircle2, 
  Clock, Sparkles, RefreshCw, Play, ShieldAlert, Users, 
  MessageSquare, ShieldCheck, ArrowRight, ExternalLink, AlertTriangle,
  Info, BarChart3, Check, Zap, Layers
} from "lucide-react";

interface CronStatusData {
  success: boolean;
  bangkokTime: string;
  dateStr: string;
  todayStatus: Record<string, any>;
  tracker: Record<string, Record<string, any>>;
  quota: {
    total: number;
    used: number;
    remaining: number;
    notyMembers: number;
    execMembers: number;
  } | null;
  pacing: {
    allowed: boolean;
    reason: string;
    allowedDays: number[];
  } | null;
  upcomingEvents: Array<{
    action: string;
    name: string;
    targetGroup: string;
    targetMembers: number;
    scheduledDate?: string;
    scheduledTime: string;
    isNextEvent?: boolean;
    note: string;
  }>;
  missedDetections: Array<{
    date: string;
    type: string;
    reason: string;
  }>;
}

export default function LineDispatchHub() {
  const [data, setData] = useState<CronStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/cron?mode=status", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch cron status:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleForceDispatch = async (targetAction: string, extraNote?: string) => {
    const isConfirm = window.confirm(
      `ยืนยันการสั่งส่ง "${targetAction}" เข้ากลุ่ม LINE ทันทีหรือไม่?\n\nข้อความจะถูกส่งเข้ากลุ่มจริงและนับโควต้า LINE OA ตามจำนวนสมาชิกในกลุ่ม`
    );
    if (!isConfirm) return;

    setActionLoading(targetAction);
    setActionResult(null);

    try {
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "force_run",
          targetAction,
          targetDate: "2026-10-23",
          extra: { force: true },
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setActionResult({
          success: true,
          message: `จัดส่งรายงานสำเร็จ! (${resJson.message || targetAction})`,
        });
        await fetchStatus();
      } else {
        setActionResult({
          success: false,
          message: `ส่งไม่สำเร็จ: ${resJson.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE API"}`,
        });
      }
    } catch (err: any) {
      setActionResult({
        success: false,
        message: `เกิดข้อผิดพลาด: ${err.message}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="animate-spin text-primary" size={32} />
        <p className="text-sm font-medium text-slate-500">กำลังเชื่อมต่อข้อมูลสถานะ LINE Scheduler & Quota...</p>
      </div>
    );
  }

  const tracker = data?.tracker || {};
  const sortedDates = Object.keys(tracker).sort().reverse();
  const quota = data?.quota;
  const missedList = data?.missedDetections || [];
  const upcomingList = data?.upcomingEvents || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-sm border border-white/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                LINE Automation System
              </span>
              <span className="text-xs text-white/80">เวลาปัจจุบัน (BKK): {data?.bangkokTime || "..."}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              LINE Dispatch & Scheduler Monitor
            </h2>
            <p className="text-xs md:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              ศูนย์ตรวจสอบและควบคุมการส่งรายงานอัตโนมัติเข้ากลุ่ม LINE OA (Creative step & CC TEAM) 
              พร้อมระบบตรวจจับการตกหล่นและโควต้าการส่งแบบเรียลไทม์
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-sm transition-all"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "กำลังรีเฟรช..." : "รีเฟรชสถานะ"}
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Alert (if any action performed) */}
      {actionResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-semibold animate-in fade-in ${
            actionResult.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionResult.success ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
            <span>{actionResult.message}</span>
          </div>
          <button
            onClick={() => setActionResult(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕ ปิด
          </button>
        </div>
      )}

      {/* WARNING BANNER: Detect Missed Dispatches (e.g. 23 Oct 2026) */}
      {missedList.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-900 flex items-center gap-2">
                  ตรวจพบรายงานตกหล่น (Missed External Trigger)
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                    {missedList.length} รายการ
                  </span>
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  ระบบตรวจสอบพบว่าใน <strong>วันศุกร์ที่ 23 ตุลาคม 2026</strong> (รอบ 16:30 น.) ไม่มีสัญญาณ Trigger จากภายนอก 
                  (Vercel Cron ไม่ได้ยิง Request เข้ามา) ทำให้รายงาน <strong>Weekly Executive Report</strong> ประจำสัปดาห์ยังไม่ถูกจัดส่งเข้ากลุ่ม CC TEAM
                </p>
              </div>
            </div>

            <button
              onClick={() => handleForceDispatch("weekly_executive_report")}
              disabled={actionLoading === "weekly_executive_report"}
              className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 shrink-0 transition-all disabled:opacity-50"
            >
              {actionLoading === "weekly_executive_report" ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  กำลังส่งรายงาน...
                </>
              ) : (
                <>
                  <Send size={14} />
                  สั่งยิงชดเชยเข้ากลุ่ม CC TEAM ทันที
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* UPCOMING SCHEDULE & HIGHLIGHT (Friday 30 Oct 2026) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <CalendarCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">กำหนดการส่งรายงานรอบสำคัญถัดไป (Upcoming Schedules)</h3>
              <p className="text-xs text-slate-500">ตารางการส่งอัตโนมัติที่คำนวณตามปฏิทินจริงและกฎเหล็กการเกลี่ยโควต้า</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 flex items-center gap-1.5">
            <ShieldCheck size={13} />
            Watchdog Protected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Highlight Card: Friday 30 Oct 2026 */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white border border-indigo-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles size={12} />
                  รอบสำคัญประจำเดือน (Next Friday)
                </span>
                <span className="text-xs font-bold text-indigo-900">
                  ศุกร์ 30 ต.ค. 2026 • 09:00 น.
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Monthly Performance Summary (สรุปผลงาน & กำไร KR4 ประจำเดือน)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  เนื่องจาก <strong>30 ต.ค. เป็นวันทำการสุดท้ายของเดือน</strong> ระบบจะส่งรายงานสรุปผลงานภาพรวม, 
                  Save Cost (Portfolio vs Delivered), โครงการ CC PM, ตัวชี้วัด OKRs, ผลประเมินความพึงพอใจ และสรุปกำไร KR4 เข้ากลุ่ม <strong>CC TEAM (17 ท่าน)</strong>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 border border-indigo-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>ผู้รับ: กลุ่ม CC TEAM (Executive)</span>
                  <span className="text-indigo-600">ใช้ 17 ข้อความ</span>
                </div>
                <div className="text-amber-700 font-medium pt-1 border-t border-slate-100">
                  💡 <strong>หมายเหตุ:</strong> ในวันศุกร์นี้ รอบเย็น 16:30 น. (Weekly Report) จะถูกยกเว้นโดยอัตโนมัติ เพื่อไม่ให้ผู้บริหารได้รับรายงานสรุปซ้ำซ้อน 2 ครั้งในวันเดียวกัน
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">สถานะ: รอถึงรอบเวลา 09:00 น.</span>
              <button
                onClick={() => handleForceDispatch("monthly_performance_summary")}
                disabled={actionLoading === "monthly_performance_summary"}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                {actionLoading === "monthly_performance_summary" ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Play size={12} />
                )}
                ทดสอบส่งตอนนี้
              </button>
            </div>
          </div>

          {/* Morning Brief Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white border border-emerald-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <MessageSquare size={12} />
                  Morning Brief (จันทร์ - พฤหัสฯ)
                </span>
                <span className="text-xs font-bold text-emerald-900">
                  09:00 น.
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Morning Brief สรุปงานประจำวัน & เกลี่ยงาน
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ส่งงานค้าง, งานด่วน, งานเกินกำหนด, และการเกลี่ยภาระงานเข้ากลุ่ม <strong>Creative step (12 ท่าน)</strong> 
                  โดยทำงานร่วมกับระบบ Dynamic Quota Balancing เพื่อไม่ให้โควต้าหมดก่อนสิ้นเดือน
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>ผู้รับ: กลุ่ม Creative step (NOTY)</span>
                  <span className="text-emerald-700">ใช้ 12 ข้อความ/ครั้ง</span>
                </div>
                <div className="text-slate-500 pt-1 border-t border-slate-100">
                  รอบการส่งของสัปดาห์นี้: <strong>{data?.pacing?.reason || "เกลี่ยส่งวันจันทร์และวันพุธ"}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                วันนี้: {data?.todayStatus?.morning_brief ? "✅ ส่งแล้ว" : "รอดำเนินการ"}
              </span>
              <button
                onClick={() => handleForceDispatch("morning_brief")}
                disabled={actionLoading === "morning_brief"}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                {actionLoading === "morning_brief" ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Play size={12} />
                )}
                ทดสอบส่งตอนนี้
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LINE OA QUOTA & MEMBERSHIP INTEGRITY */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">สถานะโควต้า LINE OA ประจำเดือน (Quota Integrity Guard)</h3>
              <p className="text-xs text-slate-500">การคิดโควต้าคำนวณตามจำนวนสมาชิกจริงในแต่ละกลุ่ม (Recipient-Based Quota)</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            โควต้าคงเหลือ: <strong className="text-emerald-600 font-black">{quota?.remaining ?? 300}</strong> / {quota?.total ?? 300} ข้อความ
          </span>
        </div>

        {/* Quota Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round(((quota?.used || 0) / (quota?.total || 300)) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>ใช้ไปแล้ว: {quota?.used ?? 0} ข้อความ ({Math.round(((quota?.used || 0) / (quota?.total || 300)) * 100)}%)</span>
            <span>สำรองโควต้าฉุกเฉิน (Quota Guard): 20 ข้อความ</span>
          </div>
        </div>

        {/* Group Member Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                <Users size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">กลุ่ม Creative step (NOTY)</div>
                <div className="text-[11px] text-slate-500">สำหรับ Morning Brief ประจำวัน</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-900">{quota?.notyMembers || 12} สมาชิก</div>
              <div className="text-[10px] text-emerald-600 font-semibold">= 12 ข้อความ/ครั้ง</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                <Users size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">กลุ่ม CC TEAM (Executive)</div>
                <div className="text-[11px] text-slate-500">สำหรับ Weekly / Monthly Report</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-900">{quota?.execMembers || 17} สมาชิก</div>
              <div className="text-[10px] text-indigo-600 font-semibold">= 17 ข้อความ/ครั้ง</div>
            </div>
          </div>
        </div>
      </div>

      {/* DISPATCH HISTORY & TRACKER AUDIT TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">ประวัติการบันทึกสถานะการส่ง (Cron Dispatch Tracker Audit)</h3>
              <p className="text-xs text-slate-500">ข้อมูลจริงจากฐานข้อมูล Supabase ตาราง okr_settings (CONFIG_LINE_CRON_TRACKER_JSON)</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th className="py-2.5 px-3">วันที่ (Date)</th>
                <th className="py-2.5 px-3">รอบ 09:00 น. (Morning Brief)</th>
                <th className="py-2.5 px-3">รอบ 16:30 น. (Weekly Report)</th>
                <th className="py-2.5 px-3">รอบสิ้นเดือน (Monthly Report)</th>
                <th className="py-2.5 px-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDates.slice(0, 10).map((d) => {
                const rec = tracker[d] || {};
                const isToday = d === data?.dateStr;
                const isMissedFriday = missedList.some((m) => m.date === d);

                return (
                  <tr key={d} className={`hover:bg-slate-50/80 transition-colors ${isToday ? "bg-emerald-50/30" : ""}`}>
                    <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{d}</span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                          วันนี้
                        </span>
                      )}
                      {isMissedFriday && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold">
                          ตกหล่น
                        </span>
                      )}
                    </td>

                    {/* Morning Brief */}
                    <td className="py-3 px-3">
                      {rec.morning_brief ? (
                        rec.morning_brief.startsWith("SKIPPED") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium" title={rec.morning_brief}>
                            <Clock size={11} className="text-slate-400" />
                            ข้าม (เกลี่ยโควต้า)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            {new Date(rec.morning_brief).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Weekly Executive Report */}
                    <td className="py-3 px-3">
                      {rec.weekly_executive_report || rec.weekly_executive_report_manual ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-semibold">
                          <CheckCircle2 size={11} className="text-indigo-600" />
                          {rec.weekly_executive_report_manual ? "ส่งชดเชยสำเร็จ" : "ส่งสำเร็จ"}
                        </span>
                      ) : isMissedFriday ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                          <AlertTriangle size={11} className="text-amber-600" />
                          ไม่มีการ Trigger
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Monthly Performance Summary */}
                    <td className="py-3 px-3">
                      {rec.monthly_performance_summary || rec.monthly_performance_summary_manual ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-semibold">
                          <CheckCircle2 size={11} className="text-purple-600" />
                          ส่งสำเร็จ
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      {isMissedFriday && (
                        <button
                          onClick={() => handleForceDispatch("weekly_executive_report")}
                          disabled={actionLoading === "weekly_executive_report"}
                          className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-sm transition-all"
                        >
                          ยิงชดเชย
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* WATCHDOG ARCHITECTURE DETAILS */}
      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Info size={15} className="text-indigo-600" />
          <span>มาตรการป้องกันความต่อเนื่องในการส่งรายงาน 100% (Triple Redundancy Architecture)</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px] leading-relaxed">
          <li><strong>Tier 1: Vercel Serverless Crons (Primary):</strong> สั่ง Trigger ตามตารางเวลามาตรฐานใน <code>vercel.json</code></li>
          <li><strong>Tier 2: GitHub Actions Scheduler (Server-side Watchdog):</strong> รันจาก GitHub Cloud ทุกวันทำการ 09:00 น. และวันศุกร์ 16:30 น. ทำงานตลอดเวลาแม้วันหยุดราชการหรือคอมพิวเตอร์ปิดอยู่</li>
          <li><strong>Tier 3: In-App Client Heartbeat (Passive Catchup):</strong> เมื่อมีทีมงานหรือแอดมินเปิดหน้า Dashboard ในช่วงเวลาทำการ ระบบจะช่วย Ping ตรวจสอบและยิงรอบที่ค้างท่อโดยอัตโนมัติ</li>
        </ul>
      </div>
    </div>
  );
}
