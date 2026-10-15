"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Zap, ChevronRight, Sparkles } from "lucide-react";
import {
  HalloweenScoreEntry,
  fetchHalloweenLeaderboard
} from "@/utils/halloweenLeaderboardService";

export default function HalloweenTop5Leaderboard() {
  const [top5, setTop5] = useState<HalloweenScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScores = async () => {
    try {
      const list = await fetchHalloweenLeaderboard();
      setTop5(list.slice(0, 5));
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();

    // Listen for leaderboard updates
    const handleUpdate = () => loadScores();
    window.addEventListener("halloween-score-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("halloween-score-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handlePlayClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-halloween-game"));
    }
  };

  return (
    <div 
      onClick={handlePlayClick}
      className="group cursor-pointer select-none rounded-2xl bg-white/95 hover:bg-white border border-slate-200/90 hover:border-amber-400/80 shadow-[0_10px_28px_rgba(0,0,0,0.07),0_2px_6px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(255,98,0,0.14)] p-3 sm:p-3.5 transition-all duration-300 hover:scale-[1.02] font-sans text-left"
      title="คลิกเพื่อประลองมินิเกมเก็บขนมฮาโลวีน ท้าชิงอันดับ!"
    >
      {/* 1. ข้างบนชวนมาประลองเกมส์ (Top Challenge Invitation) */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6200]"></span>
          </span>
          <span className="text-[10px] font-black text-[#FF6200] tracking-wide font-mono">
            🎮 ชวนมาประลองเกมส์!
          </span>
        </div>

        <span className="text-[9px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-0.5 font-mono shadow-2xs">
          <Zap size={9} className="text-[#FF6200]" />
          <span>ไว 10 วิ</span>
        </span>
      </div>

      {/* 2. ตรงหัวขึ้นชื่อเกมส์ (Game Title & Subtitle) */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-b from-amber-100 to-orange-100 border border-amber-300/80 flex items-center justify-center text-sm shadow-2xs group-hover:scale-110 transition-transform">
            🎃
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900 tracking-tight leading-none flex items-center gap-1">
              <span>CANDY HARVEST</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 tracking-wider font-mono mt-0.5 flex items-center gap-1">
              <Trophy size={10} className="text-amber-500" />
              <span>TOP 5 ผู้นำ</span>
            </span>
          </div>
        </div>

        <span className="text-[9px] font-semibold text-slate-400 font-mono">
          คะแนน
        </span>
      </div>

      {/* 3. Top 5 Rows (White Minimal Style) */}
      <div className="space-y-1">
        {loading ? (
          <div className="py-3 text-center text-[10px] text-slate-400 font-mono animate-pulse">
            กำลังโหลดสถิติ...
          </div>
        ) : top5.length === 0 ? (
          <div className="py-3 text-center text-[10px] text-slate-400 font-mono">
            ยังไม่มีผู้ท้าชิง • คลิกเพื่อเล่นคนแรก!
          </div>
        ) : (
          top5.map((entry, idx) => {
            const isTop1 = idx === 0;
            const isTop2 = idx === 1;
            const isTop3 = idx === 2;

            return (
              <div 
                key={entry.id || idx}
                className={`flex items-center justify-between px-2 py-1 rounded-xl text-left transition-colors ${
                  isTop1 
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 shadow-2xs" 
                    : isTop2 
                    ? "bg-slate-50/80 border border-slate-100" 
                    : isTop3 
                    ? "bg-slate-50/50 border border-slate-100" 
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className="font-mono font-black text-[10px] w-4 text-center shrink-0">
                    {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `${idx + 1}.`}
                  </span>
                  <span className={`text-[11px] truncate ${isTop1 ? "font-bold text-amber-950" : "font-medium text-slate-700"}`}>
                    {entry.playerName}
                  </span>
                </div>

                <span className={`font-mono font-black text-[11px] shrink-0 ${isTop1 ? "text-[#FF6200]" : "text-slate-800"}`}>
                  {entry.score}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Call to action footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-[#FF6200] group-hover:text-[#EE5500] transition-colors">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-[#FF6200]" />
          <span>คลิกเพื่อเข้าประลองทันที!</span>
        </span>
        <ChevronRight size={13} className="transform group-hover:translate-x-1 transition-transform text-[#FF6200]" />
      </div>
    </div>
  );
}
