"use client";

import React, { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
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
      {/* 1. ข้างบนชวนมาประลองเกมส์ */}
      <div className="flex items-center gap-1.5 pb-1.5 mb-2 border-b border-slate-100">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6200] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6200]"></span>
        </span>
        <span className="text-[11px] font-black text-[#FF6200] tracking-wide font-mono">
          🎮 ชวนมาประลองเกมส์!
        </span>
      </div>

      {/* 2. ตรงหัวขึ้นชื่อเกมส์ใหญ่ๆ (Big Game Title & Icon) */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-purple-100 via-amber-100 to-orange-200 border border-amber-300 shadow-xs flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            🎁
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              DEMON GIFT BLITZ
            </span>
            <span className="text-[11px] font-bold text-amber-700 tracking-wider font-mono mt-1 flex items-center gap-1">
              <Trophy size={11} className="text-amber-500" />
              <span>TOP 5 ผู้นำ ⚡</span>
            </span>
          </div>
        </div>

        <span className="text-[10px] font-semibold text-slate-400 font-mono self-end pb-0.5">
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
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors ${
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
                  <span className="font-mono font-black text-[11px] w-4 text-center shrink-0">
                    {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `${idx + 1}.`}
                  </span>
                  <span className={`text-xs truncate ${isTop1 ? "font-bold text-amber-950" : "font-medium text-slate-700"}`}>
                    {entry.playerName}
                  </span>
                </div>

                <span className={`font-mono font-black text-xs shrink-0 ${isTop1 ? "text-[#FF6200]" : "text-slate-800"}`}>
                  {entry.score}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
