"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  X,
  PenTool,
  Video,
  Mic,
  Award,
  Sparkles,
  MapPin,
  ExternalLink,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Layers,
  Phone,
  Mail,
  CheckCircle2,
  Building2,
  Info
} from "lucide-react";

// Personnel metadata for all 3 operational branches
const BRANCH_DATA = [
  {
    id: "creative",
    num: "1",
    name: "ยูนิตงานออกแบบ",
    sub: "Creative Designer",
    count: "5 สมาชิก",
    icon: PenTool,
    members: [
      {
        fullName: "นางสาวรติพร กัลปพฤกษ์",
        firstName: "นางสาวรติพร",
        lastName: "กัลปพฤกษ์",
        nickname: "จอย",
        code: "RL",
        role: "พนักงานออกแบบสร้างสรรค์",
        phone: "061-5254255",
        email: "ratiporn.k@cmu.ac.th"
      },
      {
        fullName: "นางสาวอัจฉราภรณ์ ศักดาวงศ์เสรี",
        firstName: "นางสาวอัจฉราภรณ์",
        lastName: "ศักดาวงศ์เสรี",
        nickname: "พิม",
        code: "AC",
        role: "พนักงานออกแบบสร้างสรรค์",
        phone: "095-6356992",
        email: "autcharaporn.s@cmu.ac.th"
      },
      {
        fullName: "นางสาวลลิต์ภัทร เลิศลักขณาวัฒน์",
        firstName: "นางสาวลลิต์ภัทร",
        lastName: "เลิศลักขณาวัฒน์",
        nickname: "เยียร์",
        code: "LLP",
        role: "พนักงานออกแบบสร้างสรรค์",
        phone: "081-4684359",
        email: "lalipat.l@cmu.ac.th"
      },
      {
        fullName: "นางสาวมัทนิน ยงค์ไสว",
        firstName: "นางสาวมัทนิน",
        lastName: "ยงค์ไสว",
        nickname: "นิน",
        code: "MTN",
        role: "พนักงานออกแบบสร้างสรรค์",
        phone: "098-1529592",
        email: "matanin.y@cmu.ac.th"
      },
      {
        fullName: "นายอิศรา แก้วเรือง",
        firstName: "นายอิศรา",
        lastName: "แก้วเรือง",
        nickname: "ก้อง",
        code: "IK",
        role: "พนักงานออกแบบสร้างสรรค์",
        phone: "085-1093188",
        email: "itsara.k@cmu.ac.th"
      }
    ]
  },
  {
    id: "pr",
    num: "2",
    name: "ยูนิตสื่อสารองค์กร",
    sub: "Unit PR",
    count: "2 สมาชิก",
    icon: Mic,
    members: [
      {
        fullName: "นางสาวชนนิกานต์ บุญแก้ว",
        firstName: "นางสาวชนนิกานต์",
        lastName: "บุญแก้ว",
        nickname: "โอ๊ต",
        code: "CNB",
        role: "PR",
        phone: "088-8135494",
        email: "chonnikarn.b@cmu.ac.th"
      },
      {
        fullName: "นางสาวฐิติยา เข็มพล",
        firstName: "นางสาวฐิติยา",
        lastName: "เข็มพล",
        nickname: "ต้า",
        code: "TTY",
        role: "PR",
        phone: "090-0590926",
        email: "thitiya.kh@cmu.ac.th"
      }
    ]
  },
  {
    id: "content",
    num: "3",
    name: "ยูนิตผลิตสื่อสร้างสรรค์",
    sub: "Unit Content",
    count: "3 สมาชิก",
    icon: Video,
    members: [
      {
        fullName: "นางสาวกัลยกร อภิวงศ์",
        firstName: "นางสาวกัลยกร",
        lastName: "อภิวงศ์",
        nickname: "แก้วก่อ",
        code: "KYK",
        role: "Content Creator",
        phone: "090-3174818",
        email: "kanyakorn.a@cmu.ac.th"
      },
      {
        fullName: "นางสาวสุทธิอาภา คุ้มครอง",
        firstName: "นางสาวสุทธิอาภา",
        lastName: "คุ้มครอง",
        nickname: "ลูกอิน",
        code: "STK",
        role: "Content Creator",
        phone: "087-1910010",
        email: "suthiarpa.k@cmu.ac.th"
      },
      {
        fullName: "นางสาวศิริลักษณ์ กันจะนะ",
        firstName: "นางสาวศิริลักษณ์",
        lastName: "กันจะนะ",
        nickname: "เอ็นจอย",
        code: "SLR",
        role: "Content Creator",
        phone: "083-6249641",
        email: "Siriluk.k@cmu.ac.th"
      }
    ]
  }
];

