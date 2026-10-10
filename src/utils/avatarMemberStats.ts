// src/utils/avatarMemberStats.ts
// Helper service to calculate compact member workload, financials, and positive superpower persona titles

import { createClient } from "@/utils/supabase/client";
import { isCcPmProject } from "@/utils/stats";

export interface CompactMemberStats {
  name: string;
  total: number;       // ปริมาณงานทั้งหมด (pending + inProgress + completed)
  pending: number;     // ปริมาณงานรอทำ
  inProgress: number;  // ปริมาณงานกำลังทำ
  completed: number;   // ปริมาณงานที่ทำเสร็จแล้ว
  saveCost: number;    // Save Cost ทั้งหมด (บาท)
  profit: number;      // กำไรเงินจากโครงการ (บาท)
  assistantCount: number; // งานที่ร่วมช่วย
  satisfactionScore: number; // คะแนนแบบประเมินความพึงพอใจเฉลี่ย (ถ้าไม่มีให้เป็น 0)
  satisfactionCount: number; // จำนวนงานที่ได้รับการประเมินความพึงพอใจ
}

export interface MemberPersona {
  title: string;       // ฉายา/นิยามพลังบวก เช่น "ตัวแบกงานทีม", "ผู้ช่วยงานใจดี", "คนขยันหาเงิน"
  badgeColor: string;  // สีของ badge
  tagline: string;     // คำอธิบายสั้นๆ ให้กำลังใจ
}

// Default uplifting personas per member
const DEFAULT_PERSONAS: Record<string, { title: string; tagline: string }> = {
  "โอ๊ต CNB": { title: "คนขยันหาเงิน 💰", tagline: "มือสร้างรายได้และโปรดักชันตัวท็อป" },
  "ตั๋ม TTY": { title: "ผู้ช่วยงานใจดี 💖", tagline: "พลังซัพพอร์ตใจดีประจำทีม" },
  "ต้า TTY": { title: "ผู้ช่วยงานใจดี 💖", tagline: "พลังซัพพอร์ตใจดีประจำทีม" },
  "จ๊อบ AA": { title: "ตัวแบกงานทีม 🏆", tagline: "หัวหน้าทีมสายซัพพอร์ตทุกโปรเจกต์" },
  "วา WK": { title: "สุดยอดพลังขับเคลื่อน ✨", tagline: "งานไว เป๊ะ ไอเดียสดใหม่" },
  "เยียร์ LLP": { title: "เทพดีไซน์สร้างคุณค่า 🎨", tagline: "ครีเอทีฟตัวแม่ คุณภาพคับแก้ว" },
  "เอ็นจอย SLR": { title: "คนขยันส่งมอบงาน 🎯", tagline: "มุ่งมั่นส่งมอบงานตรงใจ" },
  "แก้ว KYK": { title: "มือโปรปิดจ็อบไว ⚡", tagline: "ฝีมือคุณภาพ เที่ยงตรงชัดเจน" },
  "ก้อง": { title: "จอมพลังโมชั่นไฟลุก 🔥", tagline: "กราฟิกเนียนตา ลุยทุกดราฟต์" },
  "ก้อง IK": { title: "จอมพลังโมชั่นไฟลุก 🔥", tagline: "กราฟิกเนียนตา ลุยทุกดราฟต์" },
  "นิน": { title: "ครีเอทีฟพลังบวก 🌟", tagline: "แคปชั่นเด็ด ไวรัลสะเทือนโซเชียล" },
  "นิน MTN": { title: "ครีเอทีฟพลังบวก 🌟", tagline: "แคปชั่นเด็ด ไวรัลสะเทือนโซเชียล" },
  "พิม AC": { title: "ผู้ช่วยงานใจดี 💖", tagline: "ใส่ใจทุกรายละเอียด" },
  "ลูกอิน STK": { title: "ดาวรุ่งพลังบวก 🚀", tagline: "พร้อมเรียนรู้และลุยงาน" },
};

// Aliases normalization
function getNormalizedAliases(rawName: string): string[] {
  const norm = rawName.trim();
  const aliases = [norm];

  if (norm === "ตั๋ม TTY" || norm === "ต้า TTY" || norm.includes("TTY") || norm.includes("ฐิติยา")) {
    aliases.push("ตั๋ม TTY", "ต้า TTY");
  } else if (norm === "ก้อง" || norm === "ก้อง IK" || norm.includes("อิศรา")) {
    aliases.push("ก้อง", "ก้อง IK");
  } else if (norm === "นิน" || norm === "นิน MTN" || norm.includes("มัทนิน")) {
    aliases.push("นิน", "นิน MTN");
  } else if (norm === "จ๊อบ" || norm === "จ๊อบ AA" || norm.includes("อัจชนะพงษ์")) {
    aliases.push("จ๊อบ AA", "จ๊อบ");
  } else if (norm === "วา" || norm === "วา WK" || norm.includes("วาสิตา")) {
    aliases.push("วา WK", "วา");
  }

  return Array.from(new Set(aliases));
}

