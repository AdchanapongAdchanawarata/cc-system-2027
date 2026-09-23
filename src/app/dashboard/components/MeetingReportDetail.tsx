"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Users, Calendar, Clock, Plus, ChevronRight, CheckCircle2, 
  AlertCircle, ArrowRight, Mail, Send, X, Edit3, Trash2, 
  TrendingUp, ShieldAlert, Sparkles, Filter, CheckSquare, 
  Square, FileText, Check, ChevronLeft, Award, UserCheck, MessageSquare,
  BarChart3, ThumbsUp, AlertTriangle, Target, Hourglass
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_MEMBER_METADATA, parseMemberRecord } from "@/utils/memberProfile";
import ModernSelect, { ModernSelectOption } from "@/components/ModernSelect";
import ModernDatePicker from "@/components/ModernDatePicker";
import ExportDataDropdown from "./ExportDataDropdown";

// Interface definitions
export interface MeetingAgendaItem {
  id: string;
  title: string;
  category: "info" | "continuous"; // info = วาระแจ้งเพื่อทราบ, continuous = วาระต่อเนื่อง
  completed: boolean;
  notes?: string;
  assignees?: string[]; // รายชื่อผู้รับผิดชอบ (เลือกได้หลายคน)
  carriedFromMonth?: string; // e.g. "2026-10"
  carriedFromMonthName?: string; // e.g. "ตุลาคม 2026"
  originMeetingDate?: string; // วันที่สั่งการครั้งแรก เช่น "2026-10-06"
  originMeetingTitle?: string; // การประชุมที่สั่งการครั้งแรก เช่น "การประชุม CC ประจำสัปดาห์ ครั้งที่ 1/ตุลาคม 2569"
  sourceMeetingId?: string;
}

export interface MeetingTask {
  id: string;
  meetingType?: "internal" | "executive"; // "internal" = ประชุมภายในทีม | "executive" = ประชุมร่วมกับผู้บริหาร
  monthKey: string; // e.g. "2026-10", "2026-11"
  monthName: string; // e.g. "ตุลาคม 2026"
  date: string;
  title: string;
  recorder: string; // คนบันทึกการประชุม
  chair: string; // ประธานที่ประชุม
  status: "draft" | "sent"; // แบบร่าง vs ส่งบันทึกการประชุมแล้ว
  agendas: MeetingAgendaItem[];
  observations?: string; // ข้อสังเกต
  risks?: string; // ความเสี่ยงที่พบ
  solutions?: string; // แนวทางการพัฒนา/แก้ไข
  emailSentAt?: string;
  emailRecipientCount?: number;
  isoLinked?: boolean; // เชื่อมโยงกับระบบ ISO 9001 (Tab 5)
}

// Initial 12 months starting from October 2026
const INITIAL_MONTHS: { key: string; name: string }[] = [
  { key: "2026-10", name: "ตุลาคม 2026" },
  { key: "2026-11", name: "พฤศจิกายน 2026" },
  { key: "2026-12", name: "ธันวาคม 2026" },
  { key: "2027-01", name: "มกราคม 2027" },
  { key: "2027-02", name: "กุมภาพันธ์ 2027" },
  { key: "2027-03", name: "มีนาคม 2027" },
  { key: "2027-04", name: "เมษายน 2027" },
  { key: "2027-05", name: "พฤษภาคม 2027" },
  { key: "2027-06", name: "มิถุนายน 2027" },
  { key: "2027-07", name: "กรกฎาคม 2027" },
  { key: "2027-08", name: "สิงหาคม 2027" },
  { key: "2027-09", name: "กันยายน 2027" },
];

// Helper to normalize agenda title by stripping legacy and carried suffixes
export const normalizeAgendaTitle = (title: string): string => {
  return (title || "")
    .replace(/\s*\(.*?ต่อเนื่อง.*?\)/gi, "")
    .replace(/\s*\(ยกยอด.*?\)/gi, "")
    .trim();
};

// Helper to format short month label (เช่น ต.ค. 69, พ.ย. 69, ม.ค. 70)
export const formatShortMonth = (monthKey: string, fullName: string): string => {
  const shortMap: Record<string, string> = {
    "10": "ต.ค.", "11": "พ.ย.", "12": "ธ.ค.",
    "01": "ม.ค.", "02": "ก.พ.", "03": "มี.ค.",
    "04": "เม.ย.", "05": "พ.ค.", "06": "มิ.ย.",
    "07": "ก.ค.", "08": "ส.ค.", "09": "ก.ย."
  };
  const parts = (monthKey || "").split("-");
  if (parts.length === 2) {
    const year = parseInt(parts[0], 10);
    const mNum = parts[1];
    const thShort = shortMap[mNum] || parts[1];
    // Thai Buddhist Year 2-digit: 2026 -> 2569 -> '69, 2027 -> 2570 -> '70
    const beYearShort = String((year + 543) % 100);
    return `${thShort} ${beYearShort}`;
  }
  return fullName.split(" ")[0];
};

