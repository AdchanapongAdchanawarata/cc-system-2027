"use client";

import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, UploadCloud, X, PenTool, Video, Mic, Copy, Check, Link2, FileText, Trash2, AlertCircle, Flame, MessageCircle, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import { getStandardPriceForTask, getLeadTimeForTask } from "@/utils/pricing";
import { isTaskUrgent } from "@/utils/teamAnalytics";
import ModernDatePicker from "@/components/ModernDatePicker";
import ModernSelect from "@/components/ModernSelect";
import { generateNextTaskCode, getUnitPrefix } from "@/utils/taskCodeService";
import { getSavedContact, saveContact, ContactProfile } from "@/utils/contactMemory";
import ContactMemoryBanner from "@/components/ContactMemoryBanner";
import HalloweenBats from "@/components/HalloweenBats";
import { enforceCanonicalBriefIntegrity } from "@/utils/dataIntegrityGuard";

type UnitType = 'creative' | 'content' | 'pr';

const TEAMS = [
  { abbr: "NMCO", th: "ประสานงานอุทยานฯ ภาคเหนือ และ อว.", en: "RSP, North and MHESI Coordination Office" },
  { abbr: "INCO", th: "เชื่อมโยงความร่วมมือภาคอุตสาหกรรม", en: "Industry Collaboration Office" },
  { abbr: "PITI", th: "บ่มเพาะนวัตกรรมและเทคโนโลยี", en: "Potential Innovation and Technology Incubation" },
  { abbr: "QS", th: "ระบบคุณภาพ", en: "Quality System" },
  { abbr: "TECH SPIN", th: "ถ่ายทอดเทคโนโลยีและร่วมทุน", en: "Technology Transfer and Spin-off Company" },
  { abbr: "PUBSEC", th: "ร่วมมือภาครัฐและสังคม", en: "Public Sector Collaborative Project" },
  { abbr: "LINC", th: "ศูนย์บริการนวัตกรรมและทรัพย์สินทางปัญญา", en: "Linking Innovation to Market" },
  { abbr: "GA", th: "บริหารงานทั่วไป", en: "General Administration" },
  { abbr: "HD", th: "พัฒนาขีดความสามารถบุคลากร", en: "Human Resources Capacity Development" },
  { abbr: "AFP", th: "บัญชี การเงิน และพัสดุ", en: "Accounting, Finance, and Procurement" },
  { abbr: "IASA", th: "พันธกิจสากลและการเชื่อมโยงเครือข่าย", en: "International Affairs and Strategic Alliances" },
  { abbr: "FOODFABR", th: "โรงงานต้นแบบนวัตกรรมอาหาร", en: "Innovative Food Fabrication Pilot Plant" },
  { abbr: "TECH UP", th: "ส่งเสริมโครงสร้างพื้นฐานเทคโนโลยีเชิงลึก", en: "Deep-technology and Scale-Up Facility Support" },
  { abbr: "ISI", th: "บ่มเพาะธุรกิจสตาร์ทอัพ", en: "Innovative Startup Incubator" },
  { abbr: "CC", th: "ทีมสร้างสรรค์และการสื่อสาร", en: "Creative and Communication" },
  { abbr: "IFU", th: "บริการอาคารสถานที่และโครงสร้างพื้นฐาน", en: "Infrastructure & Facilities Utilization" },
  { abbr: "LES", th: "บริการห้องปฏิบัติการและเครื่องมือวิทยาศาสตร์", en: "Laboratory & Equipment Services" },
  { abbr: "SIT", th: "กลยุทธ์และการปรับเปลี่ยนองค์กร", en: "Strategy, Initiative and Transformation" },
  { abbr: "IQI", th: "พัฒนาคุณภาพโครงสร้างพื้นฐาน", en: "Infrastructure Quality Improvement" },
  { abbr: "IMO", th: "บริหารจัดการนวัตกรรม", en: "Innovation Management Office" },
  { abbr: "EIC", th: "ศูนย์พัฒนาผู้ประกอบการและนวัตกรรม", en: "Entrepreneurship & Innovation Center" },
  { abbr: "CRM", th: "ลูกค้าสัมพันธ์และการตลาด", en: "Customer Relationship Management" },
  { abbr: "MI", th: "นวัตกรรมการตลาด", en: "Market Innovation" }
];

