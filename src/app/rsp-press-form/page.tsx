"use client";

import { useState } from "react";
import {
  Newspaper,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Share2,
  ExternalLink,
  ArrowLeft,
  Copy,
  Check,
  Paperclip,
  Clock,
  Sparkles,
  Link2,
  Send
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import ModernSelect, { ModernSelectOption } from "@/components/ModernSelect";
import ModernDatePicker from "@/components/ModernDatePicker";
import {
  RSP_UNIVERSITIES,
  PRESS_CATEGORIES,
  PressReleaseItem
} from "@/app/dashboard/components/RspPressReport";

// Assignee Oat (โอ๊ต CNB) ID
const OAT_ASSIGNEE_ID = "e2c2672d-81c4-411d-89e9-bcbb6eb374f5";
const OAT_NAME = "โอ๊ต CNB";

export default function RspPressFormPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [formData, setFormData] = useState({
    universityId: "cmu",
    title: "",
    date: new Date().toISOString().split("T")[0],
    targetAudience: "",
    mediaTypes: ["online"] as string[],
    clippingsCount: 1,
    newsUrl: "",
    reporterName: "",
    reporterContact: "",
    details: "",
    attachmentName: ""
  });

  const supabase = createClient();

  // University options for ModernSelect
  const universityOptions: ModernSelectOption[] = RSP_UNIVERSITIES.map(u => ({
    value: u.id,
    label: u.name,
    desc: "เครือข่ายอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ",
    icon: (
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
        style={{ backgroundColor: u.color }}
      />
    )
  }));

  // Category options for ModernSelect
  const descMap: Record<string, string> = {
    "ข่าวการจัดกิจกรรม/โครงการ": "กิจกรรม/โครงการที่เกี่ยวข้องหรือได้รับงบประมาณจาก RSP North และ กปว.",
    "ข่าวผู้บริหารเข้าร่วมกิจกรรมของกระทรวง อว.": "ข่าวกิจกรรม/โครงการที่มีผู้บริหารของกระทรวง อว., สป.อว. และ กปว. เข้าร่วม",
    "ข่าวผู้บริหารกระทรวง อว. ลงพื้นที่ติดตามงาน หรือประชุม ที่เกี่ยวข้องกับเครือข่ายมหาวิทยาลัยฯ": "ข่าวการลงพื้นที่ตรวจเยี่ยม ติดตามงาน หรือการประชุมร่วมกับเครือข่ายมหาวิทยาลัย",
    "ข่าวประชาสัมพันธ์ (โครงการที่รับสมัครจะต้องไม่เป็นโครงการที่ทำเหมือนกันทุกมหาวิทยาลัย)": "ประชาสัมพันธ์การจัดกิจกรรม/โครงการที่ไม่ซ้ำซ้อนกับโครงการหลักของเครือข่าย",
    "ข่าวประชาสัมพันธ์บริการ": "ประชาสัมพันธ์บริการห้องปฏิบัติการ โครงสร้างพื้นฐาน หรือบริการอุทยานวิทยาศาสตร์",
    "ข่าว Success case": "กรณีศึกษาความสำเร็จ ผู้ประกอบการ ผลงานวิจัย หรือนวัตกรรมที่เกิดผลสัมฤทธิ์เด่นชัด"
  };

  const categoryOptions: ModernSelectOption[] = PRESS_CATEGORIES.map(cat => ({
    value: cat.name,
    label: cat.name,
    desc: descMap[cat.name] || "ประเภทข่าวกิจกรรมและโครงการเครือข่าย RSP North",
    icon: (
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
        style={{ backgroundColor: cat.color }}
      />
    )
  }));

  // Copy share form URL handler
  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Submit Handler: Two-way sync to Press Log & Assignments Board
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("กรุณากรอกชื่อข่าว/กิจกรรม/โครงการ");
      return;
    }
    if (!formData.targetAudience.trim()) {
      alert("กรุณาเลือกประเภทข่าวกิจกรรม/โครงการที่ต้องการจะเผยแพร่");
      return;
    }
    if (!formData.reporterName.trim()) {
      alert("กรุณากรอกชื่อเล่นผู้ประสานงาน");
      return;
    }
    if (!formData.reporterContact.trim()) {
      alert("กรุณากรอกอีเมลติดต่อ");
      return;
    }

    setSubmitting(true);

    try {
      const timestamp = Date.now();
      const codeSeq = String(Math.floor(Math.random() * 900) + 100);
      const generatedCode = `RSP-PR-${new Date().getFullYear()}-${codeSeq}`;

      const uni = RSP_UNIVERSITIES.find(u => u.id === formData.universityId);
      const uniName = uni ? uni.name : formData.universityId;
      const taskTitle = `[RSP] ข่าวประชาสัมพันธ์: ${formData.title.trim()} (${uniName})`;

      // 1. Sync ทางแรก: บันทึกข้อมูลลง LocalStorage (cc_rsp_press_records_v1) สำหรับ Press Log
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("cc_rsp_press_records_v1");
          const existing: PressReleaseItem[] = saved ? JSON.parse(saved) : [];
          const newRecord: PressReleaseItem = {
            id: `pr-${timestamp}`,
            code: generatedCode,
            universityId: formData.universityId,
            title: formData.title.trim(),
            date: formData.date,
            targetAudience: formData.targetAudience,
            mediaTypes: formData.mediaTypes.length > 0 ? formData.mediaTypes : ["online"],
            clippingsCount: Number(formData.clippingsCount) || 1,
            newsUrl: formData.newsUrl.trim(),
            reporterName: formData.reporterName.trim(),
            reporterContact: formData.reporterContact.trim(),
            details: formData.details.trim(),
            status: "published",
            clippingList: formData.newsUrl ? [{ name: "ข่าวออนไลน์", url: formData.newsUrl, date: formData.date }] : []
          };
          localStorage.setItem("cc_rsp_press_records_v1", JSON.stringify([newRecord, ...existing]));
        } catch (storageErr) {
          console.error("Local storage sync error:", storageErr);
        }
      }

      // 2. Sync ทางที่สอง: ซิงค์ไปหน้าบอร์ดรวม (Tasks Board / AssignmentsView)
      // งาน internal โอ๊ตเป็นคนทำ (โอ๊ต CNB) ประเภทงาน: เขียนข่าว ( นอกเหนือจาก Task งาน ) ภาระงานของ RSP มูลค่าประหยัด 1,500 บาท
      const { error: briefError } = await supabase.from("briefs").insert([{
        project_name: taskTitle,
        unit: "internal",
        status: "pending",
        priority: "Medium",
        assignee_id: OAT_ASSIGNEE_ID,
        coordinator_nickname: formData.reporterName.trim(),
        requester_email: formData.reporterContact.trim() || "chonnikarn@step.cmu.ac.th",
        decision_maker: uniName,
        deadline: formData.date,
        details: {
          category: "เขียนข่าว ( นอกเหนือจาก Task งาน )",
          type: "เขียนข่าว ( นอกเหนือจาก Task งาน )",
          service: "เขียนข่าว ( นอกเหนือจาก Task งาน )",
          work_organization: "RSP",
          internal_organization: "RSP",
          save_cost: 1500,
          project_value: "1500",
          revenue: 1500,
          cost: 0,
          profit: 1500,
          assignee_name: OAT_NAME,
          university_id: formData.universityId,
          university_name: uniName,
          target_audience: formData.targetAudience,
          publish_date: formData.date,
          news_url: formData.newsUrl.trim(),
          attachment_name: formData.attachmentName,
          description: formData.details.trim(),
          reporter_name: formData.reporterName.trim(),
          reporter_contact: formData.reporterContact.trim(),
          rsp_code: generatedCode,
          source: "rsp_press_form"
        }
      }]);

      if (briefError) {
        console.error("Error inserting brief to Supabase:", briefError);
      }

      setSubmittedCode(generatedCode);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/70 py-4 sm:py-8 px-2 sm:px-4 md:px-6 font-sans">
      <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">

        {/* Top Navbar Actions: Back button (Left) and Copy Link button (Right) */}
        <div className="w-full flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>

          <button
            type="button"
            onClick={handleCopyShareLink}
            title="Copy link"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold transition-all shadow-2xs border cursor-pointer active:scale-95 ${
              copiedLink
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-slate-500" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>

        {/* Submitted Success Screen */}
        {submittedCode ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                ส่งข้อมูลเรียบร้อยแล้ว
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                บันทึกแบบฟอร์มประชาสัมพันธ์สำเร็จ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                ระบบได้ส่งต่องานไปยังเจ้าหน้าที่สื่อสารองค์กร RSP North (คุณโอ๊ต CNB) เพื่อตรวจสอบเนื้อหาและเตรียมเผยแพร่แล้ว
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 max-w-sm mx-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase">รหัสอ้างอิงข่าวประชาสัมพันธ์</span>
              <p className="font-mono font-black text-lg text-slate-900 mt-0.5">{submittedCode}</p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmittedCode(null);
                  setFormData({
                    universityId: "cmu",
                    title: "",
                    date: new Date().toISOString().split("T")[0],
                    targetAudience: "",
                    mediaTypes: ["online"],
                    clippingsCount: 1,
                    newsUrl: "",
                    reporterName: "",
                    reporterContact: "",
                    details: "",
                    attachmentName: ""
                  });
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#E03131] hover:bg-[#c92a2a] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                กรอกแบบฟอร์มใหม่
              </button>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center"
              >
                ดูรายการข่าวในแดชบอร์ด
              </Link>
            </div>
          </div>
        ) : (
          /* Intake Form Card */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            
            {/* Header Banner (Dieter Rams Orange) */}
            <div className="p-6 sm:p-10 bg-[#E8590C] text-white space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/20 text-white text-xs font-bold backdrop-blur-xs">
                <Building2 size={14} />
                <span>เครือข่ายอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ 14 สถาบัน</span>
              </div>

              {/* Requirement 1: Form title separated into two lines with English subtitle underneath */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
                <div>แบบฟอร์มงานประชาสัมพันธ์</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white/95 mt-2.5">
                  เครือข่ายอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ
                </div>
              </h1>
              <p className="text-sm sm:text-base font-semibold text-white/90 pt-1">
                (Regional Science Park Northern Network PR Form : RSP NORTH)
              </p>
            </div>

            {/* RSP Conditions Banner */}
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/70 space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                ต้องเป็นข่าวกิจกรรม/โครงการ<u className="font-bold text-slate-900">ที่เกี่ยวข้องหรือได้รับงบประมาณ</u> จากอุทยานวิทยาศาสตร์ภูมิภาค ภาคเหนือ และ สำนักงานปลัดกระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม (สป.อว.) เท่านั้น!!! กิจกรรม/โครงการในนามอุทยานฯ ของท่าน
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-500 pl-1 font-medium text-xs">
                <li>การกรอกข้อมูลข่าวกิจกรรม/โครงการ ให้ใช้ 1 แบบฟอร์มต่อ 1 ประเภทงานประชาสัมพันธ์</li>
                <li>เจ้าหน้าที่สื่อสารองค์กร RSP North จะดำเนินการตรวจสอบเนื้อหากิจกรรม/โครงการ ก่อนดำเนินการโพสต์ใน Facebook page : RSP North</li>
              </ol>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-8">
              
              {/* ========================================== */}
              {/* ส่วนที่ 1: ข้อมูลทั่วไป                      */}
              {/* ========================================== */}
              <div className="space-y-5">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-5 bg-[#E03131] rounded-full inline-block" />
                  <span>ส่วนที่ 1: ข้อมูลทั่วไป</span>
                </h3>

                {/* 1.1 ชื่อเล่นผู้ประสานงาน* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>😎</span>
                    <span>ชื่อเล่นผู้ประสานงาน</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter text"
                    value={formData.reporterName}
                    onChange={e => setFormData({ ...formData, reporterName: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 1.2 อีเมล* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>📫</span>
                    <span>อีเมล</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter email"
                    value={formData.reporterContact}
                    onChange={e => setFormData({ ...formData, reporterContact: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 1.3 สังกัดเครือข่ายอุทยานวิทยาศาสตร์ภาคเหนือ * */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>สังกัดเครือข่ายอุทยานวิทยาศาสตร์ภาคเหนือ</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <ModernSelect
                    value={formData.universityId}
                    onChange={(val) => setFormData({ ...formData, universityId: val })}
                    options={universityOptions}
                    placeholder="เลือกสังกัดมหาวิทยาลัยเครือข่าย..."
                    searchPlaceholder="ค้นหาชื่อมหาวิทยาลัย..."
                    searchable={true}
                    className="rounded-full bg-white border-slate-200 py-3 px-4 text-xs sm:text-sm shadow-2xs hover:border-slate-300 transition-all"
                  />
                </div>
              </div>

              {/* ========================================== */}
              {/* ส่วนที่ 2: ประเภทข่าวกิจกรรม/โครงการ          */}
              {/* ========================================== */}
              <div className="space-y-5 pt-6 border-t border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-5 bg-blue-600 rounded-full inline-block" />
                    <span>ส่วนที่ 2: ประเภทข่าวกิจกรรม/โครงการ</span>
                  </h3>

                  {/* ข้อกำหนดประเภทข่าว */}
                  <div className="mt-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2 text-xs leading-relaxed text-slate-600">
                    <h4 className="font-bold text-slate-900">ข้อกำหนดประเภทข่าว</h4>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                      <li>
                        ข่าวกิจกรรม/โครงการ <u className="font-bold text-slate-900">ที่ได้รับงบจาก RSP North และ กปว. เท่านั้น</u> เช่น จากแผนงาน 4P/7P/บัดดี้-บัดเดอร์/โครงการบริหารจัดการอุทยานฯ
                      </li>
                      <li>
                        ข่าวกิจกรรม/โครงการ <u className="font-bold text-slate-900">ที่มีผู้บริหารเครือข่ายอุทยานฯ เข้าร่วมกิจกรรมนั้น ๆ</u>
                      </li>
                      <li>
                        ข่าวกิจกรรม/โครงการ <u className="font-bold text-slate-900">ที่มีผู้บริหารของกระทรวง อว., สป.อว. และ กปว. เข้าร่วม</u>
                      </li>
                      <li>
                        ข่าวประชาสัมพันธ์ เช่น ประชาสัมพันธ์การจัดกิจกรรม/โครงการ <u className="font-bold text-slate-900">ที่ได้รับงบจากกระทรวง อว. หรือ กปว. โดยจะต้องไม่ใช่ข่าวประชาสัมพันธ์ที่ได้รับงบประมาณให้ทำเหมือนกันทุกมหาวิทยาลัย</u> เช่น การประกาศรับสมัครผู้ประกอบการ, นักศึกษา P1/R2M/IRTC เป็นต้น
                      </li>
                    </ol>
                  </div>
                </div>

                {/* 2.1 ชื่อข่าว/กิจกรรม/โครงการ* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>✏️</span>
                    <span>ชื่อข่าว/กิจกรรม/โครงการ</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 2.2 รายละเอียดข่าวโดยสังเขป (ใคร/ ทำอะไร/ ที่ไหน/ ความเกี่ยวข้อง/ ผลลัพธ์ที่เกิด)* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>✏️</span>
                    <span>รายละเอียดข่าวโดยสังเขป (ใคร/ ทำอะไร/ ที่ไหน/ ความเกี่ยวข้อง/ ผลลัพธ์ที่เกิด)</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter text"
                    value={formData.details}
                    onChange={e => setFormData({ ...formData, details: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 2.3 ประเภทข่าวกิจกรรม/โครงการที่ต้องการจะเผยแพร่* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>🎉</span>
                    <span>ประเภทข่าวกิจกรรม/โครงการที่ต้องการจะเผยแพร่</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <ModernSelect
                    value={formData.targetAudience}
                    onChange={(val) => setFormData({ ...formData, targetAudience: val })}
                    options={categoryOptions}
                    placeholder="เลือกประเภทข่าวกิจกรรม/โครงการ..."
                    searchPlaceholder="ค้นหาประเภทข่าว (เช่น กิจกรรม, ผู้บริหาร, ประชาสัมพันธ์, Success case)..."
                    searchable={true}
                    className="rounded-full bg-white border-slate-200 py-3 px-4 text-xs sm:text-sm shadow-2xs hover:border-slate-300 transition-all"
                  />
                </div>

                {/* 2.4 วันที่ต้องการประชาสัมพันธ์ข่าว/กิจกรรม/โครงการ* */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>⏰</span>
                    <span>วันที่ต้องการประชาสัมพันธ์ข่าว/กิจกรรม/โครงการ</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  <ModernDatePicker
                    value={formData.date}
                    onChange={(val) => setFormData({ ...formData, date: val })}
                    placeholder="เลือกวันที่ต้องการประชาสัมพันธ์..."
                    required={true}
                    className="rounded-full bg-slate-50 hover:bg-white border-slate-200 py-2.5 px-4 text-xs sm:text-sm shadow-2xs"
                  />
                </div>

                {/* 2.5 ลิงก์ข่าวกิจกรรม/โครงการ ที่ดำเนินการเผยแพร่เรียบร้อยแล้ว */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>🌐</span>
                    <span>ลิงก์ข่าวกิจกรรม/โครงการ ที่ดำเนินการเผยแพร่เรียบร้อยแล้ว</span>
                  </label>
                  <input
                    type="url"
                    placeholder="Enter URL"
                    value={formData.newsUrl}
                    onChange={e => setFormData({ ...formData, newsUrl: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 2.6 รูปภาพข่าวกิจกรรมที่เกี่ยวข้อง */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>📷</span>
                    <span>รูปภาพข่าวกิจกรรมที่เกี่ยวข้อง (อย่างน้อย 5 รูป)</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-8 text-center transition-all bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      id="public-rsp-upload"
                      className="hidden"
                      onChange={e => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          setFormData({ ...formData, attachmentName: `${files.length} ไฟล์ที่เลือกแล้ว` });
                        }
                      }}
                    />
                    <label htmlFor="public-rsp-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Paperclip size={24} className="text-slate-400" />
                      <p className="text-xs text-slate-500">
                        {formData.attachmentName ? (
                          <span className="font-bold text-emerald-600">{formData.attachmentName}</span>
                        ) : (
                          <>
                            Drop your files here to <span className="underline text-blue-600 font-medium">upload</span>
                          </>
                        )}
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button (Dieter Rams Red) */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#E03131] hover:bg-[#c92a2a] text-white text-sm font-black rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>กำลังบันทึกข้อมูล...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>ส่งแบบฟอร์มประชาสัมพันธ์</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