export default function MeetingReportDetail() {
  const [activeTab, setActiveTab] = useState<"tasks" | "analytics" | "performance">("tasks");
  const [months, setMonths] = useState<{ key: string; name: string }[]>(INITIAL_MONTHS);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("2026-10");
  
  // 2 Sub-Tabs Filter: ประชุมภายในทีม vs ประชุมร่วมกับผู้บริหาร
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<"all" | "internal" | "executive">("all");

  // Assignees & Executives
  const [assignees, setAssignees] = useState<any[]>([]);
  const [executives, setExecutives] = useState<any[]>([]);

  // Meetings store in LocalStorage for high responsiveness and persistence
  const [meetings, setMeetings] = useState<MeetingTask[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_meeting_tasks_v2");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // If executive meeting is missing from legacy localStorage, merge it
            const hasExec = parsed.some((m: MeetingTask) => m.meetingType === "executive" || m.id === "mtg-2026-10-exec");
            if (!hasExec) {
              return [
                ...parsed,
                {
                  id: "mtg-2026-10-exec",
                  meetingType: "executive",
                  monthKey: "2026-10",
                  monthName: "ตุลาคม 2026",
                  date: "2026-10-14",
                  title: "การประชุมร่วมกับผู้บริหารและทบทวนระบบงาน ครั้งที่ 1/ตุลาคม 2569",
                  recorder: "วา WK",
                  chair: "ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)",
                  status: "sent",
                  agendas: [
                    {
                      id: "ag-exec-1",
                      title: "รายงานผลสัมฤทธิ์ตัวชี้วัด KRI และเป้าหมายคุณภาพประจำเดือน (CSAT 92.4%, On-time 93.8%)",
                      category: "info",
                      completed: true,
                      notes: "ผู้บริหารรับทราบผลการดำเนินงานและมีมติให้รักษามาตรฐานความรวดเร็วและถูกต้อง",
                      assignees: ["จ๊อบ AA", "วา WK"]
                    },
                    {
                      id: "ag-exec-2",
                      title: "มอบนโยบายและทิศทางการสื่อสารแคมเปญใหญ่ STeP Expo 2027",
                      category: "continuous",
                      completed: false,
                      notes: "ผศ.ดร.สุริยะ กำชับให้เน้นอัตลักษณ์ CI และจัดทำสื่อประชาสัมพันธ์เชิงรุก",
                      assignees: ["ลูกอิน STK", "เอ็นจอย SLR"]
                    }
                  ],
                  observations: "การประสานงานกับผู้บริหารมีความคล่องตัวสูง ข้อสั่งการชัดเจน",
                  risks: "ภาระงานช่วงจัดอีเวนต์ใหญ่ อาจกระทบเวลาการตรวจทานงานประจำ",
                  solutions: "กระจายงานข้ามยูนิต และใช้ระบบ Ticket ดิจิทัลในการติดตามสถานะ",
                  isoLinked: true
                }
              ];
            }
            return parsed;
          }
        } catch (e) {
          console.error("Error parsing meetings:", e);
        }
      }
    }
    // Default initial seed data for October 2026
    return [
      {
        id: "mtg-2026-10-1",
        meetingType: "internal",
        monthKey: "2026-10",
        monthName: "ตุลาคม 2026",
        date: "2026-10-06",
        title: "การประชุม CC ประจำสัปดาห์ ครั้งที่ 1/ตุลาคม 2569",
        recorder: "วา WK",
        chair: "นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA)",
        status: "draft",
        agendas: [
          {
            id: "ag-1",
            title: "สรุปเป้าหมาย KR ไตรมาส 1 ประจำปีงบประมาณ 2027",
            category: "info",
            completed: true,
            notes: "รับทราบเป้าหมาย Save Cost และปริมาณงานของแต่ละยูนิต",
            assignees: ["จ๊อบ AA", "วา WK"]
          },
          {
            id: "ag-2",
            title: "เตรียมความพร้อมผลิตสื่อและ Key Visual งาน RSP Innovation Day 2027",
            category: "continuous",
            completed: false,
            notes: "มอบหมายทีม Creative ร่างแบบ Mockup 3 สไตล์ภายในศุกร์นี้",
            assignees: ["เยียร์ LLP", "พิม AC"]
          },
          {
            id: "ag-3",
            title: "ปรับปรุงกระบวนการ Kickoff Email และแบบประเมินความพึงพอใจ 5 มิติ",
            category: "continuous",
            completed: false,
            notes: "รอผลการทดสอบ API กับผู้บริหาร",
            assignees: ["จอย RL", "จ๊อบ AA"]
          }
        ],
        observations: "ทีมเริ่มมีภาระงานล้นช่วงต้นไตรมาสเนื่องจากงานอีเวนต์ใหญ่ของอุทยานฯ ชนกัน 3 งาน",
        risks: "งานผลิต Key Visual อาจเกิดความล่าช้าหากส่งมอบ Storyboard ไม่ทันวันที่ 15 ต.ค.",
        solutions: "ให้ผู้ช่วย Creative (เยียร์/พิม) เข้ามาประกบเป็นคู่หูร่วมกับ Lead Designer ทันที",
        isoLinked: false
      },
      {
        id: "mtg-2026-10-exec",
        meetingType: "executive",
        monthKey: "2026-10",
        monthName: "ตุลาคม 2026",
        date: "2026-10-14",
        title: "การประชุมร่วมกับผู้บริหารและทบทวนระบบงาน ครั้งที่ 1/ตุลาคม 2569",
        recorder: "วา WK",
        chair: "ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)",
        status: "sent",
        agendas: [
          {
            id: "ag-exec-1",
            title: "รายงานผลสัมฤทธิ์ตัวชี้วัด KRI และเป้าหมายคุณภาพประจำเดือน (CSAT 92.4%, On-time 93.8%)",
            category: "info",
            completed: true,
            notes: "ผู้บริหารรับทราบผลการดำเนินงานและมีมติให้รักษามาตรฐานความรวดเร็วและถูกต้อง",
            assignees: ["จ๊อบ AA", "วา WK"]
          },
          {
            id: "ag-exec-2",
            title: "มอบนโยบายและทิศทางการสื่อสารแคมเปญใหญ่ STeP Expo 2027",
            category: "continuous",
            completed: false,
            notes: "ผศ.ดร.สุริยะ กำชับให้เน้นอัตลักษณ์ CI และจัดทำสื่อประชาสัมพันธ์เชิงรุก",
            assignees: ["ลูกอิน STK", "เอ็นจอย SLR"]
          }
        ],
        observations: "การประสานงานกับผู้บริหารมีความคล่องตัวสูง ข้อสั่งการชัดเจน",
        risks: "ภาระงานช่วงจัดอีเวนต์ใหญ่ อาจกระทบเวลาการตรวจทานงานประจำ",
        solutions: "กระจายงานข้ามยูนิต และใช้ระบบ Ticket ดิจิทัลในการติดตามสถานะ",
        isoLinked: true
      }
    ];
  });

  // Save meetings whenever changed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_meeting_tasks_v2", JSON.stringify(meetings));
    }
  }, [meetings]);

  // Load assignees & executives from Supabase
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("assignees").select("*").eq("is_active", true);
        if (data && data.length > 0) {
          const ops = data.filter(a => !(a.unit || "").includes("|executive"));
          const execs = data.filter(a => (a.unit || "").includes("|executive")).map(parseMemberRecord);
          setAssignees(ops);
          setExecutives(execs);
        } else {
          // Fallback to local member profile
          const memberNames = Object.keys(DEFAULT_MEMBER_METADATA);
          setAssignees(memberNames.map(name => ({
            id: name,
            name,
            fullName: DEFAULT_MEMBER_METADATA[name].fullName,
            email: `${name.toLowerCase().replace(/\s+/g, '')}@step.cmu.ac.th`
          })));
          setExecutives([
            { name: "ผศ.ดร.เกษมศักดิ์ อุทัยชนะ", position: "รองผู้อำนวยการ STeP", email: "kasemsak@step.cmu.ac.th" },
            { name: "ผศ.ดร.ธัญญานุภาพ อานันทนะ", position: "ผู้อำนวยการอุทยานฯ STeP", email: "thanyanupap@step.cmu.ac.th" }
          ]);
        }
      } catch (err) {
        console.warn("Failed to fetch assignees for meeting detail:", err);
      }
    };
    loadMembers();
  }, []);

  // Continuous Agenda Auto-Sync Pipeline:
  // Automatically ensures that any uncompleted continuous agenda in month N appears in month N+1
  // with complete audit trail of origin meeting title and order date, solving the pain point of untracked delayed assignments!
  useEffect(() => {
    let hasChanges = false;
    const syncedMeetings = [...meetings];

    for (let i = 0; i < months.length - 1; i++) {
      const currentMonthKey = months[i].key;
      const nextMonth = months[i + 1];

      // Find all meetings in current month
      const monthMeetings = syncedMeetings.filter(m => m.monthKey === currentMonthKey);

      monthMeetings.forEach(currMtg => {
        currMtg.agendas.forEach(ag => {
          if (ag.category === "continuous") {
            const rootTitle = ag.originMeetingTitle || currMtg.title;
            const rootDate = ag.originMeetingDate || currMtg.date;
            const rootMonth = ag.carriedFromMonth || currMtg.monthKey;
            const rootMonthName = ag.carriedFromMonthName || currMtg.monthName;
            const cleanTitle = normalizeAgendaTitle(ag.title);
            const canonicalId = ag.id.startsWith("carried-") ? ag.id : `carried-from-${ag.id}`;

            const nextMonthMtgIdx = syncedMeetings.findIndex(m => m.monthKey === nextMonth.key);

            if (!ag.completed) {
              // Should be present in next month
              const carriedItem: MeetingAgendaItem = {
                id: canonicalId,
                title: cleanTitle,
                category: "continuous",
                completed: false,
                notes: ag.notes || "ข้อสั่งการที่ยังไม่แล้วเสร็จ",
                assignees: ag.assignees || [],
                carriedFromMonth: rootMonth,
                carriedFromMonthName: rootMonthName,
                originMeetingDate: rootDate,
                originMeetingTitle: rootTitle,
                sourceMeetingId: currMtg.id,
              };

              if (nextMonthMtgIdx !== -1) {
                const targetMtg = syncedMeetings[nextMonthMtgIdx];
                const existingIdx = targetMtg.agendas.findIndex(a => 
                  a.id === canonicalId || 
                  normalizeAgendaTitle(a.title) === cleanTitle
                );
                if (existingIdx === -1) {
                  targetMtg.agendas.push(carriedItem);
                  hasChanges = true;
                } else if (
                  targetMtg.agendas[existingIdx].originMeetingTitle !== rootTitle ||
                  targetMtg.agendas[existingIdx].originMeetingDate !== rootDate
                ) {
                  targetMtg.agendas[existingIdx] = { ...targetMtg.agendas[existingIdx], originMeetingTitle: rootTitle, originMeetingDate: rootDate };
                  hasChanges = true;
                }
              } else {
                // Create draft meeting in next month
                syncedMeetings.push({
                  id: `mtg-${nextMonth.key}-${Date.now()}`,
                  monthKey: nextMonth.key,
                  monthName: nextMonth.name,
                  date: `${nextMonth.key}-07`,
                  title: `การประชุม CC ประจำเดือน (${nextMonth.name})`,
                  recorder: currMtg.recorder || "วา WK",
                  chair: currMtg.chair || "นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA)",
                  status: "draft",
                  agendas: [carriedItem],
                  observations: `ติดตามข้อสั่งการต่อเนื่องจาก ${rootMonthName} (${rootTitle})`,
                  risks: "งานค้างส่งผลกระทบต่อแผนดำเนินงานประจำเดือน",
                  solutions: "เร่งรัดผู้รับผิดชอบรายงานความคืบหน้าในการประชุมนี้"
                });
                hasChanges = true;
              }
            } else {
              // Completed in currMtg: remove if lingering as carried in next month
              if (nextMonthMtgIdx !== -1) {
                const targetMtg = syncedMeetings[nextMonthMtgIdx];
                const beforeLen = targetMtg.agendas.length;
                targetMtg.agendas = targetMtg.agendas.filter(a => 
                  !(
                    a.id === canonicalId || 
                    a.id === ag.id ||
                    (normalizeAgendaTitle(a.title) === cleanTitle && (a.carriedFromMonth === currMtg.monthKey || a.originMeetingTitle === rootTitle || !a.originMeetingTitle))
                  )
                );
                if (targetMtg.agendas.length !== beforeLen) {
                  hasChanges = true;
                }
              }
            }
          }
        });
      });
    }

    if (hasChanges) {
      setMeetings(syncedMeetings);
    }
  }, [meetings, months]);

  // Modal State for Email Draft when moving task from "Draft" -> "Sent"
  const [emailModalMeeting, setEmailModalMeeting] = useState<MeetingTask | null>(null);

  // Form State for creating new meeting in selected month
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingTask | null>(null);

  // Helper to add new Month after current ones
  const handleAddNewMonth = () => {
    const lastMonth = months[months.length - 1];
    const [yStr, mStr] = lastMonth.key.split("-");
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const newKey = `${y}-${String(m).padStart(2, "0")}`;
    const monthNamesTh = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const newName = `${monthNamesTh[m - 1]} ${y}`;
    
    setMonths(prev => [...prev, { key: newKey, name: newName }]);
    setSelectedMonthKey(newKey);
  };

  // Rule: Check uncompleted continuous agendas and carry over to subsequent month automatically
  // with exact audit trail of WHEN and WHICH meeting ordered it, solving the pain point of untracked delayed assignments!
  const handleToggleAgendaCompleted = (meetingId: string, agendaId: string) => {
    setMeetings(prev => {
      // 1. Toggle agenda in target meeting
      let toggledCompleted = false;
      let targetMeeting: MeetingTask | undefined;
      let targetAgenda: MeetingAgendaItem | undefined;

      const next = prev.map(m => {
        if (m.id !== meetingId) return m;
        targetMeeting = m;
        return {
          ...m,
          agendas: m.agendas.map(ag => {
            if (ag.id === agendaId) {
              toggledCompleted = !ag.completed;
              targetAgenda = { ...ag, completed: toggledCompleted };
              return targetAgenda;
            }
            return ag;
          })
        };
      });

      if (!targetMeeting || !targetAgenda || targetAgenda.category !== "continuous") {
        return next;
      }

      // 2. Find next month index
      const curIndex = months.findIndex(mo => mo.key === targetMeeting!.monthKey);
      if (curIndex !== -1 && curIndex < months.length - 1) {
        const nextMonth = months[curIndex + 1];
        
        // Canonical original reference (if already carried, preserve root origin; else this meeting is root)
        const rootOriginTitle = targetAgenda.originMeetingTitle || targetMeeting.title;
        const rootOriginDate = targetAgenda.originMeetingDate || targetMeeting.date;
        const rootOriginMonth = targetAgenda.carriedFromMonth || targetMeeting.monthKey;
        const rootOriginMonthName = targetAgenda.carriedFromMonthName || targetMeeting.monthName;
        const canonicalAgendaId = targetAgenda.id.startsWith("carried-") 
          ? targetAgenda.id 
          : `carried-from-${targetAgenda.id}`;

        const nextMonthMeetingIndex = next.findIndex(m => m.monthKey === nextMonth.key);

        if (!toggledCompleted) {
          // Uncompleted: MUST exist in next month's meeting!
          const carriedAgendaItem: MeetingAgendaItem = {
            id: canonicalAgendaId,
            title: targetAgenda.title.replace(/\s*\(ยกยอดต่อเนื่อง.*?\)/g, "").trim(),
            category: "continuous",
            completed: false,
            notes: targetAgenda.notes || "ข้อสั่งการที่ยังไม่แล้วเสร็จ",
            assignees: targetAgenda.assignees || [],
            carriedFromMonth: rootOriginMonth,
            carriedFromMonthName: rootOriginMonthName,
            originMeetingDate: rootOriginDate,
            originMeetingTitle: rootOriginTitle,
            sourceMeetingId: meetingId,
          };

          if (nextMonthMeetingIndex !== -1) {
            // Meeting exists in next month: update or append
            const targetMtg = next[nextMonthMeetingIndex];
            const existingIdx = targetMtg.agendas.findIndex(a => 
              a.id === canonicalAgendaId || 
              normalizeAgendaTitle(a.title) === normalizeAgendaTitle(carriedAgendaItem.title)
            );

            if (existingIdx !== -1) {
              targetMtg.agendas[existingIdx] = carriedAgendaItem;
            } else {
              targetMtg.agendas.push(carriedAgendaItem);
            }
          } else {
            // Auto-create next month's meeting draft with this carried item
            next.push({
              id: `mtg-${nextMonth.key}-${Date.now()}`,
              monthKey: nextMonth.key,
              monthName: nextMonth.name,
              date: `${nextMonth.key}-07`,
              title: `การประชุม CC ประจำเดือน (${nextMonth.name})`,
              recorder: targetMeeting.recorder || "วา WK",
              chair: targetMeeting.chair || "นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA)",
              status: "draft",
              agendas: [carriedAgendaItem],
              observations: `ติดตามข้อสั่งการต่อเนื่องจาก ${rootOriginMonthName} (${rootOriginTitle})`,
              risks: "งานค้างส่งผลกระทบต่อแผนดำเนินงานประจำเดือน",
              solutions: "เร่งรัดผู้รับผิดชอบรายงานความคืบหน้าในการประชุมนี้"
            });
          }
        } else {
          // Completed in this month: remove carried copy from next month so it doesn't linger
          if (nextMonthMeetingIndex !== -1) {
            const targetMtg = next[nextMonthMeetingIndex];
            const cleanTargetTitle = normalizeAgendaTitle(targetAgenda!.title);
            targetMtg.agendas = targetMtg.agendas.filter(a => 
              !(
                a.id === canonicalAgendaId || 
                a.id === targetAgenda!.id ||
                normalizeAgendaTitle(a.title) === cleanTargetTitle
              )
            );
          }
        }
      }

      return [...next];
    });
  };

  // Move task between columns: "draft" <-> "sent"
  const handleMoveTaskStatus = (task: MeetingTask, newStatus: "draft" | "sent") => {
    if (task.status === newStatus) return;

    if (newStatus === "sent") {
      // Trigger Email Draft modal with pre-populated fields
      setEmailModalMeeting(task);
    } else {
      // Move back to draft
      setMeetings(prev => prev.map(m => m.id === task.id ? { ...m, status: "draft" } : m));
    }
  };

  // Complete sending email & mark as sent
  const handleConfirmSendEmail = (emailData: { toList: string[]; ccList: string[]; subject: string; body: string }) => {
    if (!emailModalMeeting) return;

    setMeetings(prev => prev.map(m => {
      if (m.id !== emailModalMeeting.id) return m;
      return {
        ...m,
        status: "sent",
        emailSentAt: new Date().toISOString(),
        emailRecipientCount: (emailData.toList.length + emailData.ccList.length)
      };
    }));

    // Trigger toast or console
    alert(`✉️ จัดส่งบันทึกการประชุมเรียบร้อยแล้ว!\nเรื่อง: ${emailData.subject}\nส่งถึง: ${emailData.toList.join(", ")}\nCC: ${emailData.ccList.join(", ")}`);
    setEmailModalMeeting(null);
  };

  // Delete Meeting Task
  const handleDeleteMeeting = (id: string) => {
    if (confirm("ต้องการลบรายการบันทึกการประชุมนี้ใช่หรือไม่?")) {
      setMeetings(prev => prev.filter(m => m.id !== id));
    }
  };

  // Filter meetings by selected month and sub-tab filter
  const currentMonthMeetings = useMemo(() => {
    return meetings.filter(m => {
      if (m.monthKey !== selectedMonthKey) return false;
      if (meetingTypeFilter === "internal") return m.meetingType !== "executive";
      if (meetingTypeFilter === "executive") return m.meetingType === "executive";
      return true;
    });
  }, [meetings, selectedMonthKey, meetingTypeFilter]);

  const currentMonthInternalCount = useMemo(() => {
    return meetings.filter(m => m.monthKey === selectedMonthKey && m.meetingType !== "executive").length;
  }, [meetings, selectedMonthKey]);

  const currentMonthExecutiveCount = useMemo(() => {
    return meetings.filter(m => m.monthKey === selectedMonthKey && m.meetingType === "executive").length;
  }, [meetings, selectedMonthKey]);

  const draftMeetings = useMemo(() => currentMonthMeetings.filter(m => m.status === "draft"), [currentMonthMeetings]);
  const sentMeetings = useMemo(() => currentMonthMeetings.filter(m => m.status === "sent"), [currentMonthMeetings]);

  return (
    <div className="space-y-6 w-full animate-premium-fade">
      {/* Top Tab Navigation: Full-width evenly distributed */}
      <div className="w-full space-y-3 border-b border-slate-200 pb-3">
        <div className="w-full flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 justify-center px-3 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "tasks"
                ? "bg-[#E03131] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <Calendar size={15} />
            <span>1. บันทึกการประชุม 12 เดือน</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 justify-center px-3 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "analytics"
                ? "bg-[#E03131] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <TrendingUp size={15} />
            <span>2. วิเคราะห์ &amp; ข้อสังเกต</span>
          </button>

          <button
            onClick={() => setActiveTab("performance")}
            className={`flex-1 justify-center px-3 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "performance"
                ? "bg-[#E03131] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            <Award size={15} />
            <span>3. ความรับผิดชอบ &amp; Performance</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 12-Month Meeting Tasks & 2-Column Kanban Workflow                   */}
      {/* ========================================================================= */}
      {activeTab === "tasks" && (
        <div className="space-y-5">
          {/* 2 Sub-Tabs Selector: ประชุมภายในทีม vs ประชุมร่วมกับผู้บริหาร & Link to ISO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setMeetingTypeFilter("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  meetingTypeFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <span>ทั้งหมด</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  meetingTypeFilter === "all" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {meetings.filter(m => m.monthKey === selectedMonthKey).length}
                </span>
              </button>

              <button
                onClick={() => setMeetingTypeFilter("internal")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  meetingTypeFilter === "internal"
                    ? "bg-[#E03131] text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <Users size={13} />
                <span>1. ประชุมภายในทีม CC</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  meetingTypeFilter === "internal" ? "bg-[#b02525] text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {currentMonthInternalCount}
                </span>
              </button>

              <button
                onClick={() => setMeetingTypeFilter("executive")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  meetingTypeFilter === "executive"
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <Award size={13} />
                <span>2. ประชุมร่วมกับผู้บริหาร STeP</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  meetingTypeFilter === "executive" ? "bg-indigo-800 text-white" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {currentMonthExecutiveCount}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ExportDataDropdown
                reportId="meeting"
                reportTitle="รายงานการประชุม (Meeting & Minutes)"
                buttonText="Export Data"
              />
              <a
                href="/dashboard?view=data-reports&report=iso&tab=requirements-evidence"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-[#E03131] border border-red-200 text-xs font-bold transition-all shadow-2xs group"
                title="คลิกเพื่อไปที่รายงาน ISO 9001 หมวดข้อกำหนดและหลักฐาน (Tab 6)"
              >
                <Sparkles size={14} className="text-[#E03131] animate-pulse" />
                <span>ข้อกำหนด ISO 9001 (Tab 6)</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Month Selector Bar with Add Month Button */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-orange-600" />
                เลือกรอบการประชุมประจำเดือน (เริ่ม ต.ค. 2026 เป็นต้นไป)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNewMonth}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-full text-[11.5px] font-semibold text-slate-700 transition-all cursor-pointer"
                  title="กดเพิ่มเดือนถัดไปได้เรื่อยๆ"
                >
                  <Plus size={12} />
                  <span>เพิ่มเดือนถัดไป</span>
                </button>
                <button
                  onClick={() => {
                    setEditingMeeting(null);
                    setIsNewMeetingModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3.5 py-1 bg-[#E03131] hover:bg-[#c92a2a] text-white rounded-full text-[11.5px] font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>+ สร้างวาระการประชุมใหม่</span>
                </button>
              </div>
            </div>

            {/* Month Badges - Clean evenly distributed grid without horizontal scrollbar */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
              {months.map((m) => {
                const isSelected = m.key === selectedMonthKey;
                const count = meetings.filter(item => item.monthKey === m.key).length;
                const shortLabel = formatShortMonth(m.key, m.name);

                return (
                  <button
                    key={m.key}
                    onClick={() => setSelectedMonthKey(m.key)}
                    title={m.name}
                    className={`w-full py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                    }`}
                  >
                    <span>{shortLabel}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                        isSelected ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-700"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Kanban Workflow: [แบบร่าง (Draft)] <---> [ส่งบันทึกการประชุม (Sent)] */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Column 1: แบบร่าง (Draft) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h4 className="text-sm font-black text-slate-900">
                    แบบร่างการประชุม (Draft)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                    {draftMeetings.length} รายการ
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-light">
                  เตรียมวาระและผู้จดบันทึก
                </span>
              </div>

              {draftMeetings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-xl">
                  <FileText size={28} className="mx-auto text-slate-300" />
                  <p className="text-xs">ยังไม่มีบันทึกการประชุมแบบร่างในเดือนนี้</p>
                  <button
                    onClick={() => {
                      setEditingMeeting(null);
                      setIsNewMeetingModalOpen(true);
                    }}
                    className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
                  >
                    + สร้างวาระการประชุมประจำเดือน {months.find(m => m.key === selectedMonthKey)?.name}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftMeetings.map(meeting => (
                    <MeetingCard 
                      key={meeting.id}
                      meeting={meeting}
                      onToggleAgenda={handleToggleAgendaCompleted}
                      onMoveStatus={() => handleMoveTaskStatus(meeting, "sent")}
                      onEdit={() => {
                        setEditingMeeting(meeting);
                        setIsNewMeetingModalOpen(true);
                      }}
                      onDelete={() => handleDeleteMeeting(meeting.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: ส่งบันทึกการประชุมแล้ว (Sent) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h4 className="text-sm font-black text-slate-900">
                    ส่งบันทึกการประชุมแล้ว (Sent to Team &amp; Executives)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    {sentMeetings.length} รายการ
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-light">
                  ส่งอีเมลและรับรองมติ
                </span>
              </div>

              {sentMeetings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-xl">
                  <CheckCircle2 size={28} className="mx-auto text-slate-300" />
                  <p className="text-xs">ยังไม่มีการส่งบันทึกการประชุมในเดือนนี้</p>
                  <p className="text-[11px] text-slate-400">
                    ย้ายงานจากคอลัมน์แบบร่างเพื่อส่งอีเมลถึงทีมและผู้บริหาร
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentMeetings.map(meeting => (
                    <MeetingCard 
                      key={meeting.id}
                      meeting={meeting}
                      onToggleAgenda={handleToggleAgendaCompleted}
                      onMoveStatus={() => handleMoveTaskStatus(meeting, "draft")}
                      onEdit={() => {
                        setEditingMeeting(meeting);
                        setIsNewMeetingModalOpen(true);
                      }}
                      onDelete={() => handleDeleteMeeting(meeting.id)}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Analytics, Observations, Risks & Solutions Filtered by Q / M / Y   */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <MeetingAnalyticsView meetings={meetings} months={months} />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Accountability & Performance Tracking by Assignee / Team           */}
      {/* ========================================================================= */}
      {activeTab === "performance" && (
        <MeetingPerformanceView meetings={meetings} months={months} assignees={assignees} />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Email Dispatch Modal for Meeting Records                         */}
      {/* ========================================================================= */}
      {emailModalMeeting && (
        <MeetingEmailModal 
          meeting={emailModalMeeting}
          assignees={assignees}
          executives={executives}
          onConfirm={handleConfirmSendEmail}
          onClose={() => setEmailModalMeeting(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Create / Edit Meeting Task Form                                  */}
      {/* ========================================================================= */}
      {isNewMeetingModalOpen && (
        <CreateEditMeetingModal 
          monthKey={selectedMonthKey}
          monthName={months.find(m => m.key === selectedMonthKey)?.name || selectedMonthKey}
          assignees={assignees}
          initialMeeting={editingMeeting}
          onSave={(savedMeeting) => {
            setMeetings(prev => {
              const idx = prev.findIndex(m => m.id === savedMeeting.id);
              if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = savedMeeting;
                return copy;
              }
              return [savedMeeting, ...prev];
            });
            setIsNewMeetingModalOpen(false);
            setEditingMeeting(null);
          }}
          onClose={() => {
            setIsNewMeetingModalOpen(false);
            setEditingMeeting(null);
          }}
        />
      )}

    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: Meeting Card (Renders inside the 2 columns)
// =============================================================================
function MeetingCard({
  meeting,
  onToggleAgenda,
  onMoveStatus,
  onEdit,
  onDelete
}: {
  meeting: MeetingTask;
  onToggleAgenda: (meetingId: string, agendaId: string) => void;
  onMoveStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isSent = meeting.status === "sent";

  return (
    <div className={`p-4 rounded-2xl bg-white border transition-all duration-200 shadow-2xs hover:shadow-md ${
      isSent ? "border-emerald-200 hover:border-emerald-300" : "border-slate-200 hover:border-amber-300"
    }`}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {meeting.meetingType === "executive" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10.5px] font-bold border border-indigo-200">
                <Award size={11} className="text-indigo-600" />
                ประชุมร่วมกับผู้บริหาร
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px] font-bold border border-slate-200">
                <Users size={11} className="text-slate-500" />
                ประชุมภายในทีม CC
              </span>
            )}

            {(meeting.isoLinked || meeting.meetingType === "executive") && (
              <a
                href="/dashboard?view=data-reports&report=iso&tab=requirements-evidence"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10.5px] font-bold border border-purple-200 transition-colors"
                title="คลิกเพื่อเปิดรายงานข้อกำหนด ISO 9001 Tab 6"
              >
                <Sparkles size={10} className="text-purple-600" />
                <span>ISO 9001 Linked ➔</span>
              </a>
            )}

            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 ml-1">
              <Calendar size={12} className="text-slate-400" />
              {meeting.date}
            </span>
            <span className="text-[11px] text-slate-400">•</span>
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <UserCheck size={12} className="text-orange-600" />
              ผู้จด: <span className="text-slate-900 font-bold">{meeting.recorder || "ไม่ระบุ"}</span>
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 leading-snug">
            {meeting.title}
          </h4>
          {meeting.chair && (
            <p className="text-[11px] text-slate-500">
              ประธาน: <span className="font-semibold text-slate-700">{meeting.chair}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title="แก้ไขข้อมูล"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
            title="ลบรายการ"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Agendas list */}
      <div className="space-y-2 mt-3 pt-2.5 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          วาระการประชุม &amp; ข้อสั่งการ ({meeting.agendas.length} วาระ):
        </p>

        <div className="space-y-1.5">
          {meeting.agendas.map((ag) => (
            <div 
              key={ag.id}
              className={`p-2 rounded-xl text-xs transition-all border ${
                ag.completed 
                  ? "bg-slate-50/80 border-slate-200 text-slate-400 line-through" 
                  : ag.category === "continuous"
                    ? "bg-orange-50/50 border-orange-200 text-slate-800 font-medium"
                    : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => onToggleAgenda(meeting.id, ag.id)}
                  className="mt-0.5 text-slate-400 hover:text-orange-600 cursor-pointer shrink-0 transition-colors"
                >
                  {ag.completed ? (
                    <CheckSquare size={14} className="text-emerald-600" />
                  ) : (
                    <Square size={14} className="text-slate-400" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      ag.category === "continuous" 
                        ? "bg-orange-100 text-orange-800 border border-orange-300/60" 
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}>
                      {ag.category === "continuous" ? "วาระต่อเนื่อง" : "แจ้งเพื่อทราบ"}
                    </span>
                    <span className={ag.completed ? "line-through text-slate-400" : "text-slate-900"}>
                      {ag.title}
                    </span>
                  </div>
                  {ag.notes && (
                    <p className={`text-[11px] mt-0.5 font-light ${ag.completed ? "text-slate-400" : "text-slate-500"}`}>
                      • {ag.notes}
                    </p>
                  )}
                  {ag.assignees && ag.assignees.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1">
                        <Users size={11} className="text-[#f97316]" /> ผู้รับผิดชอบ:
                      </span>
                      {ag.assignees.map((name) => (
                        <span 
                          key={name}
                          className="px-2 py-0.2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10.5px]"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  {ag.carriedFromMonth && (
                    <div className="mt-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200/90 text-[11px] text-amber-950 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span>📌 ข้อสั่งการค้างจาก:</span>
                        <span className="underline decoration-amber-400">
                          {ag.originMeetingTitle || `การประชุมประจำเดือน ${ag.carriedFromMonthName || ag.carriedFromMonth}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-amber-800 font-medium">
                        <span>สั่งการเมื่อวันที่: <strong className="text-slate-900">{ag.originMeetingDate || ag.carriedFromMonth}</strong></span>
                        {ag.originMeetingDate && (() => {
                          const originT = new Date(ag.originMeetingDate).getTime();
                          const nowT = Date.now();
                          const diffDays = Math.max(0, Math.floor((nowT - originT) / (1000 * 60 * 60 * 24)));
                          return diffDays > 0 ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300">
                              ⚠️ ค้างมาแล้ว {diffDays} วัน
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observations & Risks Snippet if present */}
      {(meeting.observations || meeting.risks) && (
        <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
          {meeting.observations && (
            <p><span className="font-bold text-slate-700">ข้อสังเกต:</span> {meeting.observations}</p>
          )}
          {meeting.risks && (
            <p><span className="font-bold text-rose-600">ความเสี่ยง:</span> {meeting.risks}</p>
          )}
        </div>
      )}

      {/* Card Action Button: Move between Draft and Sent */}
      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        {isSent ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <Check size={13} /> ส่งอีเมลแล้ว ({meeting.emailRecipientCount || 0} ท่าน)
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">สถานะ: รอส่งบันทึก</span>
        )}

        <button
          onClick={onMoveStatus}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
            isSent
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              : "bg-slate-900 hover:bg-orange-600 text-white"
          }`}
        >
          {isSent ? (
            <>
              <ChevronLeft size={13} />
              <span>ย้ายกลับเป็นแบบร่าง</span>
            </>
          ) : (
            <>
              <span>ส่งบันทึกการประชุม</span>
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL: Dieter Rams Inspired Email Draft Modal (Sends to Team & Executives)
// =============================================================================
function MeetingEmailModal({
  meeting,
  assignees,
  executives,
  onConfirm,
  onClose,
}: {
  meeting: MeetingTask;
  assignees: any[];
  executives: any[];
  onConfirm: (emailData: { toList: string[]; ccList: string[]; subject: string; body: string }) => void;
  onClose: () => void;
}) {
  // Pre-fill Executive recipients
  const [selectedExecs, setSelectedExecs] = useState<string[]>(() => {
    if (executives.length > 0) {
      return executives.map(e => e.email || "executives@step.cmu.ac.th");
    }
    return ["kasemsak@step.cmu.ac.th", "thanyanupap@step.cmu.ac.th", "executives@step.cmu.ac.th"];
  });

  // Pre-fill CC Team members (ทุกคนในทีม CC ครบ 12 คน + ทีมกลาง)
  const [selectedCC, setSelectedCC] = useState<string[]>(() => {
    // 1. If assignees passed from props, map all active operational members
    if (assignees && assignees.length > 0) {
      const emailList: string[] = [];
      assignees.forEach(a => {
        const mail = a.email || `${(a.name || '').toLowerCase().replace(/\s+/g, '')}@step.cmu.ac.th`;
        if (mail && !emailList.includes(mail)) emailList.push(mail);
      });
      if (!emailList.includes("cc-team@step.cmu.ac.th")) {
        emailList.push("cc-team@step.cmu.ac.th");
      }
      return emailList;
    }

    // 2. Default fallback: all 12 official CC Team members + cc-team alias
    return [
      "adchanapong@step.cmu.ac.th", // จ๊อบ AA
      "wasita@step.cmu.ac.th",      // วา WK
      "ratiporn@step.cmu.ac.th",    // จอย RL
      "autcharaporn@step.cmu.ac.th",// พิม AC
      "lalipat@step.cmu.ac.th",     // เยียร์ LLP
      "suthiarpa@step.cmu.ac.th",   // ลูกอิน STK
      "matanin@step.cmu.ac.th",     // นิน MTN
      "chonnikarn@step.cmu.ac.th",  // โอ๊ต CNB
      "siriluk@step.cmu.ac.th",     // เอ็นจอย SLR
      "kanyakorn@step.cmu.ac.th",   // แก้ว KYK
      "thitiya@step.cmu.ac.th",     // ต้า TTY
      "itsara@step.cmu.ac.th",      // ก้อง IK
      "cc-team@step.cmu.ac.th"      // ทีมกลาง CC
    ];
  });

  const [extraTo, setExtraTo] = useState("");
  const [extraCC, setExtraCC] = useState("");
  const [subject, setSubject] = useState(`[CC TEAM • บันทึกการประชุม] ${meeting.title} (${meeting.monthName})`);
  
  // Build initial formal email body
  const [emailBody, setEmailBody] = useState(() => {
    let text = `เรียน คณะผู้บริหาร และเพื่อนร่วมทีม CC ทุกท่าน\n\n`;
    text += `เรื่อง: รายงานสรุปบันทึกการประชุม และการติดตามข้อสั่งการประจำเดือน ${meeting.monthName}\n`;
    text += `วันที่ประชุม: ${meeting.date}\n`;
    text += `ประธานในที่ประชุม: ${meeting.chair || 'นายอัจชนะพงษ์ อัจชนะวราทา'}\n`;
    text += `ผู้จดบันทึกการประชุม: ${meeting.recorder || 'นางสาววาสิตา กอบธัญกิจ'}\n\n`;
    text += `------------------------------------------------------------\n`;
    text += `1. สรุปวาระการประชุมและมติที่ประชุม\n`;
    text += `------------------------------------------------------------\n`;
    meeting.agendas.forEach((ag, idx) => {
      text += `${idx + 1}. [${ag.category === 'continuous' ? 'วาระต่อเนื่อง' : 'แจ้งเพื่อทราบ'}] ${ag.title}\n`;
      text += `   • สถานะ: ${ag.completed ? '✅ ดำเนินการแล้วเสร็จ' : '⏳ อยู่ระหว่างดำเนินการ (ยกยอดต่อเนื่อง)'}\n`;
      if (ag.assignees && ag.assignees.length > 0) {
        text += `   • ผู้รับผิดชอบหลัก: 👤 ${ag.assignees.join(', ')}\n`;
      }
      if (ag.notes) text += `   • รายละเอียด/ข้อสั่งการ: ${ag.notes}\n`;
      if (ag.carriedFromMonth) {
        text += `   • 📌 ข้อสั่งการค้างจาก: ${ag.originMeetingTitle || ag.carriedFromMonthName || ag.carriedFromMonth} (สั่งการเมื่อ: ${ag.originMeetingDate || ag.carriedFromMonth})\n`;
      }
      text += `\n`;
    });

    if (meeting.observations || meeting.risks || meeting.solutions) {
      text += `------------------------------------------------------------\n`;
      text += `2. ข้อสังเกต ความเสี่ยง และแนวทางแก้ไขเชิงปฏิบัติการ\n`;
      text += `------------------------------------------------------------\n`;
      if (meeting.observations) text += `• ข้อสังเกต: ${meeting.observations}\n`;
      if (meeting.risks) text += `• ความเสี่ยง: ${meeting.risks}\n`;
      if (meeting.solutions) text += `• แนวทางพัฒนา/แก้ไข: ${meeting.solutions}\n`;
      text += `\n`;
    }

    text += `ทั้งนี้ ท่านสามารถเปิดดูรายละเอียดและอัปเดตงานต่อเนื่องได้ทางระบบ CC Insights\n\n`;
    text += `ขอแสดงความนับถือ,\n`;
    text += `${meeting.recorder || 'ทีมงานสร้างสรรค์และการสื่อสาร (CC TEAM)'}\n`;
    text += `อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)`;
    return text;
  });

  const handleAddExtraRecipient = () => {
    if (!extraTo.trim()) return;
    const email = extraTo.trim();
    if (!selectedExecs.includes(email)) {
      setSelectedExecs(prev => [...prev, email]);
      setExtraTo("");
    }
  };

  const handleAddExtraCC = () => {
    if (!extraCC.trim()) return;
    const email = extraCC.trim();
    if (!selectedCC.includes(email)) {
      setSelectedCC(prev => [...prev, email]);
      setExtraCC("");
    }
  };

  const handleRemoveExec = (email: string) => {
    setSelectedExecs(prev => prev.filter(e => e !== email));
  };

  const handleRemoveCC = (email: string) => {
    setSelectedCC(prev => prev.filter(c => c !== email));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Dieter Rams Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316]">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                ร่างอีเมลส่งบันทึกการประชุม (Meeting Report Dispatch)
              </h3>
              <p className="text-xs text-zinc-400">
                ส่งตรงถึงคณะผู้บริหาร และ CC สมาชิกทีมงานทุกคน ({selectedCC.length} ท่าน)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-zinc-300">
          
          {/* TO: Executive Leaders */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f97316]" />
              ผู้รับหลัก (To: คณะผู้บริหาร &amp; ผู้อำนวยการ)
            </label>
            
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950/80 rounded-xl border border-zinc-800 min-h-[38px] items-center">
              {selectedExecs.map((email) => (
                <span 
                  key={email}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-200 text-xs border border-zinc-700"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExec(email)}
                    className="text-zinc-400 hover:text-rose-400 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                <input
                  type="email"
                  placeholder="พิมพ์อีเมลเพิ่มผู้บริหาร..."
                  value={extraTo}
                  onChange={(e) => setExtraTo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExtraRecipient();
                    }
                  }}
                  className="w-full bg-transparent px-2 py-0.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddExtraRecipient}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] cursor-pointer"
                >
                  + เพิ่ม
                </button>
              </div>
            </div>
          </div>

          {/* CC: Team Members (Everyone in CC Team) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                สำเนาถึง (CC: ทุกคนในทีม CC ครบทุกคน • {selectedCC.length} ท่าน)
              </label>
            </div>
            
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 min-h-[44px] items-center max-h-[160px] overflow-y-auto scrollbar-thin">
              {selectedCC.map((email) => (
                <span 
                  key={email}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/90 text-zinc-200 text-[11px] border border-zinc-700 hover:border-orange-500/50 transition-colors"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCC(email)}
                    className="text-zinc-400 hover:text-rose-400 ml-0.5 cursor-pointer font-bold"
                    title="ลบอีเมลนี้"
                  >
                    ×
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1 min-w-[200px] flex-1">
                <input
                  type="email"
                  placeholder="พิมพ์อีเมลเพิ่มสำเนา..."
                  value={extraCC}
                  onChange={(e) => setExtraCC(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExtraCC();
                    }
                  }}
                  className="w-full bg-transparent px-2 py-0.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddExtraCC}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] cursor-pointer"
                >
                  + เพิ่ม
                </button>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              หัวข้ออีเมล (Subject)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-medium focus:outline-none focus:border-[#f97316]"
            />
          </div>

          {/* Email Body Content */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              เนื้อหารายงานการประชุม (สามารถแก้ไขเพิ่มเติมได้)
            </label>
            <textarea
              rows={10}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#f97316] resize-y"
            />
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={() => onConfirm({
              toList: selectedExecs,
              ccList: selectedCC,
              subject,
              body: emailBody
            })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-lg shadow-orange-900/30 transition-all cursor-pointer"
          >
            <Send size={14} />
            <span>ยืนยันส่งบันทึกการประชุม</span>
          </button>
        </div>

      </div>
    </div>
  );
}

// =============================================================================
// MODAL: Create / Edit Meeting Task Form
// =============================================================================
function CreateEditMeetingModal({
  monthKey,
  monthName,
  assignees,
  initialMeeting,
  onSave,
  onClose,
}: {
  monthKey: string;
  monthName: string;
  assignees: any[];
  initialMeeting: MeetingTask | null;
  onSave: (meeting: MeetingTask) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initialMeeting?.title || `การประชุม CC ประจำสัปดาห์ (${monthName})`);
  const [date, setDate] = useState(initialMeeting?.date || `${monthKey}-07`);
  const [recorder, setRecorder] = useState(initialMeeting?.recorder || "วา WK");
  const [chair, setChair] = useState(initialMeeting?.chair || "นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA)");
  const [meetingType, setMeetingType] = useState<"internal" | "executive">(initialMeeting?.meetingType || "internal");
  const [isoLinked, setIsoLinked] = useState<boolean>(initialMeeting?.isoLinked ?? (initialMeeting?.meetingType === "executive"));
  
  const handleSelectMeetingType = (type: "internal" | "executive") => {
    setMeetingType(type);
    if (type === "executive") {
      setIsoLinked(true);
      if (!initialMeeting) {
        setTitle(`การประชุมร่วมกับผู้บริหารและทบทวนระบบงาน (${monthName})`);
        setChair("ผศ.ดร.สุริยะ ทองมุณี (รองผู้อำนวยการ)");
      }
    } else {
      if (!initialMeeting) {
        setTitle(`การประชุม CC ประจำสัปดาห์ (${monthName})`);
        setChair("นายอัจชนะพงษ์ อัจชนะวราทา (จ๊อบ AA)");
      }
    }
  };

  // Agendas
  const [agendas, setAgendas] = useState<MeetingAgendaItem[]>(() => {
    if (initialMeeting?.agendas && initialMeeting.agendas.length > 0) {
      return initialMeeting.agendas;
    }
    return [
      {
        id: `ag-${Date.now()}-1`,
        title: "สรุปวาระแจ้งเพื่อทราบประจำสัปดาห์",
        category: "info",
        completed: false,
        notes: ""
      },
      {
        id: `ag-${Date.now()}-2`,
        title: "ติดตามความคืบหน้างานต่อเนื่องและข้อสั่งการ",
        category: "continuous",
        completed: false,
        notes: ""
      }
    ];
  });

  const [observations, setObservations] = useState(initialMeeting?.observations || "");
  const [risks, setRisks] = useState(initialMeeting?.risks || "");
  const [solutions, setSolutions] = useState(initialMeeting?.solutions || "");

  const handleAddAgenda = (cat: "info" | "continuous") => {
    setAgendas(prev => [
      ...prev,
      {
        id: `ag-${Date.now()}`,
        title: cat === "info" ? "วาระแจ้งเพื่อทราบใหม่" : "วาระงานต่อเนื่องใหม่",
        category: cat,
        completed: false,
        notes: ""
      }
    ]);
  };

  const handleRemoveAgenda = (id: string) => {
    setAgendas(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateAgendaTitle = (id: string, newTitle: string) => {
    setAgendas(prev => prev.map(a => a.id === id ? { ...a, title: newTitle } : a));
  };

  const handleUpdateAgendaNotes = (id: string, newNotes: string) => {
    setAgendas(prev => prev.map(a => a.id === id ? { ...a, notes: newNotes } : a));
  };

  const handleToggleAgendaAssignee = (agendaId: string, memberName: string) => {
    setAgendas(prev => prev.map(a => {
      if (a.id !== agendaId) return a;
      const currentList = a.assignees || [];
      const exists = currentList.includes(memberName);
      const nextList = exists 
        ? currentList.filter(name => name !== memberName)
        : [...currentList, memberName];
      return { ...a, assignees: nextList };
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("กรุณากรอกหัวข้อการประชุม");
      return;
    }

    const meetingToSave: MeetingTask = {
      id: initialMeeting?.id || `mtg-${monthKey}-${Date.now()}`,
      meetingType,
      monthKey,
      monthName,
      date,
      title: title.trim(),
      recorder,
      chair,
      status: initialMeeting?.status || "draft",
      agendas,
      observations: observations.trim(),
      risks: risks.trim(),
      solutions: solutions.trim(),
      emailSentAt: initialMeeting?.emailSentAt,
      emailRecipientCount: initialMeeting?.emailRecipientCount,
      isoLinked: meetingType === "executive" ? true : isoLinked,
    };

    onSave(meetingToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fcfcfd] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden font-sans">
        
        {/* Dieter Rams Skeuomorphic Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white/95 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#f97316] shadow-xs">
              <Calendar size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {initialMeeting ? "แก้ไขบันทึกการประชุม" : "สร้างวาระการประชุมประจำเดือน"}
                </h3>
              </div>
              <p className="text-[11.5px] text-slate-500 font-light mt-0.5">
                รอบประจำเดือน: <span className="font-semibold text-slate-800">{monthName}</span> • ระบบจัดการวาระและมติ CC
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Form Body with Rams Segmented Layout */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          
          {/* Section 1: ข้อมูลพื้นฐานการประชุม (General Meeting Info) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  ข้อมูลการประชุม
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">General Information</span>
            </div>

            {/* Meeting Type Toggle */}
            <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">ประเภทการประชุม (Meeting Type) *</label>
                {meetingType === "executive" && (
                  <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                    <Sparkles size={11} />
                    เชื่อมโยงกับข้อกำหนด ISO 9001 (ข้อ 9.3) อัตโนมัติ
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectMeetingType("internal")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    meetingType === "internal"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Users size={14} />
                  <span>1. ประชุมภายในทีม CC</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMeetingType("executive")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    meetingType === "executive"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Award size={14} />
                  <span>2. ประชุมร่วมกับผู้บริหาร STeP</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อการประชุม *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น การประชุม CC ประจำสัปดาห์ ครั้งที่ 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">วันที่ประชุม *</label>
                <ModernDatePicker
                  value={date}
                  onChange={(val) => setDate(val)}
                  placeholder="เลือกวันที่ประชุม..."
                  required={true}
                  className="w-full h-[42px] px-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-full font-semibold text-slate-900 text-xs shadow-2xs focus:border-[#f97316] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-start">
              <div className="space-y-1.5 flex flex-col justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 h-5">
                  <UserCheck size={14} className="text-[#f97316] shrink-0" />
                  <span>ผู้จดบันทึกการประชุม (Recorder) *</span>
                </label>
                <ModernSelect
                  value={recorder}
                  onChange={(val) => setRecorder(val)}
                  options={assignees.map((a) => ({
                    value: a.name,
                    label: a.name,
                    desc: a.fullName && a.fullName !== a.name ? a.fullName : `ทีมงาน CC System • ${a.name}`
                  }))}
                  placeholder="เลือกผู้จดบันทึกการประชุม..."
                  searchPlaceholder="ค้นหาชื่อผู้จดบันทึก..."
                  searchable={true}
                  className="rounded-full bg-slate-50/70 hover:bg-white border-slate-200 py-2 px-3.5 text-xs font-bold shadow-2xs h-[42px]"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 h-5">
                  <Users size={14} className="text-slate-400 shrink-0" />
                  <span>ประธานที่ประชุม (Chair)</span>
                </label>
                <input
                  type="text"
                  value={chair}
                  onChange={(e) => setChair(e.target.value)}
                  placeholder="ระบุประธานที่ประชุม..."
                  className="w-full h-[42px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: วาระการประชุม & มติ (Agendas) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
            {/* Header: Large, bold, orderly in Dieter Rams style */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                  2
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      วาระการประชุม &amp; มติ (Agendas)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80">
                      รวม {agendas.length} วาระ
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-normal mt-1">
                    แยกสัดส่วนชัดเจนระหว่าง <strong className="text-slate-800">วาระแจ้งเพื่อทราบ</strong> และ <strong className="text-orange-600">วาระต่อเนื่อง</strong> (ยกยอดอัตโนมัติหากยังไม่สำเร็จ)
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-section A: วาระแจ้งเพื่อทราบ (Information Agendas) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-slate-500" />
                  <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    กลุ่มวาระแจ้งเพื่อทราบ
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    {agendas.filter(a => a.category === "info").length} ข้อ
                  </span>
                </div>
                {/* Red Plus Button */}
                <button
                  type="button"
                  onClick={() => handleAddAgenda("info")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  <Plus size={15} strokeWidth={3} className="text-white" />
                  <span>เพิ่มวาระ</span>
                </button>
              </div>

              {agendas.filter(a => a.category === "info").length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-slate-400 text-xs">
                  ยังไม่มีวาระแจ้งเพื่อทราบ — คลิกปุ่ม <strong>+ เพิ่มวาระ</strong> สีแดงด้านบน
                </div>
              ) : (
                <div className="space-y-2.5">
                  {agendas.map((ag, index) => {
                    if (ag.category !== "info") return null;
                    const infoIndex = agendas.slice(0, index + 1).filter(a => a.category === "info").length;
                    return (
                      <div 
                        key={ag.id} 
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold text-[10px] uppercase tracking-wider">
                              แจ้งเพื่อทราบ #{infoIndex}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAgenda(ag.id)}
                            className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold px-2 py-0.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            ลบข้อนี้
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              เรื่อง / หัวข้อวาระ
                            </label>
                            <input
                              type="text"
                              value={ag.title}
                              onChange={(e) => handleUpdateAgendaTitle(ag.id, e.target.value)}
                              placeholder="หัวข้อวาระแจ้งเพื่อทราบ..."
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            />
                          </div>

                          {/* Multi-select Assignees in Uniform Grid */}
                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Users size={12} className="text-slate-500" />
                                <span>ผู้รับผิดชอบ / ผู้ชี้แจง (เลือกได้หลายคน):</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                เลือกแล้ว {(ag.assignees || []).length} คน
                              </span>
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 p-2 bg-slate-50/70 rounded-xl border border-slate-200">
                              {assignees.map((mem) => {
                                const isSelected = (ag.assignees || []).includes(mem.name);
                                return (
                                  <button
                                    key={mem.id || mem.name}
                                    type="button"
                                    onClick={() => handleToggleAgendaAssignee(ag.id, mem.name)}
                                    className={`w-full py-1.5 px-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center truncate ${
                                      isSelected
                                        ? "bg-slate-900 text-white shadow-2xs"
                                        : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-slate-900"
                                    }`}
                                    title={mem.name}
                                  >
                                    <span className={`text-[11px] shrink-0 ${isSelected ? "text-emerald-400 font-black" : "text-slate-400 font-bold"}`}>
                                      {isSelected ? "✓" : "+"}
                                    </span>
                                    <span className="truncate">{mem.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              สรุปเนื้อหา / ข้อชี้แจง (ถ้ามี)
                            </label>
                            <textarea
                              rows={3}
                              value={ag.notes || ""}
                              onChange={(e) => handleUpdateAgendaNotes(ag.id, e.target.value)}
                              placeholder="รายละเอียดสรุปเพื่อทราบ ข้อชี้แจง และข้อมูลประกอบการประชุม..."
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 resize-y leading-relaxed font-light"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-section B: วาระต่อเนื่อง (Continuous Agendas with Modern Minimalist Slate/Zinc Theme) */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" />
                  <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    กลุ่มวาระต่อเนื่อง &amp; ข้อสั่งการ (ยกยอดอัตโนมัติ)
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/80">
                    {agendas.filter(a => a.category === "continuous").length} ข้อ
                  </span>
                </div>
                {/* Red Plus Button */}
                <button
                  type="button"
                  onClick={() => handleAddAgenda("continuous")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  <Plus size={15} strokeWidth={3} className="text-white" />
                  <span>เพิ่มวาระ</span>
                </button>
              </div>

              {agendas.filter(a => a.category === "continuous").length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-slate-400 text-xs">
                  ยังไม่มีวาระต่อเนื่อง — คลิกปุ่ม <strong>+ เพิ่มวาระ</strong> เพื่อบันทึกงานที่จะติดตามผล
                </div>
              ) : (
                <div className="space-y-2.5">
                  {agendas.map((ag, index) => {
                    if (ag.category !== "continuous") return null;
                    const contIndex = agendas.slice(0, index + 1).filter(a => a.category === "continuous").length;
                    return (
                      <div 
                        key={ag.id} 
                        className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200/90 transition-all space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-bold text-[10px] uppercase tracking-wider">
                              วาระต่อเนื่อง #{contIndex}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <CheckSquare size={12} className="text-indigo-600" /> มีเช็กบ็อกซ์ติดตามในรายงาน (ยกยอดอัตโนมัติ)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAgenda(ag.id)}
                            className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold px-2 py-0.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            ลบข้อนี้
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                              เรื่อง / หัวข้องานต่อเนื่อง
                            </label>
                            <input
                              type="text"
                              value={ag.title}
                              onChange={(e) => handleUpdateAgendaTitle(ag.id, e.target.value)}
                              placeholder="หัวข้องานหรือข้อสั่งการต่อเนื่อง..."
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          {/* Multi-select Assignees in Uniform Grid */}
                          <div>
                            <label className="text-[10.5px] font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Users size={12} className="text-indigo-600" />
                                <span>ผู้รับผิดชอบหลัก / ข้อสั่งการถึง (เลือกได้หลายคน):</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                เลือกแล้ว {(ag.assignees || []).length} คน
                              </span>
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 p-2 bg-slate-50/70 rounded-xl border border-slate-200">
                              {assignees.map((mem) => {
                                const isSelected = (ag.assignees || []).includes(mem.name);
                                return (
                                  <button
                                    key={mem.id || mem.name}
                                    type="button"
                                    onClick={() => handleToggleAgendaAssignee(ag.id, mem.name)}
                                    className={`w-full py-1.5 px-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center truncate ${
                                      isSelected
                                        ? "bg-indigo-600 text-white shadow-2xs"
                                        : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs hover:text-slate-900"
                                    }`}
                                    title={mem.name}
                                  >
                                    <span className={`text-[11px] shrink-0 ${isSelected ? "text-white font-black" : "text-slate-400 font-bold"}`}>
                                      {isSelected ? "✓" : "+"}
                                    </span>
                                    <span className="truncate">{mem.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                              มติที่ประชุม / ข้อสั่งการ / รายละเอียดงาน
                            </label>
                            <textarea
                              rows={3}
                              value={ag.notes || ""}
                              onChange={(e) => handleUpdateAgendaNotes(ag.id, e.target.value)}
                              placeholder="ระบุมติที่ประชุม ข้อสั่งการ หรือกำหนดส่งมอบงาน..."
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-y leading-relaxed font-light"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: การวิเคราะห์ ข้อสังเกต ความเสี่ยง & แนวทางแก้ไข */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                  3
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  การวิเคราะห์ ข้อสังเกต ความเสี่ยง &amp; แนวทางแก้ไข
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Risk &amp; Strategic Solutions</span>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>ข้อสังเกตสำคัญในที่ประชุม (Observations)</span>
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="ข้อสังเกต เช่น ภาระงานเริ่มล้นช่วงต้นไตรมาส, กำลังคนในแต่ละยูนิต..."
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200/70 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-y font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-rose-500" />
                  <span>ความเสี่ยงที่ต้องระวัง (Risks)</span>
                </label>
                <textarea
                  rows={2}
                  value={risks}
                  onChange={(e) => setRisks(e.target.value)}
                  placeholder="ความเสี่ยงที่อาจทำให้งานล่าช้า เช่น ส่งไฟล์ต้นฉบับไม่ทันกำหนด หรืออุปกรณ์ขัดข้อง..."
                  className="w-full px-3.5 py-2.5 bg-rose-50/40 border border-rose-200/70 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all resize-y font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-emerald-500" />
                  <span>แนวทางการพัฒนา / แนวทางแก้ไข (Solutions)</span>
                </label>
                <textarea
                  rows={2}
                  value={solutions}
                  onChange={(e) => setSolutions(e.target.value)}
                  placeholder="แนวทางแก้ไข เช่น มอบหมายผู้ช่วยเข้าประกบ, ปรับแผนการทำงาน หรือจัดคิวสตูดิโอ..."
                  className="w-full px-3.5 py-2.5 bg-emerald-50/40 border border-emerald-200/70 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-y font-medium"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Dieter Rams Tactile Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white/95 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            ยกเลิก
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] active:scale-95 text-white text-xs font-black tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Check size={15} strokeWidth={2.5} />
            <span>บันทึกการประชุม</span>
          </button>
        </div>

      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: Tab 2 - Meeting Analytics & Action Plan View
// Filters: Quarterly (Q1-Q4), Monthly, Yearly
// =============================================================================
function MeetingAnalyticsView({
  meetings,
  months,
}: {
  meetings: MeetingTask[];
  months: { key: string; name: string }[];
}) {
  const [filterMode, setFilterMode] = useState<"quarter" | "month" | "year">("quarter");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [selectedYear, setSelectedYear] = useState<string>("2026-2027");

  // Filter meetings based on selected period
  const filteredMeetings = useMemo(() => {
    if (filterMode === "year") {
      return meetings; // Current 1-year scope (Oct 2026 - Sep 2027)
    }

    if (filterMode === "month") {
      return meetings.filter(m => m.monthKey === selectedMonth);
    }

    if (filterMode === "quarter") {
      // Q1: Oct, Nov, Dec (2026-10, 2026-11, 2026-12)
      // Q2: Jan, Feb, Mar (2027-01, 2027-02, 2027-03)
      // Q3: Apr, May, Jun (2027-04, 2027-05, 2027-06)
      // Q4: Jul, Aug, Sep (2027-07, 2027-08, 2027-09)
      const qMap: Record<string, string[]> = {
        Q1: ["2026-10", "2026-11", "2026-12"],
        Q2: ["2027-01", "2027-02", "2027-03"],
        Q3: ["2027-04", "2027-05", "2027-06"],
        Q4: ["2027-07", "2027-08", "2027-09"],
      };
      const allowed = qMap[selectedQuarter] || [];
      return meetings.filter(m => allowed.includes(m.monthKey));
    }

    return meetings;
  }, [meetings, filterMode, selectedQuarter, selectedMonth, selectedYear]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalAgendas = 0;
    let completedAgendas = 0;
    let continuousAgendas = 0;
    let continuousCompleted = 0;
    const observationList: string[] = [];
    const riskList: string[] = [];
    const solutionList: string[] = [];

    filteredMeetings.forEach(m => {
      if (m.observations) observationList.push(`[${m.monthName}] ${m.observations}`);
      if (m.risks) riskList.push(`[${m.monthName}] ${m.risks}`);
      if (m.solutions) solutionList.push(`[${m.monthName}] ${m.solutions}`);

      m.agendas.forEach(ag => {
        totalAgendas++;
        if (ag.completed) completedAgendas++;
        if (ag.category === "continuous") {
          continuousAgendas++;
          if (ag.completed) continuousCompleted++;
        }
      });
    });

    const completionRate = totalAgendas > 0 ? ((completedAgendas / totalAgendas) * 100).toFixed(1) : "100";

    return {
      meetingsCount: filteredMeetings.length,
      totalAgendas,
      completedAgendas,
      continuousAgendas,
      continuousCompleted,
      completionRate,
      observationList,
      riskList,
      solutionList,
    };
  }, [filteredMeetings]);

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Filter Toolbar: Quarter, Month, Year */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-orange-600" />
          <span className="text-xs font-bold text-slate-800">ตัวกรองการวิเคราะห์:</span>
          
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setFilterMode("quarter")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterMode === "quarter" ? "bg-[#E03131] text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              รายไตรมาส (Quarter)
            </button>
            <button
              onClick={() => setFilterMode("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterMode === "month" ? "bg-[#E03131] text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              รายเดือน (Monthly)
            </button>
            <button
              onClick={() => setFilterMode("year")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterMode === "year" ? "bg-[#E03131] text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              รายปี (Yearly)
            </button>
          </div>
        </div>

        {/* Dynamic Period Selectors */}
        <div className="flex items-center gap-2">
          {filterMode === "quarter" && (
            <div className="flex items-center gap-1.5">
              {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedQuarter === q
                      ? "bg-orange-600 text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {q} {q === "Q1" ? "(ต.ค.-ธ.ค.)" : q === "Q2" ? "(ม.ค.-มี.ค.)" : q === "Q3" ? "(เม.ย.-มิ.ย.)" : "(ก.ค.-ก.ย.)"}
                </button>
              ))}
            </div>
          )}

          {filterMode === "month" && (
            <div className="w-56">
              <ModernSelect
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
                options={months.map(m => ({
                  value: m.key,
                  label: m.name,
                  desc: `เดือนในรอบปีงบประมาณ 2027 (${m.key})`
                }))}
                placeholder="เลือกเดือน..."
                searchPlaceholder="ค้นหาเดือน..."
                searchable={true}
                className="rounded-full bg-white border-slate-200 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
              />
            </div>
          )}

          {filterMode === "year" && (
            <span className="text-xs font-bold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              ปีงบประมาณ 2027 (ตุลาคม 2026 - กันยายน 2027)
            </span>
          )}
        </div>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">การประชุมในช่วงที่เลือก</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.meetingsCount} ครั้ง</h4>
          <span className="text-[10.5px] text-blue-600 font-medium">บันทึกวาระครบถ้วน</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">อัตราสำเร็จของมติ/ข้อสั่งการ</p>
          <h4 className="text-2xl font-black text-emerald-600 mt-1">{stats.completionRate}%</h4>
          <span className="text-[10.5px] text-slate-500">{stats.completedAgendas} จาก {stats.totalAgendas} ข้อสั่งการ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">วาระต่อเนื่องที่ยังค้าง</p>
          <h4 className="text-2xl font-black text-amber-600 mt-1">
            {stats.continuousAgendas - stats.continuousCompleted} วาระ
          </h4>
          <span className="text-[10.5px] text-amber-700 font-medium">ยกยอดไปเดือนถัดไปอัตโนมัติ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ประเด็นความเสี่ยงที่พบ</p>
          <h4 className="text-2xl font-black text-rose-600 mt-1">{stats.riskList.length} ข้อ</h4>
          <span className="text-[10.5px] text-rose-600 font-medium">มีแนวทางแก้ไขรองรับแล้ว</span>
        </div>
      </div>

      {/* 3 Columns: Observations (ข้อสังเกต) | Risks (ความเสี่ยง) | Solutions (แนวทางแก้ไข) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* 1. Observations (ข้อสังเกตในที่ประชุม) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles size={16} className="text-amber-500" />
            <h4 className="text-sm font-bold text-slate-900">ข้อสังเกตสำคัญ (Observations)</h4>
          </div>
          {stats.observationList.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">ไม่มีข้อสังเกตที่บันทึกไว้ในรอบนี้</p>
          ) : (
            <div className="space-y-2">
              {stats.observationList.map((obs, i) => (
                <div key={i} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
                  {obs}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Risks (ความเสี่ยงและอุปสรรค) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldAlert size={16} className="text-rose-500" />
            <h4 className="text-sm font-bold text-slate-900">ความเสี่ยงที่ต้องระวัง (Risks)</h4>
          </div>
          {stats.riskList.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">ไม่พบความเสี่ยงวิกฤตในรอบนี้</p>
          ) : (
            <div className="space-y-2">
              {stats.riskList.map((risk, i) => (
                <div key={i} className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl text-xs text-rose-900 leading-relaxed">
                  {risk}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Solutions (แนวทางการพัฒนา & แก้ไข) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <TrendingUp size={16} className="text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-900">แนวทางพัฒนา / แก้ไข (Solutions)</h4>
          </div>
          {stats.solutionList.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">ไม่มีแนวทางแก้ไขที่บันทึกไว้ในรอบนี้</p>
          ) : (
            <div className="space-y-2">
              {stats.solutionList.map((sol, i) => (
                <div key={i} className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 leading-relaxed">
                  {sol}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: Tab 3 - Accountability & Performance Analytics View
// การติดตามความรับผิดชอบงาน & Performance รายบุคคล/ทีม (Accountability & Performance)
// =============================================================================
function MeetingPerformanceView({
  meetings,
  months,
  assignees,
}: {
  meetings: MeetingTask[];
  months: { key: string; name: string }[];
  assignees: any[];
}) {
  const [filterMode, setFilterMode] = useState<"quarter" | "month" | "year">("quarter");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [selectedYear, setSelectedYear] = useState<string>("2026-2027");
  const [activeSegment, setActiveSegment] = useState<"all" | "high" | "delayed">("all");
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);

  // Filter meetings by selected period
  const filteredMeetings = useMemo(() => {
    if (filterMode === "year") return meetings;
    if (filterMode === "month") return meetings.filter(m => m.monthKey === selectedMonth);
    if (filterMode === "quarter") {
      const qMap: Record<string, string[]> = {
        Q1: ["2026-10", "2026-11", "2026-12"],
        Q2: ["2027-01", "2027-02", "2027-03"],
        Q3: ["2027-04", "2027-05", "2027-06"],
        Q4: ["2027-07", "2027-08", "2027-09"],
      };
      const allowed = qMap[selectedQuarter] || [];
      return meetings.filter(m => allowed.includes(m.monthKey));
    }
    return meetings;
  }, [meetings, filterMode, selectedQuarter, selectedMonth, selectedYear]);

  // Normalize member name for matching
  const getCleanName = (raw: string) => {
    return (raw || "").trim();
  };

  // Compile member performance statistics
  const memberPerformanceData = useMemo(() => {
    // Collect all candidate member names from assignees list or agendas
    const memberMap: Record<
      string,
      {
        name: string;
        fullName?: string;
        totalAssigned: number;
        completedCount: number;
        pendingCount: number;
        delayedBottleneckCount: number; // งานค้างนาน/ยกยอดข้ามเดือน
        agendas: {
          id: string;
          meetingId: string;
          meetingTitle: string;
          meetingDate: string;
          agendaTitle: string;
          completed: boolean;
          notes?: string;
          isCarried: boolean;
          isDelayed?: boolean;
          originMeetingDate?: string;
          originMeetingTitle?: string;
          daysOpen: number;
        }[];
      }
    > = {};

    // Initialize with known assignees
    assignees.forEach(a => {
      const name = getCleanName(a.name || a.fullName);
      if (name && !memberMap[name]) {
        memberMap[name] = {
          name,
          fullName: a.fullName,
          totalAssigned: 0,
          completedCount: 0,
          pendingCount: 0,
          delayedBottleneckCount: 0,
          agendas: [],
        };
      }
    });

    // Traverse filtered meetings and agendas
    filteredMeetings.forEach(mtg => {
      const mtgDateObj = mtg.date ? new Date(mtg.date) : new Date();

      mtg.agendas.forEach(ag => {
        const assignedList = ag.assignees && ag.assignees.length > 0 ? ag.assignees : [];
        
        // ตรวจสอบว่ายกยอดข้ามเดือนอย่างน้อย 1 เดือนเต็มหรือไม่
        // เช่น สั่งการไว้ในเดือนก่อนหน้า (carriedFromMonth มีค่า และไม่เท่ากับรอบเดือนการประชุมปัจจุบัน)
        const isCarriedOverAtLeastOneMonth = !!(
          ag.carriedFromMonth && ag.carriedFromMonth !== mtg.monthKey
        );
        const isCarried = !!(ag.carriedFromMonth || ag.originMeetingDate);
        
        // Calculate days open (from origin meeting or current meeting)
        let daysOpen = 0;
        const startDateStr = ag.originMeetingDate || mtg.date;
        if (startDateStr) {
          const start = new Date(startDateStr);
          const diffTime = Math.abs(mtgDateObj.getTime() - start.getTime());
          daysOpen = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // เกณฑ์งานค้างนาน: กำหนดให้ต้อง "ยกยอดข้ามอย่างน้อย 1 เดือนเต็ม" เท่านั้นถึงจะนับเป็นค้างนาน
        const isDelayed = !ag.completed && isCarriedOverAtLeastOneMonth;

        assignedList.forEach(rawName => {
          const name = getCleanName(rawName);
          if (!name) return;

          if (!memberMap[name]) {
            memberMap[name] = {
              name,
              totalAssigned: 0,
              completedCount: 0,
              pendingCount: 0,
              delayedBottleneckCount: 0,
              agendas: [],
            };
          }

          const record = memberMap[name];
          record.totalAssigned += 1;
          if (ag.completed) {
            record.completedCount += 1;
          } else {
            record.pendingCount += 1;
            if (isDelayed) {
              record.delayedBottleneckCount += 1;
            }
          }

          record.agendas.push({
            id: ag.id,
            meetingId: mtg.id,
            meetingTitle: mtg.title,
            meetingDate: mtg.date,
            agendaTitle: ag.title,
            completed: ag.completed,
            notes: ag.notes,
            isCarried,
            isDelayed,
            originMeetingDate: ag.originMeetingDate,
            originMeetingTitle: ag.originMeetingTitle,
            daysOpen,
          });
        });
      });
    });

    // Calculate completion rate & performance rating
    const list = Object.values(memberMap).map(m => {
      const rate = m.totalAssigned > 0 ? Math.round((m.completedCount / m.totalAssigned) * 100) : 0;
      
      let ratingTag: "excellent" | "ontrack" | "attention" | "idle" = "idle";
      let ratingLabel = "ไม่มีงานในรอบนี้";
      let ratingColor = "bg-slate-100 text-slate-600 border-slate-200";

      if (m.totalAssigned > 0) {
        if (m.delayedBottleneckCount > 0) {
          ratingTag = "attention";
          ratingLabel = `⚠️ งานไม่คืบหน้า / ค้างนาน (${m.delayedBottleneckCount})`;
          ratingColor = "bg-rose-50 text-rose-700 border-rose-200";
        } else if (rate >= 80) {
          ratingTag = "excellent";
          ratingLabel = "⭐ จัดการตามมติดีเยี่ยม (High Performance)";
          ratingColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else {
          ratingTag = "ontrack";
          ratingLabel = "กำลังดำเนินงาน (On-track)";
          ratingColor = "bg-blue-50 text-blue-700 border-blue-200";
        }
      }

      return {
        ...m,
        rate,
        ratingTag,
        ratingLabel,
        ratingColor,
      };
    });

    // Sort: highest assigned or highest delayed bottlenecks first
    return list.sort((a, b) => {
      if (b.delayedBottleneckCount !== a.delayedBottleneckCount) {
        return b.delayedBottleneckCount - a.delayedBottleneckCount;
      }
      return b.totalAssigned - a.totalAssigned;
    });
  }, [filteredMeetings, assignees]);

  // Overall KPI metrics
  const teamMetrics = useMemo(() => {
    let totalAssigned = 0;
    let totalCompleted = 0;
    let totalDelayed = 0;
    let highPerformers = 0;
    let attentionNeeded = 0;

    memberPerformanceData.forEach(m => {
      totalAssigned += m.totalAssigned;
      totalCompleted += m.completedCount;
      totalDelayed += m.delayedBottleneckCount;
      if (m.ratingTag === "excellent") highPerformers += 1;
      if (m.ratingTag === "attention") attentionNeeded += 1;
    });

    const averageRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    return {
      totalAssigned,
      totalCompleted,
      totalDelayed,
      highPerformers,
      attentionNeeded,
      averageRate,
    };
  }, [memberPerformanceData]);

  // Filtered members by active segment
  const displayedMembers = useMemo(() => {
    if (activeSegment === "high") {
      return memberPerformanceData.filter(m => m.ratingTag === "excellent");
    }
    if (activeSegment === "delayed") {
      return memberPerformanceData.filter(m => m.ratingTag === "attention");
    }
    return memberPerformanceData;
  }, [memberPerformanceData, activeSegment]);

  // Selected member detail inspection
  const selectedMember = useMemo(() => {
    if (!selectedMemberName) return null;
    return memberPerformanceData.find(m => m.name === selectedMemberName) || null;
  }, [memberPerformanceData, selectedMemberName]);

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Header & Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-orange-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                ข้อ 3: การติดตามความรับผิดชอบงาน &amp; Performance รายบุคคล/ทีม (Accountability Analytics)
              </h3>
              <p className="text-[11.5px] text-slate-500 font-light">
                ติดตามสมาชิกที่ได้รับมอบหมายงานนานแล้วแต่งานยังไม่คืบหน้า และยกย่องผู้ที่จัดการงานตามมติได้ดีเยี่ยม
              </p>
            </div>
          </div>

          {/* Period Mode Selector (Quarter / Month / Year) */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setFilterMode("quarter")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterMode === "quarter"
                  ? "bg-[#E03131] text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              รายไตรมาส (Quarter)
            </button>
            <button
              onClick={() => setFilterMode("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterMode === "month"
                  ? "bg-[#E03131] text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              รายเดือน (Month)
            </button>
            <button
              onClick={() => setFilterMode("year")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterMode === "year"
                  ? "bg-[#E03131] text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              ภาพรวม 1 ปี (Oct 2026 - Sep 2027)
            </button>
          </div>
        </div>

        {/* Sub-Filters based on filter mode */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Filter size={12} className="text-slate-400" />
            ช่วงเวลาที่ประเมิน:
          </span>

          {filterMode === "quarter" && (
            <div className="flex items-center gap-2">
              {[
                { id: "Q1", label: "ไตรมาส 1 (ต.ค. - ธ.ค. 2026)" },
                { id: "Q2", label: "ไตรมาส 2 (ม.ค. - มี.ค. 2027)" },
                { id: "Q3", label: "ไตรมาส 3 (เม.ย. - มิ.ย. 2027)" },
                { id: "Q4", label: "ไตรมาส 4 (ก.ค. - ก.ย. 2027)" },
              ].map(q => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuarter(q.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedQuarter === q.id
                      ? "bg-orange-50 text-orange-700 border-orange-300 shadow-2xs font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {filterMode === "month" && (
            <div className="w-56">
              <ModernSelect
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
                options={months.map(m => ({
                  value: m.key,
                  label: m.name,
                  desc: `เดือนในรอบปีงบประมาณ 2027 (${m.key})`
                }))}
                placeholder="เลือกเดือน..."
                searchPlaceholder="ค้นหาเดือน..."
                searchable={true}
                className="rounded-full bg-slate-50 border-slate-200 py-1.5 px-3 text-xs font-bold text-slate-800 shadow-2xs"
              />
            </div>
          )}

          {filterMode === "year" && (
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
              ปีงบประมาณ 2026 - 2027 (ตุลาคม 2026 ถึง กันยายน 2027)
            </span>
          )}
        </div>
      </div>

      {/* 4 Summary Metric Cards (Dieter Rams Functionalist Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Team Resolution Completion Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              อัตราความรับผิดชอบทีม
            </p>
            <Target size={16} className="text-orange-600" />
          </div>
          <h4 className="text-2xl font-black text-slate-900 mt-1">
            {teamMetrics.averageRate}%
          </h4>
          <span className="text-[10.5px] text-slate-500 font-medium">
            สำเร็จ {teamMetrics.totalCompleted} จากทั้งหมด {teamMetrics.totalAssigned} งาน
          </span>
        </div>

        {/* Card 2: High Performers */}
        <div 
          onClick={() => setActiveSegment(activeSegment === "high" ? "all" : "high")}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition-all ${
            activeSegment === "high"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              จัดการงานตามมติดีเยี่ยม
            </p>
            <ThumbsUp size={16} className="text-emerald-600" />
          </div>
          <h4 className="text-2xl font-black text-emerald-700 mt-1">
            {teamMetrics.highPerformers} คน
          </h4>
          <span className="text-[10.5px] text-emerald-700 font-medium">
            ส่งมอบงานครบถ้วนตรงเวลาตามมติ CC
          </span>
        </div>

        {/* Card 3: Delayed Tasks / Bottlenecks */}
        <div 
          onClick={() => setActiveSegment(activeSegment === "delayed" ? "all" : "delayed")}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition-all ${
            activeSegment === "delayed"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20"
              : "bg-white border-slate-200 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              งานค้างนาน / ไม่คืบหน้า
            </p>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <h4 className="text-2xl font-black text-rose-700 mt-1">
            {teamMetrics.totalDelayed} วาระ
          </h4>
          <span className="text-[10.5px] text-rose-600 font-medium">
            (ยกยอดข้ามเดือน &ge; 1 เดือนเต็ม) {teamMetrics.attentionNeeded > 0 ? `พบ ${teamMetrics.attentionNeeded} คนที่ต้องเร่งรัด` : "ไม่มีงานค้างสะสม"}
          </span>
        </div>

        {/* Card 4: Accountability Health Index */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              สถานะความพร้อมทีม CC
            </p>
            <BarChart3 size={16} className="text-blue-600" />
          </div>
          <h4 className="text-2xl font-black text-blue-700 mt-1">
            {teamMetrics.attentionNeeded === 0 ? "ความพร้อมสูง" : "ต้องติดตามเร่งรัด"}
          </h4>
          <span className="text-[10.5px] text-slate-500 font-medium">
            รอบการประชุม {filteredMeetings.length} ครั้งที่บันทึก
          </span>
        </div>

      </div>

      {/* Segment Switcher Filter (All, High Performance, Requires Follow-up) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">จำแนกตามผลงาน:</span>
          <button
            onClick={() => setActiveSegment("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              activeSegment === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            ทั้งหมด ({memberPerformanceData.length})
          </button>
          <button
            onClick={() => setActiveSegment("high")}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              activeSegment === "high"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            ⭐ จัดการงานดีเยี่ยม ({teamMetrics.highPerformers})
          </button>
          <button
            onClick={() => setActiveSegment("delayed")}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              activeSegment === "delayed"
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
            }`}
          >
            ⚠️ ต้องเร่งรัดติดตาม ({teamMetrics.attentionNeeded})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-light">
          คลิกที่การ์ดสมาชิกเพื่อเปิดดูรายละเอียดงานที่ได้รับมอบหมาย
        </span>
      </div>

      {/* Main Grid: Member Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {displayedMembers.map(member => {
          const isSelected = selectedMemberName === member.name;

          return (
            <div
              key={member.name}
              onClick={() => setSelectedMemberName(isSelected ? null : member.name)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3.5 relative ${
                isSelected
                  ? "bg-white border-orange-500 shadow-md ring-2 ring-orange-500/20"
                  : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {/* Member Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {member.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-light">
                    {member.fullName || "สมาชิกทีม CC"}
                  </p>
                </div>

                {/* Status Badge */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${member.ratingColor}`}>
                  {member.ratingTag === "excellent" && "High Performer"}
                  {member.ratingTag === "attention" && "Bottleneck"}
                  {member.ratingTag === "ontrack" && "On-track"}
                  {member.ratingTag === "idle" && "No Tasks"}
                </span>
              </div>

              {/* Progress Bar & Rate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600">อัตราความสำเร็จตามมติ</span>
                  <span className="font-black text-slate-900">{member.rate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      member.ratingTag === "attention"
                        ? "bg-rose-500"
                        : member.ratingTag === "excellent"
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${member.rate}%` }}
                  />
                </div>
              </div>

              {/* 3 Metric Mini-Counters */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100 text-xs">
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-semibold">มอบหมาย</p>
                  <p className="text-xs font-black text-slate-800">{member.totalAssigned}</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/70">
                  <p className="text-[10px] text-emerald-700 font-semibold">สำเร็จ</p>
                  <p className="text-xs font-black text-emerald-800">{member.completedCount}</p>
                </div>
                <div className={`p-2 rounded-xl ${member.delayedBottleneckCount > 0 ? "bg-rose-50" : "bg-slate-50"}`}>
                  <p className={`text-[10px] font-semibold ${member.delayedBottleneckCount > 0 ? "text-rose-700" : "text-slate-400"}`}>
                    ค้างนาน
                  </p>
                  <p className={`text-xs font-black ${member.delayedBottleneckCount > 0 ? "text-rose-800" : "text-slate-800"}`}>
                    {member.delayedBottleneckCount}
                  </p>
                </div>
              </div>

              {/* Meaningful Performance Observation */}
              <div className="pt-1">
                <p className="text-[11px] leading-relaxed text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  {member.ratingTag === "attention" ? (
                    <span className="text-rose-700 font-medium">
                      ⚠️ มีงานค้างต่อเนื่องสะสม {member.delayedBottleneckCount} วาระที่ยังไม่คืบหน้า ควรตรวจสอบอุปสรรคหรือส่งผู้ช่วยสนับสนุน
                    </span>
                  ) : member.ratingTag === "excellent" ? (
                    <span className="text-emerald-700 font-medium">
                      ⭐ จัดการงานตามมติที่ประชุมได้อย่างยอดเยี่ยม ไม่มีงานค้างสะสม
                    </span>
                  ) : member.totalAssigned > 0 ? (
                    <span className="text-slate-600 font-medium">
                      กำลังดำเนินงานตามแผนงาน มีงานเปิดอยู่ {member.pendingCount} รายการ
                    </span>
                  ) : (
                    <span className="text-slate-400 font-light">ไม่มีภาระงานที่ได้รับมอบหมายในรอบเวลานี้</span>
                  )}
                </p>
              </div>

              {/* Action Hint */}
              <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1">
                <span>{isSelected ? "คลิกเพื่อซ่อนรายละเอียด" : "คลิกดูรายการวาระที่รับผิดชอบ"}</span>
                <ChevronRight size={13} className={`transition-transform ${isSelected ? "rotate-90 text-orange-600" : ""}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Member Detail Modal / Slide-down Panel */}
      {selectedMember && (
        <div className="bg-white p-6 rounded-2xl border-2 border-orange-400 shadow-md space-y-4 animate-premium-fade">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  รายงานวาระและความรับผิดชอบ: {selectedMember.name}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${selectedMember.ratingColor}`}>
                  {selectedMember.ratingLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                {selectedMember.fullName} • มอบหมายทั้งหมด {selectedMember.totalAssigned} งาน (สำเร็จ {selectedMember.completedCount} / ค้าง {selectedMember.pendingCount})
              </p>
            </div>

            <button
              onClick={() => setSelectedMemberName(null)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Agenda items breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              รายการวาระที่ได้รับมอบหมายในรอบเวลานี้:
            </h4>

            {selectedMember.agendas.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">ไม่มีรายการวาระในรอบเวลานี้</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {selectedMember.agendas.map(ag => (
                  <div
                    key={`${ag.meetingId}-${ag.id}`}
                    className={`p-3.5 rounded-xl border transition-all ${
                      ag.completed
                        ? "bg-slate-50/70 border-slate-200 text-slate-700"
                        : ag.isDelayed
                        ? "bg-rose-50/40 border-rose-200 text-rose-900"
                        : "bg-blue-50/30 border-blue-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {ag.completed ? (
                          <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        ) : ag.isDelayed ? (
                          <AlertTriangle size={16} className="text-rose-600 mt-0.5 shrink-0" />
                        ) : (
                          <Clock size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        )}

                        <div className="space-y-1">
                          <h5 className={`text-xs font-bold ${ag.completed ? "line-through text-slate-500" : "text-slate-900"}`}>
                            {ag.agendaTitle}
                          </h5>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">รอบประชุม: {ag.meetingTitle}</span>
                            <span>• วันที่: {ag.meetingDate}</span>
                            {ag.daysOpen > 0 && (
                              <span className={`font-bold ${ag.isDelayed ? "text-rose-600" : "text-slate-600"}`}>
                                (เปิดมาแล้ว {ag.daysOpen} วัน)
                              </span>
                            )}
                          </div>

                          {/* Audit trail for carried items */}
                          {ag.isCarried && (
                            <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-[10.5px] text-amber-900 space-y-0.5 mt-1.5">
                              <p className="font-bold flex items-center gap-1">
                                <Hourglass size={12} className="text-amber-600 shrink-0" />
                                <span>วาระต่อเนื่องยกยอดมาจากรอบก่อนหน้า</span>
                              </p>
                              <p className="font-light">
                                สั่งการครั้งแรกในการประชุม: <span className="font-semibold">{ag.originMeetingTitle || "รอบก่อนหน้า"}</span> วันที่: {ag.originMeetingDate || "-"}
                              </p>
                            </div>
                          )}

                          {ag.notes && (
                            <p className="text-[11px] text-slate-600 italic bg-white/80 p-2 rounded-lg border border-slate-200/70 mt-1">
                              มติ / ข้อสั่งการ: {ag.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        ag.completed
                          ? "bg-emerald-100 text-emerald-800"
                          : ag.isDelayed
                          ? "bg-rose-100 text-rose-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {ag.completed ? "สำเร็จแล้ว" : ag.isDelayed ? "ค้างนาน (ข้ามเดือน)" : "กำลังทำ"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
