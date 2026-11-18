"use client";

import { useState } from "react";
import { X, Star, CheckCircle2, MessageSquare, Award, User, Clock, Check, Lock } from "lucide-react";
import { SATISFACTION_CRITERIA, SatisfactionScores } from "@/utils/okrSettings";

interface SatisfactionSurveyModalProps {
  brief: {
    id: string;
    project_name?: string;
    requester_email?: string;
    coordinator_nickname?: string;
    assignee_id?: string;
    details?: any;
  };
  assigneeName?: string;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (scores: SatisfactionScores) => Promise<void>;
}

export default function SatisfactionSurveyModal({
  brief,
  assigneeName,
  readOnly = false,
  onClose,
  onSave
}: SatisfactionSurveyModalProps) {
  const existing = brief.details?.satisfaction_scores || {};

  const [scores, setScores] = useState({
    accuracy: existing.accuracy || 5,
    timeliness: existing.timeliness || 5,
    quality: existing.quality || 5,
    attentiveness: existing.attentiveness || 5,
    ownership: existing.ownership || 5
  });

  const [comment, setComment] = useState<string>(existing.comment || "");
  const [evaluatedBy, setEvaluatedBy] = useState<string>(existing.evaluatedBy || "PM / ผู้ดูแลโครงการ");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const totalPoints = scores.accuracy + scores.timeliness + scores.quality + scores.attentiveness + scores.ownership;
  const maxPoints = 25;
  const averagePercent = Math.round((totalPoints / maxPoints) * 100);

  const getScoreRatingLabel = (score: number) => {
    switch (score) {
      case 5: return "ดีเยี่ยม (5)";
      case 4: return "ดีมาก (4)";
      case 3: return "ปานกลาง (3)";
      case 2: return "พอใช้ (2)";
      case 1: return "ควรปรับปรุง (1)";
      default: return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setIsSubmitting(true);
    try {
      const evaluationData: SatisfactionScores = {
        accuracy: scores.accuracy,
        timeliness: scores.timeliness,
        quality: scores.quality,
        attentiveness: scores.attentiveness,
        ownership: scores.ownership,
        averagePercent,
        comment: comment.trim(),
        evaluatedBy: evaluatedBy.trim(),
        evaluatedAt: new Date().toISOString()
      };

      await onSave(evaluationData);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to save satisfaction scores:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
              <Star size={20} className="fill-white" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  แบบประเมินความพึงพอใจการให้บริการ (5 มิติ)
                </h3>
                {readOnly && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/80 text-slate-600 flex items-center gap-1 border border-slate-300">
                    <Lock size={10} /> โหมดดูอย่างเดียว (เฉพาะ Admin แก้ไขได้)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                ประเมินผลงานสำหรับงาน: <span className="font-semibold text-slate-700">{brief.project_name || "ชิ้นงาน"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Task & Assignee Summary Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-slate-50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">ผู้รับผิดชอบงาน (Assignee)</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <User size={13} className="text-amber-600" />
                {assigneeName || "ทีม Creative / Content"}
              </span>
            </div>
            {brief.requester_email && (
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">ผู้สั่งงาน (Requester)</span>
                <span className="font-medium text-slate-700 font-mono mt-0.5 block truncate max-w-[200px]">
                  {brief.requester_email}
                </span>
              </div>
            )}
          </div>

          {/* Real-time Percentage Badge */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase">คะแนนประเมินเฉลี่ย</div>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          
          <div className="space-y-4">
            {SATISFACTION_CRITERIA.map((criterion, idx) => {
              const currentVal = (scores as any)[criterion.key] || 5;
              return (
                <div 
                  key={criterion.id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl hover:border-amber-200 hover:bg-amber-50/20 transition-all space-y-2"
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
                          title={readOnly ? `คะแนน ${starVal} ดาว (ดูได้อย่างเดียว)` : `ให้คะแนน ${starVal} ดาว`}
                        >
                          <Star 
                            size={22} 
                            className={`${isSelected ? "fill-amber-400 text-amber-500" : "fill-transparent"}`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comments & Suggestions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-primary" />
              ข้อเสนอแนะเพิ่มเติม (Feedback / Suggestions)
            </label>
            <textarea
              rows={3}
              value={comment}
              readOnly={readOnly}
              disabled={readOnly}
              onChange={(e) => {
                if (!readOnly) setComment(e.target.value);
              }}
              placeholder={readOnly ? "ไม่มีข้อเสนอแนะเพิ่มเติม" : "ระบุข้อคิดเห็น ข้อเสนอแนะ หรือคำชมเชยเพื่อนำไปพัฒนาการทำงานของทีมต่อไป..."}
              className={`w-full text-xs border border-slate-200 rounded-2xl p-3 leading-relaxed shadow-2xs ${
                readOnly
                  ? "bg-slate-50 text-slate-600 cursor-default"
                  : "bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400"
              }`}
            />
          </div>

          {/* Evaluator identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ผู้ประเมิน / บทบาท
              </label>
              <input
                type="text"
                value={evaluatedBy}
                readOnly={readOnly}
                disabled={readOnly}
                onChange={(e) => {
                  if (!readOnly) setEvaluatedBy(e.target.value);
                }}
                placeholder="เช่น PM ส้ม, ผู้สั่งงาน (Requester)"
                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-medium ${
                  readOnly
                    ? "bg-slate-50 text-slate-600 cursor-default"
                    : "bg-white focus:ring-1 focus:ring-amber-500 text-slate-800"
                }`}
              />
            </div>
            <div className="flex items-center text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              *คะแนนความพึงพอใจนี้จะถูกนำไปคำนวณเฉลี่ยในตัวชี้วัด R2, R4, R9 และ TIP10 ของทีมโดยอัตโนมัติ
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            {readOnly ? (
              <>
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                  <Lock size={12} className="text-slate-400 shrink-0" />
                  <span>สิทธิ์ผู้รับผิดชอบงาน (Assignee) ดูผลประเมินได้อย่างเดียว • เฉพาะ Admin ที่ประเมินและแก้ไขผลได้</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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