interface AboutTeamModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export default function AboutTeamModal({
  isOpen: controlledIsOpen,
  onOpenChange,
  showTrigger = true
}: AboutTeamModalProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"tree" | "units" | "article">("tree");
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleOpen = () => {
    if (isControlled) {
      onOpenChange?.(true);
    } else {
      setInternalIsOpen(true);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button - Clean Minimalist Pill matching Track Status, cursor pointer & reliable click */}
      {showTrigger && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOpen();
          }}
          className="flex items-center justify-center text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors bg-surface px-3 py-1.5 sm:px-5 sm:py-2 rounded-full border border-surface-border shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md cursor-pointer select-none active:scale-95 relative z-30 pointer-events-auto whitespace-nowrap"
          style={{ cursor: "pointer" }}
          title="ผังโครงสร้างและบทบาทหน้าที่ทีม CC"
        >
          About Team
        </button>
      )}

      {/* Rendered via Portal directly to body to prevent ANY CSS stacking context issues */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          
          {/* Solid Opaque Backdrop Blur */}
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md transition-opacity"
            onClick={handleClose}
          />

          {/* Dieter Rams Minimalist Modal Container */}
          <div className="relative bg-[#FAFAFA] text-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-neutral-300 overflow-hidden flex flex-col max-h-[92vh] z-10">
            
            {/* Header: Dieter Rams Industrial Aesthetic */}
            <div className="bg-white border-b border-neutral-200 px-6 py-4.5 shrink-0 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200">
                    ORGANIZATIONAL STRUCTURE &amp; PHILOSOPHY
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">•</span>
                  <span className="text-[11px] font-mono font-semibold text-neutral-600 hidden sm:inline">
                    STeP Chiang Mai University
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 flex items-center gap-2">
                  <span>ทีม CC (Creative and Communication)</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full border border-neutral-200 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="ปิด (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sub-Header: Functional Capsule Navigation (เฉลี่ย 3 หัวข้อให้สมดุลเท่ากัน) */}
            <div className="bg-neutral-100/80 border-b border-neutral-200 px-4 sm:px-6 py-2 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                {[
                  { id: "tree", label: "1. ผังโครงสร้างแบบ Root Tree", icon: GitBranch },
                  { id: "units", label: "2. หน้าที่ 3 ยูนิตหลัก", icon: Layers },
                  { id: "article", label: "3. ปรัชญาและบทความทีม", icon: BookOpen },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                        isActive
                          ? "bg-white text-neutral-900 shadow-2xs border border-neutral-300"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60 border border-transparent"
                      }`}
                    >
                      <Icon size={14} className={isActive ? "text-[#E03131]" : "text-neutral-400"} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

              {/* ========================================================================= */}
              {/* TAB 1: CIRCULAR ROOT TREE (ผังโหนดวงกลมเชื่อมต่อกัน)                       */}
              {/* ========================================================================= */}
              {activeTab === "tree" && (
                <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto">
                  
                  {/* Top Header */}
                  <div className="text-center space-y-1 pb-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#E03131] uppercase">
                      CIRCULAR HIERARCHICAL NETWORK
                    </span>
                    <h3 className="text-lg sm:text-2xl font-black text-neutral-900">
                      ผังโครงสร้างบุคลากรทีมสร้างสรรค์และการสื่อสาร (CC)
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-lg mx-auto">
                      ผังโครงสร้างวงกลมเชื่อมต่อสายงาน (Circular Network Org Chart) พร้อมข้อมูลชื่อจริง ชื่อเล่น ตัวย่อ เบอร์โทร และอีเมล
                    </p>
                  </div>

                  {/* Root Tree Diagram Container */}
                  <div className="p-4 sm:p-6 rounded-3xl bg-neutral-50/60 border border-neutral-200 shadow-2xs space-y-1">
                    
                    {/* ROOT LEVEL & LEADERSHIP (COMPACT CIRCULAR NODES) */}
                    <div className="flex flex-col items-center">
                      
                      {/* ROOT NODE: ทีมสร้างสรรค์และการสื่อสาร */}
                      <div className="w-28 h-28 sm:w-32 sm:h-32 aspect-square rounded-full bg-neutral-950 text-white flex flex-col items-center justify-center text-center p-2 border-2 border-neutral-800 shadow-xs mx-auto hover:scale-105 transition-transform">
                        <span className="text-[8px] font-mono text-neutral-400 block uppercase tracking-wider font-bold">
                          ROOT NODE
                        </span>
                        <h4 className="text-[11px] sm:text-xs font-black tracking-tight leading-tight mt-0.5 text-white">
                          ทีมสร้างสรรค์<br />และการสื่อสาร
                        </h4>
                        <span className="text-[8.5px] font-mono text-neutral-400 mt-0.5">CC TEAM</span>
                      </div>

                      {/* Connecting Line from Root to Executive Management */}
                      <div className="w-0.5 h-3 bg-neutral-300 mx-auto" />

                      {/* EXECUTIVE MANAGEMENT: ผศ.ดร.สุริยะ ทองมุณี (อยู่บนจ๊อบ เป็นบริหารทีม) */}
                      <div className="w-44 h-44 sm:w-48 sm:h-48 aspect-square rounded-full bg-white border-2 border-purple-900/80 shadow-xs flex flex-col items-center justify-center text-center p-3 relative mx-auto hover:border-purple-600 transition-all hover:scale-[1.02]">
                        <span className="text-[8px] font-bold tracking-wide text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full mb-1">
                          บริหารทีม
                        </span>
                        <h5 className="text-xs sm:text-[13px] font-black text-neutral-900 leading-tight flex flex-col items-center">
                          <span className="whitespace-nowrap">ผศ.ดร.สุริยะ</span>
                          <span className="whitespace-nowrap">ทองมุณี</span>
                        </h5>
                        <span className="text-[7.5px] text-neutral-400 font-medium block leading-tight mt-0.5">
                          Asst. Prof. Dr. Suriyah Thongmunee
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] font-mono font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded-full border border-neutral-200">
                            อ.บ่าว
                          </span>
                          <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200">
                            ST
                          </span>
                        </div>
                        <span className="text-[8px] text-neutral-500 font-medium mt-0.5 max-w-[145px] truncate text-center">
                          รองผู้อำนวยการ (Deputy Director)
                        </span>
                        <div className="mt-1 pt-1 border-t border-neutral-100 flex flex-col items-center gap-0.5 text-[8.5px] font-mono">
                          <a href="tel:0982696564" className="text-neutral-700 hover:text-neutral-900 font-bold flex items-center gap-1">
                            <Phone size={8.5} className="text-purple-600" />
                            <span>098-2696564</span>
                          </a>
                          <a href="mailto:suriyah@step.cmu.ac.th" className="text-neutral-500 hover:text-purple-600 flex items-center gap-0.5 text-[8px] truncate max-w-[140px]" title="suriyah@step.cmu.ac.th">
                            <Mail size={8.5} className="text-neutral-400 shrink-0" />
                            <span className="truncate">suriyah@step.cmu.ac.th</span>
                          </a>
                        </div>
                      </div>

                      {/* Connecting Line from Executive to Team Leader */}
                      <div className="w-0.5 h-3 bg-neutral-300 mx-auto" />

                      {/* LEVEL 1: TEAM LEADER (หัวหน้าทีม) */}
                      <div className="w-44 h-44 sm:w-48 sm:h-48 aspect-square rounded-full bg-white border-2 border-neutral-900 shadow-xs flex flex-col items-center justify-center text-center p-3 relative mx-auto hover:border-[#E03131] transition-all hover:scale-[1.02]">
                        <span className="text-[8px] font-bold tracking-wide text-[#E03131] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full mb-1">
                          หัวหน้าทีม
                        </span>
                        <h5 className="text-xs sm:text-[13px] font-black text-neutral-900 leading-tight flex flex-col items-center">
                          <span className="whitespace-nowrap">นายอัจชนะพงษ์</span>
                          <span className="whitespace-nowrap">อัจชนะวราทา</span>
                        </h5>
                        <span className="text-[7.5px] text-neutral-400 font-medium block leading-tight mt-0.5">
                          Adchanapong Adchanawarata
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] font-mono font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded-full border border-neutral-200">
                            จ๊อบ
                          </span>
                          <span className="text-[9px] font-mono font-bold text-[#E03131] bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
                            AA
                          </span>
                        </div>
                        <span className="text-[8px] text-neutral-500 font-medium mt-0.5 max-w-[145px] truncate text-center">
                          หัวหน้าทีมสร้างสรรค์และสื่อสาร
                        </span>
                        <div className="mt-1 pt-1 border-t border-neutral-100 flex flex-col items-center gap-0.5 text-[8.5px] font-mono">
                          <a href="tel:0624166396" className="text-neutral-700 hover:text-neutral-900 font-bold flex items-center gap-1">
                            <Phone size={8.5} className="text-[#E03131]" />
                            <span>062-4166396</span>
                          </a>
                          <a href="mailto:adchanapong.a@cmu.ac.th" className="text-neutral-500 hover:text-[#E03131] flex items-center gap-0.5 text-[8px] truncate max-w-[140px]" title="adchanapong.a@cmu.ac.th">
                            <Mail size={8.5} className="text-neutral-400 shrink-0" />
                            <span className="truncate">adchanapong.a@cmu.ac.th</span>
                          </a>
                        </div>
                      </div>

                      {/* Connecting Line from Leader to Assistant Leader */}
                      <div className="w-0.5 h-3 bg-neutral-300 mx-auto" />

                      {/* LEVEL 2: ASSISTANT LEADER (ผู้ช่วยหัวหน้าทีม ถัดลงมา) */}
                      <div className="w-44 h-44 sm:w-48 sm:h-48 aspect-square rounded-full bg-white border-2 border-blue-600 shadow-xs flex flex-col items-center justify-center text-center p-3 relative mx-auto hover:border-neutral-900 transition-all hover:scale-[1.02]">
                        <span className="text-[8px] font-bold tracking-wide text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full mb-1">
                          ผู้ช่วยหัวหน้าทีม
                        </span>
                        <h5 className="text-xs sm:text-[13px] font-black text-neutral-900 leading-tight flex flex-col items-center">
                          <span className="whitespace-nowrap">นางสาววาสิตา</span>
                          <span className="whitespace-nowrap">กอบธัญกิจ</span>
                        </h5>
                        <span className="text-[7.5px] text-neutral-400 font-medium block leading-tight mt-0.5">
                          Wasita Kobtanyakit
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] font-mono font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded-full border border-neutral-200">
                            วา
                          </span>
                          <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                            WK
                          </span>
                        </div>
                        <span className="text-[8px] text-neutral-500 font-medium mt-0.5 max-w-[145px] truncate text-center">
                          ผู้ช่วยหัวหน้าทีมสร้างสรรค์และสื่อสาร
                        </span>
                        <div className="mt-1 pt-1 border-t border-neutral-100 flex flex-col items-center gap-0.5 text-[8.5px] font-mono">
                          <a href="tel:0851071229" className="text-neutral-700 hover:text-neutral-900 font-bold flex items-center gap-1">
                            <Phone size={8.5} className="text-blue-600" />
                            <span>085-1071229</span>
                          </a>
                          <a href="mailto:wasita.k@cmu.ac.th" className="text-neutral-500 hover:text-blue-600 flex items-center gap-0.5 text-[8px] truncate max-w-[140px]" title="wasita.k@cmu.ac.th">
                            <Mail size={8.5} className="text-neutral-400 shrink-0" />
                            <span className="truncate">wasita.k@cmu.ac.th</span>
                          </a>
                        </div>
                      </div>

                      {/* Connecting Line Down to Horizontal Branch Bar */}
                      <div className="w-0.5 h-4 bg-neutral-300 mx-auto hidden md:block" />
                      
                      {/* Horizontal Branch Bar */}
                      <div className="w-[84%] h-0.5 bg-neutral-300 hidden md:block" />
                    </div>

                    {/* MOBILE VIEW (< md): 3 DISTINCT UNIT CLUSTERS (NO MISLEADING VERTICAL STACK) */}
                    <div className="block md:hidden w-full max-w-lg mx-auto pt-2 space-y-3.5">
                      <div className="flex flex-col items-center my-2">
                        <div className="w-0.5 h-3 bg-neutral-300" />
                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          3 ยูนิตปฏิบัติการ (3 Core Units)
                        </span>
                      </div>

                      {BRANCH_DATA.map((branch) => {
                        const Icon = branch.icon;
                        return (
                          <div 
                            key={branch.id} 
                            className="bg-neutral-50/90 rounded-2xl p-3.5 border border-neutral-200/90 shadow-2xs space-y-3"
                          >
                            {/* Unit Header Banner */}
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-200/80">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <Icon size={14} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-[#E03131]">ยูนิตที่ {branch.num}</span>
                                    <h4 className="text-xs font-black text-neutral-900 leading-tight">{branch.name}</h4>
                                  </div>
                                  <span className="text-[10px] font-mono text-neutral-500 block">{branch.sub}</span>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-neutral-600 bg-white px-2 py-0.5 rounded-full border border-neutral-200 shrink-0 font-bold">
                                {branch.count}
                              </span>
                            </div>

                            {/* Member Peer Cards Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {branch.members.map((m, idx) => (
                                <div 
                                  key={m.code}
                                  className={`bg-white rounded-xl p-2.5 border border-neutral-200 shadow-2xs flex flex-col items-center text-center hover:border-neutral-400 transition-colors ${
                                    branch.members.length === 3 && idx === 2 ? "col-span-2 max-w-[200px] mx-auto w-full" : ""
                                  }`}
                                >
                                  <span className="text-[8px] font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200/80 px-2 py-0.5 rounded-full mb-1 leading-none block max-w-full truncate text-center">
                                    {m.role}
                                  </span>
                                  <h6 className="text-[11px] font-black text-neutral-900 mt-0.5 px-0.5 leading-tight flex flex-col items-center">
                                    <span className="whitespace-nowrap">{m.firstName}</span>
                                    <span className="whitespace-nowrap">{m.lastName}</span>
                                  </h6>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[8.5px] font-mono font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.2 rounded-full border border-neutral-200">
                                      {m.nickname}
                                    </span>
                                    <span className="text-[8.5px] font-mono font-bold text-neutral-900 bg-neutral-200 px-1.5 py-0.2 rounded-full">
                                      {m.code}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 pt-1.5 border-t border-neutral-100 flex flex-col items-center gap-0.5 text-[8px] font-mono w-full px-0.5">
                                    <a
                                      href={`tel:${m.phone.replace(/-/g, "")}`}
                                      className="text-neutral-700 hover:text-neutral-900 font-semibold flex items-center gap-0.5"
                                    >
                                      <Phone size={7.5} className="text-neutral-400" />
                                      <span>{m.phone}</span>
                                    </a>
                                    <a
                                      href={`mailto:${m.email}`}
                                      className="text-neutral-500 hover:text-[#E03131] flex items-center gap-0.5 truncate max-w-[105px]"
                                      title={m.email}
                                    >
                                      <Mail size={7.5} className="text-neutral-400 shrink-0" />
                                      <span className="truncate">{m.email}</span>
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DESKTOP VIEW (>= md): 3 CORE BRANCHES (CIRCULAR NETWORK) */}
                    <div className="hidden md:grid md:grid-cols-3 gap-4 pt-1">
                      {BRANCH_DATA.map((branch) => {
                        const Icon = branch.icon;
                        return (
                          <div key={branch.id} className="relative flex flex-col items-center">
                            {/* Connecting Line from Horizontal Bar */}
                            <div className="w-0.5 h-3.5 bg-neutral-300 mx-auto hidden md:block" />

                            {/* Division Header Circle */}
                            <div className="w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-full bg-neutral-900 text-white flex flex-col items-center justify-center text-center p-2.5 border-2 border-neutral-700 shadow-xs mx-auto hover:scale-105 transition-transform">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mb-0.5 text-white">
                                <Icon size={12} />
                              </div>
                              <h4 className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">{branch.name}</h4>
                              <span className="text-[9px] font-mono text-neutral-400 block">{branch.sub}</span>
                              <span className="text-[8.5px] font-mono text-neutral-300 mt-0.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                {branch.count}
                              </span>
                            </div>

                            {/* Members Circular Chain */}
                            <div className="w-full flex flex-col items-center">
                              {branch.members.map((m) => (
                                <div key={m.code} className="flex flex-col items-center w-full">
                                  {/* Connector Line between circles */}
                                  <div className="w-0.5 h-2.5 bg-neutral-300 mx-auto" />

                                  {/* Member Circle Node - Exactly same size as leadership nodes */}
                                  <div className="w-44 h-44 sm:w-48 sm:h-48 aspect-square rounded-full bg-white border border-neutral-200 hover:border-neutral-900 shadow-2xs flex flex-col items-center justify-center text-center p-3 transition-all mx-auto group relative hover:scale-[1.02]">
                                    <span className="text-[8px] font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200/80 px-2.5 py-0.5 rounded-full mb-1 leading-none block max-w-[140px] truncate text-center">
                                      {m.role}
                                    </span>
                                    <h6 className="text-xs sm:text-[13px] font-black text-neutral-900 mt-0.5 px-1 leading-tight flex flex-col items-center">
                                      <span className="whitespace-nowrap">{m.firstName}</span>
                                      <span className="whitespace-nowrap">{m.lastName}</span>
                                    </h6>
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[9px] font-mono font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded-full border border-neutral-200">
                                        {m.nickname}
                                      </span>
                                      <span className="text-[9px] font-mono font-bold text-neutral-900 bg-neutral-200 px-1.5 py-0.5 rounded-full">
                                        {m.code}
                                      </span>
                                    </div>
                                    <div className="mt-1 pt-1 border-t border-neutral-100 flex flex-col items-center gap-0.5 text-[8.5px] font-mono w-full px-1">
                                      <a
                                        href={`tel:${m.phone.replace(/-/g, "")}`}
                                        className="text-neutral-700 hover:text-neutral-900 font-semibold flex items-center gap-0.5"
                                      >
                                        <Phone size={8} className="text-neutral-400" />
                                        <span>{m.phone}</span>
                                      </a>
                                      <a
                                        href={`mailto:${m.email}`}
                                        className="text-neutral-500 hover:text-[#E03131] flex items-center gap-0.5 truncate max-w-[130px]"
                                        title={m.email}
                                      >
                                        <Mail size={8} className="text-neutral-400 shrink-0" />
                                        <span className="truncate">{m.email}</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* Summary Bar */}
                  <div className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-center text-xs text-neutral-700 font-medium">
                    🤝 <strong>บูรณาการ 3 ยูนิต:</strong> ออกแบบและจัดวางภาพโดยยูนิต Designer • สนับสนุนข้อมูลโดยยูนิต PR • รังสรรค์งานเขียนโดยยูนิต Content
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: DETAILED ROLES OF 3 CORE UNITS (หน้าที่ความรับผิดชอบ 3 ยูนิต)       */}
              {/* ========================================================================= */}
              {activeTab === "units" && (
                <div className="space-y-5 animate-in fade-in duration-150 max-w-4xl mx-auto">
                  
                  <div className="text-center space-y-1 pb-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#E03131] uppercase">
                      CORE COMPETENCY &amp; SERVICE SPEC
                    </span>
                    <h3 className="text-lg sm:text-2xl font-black text-neutral-900">
                      บทบาทหน้าที่และขอบเขตบริการของทั้ง 3 ยูนิต
                    </h3>
                  </div>

                  {/* 1. Creative Designer */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                          <PenTool size={15} />
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-neutral-900">
                            1. สื่อสารผ่านงานออกแบบ : Creative Designer
                          </h4>
                          <span className="text-[11px] font-mono text-neutral-500">ยูนิตนักออกแบบสร้างสรรค์ (5 อัตรา)</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                        Visual Art
                      </span>
                    </div>

                    <div className="text-xs text-neutral-700 leading-relaxed space-y-2">
                      <p>
                        ยูนิตนักออกแบบ หรือ Designer คือผู้รับหน้าที่ให้บริการในส่วนของการสร้างสรรค์งานออกแบบ ไม่ว่าจะเป็นการออกแบบกราฟิก, ออกแบบตัวละคร, ออกแบบบรรจุภัณฑ์, ออกแบบภาพเคลื่อนไหว, ออกแบบนิทรรศการ ไปจนถึงการออกแบบสภาพแวดล้อม และการออกแบบภายใน เรียกว่าเกือบทุกประเภทงานศิลป์ที่รับรู้ได้ด้วยการมองเห็น (Visual Art) ยูนิต Designer สามารถถ่ายทอดโจทย์ออกมาได้ทั้งสิ้น
                      </p>
                      <p>
                        โดยงานส่วนใหญ่จะเน้นไปที่การออกแบบเพื่อแก้ปัญหา (Pain Point) ให้กับผู้ประกอบการและงานภายในองค์กร ด้วยจุดแข็งที่สามารถแก้โจทย์และคงไว้ซึ่งสุนทรียะของชิ้นงาน ทำให้ครั้งหนึ่งได้คว้าสุดยอดรางวัลการออกแบบยอดเยี่ยมจากเวที <strong>Good Design Award 2022</strong> ด้วยผลงานบรรจุภัณฑ์ที่ลดขยะจากการผลิตให้เหลือศูนย์ และย่อยสลายได้อย่างร้อยเปอร์เซ็นต์ นับเป็นการสร้างนวัตกรรมผ่านงานออกแบบเลยก็ว่าได้
                      </p>
                      <p>
                        นอกจากนี้ ยูนิต Designer ยังให้บริการในส่วนของการปรับภาพลักษณ์ธุรกิจ (Rebranding) สร้างสรรค์ผลงานและอยู่เบื้องหลังงานออกแบบที่โดดเด่นมาแล้วนับไม่ถ้วน
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-100 text-[11px] font-mono text-neutral-600">
                      {["Graphic Design", "Packaging", "Motion Graphic", "Exhibition & Interior", "Rebranding", "Good Design Award 2022"].map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-50 border border-neutral-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 2. PR Officer */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                          <Mic size={15} />
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-neutral-900">
                            2. สื่อสารผ่านข่าวและอีเว้นท์ : PR Officer
                          </h4>
                          <span className="text-[11px] font-mono text-neutral-500">ยูนิตสื่อสารองค์กร (2 อัตรา)</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                        Public Relations
                      </span>
                    </div>

                    <div className="text-xs text-neutral-700 leading-relaxed space-y-2">
                      <p>
                        ยูนิตสื่อสารองค์กร หรือ PR คือผู้รับหน้าที่วางแผนการประชาสัมพันธ์ให้กับ STeP ด้วยการสื่อสารภาพลักษณ์ที่ดี และเฝ้าระวังความเสี่ยงของการสื่อสารที่อาจนำมาสู่ความเสียหาย
                      </p>
                      <p>
                        โดย PR จะให้การรับผิดชอบในส่วนของการอัปเดตข่าวสารความเป็นไปของ STeP ในรายวันผ่านโซเชียลมีเดีย การเขียนคำโฆษณา การเขียนคำกล่าวรายงาน การเขียนสคริปต์พิธีกรในงานต่าง ๆ และการเขียนข่าวประชาสัมพันธ์ทางการ (Press Release) เพื่อเผยแพร่สู่ภายนอก รวมถึงการติดต่อประสานงานเครือข่ายสื่อมวลชน การจัดหาช่องทางลงสื่ออย่างเหมาะสม เพื่อการกระจายข่าวสู่วงกว้างอย่างมีประสิทธิภาพ
                      </p>
                      <p>
                        ไม่เพียงแค่งานข่าวเท่านั้น ยูนิต PR ยังให้การดูแลในส่วนของการจัดงานกิจกรรม (Event) และนิทรรศการต่าง ๆ อย่างครบวงจร ทั้งภายใน STeP และควบรวมไปถึงงานภายในมหาวิทยาลัยเชียงใหม่ โดยรับหน้าที่หลักในการประสานงานและดำเนินกิจกรรม รวมถึงดูแลภาพรวมขององค์ประกอบและการจัดวางสถานที่ร่วมกับยูนิต Designer
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-100 text-[11px] font-mono text-neutral-600">
                      {["Press Release", "Media Relations", "Crisis Prevention", "Daily Social Updates", "Event Organization", "MC Script"].map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-50 border border-neutral-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3. Content Creator */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                          <Video size={15} />
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-neutral-900">
                            3. สื่อสารผ่านการเล่าเรื่อง : Content Creator
                          </h4>
                          <span className="text-[11px] font-mono text-neutral-500">ยูนิตนักผลิตสื่อสร้างสรรค์ (3 อัตรา)</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                        Story &amp; Video
                      </span>
                    </div>

                    <div className="text-xs text-neutral-700 leading-relaxed space-y-2">
                      <p>
                        ยูนิตนักผลิตสื่อสร้างสรรค์ หรือ Content Creator คือผู้รับหน้าที่ในการบอกเล่าความเป็นไปของ STeP ในแง่มุมต่าง ๆ โดยใส่ลูกเล่นตรงนี้นิด ตรงนั้นหน่อย เพื่อให้สื่อที่ถ่ายทอดออกไปดึงดูดความสนใจ ช่วยให้ผู้รับสารสนุกกับเรื่องเล่าของ STeP ได้มากขึ้น
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                          <strong className="text-neutral-900 block mb-1">ส่วนของงานเขียน:</strong>
                          <span className="text-[11px] text-neutral-600">
                            การเขียนบทความ ย่อยเรื่องยากวิทยาศาสตร์ให้อ่านง่าย, บทความสัมภาษณ์, บทความโฆษณา, การเขียนสคริปต์วิดีโอ, และคำโปรย
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                          <strong className="text-neutral-900 block mb-1">ส่วนของงานวิดีโอ:</strong>
                          <span className="text-[11px] text-neutral-600">
                            การผลิตคลิปวิดีโอสั้น ทั้งถ่ายทำและตัดต่อ โปรโมตสินค้า โครงการ สถานที่ อัปเดตข่าววิทย์ และวิดีโอวิถีชีวิตชาว STeP
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-100 text-[11px] font-mono text-neutral-600">
                      {["Science Storytelling", "Copywriting", "Interview Articles", "Short-form Video", "Shooting & Editing", "STeP Life"].map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-50 border border-neutral-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: ARTICLE & PHILOSOPHY (บทความและปรัชญาการทำงานสไตล์ Dieter Rams)     */}
              {/* ========================================================================= */}
              {activeTab === "article" && (
                <div className="space-y-5 animate-in fade-in duration-150 max-w-3xl mx-auto">
                  
                  {/* Clean Editorial Title */}
                  <div className="border-b border-neutral-200 pb-4 space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                      ESSAY &amp; CREATIVE MANIFESTO
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight leading-snug">
                      ทีม CC Creative and Communication<br />
                      งานสื่อสารองค์กรวิทย์ฯ ของคนคิดนอกกรอบ
                    </h3>
                  </div>

                  {/* Quotation Frame */}
                  <div className="p-5 rounded-2xl bg-white border border-neutral-300 text-neutral-800 text-xs sm:text-sm leading-relaxed italic border-l-4 border-l-neutral-900 shadow-2xs">
                    "ลองจินตนาการเล่น ๆ ว่า ถ้าโมเนต์ต้องถ่ายทอดทฤษฎีสัมพัทธภาพของไอน์สไตน์ มันจะออกมาเป็นภาพวาดแบบไหน? หรือถ้าหากเปลี่ยนเป็นอากาธา คริสตี้ล่ะ? เราจะได้อ่านงานเขียนแบบใด หรือหากใกล้ตัวขึ้นมาอีกสักนิดอย่างพิธีกรรายการดังโหนกระแส คุณคิดว่าเขาจะเชิญใครมารายการเพื่อไขความกระจ่างเรื่องทฤษฎีนี้?"
                  </div>

                  {/* Body Paragraphs */}
                  <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-neutral-700">
                    <p>
                      ยิ่งเราแทนที่ด้วยบุคคลอื่น ๆ มากขึ้นเท่าไหร่ ก็จะยิ่งค้นพบว่าในความเป็นจริงแล้ว มีวิธีอีกมากมายหลายหลากเลยทีเดียว ในการสื่อสารประเด็นใดประเด็นหนึ่งที่มากกว่าบอกเล่าเป็นความเรียง แต่การจะเลือกสรรว่าอันไหนคือวิธีการที่ดีที่สุดนั้น อาจต้องย้อนกลับไปที่คำถามตั้งต้นที่ว่า <strong>‘แล้วเป้าหมายที่ต้องการสื่อสารคืออะไร’</strong>
                    </p>

                    <p>
                      และนั่นเป็นคำถามที่ <strong>ทีมสร้างสรรค์และการสื่อสาร (CC)</strong> ใช้เสมอมา ในฐานะทีมผู้รับหน้าที่เฉพาะทางด้านการออกแบบ สร้างสรรค์ และสื่อสาร ภายใต้องค์กรที่ทุกพลวัตมุ่งขับเคลื่อนให้เกิดการสร้างเทคโนโลยีและนวัตกรรมในทุกวัน อย่างอุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)
                    </p>

                    <p>
                      ด้วยขอบเขตงานที่กว้างและหลากหลายขององค์กร การสื่อสารในนิยามของทีม CC นั้นจึงไม่ได้จำกัดอยู่แค่การอธิบายเรื่องวิทยาศาสตร์ยาก ๆ อย่างทฤษฎีสัมพัทธภาพ หรือการประชาสัมพันธ์บอกเล่าความเป็นไปขององค์กรเท่านั้น แต่ยังรวมถึงการใช้ทุกองค์ประกอบในการออกแบบสร้างสรรค์เพื่อถ่ายทอดตัวตนและค่านิยมของ STeP ออกไปในทุกมิติ
                    </p>

                    <p>
                      การทำงานของทีม CC จึงมักเริ่มจากการคำถามในข้างต้น เพื่อให้รู้ ‘เป้าหมายและประเด็นที่ต้องการสื่อสาร’ จากนั้นจะรับหน้าที่ในการแปรสาร และรังสรรค์ออกมาเป็นชิ้นงานที่ตรงกับการสื่อสารมากที่สุด โดยไม่จำกัดรูปแบบและวิธีการ ซึ่งต้องอาศัยทักษะและความคิดสร้างสรรค์ ไปจนถึงการคิดออกจากกรอบเพื่อมองหาความเป็นไปได้ใหม่ ๆ อยู่เสมอ
                    </p>

                    <p>
                      ทีม CC จึงเป็นการรวมตัวของกลุ่มคนที่มีความถนัดในงานสร้างสรรค์ที่หลากหลาย คนที่เข้าใจเทรนด์ และประยุกต์ใช้เทรนด์เหล่านั้นกับงานของตัวเองได้อย่างดี โดยแบ่งการทำงานออกเป็น 3 ยูนิตหลัก ๆ ตามรูปแบบของการสื่อสาร ได้แก่ <strong>Creative Designer</strong>, <strong>PR Officer</strong>, และ <strong>Content Creator</strong>
                    </p>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                      <p className="text-xs font-medium text-neutral-800 leading-relaxed">
                        แม้มองเผิน ๆ งานของทีม CC ทั้งยูนิต Designer ยูนิต PR และยูนิต Content อาจแตกต่างกันตามความถนัดเฉพาะด้าน แต่ความต่างนั้นเองที่กลับสร้างจุดแข็งอย่างยิ่งให้กับทีม ด้วยทักษะของแต่ละยูนิตที่สามารถสนับสนุนงานของกันและกันได้อย่างลงตัว เช่นเดียวกับบทความที่ท่านกำลังอ่านอยู่นี้ ก็เกิดขึ้นจากการทำงานร่วมกันอย่างดีของทั้งสามยูนิต: <strong>ออกแบบและจัดวางภาพโดยยูนิต Designer • สนับสนุนข้อมูลโดยยูนิต PR • และรังสรรค์งานเขียนโดยยูนิต Content</strong>
                      </p>
                    </div>

                    <div className="text-center pt-3 pb-1">
                      <span className="text-sm sm:text-base font-black text-neutral-900 tracking-tight">
                        “แค่บอกมาว่าอยากสื่อสารอะไร เราจะสร้างสรรค์ให้ เพราะ STeP เราทำอะไรได้อีกเยอะ”
                      </span>
                    </div>
                  </div>
                </div>
              )}



            </div>

            {/* Dieter Rams Minimal Footer Bar */}
            <div className="bg-white border-t border-neutral-200 px-6 py-3.5 shrink-0 flex items-center justify-between text-xs text-neutral-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px]">CC SYSTEM 2027 • DIETER RAMS PHILOSOPHY</span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold transition-all cursor-pointer active:scale-95 text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
