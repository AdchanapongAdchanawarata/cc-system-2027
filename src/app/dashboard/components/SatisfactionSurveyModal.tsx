"use client";

import { useState } from "react";
import { X, Star, CheckCircle2, MessageSquare, User, Check, Lock } from "lucide-react";
import { SATISFACTION_CRITERIA, SatisfactionScores } from "@/utils/okrSettings";

interface SatisfactionSurveyModalProps {
  brief: {
    id: string;
    project_name?: string;
    requester_email?: string;
    coordinator_nickname?: string;
    decision_maker?: string;
    assignee_id?: string;
    details?: any;
  };
  assigneeName?: string;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (scores: SatisfactionScores) => Promise<void>;
}

const STAKEHOLDER_OPTIONS = [
  { val: "ผู้บริหาร", label: "ผู้บริหาร (Executive Management)" },
  { val: "พนักงาน", label: "พนักงาน (บุคลากรภายใน STeP)" },
  { val: "มหาวิทยาลัยเชียงใหม่", label: "มหาวิทยาลัยเชียงใหม่ (คณะ/สถาบัน/สำนัก)" },
  { val: "ภาคเอกชน / ภาคอุตสาหกรรม", label: "ภาคเอกชน / ภาคอุตสาหกรรม (Startups/SMEs)" },
  { val: "ผู้เข้าร่วมโครงการ / อบรม", label: "ผู้เข้าร่วมโครงการ / อบรม" },
  { val: "พันธมิตรภายนอก / หน่วยงานที่ร่วมมือ", label: "พันธมิตรภายนอก / หน่วยงานที่ร่วมมือ" },
];