// Global in-memory cache
let inMemoryStatsMap: Record<string, CompactMemberStats> = {};

export function calculatePersona(stats: CompactMemberStats, identifier: string): MemberPersona {
  const normName = identifier.trim();

  // If high profit
  if (stats.profit > 0) {
    return {
      title: "คนขยันหาเงิน 💰",
      tagline: "สร้างกำไรและรายได้ให้ทีม",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
    };
  }

  // If top completed tasks
  if (stats.completed >= 4) {
    return {
      title: "ตัวแบกงานทีม 🏆",
      tagline: "เสาหลักปิดจ็อบสำเร็จล้นหลาม",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700"
    };
  }

  // If high assistant / support role
  if (stats.assistantCount > 0 && stats.assistantCount >= stats.total / 2) {
    return {
      title: "ผู้ช่วยงานใจดี 💖",
      tagline: "น้ำใจเต็มเปี่ยม พร้อมช่วยเหลือทุกคน",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700"
    };
  }

  // If lots of in-progress tasks
  if (stats.inProgress >= 3) {
    return {
      title: "จอมพลังลุยงาน ⚡",
      tagline: "ไฟแรงกำลังขับเคลื่อนงานเต็มสูบ",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700"
    };
  }

  // If predefined for member
  for (const alias of getNormalizedAliases(normName)) {
    if (DEFAULT_PERSONAS[alias]) {
      const p = DEFAULT_PERSONAS[alias];
      return {
        title: p.title,
        tagline: p.tagline,
        badgeColor: p.title.includes("หาเงิน") 
          ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
          : p.title.includes("ตัวแบก")
          ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700"
          : p.title.includes("ผู้ช่วย")
          ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700"
          : "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700"
      };
    }
  }

  // Cheerful fallback
  return {
    title: "พลังบวกของทีม 💫",
    tagline: "ทุ่มเทสร้างสรรค์ผลงานคุณภาพ",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700"
  };
}

