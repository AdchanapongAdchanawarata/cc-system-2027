"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Volume2, VolumeX, X, RefreshCw, Send, Zap, Trophy, ChevronRight, ChevronLeft } from "lucide-react";
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

interface CatchSparkle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

// Fierce Fiery-Eyed Jack-o'-Lantern Emblem (ฟักทองตาไฟดุดัน)
function FiercePumpkinEmblem({ className = "w-24 h-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="fpBody" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="65%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </radialGradient>
        <linearGradient id="fpFire" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="35%" stopColor="#F97316" />
          <stop offset="70%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FEF08A" />
        </linearGradient>
        <radialGradient id="fpFireCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FEF08A" />
          <stop offset="75%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </radialGradient>
        <filter id="flameGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Pumpkin Stem */}
      <path d="M 57 26 C 55 12, 65 6, 74 8 C 72 16, 65 24, 63 26 Z" fill="#365314" stroke="#14532D" strokeWidth="2" />
      <path d="M 62 10 Q 75 14, 70 24" stroke="#84CC16" strokeWidth="1.5" fill="none" />

      {/* Outer Lobes Shadow */}
      <ellipse cx="28" cy="58" rx="18" ry="28" fill="#7C2D12" />
      <ellipse cx="92" cy="58" rx="18" ry="28" fill="#7C2D12" />

      {/* Secondary Lobes */}
      <ellipse cx="36" cy="59" rx="20" ry="32" fill="url(#fpBody)" stroke="#431407" strokeWidth="2.5" />
      <ellipse cx="84" cy="59" rx="20" ry="32" fill="url(#fpBody)" stroke="#431407" strokeWidth="2.5" />

      {/* Center Lobes */}
      <ellipse cx="48" cy="60" rx="20" ry="34" fill="url(#fpBody)" stroke="#431407" strokeWidth="2.5" />
      <ellipse cx="72" cy="60" rx="20" ry="34" fill="url(#fpBody)" stroke="#431407" strokeWidth="2.5" />
      <ellipse cx="60" cy="61" rx="20" ry="35" fill="url(#fpBody)" stroke="#431407" strokeWidth="2.5" />

      {/* FIERCE MENACING SLANTED EYES (ตาไฟดุดัน) */}
      <polygon points="26,45 52,49 43,58" fill="#DC2626" opacity="0.8" filter="url(#flameGlow)" />
      <polygon points="94,45 68,49 77,58" fill="#DC2626" opacity="0.8" filter="url(#flameGlow)" />

      {/* Left Fierce Eye */}
      <polygon points="28,47 50,50 42,57" fill="url(#fpFire)" stroke="#431407" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="32,48 48,51 43,55" fill="url(#fpFireCore)" />

      {/* Right Fierce Eye */}
      <polygon points="92,47 70,50 78,57" fill="url(#fpFire)" stroke="#431407" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="88,48 72,51 77,55" fill="url(#fpFireCore)" />

      {/* Sharp Menacing Nose */}
      <polygon points="60,56 65,65 55,65" fill="url(#fpFire)" stroke="#431407" strokeWidth="1.8" />

      {/* WICKED JAGGED SHARP FANGED MOUTH */}
      <path d="M 28 68 Q 60 98, 92 68 Q 80 84, 60 86 Q 40 84, 28 68 Z" fill="#DC2626" opacity="0.85" filter="url(#flameGlow)" />
      <path d="M 28 69 Q 60 96, 92 69 Q 80 85, 60 87 Q 40 85, 28 69 Z" fill="#431407" stroke="#431407" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 32 72 Q 60 93, 88 72 Q 78 83, 60 85 Q 42 83, 32 72 Z" fill="url(#fpFire)" />
      <polygon points="40,71 44,78 48,72" fill="#431407" />
      <polygon points="54,73 58,82 62,73" fill="#431407" />
      <polygon points="68,73 72,82 76,73" fill="#431407" />
      <polygon points="46,84 50,77 54,84" fill="#431407" />
      <polygon points="62,85 66,78 70,85" fill="#431407" />
      <polygon points="78,81 81,75 84,80" fill="#431407" />
    </svg>
  );
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

// Round duration set to 10 seconds per user request
const ROUND_DURATION_SECONDS = 10;
const MAX_PARTICLES = 160;

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<HalloweenScoreEntry[]>([]);

  // Visible candies accumulated inside the pumpkin bucket!
  const [caughtCandiesDisplay, setCaughtCandiesDisplay] = useState<string[]>([]);

  // Final stats for game over modal
  const [finalScore, setFinalScore] = useState(0);
  const [finalCandies, setFinalCandies] = useState(0);
  const [finalMaxCombo, setFinalMaxCombo] = useState(0);
  const [rankAchieved, setAchievedRank] = useState<number | null>(null);
  const [closingCountdown, setClosingCountdown] = useState<number | null>(null);

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
  const sparklesRef = useRef<CatchSparkle[]>([]);
  const floatingTextsRef = useRef<FloatingScoreText[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveTimer1Ref = useRef<NodeJS.Timeout | null>(null);
  const waveTimer2Ref = useRef<NodeJS.Timeout | null>(null);

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
      if (type === "volcano" && now - lastSoundTimeRef.current < 75) return;
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

  // Initial Player Name & Leaderboard retrieval
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem("cc_halloween_last_player_name") ||
        localStorage.getItem("cc_user_name") ||
        "ผู้เล่นนิรนาม";
      setPlayerName(saved);
      fetchHalloweenLeaderboard().then(setLeaderboard);
    }
  }, []);

  // Spectacular Candy Volcano Burst from pumpkin
  const triggerVolcanoBurst = useCallback((count = 38) => {
    if (typeof window === "undefined") return;
    playSound("volcano");

    const width = window.innerWidth;
    const height = window.innerHeight;

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
      const angle = -Math.PI * 0.88 + Math.random() * Math.PI * 0.72;
      const speed = Math.random() * 12 + 18;
      const vx = Math.cos(angle) * speed * (1.1 + Math.random() * 0.5);
      const vy = Math.sin(angle) * speed;

      newItems.push({
        id: Math.random() + Date.now(),
        emoji: selected.emoji,
        x: originX + (Math.random() - 0.5) * 26,
        y: originY + (Math.random() - 0.5) * 16,
        vx,
        vy,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 24,
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
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    if (waveTimer1Ref.current) clearTimeout(waveTimer1Ref.current);
    if (waveTimer2Ref.current) clearTimeout(waveTimer2Ref.current);

    isPlayingRef.current = false;
    isGameOverRef.current = true;

    setIsPlaying(false);
    setIsGameOver(true);
    playSound("gameover");

    setFinalScore(scoreRef.current);
    setFinalCandies(candiesCaughtRef.current);
    setFinalMaxCombo(maxComboRef.current);

    // Refresh leaderboard
    fetchHalloweenLeaderboard().then(setLeaderboard);
  }, [playSound]);

  // Start / Restart 10-Second Blitz Game
  const startGame = useCallback(() => {
    isPlayingRef.current = true;
    isGameOverRef.current = false;
    setIsPlaying(true);
    setIsGameOver(false);
    setHasSubmitted(false);
    setAchievedRank(null);
    setClosingCountdown(null);

    scoreRef.current = 0;
    candiesCaughtRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    timeLeftRef.current = ROUND_DURATION_SECONDS;
    setCaughtCandiesDisplay([]);

    if (scoreDomRef.current) scoreDomRef.current.innerText = "0";
    if (timerDomRef.current) timerDomRef.current.innerText = `${ROUND_DURATION_SECONDS}s`;
    if (caughtDomRef.current) caughtDomRef.current.innerText = "0 ชิ้น";
    if (comboDomRef.current) comboDomRef.current.style.display = "none";

    particlesRef.current = [];
    sparklesRef.current = [];
    floatingTextsRef.current = [];

    // Wave 1: Immediate massive volcanic explosion!
    setTimeout(() => {
      triggerVolcanoBurst(45);
    }, 100);

    // Wave 2: Mid-game eruption at 3.5s!
    if (waveTimer1Ref.current) clearTimeout(waveTimer1Ref.current);
    waveTimer1Ref.current = setTimeout(() => {
      if (isPlayingRef.current) {
        triggerVolcanoBurst(32);
      }
    }, 3500);

    // Wave 3: Late-game eruption at 7.0s!
    if (waveTimer2Ref.current) clearTimeout(waveTimer2Ref.current);
    waveTimer2Ref.current = setTimeout(() => {
      if (isPlayingRef.current) {
        triggerVolcanoBurst(30);
      }
    }, 7000);

    // 10-Second Countdown Timer
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
      if (waveTimer1Ref.current) clearTimeout(waveTimer1Ref.current);
      if (waveTimer2Ref.current) clearTimeout(waveTimer2Ref.current);
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
      const gravity = 0.58;
      const floorY = height - 25;

      // Pumpkin bucket dimensions
      const basketW = Math.min(270, Math.max(190, width * 0.32));
      const basketH = Math.round(basketW * 0.54);
      const basketY = height - basketH - 18;
      const catchY = basketY + basketH * 0.44;

      // Smooth basket lerp tracking & tilt
      const basket = basketPosRef.current;
      const dx = basket.targetX - basket.x;
      basket.x += dx * 0.28;
      const tilt = Math.max(-14, Math.min(14, dx * 0.08));

      if (basketDomRef.current) {
        basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY}px, 0) rotate(${tilt}deg)`;
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

          // Pumpkin Bucket Catch Zone
          const catchSpan = basketW * 0.43;
          const inBasketX = p.x >= basket.x - catchSpan && p.x <= basket.x + catchSpan;
          const inBasketY = p.y >= catchY - 18 && p.y <= catchY + 28;
          const isFalling = p.vy > 0;

          if (inBasketX && inBasketY && isFalling && isPlayingRef.current && !isGameOverRef.current) {
            // CAUGHT!
            playSound(p.isRare ? "rare" : "catch");

            // Basket bounce animation
            if (basketDomRef.current) {
              basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY + 5}px, 0) scale(1.06, 0.94) rotate(${tilt}deg)`;
              setTimeout(() => {
                if (basketDomRef.current) {
                  basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY}px, 0) scale(1, 1) rotate(${tilt}deg)`;
                }
              }, 90);
            }

            // Burst juicy arcade sparkles on catch!
            for (let s = 0; s < 8; s++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 4.5;
              sparklesRef.current.push({
                id: Math.random(),
                x: p.x,
                y: catchY,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 1.8,
                size: 2.5 + Math.random() * 3,
                color: p.isRare
                  ? "#FDE047"
                  : ["#FF6200", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"][Math.floor(Math.random() * 5)],
                opacity: 1,
              });
            }

            // Visible candy inside basket: Add candy emoji to the bucket pile!
            setCaughtCandiesDisplay((prev) => {
              if (prev.length >= 22) return prev;
              return [...prev, p.emoji];
            });

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

          // Rare item glowing aura
          if (p.isRare) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity * 0.35);
            ctx.fillStyle = "#F59E0B";
            ctx.shadowColor = "#FBBF24";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

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

      // Arcade Sparkles Rendering & Physics
      const sRemaining: CatchSparkle[] = [];
      for (let s = 0; s < sparklesRef.current.length; s++) {
        const sp = sparklesRef.current[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.16;
        sp.opacity -= 0.045;

        if (sp.opacity > 0) {
          sRemaining.push(sp);
          ctx.save();
          ctx.globalAlpha = Math.max(0, sp.opacity);
          ctx.fillStyle = sp.color;
          ctx.shadowColor = sp.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      sparklesRef.current = sRemaining;

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

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

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
  }, [isOpen]);

  // Submit Score & Finish Game
  const handleSubmitAndFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingScore || !playerName.trim()) return;

    setIsSubmittingScore(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("cc_halloween_last_player_name", playerName.trim());
      }
      const updated = await submitHalloweenScore({
        playerName: playerName.trim(),
        score: finalScore,
        candiesCaught: finalCandies,
        maxCombo: finalMaxCombo,
      });
      setLeaderboard(updated);
      setHasSubmitted(true);
      playSound("rare");

      // Calculate player's achieved rank in the updated leaderboard
      const nameKey = playerName.trim().toLowerCase();
      const rankIdx = updated.findIndex(
        (entry) =>
          entry.playerName.trim().toLowerCase() === nameKey &&
          entry.score === finalScore
      );
      const computedRank = rankIdx !== -1 ? rankIdx + 1 : 1;
      setAchievedRank(computedRank);

      // Give 3 seconds to proudly see the rank announcement, then close
      setClosingCountdown(3);
      const timer = setInterval(() => {
        setClosingCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to submit score:", err);
      onClose();
    } finally {
      setIsSubmittingScore(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] pointer-events-auto select-none font-sans overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        // Stop bubbling so it never reaches parent pumpkin div!
        e.stopPropagation();
      }}
    >
      
      {/* Deep Spooky Halloween Ambience & Flying Bats/Fog */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-slate-950/50 to-black/60 backdrop-blur-[1.5px] transition-all cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (isPlayingRef.current && !isGameOverRef.current) {
            triggerVolcanoBurst(24);
          }
        }}
        title="แตะหน้าจอเพื่อระเบิดลูกกวาดภูเขาไฟเพิ่ม!"
      >
        {/* Animated Spooky Bats 🦇 */}
        <div className="absolute top-12 left-10 text-2xl animate-pulse opacity-70">🦇</div>
        <div className="absolute top-20 right-16 text-3xl animate-bounce opacity-65" style={{ animationDuration: "3.5s" }}>🦇</div>
        <div className="absolute top-36 left-1/4 text-xl opacity-60 animate-pulse">🦇</div>
        <div className="absolute top-28 right-1/3 text-2xl opacity-60 animate-pulse" style={{ animationDuration: "4s" }}>🦇</div>

        {/* Floating Spooky Ghosts 👻 */}
        <div className="absolute top-16 right-1/4 text-2xl animate-bounce opacity-50" style={{ animationDuration: "5s" }}>👻</div>
        <div className="absolute top-32 left-16 text-xl opacity-45 animate-pulse" style={{ animationDuration: "4.5s" }}>👻</div>

        {/* Eerie Mist Glow at Bottom */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-purple-900/30 to-transparent pointer-events-none" />
      </div>

      {/* Screen Edge Ambient Neon Glow */}
      <div className="absolute inset-0 pointer-events-none border-[3px] border-[#FF6200]/40 shadow-[inset_0_0_90px_rgba(168,85,247,0.25)]" />

      {/* 60FPS Hardware Accelerated Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* REAL JACK-O'-LANTERN PUMPKIN BUCKET (With Caught Candies Visible Inside!) */}
      <div
        ref={basketDomRef}
        className="fixed top-0 left-0 pointer-events-none z-30 transition-transform duration-75 will-change-transform filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.6)]"
      >
        <div className="relative w-full h-full">
          {/* Pumpkin Bucket SVG Illustration */}
          <svg viewBox="0 0 280 150" className="w-full h-full overflow-visible" fill="none">
            <defs>
              {/* Pumpkin Body Vibrant Gradient */}
              <linearGradient id="pumpkinBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFA000" />
                <stop offset="30%" stopColor="#FF6A00" />
                <stop offset="70%" stopColor="#E65100" />
                <stop offset="100%" stopColor="#BF360C" />
              </linearGradient>

              {/* Bucket Rim Lip */}
              <linearGradient id="pumpkinRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFD54F" />
                <stop offset="50%" stopColor="#FF8F00" />
                <stop offset="100%" stopColor="#E65100" />
              </linearGradient>

              {/* Handle Metal Gradient */}
              <linearGradient id="handleMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              {/* Face Candlelight Glow */}
              <radialGradient id="candleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF9C4" />
                <stop offset="60%" stopColor="#FFD54F" />
                <stop offset="100%" stopColor="#FF8F00" />
              </radialGradient>
            </defs>

            {/* Ground Shadow */}
            <ellipse cx="140" cy="144" rx="105" ry="8" fill="rgba(0,0,0,0.4)" />

            {/* Arched Black Metal Handle */}
            <path d="M 40 70 C 40 -8, 240 -8, 240 70" stroke="url(#handleMetalGrad)" strokeWidth="11" strokeLinecap="round" fill="none" />
            <path d="M 40 70 C 40 -8, 240 -8, 240 70" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="12 8" />
            {/* Handle Side Bolts */}
            <circle cx="40" cy="70" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="2" />
            <circle cx="240" cy="70" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="2" />

            {/* Deep Dark Pumpkin Cavity (Where caught candies collect!) */}
            <ellipse cx="140" cy="64" rx="116" ry="24" fill="#1C0600" stroke="#78350F" strokeWidth="3" />
            <ellipse cx="140" cy="64" rx="108" ry="19" fill="#0F0300" />

            {/* Volumetric Pumpkin Outer Lobes / Shell */}
            <path
              d="M 22 66 Q 10 115, 60 140 Q 140 152, 220 140 Q 270 115, 258 66 Z"
              fill="url(#pumpkinBodyGrad)"
              stroke="#5C1D02"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* Vertical Pumpkin Segment Ribs */}
            <path d="M 68 66 Q 52 108, 76 138" stroke="#7C2D12" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M 104 68 Q 96 112, 108 144" stroke="#7C2D12" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M 140 68 Q 140 114, 140 146" stroke="#7C2D12" strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M 176 68 Q 184 112, 172 144" stroke="#7C2D12" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M 212 66 Q 228 108, 204 138" stroke="#7C2D12" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.85" />

            {/* Front Pumpkin Lip / Rim Overlap */}
            <path d="M 22 64 C 22 80, 258 80, 258 64 C 258 57, 22 57, 22 64 Z" fill="url(#pumpkinRimGrad)" stroke="#78350F" strokeWidth="4" />

            {/* Glowing Carved Jack-o'-Lantern Face */}
            {/* Eyes */}
            <polygon points="104,98 122,86 122,98" fill="url(#candleGlow)" stroke="#451A03" strokeWidth="2.5" />
            <polygon points="176,98 158,86 158,98" fill="url(#candleGlow)" stroke="#451A03" strokeWidth="2.5" />
            {/* Nose */}
            <polygon points="140,100 146,108 134,108" fill="url(#candleGlow)" stroke="#451A03" strokeWidth="2" />
            {/* Wide Jagged Smiling Mouth */}
            <path
              d="M 96,112 Q 140,136 184,112 Q 170,128 140,129 Q 110,128 96,112 Z"
              fill="url(#candleGlow)"
              stroke="#451A03"
              strokeWidth="2.5"
            />
            {/* Carved Teeth */}
            <polygon points="124,115 130,122 136,115" fill="#BF360C" />
            <polygon points="144,115 150,122 156,115" fill="#BF360C" />
            <polygon points="134,127 140,120 146,127" fill="#BF360C" />
          </svg>

          {/* REAL COLLECTED CANDIES SITTING INSIDE THE PUMPKIN BUCKET! */}
          <div className="absolute top-[40px] left-[32px] right-[32px] h-[32px] flex items-center justify-center flex-wrap gap-0.5 overflow-hidden pointer-events-none z-10 px-2">
            {caughtCandiesDisplay.slice(-18).map((emoji, idx) => (
              <span
                key={idx}
                className="text-[15px] sm:text-[17px] filter drop-shadow-xs transition-all animate-in zoom-in duration-100"
                style={{
                  transform: `rotate(${(idx * 43) % 46 - 23}deg) translateY(${((idx * 17) % 6) - 3}px)`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>

          {/* Caught Candies Count Badge on Pumpkin Front */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-950/85 border border-amber-400/80 shadow-md flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-20">
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
      <header 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-full bg-slate-900/90 backdrop-blur-md border-2 border-amber-400/60 shadow-[0_12px_35px_rgba(0,0,0,0.6)] text-white pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* 10-Second Countdown Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-400/70 shadow-inner">
          <span className="animate-spin" style={{ animationDuration: "3s" }}>⏳</span>
          <span
            ref={timerDomRef}
            className="text-base sm:text-lg font-black font-mono text-rose-300 min-w-[34px] text-center animate-pulse"
          >
            10s
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

        {/* Burst More Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerVolcanoBurst(28);
          }}
          disabled={isGameOver}
          className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF6200] hover:bg-[#EE5500] active:scale-95 text-white text-xs font-black shadow-[0_2px_10px_rgba(255,98,0,0.4)] transition-all cursor-pointer disabled:opacity-40"
          title="ระเบิดลูกกวาดภูเขาไฟเพิ่ม!"
        >
          <Zap size={13} />
          <span>พุ่งเพิ่ม!</span>
        </button>

        {/* Top 10 Leaderboard Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowLeaderboard((v) => !v);
          }}
          className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
            showLeaderboard ? "bg-amber-500 text-slate-950 font-black shadow-md" : "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/50"
          }`}
          title="ดู 10 อันดับผู้นำสูงสุด"
        >
          <Trophy size={13} />
          <span>10 อันดับ</span>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSoundEnabled((v) => !v);
          }}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        {/* Close Button: Instantly exits to normal screen */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-rose-100 flex items-center justify-center transition-colors cursor-pointer"
          title="ออกจากมินิเกม (ESC)"
        >
          <X size={16} />
        </button>
      </header>

      {/* TOP 10 LEADERBOARD SIDE PANEL (When toggled from HUD) */}
      {showLeaderboard && (
        <aside 
          className="absolute right-4 top-20 bottom-24 w-72 sm:w-80 z-40 pointer-events-auto flex flex-col rounded-3xl bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/50 shadow-[0_16px_45px_rgba(0,0,0,0.7)] overflow-hidden animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3.5 pb-2.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-950/60 to-purple-950/60">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div>
                <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                  TOP 10 HALL OF FAME
                </h3>
                <p className="text-[10px] text-slate-300 font-sans">
                  10 อันดับผู้ทำคะแนนสูงสุด
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLeaderboard(false);
              }}
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex-1 p-2.5 space-y-1.5 overflow-y-auto custom-scrollbar">
            {leaderboard.slice(0, 10).map((item, idx) => {
              const isTop1 = idx === 0;
              const isTop2 = idx === 1;
              const isTop3 = idx === 2;

              return (
                <div
                  key={item.id || idx}
                  className={`p-2 rounded-2xl flex items-center gap-2 ${
                    isTop1
                      ? "bg-gradient-to-r from-amber-500/25 to-orange-500/20 border border-amber-400/60 shadow-xs"
                      : isTop2
                      ? "bg-slate-800/80 border border-slate-600/60"
                      : isTop3
                      ? "bg-slate-800/60 border border-amber-700/40"
                      : "bg-slate-900/70 border border-white/5"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-xs shrink-0">
                    {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : (
                      <span className="text-slate-400 font-bold">{idx + 1}</span>
                    )}
                  </div>

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
                      <span>🍬 {item.candiesCaught} ชิ้น</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* GAME OVER & CONGRATULATIONS CELEBRATION MODAL */}
      {isGameOver && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="relative max-w-md w-full rounded-3xl bg-gradient-to-b from-[#241142] via-[#1a0b30] to-[#110521] border-2 border-amber-400/80 p-6 sm:p-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.35)] max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Top Fierce Fiery-Eyed Jack-o'-Lantern Emblem (กราฟิกฟักทองตาไฟดุดัน) */}
            <div className="relative mx-auto -mt-16 flex items-center justify-center filter drop-shadow-[0_12px_28px_rgba(234,88,12,0.85)] animate-bounce" style={{ animationDuration: "2.4s" }}>
              <FiercePumpkinEmblem className="w-24 h-20 sm:w-28 sm:h-24" />
            </div>

            <div className="mt-3">
              <span className="text-[11px] font-black text-[#FF6200] uppercase tracking-[0.2em] font-mono">
                ⚡ 10-SECOND VOLCANO FINISHED!
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                🎉 หมดเวลา 10 วินาทีสุดมันส์!
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

            {/* Top 10 Leaderboard Preview inside Game Over */}
            <div className="my-3 text-left">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1 font-mono">
                  <Trophy size={13} className="text-amber-400" />
                  <span>10 อันดับผู้นำสูงสุด (Top 10):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">อัปเดตสด</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-slate-900/80 p-2 border border-white/10 custom-scrollbar">
                {leaderboard.slice(0, 10).map((entry, idx) => (
                  <div key={entry.id || idx} className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-white/5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-[11px] text-amber-400 w-4">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                      </span>
                      <span className="text-slate-200 font-semibold truncate max-w-[140px]">
                        {entry.playerName}
                      </span>
                    </div>
                    <span className="font-mono font-black text-amber-300 text-xs shrink-0">
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rank Announcement Banner (เมื่อกดบันทึกแล้ว จะขึ้นอันดับที่ได้ทันที) */}
            {rankAchieved !== null ? (
              <div className="my-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-orange-500/35 to-amber-500/25 border-2 border-amber-400 text-center shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center gap-2">
                  <Trophy size={22} className="text-amber-400 animate-bounce" />
                  <span className="text-lg font-black text-amber-300 font-mono tracking-wide">
                    คุณคว้าอันดับที่ #{rankAchieved}!
                  </span>
                </div>
                <p className="text-xs font-bold text-white mt-1">
                  {rankAchieved === 1
                    ? "👑 สุดยอดแชมป์อันดับ 1 ของ Hall of Fame!"
                    : rankAchieved <= 3
                    ? "🥈 ยอดฝีมือระดับท็อป 3 ฮาโลวีน!"
                    : rankAchieved <= 10
                    ? "🔥 ติดทำเนียบ Top 10 Hall of Fame!"
                    : "👏 ยอดเยี่ยมมาก! ร่วมท้าชิงอันดับใหม่ได้เรื่อยๆ"}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>กลับสู่หน้าหลัก</span>
                    {closingCountdown !== null && (
                      <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        {closingCountdown}s
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Name Input & Submit to Return to Normal Screen */
              <form onSubmit={handleSubmitAndFinish} className="space-y-3 mt-3">
                <div className="text-left">
                  <label className="text-xs font-bold text-amber-200 block mb-1">
                    ✨ ใส่ชื่อของคุณเพื่อชิงอันดับ:
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={24}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="ใส่ชื่อหรือฉายาของคุณ..."
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
            )}

            {/* Quick Action Footer */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>🕹️ เล่นอีกรอบ (10 วิ)</span>
              </button>

              {/* Explicit Exit Game Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-rose-900/50 hover:text-rose-200 active:scale-95 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-white/10"
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
