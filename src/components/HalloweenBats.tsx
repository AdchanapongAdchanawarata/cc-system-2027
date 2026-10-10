"use client";

import React, { useEffect, useState } from "react";

/**
 * Cute Halloween Chibi Bat Component
 * Active throughout October (until Oct 31, 23:59:59)
 * Renders cute chibi cartoon bats that flutter and glide across the screen.
 * Non-intrusive: pointer-events-none so it doesn't block any user clicks.
 */

// Cute SVG Chibi Bat with articulated flapping wings
export function CuteBatSvg({ size = 56, wingSpeed = "0.22s" }: { size?: number; wingSpeed?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 100 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="filter drop-shadow-md select-none overflow-visible"
    >
      <defs>
        <style>
          {`
            @keyframes batFlapLeft {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-38deg) translateY(-4px); }
            }
            @keyframes batFlapRight {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(38deg) translateY(-4px); }
            }
            .bat-wing-left {
              transform-origin: 35px 35px;
              animation: batFlapLeft ${wingSpeed} ease-in-out infinite;
            }
            .bat-wing-right {
              transform-origin: 65px 35px;
              animation: batFlapRight ${wingSpeed} ease-in-out infinite;
            }
          `}
        </style>
      </defs>

      {/* Left Wing */}
      <g className="bat-wing-left">
        <path
          d="M36 36 C24 18 10 16 2 24 C5 34 14 36 12 45 C20 42 27 45 36 38 Z"
          fill="#312E41"
          stroke="#1F1D2B"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Cute wing bones highlight */}
        <path
          d="M34 34 C25 24 15 23 8 26"
          stroke="#4C4863"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* Right Wing */}
      <g className="bat-wing-right">
        <path
          d="M64 36 C76 18 90 16 98 24 C95 34 86 36 88 45 C80 42 73 45 64 38 Z"
          fill="#312E41"
          stroke="#1F1D2B"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Cute wing bones highlight */}
        <path
          d="M66 34 C75 24 85 23 92 26"
          stroke="#4C4863"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* Bat Ears */}
      <polygon points="38,28 32,8 46,20" fill="#312E41" stroke="#1F1D2B" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="38,24 35,13 43,19" fill="#F472B6" opacity="0.8" />

      <polygon points="62,28 68,8 54,20" fill="#312E41" stroke="#1F1D2B" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="62,24 65,13 57,19" fill="#F472B6" opacity="0.8" />

      {/* Bat Round Chubby Body */}
      <ellipse cx="50" cy="38" rx="18" ry="17" fill="#312E41" stroke="#1F1D2B" strokeWidth="1.5" />
      
      {/* Soft Purple/Dark Belly */}
      <ellipse cx="50" cy="41" rx="11" ry="10" fill="#3F3B54" />

      {/* Cute Rosy Blush Cheeks */}
      <ellipse cx="40" cy="41" rx="3.5" ry="2.2" fill="#FB7185" opacity="0.65" />
      <ellipse cx="60" cy="41" rx="3.5" ry="2.2" fill="#FB7185" opacity="0.65" />

      {/* Big Sparkling Anime Eyes */}
      <circle cx="43" cy="34" r="3.6" fill="#18181B" />
      <circle cx="42" cy="32.8" r="1.3" fill="#FFFFFF" />
      <circle cx="44.2" cy="35.2" r="0.6" fill="#FFFFFF" />

      <circle cx="57" cy="34" r="3.6" fill="#18181B" />
      <circle cx="56" cy="32.8" r="1.3" fill="#FFFFFF" />
      <circle cx="58.2" cy="35.2" r="0.6" fill="#FFFFFF" />

      {/* Cute Little Vampire Cat Mouth with Tiny Fangs */}
      <path
        d="M47 39 Q50 42 53 39"
        stroke="#18181B"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tiny White Left Fang */}
      <polygon points="48,39.5 49.2,42 47.5,41" fill="#FFFFFF" />
      {/* Tiny White Right Fang */}
      <polygon points="52,39.5 52.5,41 50.8,42" fill="#FFFFFF" />

      {/* Cute Tiny Feet */}
      <ellipse cx="45" cy="54" rx="2" ry="2.5" fill="#252331" />
      <ellipse cx="55" cy="54" rx="2" ry="2.5" fill="#252331" />
    </svg>
  );
}

