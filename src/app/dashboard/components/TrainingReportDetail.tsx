"use client";

import { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Award,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  Download,
  BookOpen,
  User,
  FileText,
  Sparkles,
  TrendingUp,
  BookmarkCheck,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  Paperclip
} from "lucide-react";
import ModernDatePicker from "@/components/ModernDatePicker";
import ExportDataDropdown from "./ExportDataDropdown";
import { getCloudJson, setCloudJson, CLOUD_KEYS } from "@/utils/cloudSyncService";

export interface IndividualTrainingRecord {
  id: string;
  memberCode: string;
  memberName: string;
  memberNickname: string;
  unit: string;
  courseName: string;
  organizer: string;
  trainingDate: string;
  hours: number;
  certUrl?: string;
  status: "completed" | "in_progress";
}

export interface TrainingPlanItem {
  id: string;
  planCode: string;
  courseTitle: string;
  targetUnit: string;
  targetMembers: string;
  organizer: string;
  targetQuarter: string;
  estimatedHours: number;
  budget: string;
  status: "planned" | "approved" | "completed";
  idpLink: string;
}

const DEFAULT_TRAINING_RECORDS: IndividualTrainingRecord[] = [];

const DEFAULT_TRAINING_PLANS: TrainingPlanItem[] = [];

const ALL_MEMBERS = [
  { code: "ST", name: "ผศ.ดร.สุริยะ ทองมุณี", nickname: "อ.บ่าว", unit: "บริหารทีม" },
  { code: "AA", name: "นายอัจชนะพงษ์ อัจชนะวราทา", nickname: "จ๊อบ", unit: "บริหารทีม" },
  { code: "WK", name: "นางสาววาสิตา กอบธัญกิจ", nickname: "วา", unit: "บริหารทีม" },
  { code: "RL", name: "นางสาวรติพร กัลปพฤกษ์", nickname: "จอย", unit: "งานออกแบบ" },
  { code: "AC", name: "นางสาวอัจฉราภรณ์ ศักดาวงศ์เสรี", nickname: "พิม", unit: "งานออกแบบ" },
  { code: "LLP", name: "นางสาวลลิต์ภัทร เลิศลักขณาวัฒน์", nickname: "เยียร์", unit: "งานออกแบบ" },
  { code: "MTN", name: "นางสาวมัทนิน ยงค์ไสว", nickname: "นิน", unit: "งานออกแบบ" },
  { code: "IK", name: "นายอิศรา แก้วเรือง", nickname: "ก้อง", unit: "งานออกแบบ" },
  { code: "STK", name: "นางสาวสุทธิอาภา คุ้มครอง", nickname: "ลูกอิน", unit: "สื่อสารองค์กร" },
  { code: "CNB", name: "นางสาวชนนิกานต์ บุญแก้ว", nickname: "โอ๊ต", unit: "สื่อสารองค์กร" },
  { code: "SLR", name: "นางสาวศิริลักษณ์ กันจะนะ", nickname: "เอ็นจอย", unit: "ผลิตสื่อสร้างสรรค์" },
  { code: "KYK", name: "นางสาวกัลยกร อภิวงศ์", nickname: "แก้ว", unit: "ผลิตสื่อสร้างสรรค์" },
  { code: "TTY", name: "นางสาวฐิติยา เข็มพล", nickname: "ต้า", unit: "ผลิตสื่อสร้างสรรค์" }
];

