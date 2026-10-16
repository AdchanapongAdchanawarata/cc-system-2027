"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, RotateCcw, AlertTriangle, X, Check, RefreshCw, Calendar, ArrowUpRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface TrashItem {
  id: string;
  project_name: string;
  unit: string;
  status: string;
  created_at: string;
  details?: any;
  coordinator_nickname?: string;
}

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashedBriefs: TrashItem[];
  onRestore: (briefId: string) => Promise<void>;
  onPermanentDelete: (briefId: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
  onDeepRestore?: (restoredBrief: any) => void;
}

export default function TrashBinModal({
  isOpen,
  onClose,
  trashedBriefs,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  onDeepRestore,
}: TrashBinModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"trash" | "purged">("trash");
  const [purgedBriefs, setPurgedBriefs] = useState<TrashItem[]>([]);
  const [loadingPurged, setLoadingPurged] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === "purged") {
      fetchPurgedBriefs();
    }
  }, [isOpen, activeTab]);

  const fetchPurgedBriefs = async () => {
    setLoadingPurged(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("briefs")
        .select("*")
        .gte("created_at", "2026-09-25T00:00:00Z")
        .order("created_at", { ascending: false });

      if (data) {
        const recoverable = data.filter((b: any) => {
          const isPurged = b.status === "purged" || b.details?.is_permanently_deleted === true;
          const isStressTest = (b.project_name || "").includes("[STRESS_TEST]") || b.details?.is_test === true;
          return isPurged && !isStressTest;
        });
        setPurgedBriefs(recoverable);
      }
    } catch (err) {
      console.error("Failed to fetch purged briefs:", err);
    } finally {
      setLoadingPurged(false);
    }
  };

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEmptying, setIsEmptying] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen || !mounted) return null;

  const handleRestoreClick = async (id: string) => {
    setRestoringId(id);
    try {
      await onRestore(id);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeepRestoreClick = async (item: TrashItem) => {
    setRestoringId(item.id);
    try {
      const supabase = createClient();
      const cleanDetails = { ...(item.details || {}) };
      const targetStatus =
        cleanDetails.previous_status && cleanDetails.previous_status !== "purged"
          ? cleanDetails.previous_status
          : "pending";

      delete cleanDetails.is_deleted;
      delete cleanDetails.deleted_at;
      delete cleanDetails.is_permanently_deleted;
      delete cleanDetails.purged_at;
      delete cleanDetails.previous_status;

      const { data, error } = await supabase
        .from("briefs")
        .update({
          status: targetStatus,
          details: cleanDetails,
        })
        .eq("id", item.id)
        .select()
        .single();

      if (!error && data) {
        setPurgedBriefs((prev) => prev.filter((p) => p.id !== item.id));
        if (onDeepRestore) {
          onDeepRestore(data);
        }
      }
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะย้ายงานนี้ไปยังคลังล้างถาวร? (ยังสามารถกู้คืนได้จากแท็บคลังกู้คืนลึก)")) return;
    setDeletingId(id);
    try {
      await onPermanentDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyAll = async () => {
    setIsEmptying(true);
    try {
      await onEmptyTrash();
      setConfirmEmpty(false);
    } finally {
      setIsEmptying(false);
    }
  };

  const formatDeletedDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const currentList = activeTab === "trash" ? trashedBriefs : purgedBriefs;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#181a1c]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                ถังขยะและระบบกู้คืนงาน (Trash & Deep Recovery)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold border border-rose-200">
                  {trashedBriefs.length} รายการในถังขยะ
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                งานทุกชิ้นมีระบบป้องกันสูญหาย สามารถกู้คืน (Restore) กลับไปทำงานต่อบนบอร์ดได้ตลอดเวลา
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs: Standard Trash vs Deep Recovery */}
        <div className="px-6 pt-3 pb-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex bg-slate-200/70 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("trash")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "trash"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ถังขยะปัจจุบัน ({trashedBriefs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("purged")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "purged"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <RotateCcw size={12} />
              <span>คลังกู้คืนงานที่ถูกล้างถาวร (Deep Recovery)</span>
            </button>
          </div>

          {activeTab === "trash" && trashedBriefs.length > 0 && (
            confirmEmpty ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-semibold">ยืนยันล้างถังขยะ?</span>
                <button
                  onClick={handleEmptyAll}
                  disabled={isEmptying}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                >
                  {isEmptying && <RefreshCw size={12} className="animate-spin" />}
                  ใช่, ล้างถังขยะ
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded text-xs"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-lg border border-rose-200 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                ล้างถังขยะทั้งหมด
              </button>
            )
          )}
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === "purged" && loadingPurged ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <RefreshCw size={28} className="animate-spin text-indigo-500 mb-3" />
              <p className="text-xs text-slate-500">กำลังค้นหางานในคลังสำรองข้อมูล...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Trash2 size={32} className="text-slate-300" />
              </div>
              <h4 className="font-semibold text-slate-600 text-base mb-1">
                {activeTab === "trash" ? "ถังขยะว่างเปล่า" : "ไม่มีงานค้างในคลังล้างถาวร"}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                {activeTab === "trash"
                  ? "ไม่มีงานที่ถูกลบค้างอยู่ในถังขยะ หากเผลอล้างถังขยะไปแล้ว สามารถตรวจสอบได้ที่แท็บ 'คลังกู้คืนงานที่ถูกล้างถาวร (Deep Recovery)'"
                  : "ไม่พบรายการงานที่ถูกล้างถาวรในปีงบประมาณปัจจุบัน"}
              </p>
            </div>
          ) : (
            currentList.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {item.details?.task_code && (
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-900 text-white">
                        {item.details.task_code}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.unit?.toLowerCase() === "creative"
                          ? "bg-purple-50 text-[#8b5cf6] border border-purple-200"
                          : item.unit?.toLowerCase() === "content"
                          ? "bg-pink-50 text-[#ec4899] border border-pink-200"
                          : item.unit?.toLowerCase() === "pr"
                          ? "bg-blue-50 text-[#1877F2] border border-blue-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {item.unit || "TASK"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {activeTab === "trash"
                        ? `ลบเมื่อ: ${formatDeletedDate(item.details?.deleted_at)}`
                        : `ล้างถังขยะเมื่อ: ${formatDeletedDate(item.details?.purged_at || item.details?.deleted_at)}`}
                    </span>
                    {item.details?.previous_status && (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        สถานะเดิม: {item.details.previous_status}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm truncate">
                    {item.project_name}
                  </h4>
                  {item.details?.description && (
                    <p className="text-xs text-slate-500 truncate mt-0.5 max-w-xl">
                      {item.details.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Restore Button */}
                  <button
                    onClick={() =>
                      activeTab === "trash"
                        ? handleRestoreClick(item.id)
                        : handleDeepRestoreClick(item)
                    }
                    disabled={restoringId === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    title="กู้คืนงานกลับสู่บอร์ดเดิม"
                  >
                    <RotateCcw size={13} className={restoringId === item.id ? "animate-spin" : ""} />
                    <span>กู้คืนกลับบอร์ด (Restore)</span>
                  </button>

                  {/* Permanent Delete Button (only in standard trash tab) */}
                  {activeTab === "trash" && (
                    <button
                      onClick={() => handleDeletePermanent(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      title="ย้ายไปคลังล้างถาวร"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

