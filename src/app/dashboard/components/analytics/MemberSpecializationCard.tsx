"use client";

import React from 'react';
import { 
  Zap, Trophy, Users, HeartHandshake, Building2, Flame,
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, Star, Sparkles, Briefcase
} from 'lucide-react';
import { MemberIntelligenceProfile } from '@/utils/teamAnalytics';

interface MemberSpecializationCardProps {
  profile: MemberIntelligenceProfile;
  memberName: string;
  memberUnit: string;
}

export default function MemberSpecializationCard({
  profile,
  memberName,
  memberUnit
}: MemberSpecializationCardProps) {
  const { 
    statusBreakdown, 
    topSpecializations, 
    bestPerformances, 
    clientTeamAffinities, 
    peerCollaborations 
  } = profile;

  return (
    <div className="w-full bg-surface rounded-3xl border border-surface-border p-5 sm:p-6 shadow-xs space-y-6">
      
      {/* 1. Header & Current In-Hand Status Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shadow-2xs">
              <Sparkles size={18} />
            </span>
            <h3 className="text-base font-bold text-foreground">
              ความเชี่ยวชาญ จุดเด่น และเครือข่ายความร่วมมือของ {memberName}
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5">
            วิเคราะห์แนวโน้มประเภทงานที่ถืองานเยอะ, งานที่ทำผลงานได้ดีเยี่ยม และทีมที่ร่วมงานบ่อย
          </p>
        </div>

        {/* Member Status Breakdown Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>กำลังทำ: <strong className="font-bold font-mono">{statusBreakdown.inProgress}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
            <Clock size={12} className="text-amber-600 dark:text-amber-400" />
            <span>รอทำ: <strong className="font-bold font-mono">{statusBreakdown.pending}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
            <span>เสร็จแล้ว: <strong className="font-bold font-mono">{statusBreakdown.completed}</strong></span>
          </div>
          {statusBreakdown.overdue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20">
              <AlertTriangle size={12} className="text-rose-600 dark:text-rose-400" />
              <span>เกินกำหนด: <strong className="font-bold font-mono">{statusBreakdown.overdue}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Four Dimension Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        
        {/* Card A: ใครทำงานประเภทไหนเยอะ (Core Work Type Specialization) */}
        <div className="bg-muted/5 rounded-2xl p-4.5 border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Flame size={15} className="text-amber-500" />
              งานที่ทำเยอะที่สุด (Core Specialization)
            </h4>
            <span className="text-[10px] text-muted font-medium">สัดส่วนภาระงาน</span>
          </div>

          {topSpecializations.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">ยังไม่มีประวัติประเภทงาน</div>
          ) : (
            <div className="space-y-2.5">
              {topSpecializations.map((spec, i) => (
                <div key={spec.category} className="bg-surface p-2.5 rounded-xl border border-surface-border shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-foreground truncate pr-2">
                      {i + 1}. {spec.category}
                    </span>
                    <span className="font-mono font-bold text-foreground shrink-0">
                      {spec.count} ชิ้น ({spec.percentage}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.max(8, spec.percentage)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                      ฿{spec.totalSaveCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card B: ทำงานประเภทไหนได้ดี (Best Performance & Peak Efficiency) */}
        <div className="bg-muted/5 rounded-2xl p-4.5 border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={15} className="text-emerald-600 dark:text-emerald-400" />
              ทำงานประเภทไหนได้ดี (Peak Performance)
            </h4>
            <span className="text-[10px] text-muted font-medium">วัดจากความเร็ว & ตรงเวลา</span>
          </div>

          {bestPerformances.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">ยังไม่มีงานที่เสร็จสิ้นสมบูรณ์</div>
          ) : (
            <div className="space-y-2.5">
              {bestPerformances.map((perf) => (
                <div key={perf.category} className="bg-surface p-2.5 rounded-xl border border-emerald-500/20 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">⭐</span>
                      <span className="font-bold text-foreground truncate">
                        {perf.category}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      perf.ratingBadge === 'fastest' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300' :
                      perf.ratingBadge === 'flawless' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    }`}>
                      {perf.ratingBadge === 'fastest' ? '⚡ ปิดงานเร็วสุด' :
                       perf.ratingBadge === 'flawless' ? '✨ ตรงเวลา 100%' : '🔥 ชำนาญสูง'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted pt-0.5">
                    <span className="font-medium text-foreground/80">{perf.highlightText}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      เสร็จ {perf.count} ชิ้น
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card C: ชอบทำงานกับทีมไหน (Client Team Affinity) */}
        <div className="bg-muted/5 rounded-2xl p-4.5 border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={15} className="text-indigo-600 dark:text-indigo-400" />
              ทีมที่ร่วมงานและรับบรีฟบ่อยสุด (Client Affinity)
            </h4>
            <span className="text-[10px] text-muted font-medium">ทีมผู้สั่งงาน</span>
          </div>

          {clientTeamAffinities.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">ยังไม่มีข้อมูลทีมลูกค้า</div>
          ) : (
            <div className="space-y-2">
              {clientTeamAffinities.map((team) => (
                <div key={team.teamKey} className="bg-surface p-2.5 rounded-xl border border-surface-border shadow-2xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {team.teamName}
                    </div>
                    <div className="text-[10px] text-muted font-medium mt-0.5">
                      สัดส่วน {team.percentage}% ของงานทั้งหมดที่รับผิดชอบ
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {team.count} งาน
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card D: คู่หูที่ร่วมงานบ่อยที่สุด (Top Peer Collaboration) */}
        <div className="bg-muted/5 rounded-2xl p-4.5 border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake size={15} className="text-rose-500" />
              คู่หูที่ร่วมงานบ่อยที่สุด (Top Co-workers)
            </h4>
            <span className="text-[10px] text-muted font-medium">งานหลัก & ผู้ช่วย</span>
          </div>

          {peerCollaborations.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              ยังไม่มีประวัติการกระจายงานร่วมกับผู้ช่วย
            </div>
          ) : (
            <div className="space-y-2">
              {peerCollaborations.map((peer) => (
                <div key={peer.peerId} className="bg-surface p-2.5 rounded-xl border border-surface-border shadow-2xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {peer.peerName}
                    </div>
                    <div className="text-[10px] text-muted capitalize">
                      {peer.peerUnit} Unit
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 shadow-2xs ${
                      peer.roleType === 'peer_assisted'
                        ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
                        : peer.roleType === 'i_assisted'
                        ? 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                    }`}>
                      {peer.roleType === 'peer_assisted' ? (
                        <Users size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : peer.roleType === 'i_assisted' ? (
                        <Briefcase size={11} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      ) : (
                        <HeartHandshake size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span>{peer.roleDescription}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
