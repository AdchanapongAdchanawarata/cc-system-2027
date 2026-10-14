"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Trophy, X, RotateCcw } from "lucide-react";

interface HalloweenPumpkinProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

interface CandyParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  collected: boolean;
}

interface FloatScore {
  id: number;
  x: number;
  y: number;
  text: string;
}

// Pleasant Web Audio API sound effects (Zero external files needed)
function playPopSound(freq = 550) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

function playCollectSound(step = 0) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
    const freq = notes[step % notes.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

function playCelebrationFanfare() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const melody = [523.25, 659.25, 783.99, 1046.5];
    melody.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.26);
    });
  } catch {
    // Ignore
  }
}

const CANDY_EMOJIS = ["🍬", "🍭", "🍫", "🍩", "🍪", "🧁", "🍡", "🎃", "⭐", "✨", "🍬", "🍭", "🍫", "🍬"];

export default function HalloweenPumpkin({
  size,
  className = "w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14",
  glow = true,
}: HalloweenPumpkinProps) {
  const [active, setActive] = useState(false);
  const [isJiggling, setIsJiggling] = useState(false);
  const [lit, setLit] = useState(true);

  // Minigame & Candy Burst State
  const [isMinigameActive, setIsMinigameActive] = useState(false);
  const [candies, setCandies] = useState<CandyParticle[]>([]);
  const [floatScores, setFloatScores] = useState<FloatScore[]>([]);
  const [score, setScore] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const pumpkinRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Active during Halloween season (until Oct 31, 23:59:59)
    const now = new Date();
    setActive(now.getMonth() === 9 && now.getDate() <= 31);
  }, []);

  // Spawn candy explosion burst
  const spawnCandies = useCallback((count = 42) => {
    const rect = pumpkinRef.current?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth * 0.8;
    const originY = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.65;

    const newParticles: CandyParticle[] = [];
    for (let i = 0; i < count; i++) {
      // Upward spread angle (-160 deg to -20 deg)
      const angle = -Math.PI * 0.88 + Math.random() * Math.PI * 0.76;
      const speed = Math.random() * 17 + 13;
      newParticles.push({
        id: Date.now() + i + Math.random(),
        emoji: CANDY_EMOJIS[Math.floor(Math.random() * CANDY_EMOJIS.length)],
        x: originX + (Math.random() - 0.5) * 20,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        size: Math.floor(Math.random() * 14) + 28, // 28px - 42px
        collected: false,
      });
    }

    setCandies((prev) => [...prev, ...newParticles]);
  }, []);

  // Handle click on the pumpkin: trigger burst & launch minigame
  const handlePumpkinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsJiggling(true);
    setLit(true);
    playPopSound(500);

    // Launch minigame
    setIsMinigameActive(true);
    setShowCelebration(false);
    spawnCandies(45);

    setTimeout(() => setIsJiggling(false), 700);
  };

  // Catch / Collect a candy
  const handleCollectCandy = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const target = candies.find((c) => c.id === id);
    if (!target || target.collected) return;

    playCollectSound(collectedCount);

    const scoreId = Date.now() + Math.random();
    setFloatScores((prev) => [
      ...prev,
      { id: scoreId, x: target.x, y: target.y, text: "+10 🍬" },
    ]);
    setTimeout(() => {
      setFloatScores((prev) => prev.filter((s) => s.id !== scoreId));
    }, 800);

    setScore((s) => s + 10);
    const nextCount = collectedCount + 1;
    setCollectedCount(nextCount);

    setCandies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collected: true } : c))
    );

    // Trigger celebration when reaching 15+ candies
    if (nextCount === 15) {
      setShowCelebration(true);
      playCelebrationFanfare();
    }
  };

  // Physics animation loop for candies
  useEffect(() => {
    if (!isMinigameActive || candies.length === 0) return;

    const gravity = 0.42;
    const friction = 0.99;

    const updatePhysics = () => {
      const floorY = typeof window !== "undefined" ? window.innerHeight - 70 : 600;
      const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1000;

      setCandies((prev) => {
        let hasActive = false;
        const next = prev.map((c) => {
          if (c.collected) return c;
          hasActive = true;

          let x = c.x + c.vx;
          let y = c.y + c.vy;
          let vy = c.vy + gravity;
          let vx = c.vx * friction;
          const rotation = c.rotation + c.vRot;

          // Bounce off bottom floor
          if (y > floorY) {
            y = floorY;
            vy = -vy * 0.52;
            vx *= 0.88;
            if (Math.abs(vy) < 1.2) vy = 0;
          }

          // Bounce off side walls
          if (x < 25) {
            x = 25;
            vx = -vx * 0.65;
          } else if (x > screenWidth - 45) {
            x = screenWidth - 45;
            vx = -vx * 0.65;
          }

          return { ...c, x, y, vx, vy, rotation };
        });

        if (hasActive) {
          animFrameRef.current = requestAnimationFrame(updatePhysics);
        }
        return next;
      });
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isMinigameActive, candies.length]);

  if (!active) return null;

  return (
    <div
      ref={pumpkinRef}
      className={`group relative pointer-events-auto cursor-pointer select-none transition-transform duration-300 hover:scale-115 active:scale-95 ${className}`}
      onClick={handlePumpkinClick}
      title="ฟักทองฮาโลวีนแจ็คโอแลนเทิร์น 🎃 (Trick or Treat! แตะเพื่อเล่นมินิเกมเสกขนมหวาน!)"
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
        @keyframes pumpkinJiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-12deg) scale(1.2, 0.92); }
          40% { transform: rotate(12deg) scale(0.92, 1.18); }
          60% { transform: rotate(-6deg) scale(1.1, 0.96); }
          80% { transform: rotate(5deg) scale(0.98, 1.05); }
        }
        @keyframes bubbleFloat {
          0%, 100% {
            transform: translate(-50%, 0) scale(1);
          }
          50% {
            transform: translate(-50%, -7px) scale(1.06);
          }
        }
        .pumpkin-glow {
          animation: pumpkinFlicker 3s ease-in-out infinite;
        }
        .pumpkin-attention {
          animation: pumpkinAttentionShake 4.2s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .pumpkin-jiggle {
          animation: pumpkinJiggle 0.65s ease-in-out;
          transform-origin: bottom center;
        }
        .bubble-float {
          animation: bubbleFloat 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* Attention-Seeking "Trick or Treat!" Speech Bubble (ลอยสั่นดึงดูดความสนใจ) */}
      <div className="absolute bottom-[108%] left-1/2 z-30 pointer-events-none bubble-float">
        <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 text-slate-950 font-black text-[10px] sm:text-[11px] shadow-[0_4px_16px_rgba(245,158,11,0.6)] border border-amber-200/90 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 ring-2 ring-white/90">
          <span className="text-[11px] sm:text-[12px] animate-pulse">🎃</span>
          <span className="tracking-tight leading-none">Trick or Treat!</span>
          <span className="text-[11px] sm:text-[12px]">🍬</span>
        </div>
        {/* Pointer Arrow */}
        <div className="w-0 h-0 border-l-[4px] sm:border-l-[5px] border-l-transparent border-r-[4px] sm:border-r-[5px] border-r-transparent border-t-[5px] sm:border-t-[6px] border-t-orange-400 mx-auto -mt-0.5 filter drop-shadow-xs" />
      </div>

      <div className={`w-full h-full relative ${isJiggling ? "pumpkin-jiggle" : "pumpkin-attention"}`}>
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

      {/* FULL-SCREEN CANDY BURST MINIGAME OVERLAY (SURPRISE PORTAL) */}
      {isMinigameActive && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[100000] pointer-events-auto overflow-hidden bg-black/25 backdrop-blur-xs select-none animate-in fade-in duration-200"
          onClick={() => {
            // Click background spawns extra candies for endless fun!
            spawnCandies(15);
            playPopSound(620);
          }}
        >
          {/* Top HUD: Score & Minigame Control Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100010] flex items-center gap-2.5 sm:gap-4 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/90 dark:border-white/20 shadow-[0_0_25px_rgba(255,255,255,0.9),0_12px_40px_rgba(0,0,0,0.18)] ring-1 ring-white/90 animate-in slide-in-from-top-4 duration-300"
          >
            {/* Treat Bag Badge */}
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              <span className="text-base sm:text-lg animate-bounce">🍬</span>
              <span>เก็บได้:</span>
              <span className="font-mono text-orange-600 dark:text-orange-400 font-black">
                {collectedCount}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-zinc-700" />

            {/* Score Badge */}
            <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
              <Sparkles size={14} className="text-amber-500 animate-spin-slow" />
              <span className="font-mono font-black">{score}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-sans">PTS</span>
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-zinc-700" />

            {/* Button: Spawn More Treats */}
            <button
              type="button"
              onClick={() => {
                spawnCandies(25);
                playPopSound(700);
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="เสกลูกกวาดเพิ่ม"
            >
              <span>🎃 เสกเพิ่ม!</span>
            </button>

            {/* Button: Close Minigame */}
            <button
              type="button"
              onClick={() => {
                setIsMinigameActive(false);
                setCandies([]);
              }}
              className="p-1 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="ปิดมินิเกม"
            >
              <X size={17} />
            </button>
          </div>

          {/* Celebratory Banner when reaching milestones */}
          {showCelebration && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[100010] flex flex-col items-center px-6 py-4 rounded-3xl bg-gradient-to-b from-amber-400 via-orange-500 to-amber-500 text-slate-950 shadow-[0_0_40px_rgba(245,158,11,0.8)] border-2 border-white animate-in zoom-in-95 bounce-in duration-300"
            >
              <div className="flex items-center gap-2 text-base sm:text-lg font-black tracking-tight">
                <Trophy size={20} className="text-yellow-200 animate-bounce" />
                <span>HAPPY HALLOWEEN! ได้รับขนมหวานเต็มถุง 🍬🎉</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-amber-950 mt-1">
                คลิกเก็บลูกกวาดที่เหลือบนหน้าจอ หรือกดเสกลูกกวาดเล่นต่อได้เลย!
              </p>
              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="mt-2 text-[11px] font-bold underline text-amber-950 hover:text-white cursor-pointer"
              >
                เล่นต่อ
              </button>
            </div>
          )}

          {/* Floating Score Indicators (+10 🍬) */}
          {floatScores.map((fs) => (
            <div
              key={fs.id}
              style={{
                left: `${fs.x}px`,
                top: `${fs.y}px`,
              }}
              className="fixed pointer-events-none text-base sm:text-lg font-black text-amber-500 font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-out fade-out slide-out-to-top-8 duration-700 z-[100008]"
            >
              {fs.text}
            </div>
          ))}

          {/* Interactive Flying & Floating Candies */}
          {candies.map((candy) => {
            if (candy.collected) return null;
            return (
              <div
                key={candy.id}
                onClick={(e) => handleCollectCandy(e, candy.id)}
                style={{
                  left: `${candy.x}px`,
                  top: `${candy.y}px`,
                  transform: `translate(-50%, -50%) rotate(${candy.rotation}deg)`,
                  fontSize: `${candy.size}px`,
                  lineHeight: 1,
                }}
                className="fixed z-[100005] cursor-pointer hover:scale-135 active:scale-75 transition-transform duration-75 select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]"
              >
                {candy.emoji}
              </div>
            );
          })}

          {/* Hint toast at the bottom */}
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium tracking-wide shadow-lg border border-white/20">
            🎯 แตะหรือคลิกที่ลูกกวาดบนหน้าจอเพื่อเก็บขนมหวาน! (หรือคลิกที่ว่างเพื่อเสกเพิ่ม)
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
