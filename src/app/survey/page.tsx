"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { ArrowRight, CheckCircle2, Star, MessageSquare, Award, Sparkles, Building2, Briefcase, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface DimensionItem {
  id: "accuracy" | "timeliness" | "quality" | "attentiveness" | "ownership";
  title: string;
  subtitle: string;
  desc: string;
}

const DIMENSIONS: DimensionItem[] = [
  {
    id: "accuracy",
    title: "1. ความถูกต้องสมบูรณ์ของงาน (Accuracy)",
    subtitle: "ตรงตามข้อกำหนดและบรีฟ",
    desc: "ชิ้นงานมีความถูกต้อง สมบูรณ์ของข้อมูล ครบถ้วนตามเป้าหมายของบรีฟ ไม่มีความผิดพลาดซ้ำซ้อน"
  },
  {
    id: "timeliness",
    title: "2. ความตรงต่อเวลาและกำหนดส่งมอบ (Timeliness)",
    subtitle: "ตรงต่อเวลานัดหมาย",
    desc: "ส่งมอบงานดราฟต์และงานไฟนอลตรงตามเวลาที่ตกลงไว้ หรือแจ้งล่วงหน้าอย่างเหมาะสม"
  },
  {
    id: "quality",
    title: "3. คุณภาพงานและความคิดสร้างสรรค์ (Quality & Creativity)",
    subtitle: "ตอบโจทย์และมีมาตรฐานสูง",
    desc: "ชิ้นงานมีความสวยงาม โดดเด่น มีความคิดสร้างสรรค์ มีคุณค่า และตอบโจทย์การสื่อสารอย่างมีประสิทธิภาพ"
  },
  {
    id: "attentiveness",
    title: "4. การสื่อสารและการเอาใจใส่ (Attentiveness & Care)",
    subtitle: "กระตือรือร้นและใส่ใจ",
    desc: "การประสานงานมีความสุภาพ รวดเร็ว เอาใจใส่ รับฟังความคิดเห็น และให้คำแนะนำที่เป็นประโยชน์"
  },
  {
    id: "ownership",
    title: "5. ความเป็นเจ้าของงานและความรับผิดชอบ (Ownership)",
    subtitle: "มุ่งมั่นรับผิดชอบเชิงรุก",
    desc: "มีความรับผิดชอบต่องานสูง มุ่งมั่นทำให้งานสำเร็จลุล่วงด้วยดี และพร้อมแก้ไขปัญหาอย่างมืออาชีพ"
  }
];

// Dedicated Evaluation Dimensions specifically for Innovation Design Center (IDC) Consultation & Services
export const IDC_CONSULTATION_DIMENSIONS: DimensionItem[] = [
  {
    id: "accuracy",
    title: "1. ความรู้และความเชี่ยวชาญของผู้ให้คำปรึกษา (Expertise & Knowledge)",
    subtitle: "ตรงจุด ชัดเจน และเป็นมืออาชีพ",
    desc: "ผู้ให้คำปรึกษามีความรู้ ความเชี่ยวชาญ ตอบข้อซักถามได้ตรงประเด็น และให้คำแนะนำเชิงลึกอย่างเป็นมืออาชีพ"
  },
  {
    id: "timeliness",
    title: "2. การจัดสรรเวลาและความตรงต่อเวลา (Timeliness & Punctuality)",
    subtitle: "ตรงต่อเวลานัดหมาย",
    desc: "การเริ่มและสิ้นสุดการให้คำปรึกษาตรงตามเวลาที่นัดหมาย มีการบริหารจัดการเวลาอย่างมีประสิทธิภาพ"
  },
  {
    id: "quality",
    title: "3. ประโยชน์และความสามารถในการนำไปใช้จริง (Practical Applicability)",
    subtitle: "ตอบโจทย์สถานประกอบการ",
    desc: "ข้อเสนอแนะ แนวคิด และแนวทางการแก้ปัญหาสามารถนำไปประยุกต์ใช้ในการพัฒนาผลิตภัณฑ์/บรรจุภัณฑ์/ธุรกิจได้จริง"
  },
  {
    id: "attentiveness",
    title: "4. การสื่อสาร ความเป็นมิตร และความเอาใจใส่ (Communication & Attentiveness)",
    subtitle: "สุภาพ เข้าใจง่าย และใส่ใจ",
    desc: "ผู้ให้คำปรึกษาและเจ้าหน้าที่สื่อสารด้วยความสุภาพ อธิบายเข้าใจง่าย รับฟังบริบทและปัญหาของสถานประกอบการอย่างตั้งใจ"
  },
  {
    id: "ownership",
    title: "5. ภาพรวมความพึงพอใจต่อการเข้ารับคำปรึกษา (Overall Consultation Experience)",
    subtitle: "ประทับใจและพร้อมแนะนำต่อ",
    desc: "ภาพรวมความพึงพอใจต่อการเข้ารับคำปรึกษาในครั้งนี้ และความยินดีที่จะกลับมาใช้บริการซ้ำหรือแนะนำสถานประกอบการอื่น"
  }
];

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  5: { label: "ดีเยี่ยม (5)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  4: { label: "ดีมาก (4)", color: "text-blue-600 bg-blue-50 border-blue-200" },
  3: { label: "ปานกลาง (3)", color: "text-amber-600 bg-amber-50 border-amber-200" },
  2: { label: "พอใช้ (2)", color: "text-orange-600 bg-orange-50 border-orange-200" },
  1: { label: "ควรปรับปรุง (1)", color: "text-rose-600 bg-rose-50 border-rose-200" }
};