function TeamDropdown({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const teamOptions = useMemo(() => {
    return TEAMS.map(team => ({
      value: team.abbr,
      label: `${team.abbr} - ${team.th}`,
      desc: team.en
    }));
  }, []);

  return (
    <ModernSelect
      value={value}
      onChange={onChange}
      options={teamOptions}
      placeholder="เลือกทีม..."
      searchPlaceholder="ค้นหาชื่อทีม (เช่น CC, PITI, บริหาร, บ่มเพาะ)..."
      name="decision_maker"
      required
      accentColor="orange"
      className="rounded-full bg-[#f9f9fb] hover:bg-white border-zinc-200 py-3 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
    />
  );
}

const CREATIVE_CATEGORIES = [
  { name: "Logo Design", desc: "ออกแบบตราสัญลักษณ์แบรนด์ พร้อมกำหนดสีและฟอนต์หลัก" },
  { name: "Key Visual (KV)", desc: "ออกแบบภาพสื่อสารหลัก (Mood & Tone) เพื่อใช้เป็นต้นแบบในการทำสื่ออื่นๆ ในแคมเปญ" },
  { name: "Print Poster / Flyer", desc: "ออกแบบใบปลิวหรือโปสเตอร์ 1 หน้า" },
  { name: "Brochure / Leaflet", desc: "ออกแบบแผ่นพับ 2-3 พับ (4-6 หน้า) จัดวางเนื้อหาและรูปภาพ" },
  { name: "Brackdrop (ฉากหลัง)", desc: "ออกแบบภาพกราฟิกขนาดใหญ่สำหรับฉากหลังถ่ายรูปในอีเวนต์" },
  { name: "Book Layout (≤10 หน้า)", desc: "วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนไม่เกิน 10 หน้า" },
  { name: "Book Layout (≥10 หน้า)", desc: "วางโครงสร้างหน้าและจัดอาร์ตเวิร์กเนื้อหาจำนวนมากกว่า 10 หน้า" },
  { name: "Packaging (ครบวงจร)", desc: "ออกแบบโครงสร้างกล่อง/บรรจุภัณฑ์เชิงซ้อน พร้อมกราฟิกทุกด้าน" },
  { name: "Website Full Design", desc: "ออกแบบหน้าตาเว็บไซต์ (UI/UX) ทุกหน้า (ไม่รวมการเขียนโปรแกรม)" },
  { name: "Exhibition Design (Small)", desc: "ออกแบบบูธหรือนิทรรศการขนาดเล็ก (พื้นที่ ≥10 ตร.ม.)" },
  { name: "3D Render Visualization", desc: "ปั้นโมเดลและเรนเดอร์ภาพเสมือนจริง 3 มิติ (ราคาต่อภาพ)" },
  { name: "Signage Design (Small/Big)", desc: "ออกแบบป้ายบอกทางหรือป้ายโฆษณา (ขนาดเล็ก/ขนาดใหญ่)" },
  { name: "ถ่ายภาพผลิตภัณฑ์ (Product Photography)", desc: "ถ่ายภาพสินค้าในสตูดิโอ จัดแสง จัดองค์ประกอบ (Styling) และรีทัชภาพเพื่อใช้ในสื่อโฆษณา" },
  { name: "ถ่ายภาพบุคคล (Portrait Photography)", desc: "ถ่ายภาพผู้บริหารหรือพนักงานในสตูดิโอ เพื่อใช้ในงาน PR หรือ Profile องค์กร พร้อมบริการรีทัชผิวและแสง" },
  { name: "Product Design", desc: "ออกแบบผลิตภัณฑ์เชิงสร้างสรรค์" },
  { name: "อื่นๆ (Others)", desc: "งานออกแบบหรือบริการอื่นๆ นอกเหนือจากที่ระบุไว้ (โปรดระบุรายละเอียดเพิ่มเติมในช่องเนื้อหา/ข้อความ)" },
];

const CONTENT_CATEGORIES = [
  { name: "Boost Post เพื่อประชาสัมพันธ์", desc: "การโปรโมตโพสต์เพื่อเพิ่มการเข้าถึงกลุ่มเป้าหมาย" },
  { name: "Creative Content Idea", desc: "คิดธีม/ไอเดีย/ Event & Campaign" },
  { name: "ถ่ายทำวิดีโอสั้น โปรโมตการบริการ", desc: "ถ่ายทำคลิปวิดีโอเพื่อนำเสนอหรือแนะนำบริการ" },
  { name: "ถ่ายทำวิดีโอสั้น มีการสัมภาษณ์", desc: "ถ่ายทำคลิปวิดีโอในรูปแบบการสัมภาษณ์บุคคล" },
  { name: "ถ่ายทำวิดีโอสั้น Talk Spective", desc: "ถ่ายทำคลิปพูดคุยหรือแชร์มุมมองในประเด็นต่างๆ" },
  { name: "บทความสั้น + ภาพประกอบ", desc: "ความยาว 300 - 500 คำ (โพสต์โซเชียล)" },
  { name: "บทความยาว + ภาพประกอบ", desc: "ความยาว 800 - 1,200 คำ (บทความ SEO/Blog)" },
  { name: "Copywriting / Storytelling", desc: "การเขียนคำโฆษณาหรือการเล่าเรื่องเพื่อดึงดูดความสนใจ" },
  { name: "ตัดต่อคลิปสั้น (Short-form)", desc: "ความยาว 15 - 60 วินาที (TikTok/Reels)" },
  { name: "อื่นๆ (โปรดระบุ)", desc: "งานบริการคอนเทนต์อื่นๆ นอกเหนือจากที่ระบุไว้ (โปรดระบุในรายละเอียด)" }
];

const PR_CATEGORIES = [
  { name: "ข่าวประชาสัมพันธ์บริการ (RSP)", desc: "ข่าวเครือข่าย RSP ภาคเหนือ" },
  { name: "ข่าวการประชาสัมพันธ์กิจกรรม/โครงการ (Pre PR)", desc: "การโปรโมทก่อนเริ่มงานหรือโครงการ" },
  { name: "ข่าวการจัดกิจกรรม/โครงการ", desc: "ข่าวรายงานผลการจัดกิจกรรมหรือโครงการ" },
  { name: "ข่าวการจัดประชุม/อบรม/สัมมนา", desc: "ข่าวงานประชุม การอบรม หรือสัมมนา" },
  { name: "ข่าวเกี่ยวกับผู้บริหาร", desc: "ข่าวภารกิจหรือการแถลงของผู้บริหาร" },
  { name: "ข่าวการรับรางวัล", desc: "ข่าวความสำเร็จหรือการรับรางวัลต่างๆ" },
  { name: "ข่าวศึกษาดูงาน", desc: "ข่าวการต้อนรับคณะศึกษาดูงาน" },
  { name: "Press Release (ข่าวแจกสื่อมวลชน)", desc: "เขียนข่าวประชาสัมพันธ์ภาษาไทยเพื่อส่งสื่อ" },
  { name: "Media Management (ดูแลสื่อมวลชน)", desc: "เชิญสื่อ, ดูแลหน้างาน, จัดการค่าเดินทาง/เบี้ยเลี้ยงสื่อ" },
  { name: "Stage Management (จัดการเวที)", desc: "จัดคิวเวที, ลำดับผู้กล่าว, ดูแลความเรียบร้อยพิธีการ" },
  { name: "MOU / Event Coverage", desc: "ถ่ายภาพ + เขียนข่าวสั้น + โพสต์โซเชียล" },
  { name: "สนับสนุนการจัดกิจกรรม (Support Event)", desc: "งานสนับสนุนและบริการสื่อสารอื่นๆ" },
  { name: "อื่นๆ (โปรดระบุ)", desc: "งานประชาสัมพันธ์อื่นๆ นอกเหนือจากที่ระบุ (โปรดระบุในรายละเอียด)" }
];

function CategoryDropdown({ 
  value, 
  onChange, 
  categories, 
  inputName = "details.category",
  placeholder = "เลือกประเภทงาน..."
}: { 
  value: string, 
  onChange: (val: string) => void, 
  categories: {name: string, desc: string}[], 
  inputName?: string,
  placeholder?: string
}) {
  return (
    <ModernSelect
      value={value}
      onChange={onChange}
      options={categories.map(cat => ({ 
        value: cat.name, 
        label: cat.name, 
        desc: cat.desc 
      }))}
      placeholder={placeholder}
      searchPlaceholder="ค้นหาประเภทงาน..."
      name={inputName}
      required
      accentColor="orange"
      className="rounded-full bg-[#f9f9fb] hover:bg-white border-zinc-200 py-3 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
    />
  );
}

function SlideToSubmit({ isSubmitting }: { isSubmitting: boolean }) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const maxDrag = 54; 
  const [isDragging, setIsDragging] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
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
      const form = e.currentTarget.closest('form');
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
  // Use 56 so that at maxDrag (54) the width is 110 (full width of container)
  const fillWidth = isActive ? 110 : (dragOffset === 0 ? 0 : dragOffset + 56);

  return (
    <div className="pt-8 pb-6 flex flex-col items-center justify-center group select-none">
      <div 
        className={`relative w-[110px] h-[56px] rounded-full flex items-center p-1 cursor-grab active:cursor-grabbing touch-none bg-[#e4e4e7] overflow-hidden ${!isDragging && 'transition-all duration-300'} ${isActive ? 'shadow-[0_0_15px_3px_rgba(255,75,75,0.5),inset_0_2px_6px_rgba(0,0,0,0.1)]' : 'shadow-[inset_0_2px_6px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(255,255,255,0.5)]'}`}
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
            transition: !isDragging ? 'width 300ms ease-in-out' : 'none',
            opacity: dragOffset > 0 || isActive ? 1 : 0
          }}
        ></div>

        <div 
          className={`relative z-10 w-[48px] h-[48px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,1)] flex items-center justify-center transform ${!isDragging && 'transition-transform duration-300'}`}
          style={{ transform: `translateX(${isActive ? maxDrag : dragOffset}px)` }}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 rounded-full border-2 border-[#ff4b4b] border-t-transparent animate-spin"></div>
          ) : (
            <ArrowRight size={20} className={`${isActive || isAtEnd ? 'text-[#ff4b4b]' : 'text-[#a1a1aa]'} transition-colors duration-300`} strokeWidth={2.5} />
          )}
        </div>
      </div>
      
      <span className="mt-6 text-[16px] font-medium text-muted-foreground tracking-wide group-hover:text-foreground transition-colors duration-300">
        {isSubmitting ? 'กำลังส่งข้อมูล...' : 'เลื่อนเพื่อส่งใบสั่งงาน'}
      </span>
      <button type="submit" className="hidden-submit hidden" disabled={isSubmitting}></button>
    </div>
  );
}

