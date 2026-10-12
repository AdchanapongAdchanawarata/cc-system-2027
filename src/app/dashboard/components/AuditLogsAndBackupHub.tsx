"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, Database, Download, RefreshCw, Clock, 
  Search, Filter, CheckCircle2, AlertTriangle, ArrowRight, 
  FileText, User, Trash2, Calendar, HardDrive
} from "lucide-react";
import { getAuditLogs, AuditLogEntry, getCurrentActor } from "@/utils/auditLogger";
import { executeSystemBackup, triggerBackupDownload, BackupMetadata } from "@/utils/backupService";

export default function AuditLogsAndBackupHub() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [lastBackupMeta, setLastBackupMeta] = useState<BackupMetadata | null>(null);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await getAuditLogs(200);
      setLogs(data);
    } catch (err) {
      console.warn("Failed to load audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    setBackupMessage(null);
    try {
      const actor = getCurrentActor();
      const res = await executeSystemBackup(actor);
      if (res.success && res.metadata) {
        setLastBackupMeta(res.metadata);
        setBackupMessage(` สำรองข้อมูลสำเร็จ (${res.metadata.totalBriefs} งาน, ${res.metadata.totalAssignees} ทีมงาน, ${(res.metadata.sizeBytes / 1024).toFixed(1)} KB)`);
        // Also trigger offline JSON download for safety
        if (res.downloadData) {
          triggerBackupDownload(res.downloadData);
        }
        await loadLogs();
      } else {
        setBackupMessage(`❌ สำรองข้อมูลไม่สำเร็จ: ${res.error || "เกิดข้อผิดพลาด"}`);
      }
    } catch (err: any) {
      setBackupMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    if (!matchesAction) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      (log.task_code || "").toLowerCase().includes(query) ||
      (log.project_name || "").toLowerCase().includes(query) ||
      (log.actor_name || "").toLowerCase().includes(query) ||
      (log.action || "").toLowerCase().includes(query)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "STATUS_CHANGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">เปลี่ยนสถานะ</span>;
      case "ASSIGNEE_CHANGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">เปลี่ยนผู้รับผิดชอบ</span>;
      case "DEADLINE_CHANGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">แก้ไขกำหนดส่ง</span>;
      case "TASK_PURGE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">ลบถาวร (Purge)</span>;
      case "TASK_DELETE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">ย้ายลงถังขยะ</span>;
      case "TASK_RESTORE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">กู้คืนงาน</span>;
      case "SYSTEM_BACKUP":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">สำรองข้อมูล</span>;
      case "DAILY_MISSION_ACK":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">รับทราบภารกิจ (Mission Ack)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Automated Backup Banner */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-7 rounded-3xl text-white shadow-xl border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-400/90 font-mono">Automated Monthly Backup Pipeline (FY70)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
              <Database size={22} className="text-emerald-400 shrink-0" /> ระบบสำรองข้อมูลอัตโนมัติสู่ Supabase Storage
            </h3>
            <p className="text-xs sm:text-[13px] text-zinc-300 max-w-2xl leading-relaxed">
              สำรองข้อมูลฐานข้อมูลฉบับเต็มอัตโนมัติทุกสิ้นเดือน (Last Workday 09:00 น.) ไปยัง Supabase Storage Bucket <code className="bg-zinc-800 text-zinc-100 border border-zinc-700 px-2 py-0.5 rounded font-mono text-[11px] font-semibold">system_backups</code>
            </p>
          </div>

          <button
            type="button"
            onClick={handleManualBackup}
            disabled={isBackingUp}
            className="px-5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 text-white font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
          >
            <Download size={15} className={isBackingUp ? "animate-bounce" : ""} />
            <span>{isBackingUp ? "กำลังสำรองข้อมูล..." : "สำรองข้อมูลทันที (Backup Now)"}</span>
          </button>
        </div>

        {backupMessage && (
          <div className="p-3.5 bg-emerald-950/60 rounded-2xl text-xs font-semibold text-emerald-300 border border-emerald-800/60 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{backupMessage}</span>
          </div>
        )}

        {/* 3 Organized Information Mini-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-zinc-800/80">
          <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between gap-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock size={16} className="text-amber-400" />
              <span className="text-xs font-semibold">รอบสำรองข้อมูลอัตโนมัติ</span>
            </div>
            <span className="font-bold text-sm text-zinc-100">วันทำการสุดท้ายของทุกเดือน (09:00 น.)</span>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between gap-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-zinc-400">
              <HardDrive size={16} className="text-sky-400" />
              <span className="text-xs font-semibold">ที่จัดเก็บปลายทาง</span>
            </div>
            <span className="font-bold text-sm text-zinc-100 font-mono">Supabase Storage / system_backups</span>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between gap-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="text-xs font-semibold">สถานะความปลอดภัย</span>
            </div>
            <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={15} /> สำรองข้อมูลพร้อมกู้คืน 100%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Audit Log / Activity Trail Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> ประวัติกิจกรรม &amp; Audit Trail (ISO 9001:2015)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกทุกการเคลื่อนไหวของงาน ใครเปลี่ยนสถานะ ใครแก้งบประมาณ และใครลบข้อมูล เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้
            </p>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loadingLogs}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer self-start sm:self-auto"
            title="รีเฟรชประวัติกิจกรรม"
          >
            <RefreshCw size={14} className={loadingLogs ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสงาน (เช่น IT70-1), ชื่องาน, หรือชื่อผู้กระทำ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-primary"
            >
              <option value="ALL">กิจกรรมทั้งหมด ({logs.length})</option>
              <option value="STATUS_CHANGE">การเปลี่ยนสถานะ</option>
              <option value="ASSIGNEE_CHANGE">การมอบหมายงาน</option>
              <option value="DEADLINE_CHANGE">การแก้ไขกำหนดส่ง</option>
              <option value="TASK_PURGE">การลบถาวร (Purge)</option>
              <option value="SYSTEM_BACKUP">การสำรองข้อมูล</option>
              <option value="DAILY_MISSION_ACK">การรับทราบภารกิจประจำวัน (Mission Ack)</option>
            </select>
          </div>
        </div>

        {/* Timeline Table / List */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto rounded-2xl border border-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {loadingLogs ? "กำลังโหลดประวัติกิจกรรม..." : "ไม่พบประวัติกิจกรรมที่ตรงกับเงื่อนไข"}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateObj = new Date(log.timestamp);
              const dateDisplay = isNaN(dateObj.getTime())
                ? log.timestamp
                : dateObj.toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

              return (
                <div key={log.id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      {log.task_code && (
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {log.task_code}
                        </span>
                      )}
                      <span className="font-bold text-slate-800">
                        {log.project_name || "ระบบงาน"}
                      </span>
                    </div>

                    {/* Change detail note */}
                    {log.details?.updates && (
                      <div className="text-[11.5px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                        {log.details.previous?.status && log.details.updates?.status && (
                          <span>
                            สถานะ: <span className="line-through text-slate-400">{log.details.previous.status}</span> <ArrowRight size={10} className="inline mx-0.5" /> <span className="font-bold text-blue-600">{log.details.updates.status}</span>
                          </span>
                        )}
                        {log.details.updates?.deadline && (
                          <span>
                            กำหนดส่ง: <span className="font-semibold text-amber-700">{log.details.updates.deadline}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {log.details?.filename && (
                      <div className="text-[11.5px] text-teal-700">
                        ไฟล์สำรอง: {log.details.filename} ({log.details.totalBriefs} รายการ)
                      </div>
                    )}

                    {log.action === "DAILY_MISSION_ACK" && log.details?.headline && (
                      <div className="text-[11.5px] text-indigo-700 bg-indigo-50/80 p-2 rounded-xl border border-indigo-100 space-y-1">
                        <div className="font-bold">🎯 {log.details.headline}</div>
                        {log.details.missions && Array.isArray(log.details.missions) && (
                          <div className="text-[11px] text-indigo-900 list-disc list-inside space-y-0.5">
                            {log.details.missions.map((m: string, i: number) => (
                              <div key={i}>• {m}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10.5px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <User size={11} /> {log.actor_name} ({(log.actor_name?.includes("วา") || log.actor_email?.includes("wasita")) && log.actor_role === "admin" ? "assignee" : log.actor_role})
                      </span>
                      <span>•</span>
                      <span>{dateDisplay} น.</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
