"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenTool, Video, Mic, Lock } from "lucide-react";
import WeatherWidget from "@/components/WeatherWidget";
import AboutTeamModal from "@/components/AboutTeamModal";

export default function Home() {
  const router = useRouter();

  const handleCCLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("cc_user_email");
      if (savedEmail) {
        // If already logged in, enter dashboard directly with zero stutter
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
        
        <div className="flex flex-row items-center gap-1.5 sm:gap-2 shrink-0 relative z-30">
          <Link 
            href="/track" 
            className="flex items-center text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors bg-surface px-3 py-1.5 sm:px-5 sm:py-2 rounded-full border border-surface-border shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md whitespace-nowrap"
          >
            Track Status
          </Link>
          <AboutTeamModal />
        </div>
      </div>

      {/* Dashboard Weather & Quote Widget - Moved to Top */}
      <div className="w-full animate-premium-fade" style={{ animationDelay: '100ms' }}>
        <WeatherWidget />
      </div>

      {/* 3 Circles Section - Responsive 3 Columns on all screens with balanced vertical spacing */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 w-full max-w-4xl my-auto py-4 sm:py-8 md:py-10">
        
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

      {/* Bottom CC Login */}
      <div className="w-full flex items-center justify-center gap-6 pb-4 sm:pb-6 mt-auto pt-4 sm:pt-8 animate-premium-fade" style={{ animationDelay: '500ms' }}>
        <a 
          href="/login" 
          onClick={handleCCLogin}
          className="flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors group cursor-pointer py-1 px-3"
        >
          <Lock className="mr-1.5 text-muted-foreground/60 group-hover:text-primary transition-colors" size={14} />
          CC Login
        </a>
      </div>
    </main>
  );
}
