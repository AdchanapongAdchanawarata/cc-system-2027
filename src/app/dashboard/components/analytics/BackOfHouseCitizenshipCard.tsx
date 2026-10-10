"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  Zap, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  Sparkles, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Layers,
  ArrowRight
} from "lucide-react";
import { MemberStats, TeamExecutiveAnalysis } from "@/utils/stats";

interface BackOfHouseCitizenshipCardProps {
  memberStats: MemberStats[];
  executiveAnalysis: TeamExecutiveAnalysis;
  onSelectMember?: (assigneeId: string) => void;
}

export default function BackOfHouseCitizenshipCard({
  memberStats,
  executiveAnalysis,
  onSelectMember
}: BackOfHouseCitizenshipCardProps) {
  const [filterTier, setFilterTier] = useState<"all" | "champion" | "anchor" | "contributor" | "core">("all");
  const [showPillarsGuide, setShowPillarsGuide] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Sort members by BOH Citizenship score descending
  const sortedMembers = [...memberStats].sort((a, b) => {
    if (b.citizenshipScore !== a.citizenshipScore) {
      return b.citizenshipScore - a.citizenshipScore;
    }
    // secondary: assistant task count
    if (b.assistantTaskCount !== a.assistantTaskCount) {
      return b.assistantTaskCount - a.assistantTaskCount;
    }
    return b.totalSaveCost - a.totalSaveCost;
  });

  const filteredMembers = sortedMembers.filter(m => {
    if (filterTier === "all") return true;
    return m.citizenshipTier === filterTier;
  });

  const championsCount = sortedMembers.filter(m => m.citizenshipTier === "champion").length;
  const anchorsCount = sortedMembers.filter(m => m.citizenshipTier === "anchor").length;
  const contributorsCount = sortedMembers.filter(m => m.citizenshipTier === "contributor").length;

  const getTierBadgeStyle = (tier: MemberStats["citizenshipTier"]) => {
    switch (tier) {
      case "champion":
        return {
          bg: "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-600/70",
          icon: "🏆",
          glow: "ring-2 ring-amber-300/40"
        };
      case "anchor":
        return {
          bg: "bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-600/70",
          icon: "🤝",
          glow: "ring-1 ring-purple-200"
        };
      case "contributor":
        return {
          bg: "bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-600/70",
          icon: "🛡️",
          glow: ""
        };
      default:
        return {
          bg: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700",
          icon: "⚙️",
          glow: ""
        };
    }
  };

  return (
    <div className="bg-surface border-2 border-surface-border rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* 1. Header / Dieter Rams Instrument Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-amber-400 shrink-0">
            <HeartHandshake size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>ดัชนีคุณค่างานช่วยทีมและวินัยการทำงาน</span>
                <span className="text-xs font-mono font-normal text-slate-300">
                  (Teamwork & Contribution Index)
                </span>
              </h3>
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                วัดผลได้จริง
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              วัดผลความร่วมมือจริง 4 ด้าน: ช่วยงานเพื่อน, งานส่วนกลางของทีม (STeP & RSP), ความสม่ำเสมอในการอัปเดตงาน และการส่งมอบตรงเวลา เพื่อเชิดชูคนที่คอยสนับสนุนทีมเบื้องหลัง
            </p>
          </div>
        </div>

        {/* Team Score Indicator */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-white/5 border border-white/10 p-2.5 rounded-xl">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              คะแนนความร่วมมือเฉลี่ยทีม
            </div>
            <div className="text-xs font-bold text-emerald-400">
              {executiveAnalysis.teamCitizenshipScore >= 75 ? "🌟 ระดับยอดเยี่ยม (ร่วมมือสูงมาก)" : "🤝 ระดับร่วมมือดี (ร่วมมือดี)"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex flex-col items-center justify-center font-mono font-black shadow-inner">
            <span className="text-lg text-amber-400 leading-none">{executiveAnalysis.teamCitizenshipScore}</span>
            <span className="text-[9px] text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* 2. Four Pillars Guide Bar (Expandable) */}
      <div className="border-b border-surface-border bg-muted/5 p-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-foreground font-bold">
          <ShieldCheck size={15} className="text-amber-500" />
          <span>เกณฑ์คะแนน 4 ด้าน (ด้านละ 25 คะแนน รวม 100 คะแนนเต็ม)</span>
        </div>
        <button
          onClick={() => setShowPillarsGuide(!showPillarsGuide)}
          className="text-muted hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
        >
          <span>{showPillarsGuide ? "ซ่อนคำอธิบายเกณฑ์" : "ดูคำอธิบายทั้ง 4 ด้าน"}</span>
          {showPillarsGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {showPillarsGuide && (
        <div className="p-4 sm:p-5 bg-muted/5 border-b border-surface-border animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Pillar 1 */}
            <div className="bg-surface p-3.5 rounded-xl border border-surface-border shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>1. ช่วยงานเพื่อน</span>
                </span>
                <span className="bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  เต็ม 25 คะแนน
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                คำนวณจากจำนวนงานที่เข้าไปเป็นผู้ช่วยในงานคนอื่น (Assistant tasks) สะท้อนการช่วยเหลือกันและแบ่งเบาภาระงานในทีม
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-surface p-3.5 rounded-xl border border-surface-border shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-purple-600 dark:text-purple-400" />
                  <span>2. งานส่วนกลางของทีม</span>
                </span>
                <span className="bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  เต็ม 25 คะแนน
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                คำนวณจากงานส่วนกลาง (Internal tasks) เช่น STeP, RSP, งานแอดมิน, งานเอกสารเบื้องหลังที่ขับเคลื่อนองค์กร
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-surface p-3.5 rounded-xl border border-surface-border shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>3. อัปเดตงานสม่ำเสมอ</span>
                </span>
                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  เต็ม 25 คะแนน
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                คำนวณจากการไม่อ้อยอิ่งงาน (Zero Stalled Tasks) และไม่มีงานค้างเลยกำหนดเดดไลน์ (Zero Overdue) อัปเดตระบบสม่ำเสมอ
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-surface p-3.5 rounded-xl border border-surface-border shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>4. ส่งมอบงานตรงเวลา</span>
                </span>
                <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  เต็ม 25 คะแนน
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                คำนวณจากอัตราส่งมอบงานทันตามกำหนดเวลา (On-time delivery rate) และปิดงานได้สำเร็จลุล่วง
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tiers Filter Tabs */}
      <div className="p-3.5 sm:px-5 border-b border-surface-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-muted mr-1">กลุ่มเกียรติยศ:</span>
          <button
            onClick={() => setFilterTier("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterTier === "all"
                ? "bg-primary text-white shadow-xs"
                : "bg-muted/10 text-muted hover:bg-muted/20"
            }`}
          >
            ทั้งหมด ({sortedMembers.length})
          </button>
          <button
            onClick={() => setFilterTier("champion")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTier === "champion"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span>🏆 เสาหลักช่วยงานทีม</span>
            <span className="font-mono text-[10px]">({championsCount})</span>
          </button>
          <button
            onClick={() => setFilterTier("anchor")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTier === "anchor"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20"
            }`}
          >
            <span>🤝 เพื่อนร่วมงานที่พึ่งพาได้</span>
            <span className="font-mono text-[10px]">({anchorsCount})</span>
          </button>
          <button
            onClick={() => setFilterTier("contributor")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTier === "contributor"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20"
            }`}
          >
            <span>🛡️ รักษามาตรฐานวินัยงาน</span>
            <span className="font-mono text-[10px]">({contributorsCount})</span>
          </button>
        </div>

        <div className="text-[11px] text-muted font-medium">
          แสดง <strong className="text-foreground">{filteredMembers.length}</strong> จาก {sortedMembers.length} คน
        </div>
      </div>

      {/* 4. Leaderboard Grid */}
      <div className="p-4 sm:p-5 divide-y divide-surface-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMembers.map((member, idx) => {
            const badge = getTierBadgeStyle(member.citizenshipTier);
            const pillars = member.citizenshipPillars;
            const isTopRank = idx === 0 && filterTier === "all";

            return (
              <div
                key={member.assignee_id}
                onClick={() => onSelectMember && onSelectMember(member.assignee_id)}
                className={`bg-surface border border-surface-border hover:border-amber-400 dark:hover:border-amber-500/50 rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                  isTopRank ? "border-amber-500/40 bg-amber-500/5" : ""
                }`}
              >
                <div>
                  {/* Card Header: Rank, Name, Tier Badge, Score */}
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 shadow-2xs"
                          : idx === 1
                          ? "bg-muted/20 text-foreground"
                          : idx === 2
                          ? "bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/20"
                          : "bg-muted/10 text-muted"
                      }`}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-foreground text-sm truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {member.name}
                          </h4>
                          <span className="text-[10px] font-bold text-muted uppercase px-1.5 py-0.2 rounded bg-muted/10">
                            {member.unit}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.glow}`}>
                            <span>{badge.icon}</span>
                            <span>{member.citizenshipTitle}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total Score Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-[9.5px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">
                        คะแนนช่วยงานทีม
                      </div>
                      <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 leading-tight">
                        {member.citizenshipScore}
                        <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Pillars Clear Progress Meters (2x2 Grid) */}
                  <div className="space-y-2 mb-3 bg-slate-50/90 dark:bg-zinc-800/80 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-zinc-700/80">
                    <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-700 dark:text-zinc-200">
                      <span>คะแนน 4 ด้านความร่วมมือ (เต็มด้านละ 25 คะแนน):</span>
                      <span className="font-mono text-slate-500 dark:text-zinc-400 text-[10px]">รวม {member.citizenshipScore}/100</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      {/* 1. ช่วยงานเพื่อน */}
                      <div className="bg-white dark:bg-zinc-900/90 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 text-[10.5px]">
                            🤝 ช่วยงานเพื่อน
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-zinc-200 text-[10px]">
                            {pillars.peerSupport}<span className="text-slate-400 font-normal">/25</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${(pillars.peerSupport / 25) * 100}%` }} 
                            className="bg-blue-500 h-full rounded-full transition-all" 
                          />
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-zinc-400 mt-1 truncate">
                          {member.assistantTaskCount > 0 ? `เป็นผู้ช่วย ${member.assistantTaskCount} งาน` : "ยังไม่ได้ลงเป็นผู้ช่วย"}
                        </div>
                      </div>

                      {/* 2. งานส่วนกลาง / งานทีม */}
                      <div className="bg-white dark:bg-zinc-900/90 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1 text-[10.5px]">
                            🏢 งานส่วนกลางทีม
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-zinc-200 text-[10px]">
                            {pillars.internalOps}<span className="text-slate-400 font-normal">/25</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${(pillars.internalOps / 25) * 100}%` }} 
                            className="bg-purple-500 h-full rounded-full transition-all" 
                          />
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-zinc-400 mt-1 truncate">
                          {member.internalTasksCount > 0 ? `ช่วยงานทีม ${member.internalTasksCount} งาน` : "ยังไม่มีงานส่วนกลาง"}
                        </div>
                      </div>

                      {/* 3. อัปเดตงานสม่ำเสมอ */}
                      <div className="bg-white dark:bg-zinc-900/90 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 text-[10.5px]">
                            ⚡ อัปเดตงานสม่ำเสมอ
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-zinc-200 text-[10px]">
                            {pillars.systemDiscipline}<span className="text-slate-400 font-normal">/25</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${(pillars.systemDiscipline / 25) * 100}%` }} 
                            className="bg-amber-400 h-full rounded-full transition-all" 
                          />
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-zinc-400 mt-1 truncate">
                          {member.stalledPendingCount + member.stalledProgressCount + member.overdueTasksCount === 0 ? "ไม่มีงานค้างดองในระบบ" : `มีงานค้าง ${member.stalledPendingCount + member.stalledProgressCount + member.overdueTasksCount} งาน`}
                        </div>
                      </div>

                      {/* 4. ส่งมอบงานตรงเวลา */}
                      <div className="bg-white dark:bg-zinc-900/90 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 text-[10.5px]">
                            🎯 ส่งมอบตรงเวลา
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-zinc-200 text-[10px]">
                            {pillars.qualityClosure}<span className="text-slate-400 font-normal">/25</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${(pillars.qualityClosure / 25) * 100}%` }} 
                            className="bg-emerald-500 h-full rounded-full transition-all" 
                          />
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-zinc-400 mt-1 truncate">
                          {`ตรงเวลา ${member.onTimeRate}% (ส่งสำเร็จ ${member.completedTasks})`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Concrete Quantifiable Metrics Grid */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10.5px]">
                    <div className="p-1.5 bg-slate-50 dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700/80">
                      <div className="text-[9.5px] text-slate-500 dark:text-zinc-300 font-semibold">งานที่ลงช่วยเพื่อน</div>
                      <div className="font-bold font-mono text-blue-700 dark:text-blue-300 text-xs">
                        {member.assistantTaskCount} งาน
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-zinc-400 font-mono">
                        ฿{member.assistantSaveCost.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-1.5 bg-slate-50 dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700/80">
                      <div className="text-[9.5px] text-slate-500 dark:text-zinc-300 font-semibold">งานส่วนกลางของทีม</div>
                      <div className="font-bold font-mono text-purple-700 dark:text-purple-300 text-xs">
                        {member.internalTasksCount} งาน
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-zinc-400">
                        STeP / RSP / งานทีม
                      </div>
                    </div>

                    <div className="p-1.5 bg-slate-50 dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700/80">
                      <div className="text-[9.5px] text-slate-500 dark:text-zinc-300 font-semibold">ส่งมอบงานตรงเวลา</div>
                      <div className="font-bold font-mono text-emerald-700 dark:text-emerald-300 text-xs">
                        {member.onTimeRate}%
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-zinc-400 font-mono">
                        ปิดสำเร็จ {member.completedTasks} งาน
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Insight Note */}
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-700/60 flex items-center justify-between text-[10.5px]">
                  <span className="font-medium text-slate-600 dark:text-zinc-300 truncate">
                    {member.citizenshipTier === "champion" && "🌟 เสาหลักที่คอยช่วยงานเพื่อนและขับเคลื่อนงานส่วนกลางทีมเสมอ"}
                    {member.citizenshipTier === "anchor" && "🤝 เป็นที่พึ่งพา ร่วมมือช่วยงานเพื่อนและรับผิดชอบงานทีมได้ดี"}
                    {member.citizenshipTier === "contributor" && "🛡️ มีวินัย อัปเดตงานสม่ำเสมอ และส่งมอบงานตรงเวลาตามมาตรฐาน"}
                    {member.citizenshipTier === "core" && "⚙️ ปัจจุบันเน้นลุยงานหลักของตนเองเป็นหลัก ยังไม่ได้ลงเป็นผู้ช่วยในงานอื่น"}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                    <span>ดูงาน</span>
                    <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
