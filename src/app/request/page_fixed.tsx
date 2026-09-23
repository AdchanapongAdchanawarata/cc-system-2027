"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { ArrowRight, CheckCircle2, UploadCloud, X, PenTool, Video, Mic } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";

type UnitType = 'creative' | 'content' | 'pr';

const TEAMS = [
  "NMCO", "INCO", "PITI", "QS", "TECH SPIN", "PUBSEC", "LINC", "GA", "HD", "AFP", 
  "IASA", "FOODFABR", "TECH UP", "ISI", "CC", "IFU", "LES", "SIT", "IQI", "IMO", 
  "EIC", "CRM", "MI"
];



function TeamDropdown({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full flex justify-between items-center cursor-pointer transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-[#ff4b4b] font-bold tracking-wide' : 'text-zinc-500'}>{value || 'เลือกทีม...'}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {TEAMS.map(team => (
            <div 
              key={team}
              className={`px-4 py-3 cursor-pointer transition-all flex items-center border-b border-zinc-100 last:border-0 ${
                value === team 
                  ? 'bg-zinc-50 text-[#ff4b4b] text-lg font-bold' 
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-[#ff4b4b] hover:text-lg hover:font-bold'
              }`}
              onClick={() => {
                onChange(team);
                setIsOpen(false);
              }}
            >
              {team}
            </div>
          ))}
        </div>
      )}
      
      {/* Hidden input for form submission */}
      <input type="hidden" name="decision_maker" value={value} />
    </div>
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