// Hanging Upside-down Sleeping/Peeking Bat
export function HangingCuteBat({ size = 52, className = "" }: { size?: number; className?: string }) {
  const [active, setActive] = useState(false);
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    const now = new Date();
    // Runs throughout October until October 31st 23:59:59
    setActive(now.getMonth() === 9 && now.getDate() <= 31);
  }, []);

  if (!active) return null;

  return (
    <div
      className={`pointer-events-auto cursor-pointer select-none group relative transition-transform duration-300 hover:scale-110 ${className}`}
      onMouseEnter={() => setPeek(true)}
      onMouseLeave={() => setPeek(false)}
      onClick={() => setPeek(!peek)}
      title="ค้างคาวน้อยฮาโลวีน 🎃 (แตะหรือชี้เพื่อทักทาย!)"
      style={{ transformOrigin: "top center" }}
    >
      <style jsx>{`
        @keyframes batSway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3.5deg); }
        }
        .bat-sway {
          animation: batSway 4s ease-in-out infinite;
          transform-origin: 40px 0px;
        }
      `}</style>
      <div className="bat-sway">
        <svg
          width={size}
          height={size * 1.15}
          viewBox="0 0 80 92"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-md select-none overflow-visible"
        >
          {/* Spiderweb string hanging from above letter */}
          <line x1="40" y1="0" x2="40" y2="18" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="2.5 2" />

          {/* Hanging feet gripping string */}
          <ellipse cx="36.5" cy="19" rx="3" ry="4" fill="#252331" />
          <ellipse cx="43.5" cy="19" rx="3" ry="4" fill="#252331" />

          {/* Wrapped Body / Wings wrapped like a cozy cocoon */}
          <ellipse cx="40" cy="48" rx="18" ry="24" fill="#312E41" stroke="#1F1D2B" strokeWidth="1.6" />
          
          {/* Wings wrapped fold lines */}
          <path d="M25 33 Q40 58 34 70" stroke="#1F1D2B" strokeWidth="1.5" fill="none" />
          <path d="M55 33 Q40 58 46 70" stroke="#1F1D2B" strokeWidth="1.5" fill="none" />

          {/* Pointy ears pointing downward */}
          <polygon points="31,64 23,83 37,72" fill="#312E41" stroke="#1F1D2B" strokeWidth="1.5" />
          <polygon points="31,67 26,79 35,72" fill="#F472B6" opacity="0.85" />

          <polygon points="49,64 57,83 43,72" fill="#312E41" stroke="#1F1D2B" strokeWidth="1.5" />
          <polygon points="49,67 54,79 45,72" fill="#F472B6" opacity="0.85" />

          {/* Chubby Bat Head */}
          <circle cx="40" cy="62" r="12" fill="#312E41" stroke="#1F1D2B" strokeWidth="1.3" />
          
          {/* Rosy Cheeks */}
          <ellipse cx="32" cy="64" rx="2.6" ry="1.8" fill="#FB7185" opacity="0.75" />
          <ellipse cx="48" cy="64" rx="2.6" ry="1.8" fill="#FB7185" opacity="0.75" />

          {/* Eyes: Sleeping curves or Wide Awake Sparkly Eyes when peeked */}
          {!peek ? (
            <>
              <path d="M32 59 Q35.5 56 38 59" stroke="#18181B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M42 59 Q44.5 56 48 59" stroke="#18181B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="35" cy="59" r="3.2" fill="#18181B" />
              <circle cx="34" cy="57.8" r="1.2" fill="#FFFFFF" />
              <circle cx="36" cy="60" r="0.6" fill="#FFFFFF" />

              <circle cx="45" cy="59" r="3.2" fill="#18181B" />
              <circle cx="44" cy="57.8" r="1.2" fill="#FFFFFF" />
              <circle cx="46" cy="60" r="0.6" fill="#FFFFFF" />
            </>
          )}

          {/* Happy little mouth */}
          <path d="M38 67 Q40 69.5 42 67" stroke="#18181B" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Tiny speech bubble on hover */}
      <span className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 shadow-lg whitespace-nowrap animate-in fade-in zoom-in-90 duration-150 z-50 border border-amber-300">
        🦇 สุขสันต์วันฮาโลวีน!
      </span>
    </div>
  );
}

