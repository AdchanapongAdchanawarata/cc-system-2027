"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ClipboardList, 
  Users, 
  Lock, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";
import AboutTeamModal from "@/components/AboutTeamModal";

interface HomeMenuDropdownProps {
  onOpenAbout?: () => void;
}

export default function HomeMenuDropdown({ onOpenAbout }: HomeMenuDropdownProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleCCLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("cc_user_email");
      if (savedEmail) {
        router.push("/dashboard");
        return;
      }
    }
    router.push("/login");
  };

  const handleOpenAboutTeam = () => {
    setIsOpen(false);
    if (onOpenAbout) {
      onOpenAbout();
    } else {
      setIsAboutOpen(true);
    }
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        {/* Dieter Rams 3-Line Minimal Circular Button */}
        <button
          id="cc-home-menu-btn"
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 relative z-30 ${
            isOpen
              ? "bg-surface border-2 border-primary shadow-md ring-2 ring-primary/20 text-primary"
              : "bg-surface border border-surface-border shadow-[2px_4px_8px_rgba(0,0,0,0.05),-1px_-1px_4px_rgba(255,255,255,0.8)] hover:shadow-md hover:border-zinc-400 text-foreground"
          }`}
          title="เมนูระบบ CC TEAM"
          aria-expanded={isOpen}
          aria-label="เมนูระบบ CC TEAM"
        >
          {/* Custom 3 minimal horizontal lines */}
          <div className="w-4 h-3 flex flex-col justify-between items-center pointer-events-none">
            <span 
              className={`w-full h-[1.75px] rounded-full transition-all duration-200 ${
                isOpen ? "bg-primary translate-y-[5px] rotate-45" : "bg-foreground/80"
              }`} 
            />
            <span 
              className={`w-full h-[1.75px] rounded-full transition-all duration-200 ${
                isOpen ? "opacity-0 scale-0" : "bg-foreground/80"
              }`} 
            />
            <span 
              className={`w-full h-[1.75px] rounded-full transition-all duration-200 ${
                isOpen ? "bg-primary -translate-y-[5.25px] -rotate-45" : "bg-foreground/80"
              }`} 
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute right-0 top-full mt-2.5 w-64 sm:w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden"
          >
            {/* Header label */}
            <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                CC TEAM • SYSTEM
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>

            <div className="py-1 space-y-0.5">
              {/* Option 1: Track Status */}
              <Link
                href="/track"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100/80 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-2xs">
                  <ClipboardList size={16} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                    Track Status
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    ติดตามสถานะงาน & ประเมินผล
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>

              {/* Option 2: About Team */}
              <button
                type="button"
                onClick={handleOpenAboutTeam}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100/80 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-2xs">
                  <Users size={16} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 group-hover:text-violet-600 transition-colors flex items-center gap-1.5">
                    About Team
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    ผังโครงสร้างและบทบาท 3 ยูนิต
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Option 3: CC Login */}
              <a
                href="/login"
                onClick={handleCCLogin}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-2xs">
                  <Lock size={15} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 group-hover:text-zinc-900 transition-colors flex items-center gap-1.5">
                    CC Login
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    เข้าสู่ระบบสำหรับทีมงาน
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Controlled About Team Modal without standalone trigger button (only if not controlled externally) */}
      {!onOpenAbout && (
        <AboutTeamModal 
          isOpen={isAboutOpen} 
          onOpenChange={setIsAboutOpen} 
          showTrigger={false} 
        />
      )}
    </>
  );
}