function CategoryDropdown({ value, onChange, categories, inputName = "details.category" }: { value: string, onChange: (val: string) => void, categories: {name: string, desc: string}[], inputName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedObj = CREATIVE_CATEGORIES.find(c => c.name === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full flex justify-between items-center cursor-pointer transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={value ? 'text-[#ff4b4b] font-bold whitespace-nowrap' : 'text-zinc-500'}>{value || 'เลือกประเภทงาน...'}</span>
          {value && selectedObj && (
            <span className="text-zinc-400 text-xs truncate ml-1">- {selectedObj.desc}</span>
          )}
        </div>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] max-h-[300px] overflow-y-auto">
          {categories.map(cat => (
            <div 
              key={cat.name}
              className={`px-4 py-3 cursor-pointer transition-all flex flex-col group border-b border-zinc-100 last:border-0 ${
                value === cat.name 
                  ? 'bg-zinc-50' 
                  : 'hover:bg-zinc-50'
              }`}
              onClick={() => {
                onChange(cat.name);
                setIsOpen(false);
              }}
            >
              <span className={`transition-all ${value === cat.name ? 'text-[#ff4b4b] text-lg font-bold' : 'text-zinc-800 font-semibold group-hover:text-[#ff4b4b] group-hover:text-lg group-hover:font-bold'}`}>{cat.name}</span>
              <span className={`text-xs mt-1 transition-colors ${value === cat.name ? 'text-[#ff4b4b]/80' : 'text-zinc-500 group-hover:text-[#ff4b4b]/80'}`}>{cat.desc}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Hidden input for form submission */}
      <input type="hidden" name={inputName} value={value} />
    </div>
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

function FormContent() {
  const searchParams = useSearchParams();
  const unitParam = searchParams.get("unit") as UnitType;
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedContentCategory, setSelectedContentCategory] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeUnit, setActiveUnit] = useState<UnitType>(unitParam || 'creative');
  const [files, setFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (unitParam === 'creative' || unitParam === 'content' || unitParam === 'pr') {
      setActiveUnit(unitParam);
    }
  }, [unitParam]);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const coordinator_name = "-";
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

      // Extract details based on unit
      const details: Record<string, any> = { notes };
      for (const [key, value] of formData.entries()) {
        if (key.startsWith("details.")) {
          const detailKey = key.split(".")[1];
          details[detailKey] = value;
        }
      }

      // Upload files
      const uploadedFileUrls: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
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

      // Insert into briefs table
      const { error: insertError } = await supabase.from('briefs').insert({
        unit: activeUnit,
        coordinator_name,
        coordinator_nickname,
        decision_maker,
        requester_email,
        requester_phone,
        project_name,
        details,
        status: 'pending'
      });

      if (insertError) {
        throw new Error(insertError.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      setIsSuccess(true);
      setFiles([]);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (files.length + selectedFiles.length > 5) {
        alert("คุณสามารถแนบไฟล์ได้สูงสุด 5 ไฟล์เท่านั้น");
        return;
      }
      // Check file size (10MB max)
      const oversized = selectedFiles.find(f => f.size > 10 * 1024 * 1024);
      if (oversized) {
        alert(`ไฟล์ ${oversized.name} มีขนาดใหญ่กว่า 10MB`);
        return;
      }
      setFiles([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-2xl mx-auto min-h-[80vh]">
        <div className="text-center space-y-6">
          <div className="inline-flex h-20 w-20 bg-primary/10 text-primary rounded-full items-center justify-center mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">ส่งใบสั่งงานสำเร็จ</h1>
          <p className="text-muted-foreground text-lg">
            ระบบได้รับข้อมูลของคุณแล้ว ทีมงานจะดำเนินการตรวจสอบโดยเร็วที่สุด
          </p>
          <button 
            onClick={() => { setIsSuccess(false); setFiles([]); }}
            className="mt-8 px-6 py-3 bg-surface border border-surface-border text-foreground rounded-full hover:bg-muted transition-colors font-medium"
          >
            ส่งใบสั่งงานใหม่
          </button>
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ffffff] to-[#e5e5e5] border border-zinc-300 flex items-center justify-center shadow-[-8px_-8px_16px_rgba(255,255,255,1),8px_8px_16px_rgba(0,0,0,0.08),inset_0px_2px_4px_rgba(255,255,255,1),inset_0px_-2px_4px_rgba(0,0,0,0.05)] relative shrink-0 animate-premium-fade">
          <PenTool size={44} className="text-zinc-700 -rotate-12" strokeWidth={1.5} />
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ffffff] to-[#e5e5e5] border border-zinc-300 flex items-center justify-center shadow-[-8px_-8px_16px_rgba(255,255,255,1),8px_8px_16px_rgba(0,0,0,0.08),inset_0px_2px_4px_rgba(255,255,255,1),inset_0px_-2px_4px_rgba(0,0,0,0.05)] relative shrink-0 animate-premium-fade">
          <Video size={44} className="text-zinc-700" strokeWidth={1.5} />
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ffffff] to-[#e5e5e5] border border-zinc-300 flex items-center justify-center shadow-[-8px_-8px_16px_rgba(255,255,255,1),8px_8px_16px_rgba(0,0,0,0.08),inset_0px_2px_4px_rgba(255,255,255,1),inset_0px_-2px_4px_rgba(0,0,0,0.05)] relative shrink-0 animate-premium-fade">
          <Mic size={44} className="text-zinc-700" strokeWidth={1.5} />
        </div>
      )
    }
  };

  const currentTitle = unitTitles[activeUnit] || unitTitles.creative;

  return (
    <>
      <div className="mb-4 max-w-3xl mx-auto px-4 md:px-0">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            {currentTitle.icon}
          </div>
          <div className="flex flex-col text-center md:text-left">
            <h1 className="text-4xl md:text-[42px] font-bold tracking-tight leading-tight text-zinc-900">{currentTitle.title}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10 rams-card p-10 relative overflow-hidden bg-surface">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-primary"></div>
        <input type="hidden" name="unit" value={activeUnit} />

        {/* 1. Shared Contact Info */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 border-b border-zinc-200 pb-3 mb-6">01 &nbsp; ข้อมูลผู้ติดต่อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="coordinator_nickname" className="text-sm font-medium">ชื่อเล่น (ภาษาไทย)</label>
              <input required type="text" id="coordinator_nickname" name="coordinator_nickname" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น แชมป์" />
            </div>
            <div className="space-y-2">
              <label htmlFor="decision_maker" className="text-sm font-medium">ทีม</label>
              <TeamDropdown value={selectedTeam} onChange={setSelectedTeam} />
            </div>
            <div className="space-y-2">
              <label htmlFor="requester_email" className="text-sm font-medium">อีเมล (ใช้ Email STeP เท่านั้น)</label>
              <input required type="email" id="requester_email" name="requester_email" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="name@step.cmu.ac.th" />
            </div>
            <div className="space-y-2">
              <label htmlFor="requester_phone" className="text-sm font-medium">เบอร์โทรศัพท์ (สำหรับติดต่อ)</label>
              <input required type="tel" id="requester_phone" name="requester_phone" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="089xxxxxxx" />
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
                <input required type="date" id="creative_draft_date" name="details.draft_date" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
              </div>
              <div className="space-y-2">
                <label htmlFor="creative_usage_date" className="text-sm font-medium">วันที่ใช้งานจริง</label>
                <input required type="date" id="creative_usage_date" name="details.usage_date" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
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
                <input required type="date" id="content_publish_date" name="details.publish_date" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
              </div>
            </div>
          )}

          {activeUnit === 'pr' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="project_name_pr" className="text-sm font-medium">กิจกรรม</label>
                <input required type="text" id="project_name_pr" name="project_name" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="ชื่อกิจกรรม" />
              </div>
              <div className="space-y-2">
                <label htmlFor="pr_service" className="text-sm font-medium">งานประชาสัมพันธ์ที่ต้องการ</label>
                <input required type="text" id="pr_service" name="details.service" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น ข่าวประชาสัมพันธ์, สนับสนุนอีเวนต์" />
              </div>
              <div className="space-y-2">
                <label htmlFor="pr_publish_date" className="text-sm font-medium">วันที่เผยแพร่ข่าว</label>
                <input required type="date" id="pr_publish_date" name="details.publish_date" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
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
                <label htmlFor="pr_event_datetime" className="text-sm font-medium">วันและเวลาการจัดกิจกรรม</label>
                <input required type="text" id="pr_event_datetime" name="details.event_datetime" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น 15 ส.ค. 09.00 น." />
              </div>
              <div className="space-y-2">
                <label htmlFor="pr_location" className="text-sm font-medium">สถานที่จัดงาน</label>
                <input required type="text" id="pr_location" name="details.location" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น อาคารอำนวยการอุทยานวิทยาศาสตร์" />
              </div>
              <div className="space-y-2">
                <label htmlFor="pr_key_persons" className="text-sm font-medium">บุคคลสำคัญที่เกี่ยวข้อง</label>
                <input type="text" id="pr_key_persons" name="details.key_persons" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น อธิการบดี, ประธานพิธี" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="pr_other_services" className="text-sm font-medium">งานบริการอื่นๆ ที่ต้องการใช้บริการ</label>
                <input type="text" id="pr_other_services" name="details.other_services" className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="เช่น ขอช่างภาพ 1 คน, ร่างบทกล่าวรายงาน" />
              </div>
            </div>
          )}
        </div>

        {/* 3. Footer / Attachments */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500 border-b border-zinc-200 pb-3 mb-6">03 &nbsp; ไฟล์แนบและหมายเหตุ</h2>
          
          {errorMsg && (
            <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
              <p className="font-medium text-sm">{errorMsg}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-[#f9f9fb] hover:bg-white transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer group">
              <UploadCloud size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">แนบไฟล์ข้อมูลประกอบ (สูงสุด 5 ไฟล์)</p>
              <p className="text-xs text-muted-foreground mb-4">ไฟล์ละไม่เกิน 10MB</p>
              <label className="cursor-pointer bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/80 transition-colors text-sm font-medium">
                เลือกไฟล์
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            
            {files.length > 0 && (
              <ul className="space-y-2 bg-background p-4 rounded-md border border-input">
                {files.map((file, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[80%]">{file.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-destructive hover:underline text-xs flex items-center">
                      <X size={14} className="mr-1" /> ลบไฟล์
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2 pt-2">
              <label htmlFor="notes" className="text-sm font-medium">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
              <textarea id="notes" name="notes" rows={2} className="w-full px-4 py-3 text-sm border border-zinc-200 bg-[#f9f9fb] rounded-[24px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-y" placeholder="ข้อมูลเพิ่มเติมอื่นๆ..."></textarea>
            </div>
            
            <label className="flex items-center space-x-3 cursor-pointer group mt-2">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input required type="checkbox" className="peer appearance-none w-5 h-5 rounded-full border border-zinc-300 checked:bg-[#ff4b4b] checked:border-[#ff4b4b] focus:ring-2 focus:ring-[#ff4b4b]/20 focus:outline-none cursor-pointer transition-all" />
                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#ff4b4b] transition-colors">ยืนยันว่าบรีฟนี้ได้รับการอนุมัติจากหัวหน้าทีมแล้ว</span>
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
    <main className="flex-1 p-8 w-full max-w-4xl mx-auto py-12">
      <Suspense fallback={<div className="flex justify-center p-12 text-muted-foreground">กำลังโหลดแบบฟอร์ม...</div>}>
        <FormContent />
      </Suspense>
    </main>
  );
}