export function updateGlobalBriefsStatsCache(briefs: any[], assignees: any[]) {
  if (!Array.isArray(briefs) || !Array.isArray(assignees)) return;

  const map: Record<string, CompactMemberStats> = {};
  const idToName: Record<string, string> = {};
  const satisfactionScoresMap: Record<string, number[]> = {};

  assignees.forEach(a => {
    const rawName = a.name.trim();
    idToName[a.id] = rawName;
    satisfactionScoresMap[rawName] = [];
    map[rawName] = {
      name: rawName,
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      saveCost: 0,
      profit: 0,
      assistantCount: 0,
      satisfactionScore: 0,
      satisfactionCount: 0
    };
  });

  briefs.forEach(b => {
    // Ignore deleted or cancelled tasks from active workload calculation
    if (b.status === 'purged' || b.status === 'cancelled' || b.details?.is_permanently_deleted) return;

    const assigneeName = b.assignee_id ? idToName[b.assignee_id] : (b.details?.assignee_name || '');
    const sc = Number(b.details?.save_cost) || 0;
    const rev = Number(b.details?.revenue) || 0;
    const cost = Number(b.details?.cost) || 0;
    const prf = Number(b.details?.profit !== undefined ? b.details.profit : (rev - cost));
    const isPm = isCcPmProject(b);

    // Assistants list
    const assistants = (b.details?.assistants || []).filter(
      (a: any) => (a.assignee_id || a.name) && Number(a.percentage) > 0
    );
    const astTotalPct = assistants.reduce((sum: number, a: any) => sum + (Number(a.percentage) || 0), 0);
    const ownerPct = Math.max(0, 100 - astTotalPct);

    // 1. Process Owner
    if (assigneeName && map[assigneeName]) {
      const s = map[assigneeName];
      if (b.status === 'completed') s.completed++;
      else if (b.status === 'in_progress') s.inProgress++;
      else if (b.status === 'pending') s.pending++;

      s.saveCost += Math.round((sc * ownerPct) / 100);
      if (isPm && prf > 0) s.profit += Math.round((prf * ownerPct) / 100);
    }

    // 2. Process Assistants (Must increment status so total === pending + inProgress + completed!)
    assistants.forEach((ast: any) => {
      const astName = ast.assignee_id ? idToName[ast.assignee_id] : ast.name?.trim();
      if (astName && map[astName] && astName !== assigneeName) {
        const s = map[astName];
        s.assistantCount++;

        if (b.status === 'completed') s.completed++;
        else if (b.status === 'in_progress') s.inProgress++;
        else if (b.status === 'pending') s.pending++;

        const pct = Number(ast.percentage) || 0;
        s.saveCost += Math.round((sc * pct) / 100);
        if (isPm && prf > 0) s.profit += Math.round((prf * pct) / 100);
      }
    });

    // 3. Extract satisfaction score (for both owner and assistants)
    let satScore: number | null = null;
    if (b.details?.satisfaction_score !== undefined && b.details?.satisfaction_score !== null && !isNaN(Number(b.details.satisfaction_score))) {
      satScore = Number(b.details.satisfaction_score);
    } else if (b.details?.satisfaction_rate !== undefined && b.details?.satisfaction_rate !== null && !isNaN(Number(b.details.satisfaction_rate))) {
      satScore = Number((Number(b.details.satisfaction_rate) / 20).toFixed(1));
    } else if (b.details?.satisfaction_scores?.averagePercent !== undefined && !isNaN(Number(b.details.satisfaction_scores.averagePercent))) {
      satScore = Number((Number(b.details.satisfaction_scores.averagePercent) / 20).toFixed(1));
    }

    if (satScore !== null && satScore > 0) {
      const peopleInvolved = new Set<string>();
      if (assigneeName) peopleInvolved.add(assigneeName);
      assistants.forEach((ast: any) => {
        const astName = ast.assignee_id ? idToName[ast.assignee_id] : ast.name?.trim();
        if (astName) peopleInvolved.add(astName);
      });

      peopleInvolved.forEach(name => {
        if (!satisfactionScoresMap[name]) satisfactionScoresMap[name] = [];
        satisfactionScoresMap[name].push(satScore!);
      });
    }
  });

  // Calculate average satisfaction score for each member (0 if none)
  Object.keys(map).forEach(name => {
    const scores = satisfactionScoresMap[name] || [];
    if (scores.length > 0) {
      const avg = Number((scores.reduce((sum, val) => sum + val, 0) / scores.length).toFixed(1));
      map[name].satisfactionScore = avg;
      map[name].satisfactionCount = scores.length;
    } else {
      map[name].satisfactionScore = 0;
      map[name].satisfactionCount = 0;
    }
  });

  // Reconcile total: Total MUST ALWAYS mathematically equal (pending + inProgress + completed)
  Object.values(map).forEach(s => {
    s.total = s.pending + s.inProgress + s.completed;
  });

  // Populate known aliases so lookup by either "ตั๋ม TTY" or "ต้า TTY" produces identical stats
  Object.keys(map).forEach(key => {
    const stats = map[key];
    const aliases = getNormalizedAliases(key);
    aliases.forEach(alias => {
      map[alias] = { ...stats, name: alias };
    });
  });

  inMemoryStatsMap = map;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cc_member_stats_summary", JSON.stringify(map));
      window.dispatchEvent(new CustomEvent("cc_member_stats_updated", { detail: map }));
    } catch (e) {
      // Ignore storage quota
    }
  }
}

export async function fetchMemberStatsDirectly(): Promise<Record<string, CompactMemberStats>> {
  try {
    const supabase = createClient();
    const [briefsRes, assigneesRes] = await Promise.all([
      supabase.from("briefs").select("id, status, assignee_id, details").neq("status", "purged"),
      supabase.from("assignees").select("id, name").eq("is_active", true)
    ]);

    if (briefsRes.data && assigneesRes.data) {
      updateGlobalBriefsStatsCache(briefsRes.data, assigneesRes.data);
      return inMemoryStatsMap;
    }
  } catch (err) {
    console.error("Failed to fetch member stats directly:", err);
  }
  return inMemoryStatsMap;
}

export function getCachedMemberStats(identifier: string): CompactMemberStats {
  const norm = identifier.trim();
  const aliases = getNormalizedAliases(norm);

  // 1. Check in-memory map
  for (const alias of aliases) {
    if (inMemoryStatsMap[alias]) {
      return inMemoryStatsMap[alias];
    }
  }

  // 2. Try localStorage
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("cc_member_stats_summary");
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const alias of aliases) {
          if (parsed[alias]) {
            inMemoryStatsMap[alias] = parsed[alias];
            return parsed[alias];
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Fallback empty stats
  return {
    name: norm,
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    saveCost: 0,
    profit: 0,
    assistantCount: 0,
    satisfactionScore: 0,
    satisfactionCount: 0
  };
}