export default function TrainingReportDetail() {
  const [activeTab, setActiveTab] = useState<"records" | "plans">("records");
  const [records, setRecords] = useState<IndividualTrainingRecord[]>([]);
  const [plans, setPlans] = useState<TrainingPlanItem[]>([]);
  const [selectedMember, setSelectedMember] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [targetMemberForRecord, setTargetMemberForRecord] = useState<any>(ALL_MEMBERS[3]);

  // Modal Record State
  const [newCourse, setNewCourse] = useState("");
  const [newOrganizer, setNewOrganizer] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newHours, setNewHours] = useState(8);

  // Load from Supabase Cloud with fallback to LocalStorage
  useEffect(() => {
    async function loadCloudTraining() {
      try {
        const cloudData = await getCloudJson<IndividualTrainingRecord[]>(
          CLOUD_KEYS.TRAINING_RECORDS,
          "cc_training_records_v2_fy70"
        );
        if (cloudData && Array.isArray(cloudData)) {
          setRecords(cloudData);
        }
      } catch (e) {
        console.warn("Failed to load training records from cloud:", e);
      }
    }
    loadCloudTraining();
  }, []);

  const saveRecords = (items: IndividualTrainingRecord[]) => {
    setRecords(items);
    setCloudJson(CLOUD_KEYS.TRAINING_RECORDS, items, "cc_training_records_v2_fy70");
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedMember !== "ALL" && r.memberCode !== selectedMember) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.memberName.toLowerCase().includes(q) ||
          r.memberNickname.toLowerCase().includes(q) ||
          r.courseName.toLowerCase().includes(q) ||
          r.organizer.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, selectedMember, searchQuery]);

  const handleOpenAddRecord = (member: any) => {
    setTargetMemberForRecord(member);
    setShowAddRecordModal(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.trim() || !newOrganizer.trim()) {
      alert("กรุณากรอกชื่อหลักสูตรและหน่วยงานผู้จัด");
      return;
    }

    const newRec: IndividualTrainingRecord = {
      id: `tr-${Date.now()}`,
      memberCode: targetMemberForRecord.code,
      memberName: targetMemberForRecord.name,
      memberNickname: targetMemberForRecord.nickname,
      unit: targetMemberForRecord.unit,
      courseName: newCourse,
      organizer: newOrganizer,
      trainingDate: newDate,
      hours: Number(newHours) || 8,
      status: "completed"
    };

    const updated = [newRec, ...records];
    saveRecords(updated);
    setShowAddRecordModal(false);
    setNewCourse("");
    setNewOrganizer("");
  };

  // Export to CSV
  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push(`\uFEFF"ทะเบียนประวัติการฝึกอบรมบุคลากรทีม CC (ISO 9001:2015 Clause 7.2 Competence)"`);
    lines.push(`"วันที่ส่งออกข้อมูล",${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push("");
    lines.push('"รหัส","ชื่อ-นามสกุล","ชื่อเล่น","ยูนิต","ชื่อหลักสูตรการอบรม","หน่วยงานผู้จัด","วันที่อบรม","จำนวนชั่วโมง"');

    records.forEach(r => {
      lines.push(`"${r.memberCode}","${r.memberName}","${r.memberNickname}","${r.unit}","${r.courseName.replace(/"/g, '""')}","${r.organizer.replace(/"/g, '""')}","${r.trainingDate}",${r.hours}`);
    });

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CC_Training_Records_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalHours = useMemo(() => {
    return records.reduce((acc, c) => acc + c.hours, 0);
  }, [records]);

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              <GraduationCap size={14} className="text-amber-600" />
              <span>ISO 9001:2015 Clause 7.2 Competence &amp; Personnel Development</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              บันทึกการอบรมและแผนพัฒนาบุคลากร (Training &amp; IDP)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ระบบติดตามชั่วโมงการฝึกอบรมรายบุคคลของทั้ง 13 บุคลากร แผนพัฒนาทักษะประจำปี (Individual Development Plan) พร้อมลิงก์ตรงสำหรับบันทึกและจัดทำแผนการอบรม
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ExportDataDropdown
              reportId="training"
              reportTitle="บันทึกการอบรม (Training & IDP)"
              buttonText="Export Data"
            />
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">บุคลากรในทะเบียน</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{ALL_MEMBERS.length}</span>
              <span className="text-xs text-slate-500">ท่าน (100% มี IDP)</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">เป้าหมาย ≥ 20 ชั่วโมง/คน/ปี</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">ชั่วโมงอบรมสะสมรวม</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600">{totalHours}</span>
              <span className="text-xs text-amber-700 font-mono">ชั่วโมง</span>
            </div>
            <p className="text-[10.5px] text-amber-700 mt-1">เฉลี่ย {Math.round(totalHours / ALL_MEMBERS.length)} ชม./คน</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">หลักสูตรที่เสร็จสิ้น</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{records.length}</span>
              <span className="text-xs text-emerald-700 font-medium">หลักสูตร</span>
            </div>
            <p className="text-[10.5px] text-emerald-700 mt-1">มีวุฒิบัตรรับรองครบถ้วน</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">แผนการอบรม (IDP Plan)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">{plans.length}</span>
              <span className="text-xs text-blue-600">โครงการปี 2026</span>
            </div>
            <p className="text-[10.5px] text-blue-700 mt-1">สอดคล้องตามเกณฑ์ ISO 7.2</p>
          </div>
        </div>

        {/* 2 Nav Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("records")}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "records"
                ? "border-[#E03131] text-[#E03131]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award size={16} />
            <span>1. บันทึกประวัติการอบรมรายบุคคล ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "plans"
                ? "border-[#E03131] text-[#E03131]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen size={16} />
            <span>2. แผนการอบรมและพัฒนาทักษะประจำปี (IDP Plans - {plans.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: INDIVIDUAL TRAINING RECORDS & DIRECT INPUT LINKS              */}
      {/* ===================================================================== */}
      {activeTab === "records" && (
        <div className="space-y-6">
          {/* Member Direct Jump Cards */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User size={15} className="text-slate-500" />
                  <span>รายชื่อบุคลากร 13 ท่าน: คลิกลิงก์เพื่อบันทึกประวัติการอบรมรายบุคคล</span>
                </h3>
                <p className="text-xs text-slate-500">
                  สามารถกดปุ่ม "+ บันทึกการอบรม" เพื่อเพิ่มหลักสูตร หรือกด "แบบฟอร์มภายนอก" เพื่อเปิดแบบฟอร์ม Google Form IDP
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ALL_MEMBERS.map(m => {
                const memberRecs = records.filter(r => r.memberCode === m.code);
                const memberHours = memberRecs.reduce((acc, c) => acc + c.hours, 0);

                return (
                  <div
                    key={m.code}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-2.5 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full">
                          {m.code}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                          {memberHours} / 20 ชม.
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 mt-2 truncate">
                        {m.name}
                      </h4>
                      <p className="text-[10.5px] text-slate-500">
                        {m.nickname} • {m.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => handleOpenAddRecord(m)}
                        className="flex-1 py-1 px-2 text-[10.5px] font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-lg transition-all inline-flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                        title={`บันทึกการอบรมให้ ${m.nickname}`}
                      >
                        <Plus size={11} />
                        <span>บันทึกการอบรม</span>
                      </button>

                      <a
                        href={`https://docs.google.com/forms/d/e/1FAIpQLSc-example-training-record/viewform?entry.123=${encodeURIComponent(m.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 px-2 text-[10.5px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-all inline-flex items-center gap-1 shrink-0"
                        title="เปิด Google Form บันทึกการอบรม"
                      >
                        <span>ฟอร์ม</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                ตารางบันทึกประวัติการฝึกอบรม (Training History Log)
              </h3>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาหลักสูตร หรือชื่อบุคลากร..."
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-500 w-56 sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-3 w-20">รหัส</th>
                    <th className="py-3 px-3">บุคลากร</th>
                    <th className="py-3 px-3">ยูนิต</th>
                    <th className="py-3 px-3 min-w-[220px]">หลักสูตรการฝึกอบรม</th>
                    <th className="py-3 px-3">หน่วยงานผู้จัด</th>
                    <th className="py-3 px-3">วันที่อบรม</th>
                    <th className="py-3 px-3 text-center">ชั่วโมง</th>
                    <th className="py-3 px-3 text-center">หลักฐาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {r.memberCode}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{r.memberName}</span>
                        <span className="text-[10px] text-slate-500">{r.memberNickname}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {r.unit}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {r.courseName}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {r.organizer}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {r.trainingDate}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-amber-700">
                        {r.hours} ชม.
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.certUrl ? (
                          <a
                            href={r.certUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-600 hover:underline"
                          >
                            <Paperclip size={11} />
                            <span>วุฒิบัตร</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">ผ่านการอบรม</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ANNUAL TRAINING PLANS & IDP DIRECTORY                          */}
      {/* ===================================================================== */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                แผนพัฒนาบุคลากรและการฝึกอบรมประจำปี (Annual Training &amp; IDP Plan 2026)
              </h3>
              <p className="text-xs text-slate-500">
                สอดรับกับข้อกำหนด ISO 9001:2015 ข้อ 7.2 เพื่อยกระดับความสามารถ (Competence) รองรับเทคโนโลยีและงานสร้างสรรค์ยุคใหม่
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(p => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3.5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[10px] text-slate-500">
                        {p.planCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status === "approved" ? "อนุมัติแล้ว" : "วางแผน"}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {p.courseTitle}
                    </h4>

                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      <p>ยูนิตเป้าหมาย: <strong className="text-slate-800">{p.targetUnit}</strong></p>
                      <p>ผู้เข้าร่วม: <span className="text-slate-700 font-medium">{p.targetMembers}</span></p>
                      <p>หน่วยงานจัด: <span className="text-slate-700">{p.organizer}</span></p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                      <span>{p.targetQuarter}</span>
                      <span className="font-bold text-slate-800">{p.budget} ({p.estimatedHours} ชม.)</span>
                    </div>

                    <a
                      href={p.idpLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs group active:scale-98"
                    >
                      <span>ทำแผนการอบรมรายบุคคล (IDP Form)</span>
                      <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddRecordModal && targetMemberForRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                บันทึกประวัติการอบรม: {targetMemberForRecord.name} ({targetMemberForRecord.nickname})
              </h3>
              <button
                onClick={() => setShowAddRecordModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ชื่อหลักสูตร / โครงการฝึกอบรม:</label>
                <input
                  type="text"
                  required
                  value={newCourse}
                  onChange={e => setNewCourse(e.target.value)}
                  placeholder="เช่น หลักสูตร Generative AI in Creative Media..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">หน่วยงาน / องค์กรผู้จัด:</label>
                <input
                  type="text"
                  required
                  value={newOrganizer}
                  onChange={e => setNewOrganizer(e.target.value)}
                  placeholder="เช่น สมาคมนักออกแบบ, มหาวิทยาลัยเชียงใหม่..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">วันที่อบรมเสร็จสิ้น:</label>
                  <ModernDatePicker
                    value={newDate}
                    onChange={(val) => setNewDate(val)}
                    placeholder="เลือกวันที่อบรม..."
                    required={true}
                    className="w-full h-[42px] px-3.5 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">จำนวนชั่วโมง (Hours):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newHours}
                    onChange={e => setNewHours(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  บันทึกประวัติการอบรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
