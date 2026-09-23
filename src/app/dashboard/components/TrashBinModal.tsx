"use client";

import { useState } from "react";
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
}

export default function TrashBinModal({
  isOpen,
  onClose,
  trashedBriefs,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}: TrashBinModalProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEmptying, setIsEmptying] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  const handleRestoreClick = async (id: string) => {
    setRestoringId(id);
    try {
      await onRestore(id);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบงานนี้อย่างถาวร?")) return;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                ถังขยะ (Trash Bin)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold border border-rose-200">
                  {trashedBriefs.length} รายการ
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                งานที่ถูกลบจะถูกเก็บไว้ที่นี่ สามารถกู้คืน (Restore) กลับไปทำงานต่อได้ตลอดเวลา
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

        {/* Action Toolbar */}
        {trashedBriefs.length > 0 && (
          <div className="px-6 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              💡 กด <strong>&quot;กู้คืน&quot;</strong> เพื่องานจะกลับไปยังบอร์ดคอลัมน์เดิมทันที
            </span>
            {confirmEmpty ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-semibold">ยืนยันลบทั้งหมด?</span>
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
            )}
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {trashedBriefs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Trash2 size={32} className="text-slate-300" />
              </div>
              <h4 className="font-semibold text-slate-600 text-base mb-1">ถังขยะว่างเปล่า</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                ไม่มีงานที่ถูกลบค้างอยู่ในระบบ หากคุณลบงานใดๆ จากบอร์ด จะสามารถมากู้คืนได้ที่นี่
              </p>
            </div>
          ) : (
            trashedBriefs.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
                      ลบเมื่อ: {formatDeletedDate(item.details?.deleted_at)}
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
                    onClick={() => handleRestoreClick(item.id)}
                    disabled={restoringId === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    title="กู้คืนงานกลับสู่บอร์ดเดิม"
                  >
                    <RotateCcw size={13} className={restoringId === item.id ? "animate-spin" : ""} />
                    <span>กู้คืน (Restore)</span>
                  </button>

                  {/* Permanent Delete Button */}
                  <button
                    onClick={() => handleDeletePermanent(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="ลบถาวร (Permanent Delete)"
                  >
                    <Trash2 size={15} />
                  </button>
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
    </div>
  );
}
