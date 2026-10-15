"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Trophy, Flame, X, Volume2, VolumeX, Sparkles, RefreshCw,
  Send, ArrowRight, Award, Zap, ChevronRight, ChevronLeft
} from "lucide-react";
import {
  HalloweenScoreEntry,
  fetchHalloweenLeaderboard,
  submitHalloweenScore,
  getPlayerTitle
} from "@/utils/halloweenLeaderboardService";

interface HalloweenMinigameArenaProps {
  isOpen: boolean;
  onClose: () => void;
  pumpkinOrigin?: { x: number; y: number };
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
  points: number;
  isRare: boolean;
  settled: boolean;
  opacity: number;
  bounceCount: number;
}

interface FloatingScoreText {
  id: number;
  text: string;
  x: number;
  y: number;
  opacity: number;
  color: string;
  scale: number;
}

const CANDY_TYPES = [
  { emoji: "🍬", points: 10, isRare: false, weight: 35 },
  { emoji: "🍭", points: 20, isRare: false, weight: 25 },
  { emoji: "🍫", points: 30, isRare: false, weight: 20 },
  { emoji: "🍩", points: 25, isRare: false, weight: 15 },
  { emoji: "🎃", points: 50, isRare: true, weight: 8 },
  { emoji: "👻", points: 100, isRare: true, weight: 4 },
  { emoji: "⭐", points: 75, isRare: true, weight: 6 },
  { emoji: "🕷️", points: 40, isRare: false, weight: 10 },
];

const MAX_PARTICLES = 160;
const ROUND_DURATION_SECONDS = 18;

