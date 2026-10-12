"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  Target, Sparkles, AlertTriangle, CheckCircle2, 
  ArrowRight, HeartHandshake, ShieldCheck, Flame, X, UserCheck
} from "lucide-react";
import { DailyMissionResult } from "@/utils/dailyMissionService";

interface DailyMissionModalProps {
  mission: DailyMissionResult;
  onAcknowledge: () => void;
  onClose?: () => void;
}

export default function DailyMissionModal({
  mission,
  onAcknowledge,
  onClose,
}: DailyMissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    onAcknowledge();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className={`p-5 sm:p-6 text-white relative overflow-hidden ${
          mission.isDesignLead 
            ? "bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800"
            : mission.isGeneralLead
            ? "bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-950"
            : "bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600"
        }`}>
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs">
                <Target size={13} className="text-amber-300" />
                <span>MISSION OF THE DAY • ภารกิจประจำวัน</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                สวัสดีครับ, {mission.memberName}
              </h2>
              <p className="text-xs text-white/80 font-medium">
                {mission.roleTitle}
              </p>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="ปิด"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Headline Banner */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 text-xs font-bold">
            <Flame size={16} className="text-orange-500 shrink-0 animate-bounce" />
            <span>{mission.headline}</span>
          </div>

          {/* 1. Specific Missions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>สิ่งสำคัญที่ควรดำเนินการวันนี้:</span>
            </h3>
            <div className="space-y-2">
              {mission.missions.map((m, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 text-xs text-slate-800 dark:text-zinc-100 font-medium leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                    {idx + 1}
                  </span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Positive & Risk Impact Grid */}
          <div className="space-y-2.5">
            {/* Positive Impact */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles size={14} />
                <span>ผลกระทบเชิงบวกต่อตัวชี้วัด (KR/R & Performance):</span>
              </div>
              <p className="leading-relaxed pl-5 text-[11.5px] text-emerald-800 dark:text-emerald-300/90 font-medium">
                {mission.positiveImpact.replace("💡 ผลลัพธ์เชิงบวก: ", "")}
              </p>
            </div>

            {/* Risk Impact */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle size={14} />
                <span>จุดเฝ้าระวังและความเสี่ยงหากละเลย:</span>
              </div>
              <p className="leading-relaxed pl-5 text-[11.5px] text-rose-800 dark:text-rose-300/90 font-medium">
                {mission.riskImpact.replace("⚠️ ความเสี่ยงหากละเลย: ", "").replace("⚠️ ความเสี่ยงหากล่าช้า: ", "")}
              </p>
            </div>
          </div>

          {/* 3. Encouragement Quote */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-3">
            <HeartHandshake size={22} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-950 dark:text-indigo-200 italic font-medium leading-relaxed">
              "{mission.encouragementQuote.replace("🌟 ", "").replace("🚀 ", "").replace("💪 ", "").replace("🎯 ", "").replace("✨ ", "")}"
            </p>
          </div>

          {/* Audit Notice */}
          <div className="text-[10px] text-slate-400 dark:text-zinc-500 text-center font-mono">
            🛡️ ระบบจะบันทึกการรับทราบคำแนะนำนี้ลงใน Advice History เพื่อยืนยันความโปร่งใสในการดำเนินงาน
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-zinc-800/40 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={`w-full py-3 px-5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 ${
              mission.isDesignLead
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25"
                : mission.isGeneralLead
                ? "bg-zinc-900 hover:bg-black shadow-zinc-900/30"
                : "bg-gradient-to-r from-[#E03131] to-orange-500 hover:from-[#c92a2a] hover:to-orange-600 shadow-rose-500/25"
            }`}
          >
            <UserCheck size={16} />
            <span>รับทราบภารกิจและเริ่มงาน (Acknowledge Mission)</span>
            <ArrowRight size={14} className="ml-1" />
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
