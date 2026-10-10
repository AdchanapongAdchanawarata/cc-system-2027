"use client";

import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, CheckCircle2, Clock, Mail, ExternalLink, 
  Copy, Download, Send, RefreshCw, AlertCircle, Sparkles, UserCheck, Users,
  Code2, Check
} from "lucide-react";
import { 
  TEAM_MEMBERS, 
  R_DEFINITIONS, 
  KR_DEFINITIONS, 
  calculateAllRRows, 
  calculateAllKRRows, 
  rRowsToTSV, 
  rRowsToCSV, 
  krRowsToTSV, 
  krRowsToCSV,
  getMonthCode, 
  getWeekCode, 
  getFiscalYear,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  SheetDataRRow,
  SheetDataKRRow
} from "@/utils/googleSheetsSync";

interface GoogleSheetsSyncHubProps {
  tasks?: any[];
  assignees?: any[];
}

export default function GoogleSheetsSyncHub({ tasks = [], assignees = [] }: GoogleSheetsSyncHubProps) {
  const [activeTab, setActiveTab] = useState<"R" | "KR" | "guide">("R");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string; syncedAt?: string } | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  const [serverRRows, setServerRRows] = useState<SheetDataRRow[] | null>(null);
  const [serverKRRows, setServerKRRows] = useState<SheetDataKRRow[] | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Time & calculated rows
  const now = new Date();
  const currentWeek = getWeekCode(now);
  const currentMonth = getMonthCode(now);
  const currentFY = getFiscalYear(now);

  const calculatedRRows = calculateAllRRows(tasks, assignees, now);
  const calculatedKRRows = calculateAllKRRows(tasks, now);

  const rRows: SheetDataRRow[] = serverRRows && serverRRows.length > 0 ? serverRRows : calculatedRRows;
  const krRows: SheetDataKRRow[] = serverKRRows && serverKRRows.length > 0 ? serverKRRows : calculatedKRRows;

  // Load from API on mount
  useEffect(() => {
    setIsLoadingLive(true);
    fetch("/api/sheets-sync")
      .then(res => res.json())
      .then(data => {
        if (data.rRows && data.rRows.length > 0) setServerRRows(data.rRows);
        if (data.krRows && data.krRows.length > 0) setServerKRRows(data.krRows);
      })
      .catch(err => console.error("Error loading sync data from API:", err))
      .finally(() => setIsLoadingLive(false));

    const saved = localStorage.getItem("cc_google_sheets_webhook_url");
    if (saved) setWebhookUrl(saved);
  }, []);

  const handleSaveWebhookUrl = () => {
    setIsSavingUrl(true);
    localStorage.setItem("cc_google_sheets_webhook_url", webhookUrl.trim());
    setTimeout(() => {
      setIsSavingUrl(false);
      alert("บันทึก Google Apps Script Webhook URL เรียบร้อยแล้ว!");
    }, 400);
  };

  const handleCopyTSV = (type: "R" | "KR") => {
    const text = type === "R" ? rRowsToTSV(rRows) : krRowsToTSV(krRows);
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadCSV = (type: "R" | "KR") => {
    const csv = type === "R" ? rRowsToCSV(rRows) : krRowsToCSV(krRows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CC_Team_${type}_Data_${currentMonth}_${currentWeek}_FY${currentFY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerSync = async (type: "R" | "KR" | "both") => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/sheets-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, force: true, updatedBy: "admin_manual_hub" })
      });
      const data = await res.json();
      if (data.status === "success") {
        setSyncStatus({
          success: true,
          message: `นำส่งข้อมูลสำเร็จ! (${type === 'R' ? '108 แถว Data_R' : type === 'KR' ? '4 แถว Data_KR' : 'ทั้ง R และ KR'}) พร้อมส่งอีเมลแจ้งสมาชิกครบ 12 ท่าน`,
          syncedAt: new Date().toLocaleTimeString("th-TH")
        });
      } else if (data.status === "skipped") {
        setSyncStatus({
          success: true,
          message: data.message || "รอบนี้ได้ถูกนำส่งไปแล้วเรียบร้อย",
          syncedAt: new Date().toLocaleTimeString("th-TH")
        });
      } else {
        setSyncStatus({
          success: false,
          message: data.message || "เกิดข้อผิดพลาดในการนำส่งข้อมูล",
          syncedAt: new Date().toLocaleTimeString("th-TH")
        });
      }
    } catch (err: any) {
      setSyncStatus({
        success: false,
        message: err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        syncedAt: new Date().toLocaleTimeString("th-TH")
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Group R rows by member for easy display
  const memberRSummary = TEAM_MEMBERS.map(member => {
    const memberRows = rRows.filter(r => r.memberId === member.memberId);
    const valuesMap: Record<string, number> = {};
    memberRows.forEach(r => { valuesMap[r.rId] = r.value; });
    return { member, valuesMap };
  });

  return (
    <div className="w-full space-y-6 animate-premium-fade">
      
      {/* Top Banner & Status */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#18181B] text-white">
                Team T18 • ALL_KR2026_PROD
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                ระบบนำส่งอัตโนมัติเปิดใช้งาน (Active)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              ระบบเชื่อมโยงและนำส่งข้อมูล Google Sheet (R & KR)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              คำนวณและประมวลผลค่า R (รายบุคคล 9 ตัวแปร) สะสมปัจจุบันส่งทุกวันศุกร์ 17.00 น. และค่า KR (รายทีม 4 ตัวแปร) ส่งทุกวันสุดท้ายของเดือน 17.00 น. พร้อมระบบอีเมลแจ้งเตือนอัตโนมัติไปยังบุคลากรครบทั้ง 12 ท่าน
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="https://docs.google.com/spreadsheets/d/1fjfd7oPCqmfARPjf3XDy1QhcwSbQddMA2C1r0GzxjL0/edit"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <ExternalLink size={14} />
              <span>เปิด Google Sheet</span>
            </a>
            <button
              onClick={() => handleTriggerSync(activeTab === "KR" ? "KR" : "R")}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-full bg-[#18181B] text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{isSyncing ? "กำลังนำส่งข้อมูล..." : `ซิงค์เข้าชีต Data_${activeTab === 'KR' ? 'KR' : 'R'} ทันที`}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Pill Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Clock size={14} className="text-amber-600" />
              <span>รอบนำส่งค่า R (รายสัปดาห์)</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">ทุกวันศุกร์ เวลา 17.00 น.</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              รอบปัจจุบัน: <strong>{currentWeek} {currentMonth} (FY{currentFY})</strong> • {rRows.length} แถว
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Clock size={14} className="text-emerald-600" />
              <span>รอบนำส่งค่า KR (รายเดือน)</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">ทุกสิ้นเดือน เวลา 17.00 น.</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              รอบปัจจุบัน: <strong>ประจำเดือน {currentMonth} (FY{currentFY})</strong> • 4 ตัวชี้วัดทีม
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Mail size={14} className="text-blue-600" />
              <span>อีเมลแจ้งเตือนบุคลากร</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">12 สมาชิกในทีม CC</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ส่งสรุปผลการนำส่ง R & KR รายรอบเข้าอีเมลทุกคนอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Sync notification banner */}
        {syncStatus && (
          <div className={`mt-5 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            syncStatus.success 
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200" 
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}>
            {syncStatus.success ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-rose-600 shrink-0" />}
            <div>
              <div>{syncStatus.message}</div>
              <div className="text-[10px] text-slate-500 font-normal mt-0.5">บันทึกเวลา: {syncStatus.syncedAt}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("R")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "R"
                ? "bg-[#18181B] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <UserCheck size={14} />
            <span>1. ค่า R รายบุคคล (Data_R • 108 รายการ)</span>
          </button>

          <button
            onClick={() => setActiveTab("KR")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "KR"
                ? "bg-[#18181B] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users size={14} />
            <span>2. ค่า KR รายทีม (Data_KR • 4 ตัวชี้วัด)</span>
          </button>

          <button
            onClick={() => setActiveTab("guide")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "guide"
                ? "bg-[#18181B] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Code2 size={14} />
            <span>3. คู่มือ & Webhook Script</span>
          </button>
        </div>

        {activeTab !== "guide" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyTSV(activeTab)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="คัดลอกตารางแล้วนำไปวาง (Ctrl+V) ลงท้ายตาราง Google Sheet ได้ทันที"
            >
              {copiedType === activeTab ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedType === activeTab ? "คัดลอกเรียบร้อยแล้ว!" : "คัดลอกข้อมูลวางลง Sheet"}</span>
            </button>
            <button
              onClick={() => handleDownloadCSV(activeTab)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Download size={14} />
              <span>ดาวน์โหลด CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: R METRICS TABLE                                                */}
      {/* ===================================================================== */}
      {activeTab === "R" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ตารางสรุปผลงานสะสมรายบุคคล (T18R1 – T18R9)
                </h3>
                <p className="text-xs text-slate-500">
                  รอบสัปดาห์: {currentWeek} {currentMonth} FY{currentFY} • กรอกทุกตัวแปร หากไม่มีค่าระบบจะลงเป็น 0
                </p>
              </div>
              <div className="text-xs text-slate-500">
                พร้อมนำส่งเข้าชีต: <strong className="text-slate-800">Data_R</strong>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto mt-4 -mx-6 px-6">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 rounded-l-xl">รหัส</th>
                    <th className="py-3 px-3">ชื่อบุคลากร</th>
                    <th className="py-3 px-2 text-right" title="T18R1: จำนวนผลงานภายใน (งาน)">R1 (งานใน)</th>
                    <th className="py-3 px-2 text-right" title="T18R2: CSAT ภายใน (%)">R2 (CSATใน)</th>
                    <th className="py-3 px-2 text-right" title="T18R3: จำนวนผลงาน มช./RSP (งาน)">R3 (มช./RSP)</th>
                    <th className="py-3 px-2 text-right" title="T18R4: CSAT มช./RSP (%)">R4 (CSATนอก)</th>
                    <th className="py-3 px-2 text-right" title="T18R5: Reach">R5 (Reach)</th>
                    <th className="py-3 px-2 text-right" title="T18R6: Engagement">R6 (Engage)</th>
                    <th className="py-3 px-2 text-right" title="T18R7: กำไรภาครัฐ (บาท)">R7 (กำไรรัฐ)</th>
                    <th className="py-3 px-2 text-right" title="T18R8: กำไรภาคเอกชน (บาท)">R8 (กำไรเอกชน)</th>
                    <th className="py-3 px-3 text-right rounded-r-xl" title="T18R9: CSAT รายได้ (%)">R9 (CSATรายได้)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {memberRSummary.map(({ member, valuesMap }) => (
                    <tr key={member.memberId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold font-mono text-slate-900">{member.memberId}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {member.displayName}
                        <div className="text-[10px] text-slate-400 font-normal">{member.email}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">{valuesMap["T18R1"] || 0}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{valuesMap["T18R2"] || 0}%</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">{valuesMap["T18R3"] || 0}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{valuesMap["T18R4"] || 0}%</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{(valuesMap["T18R5"] || 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">{(valuesMap["T18R6"] || 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">฿{(valuesMap["T18R7"] || 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">฿{(valuesMap["T18R8"] || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">{valuesMap["T18R9"] || 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* R Legend */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-500">
              {R_DEFINITIONS.map(rDef => (
                <div key={rDef.rId} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-800">{rDef.rId}: {rDef.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">เป้าหมาย: {rDef.target.toLocaleString()} {rDef.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: KR METRICS TABLE                                               */}
      {/* ===================================================================== */}
      {activeTab === "KR" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ตารางตัวชี้วัดความสำเร็จของทีม (T18KR1 – T18KR4)
                </h3>
                <p className="text-xs text-slate-500">
                  รอบเดือน: {currentMonth} FY{currentFY} • ผลการดำเนินงานสะสมในฐานะทีม CC TEAM
                </p>
              </div>
              <div className="text-xs text-slate-500">
                พร้อมนำส่งเข้าชีต: <strong className="text-slate-800">Data_KR</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {krRows.map(r => {
                const def = KR_DEFINITIONS.find(k => k.krId === r.krId);
                const isMoney = def?.unit === "บาท";
                const percent = def && def.target > 0 ? Math.min(100, Math.round((r.value / def.target) * 100)) : 0;

                return (
                  <div key={r.krId} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#18181B] text-white">
                        {r.krId}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        บรรลุ {percent}%
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{def?.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{r.reference}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">ค่าสะสมปัจจุบัน</div>
                        <div className="text-2xl font-black font-mono text-emerald-700">
                          {isMoney ? `฿${r.value.toLocaleString()}` : `${r.value.toLocaleString()} ${def?.unit}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">เป้าหมายประจำปี</div>
                        <div className="text-sm font-bold font-mono text-slate-700">
                          {isMoney ? `฿${def?.target.toLocaleString()}` : `${def?.target.toLocaleString()} ${def?.unit}`}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                      <div style={{ width: `${percent}%` }} className="bg-emerald-500 h-full rounded-full transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SETUP GUIDE & APPS SCRIPT                                      */}
      {/* ===================================================================== */}
      {activeTab === "guide" && (
        <div className="space-y-6">
          {/* Webhook Settings Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-black text-slate-900">
              ตั้งค่า Google Apps Script Webhook URL
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              เมื่อคุณนำสคริปต์ด้านล่างไป Deploy เป็น Web App ใน Google Sheet แล้ว ให้นำ URL ที่ได้มาใส่ในช่องนี้ เพื่อให้ระบบสามารถส่งข้อมูลเข้าชีตได้โดยตรงโดยไม่ต้องเปิดหน้าเว็บ
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#18181B]"
              />
              <button
                onClick={handleSaveWebhookUrl}
                disabled={isSavingUrl || !webhookUrl}
                className="px-5 py-2.5 rounded-xl bg-[#18181B] text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSavingUrl ? "กำลังบันทึก..." : "บันทึก URL"}
              </button>
            </div>
          </div>

          {/* Script Copy Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Google Apps Script (โค้ดเชื่อมต่อสำเร็จรูป)
                </h3>
                <p className="text-xs text-slate-500">
                  คัดลอกโค้ดนี้ไปวางใน Google Sheet &gt; Extensions &gt; Apps Script &gt; Deploy as Web App
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
                  alert("คัดลอกโค้ด Google Apps Script เรียบร้อยแล้ว!");
                }}
                className="px-4 py-2 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Copy size={13} />
                <span>คัดลอกสคริปต์</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96">
              <code>{GOOGLE_APPS_SCRIPT_TEMPLATE}</code>
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
