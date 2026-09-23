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
          bg: "bg-amber-100 text-amber-900 border-amber-300",
          icon: "🏆",
          glow: "ring-2 ring-amber-300/40"
        };
      case "anchor":
        return {
          bg: "bg-purple-100 text-purple-900 border-purple-300",
          icon: "🤝",
          glow: "ring-1 ring-purple-200"
        };
      case "contributor":
        return {
          bg: "bg-blue-100 text-blue-900 border-blue-300",
          icon: "🛡️",
          glow: ""
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: "⚙️",
          glow: ""
        };
    }
  };

  return (
    <div className="bg-white border-2 border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* 1. Header / Dieter Rams Instrument Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-amber-400 shrink-0">
            <HeartHandshake size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>ดัชนีคุณค่างานหลังบ้านและการมีส่วนร่วมของทีม</span>
                <span className="text-xs font-mono font-normal text-slate-300">
                  (Back-of-House Citizenship & Synergy Index)
                </span>
              </h3>
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Concrete Metric
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              แปลงพฤติกรรมเกื้อกูลทีม งานปฏิบัติการเบื้องหลัง วินัยในระบบ และความรับผิดชอบออกมาเป็นผลประเมินตัวเลขที่โปร่งใส 
              เพื่อเชิดชูเกียรติคนทำงานหลังบ้าน และป้องกันไม่ให้ผู้ช่วยหรือสายงานสนับสนุนเสียเปรียบงานหน้าร้าน
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
              {executiveAnalysis.teamCitizenshipScore >= 75 ? "🌟 ระดับยอดเยี่ยม (High Synergy)" : "🤝 ระดับร่วมมือดี (Good Synergy)"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex flex-col items-center justify-center font-mono font-black shadow-inner">
            <span className="text-lg text-amber-400 leading-none">{executiveAnalysis.teamCitizenshipScore}</span>
            <span className="text-[9px] text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* 2. Four Pillars Guide Bar (Expandable) */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <ShieldCheck size={15} className="text-amber-600" />
          <span>โครงสร้างการคำนวณ 4 เสาหลัก (Core Pillars: 25 คะแนน/เสา รวม 100 คะแนนเต็ม)</span>
        </div>
        <button
          onClick={() => setShowPillarsGuide(!showPillarsGuide)}
          className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
        >
          <span>{showPillarsGuide ? "ซ่อนรายละเอียดเกณฑ์" : "ดูสูตรการคำนวณ 4 เสา"}</span>
          {showPillarsGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {showPillarsGuide && (
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Pillar 1 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-blue-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" />
                  <span>1. งานเกื้อกูลเพื่อน</span>
                </span>
                <span className="bg-blue-100 text-blue-900 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  Max 25 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                คำนวณจากงานช่วย (Assistant tasks) และสัดส่วนงานช่วยต่องานทั้งหมด ตรวจวัดพฤติกรรมการไม่ทิ้งเพื่อนและการพร้อมซัพพอร์ตโหลดของยูนิต
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-purple-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-purple-600" />
                  <span>2. ปฏิบัติการหลังบ้าน</span>
                </span>
                <span className="bg-purple-100 text-purple-900 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  Max 25 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                คำนวณจากงานภายใน (Internal tasks), งานเอกสาร, จัดซื้อ, เบิกจ่ายบิล และงานส่วนกลางของ STeP/CMU/RSP ที่ไม่มีตัวเลขหน้างานแต่ขับเคลื่อนทีม
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-amber-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-600" />
                  <span>3. วินัยในระบบ</span>
                </span>
                <span className="bg-amber-100 text-amber-900 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  Max 25 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                คำนวณจากความใส่ใจอัปเดตระบบ ไม่อ้อยอิ่งงาน (Zero Stalled Tasks) และไม่มีงานเลยกำหนดเดดไลน์ (Zero Overdue)
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>4. คุณภาพปิดงาน</span>
                </span>
                <span className="bg-emerald-100 text-emerald-900 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  Max 25 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                คำนวณจาก On-time delivery rate (ส่งมอบงานตรงกำหนดเวลา) และอัตราการปิดงานสำเร็จโดยไม่ถูกยกเลิกกลางคัน
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tiers Filter Tabs */}
      <div className="p-3.5 sm:px-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">กลุ่มเกียรติยศ:</span>
          <button
            onClick={() => setFilterTier("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterTier === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            <span>🏆 เสาหลักหลังบ้าน</span>
            <span className="font-mono text-[10px]">({championsCount})</span>
          </button>
          <button
            onClick={() => setFilterTier("anchor")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTier === "anchor"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100"
            }`}
          >
            <span>🤝 ผู้ส่งเสริมความร่วมมือ</span>
            <span className="font-mono text-[10px]">({anchorsCount})</span>
          </button>
          <button
            onClick={() => setFilterTier("contributor")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTier === "contributor"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
            }`}
          >
            <span>🛡️ ผู้สนับสนุนมาตรฐาน</span>
            <span className="font-mono text-[10px]">({contributorsCount})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          แสดง <strong className="text-slate-900">{filteredMembers.length}</strong> จาก {sortedMembers.length} คน
        </div>
      </div>

      {/* 4. Leaderboard Grid */}
      <div className="p-4 sm:p-5 divide-y divide-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMembers.map((member, idx) => {
            const badge = getTierBadgeStyle(member.citizenshipTier);
            const pillars = member.citizenshipPillars;
            const isTopRank = idx === 0 && filterTier === "all";

            return (
              <div
                key={member.assignee_id}
                onClick={() => onSelectMember && onSelectMember(member.assignee_id)}
                className={`bg-surface border border-surface-border hover:border-amber-300 rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                  isTopRank ? "border-amber-300/80 bg-amber-50/20" : ""
                }`}
              >
                <div>
                  {/* Card Header: Rank, Name, Tier Badge, Score */}
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs"
                          : idx === 1
                          ? "bg-slate-200 text-slate-800"
                          : idx === 2
                          ? "bg-amber-50 text-amber-900 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-amber-800 transition-colors">
                            {member.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.2 rounded bg-slate-100">
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

                    {/* Total BOH Score Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
                        BOH SCORE
                      </div>
                      <div className="text-xl font-black font-mono text-amber-700 leading-tight">
                        {member.citizenshipScore}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Pillars Stacked Meter Bar */}
                  <div className="space-y-1 mb-3 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                      <span>คะแนนแยก 4 มิติ:</span>
                      <span className="font-mono text-slate-500">
                        🤝{pillars.peerSupport} | 📋{pillars.internalOps} | ⚡{pillars.systemDiscipline} | 🎯{pillars.qualityClosure}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex gap-0.5 p-[1px] border border-slate-200">
                      {/* Peer Support (Blue) */}
                      <div
                        style={{ width: `${(pillars.peerSupport / 100) * 100}%` }}
                        className="bg-blue-600 h-full rounded-l-full transition-all"
                        title={`1. ช่วยเพื่อน: ${pillars.peerSupport}/25 คะแนน`}
                      />
                      {/* Internal Ops (Purple) */}
                      <div
                        style={{ width: `${(pillars.internalOps / 100) * 100}%` }}
                        className="bg-purple-600 h-full transition-all"
                        title={`2. งานภายใน/หลังบ้าน: ${pillars.internalOps}/25 คะแนน`}
                      />
                      {/* System Discipline (Amber) */}
                      <div
                        style={{ width: `${(pillars.systemDiscipline / 100) * 100}%` }}
                        className="bg-amber-500 h-full transition-all"
                        title={`3. วินัยในระบบ: ${pillars.systemDiscipline}/25 คะแนน`}
                      />
                      {/* Quality Closure (Emerald) */}
                      <div
                        style={{ width: `${(pillars.qualityClosure / 100) * 100}%` }}
                        className="bg-emerald-600 h-full rounded-r-full transition-all"
                        title={`4. ปิดงานตรงเวลา: ${pillars.qualityClosure}/25 คะแนน`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono pt-0.5">
                      <span className="text-blue-700">ช่วยเพื่อน ({pillars.peerSupport})</span>
                      <span className="text-purple-700">งานภายใน ({pillars.internalOps})</span>
                      <span className="text-amber-700">วินัย ({pillars.systemDiscipline})</span>
                      <span className="text-emerald-700">ส่งตรง ({pillars.qualityClosure})</span>
                    </div>
                  </div>

                  {/* Concrete Quantifiable Metrics Grid */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10.5px]">
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[9.5px] text-slate-500 font-medium">งานช่วยเกื้อกูล</div>
                      <div className="font-bold font-mono text-blue-800">
                        {member.assistantTaskCount} งาน
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        ฿{member.assistantSaveCost.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[9.5px] text-slate-500 font-medium">งานปฏิบัติการหลังบ้าน</div>
                      <div className="font-bold font-mono text-purple-800">
                        {member.internalTasksCount} งาน
                      </div>
                      <div className="text-[9px] text-slate-400">
                        STeP/CMU/RSP
                      </div>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[9.5px] text-slate-500 font-medium">ส่งงานตรงเวลา</div>
                      <div className="font-bold font-mono text-emerald-800">
                        {member.onTimeRate}%
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        ปิดสำเร็จ {member.completedTasks}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Insight Note */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                  <span className="font-medium text-slate-600 truncate">
                    {member.citizenshipTier === "champion" && "🌟 โครงเสาหลักช่วยพยุงโหลดทีมสูงสุด"}
                    {member.citizenshipTier === "anchor" && "🤝 เป็นที่พึ่งพาและร่วมมือในการทำงาน"}
                    {member.citizenshipTier === "contributor" && "🛡️ มีวินัยและปฏิบัติตามมาตรฐานระบบดี"}
                    {member.citizenshipTier === "core" && "⚙️ เชี่ยวชาญการผลิตงานหลักของตนเอง"}
                  </span>
                  <span className="text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
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