export default function SatisfactionSurveyModal({
  brief,
  assigneeName,
  readOnly = false,
  onClose,
  onSave,
}: SatisfactionSurveyModalProps) {
  const existing = brief.details?.satisfaction_scores || {};

  // ส่วนที่ 1: ข้อมูลทั่วไปของผู้ตอบแบบสำรวจ
  const [gender, setGender] = useState<string>(
    existing.gender || brief.details?.gender || "ไม่ต้องการระบุ"
  );
  const [stakeholderRole, setStakeholderRole] = useState<string>(() => {
    const savedRole = existing.stakeholderRole || brief.details?.stakeholder_role || "";
    if (savedRole) {
      const matched = STAKEHOLDER_OPTIONS.find(
        (o) => savedRole === o.val || savedRole.includes(o.val)
      );
      if (matched) return matched.val;
    }
    const org = (brief.details?.organization || brief.details?.work_organization || "").toLowerCase();
    if (org.includes("cmu") || org.includes("มช")) return "มหาวิทยาลัยเชียงใหม่";
    if (org.includes("private") || org.includes("เอกชน")) return "ภาคเอกชน / ภาคอุตสาหกรรม";
    if (org.includes("rsp") || org.includes("gov")) return "พันธมิตรภายนอก / หน่วยงานที่ร่วมมือ";
    return "พนักงาน";
  });

  const [projectName, setProjectName] = useState<string>(
    brief.details?.survey_project_name_custom || brief.project_name || ""
  );
  const [department, setDepartment] = useState<string>(() => {
    if (existing.department) return existing.department;
    const rawTeam = brief.details?.team || brief.decision_maker || brief.details?.organization || "STeP";
    return String(rawTeam).split(" - ")[0].trim();
  });
  const [evaluatedBy, setEvaluatedBy] = useState<string>(() => {
    if (existing.evaluatedBy) return existing.evaluatedBy;
    if (brief.coordinator_nickname) {
      const cleanNick = brief.coordinator_nickname.trim().replace(/^คุณ/, "");
      return `PM / คุณ${cleanNick}`;
    }
    return brief.requester_email || "PM / ผู้ดูแลโครงการ";
  });

  // ส่วนที่ 2: แบบสำรวจความต้องการ-ความคาดหวัง
  const [needs, setNeeds] = useState<string>(
    existing.needs || brief.details?.needs || ""
  );
  const [expectations, setExpectations] = useState<string>(
    existing.expectations || brief.details?.expectations || ""
  );
  const [suggestions, setSuggestions] = useState<string>(
    existing.suggestions || existing.comment || brief.details?.suggestions || ""
  );

  // ส่วนที่ 3: คะแนนความพึงพอใจ 5 มิติ
  const [scores, setScores] = useState({
    accuracy: existing.accuracy || 5,
    timeliness: existing.timeliness || 5,
    quality: existing.quality || 5,
    attentiveness: existing.attentiveness || 5,
    ownership: existing.ownership || 5,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const totalPoints =
    scores.accuracy +
    scores.timeliness +
    scores.quality +
    scores.attentiveness +
    scores.ownership;
  const maxPoints = 25;
  const averagePercent = Math.round((totalPoints / maxPoints) * 100);

  const getScoreRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return "ดีเยี่ยม (5)";
      case 4:
        return "ดีมาก (4)";
      case 3:
        return "ปานกลาง (3)";
      case 2:
        return "พอใช้ (2)";
      case 1:
        return "ควรปรับปรุง (1)";
      default:
        return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setIsSubmitting(true);
    try {
      const trimmedSuggestions = suggestions.trim();
      const evaluationData: SatisfactionScores = {
        accuracy: scores.accuracy,
        timeliness: scores.timeliness,
        quality: scores.quality,
        attentiveness: scores.attentiveness,
        ownership: scores.ownership,
        averagePercent,
        gender: gender || "ไม่ต้องการระบุ",
        stakeholderRole: stakeholderRole || "พนักงาน",
        department: department.trim(),
        needs: needs.trim(),
        expectations: expectations.trim(),
        suggestions: trimmedSuggestions,
        comment: trimmedSuggestions,
        evaluatedBy: evaluatedBy.trim() || "PM / ผู้ดูแลโครงการ",
        evaluatedAt: new Date().toISOString(),
      };

      await onSave(evaluationData);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to save satisfaction scores:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#f8f9fb] w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
              <Star size={20} className="fill-white" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  แบบสำรวจความต้องการ ความคาดหวัง และประเมินความพึงพอใจ (ครบทั้ง 3 ส่วน)
                </h3>
                {readOnly && (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 flex items-center gap-1 border border-slate-300">
                    <Lock size={10} /> โหมดดูอย่างเดียว (เฉพาะ Admin แก้ไขได้)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                โครงการ/ชิ้นงาน:{" "}
                <span className="font-semibold text-slate-700">
                  {brief.project_name || "ชิ้นงาน"}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Task & Assignee Summary Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border-b border-amber-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                ผู้รับผิดชอบงาน (Assignee)
              </span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <User size={13} className="text-amber-600" />
                {assigneeName || "ทีม Creative / Content"}
              </span>
            </div>
            {brief.requester_email && (
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                  อีเมลผู้สั่งงาน (Requester)
                </span>
                <span className="font-medium text-slate-700 font-mono mt-0.5 block truncate max-w-[220px]">
                  {brief.requester_email}
                </span>
              </div>
            )}
          </div>

          {/* Real-time Percentage Badge */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                คะแนนประเมินเฉลี่ย
              </div>
              <div className="text-lg font-mono font-black text-amber-600 leading-none">
                {averagePercent}%
              </div>
            </div>
            <div className="h-7 w-[1px] bg-slate-200" />
            <div className="text-xs font-bold text-slate-600">
              {totalPoints} / {maxPoints} คะแนน
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar"
        >
          {/* ===================================================================== */}
          {/* ส่วนที่ 1 ข้อมูลทั่วไปของผู้ตอบแบบสำรวจ                                */}
          {/* ===================================================================== */}
          <div className="space-y-5 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2">
              <h2 className="text-sm font-bold tracking-wide text-zinc-500 flex items-center gap-2">
                <span className="text-zinc-900 font-black">ส่วนที่ 1</span>{" "}
                ข้อมูลทั่วไปของผู้ตอบแบบสำรวจ
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>ระบุข้อมูลอัตโนมัติเรียบร้อยแล้ว</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* เพศ */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-800 block">
                  เพศ <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {(["ชาย", "หญิง", "ไม่ต้องการระบุ"] as const).map((g) => (
                    <label
                      key={g}
                      className={`flex items-center gap-2 text-xs sm:text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
                        readOnly ? "cursor-default" : "cursor-pointer"
                      } ${
                        gender === g
                          ? "bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-2xs"
                          : "bg-zinc-50 border-zinc-200 text-zinc-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        disabled={readOnly}
                        checked={gender === g}
                        onChange={() => !readOnly && setGender(g)}
                        className="accent-[#e03131] w-4 h-4"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ตำแหน่ง / กลุ่มผู้มีส่วนได้ส่วนเสีย */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-800 block">
                  ตำแหน่ง / กลุ่มผู้มีส่วนได้ส่วนเสีย{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STAKEHOLDER_OPTIONS.map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex items-center gap-2.5 text-xs sm:text-sm font-medium p-3 rounded-xl border transition-all ${
                        readOnly ? "cursor-default" : "cursor-pointer"
                      } ${
                        stakeholderRole === opt.val
                          ? "bg-rose-50/80 border-rose-300 text-rose-900 font-bold shadow-2xs"
                          : "bg-zinc-50/60 border-zinc-200 text-zinc-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="stakeholderRole"
                        value={opt.val}
                        disabled={readOnly}
                        checked={stakeholderRole === opt.val}
                        onChange={() => !readOnly && setStakeholderRole(opt.val)}
                        className="accent-[#e03131] w-4 h-4 shrink-0"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ชื่องาน / โครงการที่เกี่ยวข้อง */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-800 flex items-center justify-between">
                  <span>
                    ชื่องาน / โครงการที่เกี่ยวข้อง{" "}
                    <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    ✓ ข้อมูลจากระบบ CC
                  </span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onChange={(e) => !readOnly && setProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-[#f4f7fb] font-semibold text-zinc-900"
                />
              </div>

              {/* สังกัด / ฝ่ายงานของผู้ขอรับบริการ */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-zinc-800 block">
                  สังกัด / ฝ่ายงานของผู้ขอรับบริการ
                </label>
                <input
                  type="text"
                  value={department}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onChange={(e) => !readOnly && setDepartment(e.target.value)}
                  placeholder="เช่น IQI, LINC, BDI หรือหน่วยงานผู้รับบริการ"
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl ${
                    readOnly ? "bg-[#f9f9fb] text-zinc-700" : "bg-white text-zinc-900"
                  }`}
                />
              </div>

              {/* ชื่อผู้ให้ข้อมูล / อีเมลติดต่อ */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-zinc-800 block">
                  ชื่อผู้ให้ข้อมูล / อีเมลติดต่อ (ระบุหรือไม่ก็ได้)
                </label>
                <input
                  type="text"
                  value={evaluatedBy}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onChange={(e) => !readOnly && setEvaluatedBy(e.target.value)}
                  placeholder="เช่น PM / คุณหนุ่ย หรืออีเมลผู้ประเมิน"
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl ${
                    readOnly ? "bg-[#f9f9fb] text-zinc-700" : "bg-white text-zinc-900"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* ส่วนที่ 2 แบบสำรวจความต้องการ-ความคาดหวัง                              */}
          {/* ===================================================================== */}
          <div className="space-y-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-2xs">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold tracking-wide text-zinc-500 flex items-center gap-2">
                <span className="text-zinc-900 font-black">ส่วนที่ 2</span>{" "}
                แบบสำรวจความต้องการ-ความคาดหวัง
              </h2>
              <span className="text-xs text-zinc-400 font-medium">
                ตามความสมัครใจ (ไม่บังคับ)
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center justify-between">
                  <span>ความต้องการ (Needs)</span>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    สิ่งที่จำเป็นต้องมีในการให้บริการ
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={needs}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onChange={(e) => !readOnly && setNeeds(e.target.value)}
                  placeholder={
                    readOnly
                      ? "ไม่ได้ระบุความต้องการเพิ่มเติม"
                      : "ต้องการให้เราช่วยทำอะไร/สิ่งที่ต้องการจากการบริการของเรา"
                  }
                  className={`w-full p-3 text-xs sm:text-sm border border-zinc-200 rounded-2xl leading-relaxed ${
                    readOnly ? "bg-[#f9f9fb] text-zinc-700" : "bg-white text-zinc-800"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center justify-between">
                  <span>ความคาดหวัง (Expectations)</span>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    สิ่งที่ถ้ามีจะดีมาก / เสริมความประทับใจ
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={expectations}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onChange={(e) => !readOnly && setExpectations(e.target.value)}
                  placeholder={
                    readOnly
                      ? "ไม่ได้ระบุความคาดหวังเพิ่มเติม"
                      : "อยากให้งานหรือบริการที่ได้รับจากเราดีขึ้นอย่างไร"
                  }
                  className={`w-full p-3 text-xs sm:text-sm border border-zinc-200 rounded-2xl leading-relaxed ${
                    readOnly ? "bg-[#f9f9fb] text-zinc-700" : "bg-white text-zinc-800"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center justify-between">
                  <span>ข้อเสนอแนะอื่น ๆ (Suggestions)</span>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    เพื่อการปรับปรุงและพัฒนาบริการ
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={suggestions}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onChange={(e) => !readOnly && setSuggestions(e.target.value)}
                  placeholder={
                    readOnly
                      ? "ไม่ได้ระบุข้อเสนอแนะเพิ่มเติม"
                      : "ข้อคิดเห็น ข้อเสนอแนะ หรือคำแนะนำเพิ่มเติมเพื่อยกระดับการให้บริการของทีม CC..."
                  }
                  className={`w-full p-3 text-xs sm:text-sm border border-zinc-200 rounded-2xl leading-relaxed ${
                    readOnly ? "bg-[#f9f9fb] text-zinc-700" : "bg-white text-zinc-800"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* ส่วนที่ 3 แบบประเมินความพึงพอใจการให้บริการ (5 มิติ)                  */}
          {/* ===================================================================== */}
          <div className="space-y-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-2xs">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold tracking-wide text-zinc-500 flex items-center gap-2">
                <span className="text-zinc-900 font-black">ส่วนที่ 3</span>{" "}
                แบบประเมินความพึงพอใจการให้บริการ (5 มิติ)
              </h2>
              <span className="text-xs font-bold text-amber-600">
                เฉลี่ย {averagePercent}% ({totalPoints}/{maxPoints} คะแนน)
              </span>
            </div>

            <div className="space-y-3">
              {SATISFACTION_CRITERIA.map((criterion, idx) => {
                const currentVal = (scores as any)[criterion.key] || 5;
                return (
                  <div
                    key={criterion.id}
                    className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {criterion.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 ml-6.5">
                          {criterion.description}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto ml-6.5 sm:ml-0 font-mono">
                        {getScoreRatingLabel(currentVal)}
                      </span>
                    </div>

                    {/* 5-Star Buttons */}
                    <div className="flex items-center gap-1.5 ml-6.5 pt-1">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isSelected = starVal <= currentVal;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            disabled={readOnly}
                            onClick={() => {
                              if (!readOnly) {
                                setScores({ ...scores, [criterion.key]: starVal });
                              }
                            }}
                            className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                              readOnly
                                ? isSelected
                                  ? "text-amber-500 cursor-default"
                                  : "text-slate-300 cursor-default"
                                : isSelected
                                  ? "text-amber-500 hover:scale-110 active:scale-95 cursor-pointer"
                                  : "text-slate-300 hover:text-slate-400 cursor-pointer"
                            }`}
                            title={
                              readOnly
                                ? `คะแนน ${starVal} ดาว (ดูได้อย่างเดียว)`
                                : `ให้คะแนน ${starVal} ดาว`
                            }
                          >
                            <Star
                              size={22}
                              className={`${
                                isSelected
                                  ? "fill-amber-400 text-amber-500"
                                  : "fill-transparent"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
            {readOnly ? (
              <>
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                  <Lock size={12} className="text-slate-400 shrink-0" />
                  <span>
                    สิทธิ์ผู้รับผิดชอบงาน (Assignee) ดูผลประเมินได้อย่างเดียว • เฉพาะ Admin ที่ประเมินและแก้ไขผลได้
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  ปิดหน้าต่าง (Close)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors order-last sm:order-first cursor-pointer"
                >
                  ยกเลิก
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                      isSuccess
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-500 hover:bg-amber-600 active:scale-95 text-white"
                    }`}
                  >
                    {isSuccess ? (
                      <>
                        <Check size={16} /> บันทึกผลประเมินเรียบร้อยแล้ว
                      </>
                    ) : isSubmitting ? (
                      "กำลังบันทึก..."
                    ) : (
                      <>
                        <Star size={15} className="fill-white" /> บันทึกผลประเมิน ({averagePercent}%)
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