function SlideToSubmit({ isSubmitting }: { isSubmitting: boolean }) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const maxDrag = 54;

  useEffect(() => {
    if (!isSubmitting && isUnlocked) {
      setIsUnlocked(false);
      setDragOffset(0);
    }
  }, [isSubmitting, isUnlocked]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSubmitting || isUnlocked) return;
    dragStartX.current = e.clientX - dragOffset;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const newOffset = e.clientX - dragStartX.current;
    if (newOffset >= 0 && newOffset <= maxDrag) {
      setDragOffset(newOffset);
    } else if (newOffset > maxDrag) {
      setDragOffset(maxDrag);
    } else {
      setDragOffset(0);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    dragStartX.current = null;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (dragOffset >= maxDrag * 0.75) {
      setDragOffset(maxDrag);
      setIsUnlocked(true);
      const form = e.currentTarget.closest("form");
      if (form) {
        const hiddenSubmit = form.querySelector('button[type="submit"].hidden-submit') as HTMLButtonElement;
        if (hiddenSubmit) hiddenSubmit.click();
      }
    } else {
      setDragOffset(0);
    }
  };

  const isActive = isUnlocked || isSubmitting;
  const isAtEnd = dragOffset >= maxDrag;
  const fillWidth = isActive ? 110 : (dragOffset === 0 ? 0 : dragOffset + 56);

  return (
    <div className="pt-8 pb-6 flex flex-col items-center justify-center group select-none">
      <div
        className={`relative w-[110px] h-[56px] rounded-full flex items-center p-1 cursor-grab active:cursor-grabbing touch-none bg-[#e4e4e7] overflow-hidden ${
          !isDragging && "transition-all duration-300"
        } ${
          isActive
            ? "shadow-[0_0_15px_3px_rgba(255,75,75,0.5),inset_0_2px_6px_rgba(0,0,0,0.1)]"
            : "shadow-[inset_0_2px_6px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(255,255,255,0.5)]"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Dynamic Red Fill */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-[#ff4b4b] rounded-full pointer-events-none"
          style={{
            width: `${fillWidth}px`,
            transition: !isDragging ? "width 300ms ease-in-out" : "none",
            opacity: dragOffset > 0 || isActive ? 1 : 0
          }}
        ></div>

        <div
          className={`relative z-10 w-[48px] h-[48px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,1)] flex items-center justify-center transform ${
            !isDragging && "transition-transform duration-300"
          }`}
          style={{ transform: `translateX(${isActive ? maxDrag : dragOffset}px)` }}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 rounded-full border-2 border-[#ff4b4b] border-t-transparent animate-spin"></div>
          ) : (
            <ArrowRight
              size={20}
              className={`${isActive || isAtEnd ? "text-[#ff4b4b]" : "text-[#a1a1aa]"} transition-colors duration-300`}
              strokeWidth={2.5}
            />
          )}
        </div>
      </div>

      <span className="mt-6 text-[16px] font-medium text-muted-foreground tracking-wide group-hover:text-foreground transition-colors duration-300">
        {isSubmitting ? "กำลังบันทึกผลการประเมิน..." : "เลื่อนเพื่อส่งแบบประเมิน"}
      </span>
      <button type="submit" className="hidden-submit hidden" disabled={isSubmitting}></button>
    </div>
  );
}

function SurveyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || searchParams.get("token") || "";
  const briefId = searchParams.get("b") || "";
  const paramProject = searchParams.get("p") || searchParams.get("project") || "";
  const paramTeam = searchParams.get("team") || searchParams.get("dept") || "";
  const paramBy = searchParams.get("by") || searchParams.get("evaluator") || "";

  // Check if this is dedicated Innovation Design Center (IDC) Consultation Survey
  const isIdc = searchParams.get("type") === "idc";
  const clientParam = searchParams.get("client") || "";
  const companyParam = searchParams.get("company") || "";
  const serviceParam = searchParams.get("service") || "";

  const [projectName, setProjectName] = useState(paramProject);
  const [team, setTeam] = useState(paramTeam);
  const [clientName, setClientName] = useState(clientParam);
  const [companyName, setCompanyName] = useState(companyParam);
  const [serviceName, setServiceName] = useState(serviceParam);
  const [evaluatedBy, setEvaluatedBy] = useState(paramBy || (isIdc ? clientParam || "ผู้ประกอบการผู้รับบริการ" : ""));
  const [isPrefilled, setIsPrefilled] = useState(Boolean(paramProject || briefId || clientParam));

  // Google Form Fields
  // ส่วนที่ 1 ข้อมูลทั่วไป
  const [gender, setGender] = useState<"ชาย" | "หญิง" | "ไม่ต้องการระบุ">("ไม่ต้องการระบุ");
  const [stakeholderRole, setStakeholderRole] = useState<string>(() => {
    const b = (paramBy || "").toLowerCase();
    if (b.includes("ผู้บริหาร") || b.includes("exec")) return "ผู้บริหาร";
    if (b.includes("มช") || b.includes("มหาวิทยาลัย") || b.includes("cmu")) return "มหาวิทยาลัยเชียงใหม่";
    if (b.includes("ผู้ประกอบการ") || b.includes("สตาร์ทอัพ") || b.includes("เอกชน") || b.includes("partner")) return "ภาคเอกชน / ภาคอุตสาหกรรม";
    if (b.includes("พันธมิตร")) return "พันธมิตรภายนอก / หน่วยงานที่ร่วมมือ";
    if (b.includes("อบรม") || b.includes("ผู้เข้าร่วม")) return "ผู้เข้าร่วมโครงการ / อบรม";
    return "พนักงาน";
  });

  // ส่วนที่ 2 แบบสำรวจความต้องการ-ความคาดหวัง
  const [needs, setNeeds] = useState<string>("");
  const [expectations, setExpectations] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string>("");
  const [comment, setComment] = useState("");

  const activeDimensions = isIdc ? IDC_CONSULTATION_DIMENSIONS : DIMENSIONS;

  const [scores, setScores] = useState({
    accuracy: 5,
    timeliness: 5,
    quality: 5,
    attentiveness: 5,
    ownership: 5
  });

  const [hoverScores, setHoverScores] = useState<Record<string, number>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);

  // Load project details if briefId or token is given
  useEffect(() => {
    async function loadInfo() {
      if (!briefId && !token) {
        setIsLoading(false);
        return;
      }
      try {
        const query = new URLSearchParams();
        if (briefId) query.set("b", briefId);
        if (token) query.set("t", token);

        const res = await fetch(`/api/survey?${query.toString()}`);
        const result = await res.json();
        if (result.success && result.data) {
          if (result.data.projectName) {
            setProjectName(result.data.projectName);
            setIsPrefilled(true);
          }
          if (result.data.team) setTeam(result.data.team);
          if (result.data.evaluatedBy) setEvaluatedBy(result.data.evaluatedBy);
          if (result.data.alreadyEvaluated) {
            setAlreadyEvaluated(true);
            if (result.data.existingScores) {
              setScores({
                accuracy: result.data.existingScores.accuracy || 5,
                timeliness: result.data.existingScores.timeliness || 5,
                quality: result.data.existingScores.quality || 5,
                attentiveness: result.data.existingScores.attentiveness || 5,
                ownership: result.data.existingScores.ownership || 5
              });
              if (result.data.existingScores.comment) {
                setComment(result.data.existingScores.comment);
              }
              if (result.data.existingScores.needs) {
                setNeeds(result.data.existingScores.needs);
              }
              if (result.data.existingScores.expectations) {
                setExpectations(result.data.existingScores.expectations);
              }
              if (result.data.existingScores.suggestions) {
                setSuggestions(result.data.existingScores.suggestions);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load survey project info:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadInfo();
  }, [briefId, token]);

  const totalPoints = scores.accuracy + scores.timeliness + scores.quality + scores.attentiveness + scores.ownership;
  const maxPoints = 25;
  const averagePercent = Math.round((totalPoints / maxPoints) * 100);

  const getOverallGrade = (pct: number) => {
    if (pct >= 90) return { text: "ดีเยี่ยม (Excellent)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (pct >= 80) return { text: "ดีมาก (Very Good)", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (pct >= 70) return { text: "ปานกลาง (Good)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (pct >= 60) return { text: "พอใช้ (Fair)", color: "text-orange-700 bg-orange-50 border-orange-200" };
    return { text: "ควรปรับปรุง (Needs Improvement)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const handleScoreChange = (dim: "accuracy" | "timeliness" | "quality" | "attentiveness" | "ownership", val: number) => {
    setScores(prev => ({ ...prev, [dim]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (isIdc) {
        const avgStar = parseFloat((totalPoints / 5).toFixed(1));
        const evalTime = new Date().toLocaleString("th-TH");

        // 1. Update Supabase Brief
        try {
          const supabase = createClient();
          const { data: bList } = await supabase
            .from('briefs')
            .select('id, details')
            .or(`details->>survey_token.eq.${token},details->>idc_code.eq.${projectName}`);
          if (bList && bList.length > 0) {
            for (const b of bList) {
              await supabase.from('briefs').update({
                details: {
                  ...(b.details || {}),
                  satisfaction_score: avgStar,
                  satisfaction_feedback: (suggestions || comment).trim() || "พึงพอใจต่อการให้คำปรึกษา",
                  satisfaction_evaluated_at: evalTime,
                  survey_sent: true,
                  gender,
                  stakeholder_role: stakeholderRole,
                  needs: needs.trim(),
                  expectations: expectations.trim()
                }
              }).eq('id', b.id);
            }
          }
        } catch (dbErr) {
          console.error("Failed to update IDC brief in Supabase:", dbErr);
        }

        // 2. Fallback to localStorage
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("cc_idc_records_v1");
            if (raw) {
              const list = JSON.parse(raw);
              const updated = list.map((item: any) => {
                if (item.code === projectName || item.surveyToken === token) {
                  return {
                    ...item,
                    satisfactionScore: avgStar,
                    satisfactionFeedback: (suggestions || comment).trim() || "พึงพอใจต่อการให้คำปรึกษา",
                    satisfactionEvaluatedAt: evalTime,
                    surveySent: true
                  };
                }
                return item;
              });
              localStorage.setItem("cc_idc_records_v1", JSON.stringify(updated));
            }
          } catch (err) {
            console.error("Failed to update IDC local storage:", err);
          }
        }
      } else {
        const payload = {
          briefId: briefId || undefined,
          token: token || undefined,
          projectName: projectName.trim() || undefined,
          scores,
          gender,
          stakeholderRole,
          needs: needs.trim(),
          expectations: expectations.trim(),
          suggestions: (suggestions || comment).trim(),
          comment: (suggestions || comment).trim(),
          evaluatedBy: (evaluatedBy || stakeholderRole || "ผู้มีส่วนได้ส่วนเสีย").trim()
        };

        const res = await fetch("/api/survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกผลการประเมิน");
        }

        // Save into local storage for immediate dashboard display
        if (typeof window !== "undefined") {
          try {
            const rawResp = localStorage.getItem("cc_stakeholder_survey_responses_v1");
            const respList = rawResp ? JSON.parse(rawResp) : [];
            respList.unshift({
              briefId: briefId || projectName,
              projectName: projectName || "ชิ้นงานสร้างสรรค์",
              gender,
              stakeholderRole,
              needs: needs.trim(),
              expectations: expectations.trim(),
              suggestions: (suggestions || comment).trim(),
              scores,
              averagePercent,
              submittedAt: new Date().toLocaleString("th-TH")
            });
            localStorage.setItem("cc_stakeholder_survey_responses_v1", JSON.stringify(respList.slice(0, 50)));
          } catch (e) {
            console.error(e);
          }
        }
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "ไม่สามารถส่งแบบประเมินได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Screen
  if (isSubmitted) {
    const grade = getOverallGrade(averagePercent);
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-zinc-200 shadow-xl text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 flex items-center justify-center shadow-[-6px_-6px_12px_rgba(255,255,255,1),6px_6px_12px_rgba(0,0,0,0.06)]">
            <CheckCircle2 size={52} className="text-emerald-500" strokeWidth={2} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900">
              ส่งแบบสำรวจและประเมินสำเร็จ
            </h2>
            <p className="text-sm md:text-base text-zinc-600 max-w-lg mx-auto leading-relaxed">
              <strong>ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication: CC)</strong> อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP) ขอขอบพระคุณสำหรับข้อมูลความต้องการ ความคาดหวัง และข้อคิดเห็นอันมีค่ายิ่ง ทางทีมงานจะนำผลไปพัฒนา ยกระดับคุณภาพการให้บริการให้เกิดประโยชน์สูงสุดต่อท่านอย่างต่อเนื่องครับ
            </p>
          </div>

          {/* Score Recap Card */}
          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 max-w-md mx-auto space-y-3">
            <div className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              ผลสรุปคะแนนประเมินความพึงพอใจการให้บริการ 5 มิติ
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-extrabold text-zinc-900">{averagePercent}%</span>
              <span className="text-sm text-zinc-500 font-medium">({totalPoints} / {maxPoints} คะแนน)</span>
            </div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold border">
              <span className={grade.color + " px-2.5 py-0.5 rounded-full border"}>{grade.text}</span>
            </div>
            {(projectName || companyName) && (
              <div className="text-xs text-zinc-600 truncate pt-2 border-t border-zinc-200/60 mt-3">
                <span>โครงการ/ชิ้นงาน: <strong className="text-zinc-800">{projectName || companyName}</strong></span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <p className="text-xs text-zinc-400 font-medium">
              ทีมสร้างสรรค์และการสื่อสาร (CC TEAM) • อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CMU STeP)
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentGrade = getOverallGrade(averagePercent);

  return (
    <>
      {/* Top Header Section (Rams Neomorphic Circular Icon & Official CC Team Branding) */}
      <div className="mb-8 max-w-3xl mx-auto px-4 md:px-0">
        <div className="flex flex-col md:flex-row items-center gap-5">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#ffffff] to-[#e5e5e5] border border-zinc-300 flex items-center justify-center shadow-[-8px_-8px_16px_rgba(255,255,255,1),8px_8px_16px_rgba(0,0,0,0.08),inset_0px_2px_4px_rgba(255,255,255,1),inset_0px_-2px_4px_rgba(0,0,0,0.05)] relative shrink-0">
              <Star size={40} className="text-amber-500 fill-amber-400" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex flex-col text-center md:text-left">
            <h1 className="text-2xl md:text-3xl lg:text-[34px] font-black tracking-tight leading-tight text-zinc-900">
              แบบสำรวจความต้องการและความคาดหวังของผู้มีส่วนได้ส่วนเสียต่อทีม CC
            </h1>
            <p className="text-sm md:text-base text-zinc-600 font-semibold mt-1.5 flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
              <span className="text-rose-600 font-bold">ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication: CC)</span>
              <span className="text-zinc-400">•</span>
              <span>อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)</span>
            </p>
          </div>
        </div>

        {/* Intro Note matching Google Form */}
        <div className="mt-6 p-4 md:p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm text-xs md:text-sm text-zinc-600 leading-relaxed space-y-1.5">
          <div className="flex items-start gap-2.5">
            <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-900">
                วัตถุประสงค์แบบสำรวจ:
              </span>{" "}
              แบบสำรวจนี้ จัดทำขึ้นมีวัตถุประสงค์ เพื่อสอบถามความต้องการ ความคาดหวังของผู้มีส่วนได้ส่วนเสีย ต่อการให้บริการของทีมสร้างสรรค์และการสื่อสาร (CC TEAM) เพื่อที่ทีมจะสามารถนำข้อมูลไปวิเคราะห์และปรับปรุงกระบวนการทำงานให้สอดคล้องกับความต้องการของผู้มีส่วนได้ส่วนเสียได้อย่างมีประสิทธิภาพมากยิ่งขึ้น (ตามมาตรฐาน ISO 9001:2015 ข้อ 4.2)
            </div>
          </div>
        </div>

        {alreadyEvaluated && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <Award size={16} className="text-amber-600 shrink-0" />
            <span>งานนี้เคยได้รับการประเมินแล้ว การส่งซ้ำจะเป็นการอัปเดตข้อมูลและคะแนนล่าสุด</span>
          </div>
        )}
      </div>

      {/* Main Survey Form */}
      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto px-4 md:px-0">

        {/* ===================================================================== */}
        {/* ส่วนที่ 1 ข้อมูลทั่วไปของผู้ตอบแบบสำรวจ                                */}
        {/* ===================================================================== */}
        <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2">
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
              <span className="text-zinc-900">ส่วนที่ 1</span> ข้อมูลทั่วไปของผู้ตอบแบบสำรวจ
            </h2>
            {isPrefilled && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>ระบุข้อมูลอัตโนมัติเรียบร้อยแล้ว</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* เพศ */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-800 block">
                เพศ <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-0.5">
                {(["ชาย", "หญิง", "ไม่ต้องการระบุ"] as const).map(g => (
                  <label 
                    key={g} 
                    className={`flex items-center gap-2 cursor-pointer text-sm font-medium px-4 py-2.5 rounded-xl border transition-all ${
                      gender === g 
                        ? "bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-2xs" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="accent-[#e03131] w-4 h-4 cursor-pointer"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ตำแหน่ง / กลุ่มผู้มีส่วนได้ส่วนเสีย */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-800 block">
                ตำแหน่ง / กลุ่มผู้มีส่วนได้ส่วนเสีย <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { val: "ผู้บริหาร", label: "ผู้บริหาร (Executive Management)" },
                  { val: "พนักงาน", label: "พนักงาน (บุคลากรภายใน STeP)" },
                  { val: "มหาวิทยาลัยเชียงใหม่", label: "มหาวิทยาลัยเชียงใหม่ (คณะ/สถาบัน/สำนัก)" },
                  { val: "ภาคเอกชน / ภาคอุตสาหกรรม", label: "ภาคเอกชน / ภาคอุตสาหกรรม (Startups/SMEs)" },
                  { val: "ผู้เข้าร่วมโครงการ / อบรม", label: "ผู้เข้าร่วมโครงการ / อบรม" },
                  { val: "พันธมิตรภายนอก / หน่วยงานที่ร่วมมือ", label: "พันธมิตรภายนอก / หน่วยงานที่ร่วมมือ" }
                ].map(opt => (
                  <label
                    key={opt.val}
                    className={`flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-medium p-3 rounded-xl border transition-all ${
                      stakeholderRole === opt.val
                        ? "bg-rose-50/80 border-rose-300 text-rose-900 font-bold shadow-2xs"
                        : "bg-zinc-50/60 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="stakeholderRole"
                      value={opt.val}
                      checked={stakeholderRole === opt.val}
                      onChange={() => setStakeholderRole(opt.val)}
                      className="accent-[#e03131] w-4 h-4 shrink-0 cursor-pointer"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ชื่องาน / โครงการที่ขอรับบริการ */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="projectName" className="text-sm font-bold text-zinc-800 flex items-center justify-between">
                <span>ชื่องาน / โครงการที่เกี่ยวข้อง <span className="text-rose-500">*</span></span>
                {projectName && (
                  <span className="text-[11px] text-emerald-600 font-medium">✓ ข้อมูลจากระบบ CC</span>
                )}
              </label>
              <input
                id="projectName"
                type="text"
                required
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="เช่น ออกแบบ Key Visual กิจกรรม Demo Day, จัดทำวิดีโอประชาสัมพันธ์ ฯลฯ"
                className={`w-full px-4 py-3 text-sm border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all ${
                  projectName ? "bg-[#f4f7fb] border-slate-300 font-semibold text-zinc-900" : "bg-[#f9f9fb] border-zinc-200"
                }`}
              />
            </div>

            {/* สังกัด / ฝ่ายงานของผู้ขอรับบริการ */}
            <div className="space-y-2">
              <label htmlFor="team" className="text-sm font-bold text-zinc-800">
                สังกัด / ฝ่ายงานของผู้ขอรับบริการ
              </label>
              <input
                id="team"
                type="text"
                value={team}
                onChange={e => setTeam(e.target.value)}
                placeholder="เช่น ฝ่ายพัฒนาธุรกิจ, RSP หรือ คณะ/หน่วยงานภายนอก"
                className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-[#f9f9fb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all text-zinc-800"
              />
            </div>

            {/* ชื่อผู้ให้ข้อมูล / อีเมล (ทางเลือก) */}
            <div className="space-y-2">
              <label htmlFor="evaluatedBy" className="text-sm font-bold text-zinc-800">
                ชื่อผู้ให้ข้อมูล / อีเมลติดต่อ (ระบุหรือไม่ก็ได้)
              </label>
              <input
                id="evaluatedBy"
                type="text"
                value={evaluatedBy}
                onChange={e => setEvaluatedBy(e.target.value)}
                placeholder="เช่น คุณกมลรัตน์ หรืออีเมล user@step.cmu.ac.th"
                className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl bg-[#f9f9fb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all text-zinc-800"
              />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ส่วนที่ 2 แบบสำรวจความต้องการ-ความคาดหวัง                              */}
        {/* ===================================================================== */}
        <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
              <span className="text-zinc-900">ส่วนที่ 2</span> แบบสำรวจความต้องการ-ความคาดหวัง
            </h2>
          </div>

          {/* 3 Textareas */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900 flex items-center justify-between">
                <span>ความต้องการ (Needs) <span className="text-rose-500">*</span></span>
                <span className="text-xs text-zinc-400 font-normal">สิ่งที่จำเป็นต้องมีในการให้บริการ</span>
              </label>
              <textarea
                required
                rows={3}
                value={needs}
                onChange={e => setNeeds(e.target.value)}
                placeholder="ระบุสิ่งที่ท่านต้องการ เช่น ความถูกต้องตรงตามบรีฟ, ส่งมอบงานตรงเวลา, มีมาตรฐาน CI, สื่อตรงตามวัตถุประสงค์โครงการ..."
                className="w-full p-3.5 text-sm border border-zinc-200 rounded-2xl bg-[#f9f9fb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all text-zinc-800 leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900 flex items-center justify-between">
                <span>ความคาดหวัง (Expectations) <span className="text-rose-500">*</span></span>
                <span className="text-xs text-zinc-400 font-normal">สิ่งที่ถ้ามีจะดีมาก / เสริมความประทับใจ</span>
              </label>
              <textarea
                required
                rows={3}
                value={expectations}
                onChange={e => setExpectations(e.target.value)}
                placeholder="ระบุสิ่งที่ท่านคาดหวังเพิ่มเติม เช่น ความคิดสร้างสรรค์ระดับประเทศ, มีเทมเพลตพร้อมใช้, คำแนะนำเชิงรุก, เทคนิคดีไซน์ภาพเคลื่อนไหวล้ำสมัย..."
                className="w-full p-3.5 text-sm border border-zinc-200 rounded-2xl bg-[#f9f9fb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all text-zinc-800 leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900 flex items-center justify-between">
                <span>ข้อเสนอแนะอื่น ๆ (Suggestions) <span className="text-rose-500">*</span></span>
                <span className="text-xs text-zinc-400 font-normal">เพื่อการปรับปรุงและพัฒนาบริการ</span>
              </label>
              <textarea
                required
                rows={3}
                value={suggestions}
                onChange={e => setSuggestions(e.target.value)}
                placeholder="ข้อคิดเห็น ข้อเสนอแนะ หรือคำแนะนำเพิ่มเติมเพื่อยกระดับการให้บริการของทีม CC..."
                className="w-full p-3.5 text-sm border border-zinc-200 rounded-2xl bg-[#f9f9fb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all text-zinc-800 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ส่วนที่ 3 แบบประเมินความพึงพอใจการให้บริการ 5 มิติ (ISO 9001)           */}
        {/* ===================================================================== */}
        <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2">
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
                <span className="text-zinc-900">ส่วนที่ 3</span> ประเมินความพึงพอใจการให้บริการ 5 มิติ (คะแนน 1 - 5)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                ประเมินเพื่อติดตามเกณฑ์ KRI 1 และมาตรฐานคุณภาพ ISO 9001:2015 ข้อ 9.1.2
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">คะแนนรวม:</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                {totalPoints} / {maxPoints} ({averagePercent}%)
              </span>
            </div>
          </div>

          <div className="space-y-6 divide-y divide-zinc-100">
            {activeDimensions.map((dim) => {
              const currentScore = scores[dim.id];
              const activeVal = hoverScores[dim.id] || currentScore;
              return (
                <div key={dim.id} className="pt-5 first:pt-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="font-bold text-sm text-zinc-900">{dim.title}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{dim.desc}</div>
                    </div>
                  </div>

                  {/* Big Stars Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 md:gap-3 py-1">
                      {[1, 2, 3, 4, 5].map(starVal => {
                        const isLit = starVal <= activeVal;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => handleScoreChange(dim.id, starVal)}
                            onMouseEnter={() => setHoverScores(prev => ({ ...prev, [dim.id]: starVal }))}
                            onMouseLeave={() => setHoverScores(prev => ({ ...prev, [dim.id]: 0 }))}
                            className="p-1 cursor-pointer transition-transform duration-150 hover:scale-125 active:scale-95 focus:outline-none"
                            title={`${starVal} คะแนน: ${SCORE_LABELS[starVal]?.label}`}
                          >
                            <Star
                              size={38}
                              className={`transition-all duration-200 ${
                                isLit
                                  ? "fill-amber-400 text-amber-500 drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)]"
                                  : "fill-zinc-100 text-zinc-300 hover:text-amber-300"
                              }`}
                              strokeWidth={1.25}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <div className="shrink-0">
                      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${SCORE_LABELS[activeVal]?.color}`}>
                        {SCORE_LABELS[activeVal]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Progress Bar & Overall Indicator */}
          <div className="mt-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                ระดับความพึงพอใจรวม (Overall Satisfaction)
              </div>
              <div className="text-xs text-zinc-500">
                คำนวณจากค่าเฉลี่ย 5 มิติการให้บริการของทีม CC TEAM
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentGrade.color}`}>
                {currentGrade.text}
              </span>
              <span className="text-2xl font-black text-zinc-900 font-mono">
                {averagePercent}%
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* Slide To Submit Slider */}
        <SlideToSubmit isSubmitting={isSubmitting} />
      </form>
    </>
  );
}

export default function PublicSurveyPage() {
  return (
    <main className="flex-1 p-4 md:p-8 w-full max-w-4xl mx-auto py-10 md:py-14 min-h-screen">
      <Suspense fallback={<div className="flex justify-center p-12 text-zinc-400">กำลังโหลดแบบประเมิน...</div>}>
        <SurveyContent />
      </Suspense>
    </main>
  );
}