export default function HalloweenBats() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Halloween Season Check: Runs throughout October until October 31st 23:59:59
    const now = new Date();
    const isOctober = now.getMonth() === 9 && now.getDate() <= 31;
    setActive(isOctober);
  }, []);

  if (!active) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes batFly1 {
          0% { transform: translate(-120px, 12vh) scale(1) rotate(6deg); }
          25% { transform: translate(28vw, 30vh) scale(0.96) rotate(12deg); }
          50% { transform: translate(62vw, 18vh) scale(1.04) rotate(-6deg); }
          75% { transform: translate(84vw, 34vh) scale(0.98) rotate(8deg); }
          100% { transform: translate(calc(100vw + 120px), 15vh) scale(1) rotate(-4deg); }
        }
        @keyframes batFly2 {
          0% { transform: translate(calc(100vw + 120px), 25vh) scaleX(-1) rotate(-8deg); }
          30% { transform: translate(72vw, 14vh) scaleX(-1) rotate(-14deg); }
          65% { transform: translate(32vw, 28vh) scaleX(-1) rotate(6deg); }
          100% { transform: translate(-140px, 18vh) scaleX(-1) rotate(-5deg); }
        }
        @keyframes batFly3 {
          0% { transform: translate(-100px, 55vh) scale(0.95) rotate(-12deg); }
          35% { transform: translate(35vw, 40vh) scale(1) rotate(-4deg); }
          70% { transform: translate(75vw, 22vh) scale(1.08) rotate(8deg); }
          100% { transform: translate(calc(100vw + 100px), 10vh) scale(0.95) rotate(-8deg); }
        }
        @keyframes batFly4 {
          0% { transform: translate(calc(100vw + 100px), 8vh) scaleX(-1) rotate(4deg); }
          40% { transform: translate(55vw, 16vh) scaleX(-1) rotate(10deg); }
          70% { transform: translate(25vw, 6vh) scaleX(-1) rotate(-8deg); }
          100% { transform: translate(-110px, 12vh) scaleX(-1) rotate(5deg); }
        }
        @keyframes batFly5 {
          0% { transform: translate(-130px, 18vh) scale(0.85) rotate(8deg); }
          30% { transform: translate(24vw, 34vh) scale(0.88) rotate(14deg); }
          65% { transform: translate(60vw, 24vh) scale(0.85) rotate(-4deg); }
          100% { transform: translate(calc(100vw + 130px), 20vh) scale(0.85) rotate(6deg); }
        }
        @keyframes batFly6 {
          0% { transform: translate(calc(100vw + 120px), 44vh) scaleX(-1) rotate(-6deg); }
          35% { transform: translate(62vw, 34vh) scaleX(-1) rotate(10deg); }
          70% { transform: translate(22vw, 48vh) scaleX(-1) rotate(-10deg); }
          100% { transform: translate(-120px, 32vh) scaleX(-1) rotate(-4deg); }
        }

        .bat-flying-1 {
          animation: batFly1 20s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: -3s;
        }
        .bat-flying-2 {
          animation: batFly2 24s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: -9s;
        }
        .bat-flying-3 {
          animation: batFly3 18s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: -5s;
        }
        .bat-flying-4 {
          animation: batFly4 22s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: -14s;
        }
        .bat-flying-5 {
          animation: batFly5 19s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: -1s;
        }
        .bat-flying-6 {
          animation: batFly6 26s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: -18s;
        }
      `}</style>

      {/* Floating Bats Layer (Fully Non-Intrusive, pointer-events-none) */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none z-30 select-none"
        aria-hidden="true"
      >
        {/* Bat 1: Big Chibi Explorer Bat */}
        <div className="absolute top-0 left-0 bat-flying-1">
          <CuteBatSvg size={68} wingSpeed="0.2s" />
        </div>

        {/* Bat 2: Big Graceful Glider Bat */}
        <div className="absolute top-0 left-0 bat-flying-2">
          <CuteBatSvg size={64} wingSpeed="0.24s" />
        </div>

        {/* Bat 3: Swooping Playful Bat */}
        <div className="absolute top-0 left-0 bat-flying-3">
          <CuteBatSvg size={58} wingSpeed="0.19s" />
        </div>

        {/* Bat 4: High Flyer King Bat */}
        <div className="absolute top-0 left-0 bat-flying-4">
          <CuteBatSvg size={72} wingSpeed="0.22s" />
        </div>

        {/* Bat 5: Cute Little Buddy Bat */}
        <div className="absolute top-0 left-0 bat-flying-5">
          <CuteBatSvg size={50} wingSpeed="0.17s" />
        </div>

        {/* Bat 6: Mid-sky Gentle Bat */}
        <div className="absolute top-0 left-0 bat-flying-6">
          <CuteBatSvg size={62} wingSpeed="0.23s" />
        </div>
      </div>
    </>
  );
}
