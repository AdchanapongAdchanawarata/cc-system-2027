"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Avatar3DRenderer } from "./Avatar3DRenderer";
import { getMemberAvatarConfig, resolveCanonicalMemberKey } from "@/utils/avatar3dPresets";
import { Avatar3DConfig } from "@/types/avatar3d";
import { DEFAULT_MEMBER_METADATA } from "@/utils/memberProfile";
import { Sparkles, Trophy, Heart, Flame, DollarSign, Briefcase, Star, Pencil } from "lucide-react";
import { getMemberCustomQuote, saveMemberCustomQuote } from "@/utils/memberQuote";
import { 
  getCachedMemberStats, 
  fetchMemberStatsDirectly, 
  calculatePersona, 
  CompactMemberStats,
  MemberPersona 
} from "@/utils/avatarMemberStats";

interface Assignee3DAvatarBadgeProps {
  name?: string;
  id?: string;
  size?: number;
  showName?: boolean;
  className?: string;
  onClick?: () => void;
  showBorder?: boolean;
  disableHoverPreview?: boolean;
  title?: string;
}

// Backward-compatible empty export (no random mock quotes)
export const CHEEKY_QUOTES: Record<string, string[]> = {};

export const Assignee3DAvatarBadge: React.FC<Assignee3DAvatarBadgeProps> = ({
  name,
  id,
  size = 22,
  showName = false,
  className = "",
  onClick,
  showBorder = false,
  disableHoverPreview = false,
  title,
}) => {
  const identifier = name || id || "CC";
  const [config, setConfig] = useState<Avatar3DConfig>(() => getMemberAvatarConfig(identifier));
  const badgeRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: "top" | "bottom" }>({
    top: 0,
    left: 0,
    placement: "top",
  });
  const [memberStats, setMemberStats] = useState<CompactMemberStats>(() => getCachedMemberStats(identifier));
  const [customQuote, setCustomQuote] = useState<string>(() => getMemberCustomQuote(identifier) || "");
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync avatar updates & member stats updates & custom quotes
  useEffect(() => {
    setConfig(getMemberAvatarConfig(identifier));
    setMemberStats(getCachedMemberStats(identifier));
    const savedQ = getMemberCustomQuote(identifier);
    setCustomQuote(savedQ || "");

    const handleAvatarUpdate = (e: any) => {
      const detail = e.detail;
      const canonical = resolveCanonicalMemberKey(identifier);
      if (
        !detail || 
        detail.all || 
        detail.member === identifier || 
        detail.member === name || 
        detail.member === id ||
        (detail.canonicalKey && detail.canonicalKey === canonical) ||
        (detail.member && resolveCanonicalMemberKey(detail.member) === canonical)
      ) {
        setConfig(getMemberAvatarConfig(identifier));
      }
    };

    const handleStatsUpdate = (e: any) => {
      setMemberStats(getCachedMemberStats(identifier));
    };

    const handleQuoteUpdate = (e: any) => {
      const saved = getMemberCustomQuote(identifier);
      setCustomQuote(saved || "");
    };

    window.addEventListener("cc_avatar_updated", handleAvatarUpdate);
    window.addEventListener("cc_member_stats_updated", handleStatsUpdate);
    window.addEventListener("cc_quote_updated", handleQuoteUpdate);
    return () => {
      window.removeEventListener("cc_avatar_updated", handleAvatarUpdate);
      window.removeEventListener("cc_member_stats_updated", handleStatsUpdate);
      window.removeEventListener("cc_quote_updated", handleQuoteUpdate);
    };
  }, [identifier, name, id]);

  // If popover opens and stats are empty, fetch directly in background
  useEffect(() => {
    if (isOpen && (memberStats.total === 0 || memberStats.satisfactionScore === undefined)) {
      fetchMemberStatsDirectly().then(() => {
        setMemberStats(getCachedMemberStats(identifier));
      });
    }
  }, [isOpen, identifier, memberStats.total, memberStats.satisfactionScore]);

  // Close popup on scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  const updatePosition = () => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const popoverWidth = 285;
    const popoverHeight = 410;
    const margin = 10;

    let placement: "top" | "bottom" = "top";
    let top = rect.top - popoverHeight - margin;

    // Flip to bottom if clipping top edge
    if (top < 14) {
      top = rect.bottom + margin;
      placement = "bottom";
    }

    // Center horizontally relative to badge
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    // Bound within viewport horizontally
    left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, left));

    setCoords({ top, left, placement });
  };

  const handleMouseEnter = () => {
    if (disableHoverPreview) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
      return;
    }
    if (disableHoverPreview) return;
    updatePosition();
    setIsOpen((prev) => !prev);
  };

  const canonical = resolveCanonicalMemberKey(identifier);
  const meta = DEFAULT_MEMBER_METADATA[identifier] || (canonical ? DEFAULT_MEMBER_METADATA[canonical] : undefined) || {};
  const persona = calculatePersona(memberStats, identifier);

  // Strictly check if current logged-in user is the owner of this avatar card
  const canEdit = (() => {
    if (typeof window === "undefined") return false;
    const currentName = (localStorage.getItem("cc_user_name") || "").trim();
    if (!currentName) return false;
    const curCanonical = resolveCanonicalMemberKey(currentName) || currentName.toLowerCase();
    const targetCanonical = resolveCanonicalMemberKey(identifier) || identifier.toLowerCase();
    if (curCanonical && targetCanonical && curCanonical === targetCanonical) return true;
    const curLower = currentName.toLowerCase();
    const targetLower = identifier.trim().toLowerCase();
    return curLower === targetLower || curLower.includes(targetLower) || targetLower.includes(curLower);
  })();

  const effectiveTitle = title !== undefined 
    ? (title || undefined) 
    : (disableHoverPreview ? undefined : `คลิกหรือชี้เพื่อดู Avatar และผลงานของ ${identifier}`);

  const interactiveClasses = disableHoverPreview
    ? ""
    : "cursor-pointer hover:scale-125 hover:rotate-6 active:scale-95";

  return (
    <>
      <div
        ref={badgeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`group/avatar inline-flex items-center gap-1.5 shrink-0 select-none transition-transform duration-200 ${interactiveClasses} ${className}`}
        title={effectiveTitle}
      >
        <Avatar3DRenderer config={config} size={size} showBorder={showBorder} />
        {showName && name && (
          <span className="truncate">{name}</span>
        )}
      </div>

      {/* CLEAN MINIMAL WHITE FLOATING CARD */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          onMouseEnter={() => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          style={{ top: coords.top, left: coords.left }}
          className="fixed z-[99999] pointer-events-auto flex flex-col items-center bg-white/98 text-slate-800 border border-slate-200/90 rounded-3xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.05)] w-[285px] animate-in zoom-in-95 fade-in duration-200 select-none font-sans"
        >
          {/* Top Header Banner: Star Rating Graphic & CC TEAM */}
          <div className="flex items-center justify-between w-full px-1 mb-2 gap-2">
            {(() => {
              const rawScore = Number(memberStats.satisfactionScore) || 0;
              const starCount = rawScore > 0 ? Math.min(5, Math.max(1, Math.round(rawScore))) : 0;
              let ratingLabel = "UNRATED";
              if (starCount === 5) ratingLabel = "EXCELLENT";
              else if (starCount === 4) ratingLabel = "GOOD";
              else if (starCount === 3) ratingLabel = "AVERAGE";
              else if (starCount === 2) ratingLabel = "FAIR";
              else if (starCount === 1) ratingLabel = "POOR";

              return (
                <div
                  className="flex flex-col items-start gap-1 cursor-default"
                  title={`แบบประเมินความพึงพอใจเฉลี่ย: ${rawScore > 0 ? rawScore.toFixed(1) : "0 (ศูนย์)"} / 5 (รวมงานหลักและงานช่วย ${memberStats.satisfactionCount || 0} งาน)`}
                >
                  {/* 5 Stars Row */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const isFilled = starIdx <= starCount;
                      return (
                        <Star
                          key={starIdx}
                          size={13}
                          className={
                            isFilled
                              ? "fill-[#FBBF24] text-[#FBBF24]"
                              : "fill-[#CBD5E1] text-[#CBD5E1] dark:fill-slate-700 dark:text-slate-700"
                          }
                        />
                      );
                    })}
                  </div>

                  {/* Label: EXCELLENT (5), GOOD (4), AVERAGE (3), UNRATED (0) */}
                  <div className="text-[11px] font-black tracking-wide text-slate-900 dark:text-slate-100 uppercase font-sans leading-none">
                    {ratingLabel} ({starCount})
                  </div>
                </div>
              );
            })()}

            <span className="text-[9.5px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/90 text-slate-700 shadow-2xs shrink-0 self-start mt-0.5">
              CC TEAM
            </span>
          </div>

          {/* Large Enlarged Character Artwork */}
          <div className="relative my-1 flex items-center justify-center drop-shadow-sm">
            <Avatar3DRenderer
              config={config}
              size={135}
              showBorder={false}
              animate
              cheeky
            />
          </div>

          {/* Character Nameplate */}
          <div className="text-center w-full px-1 mt-1">
            <h4 className="font-bold text-base text-slate-900 tracking-tight leading-tight">
              {identifier}
            </h4>
            <p className="text-[11px] text-slate-500 font-normal tracking-wide mt-0.5 truncate">
              {meta.fullName || meta.position || "สมาชิกทีม CC"}
            </p>
          </div>

          {/* Persona / Superpower Trait */}
          <div className="mt-1.5 flex flex-col items-center text-center w-full">
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1.5 shadow-2xs">
              <span>⭐ {persona.title}</span>
            </div>
          </div>

          {/* Flavor Text / Custom Quote (Clean borderless, large bold text, editable ONLY by the owner) */}
          {isEditingQuote && canEdit ? (
            <div className="mt-2 w-full p-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-xs shadow-2xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Pencil size={11} className="text-amber-500" />
                  คำคมประจำตัวของคุณ
                </span>
                <span className="text-[9px] text-slate-400 font-normal">บันทึกเพื่อแสดงผลเหมือนกันทุก Task</span>
              </div>
              <textarea
                value={quoteInput}
                onChange={(e) => setQuoteInput(e.target.value)}
                placeholder="พิมพ์คำคมเด็ดๆ ประจำตัวคุณ..."
                rows={2}
                maxLength={90}
                className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingQuote(false)}
                  className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isSavingQuote}
                  onClick={async () => {
                    setIsSavingQuote(true);
                    await saveMemberCustomQuote(identifier, quoteInput);
                    setCustomQuote(quoteInput.trim());
                    setIsEditingQuote(false);
                    setIsSavingQuote(false);
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-md shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  {isSavingQuote ? "บันทึก..." : "บันทึกคำคม"}
                </button>
              </div>
            </div>
          ) : customQuote.trim() ? (
            <div className="group/quote relative mt-2 px-2 py-1 text-center w-full">
              <p className="text-[15.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-snug tracking-tight">
                <span className="text-amber-500 font-serif mr-1 text-base font-black select-none">“</span>
                {customQuote.trim()}
                <span className="text-amber-500 font-serif ml-1 text-base font-black select-none">”</span>
              </p>

              {/* Edit Quote Button: ONLY rendered if viewing YOUR OWN card! */}
              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuoteInput(customQuote.trim());
                    setIsEditingQuote(true);
                  }}
                  className="absolute -top-1.5 right-0 p-1 rounded-md text-slate-300 hover:text-amber-600 hover:bg-slate-100 transition-colors opacity-0 group-hover/quote:opacity-100 cursor-pointer"
                  title="คลิกเพื่อแก้ไขคำคมประจำตัวของคุณ"
                >
                  <Pencil size={11} />
                </button>
              )}
            </div>
          ) : canEdit ? (
            <div className="mt-2 w-full flex justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuoteInput("");
                  setIsEditingQuote(true);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-amber-800 bg-amber-50/90 hover:bg-amber-100 border border-amber-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="คลิกเพื่อตั้งคำคมประจำตัวของคุณสำหรับแสดงบนทุก Task"
              >
                <Pencil size={11} className="text-amber-600" />
                <span>+ ตั้งคำคมประจำตัวของคุณ</span>
              </button>
            </div>
          ) : (
            <div className="mt-2 px-2 py-0.5 text-center w-full">
              <p className="text-[11px] text-slate-400 font-medium">
                (ยังไม่ได้ตั้งคำคมประจำตัว)
              </p>
            </div>
          )}

          {/* Stats Box (Minimal Clean Container) */}
          <div className="w-full mt-2.5 bg-slate-50/80 rounded-2xl border border-slate-100 p-2 space-y-1.5 text-center shadow-2xs">
            {/* Row 1: Task Counters */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="bg-white rounded-xl py-1.5 px-1 border border-slate-200/80 flex flex-col items-center justify-center shadow-2xs">
                <div className="text-[9px] text-slate-500 font-semibold leading-none">ทั้งหมด</div>
                <div className="font-bold text-slate-800 tabular-nums mt-1 text-sm leading-none">
                  {memberStats.total}
                </div>
              </div>
              <div className="bg-white rounded-xl py-1.5 px-1 border border-amber-200/80 flex flex-col items-center justify-center shadow-2xs">
                <div className="text-[9px] text-amber-600 font-semibold leading-none">รอทำ</div>
                <div className="font-bold text-amber-600 tabular-nums mt-1 text-sm leading-none">
                  {memberStats.pending}
                </div>
              </div>
              <div className="bg-white rounded-xl py-1.5 px-1 border border-sky-200/80 flex flex-col items-center justify-center shadow-2xs">
                <div className="text-[9px] text-sky-600 font-semibold leading-none">กำลังทำ</div>
                <div className="font-bold text-sky-600 tabular-nums mt-1 text-sm leading-none">
                  {memberStats.inProgress}
                </div>
              </div>
              <div className="bg-white rounded-xl py-1.5 px-1 border border-emerald-200/80 flex flex-col items-center justify-center shadow-2xs">
                <div className="text-[9px] text-emerald-600 font-semibold leading-none">เสร็จแล้ว</div>
                <div className="font-bold text-emerald-600 tabular-nums mt-1 text-sm leading-none">
                  {memberStats.completed}
                </div>
              </div>
            </div>

            {/* Row 2: Save Cost & กำไรโครงการ */}
            <div className="grid grid-cols-2 gap-2 text-center">
              {/* Save Cost */}
              <div className="bg-emerald-50/80 rounded-xl py-2 px-2 border border-emerald-200/80 flex flex-col items-center justify-center shadow-2xs">
                <span className="text-[10px] text-emerald-700 font-semibold leading-none tracking-tight">
                  Save Cost
                </span>
                <span className="font-bold text-emerald-700 tabular-nums text-[13px] tracking-tight mt-1 leading-none">
                  ฿{memberStats.saveCost.toLocaleString()}
                </span>
              </div>

              {/* กำไรโครงการ */}
              <div className="bg-blue-50/80 rounded-xl py-2 px-2 border border-blue-200/80 flex flex-col items-center justify-center shadow-2xs">
                <span className="text-[10px] text-blue-700 font-semibold leading-none tracking-tight">
                  กำไรโครงการ
                </span>
                <span className="font-bold text-blue-700 tabular-nums text-[13px] tracking-tight mt-1 leading-none">
                  ฿{memberStats.profit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
