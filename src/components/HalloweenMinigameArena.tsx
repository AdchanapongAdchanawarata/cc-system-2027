"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Volume2, VolumeX, X, RefreshCw, Send, Zap } from "lucide-react";
import {
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
  { emoji: "🍬", points: 10, isRare: false, weight: 30 },
  { emoji: "🍭", points: 20, isRare: false, weight: 25 },
  { emoji: "🍫", points: 30, isRare: false, weight: 20 },
  { emoji: "🍩", points: 25, isRare: false, weight: 15 },
  { emoji: "🎃", points: 50, isRare: true, weight: 12 },
  { emoji: "👻", points: 100, isRare: true, weight: 8 },
  { emoji: "⭐", points: 75, isRare: true, weight: 10 },
  { emoji: "🍪", points: 20, isRare: false, weight: 15 },
  { emoji: "🧁", points: 35, isRare: false, weight: 12 },
  { emoji: "🕷️", points: 40, isRare: false, weight: 8 },
];

const ROUND_DURATION_SECONDS = 5;
const MAX_PARTICLES = 130;

export default function HalloweenMinigameArena({
  isOpen,
  onClose,
  pumpkinOrigin,
}: HalloweenMinigameArenaProps) {
  // Game lifecycle state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Final stats for game over modal
  const [finalScore, setFinalScore] = useState(0);
  const [finalCandies, setFinalCandies] = useState(0);
  const [finalMaxCombo, setFinalMaxCombo] = useState(0);

  // Mutable refs for 60fps zero-lag updates (no React re-renders during active gameplay)
  const isPlayingRef = useRef(false);
  const isGameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const candiesCaughtRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const timeLeftRef = useRef(ROUND_DURATION_SECONDS);

  // DOM Refs for direct zero-latency HUD rendering
  const scoreDomRef = useRef<HTMLSpanElement | null>(null);
  const timerDomRef = useRef<HTMLSpanElement | null>(null);
  const comboDomRef = useRef<HTMLDivElement | null>(null);
  const caughtDomRef = useRef<HTMLSpanElement | null>(null);
  const basketDomRef = useRef<HTMLDivElement | null>(null);

  // Canvas & Physics Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<CandyParticle[]>([]);
  const floatingTextsRef = useRef<FloatingScoreText[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Basket coordinate tracker
  const basketPosRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
    targetX: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
  });

  // Audio Context Singleton
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);

  // Sound Engine
  const playSound = useCallback((type: "catch" | "rare" | "volcano" | "gameover") => {
    if (!soundEnabled) return;
    try {
      const now = Date.now();
      if (type === "volcano" && now - lastSoundTimeRef.current < 80) return;
      lastSoundTimeRef.current = now;

      const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
        osc.frequency.setValueAtTime(640, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(940, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "rare") {
        const notes = [659.25, 880, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
          gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.04 + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.04);
          osc.stop(ctx.currentTime + idx * 0.04 + 0.15);
        });
      } else if (type === "volcano") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(340, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.28, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.23);
      } else if (type === "gameover") {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
        });
      }
    } catch {
      // Audio autoplay fallback
    }
  }, [soundEnabled]);

  // Initial Player Name
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem("cc_halloween_last_player_name") ||
        localStorage.getItem("cc_user_name") ||
        "ผู้เล่นนิรนาม";
      setPlayerName(saved);
    }
  }, []);

  // Spectacular Candy Volcano Eruption: Explodes out of the pumpkin in a high-energy fountain arc
  const triggerVolcanoBurst = useCallback((count = 36) => {
    if (typeof window === "undefined") return;
    playSound("volcano");

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Use pumpkin origin on the grass
    const originX = pumpkinOrigin?.x || width * 0.78;
    const originY = pumpkinOrigin?.y || height * 0.65;

    const totalWeight = CANDY_TYPES.reduce((acc, c) => acc + c.weight, 0);
    const newItems: CandyParticle[] = [];

    for (let i = 0; i < count; i++) {
      let rand = Math.random() * totalWeight;
      let selected = CANDY_TYPES[0];
      for (const t of CANDY_TYPES) {
        if (rand < t.weight) {
          selected = t;
          break;
        }
        rand -= t.weight;
      }

      // Volcano explosion angle: Arcs high up and fans left towards the center and sky
      // Angle between -155 deg and -35 deg
      const angle = -Math.PI * 0.86 + Math.random() * Math.PI * 0.66;
      // High upward burst velocity
      const speed = Math.random() * 12 + 18;
      const vx = Math.cos(angle) * speed * (1.1 + Math.random() * 0.4);
      const vy = Math.sin(angle) * speed;

      newItems.push({
        id: Math.random() + Date.now(),
        emoji: selected.emoji,
        x: originX + (Math.random() - 0.5) * 24,
        y: originY + (Math.random() - 0.5) * 16,
        vx,
        vy,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 22,
        size: selected.isRare ? 38 : Math.floor(Math.random() * 12) + 26,
        points: selected.points,
        isRare: selected.isRare,
        settled: false,
        opacity: 1,
        bounceCount: 0,
      });
    }

    const current = particlesRef.current;
    if (current.length + newItems.length > MAX_PARTICLES) {
      particlesRef.current = [...current.slice(-(MAX_PARTICLES - newItems.length)), ...newItems];
    } else {
      particlesRef.current = [...current, ...newItems];
    }
  }, [pumpkinOrigin, playSound]);

  // Clean finish function
  const finishGame = useCallback(() => {
    // Clear all timers
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    if (waveTimerRef.current) clearTimeout(waveTimerRef.current);

    isPlayingRef.current = false;
    isGameOverRef.current = true;

    setIsPlaying(false);
    setIsGameOver(true);
    playSound("gameover");

    // Capture final scores
    setFinalScore(scoreRef.current);
    setFinalCandies(candiesCaughtRef.current);
    setFinalMaxCombo(maxComboRef.current);
  }, [playSound]);

  // Start / Restart 5-Second Blitz Game
  const startGame = useCallback(() => {
    // Reset flags
    isPlayingRef.current = true;
    isGameOverRef.current = false;
    setIsPlaying(true);
    setIsGameOver(false);
    setHasSubmitted(false);

    scoreRef.current = 0;
    candiesCaughtRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    timeLeftRef.current = ROUND_DURATION_SECONDS;

    // Reset DOM HUD
    if (scoreDomRef.current) scoreDomRef.current.innerText = "0";
    if (timerDomRef.current) timerDomRef.current.innerText = `${ROUND_DURATION_SECONDS}s`;
    if (caughtDomRef.current) caughtDomRef.current.innerText = "0 ชิ้น";
    if (comboDomRef.current) comboDomRef.current.style.display = "none";

    particlesRef.current = [];
    floatingTextsRef.current = [];

    // Wave 1: Immediate massive volcanic eruption!
    setTimeout(() => {
      triggerVolcanoBurst(38);
    }, 100);

    // Wave 2: Mid-game eruption at 2.5s for peak excitement!
    if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    waveTimerRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        triggerVolcanoBurst(28);
      }
    }, 2400);

    // 5-Second Strict Countdown Timer
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    roundTimerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      const remaining = timeLeftRef.current;

      if (timerDomRef.current) {
        timerDomRef.current.innerText = `${Math.max(0, remaining)}s`;
      }

      if (remaining <= 0) {
        finishGame();
      }
    }, 1000);
  }, [triggerVolcanoBurst, finishGame]);

  // Clean up all timers when unmounted
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    };
  }, []);

  // Track Mouse & Touch for Basket Movement
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
        basketPosRef.current.targetX = Math.max(80, basketPosRef.current.targetX - 55);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        basketPosRef.current.targetX = Math.min(window.innerWidth - 80, basketPosRef.current.targetX + 55);
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
  }, [isOpen, onClose]);

  // 60FPS Physics & Catch Loop (Independent from React re-renders)
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
      const gravity = 0.58;
      const floorY = height - 25;

      // Big realistic basket dimensions
      const basketW = Math.min(280, Math.max(190, width * 0.32));
      const basketH = Math.round(basketW * 0.53);
      const basketY = height - basketH - 18;
      const catchY = basketY + basketH * 0.43;

      // Smooth basket lerp tracking
      const basket = basketPosRef.current;
      basket.x += (basket.targetX - basket.x) * 0.28;

      if (basketDomRef.current) {
        basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY}px, 0)`;
        basketDomRef.current.style.width = `${basketW}px`;
        basketDomRef.current.style.height = `${basketH}px`;
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

          // Wall bouncing
          if (p.x <= p.size / 2) {
            p.x = p.size / 2;
            p.vx = -p.vx * 0.55;
          } else if (p.x >= width - p.size / 2) {
            p.x = width - p.size / 2;
            p.vx = -p.vx * 0.55;
          }

          // Generous Basket Catch Zone
          const catchSpan = basketW * 0.42;
          const inBasketX = p.x >= basket.x - catchSpan && p.x <= basket.x + catchSpan;
          const inBasketY = p.y >= catchY - 18 && p.y <= catchY + 26;
          const isFalling = p.vy > 0;

          if (inBasketX && inBasketY && isFalling && isPlayingRef.current && !isGameOverRef.current) {
            // CAUGHT!
            playSound(p.isRare ? "rare" : "catch");

            // Basket bounce animation
            if (basketDomRef.current) {
              basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY + 5}px, 0) scale(1.06, 0.94)`;
              setTimeout(() => {
                if (basketDomRef.current) {
                  basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY}px, 0) scale(1, 1)`;
                }
              }, 90);
            }

            // Combo & Score
            comboRef.current += 1;
            if (comboRef.current > maxComboRef.current) {
              maxComboRef.current = comboRef.current;
            }

            const multiplier = comboRef.current >= 5 ? 2.5 : comboRef.current >= 3 ? 1.8 : 1.0;
            const pointsAwarded = Math.round(p.points * multiplier);
            scoreRef.current += pointsAwarded;
            candiesCaughtRef.current += 1;

            // Direct HUD updates without React re-render lag
            if (scoreDomRef.current) scoreDomRef.current.innerText = String(scoreRef.current);
            if (caughtDomRef.current) caughtDomRef.current.innerText = `${candiesCaughtRef.current} ชิ้น`;
            if (comboDomRef.current) {
              if (comboRef.current >= 2) {
                comboDomRef.current.innerText = `🔥 COMBO x${comboRef.current}`;
                comboDomRef.current.style.display = "inline-flex";
              } else {
                comboDomRef.current.style.display = "none";
              }
            }

            // Floating Score text
            floatingTextsRef.current.push({
              id: Math.random(),
              text: `+${pointsAwarded}${p.isRare ? " ⭐" : ""}`,
              x: p.x,
              y: catchY - 15,
              opacity: 1,
              color: p.isRare ? "#FBBF24" : multiplier > 1 ? "#FF6200" : "#10B981",
              scale: p.isRare ? 1.35 : multiplier > 1 ? 1.2 : 1.0,
            });

            continue;
          }

          // Floor Bouncing
          if (p.y >= floorY - p.size / 2) {
            p.y = floorY - p.size / 2;
            p.vy = -p.vy * 0.35;
            p.vx *= 0.85;
            p.bounceCount += 1;

            if (Math.abs(p.vy) < 1.0 && Math.abs(p.vx) < 0.6) {
              p.settled = true;
              p.vy = 0;
              p.vx = 0;
            }
          }
        } else {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0) {
          remaining.push(p);

          // Fast GPU rendering
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

      // Floating Score Texts
      const fRemaining: FloatingScoreText[] = [];
      for (let j = 0; j < floatingTextsRef.current.length; j++) {
        const ft = floatingTextsRef.current[j];
        ft.y -= 1.8;
        ft.opacity -= 0.028;

        if (ft.opacity > 0) {
          fRemaining.push(ft);
          ctx.save();
          ctx.globalAlpha = Math.max(0, ft.opacity);
          ctx.font = `900 ${Math.round(20 * ft.scale)}px sans-serif`;
          ctx.fillStyle = ft.color;
          ctx.textAlign = "center";
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      }
      floatingTextsRef.current = fRemaining;

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    // Canvas resolution setup
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Start 60fps loop
    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, playSound]);

  // Start game once upon opening
  useEffect(() => {
    if (!isOpen) return;
    startGame();
  }, [isOpen]); // Only triggers when arena opens! Never restarts on score/gameover state!

  // Submit Score & Finish Game
  const handleSubmitAndFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingScore || !playerName.trim()) return;

    setIsSubmittingScore(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("cc_halloween_last_player_name", playerName.trim());
      }
      await submitHalloweenScore({
        playerName: playerName.trim(),
        score: finalScore,
        candiesCaught: finalCandies,
        maxCombo: finalMaxCombo,
      });
      setHasSubmitted(true);
      playSound("rare");
      
      // Close modal and return smoothly to normal workspace page
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error("Failed to submit score:", err);
      onClose();
    } finally {
      setIsSubmittingScore(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] pointer-events-auto select-none font-sans overflow-hidden animate-in fade-in duration-200">
      
      {/* Translucent Spooky Ambience over Workspace */}
      <div 
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1.5px] transition-all cursor-pointer"
        onClick={() => {
          if (isPlayingRef.current && !isGameOverRef.current) {
            triggerVolcanoBurst(20);
          }
        }}
        title="แตะหน้าจอเพื่อยิงลูกกวาดภูเขาไฟเพิ่ม!"
      />

      {/* Screen Edge Ambient Neon Glow */}
      <div className="absolute inset-0 pointer-events-none border-[3px] border-[#FF6200]/30 shadow-[inset_0_0_80px_rgba(255,98,0,0.18)]" />

      {/* 60FPS Hardware Accelerated Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* BIG AUTHENTIC HALLOWEEN WICKER BASKET */}
      <div
        ref={basketDomRef}
        className="fixed top-0 left-0 pointer-events-none z-30 transition-transform duration-75 will-change-transform filter drop-shadow-[0_14px_28px_rgba(0,0,0,0.5)]"
      >
        <div className="relative w-full h-full">
          <svg viewBox="0 0 280 150" className="w-full h-full overflow-visible" fill="none">
            <defs>
              <linearGradient id="basketBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="45%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#9A3412" />
              </linearGradient>
              <linearGradient id="rimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#78350F" />
                <stop offset="50%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
            </defs>

            {/* Ground shadow beneath basket */}
            <ellipse cx="140" cy="142" rx="105" ry="7" fill="rgba(0,0,0,0.35)" />

            {/* High Sturdy Arched Handle */}
            <path d="M 46 68 C 46 2, 234 2, 234 68" stroke="url(#handleGrad)" strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M 46 68 C 46 2, 234 2, 234 68" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="10 8" />

            {/* Deep Interior Cavity where candies actually fall */}
            <ellipse cx="140" cy="65" rx="116" ry="24" fill="#200B02" stroke="#581C87" strokeWidth="2" />
            <ellipse cx="140" cy="65" rx="108" ry="19" fill="#140501" />

            {/* Outer Wicker Basket Body */}
            <path d="M 24 65 Q 16 112, 58 136 Q 140 146, 222 136 Q 264 112, 256 65 Z" fill="url(#basketBodyGrad)" stroke="#451A03" strokeWidth="5" strokeLinejoin="round" />

            {/* Wicker Horizontal Weave Lines */}
            <path d="M 30 84 Q 140 100, 250 84" stroke="#7C2D12" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 40 105 Q 140 120, 240 105" stroke="#7C2D12" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 54 124 Q 140 136, 226 124" stroke="#7C2D12" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            {/* Wicker Vertical Texture Ribs */}
            <path d="M 76 68 Q 72 104, 82 135" stroke="#FDBA74" strokeWidth="3" fill="none" strokeDasharray="7 6" opacity="0.85" />
            <path d="M 112 70 Q 110 105, 116 140" stroke="#FDBA74" strokeWidth="3" fill="none" strokeDasharray="7 6" opacity="0.85" />
            <path d="M 140 70 Q 140 106, 140 142" stroke="#FDBA74" strokeWidth="3.5" fill="none" strokeDasharray="7 6" opacity="0.85" />
            <path d="M 168 70 Q 170 105, 164 140" stroke="#FDBA74" strokeWidth="3" fill="none" strokeDasharray="7 6" opacity="0.85" />
            <path d="M 204 68 Q 208 104, 198 135" stroke="#FDBA74" strokeWidth="3" fill="none" strokeDasharray="7 6" opacity="0.85" />

            {/* Front 3D Rim Lip */}
            <path d="M 24 65 C 24 80, 256 80, 256 65 C 256 59, 24 59, 24 65 Z" fill="url(#rimGrad)" stroke="#78350F" strokeWidth="4" />

            {/* Cute Glowing Jack-o'-Lantern Face */}
            <polygon points="106,96 122,86 122,96" fill="#FEF08A" stroke="#451A03" strokeWidth="2" />
            <polygon points="174,96 158,86 158,96" fill="#FEF08A" stroke="#451A03" strokeWidth="2" />
            <polygon points="140,98 146,106 134,106" fill="#FEF08A" stroke="#451A03" strokeWidth="1.5" />
            <path d="M 100,109 Q 140,131 180,109 Q 168,121 140,123 Q 112,121 100,109 Z" fill="#FEF08A" stroke="#451A03" strokeWidth="2" />
          </svg>

          {/* Caught Candies Badge on Basket */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-950/85 border border-amber-400/70 shadow-md flex items-center gap-1.5 whitespace-nowrap pointer-events-none">
            <span className="text-[12px] animate-bounce">🍬</span>
            <span
              ref={caughtDomRef}
              className="text-xs font-black font-mono text-amber-300 leading-tight"
            >
              0 ชิ้น
            </span>
          </div>
        </div>
      </div>

      {/* TOP ARCADE HUD */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-full bg-slate-900/90 backdrop-blur-md border-2 border-amber-400/50 shadow-[0_12px_35px_rgba(0,0,0,0.5)] text-white pointer-events-auto">
        {/* Game Title Badge */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/20">
          <span className="text-xl animate-pulse">🎃</span>
          <span className="text-xs font-black text-amber-300 font-mono hidden sm:inline tracking-wide">
            CANDY VOLCANO!
          </span>
        </div>

        {/* Live Score Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/60 shadow-inner">
          <span className="text-sm">⭐</span>
          <span
            ref={scoreDomRef}
            className="text-base sm:text-lg font-black font-mono tracking-tight text-amber-300 min-w-[28px] text-center"
          >
            0
          </span>
        </div>

        {/* 5-Second Blitz Countdown */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-400/70 shadow-inner">
          <span className="animate-spin" style={{ animationDuration: "3s" }}>⏳</span>
          <span
            ref={timerDomRef}
            className="text-base sm:text-lg font-black font-mono text-rose-300 min-w-[32px] text-center animate-pulse"
          >
            5s
          </span>
        </div>

        {/* Combo Indicator */}
        <div
          ref={comboDomRef}
          style={{ display: "none" }}
          className="items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500/40 to-rose-500/40 border border-orange-400 text-orange-200 text-xs font-black animate-bounce font-mono"
        >
          🔥 COMBO
        </div>

        {/* Burst More Candies Button */}
        <button
          type="button"
          onClick={() => triggerVolcanoBurst(24)}
          disabled={isGameOver}
          className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF6200] hover:bg-[#EE5500] active:scale-95 text-white text-xs font-black shadow-[0_2px_10px_rgba(255,98,0,0.4)] transition-all cursor-pointer disabled:opacity-40"
          title="ยิงลูกกวาดภูเขาไฟเพิ่ม!"
        >
          <Zap size={13} />
          <span>พุ่งเพิ่ม!</span>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        {/* Close Button: Instantly exits to normal screen */}
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-rose-100 flex items-center justify-center transition-colors cursor-pointer"
          title="ออกจากมินิเกม (ESC)"
        >
          <X size={16} />
        </button>
      </header>

      {/* GAME OVER & CONGRATULATIONS CELEBRATION MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="relative max-w-md w-full rounded-3xl bg-gradient-to-b from-[#241142] via-[#1a0b30] to-[#110521] border-2 border-amber-400/80 p-6 sm:p-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_40px_rgba(245,158,11,0.35)]">
            
            {/* Top Bouncing Halloween Emblem */}
            <div className="w-18 h-18 mx-auto -mt-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 border-2 border-white shadow-[0_8px_25px_rgba(245,158,11,0.6)] flex items-center justify-center text-3xl animate-bounce">
              🎃
            </div>

            <div className="mt-3">
              <span className="text-[11px] font-black text-[#FF6200] uppercase tracking-[0.2em] font-mono">
                ⚡ 5-SECOND BLITZ FINISHED!
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                🎉 หมดเวลา 5 วินาทีสุดมันส์!
              </h2>
              <p className="text-xs font-bold text-amber-200 mt-1">
                {getPlayerTitle(finalScore)}
              </p>
            </div>

            {/* Score Highlight Box */}
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 border border-amber-400/50">
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest font-mono">
                คะแนนรวมที่คุณทำได้
              </span>
              <div className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-100 mt-1">
                ⭐ {finalScore}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">เก็บขนมได้</span>
                  <span className="font-bold text-slate-100 text-sm">🍬 {finalCandies} ชิ้น</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">คอมโบสูงสุด</span>
                  <span className="font-bold text-orange-400 text-sm">🔥 x{finalMaxCombo}</span>
                </div>
              </div>
            </div>

            {/* Name Input & Submit to Return to Normal Screen */}
            <form onSubmit={handleSubmitAndFinish} className="space-y-3">
              <div className="text-left">
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  ✨ ใส่ชื่อของคุณเพื่อบันทึกสถิติ:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={24}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="ใส่ชื่อหรือฉายา..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border-2 border-amber-400/60 focus:border-amber-300 focus:outline-none text-white text-sm font-semibold placeholder:text-slate-500 font-sans shadow-inner"
                />
              </div>

              {/* Big button: Saves and exits immediately to normal page */}
              <button
                type="submit"
                disabled={isSubmittingScore || !playerName.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF6200] via-[#FF7700] to-[#EE5500] hover:from-[#EE5500] hover:to-[#D94400] active:scale-95 text-white text-sm font-black shadow-[0_6px_22px_rgba(255,98,0,0.45)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Send size={16} />
                <span>
                  {isSubmittingScore ? "กำลังบันทึก..." : hasSubmitted ? "✅ บันทึกแล้ว!" : "🏆 บันทึกคะแนน & ออกจากเกม"}
                </span>
              </button>
            </form>

            {/* Quick Action Footer */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={startGame}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>🕹️ เล่นอีกรอบ (5 วิ)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>ออกจากเกม</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
