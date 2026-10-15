"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import HalloweenMinigameArena from "./HalloweenMinigameArena";

interface HalloweenPumpkinProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

interface VolcanoParticle {
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  opacity: number;
}

// Audio Singleton to prevent audio context memory leaks & browser audio limits
let sharedAudioCtx: AudioContext | null = null;
let lastSoundTime = 0;

function playPopSound() {
  try {
    const now = Date.now();
    // Throttle sound to at most once per 80ms to prevent sound buffer overload when spammed
    if (now - lastSoundTime < 80) return;
    lastSoundTime = now;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }

    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    const freq = 520;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, sharedAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, sharedAudioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, sharedAudioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.start();
    osc.stop(sharedAudioCtx.currentTime + 0.16);
  } catch {
    // Ignore audio policy restrictions
  }
}

const VOLCANO_EMOJIS = [
  "🍬", "🍭", "🍫", "🍩", "🍪", "🧁", "🍡", "🎃", "⭐", "✨",
  "🍬", "🍭", "🍫", "🍬", "🍭", "🎉", "🎃", "✨", "🍫", "🍬"
];

// Maximum active particles on screen (strictly capped to ensure 60fps with zero lag even when spammed)
const MAX_PARTICLES = 130;

export default function HalloweenPumpkin({
  size,
  className = "w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14",
  glow = true,
}: HalloweenPumpkinProps) {
  const [active, setActive] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [lit, setLit] = useState(true);
  const [hasActiveCandies, setHasActiveCandies] = useState(false);
  const [isArenaOpen, setIsArenaOpen] = useState(false);
  const [originCoord, setOriginCoord] = useState<{ x: number; y: number } | undefined>(undefined);

  const pumpkinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<VolcanoParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const isLoopRunningRef = useRef(false);

  useEffect(() => {
    // Active during Halloween season (until Oct 31, 23:59:59)
    const now = new Date();
    setActive(now.getMonth() === 9 && now.getDate() <= 31);
  }, []);

  // High-performance canvas physics & render loop (0 React re-renders, 60fps GPU accelerated)
  const runPhysicsLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      isLoopRunningRef.current = false;
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isLoopRunningRef.current = false;
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const gravity = 0.65;

    ctx.clearRect(0, 0, width, height);

    const particles = particlesRef.current;
    const remaining: VolcanoParticle[] = [];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.vx *= 0.992;
      p.rotation += p.vRot;

      // Start fading out when falling down towards the bottom
      if (p.y > height * 0.72) {
        p.opacity -= 0.024;
      }

      if (p.opacity > 0 && p.y < height + 60) {
        remaining.push(p);

        // Draw emoji candy onto GPU canvas
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = `${p.size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      }
    }

    particlesRef.current = remaining;

    if (remaining.length > 0) {
      animFrameIdRef.current = requestAnimationFrame(runPhysicsLoop);
    } else {
      ctx.clearRect(0, 0, width, height);
      isLoopRunningRef.current = false;
      setHasActiveCandies(false);
    }
  }, []);

  // Update canvas resolution on resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Volcano candy trigger & minigame launcher (In-Situ Workspace Arena)
  const handlePumpkinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBursting(true);
    setLit(true);
    playPopSound();

    setTimeout(() => setIsBursting(false), 500);

    const rect = pumpkinRef.current?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth * 0.8;
    const originY = rect ? rect.top + rect.height * 0.4 : window.innerHeight * 0.65;
    setOriginCoord({ x: originX, y: originY });

    // Launch in-situ minigame arena directly on workspace screen
    setIsArenaOpen(true);
  };

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
          25% { transform: scale(1.3, 0.78); }
          50% { transform: scale(0.88, 1.25); }
          75% { transform: scale(1.08, 0.96); }
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
          animation: pumpkinVolcanoBurst 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-origin: bottom center;
        }
        .bubble-side-float {
          animation: bubbleSideFloat 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Horror-Comic "Trick or Treat! 🍬 CLICK TO PLAY!" Speech Bubble - Positioned to the RIGHT of Pumpkin (ไม่บังหน้าน้อง CC) */}
      <div className="absolute -top-3.5 left-[92%] sm:left-[96%] z-30 pointer-events-none bubble-side-float">
        <div className="relative px-2.5 py-1 rounded-2xl bg-gradient-to-r from-lime-400 via-amber-400 to-orange-500 text-slate-950 font-black text-[10px] sm:text-[11.5px] shadow-[0_4px_18px_rgba(245,158,11,0.65)] border-2 border-slate-950 whitespace-nowrap flex items-center gap-1.5 ring-2 ring-amber-300">
          {/* Bubble tail pointing left towards the pumpkin */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-slate-950 filter drop-shadow-xs" />
          <span className="text-[12px] animate-bounce">🎃</span>
          <div className="flex flex-col text-left">
            <span className="tracking-tight leading-none text-slate-950 font-black">Trick or Treat!</span>
            <span className="text-[8.5px] font-black text-amber-950 uppercase tracking-wider font-mono">🕹️ CLICK TO PLAY!</span>
          </div>
          <span className="text-[12px] animate-pulse">🍬</span>
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

      {/* IN-SITU FULL-WORKSPACE HALLOWEEN MINIGAME ARENA & LEADERBOARD */}
      {isArenaOpen && (
        <HalloweenMinigameArena
          isOpen={isArenaOpen}
          onClose={() => setIsArenaOpen(false)}
          pumpkinOrigin={originCoord}
        />
      )}

      {/* Fallback fast canvas if arena is not open */}
      {hasActiveCandies && !isArenaOpen && typeof document !== "undefined" && createPortal(
        <canvas
          ref={canvasRef}
          className="fixed inset-0 z-[99999] pointer-events-none select-none"
        />,
        document.body
      )}
    </div>
  );
}
