"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  Target, Sparkles, AlertTriangle, CheckCircle2, 
  ArrowRight, Heart, Flame, X, UserCheck, ShieldCheck, Compass, Zap
} from "lucide-react";
import { DailyMissionResult } from "@/utils/dailyMissionService";
import { Assignee3DAvatarBadge } from "./Assignee3DAvatarBadge";

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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white border border-slate-700/80 rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] max-w-xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Card with User Avatar & Cheeky Mood */}
        <div className="p-5 sm:p-7 border-b border-white/10 relative z-10 bg-white/[0.03]">
          
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-amber-300 text-[11px] font-bold tracking-wide uppercase">
              <Compass size={13} className="animate-spin text-orange-400" style={{ animationDuration: '6s' }} />
              <span>MISSION BRIEFING • ภารกิจวันนี้</span>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="ปิดชั่วคราว"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Profile & Avatar Row */}
          <div className="flex items-center gap-4">
            {/* 3D/Interactive Avatar of the User */}
            <div className="relative shrink-0">
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-rose-500 shadow-xl shadow-orange-500/20">
                <Assignee3DAvatarBadge
                  name={mission.memberName}
                  size={68}
                  showName={false}
                  showBorder={false}
                  disableHoverPreview={true}
                  className="rounded-full overflow-hidden bg-slate-800"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow">
                ⚡
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 truncate">
                <span>{mission.memberName}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-orange-300 border border-white/15 font-semibold">
                  Today's Focus
                </span>
              </h2>
              <p className="text-xs text-slate-300/80 font-medium truncate mt-0.5">
                {mission.roleTitle}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-amber-300/90 font-mono">
                <span className="flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" />
                  {mission.urgentTasksCount > 0 ? `${mission.urgentTasksCount} งานที่ต้องโฟกัส` : 'คิวงานพร้อมลุย'}
                </span>
                <span>•</span>
                <span className="text-slate-400 font-sans">
                  {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar relative z-10">
          
          {/* Mission Narrative (Story Style, Not Rigid Numbered Items) */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              <span>ภารกิจหลักที่ต้องขับเคลื่อนวันนี้:</span>
            </div>

            <div className="space-y-2.5">
              {mission.missions.map((m, idx) => (
                <div 
                  key={idx}
                  className="group relative p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-orange-500/40 transition-all duration-200 flex items-start gap-3 text-xs sm:text-[13px] text-slate-100 font-medium leading-relaxed"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
                  <div className="flex-1">
                    {m}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Cards: Dual Tone Modern Glassmorphism */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Positive Impact Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-transparent border border-emerald-500/30 text-emerald-100 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Sparkles size={14} className="animate-pulse" />
                <span>พลังบวกต่อทีม &amp; ตัวชี้วัด</span>
              </div>
              <p className="text-[11.5px] text-emerald-200/90 leading-relaxed font-normal">
                {mission.positiveImpact.replace("💡 ผลลัพธ์เชิงบวก: ", "")}
              </p>
            </div>

            {/* Risk Watch Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-rose-900/20 to-transparent border border-rose-500/30 text-rose-100 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <AlertTriangle size={14} />
                <span>จุดเฝ้าระวัง &amp; ความเสี่ยง</span>
              </div>
              <p className="text-[11.5px] text-rose-200/90 leading-relaxed font-normal">
                {mission.riskImpact.replace("⚠️ ความเสี่ยงหากละเลย: ", "").replace("⚠️ ความเสี่ยงหากล่าช้า: ", "")}
              </p>
            </div>

          </div>

          {/* Encouragement Quote - Warm Speech Bubble */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Heart size={18} className="fill-orange-400/30 text-orange-400 animate-pulse" />
            </div>
            <p className="text-xs text-amber-200/90 italic font-medium leading-relaxed">
              "{mission.encouragementQuote.replace("🌟 ", "").replace("🚀 ", "").replace("💪 ", "").replace("🎯 ", "").replace("✨ ", "")}"
            </p>
          </div>

          {/* Micro Accountability Note */}
          <div className="text-[10px] text-slate-500 text-center font-mono flex items-center justify-center gap-1 pt-1">
            <ShieldCheck size={12} className="text-emerald-500/80" />
            <span>ระบบบันทึกเวลาการรับทราบลงใน Advice History เรียบร้อย</span>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-5 sm:p-6 bg-white/[0.02] border-t border-white/10 relative z-10 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            พร้อมสร้างผลงานยอดเยี่ยมวันนี้หรือยัง?
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(249,115,22,0.35)] hover:shadow-[0_15px_35px_rgba(249,115,22,0.5)] transition-all cursor-pointer active:scale-98 select-none"
          >
            <UserCheck size={16} />
            <span>รับทราบภารกิจและเริ่มงาน</span>
            <ArrowRight size={14} className="ml-0.5" />
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
