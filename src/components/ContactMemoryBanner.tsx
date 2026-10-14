"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, UserCheck, X, Users, RefreshCw } from "lucide-react";
import { 
  ContactProfile, 
  getSavedContact, 
  getRecentContacts, 
  clearSavedContact, 
  onContactMemoryChange 
} from "@/utils/contactMemory";

interface ContactMemoryBannerProps {
  currentProfile?: ContactProfile | null;
  onSelectProfile?: (profile: ContactProfile) => void;
  onClear?: () => void;
  className?: string;
  variant?: "full" | "compact";
}

export default function ContactMemoryBanner({
  currentProfile,
  onSelectProfile,
  onClear,
  className = "",
  variant = "full"
}: ContactMemoryBannerProps) {
  const [activeProfile, setActiveProfile] = useState<ContactProfile | null>(currentProfile || null);
  const [recentList, setRecentList] = useState<ContactProfile[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = getSavedContact();
    setActiveProfile(saved);
    setRecentList(getRecentContacts());

    const unsubscribe = onContactMemoryChange((updated) => {
      setActiveProfile(updated);
      setRecentList(getRecentContacts());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentProfile !== undefined) {
      setActiveProfile(currentProfile);
    }
  }, [currentProfile]);

  if (!mounted || !activeProfile || (!activeProfile.nickname && !activeProfile.email)) {
    return null;
  }

  const otherProfiles = recentList.filter(p => {
    const isSameEmail = p.email && activeProfile.email && p.email.toLowerCase() === activeProfile.email.toLowerCase();
    const isSameNick = p.nickname && activeProfile.nickname && p.nickname.trim() === activeProfile.nickname.trim();
    return !isSameEmail && !isSameNick;
  });

  const handleClear = () => {
    clearSavedContact();
    setActiveProfile(null);
    if (onClear) onClear();
  };

  const handleSelect = (profile: ContactProfile) => {
    setActiveProfile(profile);
    if (onSelectProfile) onSelectProfile(profile);
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 ${className}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles size={13} className="text-amber-600 shrink-0" />
          <span className="font-semibold truncate">
            จดจำผู้ติดต่อ: {activeProfile.nickname || activeProfile.email}
            {activeProfile.team ? ` (${activeProfile.team})` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          title="ล้างข้อมูลที่จดจำ"
          className="text-[11px] text-amber-700 hover:text-red-600 underline font-medium cursor-pointer shrink-0"
        >
          ล้างข้อมูล
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-orange-50/30 border border-orange-200/70 rounded-2xl p-3 sm:p-3.5 mb-6 transition-all shadow-2xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Auto-remember badge & info */}
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ring-1 ring-orange-400/30">
            <Sparkles size={14} className="animate-pulse" />
          </div>
          <div className="min-w-0 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800">
                ระบบจดจำข้อมูลผู้ติดต่อของคุณแล้ว:
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-orange-700 bg-white/80 px-2 py-0.5 rounded-full border border-orange-200/80 shadow-2xs">
                <UserCheck size={12} className="text-orange-600" />
                {activeProfile.nickname || "ผู้ติดต่อ"}
                {activeProfile.team ? ` • ทีม ${activeProfile.team}` : ""}
              </span>
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-2 truncate">
              {activeProfile.email && <span>{activeProfile.email}</span>}
              {activeProfile.email && activeProfile.phone && <span>•</span>}
              {activeProfile.phone && <span>โทร: {activeProfile.phone}</span>}
            </div>
          </div>
        </div>

        {/* Right: Actions (Clear / Switch) */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium text-slate-500 hover:text-rose-600 bg-white/80 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-full transition-colors cursor-pointer shadow-2xs"
            title="ล้างข้อมูลที่บันทึกไว้ในเครื่องนี้"
          >
            <X size={12} />
            <span>ล้างข้อมูล</span>
          </button>
        </div>

      </div>

      {/* Switch to other saved contacts if user has filled on behalf of multiple people */}
      {otherProfiles.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-orange-200/40 flex items-center gap-2 text-[11px] overflow-x-auto pb-0.5">
          <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Users size={12} className="text-slate-400" />
            สลับเป็นผู้ติดต่ออื่น:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {otherProfiles.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(p)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-full text-slate-700 font-medium cursor-pointer transition-all hover:scale-[1.02] shadow-2xs text-[11px]"
              >
                <RefreshCw size={10} className="text-orange-500" />
                <span>{p.nickname || p.email}</span>
                {p.team && <span className="text-slate-400 text-[10px]">({p.team})</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
