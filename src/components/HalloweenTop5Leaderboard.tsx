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
      className="group cursor-pointer select-none rounded-2xl bg-slate-900/85 hover:bg-slate-900/95 dark:bg-slate-950/90 border border-amber-500/40 hover:border-amber-400 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.35),0_0_15px_rgba(245,158,11,0.12)] p-2.5 sm:p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_30px_rgba(245,158,11,0.25)]"
      title="คลิกเพื่อเล่นมินิเกมเก็บขนมฮาโลวีน ท้าชิงอันดับ!"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-pulse">🎃</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1">
              <Trophy size={11} className="text-amber-400" />
              <span>TOP 5 ผู้นำ</span>
            </span>
            <span className="text-[9px] font-semibold text-slate-400 leading-none">
              ยอดฝีมือฮาโลวีน
            </span>
          </div>
        </div>

        <span className="text-[9px] font-black font-mono text-[#FF6200] bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Zap size={9} />
          <span>10 วิ</span>
        </span>
      </div>

      {/* Top 5 Rows */}
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
                className={`flex items-center justify-between px-1.5 py-0.5 rounded-lg text-left transition-colors ${
                  isTop1 
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/15 border border-amber-400/40" 
                    : isTop2 
                    ? "bg-slate-800/60" 
                    : isTop3 
                    ? "bg-slate-800/40" 
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className="font-mono font-black text-[10px] w-3.5 text-center shrink-0">
                    {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `${idx + 1}`}
                  </span>
                  <span className={`text-[11px] truncate ${isTop1 ? "font-bold text-amber-200" : "font-medium text-slate-300"}`}>
                    {entry.playerName}
                  </span>
                </div>

                <span className="font-mono font-black text-[11px] text-amber-300 shrink-0">
                  {entry.score}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Call to action footer */}
      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] font-black text-amber-400 group-hover:text-amber-300 transition-colors">
        <span className="flex items-center gap-0.5">
          <Sparkles size={10} className="text-amber-400" />
          <span>คลิกเพื่อท้าชิงอันดับ!</span>
        </span>
        <ChevronRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}
