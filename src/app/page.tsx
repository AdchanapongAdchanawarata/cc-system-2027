import Link from "next/link";
import { PenTool, Video, Mic, ArrowRight, Lock } from "lucide-react";
import WeatherWidget from "@/components/WeatherWidget";
import AboutTeamModal from "@/components/AboutTeamModal";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 py-2 md:px-8 md:py-3 max-w-6xl mx-auto w-full min-h-screen">
      {/* Top Navigation Bar */}
      <div className="w-full flex flex-row justify-between items-start md:items-center mb-0 animate-premium-fade relative z-30">
        <div className="text-left flex flex-col">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-none">CC TEAM</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
            Briefing & Management System
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0 relative z-30">
          <Link href="/track" className="flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors bg-surface px-5 py-2 rounded-full border border-surface-border shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md">
            Track Status
          </Link>
          <AboutTeamModal />
        </div>
      </div>

      {/* Dashboard Weather & Quote Widget - Moved to Top */}
      <div className="w-full animate-premium-fade" style={{ animationDelay: '100ms' }}>
        <WeatherWidget />
      </div>

      {/* 3 Circles Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-0">
        
        {/* Unit 1: Creative Designer */}
        <div className="flex flex-col items-center text-center group animate-premium-fade" style={{ animationDelay: '200ms' }}>
          <Link href="/request?unit=creative" className="flex flex-col items-center">
            <div className="w-36 h-36 rounded-full rams-circle animate-btn-glow shimmer-delay-1 flex items-center justify-center transition-all duration-300 mb-3 group-active:scale-95" style={{ animationDelay: '0s' }}>
              <PenTool size={48} className="text-foreground opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-medium mb-3 text-foreground tracking-wide">Creative Designer<br/><span className="text-sm font-semibold tracking-wider text-muted-foreground mt-1 block">Brief Form</span></h2>
          </Link>
          <p className="text-sm text-muted-foreground/80 leading-relaxed font-light px-2 mb-3">บริการออกแบบกราฟิกและสื่อสร้างสรรค์<br/>เพื่อส่งเสริมภาพลักษณ์และการรับรู้ขององค์กร</p>
        </div>

        {/* Unit 2: Content Creator */}
        <div className="flex flex-col items-center text-center group animate-premium-fade" style={{ animationDelay: '300ms' }}>
          <Link href="/request?unit=content" className="flex flex-col items-center">
            <div className="w-36 h-36 rounded-full rams-circle animate-btn-glow shimmer-delay-2 flex items-center justify-center transition-all duration-300 mb-3 group-active:scale-95" style={{ animationDelay: '6s' }}>
              <Video size={48} className="text-foreground opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-medium mb-3 text-foreground tracking-wide">Content Creator<br/><span className="text-sm font-semibold tracking-wider text-muted-foreground mt-1 block">Brief Form</span></h2>
          </Link>
          <p className="text-sm text-muted-foreground/80 leading-relaxed font-light px-2 mb-3">บริการผลิตคอนเทนต์ บทความ และวิดีโอสั้น<br/>เพื่อสนับสนุนให้องค์กรเป็นที่รู้จักในวงกว้าง</p>
        </div>

        {/* Unit 3: PR */}
        <div className="flex flex-col items-center text-center group animate-premium-fade" style={{ animationDelay: '400ms' }}>
          <Link href="/request?unit=pr" className="flex flex-col items-center">
            <div className="w-36 h-36 rounded-full rams-circle animate-btn-glow shimmer-delay-3 flex items-center justify-center transition-all duration-300 mb-3 group-active:scale-95" style={{ animationDelay: '3s' }}>
              <Mic size={48} className="text-foreground opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-medium mb-3 text-foreground tracking-wide">PR<br/><span className="text-sm font-semibold tracking-wider text-muted-foreground mt-1 block">Brief Form</span></h2>
          </Link>
          <p className="text-sm text-muted-foreground/80 leading-relaxed font-light px-2 mb-3">บริการประชาสัมพันธ์ ข่าวสาร ประสานงานสื่อ<br/>และสนับสนุนการจัดกิจกรรมต่างๆ ขององค์กร</p>
        </div>

      </div>

      {/* Bottom CC Login */}
      <div className="w-full flex justify-center pb-6 mt-auto pt-8 animate-premium-fade" style={{ animationDelay: '500ms' }}>
        <Link 
          href="/login" 
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
        >
          <Lock className="mr-2 text-muted-foreground/60 group-hover:text-primary transition-colors" size={14} />
          CC Login
        </Link>
      </div>
    </main>
  );
}
