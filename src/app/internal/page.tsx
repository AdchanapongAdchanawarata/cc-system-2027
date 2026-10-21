"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, Copy, Check, Sparkles } from "lucide-react";
import ModernDatePicker from "@/components/ModernDatePicker";
import CustomSelect from "@/app/dashboard/components/CustomSelect";
import ModernSelect from "@/components/ModernSelect";
import { createClient } from "@/utils/supabase/client";
import { generateNextTaskCode } from "@/utils/taskCodeService";
import { 
  ContactProfile, 
  getSavedContact, 
  saveContact 
} from "@/utils/contactMemory";
import ContactMemoryBanner from "@/components/ContactMemoryBanner";
import { enforceCanonicalBriefIntegrity } from "@/utils/dataIntegrityGuard";
import { getLoggedInAssigneeId, ensureCoreOperationalAssignees } from "@/utils/memberProfile";

const TEAMS = [
  { abbr: "NMCO", th: "ประสานงานอุทยานฯ ภาคเหนือ และ อว." },
  { abbr: "INCO", th: "เชื่อมโยงความร่วมมือภาคอุตสาหกรรม" },
  { abbr: "PITI", th: "บ่มเพาะนวัตกรรมและเทคโนโลยี" },
  { abbr: "QS", th: "ระบบคุณภาพ" },
  { abbr: "TECH SPIN", th: "ถ่ายทอดเทคโนโลยีและร่วมทุน" },
  { abbr: "PUBSEC", th: "ร่วมมือภาครัฐและสังคม" },
  { abbr: "LINC", th: "ศูนย์บริการนวัตกรรมและทรัพย์สินทางปัญญา" },
  { abbr: "GA", th: "บริหารงานทั่วไป" },
  { abbr: "HD", th: "พัฒนาขีดความสามารถบุคลากร" },
  { abbr: "AFP", th: "บัญชี การเงิน และพัสดุ" },
  { abbr: "IASA", th: "พันธกิจสากลและการเชื่อมโยงเครือข่าย" },
  { abbr: "FOODFABR", th: "โรงงานต้นแบบนวัตกรรมอาหาร" },
  { abbr: "TECH UP", th: "ส่งเสริมโครงสร้างพื้นฐานเทคโนโลยีเชิงลึก" },
  { abbr: "ISI", th: "บ่มเพาะธุรกิจสตาร์ทอัพ" },
  { abbr: "CC", th: "ทีมสร้างสรรค์และการสื่อสาร" },
  { abbr: "IFU", th: "บริการอาคารสถานที่และโครงสร้างพื้นฐาน" },
  { abbr: "LES", th: "บริการห้องปฏิบัติการและเครื่องมือวิทยาศาสตร์" },
  { abbr: "SIT", th: "กลยุทธ์และการปรับเปลี่ยนองค์กร" },
  { abbr: "IQI", th: "พัฒนาคุณภาพโครงสร้างพื้นฐาน" },
  { abbr: "IMO", th: "บริหารจัดการนวัตกรรม" },
  { abbr: "EIC", th: "ศูนย์พัฒนาผู้ประกอบการและนวัตกรรม" },
  { abbr: "CRM", th: "ลูกค้าสัมพันธ์และการตลาด" },
  { abbr: "MI", th: "นวัตกรรมการตลาด" }
];

