"use client";

import React, { useEffect, useState } from "react";

interface HalloweenPumpkinProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export default function HalloweenPumpkin({
  size,
  className = "w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14",
  glow = true,
}: HalloweenPumpkinProps) {
  const [active, setActive] = useState(false);
  const [isJiggling, setIsJiggling] = useState(false);
  const [lit, setLit] = useState(true);

  useEffect(() => {
    // Active during Halloween season (until Oct 31, 23:59:59)
    const now = new Date();
    setActive(now.getMonth() === 9 && now.getDate() <= 31);
  }, []);

  if (!active) return null;

  return (
    <div
      className={`group relative pointer-events-auto cursor-pointer select-none transition-transform duration-300 hover:scale-110 active:scale-95 ${className}`}
      onClick={() => {
        setIsJiggling(true);
        setLit(!lit);
        setTimeout(() => setIsJiggling(false), 700);
      }}
      title="ฟักทองฮาโลวีนแจ็คโอแลนเทิร์น 🎃 (แตะเพื่อสลับแสงไฟ!)"
      style={
        size
          ? {
              width: size,
              height: size * 0.95,
            }
          : undefined
      }
    >
      <style jsx>{`
        @keyframes pumpkinFlicker {
          0%, 100% {
            opacity: 0.98;
            filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.85));
          }
          30% {
            opacity: 0.82;
            filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.6));
          }
          65% {
            opacity: 1;
            filter: drop-shadow(0 0 14px rgba(251, 191, 36, 0.95));
          }
          85% {
            opacity: 0.78;
            filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.55));
          }
        }
        @keyframes pumpkinJiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-8deg) scale(1.08, 0.95); }
          40% { transform: rotate(8deg) scale(0.96, 1.05); }
          60% { transform: rotate(-4deg) scale(1.04, 0.98); }
          80% { transform: rotate(3deg) scale(0.99, 1.02); }
        }
        .pumpkin-glow {
          animation: pumpkinFlicker 3s ease-in-out infinite;
        }
        .pumpkin-jiggle {
          animation: pumpkinJiggle 0.65s ease-in-out;
        }
      `}</style>

      <div className={`w-full h-full relative ${isJiggling ? "pumpkin-jiggle" : ""}`}>
        <svg
          viewBox="0 0 100 95"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full overflow-visible ${glow && lit ? "pumpkin-glow" : ""}`}
        >
          {/* Pumpkin Shadow on Grass (เพิ่มมิติเงาใต้ผลฟักทองให้อยู่ในกรอบหญ้าเขียวอย่างชัดเจน) */}
          <ellipse cx="50" cy="87.5" rx="31" ry="5.5" fill="#14532D" opacity="0.6" />
          <ellipse cx="50" cy="86.5" rx="22" ry="3.5" fill="#0f3d20" opacity="0.7" />

          {/* Green Stem (Behind body) */}
          <path
            d="M50 25 C49 14 55 8 62 5 C62 8 60 14 55 24 Z"
            fill="#15803D"
            stroke="#14532D"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Stem Highlight */}
          <path d="M52 22 C53 15 57 11 60 7" stroke="#4ADE80" strokeWidth="1" strokeLinecap="round" />

          {/* Tiny Cute Green Vine Curl */}
          <path
            d="M47 24 C44 19 40 19 41 15 C42 12 46 14 45 18"
            stroke="#22C55E"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Pumpkin Ribs / Body (Layered back to front for round 3D look) */}
          {/* Outer Side Ribs */}
          <ellipse cx="25" cy="56" rx="19" ry="26" fill="#EA580C" stroke="#9A3412" strokeWidth="1.8" />
          <ellipse cx="75" cy="56" rx="19" ry="26" fill="#EA580C" stroke="#9A3412" strokeWidth="1.8" />

          {/* Mid Ribs */}
          <ellipse cx="36" cy="57" rx="18" ry="28" fill="#F97316" stroke="#C2410C" strokeWidth="1.6" />
          <ellipse cx="64" cy="57" rx="18" ry="28" fill="#F97316" stroke="#C2410C" strokeWidth="1.6" />

          {/* Center Rib */}
          <ellipse cx="50" cy="58" rx="17" ry="29" fill="#FB923C" stroke="#C2410C" strokeWidth="1.6" />

          {/* Warm Upper Highlight Curves */}
          <path d="M36 34 C44 31 56 31 64 34" stroke="#FDBA74" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
          <path d="M24 38 C28 35 32 35 35 37" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />

          {/* Jack-o'-Lantern Carved Glowing Features */}
          {lit ? (
            <g className="pumpkin-face">
              {/* Left Eye */}
              <polygon
                points="34,44 26,53 39,53"
                fill="#FEF08A"
                stroke="#D97706"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <polygon points="34,46 29,52 38,52" fill="#FFFFFF" opacity="0.9" />

              {/* Right Eye */}
              <polygon
                points="66,44 61,53 74,53"
                fill="#FEF08A"
                stroke="#D97706"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <polygon points="66,46 62,52 71,52" fill="#FFFFFF" opacity="0.9" />

              {/* Cute Triangle Nose */}
              <polygon
                points="50,53 46,59 54,59"
                fill="#FDE047"
                stroke="#D97706"
                strokeWidth="1"
                strokeLinejoin="round"
              />

              {/* Classic Jagged Smiling Mouth with Teeth */}
              <path
                d="M31 66 L38 72 L44 67 L50 73 L56 67 L62 72 L69 66 L66 74 L50 78 L34 74 Z"
                fill="#FEF08A"
                stroke="#B45309"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Mouth Glow Inner Highlight */}
              <path
                d="M34 68 L38 71 L44 68 L50 72 L56 68 L62 71 L66 68 L64 73 L50 76 L36 73 Z"
                fill="#FFFFFF"
                opacity="0.85"
              />
            </g>
          ) : (
            <g className="pumpkin-face-dark">
              {/* Dark Carved Left Eye */}
              <polygon points="34,44 26,53 39,53" fill="#431407" stroke="#78350F" strokeWidth="1.2" strokeLinejoin="round" />
              {/* Dark Carved Right Eye */}
              <polygon points="66,44 61,53 74,53" fill="#431407" stroke="#78350F" strokeWidth="1.2" strokeLinejoin="round" />
              {/* Dark Nose */}
              <polygon points="50,53 46,59 54,59" fill="#431407" stroke="#78350F" strokeWidth="1" strokeLinejoin="round" />
              {/* Dark Mouth */}
              <path
                d="M31 66 L38 72 L44 67 L50 73 L56 67 L62 72 L69 66 L66 74 L50 78 L34 74 Z"
                fill="#431407"
                stroke="#78350F"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Cute Rosy Cheeks */}
          <ellipse cx="23" cy="63" rx="4" ry="2.5" fill="#DC2626" opacity="0.4" />
          <ellipse cx="77" cy="63" rx="4" ry="2.5" fill="#DC2626" opacity="0.4" />
        </svg>

        {/* Hover Speech Bubble */}
        <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 z-50 border border-amber-300">
          🎃 Trick or Treat! 🍬
        </span>
      </div>
    </div>
  );
}
