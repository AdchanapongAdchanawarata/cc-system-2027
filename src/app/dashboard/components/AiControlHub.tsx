"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  ShieldCheck,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Database,
  Trash2,
  Activity,
  Layers,
  Sparkles,
  Server,
  Lock
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface AiPingResult {
  status: "idle" | "testing" | "success" | "warning" | "error";
  engine?: string;
  latencyMs?: number;
  message?: string;
}

export default function AiControlHub() {
  const [pingResult, setPingResult] = useState<AiPingResult>({ status: "idle" });
  const [isScanning, setIsScanning] = useState(false);
  const [scanStats, setScanStats] = useState<{
    mockKeysFound: string[];
    briefsTotal: number;
    auditLogsTotal: number;
    scannedAt?: string;
  } | null>(null);
  const [purgedMessage, setPurgedMessage] = useState<string | null>(null);

  // Auto-run initial test on mount
  useEffect(() => {
    testAiConnectivity();
    runIntegrityScan();
  }, []);

  const testAiConnectivity = async () => {
    setPingResult({ status: "testing" });
    try {
      const res = await fetch("/api/ai-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ping: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPingResult({
          status: data.status === "connected" ? "success" : "warning",
          engine: data.engine,
          latencyMs: data.latencyMs,
          message: data.message,
        });
      } else {
        setPingResult({
          status: "error",
          message: data.error || "ไม่สามารถเชื่อมต่อ AI Engine ได้",
        });
      }
    } catch (err: any) {
      setPingResult({
        status: "error",
        message: err.message || "เกิดข้อผิดพลาดในการตรวจสอบ AI",
      });
    }
  };

  const runIntegrityScan = async () => {
    setIsScanning(true);
    setPurgedMessage(null);
    try {
      // 1. Scan LocalStorage for suspicious or deprecated mock keys
      const mockKeys: string[] = [];
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.includes("cc_activity_logs") ||
              key.includes("dummy") ||
              key.includes("mock_") ||
              key.includes("fake_"))
          ) {
            mockKeys.push(key);
          }
        }
      }

      // 2. Scan Supabase briefs count & audit logs count
      let briefsCount = 0;
      let auditCount = 0;
      const supabase = createClient();
      if (supabase) {
        const { count: bCount } = await supabase
          .from("briefs")
          .select("id", { count: "exact", head: true })
          .neq("status", "purged");
        briefsCount = bCount || 0;

        const { count: aCount } = await supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true });
        auditCount = aCount || 0;
      }

      setScanStats({
        mockKeysFound: mockKeys,
        briefsTotal: briefsCount,
        auditLogsTotal: auditCount,
        scannedAt: new Date().toLocaleTimeString("th-TH"),
      });
    } catch (err) {
      console.error("Integrity scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePurgeMockDataAndCache = () => {
    if (typeof window !== "undefined") {
      // Purge all old mock keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("cc_activity_logs") ||
            key.includes("dummy") ||
            key.includes("mock_") ||
            key.includes("fake_") ||
            key.startsWith("audit_cache_"))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((k) => localStorage.removeItem(k));
      setPurgedMessage(
        `ทำความสะอาดสำเร็จ: ล้าง ${keysToRemove.length} รายการ Mock/Stale Cache ในเครื่องเรียบร้อยแล้ว`
      );
      runIntegrityScan();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-zinc-800 space-y-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-inner shrink-0">
                <Brain size={24} className="animate-pulse text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                  AI Control & Anti-Hallucination Hub
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    Active Guardrails
                  </span>
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed font-normal mt-0.5">
                  ระบบควบคุมความโปร่งใส ป้องกันการสร้างข้อมูลหลอน (Zero Hallucination) และตรวจสอบความน่าเชื่อถือของ AI
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={testAiConnectivity}
              disabled={pingResult.status === "testing"}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <RefreshCw
                size={14}
                className={pingResult.status === "testing" ? "animate-spin" : ""}
              />
              {pingResult.status === "testing" ? "กำลังทดสอบ..." : "ทดสอบ AI Live Ping"}
            </button>
          </div>
        </div>

        {/* 3 Structured Feature Badges / Mini-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-zinc-800/80">
          <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-3.5 flex items-center gap-3 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Database size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Data Grounding</span>
              <span className="text-xs font-bold text-zinc-100">อ้างอิงข้อมูลจริง 100% จาก DB</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-3.5 flex items-center gap-3 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Heuristic Failover</span>
              <span className="text-xs font-bold text-zinc-100">สลับระบบสำรองเมื่อ AI ออฟไลน์</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-3.5 flex items-center gap-3 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">ISO Audit Trail</span>
              <span className="text-xs font-bold text-zinc-100">บันทึกทุกคำสั่งการตาม ISO 9001</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: AI Live Diagnostics & Anti-Hallucination Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Engine Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu size={14} className="text-indigo-600" /> AI Engine Status
            </span>
            {pingResult.status === "success" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={10} /> Online
              </span>
            )}
            {pingResult.status === "warning" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                <Zap size={10} /> Heuristic Fallback
              </span>
            )}
            {pingResult.status === "testing" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                <RefreshCw size={10} className="animate-spin" /> Pinging...
              </span>
            )}
          </div>

          <div>
            <div className="text-sm font-bold text-slate-800">
              {pingResult.engine || "Dual Engine (Gemini Free + Smart Heuristic)"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {pingResult.message || "ระบบพร้อมวิเคราะห์ระเบียบ ISO 9001:2015 และช่วยคัดกรองงาน"}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>ความหน่วง (Latency):</span>
            <span className="font-semibold text-slate-800">
              {pingResult.latencyMs ? `${pingResult.latencyMs} ms` : "Instant"}
            </span>
          </div>
        </div>

        {/* Card 2: Database Grounding */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Database size={14} className="text-emerald-600" /> Database Grounding
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              <ShieldCheck size={10} /> 100% Real DB
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-800">Strict Data Grounding</div>
            <div className="text-xs text-slate-500 mt-1">
              คำนวณและประเมินผลจากตาราง Supabase จริง (`briefs` & `audit_logs`) เท่านั้น
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>ฐานข้อมูลที่กำลังเชื่อมต่อ:</span>
            <span className="font-semibold text-emerald-700">
              {scanStats ? `${scanStats.briefsTotal} บรีฟ / ${scanStats.auditLogsTotal} Logs` : "กำลังโหลด..."}
            </span>
          </div>
        </div>

        {/* Card 3: Model Rotation Architecture */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600" /> Model Rotation
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              5-Tier Free Fallback
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-800">Zero-Cost Tier Strategy</div>
            <div className="text-xs text-slate-500 mt-1">
              หมุนเวียนโมเดล Google Gemini Free เพื่อป้องกัน 429 Rate Limit พร้อมระบบ Fallback
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>โมเดลหลัก:</span>
            <span className="font-semibold text-slate-800 font-mono text-[11px]">
              gemini-flash-lite-latest
            </span>
          </div>
        </div>
      </div>

      {/* Anti-Hallucination Guardrails 4 Principles */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-indigo-600" />
          <h4 className="text-base font-bold text-slate-800">
            4 กฎเหล็กป้องกันข้อมูลหลอน (Anti-Hallucination Guardrail Policies)
          </h4>
        </div>
        <p className="text-xs text-slate-500">
          หลักการที่ระบบ AI ในทุกโมดูล (ISO Audit, LINE Bot, Activity Log, Noty) ต้องยึดถืออย่างเคร่งครัด
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                1
              </span>
              Zero-Fake Baseline (ห้ามข้อมูลสมมติ)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ปีงบประมาณ 2570 เริ่มต้นด้วยสถิติ 0 ทั้งหมด หากยังไม่มีงานที่เสร็จสมบูรณ์หรือยังไม่มีแบบสำรวจ
              ระบบต้องแสดงผลเป็น 0% หรือยังไม่มีข้อมูล ห้ามสร้างตัวเลขปลอมเพื่อความสวยงามเด็ดขาด
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                2
              </span>
              Strict Database Grounding (ฐานข้อมูลจริง 100%)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ผลการวิเคราะห์และข้อเสนอแนะต้องมีหลักฐานรองรับจากตาราง <code>briefs</code>, <code>audit_logs</code> หรืออีเมลจริง
              ห้ามอนุมานหรือใส่ข้อความที่ไม่มีที่มาจากระบบ
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                3
              </span>
              Zero-State Honesty (ซื่อสัตย์ต่อสถานะว่าง)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ในกรณีที่ระบบยังไม่มีข้อมูล หรือไม่มีข้อผิดพลาด ให้ระบุสถานะ "ผ่านเกณฑ์/ไม่พบข้อผิดพลาด" หรือ
              "พร้อมรับงาน" อย่างซื่อสัตย์ ห้ามแสดงข้อความเชิงลบที่สร้างขึ้นลอยๆ
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs">
                4
              </span>
              No Personal Hallucinations (ห้ามกล่าวหาหรือพาดพิงบุคคล)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ขจัดระบบคอมเมนต์เชิงลบที่วิพากษ์วิจารณ์บุคคล เช่น อ้างว่าพนักงานไม่มีความเคลื่อนไหว
              หรือระบุจำนวนงานค้างที่ไม่มีอยู่จริง โดยปราศจาก Audit Trail ที่ตรวจสอบได้
            </p>
          </div>
        </div>
      </div>

      {/* System Integrity Scanner & Cache Purge */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-slate-700" />
              System Integrity Scanner & Cache Purge
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              ตรวจสอบไฟล์ตกค้าง, ล้าง Cache จำลองในเบราว์เซอร์ และบังคับซิงค์ข้อมูลจริง FY70
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runIntegrityScan}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
              {isScanning ? "กำลังสแกน..." : "สแกนระบบ"}
            </button>
            <button
              onClick={handlePurgeMockDataAndCache}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              ล้าง Mock Cache ในเครื่อง
            </button>
          </div>
        </div>

        {purgedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{purgedMessage}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-500">ผลการสแกน Mock Data ตกค้างในเบราว์เซอร์: </span>
            {scanStats?.mockKeysFound && scanStats.mockKeysFound.length > 0 ? (
              <span className="font-bold text-amber-600">
                พบ {scanStats.mockKeysFound.length} รายการ ({scanStats.mockKeysFound.join(", ")})
              </span>
            ) : (
              <span className="font-bold text-emerald-600">สะอาด 100% (ไม่พบ Mock Data ตกค้าง)</span>
            )}
          </div>
          <div className="text-slate-400">
            สแกนล่าสุด: {scanStats?.scannedAt || "พร้อมสแกน"}
          </div>
        </div>
      </div>
    </div>
  );
}
