"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface HalloweenPumpkinProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

interface VolcanoCandy {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  opacity: number;
  scale: number;
}

// Crisp pop sound effect synthesized via Web Audio API (Zero external assets)
function playPopSound(freq = 520) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.19);
  } catch {
    // Ignore audio restrictions
  }
}

const VOLCANO_EMOJIS = [
  "🍬", "🍭", "🍫", "🍩", "🍪", "🧁", "🍡", "🎃", "⭐", "✨", 
  "🍬", "🍭", "🍫", "🍬", "🍭", "🎉", "🎃", "✨", "🍫", "🍬",
  "🍡", "🍪", "🍩", "🧁", "⭐", "🍬", "🍭"
];

export default function HalloweenPumpkin({
  size,
  className = "w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14",
  glow = true,
}: HalloweenPumpkinProps) {
  const [active, setActive] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [lit, setLit] = useState(true);

  // Volcano candy particles array
  const [candies, setCandies] = useState<VolcanoCandy[]>([]);

  const pumpkinRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Active during Halloween season (until Oct 31, 23:59:59)
    const now = new Date();
    setActive(now.getMonth() === 9 && now.getDate() <= 31);
  }, []);

  // Erupt massive candy volcano explosion
  const eruptVolcanoCandies = useCallback((count = 80) => {
    const rect = pumpkinRef.current?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth * 0.8;
    const originY = rect ? rect.top + rect.height * 0.4 : window.innerHeight * 0.65;

    const newParticles: VolcanoCandy[] = [];

    for (let i = 0; i < count; i++) {
      // Fan angle: spread from -165 deg to -15 deg (wide upward volcano cone)
      const angle = -Math.PI * 0.92 + Math.random() * Math.PI * 0.84;
      // High-power volcano eruption velocity: 16 to 36
      const speed = Math.random() * 20 + 16;
      // Horizontal boost for wide screen coverage
      const vx = Math.cos(angle) * speed * (1.1 + Math.random() * 0.5);
      const vy = Math.sin(angle) * speed;

      newParticles.push({
        id: Date.now() + i + Math.random(),
        emoji: VOLCANO_EMOJIS[Math.floor(Math.random() * VOLCANO_EMOJIS.length)],
        x: originX + (Math.random() - 0.5) * 30,
        y: originY + (Math.random() - 0.5) * 20,
        vx,
        vy,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 22,
        size: Math.floor(Math.random() * 18) + 24, // 24px - 42px
        opacity: 1,
        scale: Math.random() * 0.4 + 0.85,
      });
    }

    setCandies((prev) => [...prev, ...newParticles]);
  }, []);

  // Handle click on the pumpkin: trigger burst & volcano eruption
  const handlePumpkinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBursting(true);
    setLit(true);
    playPopSound(500);

    // Erupt candies directly onto the normal page
    eruptVolcanoCandies(85);

    setTimeout(() => setIsBursting(false), 600);
  };

  // Physics animation loop for candies
  useEffect(() => {
    if (candies.length === 0) return;

    const gravity = 0.65;
    const screenHeight = typeof window !== "undefined" ? window.innerHeight : 1000;

    const updatePhysics = () => {
      setCandies((prev) => {
        const next: VolcanoCandy[] = [];
        for (let i = 0; i < prev.length; i++) {
          const c = prev[i];
          const x = c.x + c.vx;
          const y = c.y + c.vy;
          const vy = c.vy + gravity;
          const vx = c.vx * 0.992;
          const rotation = c.rotation + c.vRot;

          // Fade out as it nears or goes below the bottom of the screen
          let opacity = c.opacity;
          if (y > screenHeight * 0.72) {
            opacity -= 0.024;
          }

          // Keep alive until faded out or below screen
          if (opacity > 0 && y < screenHeight + 80) {
            next.push({
              ...c,
              x,
              y,
              vx,
              vy,
              rotation,
              opacity,
            });
          }
        }

        if (next.length > 0) {
          animFrameRef.current = requestAnimationFrame(updatePhysics);
        }
        return next;
      });
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [candies.length]);

  if (!active) return null;

  return (
    <div
      ref={pumpkinRef}
      className={`group relative pointer-events-auto cursor-pointer select-none transition-transform duration-300 hover:scale-115 active:scale-95 ${className}`}
      onClick={handlePumpkinClick}
      title="ฟักทองฮาโลวีนแจ็คโอแลนเทิร์น 🎃 (Trick or Treat! แตะเพื่อให้ลูกกวาดพุ่งทะลักเต็มจอ!)"
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
        @keyframes pumpkinAttentionShake {
          0%, 65%, 100% {
            transform: rotate(0deg) scale(1);
          }
          68% {
            transform: rotate(-10deg) scale(1.14);
          }
          72% {
            transform: rotate(10deg) scale(1.16);
          }
          76% {
            transform: rotate(-8deg) scale(1.12);
          }
          80% {
            transform: rotate(8deg) scale(1.12);
          }
          84% {
            transform: rotate(-4deg) scale(1.06);
          }
          88% {
            transform: rotate(4deg) scale(1.03);
          }
          92% {
            transform: rotate(0deg) scale(1);
          }
        }
        @keyframes pumpkinVolcanoBurst {
          0% { transform: scale(1); }
          25% { transform: scale(1.35, 0.75); }
          50% { transform: scale(0.85, 1.3); }
          75% { transform: scale(1.1, 0.95); }
          100% { transform: scale(1); }
        }
        @keyframes bubbleSideFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.04);
          }
        }
        .pumpkin-glow {
          animation: pumpkinFlicker 3s ease-in-out infinite;
        }
        .pumpkin-attention {
          animation: pumpkinAttentionShake 4.2s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .pumpkin-burst {
          animation: pumpkinVolcanoBurst 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-origin: bottom center;
        }
        .bubble-side-float {
          animation: bubbleSideFloat 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Attention-Seeking "Trick or Treat!" Speech Bubble - Positioned to the RIGHT of Pumpkin (ไม่บังหน้าน้อง CC) */}
      <div className="absolute -top-3 left-[92%] sm:left-[96%] z-30 pointer-events-none bubble-side-float">
        <div className="relative px-2.5 py-1 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 text-slate-950 font-black text-[10px] sm:text-[11.5px] shadow-[0_4px_18px_rgba(245,158,11,0.65)] border border-amber-200 whitespace-nowrap flex items-center gap-1.5 ring-2 ring-white/90">
          {/* Bubble tail pointing left towards the pumpkin */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-amber-400 filter drop-shadow-xs" />
          <span className="text-[12px] animate-pulse">🎃</span>
          <span className="tracking-tight leading-none">Trick or Treat!</span>
          <span className="text-[12px]">🍬</span>
        </div>
      </div>

      <div className={`w-full h-full relative ${isBursting ? "pumpkin-burst" : "pumpkin-attention"}`}>
        <svg
          viewBox="0 0 100 95"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full overflow-visible ${glow && lit ? "pumpkin-glow" : ""}`}
        >
          {/* Pumpkin Shadow on Grass */}
          <ellipse cx="50" cy="87.5" rx="31" ry="5.5" fill="#14532D" opacity="0.6" />
          <ellipse cx="50" cy="86.5" rx="22" ry="3.5" fill="#0f3d20" opacity="0.7" />

          {/* Green Stem */}
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
          <ellipse cx="25" cy="56" rx="19" ry="26" fill="#EA580C" stroke="#9A3412" strokeWidth="1.8" />
          <ellipse cx="75" cy="56" rx="19" ry="26" fill="#EA580C" stroke="#9A3412" strokeWidth="1.8" />

          <ellipse cx="36" cy="57" rx="18" ry="28" fill="#F97316" stroke="#C2410C" strokeWidth="1.6" />
          <ellipse cx="64" cy="57" rx="18" ry="28" fill="#F97316" stroke="#C2410C" strokeWidth="1.6" />

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
              <polygon points="34,44 26,53 39,53" fill="#431407" stroke="#78350F" strokeWidth="1.2" strokeLinejoin="round" />
              <polygon points="66,44 61,53 74,53" fill="#431407" stroke="#78350F" strokeWidth="1.2" strokeLinejoin="round" />
              <polygon points="50,53 46,59 54,59" fill="#431407" stroke="#78350F" strokeWidth="1" strokeLinejoin="round" />
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
      </div>

      {/* VOLCANO CANDY ERUPTION DIRECTLY ON NORMAL PAGE (NO OVERLAY, FULL SCREEN) */}
      {candies.length > 0 && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden select-none">
          {candies.map((candy) => (
            <div
              key={candy.id}
              style={{
                left: `${candy.x}px`,
                top: `${candy.y}px`,
                transform: `translate(-50%, -50%) rotate(${candy.rotation}deg) scale(${candy.scale})`,
                fontSize: `${candy.size}px`,
                opacity: candy.opacity,
                lineHeight: 1,
              }}
              className="fixed pointer-events-none select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
            >
              {candy.emoji}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