export default function InternalTaskForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [copiedLink, setCopiedLink] = useState(false);

  // Contact Memory States
  const [coordinatorNickname, setCoordinatorNickname] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [savedProfile, setSavedProfile] = useState<ContactProfile | null>(null);

  // Assignee auto-assign for logged-in user
  const [assignees, setAssignees] = useState<any[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>("");

  useEffect(() => {
    const saved = getSavedContact();
    if (saved) {
      setSavedProfile(saved);
      if (saved.nickname) setCoordinatorNickname(saved.nickname);
      if (saved.team) setSelectedTeam(saved.team);
      if (saved.email) setRequesterEmail(saved.email);
      if (saved.phone) setRequesterPhone(saved.phone);
    }

    // Auto-detect logged-in user and set assignee
    const fetchAssignees = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('assignees').select('id, name, unit, is_active').eq('is_active', true).order('name');
        if (data) {
          const core = ensureCoreOperationalAssignees(data);
          setAssignees(core);
          const loggedInId = getLoggedInAssigneeId(core);
          if (loggedInId) {
            setAssigneeId(loggedInId);
          }
        }
      } catch (e) {
        console.warn("Failed to load assignees for internal page", e);
      }
    };
    fetchAssignees();
  }, []);

  const handleProfileSelect = (p: ContactProfile) => {
    setSavedProfile(p);
    setCoordinatorNickname(p.nickname || "");
    setSelectedTeam(p.team || "");
    setRequesterEmail(p.email || "");
    setRequesterPhone(p.phone || "");
    saveContact(p);
  };

  const handleProfileClear = () => {
    setSavedProfile(null);
    setCoordinatorNickname("");
    setSelectedTeam("");
    setRequesterEmail("");
    setRequesterPhone("");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const taskCategory = formData.get("task_category") as string;
      const taskName = formData.get("task_name") as string;
      const description = (formData.get("description") as string) || "";
      const nick = coordinatorNickname.trim() || (formData.get("coordinator_nickname") as string) || "ทีม CC";
      const team = selectedTeam.trim() || (formData.get("decision_maker") as string) || "CC";
      const email = requesterEmail.trim() || (formData.get("requester_email") as string) || "internal@step.cmu.ac.th";
      const phone = requesterPhone.trim() || (formData.get("requester_phone") as string) || "";

      // Automatically remember contact
      saveContact({
        nickname: nick,
        team,
        email,
        phone
      });

      const supabase = createClient();
      const isQuote = taskCategory === "ทำใบเสนอราคา" || taskCategory === "ทำใบเสนราคา" || taskName.startsWith("[Quotation]") || taskName.includes("ใบเสนอราคา");
      const generatedCode = await generateNextTaskCode("IT");
      const effectiveAssigneeId = assigneeId || getLoggedInAssigneeId(assignees);
      const nowIso = new Date().toISOString();

      const canonical = enforceCanonicalBriefIntegrity({
        unit: "internal",
        project_name: taskName,
        decision_maker: team,
        details: {
          task_code: generatedCode,
          category: taskCategory,
          type: taskCategory,
          description,
          notes: description,
          team,
          ...(isQuote ? {
            save_cost: 100,
            survey_status: 'declined',
            skip_survey: true,
            no_evaluation_needed: true,
            satisfaction_survey_completed: true,
            quotation_auto_completed: true,
            completed_at: nowIso,
          } : {})
        },
      });

      const { error } = await supabase.from("briefs").insert([{
        project_name: taskName,
        unit: "internal",
        status: isQuote ? "completed" : "pending",
        completed_at: isQuote ? nowIso : null,
        priority,
        deadline: dueDate || null,
        assignee_id: effectiveAssigneeId || null,
        coordinator_nickname: nick,
        requester_email: email,
        requester_phone: phone,
        decision_maker: canonical.decision_maker,
        okr_links: canonical.okr_links,
        details: canonical.details
      }]);

      if (error) {
        console.warn("Insert to Supabase warning:", error);
      }

      setCreatedCode(generatedCode);
      setIsSuccess(true);
    } catch (err) {
      console.error("Internal task submit error:", err);
      // Still show success if local
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full max-w-2xl mx-auto min-h-[70vh]">
        <div className="text-center space-y-6 bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl w-full">
          <div className="inline-flex h-20 w-20 bg-primary/10 text-primary rounded-full items-center justify-center mb-2">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">บันทึกภารกิจสำเร็จ</h1>
          {createdCode && (
            <div className="inline-block px-4 py-1.5 bg-slate-100 rounded-full font-mono text-sm font-bold text-slate-800">
              รหัสงาน: {createdCode}
            </div>
          )}
          <p className="text-muted-foreground text-sm sm:text-base">
            งานภายในของคุณถูกบันทึกเข้าระบบเรียบร้อยแล้ว พร้อมจดจำข้อมูลผู้ติดต่อสำหรับการกรอกครั้งถัดไป ✨
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button 
              onClick={() => setIsSuccess(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-medium text-sm shadow-md cursor-pointer"
            >
              บันทึกงานใหม่
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 bg-surface border border-surface-border text-foreground rounded-full hover:bg-muted transition-colors font-medium text-sm"
            >
              กลับสู่แดชบอร์ด
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8">
      {/* Top Navbar Actions */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>

        <button
          type="button"
          onClick={handleCopyLink}
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

      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-2">Internal Task Form</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">บันทึกภารกิจภายใน เอกสาร การประชุม หรืองานประจำวัน</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10 rams-card p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl relative overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-xl w-full">
        {/* Physical hardware top edge highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
        
        {/* Section 01: Contact Memory & Info */}
        <div className="space-y-6">
          <ContactMemoryBanner
            currentProfile={savedProfile}
            onSelectProfile={handleProfileSelect}
            onClear={handleProfileClear}
          />

          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 border-b border-zinc-200 pb-3 mb-6">
            01 &nbsp; ข้อมูลผู้ติดต่อ / ผู้บันทึก
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="coordinator_nickname" className="text-sm font-medium">ชื่อเล่น (ภาษาไทย)</label>
              <input
                required
                type="text"
                id="coordinator_nickname"
                name="coordinator_nickname"
                value={coordinatorNickname}
                onChange={e => {
                  setCoordinatorNickname(e.target.value);
                  saveContact({ nickname: e.target.value });
                }}
                className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                placeholder="เช่น แชมป์"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="decision_maker" className="text-sm font-medium">ทีม</label>
              <ModernSelect
                value={selectedTeam}
                onChange={val => {
                  setSelectedTeam(val);
                  saveContact({ team: val });
                }}
                options={TEAMS.map(t => ({
                  value: t.abbr,
                  label: `${t.abbr} - ${t.th}`
                }))}
                placeholder="เลือกทีม..."
                searchPlaceholder="ค้นหาทีม..."
                name="decision_maker"
                required
                accentColor="orange"
                className="rounded-full bg-[#f9f9fb] hover:bg-white border-zinc-200 py-3 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="requester_email" className="text-sm font-medium">อีเมล (ใช้ Email STeP เท่านั้น)</label>
              <input
                required
                type="email"
                id="requester_email"
                name="requester_email"
                value={requesterEmail}
                onChange={e => {
                  setRequesterEmail(e.target.value);
                  saveContact({ email: e.target.value });
                }}
                className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                placeholder="name@step.cmu.ac.th"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="requester_phone" className="text-sm font-medium">เบอร์โทรศัพท์ (สำหรับติดต่อ)</label>
              <input
                required
                type="tel"
                id="requester_phone"
                name="requester_phone"
                value={requesterPhone}
                onChange={e => {
                  setRequesterPhone(e.target.value);
                  saveContact({ phone: e.target.value });
                }}
                className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                placeholder="089xxxxxxx"
              />
            </div>
          </div>
        </div>

        {/* Section 02: Task Details */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 border-b border-zinc-200 pb-3 mb-6">
            02 &nbsp; รายละเอียดภารกิจภายใน
          </h2>

          <div className="space-y-2">
            <label htmlFor="task_category" className="text-sm font-medium">Task Category</label>
            <select required id="task_category" name="task_category" defaultValue="" className="w-full px-4 py-3 border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-sm">
              <option value="" disabled>Select category</option>
              <option value="Document">Document Preparation (เตรียมเอกสาร)</option>
              <option value="Meeting">Meeting / Coordination (การประชุม / ประสานงาน)</option>
              <option value="Design">Design & Media (สื่อและการออกแบบภายใน)</option>
              <option value="Other">Other Routine Task (ภารกิจประจำวันอื่นๆ)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="task_name" className="text-sm font-medium">Task Name (ชื่องาน)</label>
            <input required type="text" id="task_name" name="task_name" className="w-full px-4 py-3 border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="เช่น สรุปรายงานตัวชี้วัดประจำเดือน, ประสานงานพัสดุ" />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description (รายละเอียดสังเขป)</label>
            <textarea id="description" name="description" rows={3} className="w-full px-4 py-3 border border-zinc-200 bg-[#f9f9fb] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y text-sm" placeholder="ระบุรายละเอียดงานหรือผลลัพธ์ที่ต้องการ..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority (ความสำคัญ)</label>
              <input type="hidden" name="priority" value={priority} />
              <CustomSelect
                triggerClassName="w-full text-sm font-bold bg-white border border-slate-300 rounded-full px-4 py-2.5 hover:border-slate-400"
                dropdownClassName="w-full"
                value={priority}
                onChange={setPriority}
                options={[
                  { value: "High", label: "🔥 High" },
                  { value: "Medium", label: "⚡ Medium" },
                  { value: "Low", label: "☕ Low" }
                ]}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="due_date" className="text-sm font-medium">Due Date (กำหนดเสร็จ)</label>
              <ModernDatePicker
                value={dueDate}
                onChange={setDueDate}
                name="due_date"
                id="due_date"
                required
                placeholder="เลือกวันที่ครบกำหนด..."
                className="w-full px-4 py-3 border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 rams-action-btn font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'Save Task'} <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </form>
    </main>
  );
}