export default function HalloweenMinigameArena({
  isOpen,
  onClose,
  pumpkinOrigin,
}: HalloweenMinigameArenaProps) {
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [candiesCaught, setCandiesCaught] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_SECONDS);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<HalloweenScoreEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<CandyParticle[]>([]);
  const floatingTextsRef = useRef<FloatingScoreText[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Basket position
  const basketPosRef = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 500, targetX: typeof window !== "undefined" ? window.innerWidth / 2 : 500 });
  const basketDomRef = useRef<HTMLDivElement | null>(null);
  const [basketSquash, setBasketSquash] = useState(false);

  // Audio Context Singleton
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);

  // Sound Engine
  const playSound = useCallback((type: "catch" | "rare" | "volcano" | "gameover" | "combo") => {
    if (!soundEnabled) return;
    try {
      const now = Date.now();
      if (type === "volcano" && now - lastSoundTimeRef.current < 70) return;
      lastSoundTimeRef.current = now;

      const AudioClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      if (type === "catch") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.11);
      } else if (type === "rare") {
        const notes = [659.25, 880, 1046.5, 1318.5]; // E5, A5, C6, E6 arpeggio
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.05 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.05);
          osc.stop(ctx.currentTime + idx * 0.05 + 0.16);
        });
      } else if (type === "volcano") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.23);
      } else if (type === "gameover") {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 triumphant
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.28, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.28);
        });
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Initial Load & Player Name
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_halloween_last_player_name") || localStorage.getItem("cc_user_name") || "จ๊อบ AA";
      setPlayerName(saved);
      fetchHalloweenLeaderboard().then(setLeaderboard);
    }
  }, []);

  // Spawn Volcano Burst
  const triggerVolcanoBurst = useCallback((count = 35) => {
    playSound("volcano");

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Use pumpkin origin if provided, otherwise right-lower center
    const originX = pumpkinOrigin?.x || width * 0.78;
    const originY = pumpkinOrigin?.y || height * 0.65;

    const newParticles: CandyParticle[] = [];

    // Total weight calculation
    const totalWeight = CANDY_TYPES.reduce((acc, c) => acc + c.weight, 0);

    for (let i = 0; i < count; i++) {
      // Pick candy type by weight
      let rand = Math.random() * totalWeight;
      let selected = CANDY_TYPES[0];
      for (const t of CANDY_TYPES) {
        if (rand < t.weight) {
          selected = t;
          break;
        }
        rand -= t.weight;
      }

      // Fan angle: mainly upwards and spreading across the workspace
      const angle = -Math.PI * 0.88 + Math.random() * Math.PI * 0.76;
      const speed = Math.random() * 22 + 16;
      const vx = Math.cos(angle) * speed * (1.1 + Math.random() * 0.6);
      const vy = Math.sin(angle) * speed;

      newParticles.push({
        id: Math.random() + Date.now(),
        emoji: selected.emoji,
        x: originX + (Math.random() - 0.5) * 30,
        y: originY + (Math.random() - 0.5) * 20,
        vx,
        vy,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 22,
        size: selected.isRare ? 36 : Math.floor(Math.random() * 12) + 26,
        points: selected.points,
        isRare: selected.isRare,
        settled: false,
        opacity: 1,
        bounceCount: 0,
      });
    }

    const current = particlesRef.current;
    if (current.length + newParticles.length > MAX_PARTICLES) {
      particlesRef.current = [...current.slice(-(MAX_PARTICLES - newParticles.length)), ...newParticles];
    } else {
      particlesRef.current = [...current, ...newParticles];
    }
  }, [pumpkinOrigin, playSound]);

  // Start / Reset Round
  const startGame = useCallback(() => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setCandiesCaught(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(ROUND_DURATION_SECONDS);
    setHasSubmitted(false);
    particlesRef.current = [];
    floatingTextsRef.current = [];

    // Initial Burst
    setTimeout(() => {
      triggerVolcanoBurst(42);
    }, 200);

    // Wave 2 after 5s
    setTimeout(() => {
      triggerVolcanoBurst(32);
    }, 5500);

    // Wave 3 after 10s
    setTimeout(() => {
      triggerVolcanoBurst(38);
    }, 10500);
  }, [triggerVolcanoBurst]);

  // Round Timer
  useEffect(() => {
    if (!isOpen || !isPlaying || isGameOver) return;

    roundTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(roundTimerRef.current!);
          setIsGameOver(true);
          playSound("gameover");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, [isOpen, isPlaying, isGameOver, playSound]);

  // Track Mouse / Touch for Basket
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if ("clientX" in e) {
        clientX = e.clientX;
      }
      basketPosRef.current.targetX = clientX;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        basketPosRef.current.targetX = Math.max(70, basketPosRef.current.targetX - 45);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        basketPosRef.current.targetX = Math.min(window.innerWidth - 70, basketPosRef.current.targetX + 45);
      } else if (e.key === " " && isPlaying && !isGameOver) {
        triggerVolcanoBurst(25);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isPlaying, isGameOver, triggerVolcanoBurst, onClose]);

  // 60FPS Physics & Catch Loop
  useEffect(() => {
    if (!isOpen) return;

    let isRunning = true;

    const loop = () => {
      if (!isRunning) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const gravity = 0.62;
      const floorY = height - 32;

      // Smooth basket lerp
      const basket = basketPosRef.current;
      basket.x += (basket.targetX - basket.x) * 0.22;
      const basketW = Math.min(130, width * 0.28);
      const basketH = 46;
      const basketY = height - 90;

      // Update Basket DOM position for crisp high-end rendering
      if (basketDomRef.current) {
        basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY}px, 0)`;
        basketDomRef.current.style.width = `${basketW}px`;
      }

      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const remaining: CandyParticle[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!p.settled) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += gravity;
          p.vx *= 0.994;
          p.rotation += p.vRot;

          // Wall Bouncing (Left & Right)
          if (p.x <= p.size / 2) {
            p.x = p.size / 2;
            p.vx = -p.vx * 0.65;
          } else if (p.x >= width - p.size / 2) {
            p.x = width - p.size / 2;
            p.vx = -p.vx * 0.65;
          }

          // Basket Catch Detection (AABB + Inflow check)
          const inBasketX = p.x >= basket.x - basketW / 2 - 10 && p.x <= basket.x + basketW / 2 + 10;
          const inBasketY = p.y >= basketY - 10 && p.y <= basketY + basketH + 15;
          const fallingDown = p.vy > 0;

          if (inBasketX && inBasketY && fallingDown && isPlaying && !isGameOver) {
            // CAUGHT!
            playSound(p.isRare ? "rare" : "catch");
            setBasketSquash(true);
            setTimeout(() => setBasketSquash(false), 140);

            // Combo logic
            setCombo((prev) => {
              const next = prev + 1;
              setMaxCombo((mc) => Math.max(mc, next));
              return next;
            });

            // Score with combo bonus
            const multiplier = combo >= 5 ? 2.5 : combo >= 3 ? 1.8 : 1.0;
            const pointsAwarded = Math.round(p.points * multiplier);
            setScore((prev) => prev + pointsAwarded);
            setCandiesCaught((prev) => prev + 1);

            // Floating text
            floatingTextsRef.current.push({
              id: Math.random(),
              text: `+${pointsAwarded}${p.isRare ? " 🌟" : ""}`,
              x: p.x,
              y: basketY - 15,
              opacity: 1,
              color: p.isRare ? "#FBBF24" : multiplier > 1 ? "#FF6200" : "#10B981",
              scale: p.isRare ? 1.4 : multiplier > 1 ? 1.25 : 1,
            });

            // Don't keep particle (eaten by basket)
            continue;
          }

          // Floor Bouncing & Settling
          if (p.y >= floorY - p.size / 2) {
            p.y = floorY - p.size / 2;
            p.vy = -p.vy * 0.42; // bounce damping
            p.vx *= 0.88; // ground friction
            p.bounceCount += 1;

            if (Math.abs(p.vy) < 1.2 && Math.abs(p.vx) < 0.8) {
              p.settled = true;
              p.vy = 0;
              p.vx = 0;
            }
          }
        } else {
          // Settled on floor: fade out slowly
          p.opacity -= 0.008;
        }

        if (p.opacity > 0) {
          remaining.push(p);

          // Render Candy on Canvas
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);

          // Glow for rare items
          if (p.isRare) {
            ctx.shadowColor = "#F59E0B";
            ctx.shadowBlur = 14;
          }

          ctx.font = `${p.size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
          ctx.restore();
        }
      }

      particlesRef.current = remaining;

      // Render Floating Score Texts
      const fRemaining: FloatingScoreText[] = [];
      for (let j = 0; j < floatingTextsRef.current.length; j++) {
        const ft = floatingTextsRef.current[j];
        ft.y -= 1.8;
        ft.opacity -= 0.025;

        if (ft.opacity > 0) {
          fRemaining.push(ft);
          ctx.save();
          ctx.globalAlpha = Math.max(0, ft.opacity);
          ctx.font = `900 ${Math.round(20 * ft.scale)}px sans-serif`;
          ctx.fillStyle = ft.color;
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 8;
          ctx.textAlign = "center";
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      }
      floatingTextsRef.current = fRemaining;

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    // Set canvas dimensions
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Auto-start game on open
    startGame();
    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, isPlaying, isGameOver, combo, playSound, startGame]);

  // Submit High Score Handler
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingScore || hasSubmitted || !playerName.trim()) return;

    setIsSubmittingScore(true);
    try {
      const updated = await submitHalloweenScore({
        playerName: playerName.trim(),
        score,
        candiesCaught,
        maxCombo,
      });
      setLeaderboard(updated);
      setHasSubmitted(true);
    } catch (err) {
      console.error("Failed to submit score:", err);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] pointer-events-auto select-none font-sans overflow-hidden animate-in fade-in duration-200">
      
      {/* Background Ambience: Translucent Spooky Vignette Over Workspace */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-all"
        onClick={() => {
          if (isPlaying && !isGameOver) {
            triggerVolcanoBurst(20);
          }
        }}
      />

      {/* Screen Edge Ambient Neon Glow */}
      <div className="absolute inset-0 pointer-events-none border-[3px] border-[#FF6200]/30 shadow-[inset_0_0_80px_rgba(255,98,0,0.18)]" />

      {/* 60FPS Hardware Accelerated Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Floating Halloween Basket (Movable with Mouse/Touch) */}
      <div
        ref={basketDomRef}
        className={`fixed top-0 left-0 pointer-events-none z-30 transition-transform duration-75 will-change-transform ${
          basketSquash ? "scale-x-115 scale-y-85" : "scale-100"
        }`}
      >
        <div className="relative w-full h-[52px] flex items-center justify-center">
          {/* Basket Glow Aura */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/30 via-orange-500/40 to-amber-500/30 blur-md pointer-events-none" />
          
          {/* Basket Body */}
          <div className="relative w-full h-full bg-gradient-to-b from-amber-600 via-orange-600 to-amber-700 border-2 border-amber-300 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-between px-3">
            {/* Basket Handle Accent */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 border-t-2 border-x-2 border-amber-300 rounded-t-full pointer-events-none" />

            {/* Left Jack-o'-Lantern Emblem */}
            <span className="text-xl filter drop-shadow-md animate-bounce">🎃</span>

            {/* Center Basket Caught Counter */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-amber-100 uppercase tracking-widest font-mono">
                BASKET
              </span>
              <span className="text-xs font-black text-white font-mono leading-none">
                {candiesCaught} ชิ้น
              </span>
            </div>

            {/* Right Candy Emblem */}
            <span className="text-xl filter drop-shadow-md">🍬</span>
          </div>
        </div>
      </div>

      {/* TOP ARCADE HUD (Score, Timer, Controls) */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-[0_12px_35px_rgba(0,0,0,0.4)] text-white pointer-events-auto">
        {/* Mode / Logo Badge */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/15">
          <span className="text-lg animate-pulse">🌋</span>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[9px] font-black text-[#FF6200] uppercase tracking-wider font-mono">
              HALLOWEEN VOLCANO
            </span>
            <span className="text-[11px] font-bold text-slate-200 leading-tight">
              มินิเกมเก็บขนมฮาโลวีน
            </span>
          </div>
        </div>

        {/* Score Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40">
          <Trophy size={15} className="text-amber-400" />
          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-amber-300">
            {score}
          </span>
        </div>

        {/* Countdown Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-black ${
          timeLeft <= 5 
            ? "bg-rose-500/30 border-rose-400 text-rose-300 animate-pulse text-base sm:text-lg"
            : "bg-slate-800/80 border-slate-700 text-slate-200 text-sm sm:text-base"
        }`}>
          <span>⏳</span>
          <span>{timeLeft}s</span>
        </div>

        {/* Combo Indicator */}
        {combo >= 2 && (
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500/30 to-rose-500/30 border border-orange-400/50 text-orange-300 text-xs font-black animate-bounce">
            <Flame size={13} className="text-orange-400" />
            <span>COMBO x{combo}</span>
          </div>
        )}

        {/* Burst More Button */}
        <button
          type="button"
          onClick={() => triggerVolcanoBurst(28)}
          disabled={isGameOver}
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF6200] hover:bg-[#EE5500] active:scale-95 text-white text-xs font-black shadow-[0_2px_10px_rgba(255,98,0,0.35)] transition-all cursor-pointer disabled:opacity-40"
          title="ยิงลูกกวาดภูเขาไฟเพิ่ม!"
        >
          <Zap size={13} />
          <span>ยิงเพิ่ม!</span>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        {/* Leaderboard Toggle */}
        <button
          type="button"
          onClick={() => setShowLeaderboard((v) => !v)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            showLeaderboard ? "bg-amber-500/30 text-amber-300 border border-amber-400/40" : "bg-slate-800/80 text-slate-400"
          }`}
          title="กระดานผู้นำ"
        >
          <Award size={14} />
          <span className="hidden md:inline">บอร์ด</span>
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-rose-100 flex items-center justify-center transition-colors cursor-pointer"
          title="ออกจากมินิเกม (ESC)"
        >
          <X size={16} />
        </button>
      </header>

      {/* FLOATING LEADERBOARD PANEL (ทางขวาของหน้าจอทำงาน) */}
      {showLeaderboard && (
        <aside className="absolute right-4 top-20 bottom-24 w-72 sm:w-80 z-30 pointer-events-auto flex flex-col rounded-3xl bg-slate-900/85 backdrop-blur-md border border-amber-500/30 shadow-[0_16px_45px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.15)] overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Plaque Header */}
          <div className="p-3.5 pb-2.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div>
                <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                  SPOOKY HALL OF FAME
                </h3>
                <p className="text-[10px] text-slate-400">
                  กระดานคะแนนฮาโลวีน CC TEAM
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLeaderboard(false)}
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Ranking Scroll Area */}
          <div className="flex-1 p-2.5 space-y-1.5 overflow-y-auto custom-scrollbar">
            {leaderboard.map((item, idx) => {
              const isTop1 = idx === 0;
              const isTop2 = idx === 1;
              const isTop3 = idx === 2;

              return (
                <div
                  key={item.id || idx}
                  className={`p-2.5 rounded-2xl transition-all flex items-center gap-2.5 ${
                    isTop1
                      ? "bg-gradient-to-r from-amber-500/25 to-orange-500/20 border border-amber-400/50 shadow-xs"
                      : isTop2
                      ? "bg-slate-800/80 border border-slate-600/60"
                      : isTop3
                      ? "bg-slate-800/60 border border-amber-700/40"
                      : "bg-slate-900/60 hover:bg-slate-800/50 border border-white/5"
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-xs shrink-0">
                    {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : (
                      <span className="text-slate-400 font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Player Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {item.playerName}
                      </span>
                      <span className="text-xs font-black font-mono text-amber-300 shrink-0">
                        {item.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span className="truncate">{item.titleEarned || "นักล่าขนม"}</span>
                      <span>{item.candiesCaught} ชิ้น</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard Footer */}
          <div className="p-2 border-t border-white/10 text-center text-[10px] text-slate-400 font-mono">
            {leaderboard.length} ผู้เล่นในประวัติการณ์ • อัปเดตสด
          </div>
        </aside>
      )}

      {/* GAME OVER & CONGRATULATIONS POPUP MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="relative max-w-md w-full rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/50 p-6 sm:p-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_35px_rgba(245,158,11,0.25)]">
            
            {/* Top Crown Emblem */}
            <div className="w-16 h-16 mx-auto -mt-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 border-2 border-white shadow-[0_8px_25px_rgba(245,158,11,0.5)] flex items-center justify-center text-3xl animate-bounce">
              🎃
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-black text-[#FF6200] uppercase tracking-[0.2em] font-mono">
                HALLOWEEN VOLCANO COMPLETE
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                ภารกิจภูเขาไฟฮาโลวีนสำเร็จ!
              </h2>
              <p className="text-xs text-amber-200/80 mt-1">
                {getPlayerTitle(score)}
              </p>
            </div>

            {/* Score Highlight Box */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 border border-amber-400/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                FINAL SCORE
              </span>
              <div className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 mt-0.5">
                {score}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">เก็บขนมได้</span>
                  <span className="font-bold text-slate-100">{candiesCaught} ชิ้น</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">คอมโบสูงสุด</span>
                  <span className="font-bold text-orange-400">x{maxCombo}</span>
                </div>
              </div>
            </div>

            {/* Name Input & Submit Form */}
            {!hasSubmitted ? (
              <form onSubmit={handleSubmitScore} className="space-y-3">
                <div className="text-left">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    พิมพ์ชื่อของคุณเพื่อบันทึกลงกระดานเกียรติยศ:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={24}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="ใส่ชื่อหรือฉายา..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-amber-400 focus:outline-none text-white text-sm font-semibold placeholder:text-slate-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingScore || !playerName.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#EE5500] hover:from-[#EE5500] hover:to-[#D94400] active:scale-95 text-white text-sm font-black shadow-[0_6px_20px_rgba(255,98,0,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{isSubmittingScore ? "กำลังบันทึก..." : "🏆 บันทึกคะแนนลง Leaderboard"}</span>
                </button>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold mb-3 flex items-center justify-center gap-2">
                <span>✅</span>
                <span>บันทึกคะแนนของคุณเรียบร้อยแล้ว!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={startGame}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>เล่นใหม่อีกรอบ</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>กลับสู่หน้าทำงาน</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