// Client-side image compression to speed up mobile uploads and save storage
async function compressImageIfNeeded(file: File, maxDimension = 1920, quality = 0.82): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }
  if (file.size <= 1.5 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function UrgentLeadTimeWarningBanner({
  timing,
  pastUrgentStats
}: {
  timing: {
    workingDays: number | null;
    requiredLeadTime: number;
    isUrgent: boolean;
    chosenCategory: string;
  };
  pastUrgentStats: { urgentCount: number; totalCount: number } | null;
}) {
  if (!timing.isUrgent || timing.workingDays === null) return null;

  return (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-xs">
          <Flame size={20} className="animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
              ⚡ งานด่วน (Urgent Task)
            </span>
            <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
              มีเวลาทำงาน <strong className="font-bold underline">{timing.workingDays} วัน</strong> (เกณฑ์มาตรฐาน {timing.requiredLeadTime} วันทำการ)
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-amber-900 dark:text-amber-100 mt-1.5 leading-relaxed font-normal">
            งานของท่านจัดเป็น <strong>งานด่วน</strong> เนื่องจากมีระยะเวลาทำงานสั้นกว่าเกณฑ์มาตรฐาน เมื่อกดยื่นใบสั่งงานแล้ว 
            <strong className="text-red-700 dark:text-red-400 underline decoration-red-400/60 underline-offset-2"> ควรแจ้งหัวหน้าทีม หรือผู้ช่วยหัวหน้าทีม CC ให้ทราบโดยตรงทันที</strong> เพื่อให้รีบจัดสรรคิวงานและดำเนินงานได้ทันตามกำหนด
          </p>
        </div>
      </div>

      {/* Direct Contact Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
        <div className="bg-white/70 dark:bg-zinc-900/70 rounded-xl p-2.5 border border-amber-200/40 dark:border-amber-800/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">หัวหน้าทีม CC</div>
            <div className="font-bold text-zinc-800 dark:text-zinc-100">จ๊อบ AA</div>
          </div>
          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-mono bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
            062-4166396
          </span>
        </div>
        <div className="bg-white/70 dark:bg-zinc-900/70 rounded-xl p-2.5 border border-amber-200/40 dark:border-amber-800/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">ผู้ช่วยหัวหน้าทีม CC</div>
            <div className="font-bold text-zinc-800 dark:text-zinc-100">วะ WK</div>
          </div>
          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-mono bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
            085-1071229
          </span>
        </div>
      </div>

      {/* History and Lead Time Coaching */}
      <div className="space-y-1.5 text-[11.5px] text-amber-900/90 dark:text-amber-200/90 bg-amber-100/40 dark:bg-amber-900/20 p-2.5 rounded-xl border border-amber-200/40">
        {pastUrgentStats && pastUrgentStats.urgentCount > 0 && (
          <div className="flex items-center gap-1.5 font-medium">
            <Clock size={13} className="text-amber-700 dark:text-amber-300 shrink-0" />
            <span>
              สถิติการสั่งงานของคุณ: เคยสั่งงานด่วนในระบบไปแล้ว <strong className="text-amber-900 dark:text-amber-100 font-bold">{pastUrgentStats.urgentCount} ครั้ง</strong> (จากทั้งหมด {pastUrgentStats.totalCount} งาน)
            </span>
          </div>
        )}
        <div className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-300">
          <span className="text-amber-600 dark:text-amber-400 shrink-0">💡</span>
          <span>
            <strong>คำแนะนำเรื่องระยะเวลา:</strong> หมวดงาน{timing.chosenCategory ? ` "${timing.chosenCategory}"` : ""} ควรเผื่อเวลาล่วงหน้าอย่างน้อย <strong>{timing.requiredLeadTime} วันทำการ</strong> เพื่อให้ทีมงานมีเวลาค้นคว้า วางแนวคิด และส่งมอบงานคุณภาพสูงสุด
          </span>
        </div>
      </div>
    </div>
  );
}

function FormContent() {
  const searchParams = useSearchParams();
  const unitParam = searchParams.get("unit") as UnitType;
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedContentCategory, setSelectedContentCategory] = useState("");
  const [selectedPRCategory, setSelectedPRCategory] = useState("");

  // Contact Profile Memory States
  const [coordinatorNickname, setCoordinatorNickname] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [savedProfile, setSavedProfile] = useState<ContactProfile | null>(null);

  useEffect(() => {
    const saved = getSavedContact();
    if (saved) {
      setSavedProfile(saved);
      if (saved.nickname) setCoordinatorNickname(saved.nickname);
      if (saved.team) setSelectedTeam(saved.team);
      if (saved.email) setRequesterEmail(saved.email);
      if (saved.phone) setRequesterPhone(saved.phone);
    }
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
  
  // Modern Date states
  const [creativeDraftDate, setCreativeDraftDate] = useState("");
  const [creativeUsageDate, setCreativeUsageDate] = useState("");
  const [contentPublishDate, setContentPublishDate] = useState("");
  const [prEventStart, setPrEventStart] = useState("");
  const [prEventEnd, setPrEventEnd] = useState("");
  const [prPublishDate, setPrPublishDate] = useState("");
  const [isApproved, setIsApproved] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeUnit, setActiveUnit] = useState<UnitType>(unitParam || 'creative');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/request?unit=${activeUnit}`;
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };
  
  useEffect(() => {
    if (unitParam === 'creative' || unitParam === 'content' || unitParam === 'pr') {
      setActiveUnit(unitParam);
    }
  }, [unitParam]);

  const supabase = createClient();

  const [pastUrgentStats, setPastUrgentStats] = useState<{ urgentCount: number; totalCount: number } | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    taskCode: string;
    projectName: string;
    isUrgent: boolean;
    workingDays: number | null;
    requiredLeadTime: number;
    urgentCount: number;
    category: string;
    coordinatorNickname: string;
    team: string;
    deadlineStr: string;
  } | null>(null);
  const [isCopiedLeadMsg, setIsCopiedLeadMsg] = useState(false);

  // Real-time query to check how many urgent briefs this requester has ordered
  useEffect(() => {
    const name = coordinatorNickname.trim();
    const email = requesterEmail.trim();
    if (!name && !email) {
      setPastUrgentStats(null);
      return;
    }

    let isMounted = true;
    const fetchPastUrgentStats = async () => {
      try {
        const orClauses: string[] = [];
        if (name) orClauses.push(`coordinator_nickname.ilike.${name}`);
        if (email) orClauses.push(`requester_email.ilike.${email}`);

        const { data, error } = await supabase
          .from('briefs')
          .select('id, created_at, deadline, priority, details, status')
          .or(orClauses.join(','))
          .limit(150);

        if (error || !data) return;

        let uCount = 0;
        data.forEach(b => {
          if (b.status !== 'cancelled' && isTaskUrgent(b as any)) {
            uCount++;
          }
        });

        if (isMounted) {
          setPastUrgentStats({
            urgentCount: uCount,
            totalCount: data.filter(b => b.status !== 'cancelled').length
          });
        }
      } catch (err) {
        console.error("Failed to query requester urgent stats:", err);
      }
    };

    const timer = setTimeout(fetchPastUrgentStats, 600);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [coordinatorNickname, requesterEmail]);

  // Real-time calculation of working days and standard lead time
  const currentTiming = useMemo(() => {
    const chosenCategory =
      activeUnit === 'creative' ? selectedCategory :
      activeUnit === 'content' ? selectedContentCategory :
      selectedPRCategory;

    const targetDateStr =
      activeUnit === 'creative' ? (creativeUsageDate || creativeDraftDate) :
      activeUnit === 'content' ? contentPublishDate :
      (prPublishDate || (prEventStart ? prEventStart.split(" ")[0] : ""));

    const requiredLeadTime = getLeadTimeForTask(activeUnit, chosenCategory);

    if (!targetDateStr) {
      return {
        targetDateStr: "",
        workingDays: null,
        requiredLeadTime,
        isUrgent: false,
        chosenCategory
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const match = String(targetDateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    let dueYear: number, dueMonth: number, dueDay: number;
    if (match) {
      dueYear = parseInt(match[1], 10);
      dueMonth = parseInt(match[2], 10) - 1;
      dueDay = parseInt(match[3], 10);
    } else {
      const d = new Date(targetDateStr);
      dueYear = d.getFullYear();
      dueMonth = d.getMonth();
      dueDay = d.getDate();
    }
    const dueDate = new Date(dueYear, dueMonth, dueDay);
    const msPerDay = 1000 * 60 * 60 * 24;
    const workingDays = Math.round((dueDate.getTime() - today.getTime()) / msPerDay);

    const isUrgent = workingDays <= 3 || workingDays < requiredLeadTime;

    return {
      targetDateStr,
      workingDays,
      requiredLeadTime,
      isUrgent,
      chosenCategory
    };
  }, [
    activeUnit,
    selectedCategory,
    selectedContentCategory,
    selectedPRCategory,
    creativeUsageDate,
    creativeDraftDate,
    contentPublishDate,
    prPublishDate,
    prEventStart
  ]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const coordinator_nickname = formData.get("coordinator_nickname") as string;
      const decision_maker = formData.get("decision_maker") as string;
      
      if (!decision_maker) {
        throw new Error("กรุณาเลือกทีม");
      }
      
      const category = formData.get("details.category") as string;
      if (activeUnit === 'creative' && !category) {
        throw new Error("กรุณาเลือกประเภทงาน");
      }
      const contentType = formData.get("details.type") as string;
      if (activeUnit === 'content' && !contentType) {
        throw new Error("กรุณาเลือกประเภทงาน");
      }

      const requester_email = formData.get("requester_email") as string;
      const requester_phone = formData.get("requester_phone") as string;
      const project_name = formData.get("project_name") as string;
      const notes = formData.get("notes") as string;

      // Automatically remember contact profile for future submissions across all forms
      saveContact({
        nickname: coordinator_nickname,
        team: decision_maker,
        email: requester_email,
        phone: requester_phone
      });

      // Determine category for standard pricing
      let chosenCategory = "";
      if (activeUnit === 'creative') chosenCategory = category;
      else if (activeUnit === 'content') chosenCategory = contentType;
      else if (activeUnit === 'pr') chosenCategory = (formData.get("details.service") as string) || "";

      // Automatically calculate standard price from back-office pricing catalog
      const standardSaveCost = getStandardPriceForTask(activeUnit, chosenCategory, project_name) || 0;

      // Extract details based on unit - Save Cost is automatically assigned from back-office standard rate
      // Note: General service requests generate Save Cost for internal units, NOT commercial PM revenue or profit
      const details: Record<string, any> = { 
        notes,
        save_cost: standardSaveCost,
        project_value: standardSaveCost.toString(),
        revenue: 0,
        cost: 0,
        profit: 0,
        is_pm_project: false
      };
      for (const [key, value] of formData.entries()) {
        if (key.startsWith("details.")) {
          const detailKey = key.split(".")[1];
          details[detailKey] = value;
        }
      }

      // Rule: งานของ NMCO คืองานของ RSP เสมอ ซึ่งเชื่อมโยงเข้า KR2 และ R3/R4 อัตโนมัติ (หากไม่ใช่ NMCO จะเป็น STeP ภายใน R1)
      const isNmco = (decision_maker || "").toUpperCase().includes("NMCO");
      const organization = isNmco ? "RSP" : "STeP";
      details.organization = organization;
      details.team = decision_maker;
      if (isNmco) {
        details.selected_okr = "KR2";
        details.okr_kr = "KR2";
        details.r_metrics = ["R3", "R4"];
        details.client_sector = "government";
        details.organization_type = "government";
      } else {
        details.selected_okr = "KR1";
        details.okr_kr = "KR1";
        details.r_metrics = ["R1", "R2"];
      }

      // Upload files (with automatic client-side compression for large images)
      const uploadedFileUrls: string[] = [];
      if (files.length > 0) {
        for (const rawFile of files) {
          const file = await compressImageIfNeeded(rawFile);
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${activeUnit}/${Date.now()}_${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('brief_attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error(`อัปโหลดไฟล์ล้มเหลว: ${file.name}`);
          }
          
          if (uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('brief_attachments')
              .getPublicUrl(filePath);
            uploadedFileUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      details.attachments = uploadedFileUrls;

      // Connect PR event datetime
      if (activeUnit === 'pr') {
        const fullEventDatetime = prEventEnd ? `${prEventStart} ถึง ${prEventEnd}` : prEventStart;
        if (fullEventDatetime) {
          details.event_datetime = fullEventDatetime;
          details.event_start = prEventStart;
          details.event_end = prEventEnd;
        }
        if (details.publish_date) {
          details.usage_date = details.publish_date;
        } else if (prEventStart) {
          details.usage_date = prEventStart.split(" ")[0];
        }
      }

      // CRITICAL RULE: วันที่เผยแพร่ (publish_date) ใน form คือ วันเดดไลน์ใน task เสมอ ห้ามผิดพลาดเด็ดขาด!
      // If publish_date is specified, it MUST be the primary deadline and usage_date
      if (details.publish_date) {
        details.usage_date = details.publish_date;
      }

      const computedDeadline = (
        details.publish_date || 
        details.usage_date || 
        details.delivery_date ||
        details.draft_date || 
        (details.event_datetime ? details.event_datetime.split(" ")[0] : null) || 
        null
      ) as string | null;

      // Generate guaranteed sequential task code for FY70 (e.g. DS70-1, CT70-1, PR70-1)
      const prefix = getUnitPrefix(activeUnit);
      const generatedTaskCode = await generateNextTaskCode(prefix);
      details.task_code = generatedTaskCode;

      // Check if this order is urgent
      const isUrgent = currentTiming.isUrgent;
      const urgentOrderCount = (pastUrgentStats?.urgentCount || 0) + (isUrgent ? 1 : 0);
      if (isUrgent) {
        details.is_urgent = true;
        details.lead_time_days = currentTiming.workingDays;
        details.required_lead_time_days = currentTiming.requiredLeadTime;
        details.urgent_order_count = urgentOrderCount;
        details.urgent_reason = `ระยะเวลาทำงาน ${currentTiming.workingDays} วัน น้อยกว่าเกณฑ์มาตรฐาน ${currentTiming.requiredLeadTime} วัน`;
      }

      // Enforce Ironclad Write-Time Integrity (OKR tags + Financial Separation)
      const canonical = enforceCanonicalBriefIntegrity({
        unit: activeUnit,
        project_name,
        decision_maker,
        details,
      });

      // Insert into briefs table
      const { error: insertError } = await supabase.from('briefs').insert({
        unit: activeUnit,
        coordinator_nickname,
        decision_maker: canonical.decision_maker,
        requester_email,
        requester_phone,
        project_name,
        details: canonical.details,
        okr_links: canonical.okr_links,
        deadline: computedDeadline,
        status: 'pending'
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSubmittedResult({
        taskCode: generatedTaskCode,
        projectName: project_name,
        isUrgent,
        workingDays: currentTiming.workingDays,
        requiredLeadTime: currentTiming.requiredLeadTime,
        urgentCount: urgentOrderCount,
        category: chosenCategory,
        coordinatorNickname: coordinator_nickname,
        team: decision_maker,
        deadlineStr: computedDeadline || "-"
      });

      setIsSuccess(true);
      setFiles([]);

      // Do not push real-time LINE notification to avoid exhausting monthly quota.
      // New briefs are cleanly collected and reported comprehensively in the 09:00 AM Morning Brief.
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    if (files.length + selectedFiles.length > 5) {
      alert("คุณสามารถแนบไฟล์ได้สูงสุด 5 ไฟล์เท่านั้น");
      return;
    }
    // Check file size (10MB max)
    const oversized = selectedFiles.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      alert(`ไฟล์ "${oversized.name}" มีขนาดใหญ่กว่า 10MB`);
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFilesSelected(selectedFiles);
      e.target.value = ""; // Reset value so user can re-select same file if needed
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFilesSelected(droppedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  if (isSuccess) {
    const isUrgentTask = submittedResult?.isUrgent;
    const directLineMsg = submittedResult ? `[แจ้งงานด่วน CC TEAM]
รหัสงาน: ${submittedResult.taskCode}
ชื่องาน: ${submittedResult.projectName}
ผู้สั่งงาน: คุณ${submittedResult.coordinatorNickname} (${submittedResult.team})
กำหนดส่ง: ${submittedResult.deadlineStr} (ระยะเวลาทำงาน ${submittedResult.workingDays ?? "-"} วัน / เกณฑ์ปกติ ${submittedResult.requiredLeadTime} วัน)
รบกวนพี่จ๊อบ AA / พี่วะ WK ช่วยพิจารณาจัดสรรคิวงานด่วนนี้ด้วยครับ/ค่ะ ขอบคุณครับ` : "";

    const copyDirectMessage = () => {
      if (!directLineMsg) return;
      navigator.clipboard.writeText(directLineMsg);
      setIsCopiedLeadMsg(true);
      setTimeout(() => setIsCopiedLeadMsg(false), 3000);
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full max-w-2xl mx-auto min-h-[70vh]">
        <div className="text-center space-y-6 bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl w-full">
          <div className={`inline-flex h-20 w-20 ${isUrgentTask ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-primary/10 text-primary'} rounded-full items-center justify-center mb-2`}>
            {isUrgentTask ? <Flame size={44} className="animate-pulse" /> : <CheckCircle2 size={40} />}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {isUrgentTask ? "ส่งใบสั่งงานด่วนสำเร็จ" : "ส่งใบสั่งงานสำเร็จ"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-2">
              ระบบได้รับข้อมูลเรียบร้อยแล้ว {submittedResult?.taskCode && <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">({submittedResult.taskCode})</span>}
            </p>
          </div>

          {/* Urgent Warning & Coaching Box */}
          {isUrgentTask && submittedResult && (
            <div className="text-left bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={22} />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100">
                    งานของท่านเป็นงานด่วน (มีเวลาทำงาน {submittedResult.workingDays} วัน)
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-200 leading-relaxed">
                    เนื่องจากมีระยะเวลาทำงานสั้นกว่าเกณฑ์มาตรฐาน ({submittedResult.requiredLeadTime} วันทำการ) 
                    <strong className="text-red-700 dark:text-red-300"> ควรแจ้งหัวหน้าทีม (จ๊อบ AA) หรือผู้ช่วยหัวหน้าทีม (วะ WK) CC ให้ทราบโดยตรงทันที</strong> เพื่อให้รีบจัดสรรคิวและดำเนินงานได้ทันตามกำหนด
                  </p>
                </div>
              </div>

              {/* Requester Urgent Stats Counter */}
              <div className="bg-white/80 dark:bg-zinc-900/80 rounded-xl p-3 border border-amber-200/60 dark:border-amber-800/40 text-xs text-zinc-700 dark:text-zinc-200 space-y-1">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>📊 ประวัติการสั่งงานด่วนของคุณ:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                    สั่งงานด่วนครั้งที่ {submittedResult.urgentCount}
                  </span>
                </div>
                <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                  คุณ <strong className="text-zinc-800 dark:text-zinc-200">{submittedResult.coordinatorNickname}</strong> สั่งงานด่วนในระบบไปแล้วทั้งหมด {submittedResult.urgentCount} ครั้ง
                </p>
              </div>

              {/* Direct Leadership Contacts */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  ช่องทางติดต่อตรงทีมผู้นำ CC เพื่อประสานคิวด่วน:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-amber-200/50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-100">จ๊อบ AA (หัวหน้าทีม)</div>
                      <div className="text-[11px] text-zinc-500">adchanapong@step.cmu.ac.th</div>
                    </div>
                    <a href="tel:0624166396" className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                      062-4166396
                    </a>
                  </div>
                  <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-amber-200/50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-100">วะ WK (ผู้ช่วยหัวหน้าทีม)</div>
                      <div className="text-[11px] text-zinc-500">wasita@step.cmu.ac.th</div>
                    </div>
                    <a href="tel:0851071229" className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                      085-1071229
                    </a>
                  </div>
                </div>
              </div>

              {/* Action: Copy Direct Line Message */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={copyDirectMessage}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#06C755] hover:bg-[#05b04c] text-white shadow-sm transition-all cursor-pointer"
                >
                  {isCopiedLeadMsg ? (
                    <>
                      <Check size={16} />
                      คัดลอกข้อความแจ้งหัวหน้าทีมแล้ว!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      คัดลอกข้อความสรุปเพื่อส่ง LINE ให้พี่จ๊อบ / พี่วะ ทันที
                    </>
                  )}
                </button>
              </div>

              {/* Lead Time Advice */}
              <div className="p-3 bg-amber-100/60 dark:bg-amber-900/30 rounded-xl text-[11.5px] text-amber-950 dark:text-amber-100 leading-relaxed border border-amber-200/40">
                💡 <strong>คำแนะนำระยะเวลาสั่งงานที่เหมาะสม:</strong> สำหรับงานหมวด {submittedResult.category || "นี้"} ควรเผื่อเวลาล่วงหน้าอย่างน้อย <strong>{submittedResult.requiredLeadTime} วันทำการ</strong> เพื่อให้ทีมงาน CC มีเวลาศึกษาข้อมูล ออกแบบ และตรวจสอบคุณภาพงานอย่างเต็มที่ก่อนส่งมอบ
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button 
              onClick={() => { 
                setIsSuccess(false); 
                setSubmittedResult(null);
                setFiles([]); 
                setCreativeDraftDate(""); 
                setCreativeUsageDate(""); 
                setContentPublishDate(""); 
                setPrEventStart("");
                setPrEventEnd("");
                setPrPublishDate(""); 
                setIsApproved(false);
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-medium text-sm shadow-md cursor-pointer"
            >
              ส่งใบสั่งงานใหม่
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 bg-surface border border-surface-border text-foreground rounded-full hover:bg-muted transition-colors font-medium text-sm"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const unitTitles = {
    creative: {
      title: (
        <div className="flex flex-col">
          <span className="leading-none">Creative Designer</span>
          <span className="text-2xl md:text-3xl text-zinc-400 font-medium tracking-wide mt-1">Brief Form</span>
        </div>
      ),
      desc: "แบบฟอร์มขอรับบริการงานออกแบบสร้างสรรค์ ทั้งในส่วนงานกราฟิกและสื่อสร้างสรรค์ เพื่อสร้างการรับรู้และภาพลักษณ์ที่ดี มากยิ่งขึ้น โดย Creative Designer",
      icon: (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full rams-circle animate-btn-glow flex items-center justify-center relative shrink-0">
          <PenTool size={40} className="text-slate-800 -rotate-12" strokeWidth={1.5} />
        </div>
      )
    },
    content: {
      title: (
        <div className="flex flex-col">
          <span className="leading-none">Content Creator</span>
          <span className="text-2xl md:text-3xl text-zinc-400 font-medium tracking-wide mt-1">Brief Form</span>
        </div>
      ),
      desc: "แบบฟอร์มขอรับบริการงานสร้างสรรค์คอนเทนต์ ทั้งในส่วนของบทความและวีดีโอสั้น เพื่อสร้างภาพลักษณ์ สนับสนุนองค์กรให้เป็นที่รู้จักในวงกว้าง มากยิ่งขึ้น โดย Content Creator",
      icon: (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full rams-circle animate-btn-glow flex items-center justify-center relative shrink-0">
          <Video size={40} className="text-slate-800" strokeWidth={1.5} />
        </div>
      )
    },
    pr: {
      title: (
        <div className="flex flex-col">
          <span className="leading-none">Public Relations</span>
          <span className="text-2xl md:text-3xl text-zinc-400 font-medium tracking-wide mt-1">Brief Form</span>
        </div>
      ),
      desc: "แบบฟอร์มขอรับบริการงานประชาสัมพันธ์ ทั้งในส่วนของงานเขียนข่าว ถ่ายภาพข่าว ประสานงานนักข่าว สนับสนุนงานอีเว้นท์และอื่นๆในส่วนที่เกี่ยวข้อง โดย PR",
      icon: (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full rams-circle animate-btn-glow flex items-center justify-center relative shrink-0">
          <Mic size={40} className="text-slate-800" strokeWidth={1.5} />
        </div>
      )
    }
  };

  const currentTitle = unitTitles[activeUnit] || unitTitles.creative;

  return (
    <>
      {/* Top Navbar Actions: Back button (Left) and Copy Link button (Right) */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <Link
          href="/"
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
            isCopied
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          {isCopied ? (
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

      <div className="mb-4 sm:mb-6 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex-shrink-0">
            {currentTitle.icon}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-4xl md:text-[42px] font-bold tracking-tight leading-tight text-zinc-900">{currentTitle.title}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">{currentTitle.desc}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} data-keep-white="true" className="space-y-8 sm:space-y-10 rams-card p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl relative overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-xl w-full">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-primary"></div>
        <input type="hidden" name="unit" value={activeUnit} />

        {/* 1. Shared Contact Info */}
        <div className="space-y-6">
          <ContactMemoryBanner 
            currentProfile={savedProfile}
            onSelectProfile={handleProfileSelect}
            onClear={handleProfileClear}
          />
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 border-b border-zinc-200 pb-3 mb-6">01 &nbsp; ข้อมูลผู้ติดต่อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="coordinator_nickname" className="text-sm font-medium">ชื่อเล่น (ภาษาไทย)</label>
              <input 
                required 
                type="text" 
                id="coordinator_nickname" 
                name="coordinator_nickname" 
                value={coordinatorNickname}
                onChange={(e) => {
                  setCoordinatorNickname(e.target.value);
                  saveContact({ nickname: e.target.value });
                }}
                className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                placeholder="เช่น แชมป์" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="decision_maker" className="text-sm font-medium">ทีม</label>
              <TeamDropdown 
                value={selectedTeam} 
                onChange={(t) => {
                  setSelectedTeam(t);
                  saveContact({ team: t });
                }} 
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
                onChange={(e) => {
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
                onChange={(e) => {
                  setRequesterPhone(e.target.value);
                  saveContact({ phone: e.target.value });
                }}
                className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                placeholder="089xxxxxxx" 
              />
            </div>
          </div>
        </div>

        {/* 2. Dynamic Unit Info */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 border-b border-zinc-200 pb-3 mb-6">02 &nbsp; รายละเอียดงาน</h2>
          
          {activeUnit === 'creative' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="project_name_creative" className="text-sm font-medium">ชื่อโครงการ / โปรเจกต์</label>
                <input required type="text" id="project_name_creative" name="project_name" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น แคมเปญ 10 ปี STeP" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="creative_category" className="text-sm font-medium">ประเภทงาน</label>
                <CategoryDropdown value={selectedCategory} onChange={setSelectedCategory} categories={CREATIVE_CATEGORIES} />
              </div>
              <div className="space-y-2">
                <label htmlFor="creative_draft_date" className="text-sm font-medium">วันที่ต้องการดราฟแรก</label>
                <ModernDatePicker
                  value={creativeDraftDate}
                  onChange={setCreativeDraftDate}
                  name="details.draft_date"
                  id="creative_draft_date"
                  placeholder="เลือกวันที่ต้องการดราฟแรก..."
                  required
                  className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="creative_usage_date" className="text-sm font-medium">วันที่ใช้งานจริง</label>
                <ModernDatePicker
                  value={creativeUsageDate}
                  onChange={setCreativeUsageDate}
                  name="details.usage_date"
                  id="creative_usage_date"
                  placeholder="เลือกวันที่ใช้งานจริง..."
                  required
                  className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                />
              </div>

              <div className="md:col-span-2">
                <UrgentLeadTimeWarningBanner timing={currentTiming} pastUrgentStats={pastUrgentStats} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="objective" className="text-sm font-medium">วัตถุประสงค์ของงานนี้</label>
                <textarea required id="objective" name="details.objective" rows={2} className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-[24px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-y" placeholder="เช่น เพื่อโปรโมทกิจกรรม..."></textarea>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="target_audience" className="text-sm font-medium">กลุ่มเป้าหมายคือใคร</label>
                <input required type="text" id="target_audience" name="details.target_audience" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น นักศึกษา, ผู้ประกอบการ" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="content_text" className="text-sm font-medium">ข้อความ / เนื้อหาที่จะใส่ในงาน</label>
                <textarea required id="content_text" name="details.content_text" rows={3} className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-[24px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-y" placeholder="หัวข้อ ข้อความ ข้อมูลที่ต้องปรากฏในงาน"></textarea>
              </div>
              <div className="space-y-2">
                <label htmlFor="colors" className="text-sm font-medium">โทนสีที่ต้องการ</label>
                <input type="text" id="colors" name="details.colors" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="ถ้ามี" />
              </div>
              <div className="space-y-2">
                <label htmlFor="must_haves" className="text-sm font-medium">สิ่งที่ต้องมีในงาน</label>
                <input type="text" id="must_haves" name="details.must_haves" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น โลโก้, QR Code" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="must_not_haves" className="text-sm font-medium">สิ่งที่ไม่ต้องการ (ห้ามมีในงาน)</label>
                <input type="text" id="must_not_haves" name="details.must_not_haves" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น ห้ามใช้สีแดง, ห้ามมีรูปการ์ตูน" />
              </div>
            </div>
          )}

          {activeUnit === 'content' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label htmlFor="project_name_content" className="text-sm font-medium">ชื่องาน / โปรเจกต์</label>
                <input required type="text" id="project_name_content" name="project_name" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="ชื่อคอนเทนต์" />
              </div>
              <div className="space-y-2">
                <label htmlFor="content_type" className="text-sm font-medium">ประเภทงาน</label>
                <CategoryDropdown value={selectedContentCategory} onChange={setSelectedContentCategory} categories={CONTENT_CATEGORIES} inputName="details.type" />
              </div>
              <div className="space-y-2">
                <label htmlFor="content_details" className="text-sm font-medium">รายละเอียดงานโดยสังเขป</label>
                <textarea required id="content_details" name="details.details" rows={4} className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-[24px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-y" placeholder="ระบุรายละเอียดเพิ่มเติม..."></textarea>
              </div>
              <div className="space-y-2">
                <label htmlFor="content_publish_date" className="text-sm font-medium">กำหนดการเผยแพร่ผลงาน</label>
                <ModernDatePicker
                  value={contentPublishDate}
                  onChange={setContentPublishDate}
                  name="details.publish_date"
                  id="content_publish_date"
                  placeholder="เลือกกำหนดการเผยแพร่ผลงาน..."
                  required
                  className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                />
              </div>

              <UrgentLeadTimeWarningBanner timing={currentTiming} pastUrgentStats={pastUrgentStats} />
            </div>
          )}

          {activeUnit === 'pr' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="project_name_pr" className="text-sm font-medium">ชื่อกิจกรรม</label>
                <input required type="text" id="project_name_pr" name="project_name" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="ชื่อกิจกรรม" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="pr_service" className="text-sm font-medium">ประเภทงาน</label>
                <CategoryDropdown value={selectedPRCategory} onChange={setSelectedPRCategory} categories={PR_CATEGORIES} inputName="details.service" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">วันและเวลาการจัดกิจกรรม (เริ่ม - ถึง)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500 font-medium">วันและเวลาเริ่มต้น (เริ่ม)</span>
                    <ModernDatePicker
                      value={prEventStart}
                      onChange={setPrEventStart}
                      showTimeSelect
                      placeholder="เลือกวันและเวลาเริ่มต้น..."
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500 font-medium">วันและเวลาสิ้นสุด (ถึง)</span>
                    <ModernDatePicker
                      value={prEventEnd}
                      onChange={setPrEventEnd}
                      showTimeSelect
                      placeholder="เลือกวันและเวลาสิ้นสุด (ถ้ามี)..."
                    />
                  </div>
                </div>
                <input 
                  type="hidden" 
                  name="details.event_datetime" 
                  value={prEventEnd ? `${prEventStart} ถึง ${prEventEnd}` : prEventStart} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="pr_publish_date" className="text-sm font-medium">วันที่เผยแพร่ข่าว</label>
                <ModernDatePicker
                  value={prPublishDate}
                  onChange={setPrPublishDate}
                  name="details.publish_date"
                  id="pr_publish_date"
                  placeholder="เลือกวันที่เผยแพร่ข่าว..."
                  required
                  className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                />
              </div>

              <div className="md:col-span-2">
                <UrgentLeadTimeWarningBanner timing={currentTiming} pastUrgentStats={pastUrgentStats} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="pr_details" className="text-sm font-medium">รายละเอียดข้อมูลกิจกรรมโดยสังเขป</label>
                <textarea required id="pr_details" name="details.details" rows={3} className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-[24px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-y" placeholder="ข้อมูลเกี่ยวกับงาน..."></textarea>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="pr_photo_source" className="text-sm font-medium">แหล่งที่มาของภาพข่าว</label>
                <input type="text" id="pr_photo_source" name="details.photo_source" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น ทีมงาน PR ถ่ายภาพเอง, ผู้ประสานงานส่งให้" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="pr_location" className="text-sm font-medium">สถานที่จัดงาน</label>
                <input required type="text" id="pr_location" name="details.location" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น อาคารอำนวยการอุทยานวิทยาศาสตร์" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="pr_key_persons" className="text-sm font-medium">บุคคลสำคัญที่เกี่ยวข้อง</label>
                <input type="text" id="pr_key_persons" name="details.key_persons" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น อธิการบดี, ประธานพิธี" />
              </div>

            </div>
          )}
        </div>

        {/* 03. Footer / Attachments */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 border-b border-zinc-200 pb-3 mb-6">03 &nbsp; ไฟล์แนบและหมายเหตุ</h2>
          
          {errorMsg && (
            <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
              <p className="font-medium text-sm">{errorMsg}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Instant Click & Drag-Drop File Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all cursor-pointer group select-none ${
                isDragging 
                  ? "border-[#ff4400] bg-orange-500/10 scale-[1.01]" 
                  : "border-zinc-300 hover:border-[#ff4400] bg-[#f9f9fb] hover:bg-orange-50/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]"
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.ai,.psd,.zip,.rar" 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-zinc-200 flex items-center justify-center mb-3 group-hover:border-orange-300 group-hover:scale-105 transition-all text-zinc-500 group-hover:text-[#ff4400]">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-bold text-zinc-800 mb-1 group-hover:text-[#ff4400] transition-colors">
                แนบไฟล์ข้อมูลประกอบ (สูงสุด 5 ไฟล์)
              </p>
              <p className="text-xs text-zinc-400 mb-4">
                คลิกที่นี่ หรือลากไฟล์มาวาง (ไฟล์ละไม่เกิน 10MB)
              </p>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{ color: '#ffffff' }}
                className="bg-zinc-900 hover:bg-[#ff4400] text-white !text-white px-5 py-2 rounded-full transition-all text-xs font-bold shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-white !text-white font-bold" style={{ color: '#ffffff' }}>เลือกไฟล์</span>
              </button>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500">ไฟล์ที่เลือก ({files.length}/5 ไฟล์):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs text-xs font-medium">
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="truncate">
                          <span className="truncate block font-semibold text-zinc-800">{file.name}</span>
                          <span className="text-[10px] text-zinc-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }} 
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="ลบไฟล์นี้"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label htmlFor="notes" className="text-sm font-medium">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
              <textarea id="notes" name="notes" rows={2} className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-[24px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-y" placeholder="ข้อมูลเพิ่มเติมอื่นๆ..."></textarea>
            </div>
            
            {/* Approval Confirmation - No outer box frame, solid red full circle when checked */}
            <label className="flex items-center gap-3.5 py-2.5 cursor-pointer group mt-3 select-none">
              <input 
                required 
                type="checkbox" 
                name="is_approved"
                checked={isApproved}
                onChange={(e) => setIsApproved(e.target.checked)}
                className="sr-only" 
              />
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  isApproved 
                    ? "bg-[#E03131] border-2 border-[#E03131] shadow-xs scale-105" 
                    : "bg-white border-2 border-zinc-400 group-hover:border-[#E03131]"
                }`}
              >
                {isApproved && (
                  <Check size={14} className="text-white stroke-[3.5]" />
                )}
              </div>
              <span className={`text-sm font-semibold tracking-tight transition-colors ${
                isApproved ? "text-zinc-900 font-bold" : "text-zinc-700 group-hover:text-zinc-900"
              }`}>
                ยืนยันว่าบรีฟนี้ได้รับการอนุมัติจากหัวหน้าทีมแล้ว
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        {/* Submit */}
        <SlideToSubmit isSubmitting={isSubmitting} />
      </form>
    </>
  );
}

export default function PublicRequestFormPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8 flex flex-col min-h-screen">
      <HalloweenBats />
      <div className="flex-1">
        <Suspense fallback={<div className="flex justify-center p-12 text-muted-foreground">กำลังโหลดแบบฟอร์ม...</div>}>
          <FormContent />
        </Suspense>
      </div>
      <footer className="w-full mt-8 pt-4 pb-4 text-center select-none">
        <p className="text-[10px] sm:text-[11px] text-zinc-400/60 font-light tracking-wide leading-relaxed">
          <span>แบบฟอร์มเข้ารับบริการงานสร้างสรรค์ (FM-CC-010 V.01)</span>
          <span className="hidden sm:inline mx-1.5 opacity-40">•</span>
          <br className="sm:hidden" />
          <span>วันที่บังคับใช้เอกสาร 1 ต.ค. 69 (อายุการจัดเก็บเอกสาร 2 ปี)</span>
        </p>
      </footer>
    </main>
  );
}
