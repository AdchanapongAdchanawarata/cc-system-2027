"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenTool, Video, Mic, ClipboardList, Users, Lock } from "lucide-react";
import WeatherWidget, { InspirationalQuote } from "@/components/WeatherWidget";
import HomeMenuDropdown from "@/components/HomeMenuDropdown";
import AboutTeamModal from "@/components/AboutTeamModal";

export default function Home() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const router = useRouter();

  const handleCCLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("cc_user_email");
      if (savedEmail) {
        router.push("/dashboard");
        return;
      }
    }
    router.push("/login");
  };

  return (
    <main className="flex-1 flex flex-col items-center px-3 py-2 sm:px-6 md:px-8 md:py-3 max-w-6xl mx-auto w-full min-h-screen">
      {/* Top Navigation Bar */}
      <div className="w-full flex flex-row justify-between items-center mb-0 animate-premium-fade relative z-30">
        <div className="text-left inline-flex flex-col w-fit select-none">
          <h1 className="text-2xl sm:text-3xl md:text-[38px] font-black tracking-[0.055em] text-foreground leading-none">
            CC TEAM
          </h1>
          <p className="text-muted-foreground text-[8.5px] sm:text-[10.5px] md:text-[13px] font-medium tracking-[0.005em] mt-1 leading-none whitespace-nowrap">
            Briefing & Management System
          </p>
        </div>
        
        {/* Desktop Web Navigation: Track Status, About Team, CC Login always visible outside */}
        <div className="hidden sm:flex items-center gap-2 relative z-30">
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all active:scale-95"
            title="Track Status"
          >
            <ClipboardList size={14} className="text-primary" />
            <span>Track Status</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="About Team"
          >
            <Users size={14} className="text-violet-600" />
            <span>About Team</span>
          </button>

          <button
            type="button"
            onClick={handleCCLogin}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="CC Login"
          >
            <Lock size={13} />
            <span>CC Login</span>
          </button>
        </div>

        {/* Mobile Web Navigation: Compact 3-line circular menu button with dropdown */}
        <div className="flex sm:hidden items-center shrink-0 relative z-30">
          <HomeMenuDropdown onOpenAbout={() => setIsAboutOpen(true)} />
        </div>
      </div>

      {/* Dashboard Weather Widget - Top */}
      <div className="w-full animate-premium-fade" style={{ animationDelay: '100ms' }}>
        <WeatherWidget showQuote={false} />
      </div>

      {/* Inspirational Quote - Centered in whitespace between Weather Widget and 3 Brief Circles */}
      <div 
        className="w-full max-w-3xl mx-auto my-auto py-3 sm:py-5 md:py-6 flex items-center justify-center animate-premium-fade"
        style={{ animationDelay: '150ms' }}
      >
        <InspirationalQuote />
      </div>

      {/* 3 Circles Section - Responsive 3 Columns on all screens */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 w-full max-w-4xl pb-4 sm:pb-8">
        
        {/* Unit 1: Creative Designer */}
        <div className="flex flex-col items-center text-center group">
          <Link href="/request?unit=creative" className="flex flex-col items-center w-full">
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full rams-circle animate-btn-glow flex items-center justify-center transition-all duration-300 mb-2 sm:mb-3 group-active:scale-95">
              <PenTool className="text-slate-800 opacity-90 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300 w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12" strokeWidth={1.75} />
            </div>
            <h2 className="text-xs sm:text-base md:text-xl font-medium mb-1 sm:mb-1.5 text-foreground tracking-tight sm:tracking-wide">
              Creative Designer<br/>
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider text-muted-foreground mt-0.5 sm:mt-1 block">Brief Form</span>
            </h2>
          </Link>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground/80 leading-snug sm:leading-relaxed font-light px-0.5 sm:px-1 md:px-2 mt-0.5 sm:mt-1">
            บริการออกแบบกราฟิก สื่อสิ่งพิมพ์<br className="hidden sm:inline" /> และภาพลักษณ์องค์กร
          </p>
        </div>

        {/* Unit 2: Content Creator */}
        <div className="flex flex-col items-center text-center group">
          <Link href="/request?unit=content" className="flex flex-col items-center w-full">
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full rams-circle animate-btn-glow flex items-center justify-center transition-all duration-300 mb-2 sm:mb-3 group-active:scale-95">
              <Video className="text-slate-800 opacity-90 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300 w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12" strokeWidth={1.75} />
            </div>
            <h2 className="text-xs sm:text-base md:text-xl font-medium mb-1 sm:mb-1.5 text-foreground tracking-tight sm:tracking-wide">
              Content Creator<br/>
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider text-muted-foreground mt-0.5 sm:mt-1 block">Brief Form</span>
            </h2>
          </Link>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground/80 leading-snug sm:leading-relaxed font-light px-0.5 sm:px-1 md:px-2 mt-0.5 sm:mt-1">
            บริการผลิตคอนเทนต์ บทความ<br className="hidden sm:inline" /> และวิดีโอสร้างสรรค์
          </p>
        </div>

        {/* Unit 3: PR */}
        <div className="flex flex-col items-center text-center group">
          <Link href="/request?unit=pr" className="flex flex-col items-center w-full">
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full rams-circle animate-btn-glow flex items-center justify-center transition-all duration-300 mb-2 sm:mb-3 group-active:scale-95">
              <Mic className="text-slate-800 opacity-90 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300 w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12" strokeWidth={1.75} />
            </div>
            <h2 className="text-xs sm:text-base md:text-xl font-medium mb-1 sm:mb-1.5 text-foreground tracking-tight sm:tracking-wide">
              PR<br/>
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider text-muted-foreground mt-0.5 sm:mt-1 block">Brief Form</span>
            </h2>
          </Link>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground/80 leading-snug sm:leading-relaxed font-light px-0.5 sm:px-1 md:px-2 mt-0.5 sm:mt-1">
            บริการประชาสัมพันธ์ ข่าวสาร<br className="hidden sm:inline" /> ประสานสื่อ และกิจกรรม
          </p>
        </div>

      </div>

      {/* Controlled About Team Modal */}
      <AboutTeamModal 
        isOpen={isAboutOpen} 
        onOpenChange={setIsAboutOpen} 
        showTrigger={false} 
      />

      {/* Bottom spacer for balanced vertical alignment */}
      <div className="w-full pb-2 sm:pb-4 mt-auto" />
    </main>
  );
}
