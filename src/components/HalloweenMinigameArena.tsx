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

interface VolcanoShockwave {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

// Fierce Fiery-Eyed Jack-o'-Lantern Emblem (ฟักทองตาไฟดุดัน คมชัด เปล่งแสงอลังการ)
function FiercePumpkinEmblem({ className = "w-32 h-26" }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 110" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Bright Glowing Aura behind pumpkin */}
        <radialGradient id="fpAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFA000" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#FF6200" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FF3D00" stopOpacity="0" />
        </radialGradient>

        {/* Vibrant Pumpkin Body Gradient */}
        <radialGradient id="fpBody" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFC107" />
          <stop offset="35%" stopColor="#FF8F00" />
          <stop offset="70%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#C62828" />
        </radialGradient>

        {/* Side Lobes Deeper Gradient */}
        <radialGradient id="fpSideBody" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFA000" />
          <stop offset="50%" stopColor="#F4511E" />
          <stop offset="100%" stopColor="#B71C1C" />
        </radialGradient>

        {/* Intense Blazing Fire for Eyes & Mouth */}
        <linearGradient id="fpFire" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="30%" stopColor="#FF5722" />
          <stop offset="65%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>

        <radialGradient id="fpFireCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#FFF9C4" />
          <stop offset="80%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#FF6F00" />
        </radialGradient>

        <filter id="flameGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Fiery Radiant Aura Circle */}
      <circle cx="65" cy="58" r="50" fill="url(#fpAura)" filter="url(#flameGlow)" />

      {/* Pumpkin Green Vine Stem */}
      <path d="M 61 24 C 59 10, 71 4, 80 6 C 78 15, 70 23, 67 25 Z" fill="#65A30D" stroke="#365314" strokeWidth="2.5" />
      <path d="M 66 8 Q 80 12, 75 22" stroke="#BEF264" strokeWidth="2" fill="none" />

      {/* Outer Lobes Shadow */}
      <ellipse cx="30" cy="62" rx="20" ry="32" fill="#7C2D12" />
      <ellipse cx="100" cy="62" rx="20" ry="32" fill="#7C2D12" />

      {/* Secondary Lobes with Golden Edge Light */}
      <ellipse cx="38" cy="63" rx="22" ry="36" fill="url(#fpSideBody)" stroke="#FFE082" strokeWidth="2.5" />
      <ellipse cx="92" cy="63" rx="22" ry="36" fill="url(#fpSideBody)" stroke="#FFE082" strokeWidth="2.5" />

      {/* Center Lobes with Golden Edge Light */}
      <ellipse cx="52" cy="64" rx="22" ry="38" fill="url(#fpBody)" stroke="#FFE082" strokeWidth="2.5" />
      <ellipse cx="78" cy="64" rx="22" ry="38" fill="url(#fpBody)" stroke="#FFE082" strokeWidth="2.5" />
      <ellipse cx="65" cy="65" rx="22" ry="39" fill="url(#fpBody)" stroke="#FFE082" strokeWidth="2.5" />

      {/* FIERCE MENACING SLANTED EYES (ตาไฟดุดัน เปล่งแสงชัดเจน) */}
      <polygon points="26,48 56,53 46,63" fill="#FF5722" opacity="0.9" filter="url(#flameGlow)" />
      <polygon points="104,48 74,53 84,63" fill="#FF5722" opacity="0.9" filter="url(#flameGlow)" />

      {/* Left Fierce Eye */}
      <polygon points="28,50 54,54 45,62" fill="url(#fpFire)" stroke="#3E1A05" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="33,51 51,54 46,59" fill="url(#fpFireCore)" />

      {/* Right Fierce Eye */}
      <polygon points="102,50 76,54 85,62" fill="url(#fpFire)" stroke="#3E1A05" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="97,51 79,54 84,59" fill="url(#fpFireCore)" />

      {/* Sharp Menacing Nose */}
      <polygon points="65,60 71,70 59,70" fill="url(#fpFireCore)" stroke="#3E1A05" strokeWidth="2" />

      {/* WICKED JAGGED SHARP FANGED MOUTH */}
      <path d="M 28 73 Q 65 106, 102 73 Q 88 92, 65 94 Q 42 92, 28 73 Z" fill="#FF5722" opacity="0.9" filter="url(#flameGlow)" />
      <path d="M 28 74 Q 65 104, 102 74 Q 88 93, 65 95 Q 42 93, 28 74 Z" fill="#200600" stroke="#3E1A05" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 32 77 Q 65 101, 98 77 Q 86 90, 65 92 Q 44 90, 32 77 Z" fill="url(#fpFire)" />
      
      {/* Sharp Teeth Fangs */}
      <polygon points="41,76 46,84 51,77" fill="#200600" />
      <polygon points="57,78 62,88 67,78" fill="#200600" />
      <polygon points="73,78 78,88 83,78" fill="#200600" />
      <polygon points="89,76 94,83 97,76" fill="#200600" />
      <polygon points="48,91 53,83 58,91" fill="#200600" />
      <polygon points="66,92 71,84 76,92" fill="#200600" />
      <polygon points="82,88 86,81 90,88" fill="#200600" />
    </svg>
  );
}



// Original Candy Graphics Definition
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
const MAX_PARTICLES = 400;

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

  // Volcano physical effects state
  const [isVolcanoErupting, setIsVolcanoErupting] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

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
  const caughtCandiesDomRef = useRef<HTMLDivElement | null>(null);

  // Canvas & Physics Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<CandyParticle[]>([]);
  const sparklesRef = useRef<CatchSparkle[]>([]);
  const shockwavesRef = useRef<VolcanoShockwave[]>([]);
  const floatingTextsRef = useRef<FloatingScoreText[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveTimersRef = useRef<NodeJS.Timeout[]>([]);
  const geyserTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Basket coordinate tracker with filtered tilt
  const basketPosRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
    targetX: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
    tilt: 0,
    targetTilt: 0,
  });

  // Pre-rendered GPU Texture Sprites (Eliminates all font rendering overhead!)
  const candySpriteMapRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const sparkleSpriteRef = useRef<HTMLCanvasElement | null>(null);
  const magmaSpriteRef = useRef<HTMLCanvasElement | null>(null);

  // Audio Context Singleton
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);
  const lastCatchSoundTimeRef = useRef(0);

  // Sound Engine with rich volcanic rumble and body thud
  const playSound = useCallback((type: "catch" | "rare" | "volcano" | "gameover") => {
    if (!soundEnabled) return;
    try {
      const now = Date.now();
      if (type === "volcano" && now - lastSoundTimeRef.current < 65) return;
      if (type === "catch") {
        if (now - lastCatchSoundTimeRef.current < 45) return;
        lastCatchSoundTimeRef.current = now;
      }
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
        // Volcanic eruption deep rumble + fiery pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.31);

        // Sub bass body punch
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(110, ctx.currentTime);
        subOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
        subGain.gain.setValueAtTime(0.3, ctx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start();
        subOsc.stop(ctx.currentTime + 0.26);
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

  // Pre-render emoji to offscreen canvas texture (0 CPU font rasterization in loop!)
  const getCandySprite = useCallback((emoji: string, isRare: boolean): HTMLCanvasElement => {
    const key = `${emoji}_${isRare ? "rare" : "std"}`;
    let sprite = candySpriteMapRef.current.get(key);
    if (sprite) return sprite;

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${isRare ? 46 : 38}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.fillText(emoji, 32, 32);
    }
    candySpriteMapRef.current.set(key, canvas);
    return canvas;
  }, []);

  const getSparkleSprite = useCallback((): HTMLCanvasElement => {
    if (sparkleSpriteRef.current) return sparkleSpriteRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.quadraticCurveTo(16, 16, 30, 16);
      ctx.quadraticCurveTo(16, 16, 16, 30);
      ctx.quadraticCurveTo(16, 16, 2, 16);
      ctx.quadraticCurveTo(16, 16, 16, 2);
      ctx.closePath();
      ctx.fill();
    }
    sparkleSpriteRef.current = canvas;
    return canvas;
  }, []);

  // Pre-rendered Magma Ember Sprite (Pure GPU Radial Flame Texture)
  const getMagmaSprite = useCallback((): HTMLCanvasElement => {
    if (magmaSpriteRef.current) return magmaSpriteRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(0.25, "#FFF176");
      grad.addColorStop(0.6, "#FF9100");
      grad.addColorStop(0.85, "#FF3D00");
      grad.addColorStop(1, "rgba(255, 61, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    magmaSpriteRef.current = canvas;
    return canvas;
  }, []);

  // Spectacular Candy Volcano Deluge pouring down from the clicked Pumpkin at the top!
  const triggerVolcanoBurst = useCallback((count = 38) => {
    if (typeof window === "undefined") return;
    playSound("volcano");

    // Eruption flare and tremor on the top pumpkin
    setIsVolcanoErupting(true);
    setScreenShake(true);
    setTimeout(() => setIsVolcanoErupting(false), 240);
    setTimeout(() => setScreenShake(false), 140);

    const width = window.innerWidth;
    const originX = Math.max(70, Math.min(width - 70, pumpkinOrigin?.x ?? width * 0.78));
    const originY = Math.max(70, Math.min(130, pumpkinOrigin?.y ?? 85));

    // Shockwave ring expanding from pumpkin mouth at the top
    shockwavesRef.current.push({
      id: Math.random(),
      x: originX,
      y: originY + 18,
      radius: 10,
      maxRadius: Math.min(220, width * 0.35),
      opacity: 0.95,
      color: "#FF5722",
    });

    const totalWeight = CANDY_TYPES.reduce((acc, c) => acc + c.weight, 0);
    const newItems: CandyParticle[] = [];

    // Volcanic cascade: Candies gush, spray, and shower down from the pumpkin across the arena!
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

      // Target position spread evenly across the playing field
      const targetX = width * (0.04 + Math.random() * 0.92);
      const fallFrames = 22 + Math.random() * 12; // Fast & snappy arcade cascade
      const vx = (targetX - originX) / fallFrames;

      // Downward volcanic gush with explosive outward velocity
      // Some candies pop slightly outward/upward before plunging down
      const isPopUp = Math.random() < 0.22;
      const vy = isPopUp
        ? -(Math.random() * 5 + 2) // Pops up slightly out of pumpkin top
        : (Math.random() * 11 + 6); // Rushes straight downward from mouth!

      newItems.push({
        id: Math.random() + Date.now(),
        emoji: selected.emoji,
        x: originX + (Math.random() - 0.5) * 32,
        y: originY + 18 + (Math.random() - 0.5) * 16,
        vx,
        vy,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 22,
        size: selected.isRare ? 46 : 38,
        points: selected.points,
        isRare: selected.isRare,
        settled: false,
        opacity: 1,
        bounceCount: 0,
      });
    }

    // Launch intense incandescent magma sparks & embers spraying down and outward
    for (let sp = 0; sp < 18; sp++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.8; // Downward spray cone
      const spd = Math.random() * 14 + 6;
      sparklesRef.current.push({
        id: Math.random(),
        x: originX,
        y: originY + 18,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 4,
        color: ["#FFFFFF", "#FFF59D", "#FFD54F", "#FF7043", "#FF1744"][Math.floor(Math.random() * 5)],
        opacity: 1,
      });
    }

    const current = particlesRef.current;
    if (current.length + newItems.length > MAX_PARTICLES) {
      particlesRef.current = [...current.slice(-(MAX_PARTICLES - newItems.length)), ...newItems];
    } else {
      particlesRef.current = [...current, ...newItems];
    }
  }, [pumpkinOrigin, playSound]);

  // Continuous stream of candies pouring down steadily from the pumpkin mouth
  const triggerMiniGeyser = useCallback((count = 3) => {
    if (typeof window === "undefined" || !isPlayingRef.current) return;

    const width = window.innerWidth;
    const originX = Math.max(70, Math.min(width - 70, pumpkinOrigin?.x ?? width * 0.78));
    const originY = Math.max(70, Math.min(130, pumpkinOrigin?.y ?? 85));

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

      const targetX = width * (0.08 + Math.random() * 0.84);
      const fallFrames = 26 + Math.random() * 8;
      const vx = (targetX - originX) / fallFrames;
      const vy = Math.random() * 7 + 6; // Streams downward

      newItems.push({
        id: Math.random() + Date.now(),
        emoji: selected.emoji,
        x: originX + (Math.random() - 0.5) * 20,
        y: originY + 18 + (Math.random() - 0.5) * 10,
        vx,
        vy,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 16,
        size: selected.isRare ? 44 : 36,
        points: selected.points,
        isRare: selected.isRare,
        settled: false,
        opacity: 1,
        bounceCount: 0,
      });
    }

    for (let s = 0; s < 3; s++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.5;
      const spd = Math.random() * 8 + 4;
      sparklesRef.current.push({
        id: Math.random(),
        x: originX,
        y: originY + 18,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 2.5 + Math.random() * 2.5,
        color: "#FFA000",
        opacity: 0.9,
      });
    }

    const current = particlesRef.current;
    if (current.length + newItems.length <= MAX_PARTICLES) {
      particlesRef.current = [...current, ...newItems];
    }
  }, [pumpkinOrigin]);

  // Clean finish function
  const finishGame = useCallback(() => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    if (geyserTimerRef.current) clearInterval(geyserTimerRef.current);
    waveTimersRef.current.forEach(clearTimeout);
    waveTimersRef.current = [];

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

    if (scoreDomRef.current) scoreDomRef.current.innerText = "0";
    if (timerDomRef.current) timerDomRef.current.innerText = `${ROUND_DURATION_SECONDS}s`;
    if (caughtDomRef.current) caughtDomRef.current.innerText = "0 ชิ้น";
    if (comboDomRef.current) comboDomRef.current.style.display = "none";
    if (basketDomRef.current) basketDomRef.current.setAttribute("data-fill-level", "0");

    particlesRef.current = [];
    sparklesRef.current = [];
    shockwavesRef.current = [];
    floatingTextsRef.current = [];

    // Clear any previous wave timers
    waveTimersRef.current.forEach(clearTimeout);
    waveTimersRef.current = [];
    if (geyserTimerRef.current) clearInterval(geyserTimerRef.current);

    const scheduleWave = (delayMs: number, count: number) => {
      const t = setTimeout(() => {
        if (isPlayingRef.current) {
          triggerVolcanoBurst(count);
        }
      }, delayMs);
      waveTimersRef.current.push(t);
    };

    // 10-Second Volcanic Eruption Schedule (ต่อเนื่อง ดุเดือด ทะลักเต็มจอ!)
    scheduleWave(40, 42);    // 0.04s - MEGA OPENING ERUPTION!
    scheduleWave(650, 24);   // 0.65s - Magma wave
    scheduleWave(1300, 30);  // 1.30s - Sky fountain
    scheduleWave(1950, 26);  // 1.95s - Eruption wave
    scheduleWave(2600, 34);  // 2.60s - High geyser blast
    scheduleWave(3250, 28);  // 3.25s - Lava deluge
    scheduleWave(3900, 36);  // 3.90s - Stratospheric burst
    scheduleWave(4550, 32);  // 4.55s - Mid-game surge
    scheduleWave(5200, 40);  // 5.20s - MEGA ERUPTION!
    scheduleWave(5850, 32);  // 5.85s - Lava wave
    scheduleWave(6500, 36);  // 6.50s - High geyser
    scheduleWave(7150, 38);  // 7.15s - Triple vent blast
    scheduleWave(7800, 42);  // 7.80s - Pre-climax crescendo
    scheduleWave(8450, 44);  // 8.45s - Seismic torrent
    scheduleWave(9100, 50);  // 9.10s - GRAND VOLCANIC CLIMAX! (ทะลักสุดขีด!)

    // Continuous bubbling volcano geyser stream
    geyserTimerRef.current = setInterval(() => {
      if (isPlayingRef.current && !isGameOverRef.current) {
        triggerMiniGeyser(3);
      }
    }, 260);

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
  }, [triggerVolcanoBurst, triggerMiniGeyser, finishGame]);

  // Clean up all timers when unmounted
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      if (geyserTimerRef.current) clearInterval(geyserTimerRef.current);
      waveTimersRef.current.forEach(clearTimeout);
      waveTimersRef.current = [];
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
      const mouseDx = clientX - basketPosRef.current.targetX;
      basketPosRef.current.targetTilt = Math.max(-14, Math.min(14, mouseDx * 0.45));
      basketPosRef.current.targetX = clientX;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        basketPosRef.current.targetX = Math.max(80, basketPosRef.current.targetX - 75);
        basketPosRef.current.targetTilt = -10;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        basketPosRef.current.targetX = Math.min(window.innerWidth - 80, basketPosRef.current.targetX + 75);
        basketPosRef.current.targetTilt = 10;
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 60FPS Hardware-Accelerated Physics & Catch Loop (Delta-Time Scaled)
  useEffect(() => {
    if (!isOpen) return;

    let isRunning = true;
    let lastTime = performance.now();

    const loop = () => {
      if (!isRunning) return;

      try {
        const now = performance.now();
        // Delta time normalized to 60fps (1.0 = 16.667ms)
        const dt = Math.min(2.0, Math.max(0.2, (now - lastTime) / 16.667));
        lastTime = now;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const gravity = 1.15; // Fast, energetic volcanic cascade pouring down from above
        const floorY = height - 25;

        // Pumpkin bucket dimensions (aspect ratio ~1.33:1 matching reference image)
        const basketW = Math.min(270, Math.max(195, width * 0.32));
        const basketH = Math.round(basketW * 0.75);
        const basketY = height - basketH - 12;
        const catchY = basketY + basketH * 0.38;

        // Instant 100% direct tracking with smooth dynamic tilt (0 jitter, 0 lag!)
        const basket = basketPosRef.current;
        basket.x = basket.targetX;
        basket.tilt += (basket.targetTilt - basket.tilt) * 0.22;
        basket.targetTilt *= 0.85;

        if (basketDomRef.current) {
          basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY}px, 0) rotate(${basket.tilt}deg)`;
        }

        ctx.clearRect(0, 0, width, height);

        // Volcanic Shockwave rings rendering
        const swRemaining: VolcanoShockwave[] = [];
        for (let sw = 0; sw < shockwavesRef.current.length; sw++) {
          const s = shockwavesRef.current[sw];
          s.radius += 7.5 * dt;
          s.opacity -= 0.045 * dt;

          if (s.opacity > 0 && s.radius < s.maxRadius) {
            swRemaining.push(s);
            ctx.save();
            ctx.globalAlpha = Math.max(0, s.opacity * 0.75);
            ctx.strokeStyle = s.color || "#FF5722";
            ctx.lineWidth = Math.max(1.5, 4 * s.opacity);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
        shockwavesRef.current = swRemaining;

        const particles = particlesRef.current;
        const remaining: CandyParticle[] = [];

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (!p.settled) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += gravity * dt;
            if (p.vy > 25) p.vy = 25;
            p.vx *= Math.pow(0.993, dt);
            p.rotation += p.vRot * dt;

            // Wall bouncing
            if (p.x <= 20) {
              p.x = 20;
              p.vx = -p.vx * 0.6;
            } else if (p.x >= width - 20) {
              p.x = width - 20;
              p.vx = -p.vx * 0.6;
            }

            // Generous Pumpkin Bucket Catch Zone
            const catchSpan = basketW * 0.52;
            const inBasketX = p.x >= basket.x - catchSpan && p.x <= basket.x + catchSpan;
            const inBasketY = p.y >= catchY - 45 && p.y <= catchY + 55;
            const isFalling = p.vy > -3;

            if (inBasketX && inBasketY && isFalling && isPlayingRef.current && !isGameOverRef.current) {
              // CAUGHT!
              playSound(p.isRare ? "rare" : "catch");

              // Burst juicy arcade sparkles on catch!
              for (let s = 0; s < 6; s++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 4.5;
                sparklesRef.current.push({
                  id: Math.random(),
                  x: p.x,
                  y: catchY,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd - 2,
                  size: 2.5 + Math.random() * 3,
                  color: p.isRare
                    ? "#FDE047"
                    : ["#FF6200", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"][Math.floor(Math.random() * 5)],
                  opacity: 1,
                });
              }

              // Dynamic Visual Candy Fill Tiers (0 -> 1 -> 2 -> 3 -> 4 -> 5)
              const nextCount = candiesCaughtRef.current + 1;
              const fillLevel =
                nextCount >= 33 ? 5 :
                nextCount >= 22 ? 4 :
                nextCount >= 13 ? 3 :
                nextCount >= 6 ? 2 :
                nextCount >= 1 ? 1 : 0;
              if (basketDomRef.current && basketDomRef.current.getAttribute("data-fill-level") !== String(fillLevel)) {
                basketDomRef.current.setAttribute("data-fill-level", String(fillLevel));
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

              // Floating Score text (fast & snappy)
              floatingTextsRef.current.push({
                id: Math.random(),
                text: `+${pointsAwarded}${p.isRare ? " ⭐" : ""}`,
                x: p.x,
                y: catchY - 15,
                opacity: 1,
                color: p.isRare ? "#FBBF24" : multiplier > 1 ? "#FF6200" : "#10B981",
                scale: p.isRare ? 1.3 : multiplier > 1 ? 1.15 : 1.0,
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
            p.opacity -= 0.08 * dt; // Fades out fast on floor to keep particle pool fresh
          }

          if (p.opacity > 0) {
            remaining.push(p);

            // Rare item glowing aura (pure GPU vector circle, 0 lag)
            if (p.isRare) {
              ctx.globalAlpha = Math.max(0, p.opacity * 0.35);
              ctx.fillStyle = "#F59E0B";
              ctx.beginPath();
              ctx.arc(p.x, p.y, 28, 0, Math.PI * 2);
              ctx.fill();
            }

            // Draw Pre-rendered GPU Sprite! (Zero CPU font rasterization in loop)
            const sprite = getCandySprite(p.emoji, p.isRare);
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.drawImage(sprite, -32, -32, 64, 64);
            ctx.restore();
          }
        }

        particlesRef.current = remaining;

        // Arcade Sparkles & Volcanic Magma Embers (Pure GPU textured sprite blits)
        const spSprite = getSparkleSprite();
        const mgSprite = getMagmaSprite();
        const sRemaining: CatchSparkle[] = [];
        for (let s = 0; s < sparklesRef.current.length; s++) {
          const sp = sparklesRef.current[s];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vy += 0.45 * dt;
          sp.vx *= Math.pow(0.97, dt);
          sp.opacity -= 0.045 * dt;

          if (sp.opacity > 0) {
            sRemaining.push(sp);
            ctx.globalAlpha = Math.max(0, sp.opacity);
            const spriteToDraw = sp.color.startsWith("#FBBF") || sp.color.startsWith("#FDE0") ? spSprite : mgSprite;
            ctx.drawImage(spriteToDraw, sp.x - 16, sp.y - 16, 32, 32);
          }
        }
        sparklesRef.current = sRemaining;

        // Floating Score Texts (Pre-configure text styles once, fast snappy fade)
        const fRemaining: FloatingScoreText[] = [];
        if (floatingTextsRef.current.length > 0) {
          ctx.font = '900 22px system-ui, -apple-system, sans-serif';
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#2A0E00";
          ctx.lineJoin = "round";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          for (let j = 0; j < floatingTextsRef.current.length; j++) {
            const ft = floatingTextsRef.current[j];
            ft.y -= 3.2 * dt;
            ft.opacity -= 0.05 * dt;

            if (ft.opacity > 0) {
              fRemaining.push(ft);
              ctx.globalAlpha = Math.max(0, ft.opacity);
              ctx.strokeText(ft.text, ft.x, ft.y);
              ctx.fillStyle = ft.color;
              ctx.fillText(ft.text, ft.x, ft.y);
            }
          }
        }
        floatingTextsRef.current = fRemaining;
      } catch (err) {
        console.error("Physics loop error:", err);
      } finally {
        if (isRunning) {
          animFrameIdRef.current = requestAnimationFrame(loop);
        }
      }
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
      if (basketDomRef.current) {
        const basketW = Math.min(270, Math.max(195, w * 0.32));
        const basketH = Math.round(basketW * 0.75);
        basketDomRef.current.style.width = `${basketW}px`;
        basketDomRef.current.style.height = `${basketH}px`;
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
      style={{
        transform: screenShake ? `translate3d(${(Math.random() - 0.5) * 6}px, ${(Math.random() - 0.5) * 6}px, 0)` : undefined,
        transition: "transform 0.05s ease-out",
      }}
      onClick={(e) => {
        // Stop bubbling so it never reaches parent pumpkin div!
        e.stopPropagation();
      }}
    >
      
      {/* Country Friends Harvest Festival Twilight Ambience (Pure GPU solid rendering, zero blur lag) */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#180B2B] via-[#220F38] to-[#0E041A] cursor-pointer overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.14) 0%, transparent 45%),
            radial-gradient(circle at 15% 40%, rgba(147, 51, 234, 0.12) 0%, transparent 40%),
            linear-gradient(to bottom, #180B2B, #220F38, #0E041A)
          `,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlayingRef.current && !isGameOverRef.current) {
            triggerVolcanoBurst(36);
          }
        }}
        title="แตะหน้าจอเพื่อระเบิดลูกกวาดภูเขาไฟเพิ่ม!"
      >

        {/* Country Festival Autumn Bunting / Pennant Garland across top */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-between items-start opacity-70 pointer-events-none select-none px-2 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px]"
              style={{
                borderTopColor: [
                  "#F59E0B", // honey
                  "#EA580C", // pumpkin
                  "#DC2626", // apple red
                  "#84CC16", // harvest green
                  "#9333EA", // twilight plum
                ][i % 5],
                transform: `rotate(${((i % 3) - 1) * 6}deg)`,
              }}
            />
          ))}
        </div>

        {/* Floating Farm Fireflies */}
        <div className="absolute top-28 left-[12%] w-2 h-2 rounded-full bg-amber-300 opacity-75" />
        <div className="absolute top-44 right-[18%] w-1.5 h-1.5 rounded-full bg-amber-200 opacity-85" />
        <div className="absolute top-60 left-[35%] w-2 h-2 rounded-full bg-orange-400 opacity-60" />
        <div className="absolute top-36 right-[38%] w-2 h-2 rounded-full bg-amber-300 opacity-70" />

        {/* Friendly Halloween Bats & Ghosts 🦇 👻 */}
        <div className="absolute top-14 left-10 text-2xl opacity-75">🦇</div>
        <div className="absolute top-24 right-16 text-3xl opacity-70">🦇</div>
        <div className="absolute top-18 right-1/4 text-2xl opacity-60">👻</div>

        {/* Cozy Country Pumpkin Farm Ground Silhouette */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#3B1504]/50 via-purple-950/25 to-transparent pointer-events-none" />
      </div>

      {/* THE ERUPTING JACK-O'-LANTERN PUMPKIN (ฟักทองที่กด พ่นลูกกวาดทะลักจากด้านบน) */}
      <div
        className="absolute z-30 transition-transform duration-100 cursor-pointer select-none pointer-events-auto"
        style={{
          left: typeof window !== "undefined" ? `${Math.max(70, Math.min(window.innerWidth - 70, pumpkinOrigin?.x ?? window.innerWidth * 0.78))}px` : "78%",
          top: typeof window !== "undefined" ? `${Math.max(70, Math.min(130, pumpkinOrigin?.y ?? 85))}px` : "85px",
          transform: `translate(-50%, -50%) ${isVolcanoErupting ? "scale(1.22) rotate(-5deg)" : "scale(1)"}`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlayingRef.current && !isGameOverRef.current) {
            triggerVolcanoBurst(45);
          }
        }}
        title="ฟักทองฮาโลวีนที่กด (แตะเพื่อเร่งให้ลูกกวาดทะลักเพิ่ม!)"
      >
        {/* Fierce Fiery-Eyed Pumpkin Emblem (ฟักทองตาไฟดุดันที่กด) */}
        <FiercePumpkinEmblem className="w-20 h-16 sm:w-26 sm:h-22 filter drop-shadow-[0_0_25px_rgba(255,102,0,0.95)]" />

        {/* Fiery Lava Spill Gush beneath pumpkin mouth */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-gradient-to-b from-amber-400/90 via-orange-500/60 to-transparent blur-xs rounded-full pointer-events-none" />

        {/* Tactile Badge */}
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white text-[9px] font-black tracking-wide font-mono whitespace-nowrap shadow-md border border-amber-300 pointer-events-none animate-pulse">
          🎃 แตะฟักทองให้ทะลัก!
        </div>
      </div>

      {/* Screen Frame Country Golden Accent */}
      <div className="absolute inset-0 pointer-events-none border-2 border-amber-500/25" />

      {/* 60FPS Hardware Accelerated Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* JACK-O'-LANTERN CANDY BUCKET WITH DYNAMIC OVERFLOWING TREAT TIERS (1:1 Reference Match) */}
      <div
        ref={basketDomRef}
        data-fill-level="0"
        className="fixed top-0 left-0 pointer-events-none z-30 will-change-transform"
      >
        <div className="relative w-full h-full">
          {/* Jack-o'-Lantern Bucket SVG Illustration */}
          <svg viewBox="0 0 280 210" className="w-full h-full overflow-visible" fill="none">
            <defs>
              {/* Plump Pumpkin Body Gradient */}
              <linearGradient id="jackBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFA726" />
                <stop offset="22%" stopColor="#FF7A00" />
                <stop offset="68%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>

              {/* Bucket Rim Gradient */}
              <linearGradient id="jackRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFB74D" />
                <stop offset="45%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#D84315" />
              </linearGradient>

              {/* Deep Dark Pumpkin Cavity */}
              <radialGradient id="jackInteriorGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1E0A18" />
                <stop offset="70%" stopColor="#12050D" />
                <stop offset="100%" stopColor="#080106" />
              </radialGradient>

              {/* Carved Facial Hollow Depth */}
              <linearGradient id="jackFaceDepth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A0B1B" />
                <stop offset="100%" stopColor="#12040D" />
              </linearGradient>

              {/* Cute Ghost Gradient */}
              <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="85%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>

              {/* Frankenstein Monster Pop Gradient */}
              <linearGradient id="frankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#86EFAC" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>

            {/* Ambient Ground Shadow */}
            <ellipse cx="140" cy="204" rx="98" ry="7" fill="rgba(0,0,0,0.4)" />

            {/* Black Plastic Handle (Loops behind bucket on the right side) */}
            <path
              d="M 224 76 C 265 88, 260 144, 235 158"
              stroke="#1A0D08"
              strokeWidth="13"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 224 76 C 263 88, 258 142, 235 156"
              stroke="#3D1D12"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Deep Pumpkin Interior Cavity (Where treats mound up!) */}
            <ellipse cx="140" cy="74" rx="92" ry="20" fill="url(#jackInteriorGrad)" stroke="#5A1A06" strokeWidth="2" />

            {/* 🎃 DYNAMIC CANDY OVERFLOW TIERS (Pop in progressively as candies are caught) */}
            {/* TIER 1: Base treats inside rim (1-5 candies) */}
            <g className="candy-tier candy-tier-1">
              {/* Candy Corn Left */}
              <path d="M 88 74 L 98 52 L 108 74 Z" fill="#F59E0B" />
              <path d="M 91 66 L 98 52 L 105 66 Z" fill="#FB923C" />
              <path d="M 94 59 L 98 52 L 102 59 Z" fill="#FFFFFF" />
              {/* Candy Corn Right */}
              <path d="M 186 73 L 195 53 L 204 73 Z" fill="#F59E0B" />
              <path d="M 189 66 L 195 53 L 201 66 Z" fill="#FB923C" />
              <path d="M 192 60 L 195 53 L 198 60 Z" fill="#FFFFFF" />
              {/* Purple Gumdrop */}
              <path d="M 125 76 C 125 68, 137 68, 137 76 Z" fill="#A855F7" stroke="#6B21A8" strokeWidth="1" />
              {/* Lime Jelly Bean */}
              <ellipse cx="160" cy="73" rx="8" ry="5" transform="rotate(-15 160 73)" fill="#84CC16" stroke="#4D7C0F" strokeWidth="1" />
              {/* Rolled Purple Spiral Candy */}
              <circle cx="148" cy="71" r="7" fill="#C084FC" stroke="#581C87" strokeWidth="1.5" />
              <path d="M 148 66 A 5 5 0 0 1 151 73 A 3 3 0 0 1 146 72" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
            </g>

            {/* TIER 2: Gummy worm drape & Swirl Pop & Green Eye Pop (6-12 candies) */}
            <g className="candy-tier candy-tier-2">
              {/* Green Eyeball Pop on stick */}
              <line x1="108" y1="74" x2="108" y2="44" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="108" cy="42" r="11" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <path d="M 101 39 Q 104 42, 100 44 M 115 38 Q 112 41, 116 44" stroke="#FDA4AF" strokeWidth="1" fill="none" />
              <circle cx="108" cy="42" r="6" fill="#22C55E" />
              <ellipse cx="108" cy="42" rx="2" ry="4.5" fill="#0F172A" />
              <circle cx="106" cy="40" r="1.5" fill="#FFFFFF" />
              {/* Red & White Swirl Lollipop */}
              <line x1="126" y1="75" x2="126" y2="52" stroke="#E2E8F0" strokeWidth="2.5" />
              <circle cx="126" cy="50" r="13" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
              <path d="M 126 50 M 126 40 A 10 10 0 0 1 136 50 A 7 7 0 0 1 126 57 A 5 5 0 0 1 121 50 A 3 3 0 0 1 126 47" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              {/* Green Gummy Worm draped over rim */}
              <path d="M 64 68 C 62 58, 72 55, 78 64 C 82 72, 80 82, 73 84 C 68 85, 66 79, 70 75" fill="none" stroke="#4ADE80" strokeWidth="6.5" strokeLinecap="round" />
              <path d="M 64 68 C 62 58, 72 55, 78 64 C 82 72, 80 82, 73 84 C 68 85, 66 79, 70 75" fill="none" stroke="#16A34A" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" />
              <circle cx="72" cy="83" r="1" fill="#0F172A" />
            </g>

            {/* TIER 3: Orange/Black Candy Cane & Cute Ghost Marshmallow Pop (13-21 candies) */}
            <g className="candy-tier candy-tier-3">
              {/* Orange & Black Striped Candy Cane Left */}
              <path d="M 76 74 L 76 34 C 76 16, 52 16, 52 30" fill="none" stroke="#FF7A00" strokeWidth="8.5" strokeLinecap="round" />
              <path d="M 76 74 L 76 34 C 76 16, 52 16, 52 30" fill="none" stroke="#1E1E1E" strokeWidth="8.5" strokeDasharray="5 7" strokeLinecap="round" />
              <path d="M 76 74 L 76 34 C 76 16, 52 16, 52 30" fill="none" stroke="#FFA726" strokeWidth="1.5" strokeLinecap="round" />
              {/* Cute White Ghost Marshmallow Pop Center */}
              <line x1="138" y1="74" x2="138" y2="48" stroke="#E2E8F0" strokeWidth="2.5" />
              <path d="M 127 50 C 127 34, 149 34, 149 50 C 149 60, 145 62, 142 60 C 139 58, 137 58, 134 60 C 131 62, 127 60, 127 50 Z" fill="url(#ghostGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
              <ellipse cx="134" cy="45" rx="1.5" ry="2.5" fill="#1E1B4B" />
              <ellipse cx="142" cy="45" rx="1.5" ry="2.5" fill="#1E1B4B" />
              <path d="M 136 49 Q 138 52, 140 49" fill="none" stroke="#1E1B4B" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="132" cy="48" r="1.5" fill="#F472B6" opacity="0.6" />
              <circle cx="144" cy="48" r="1.5" fill="#F472B6" opacity="0.6" />
              {/* Blue Eyeball Pop Right */}
              <line x1="174" y1="74" x2="174" y2="38" stroke="#E2E8F0" strokeWidth="2.5" />
              <circle cx="174" cy="36" r="11" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <path d="M 166 33 Q 169 36, 164 38 M 182 32 Q 179 35, 184 38" stroke="#FDA4AF" strokeWidth="1" fill="none" />
              <circle cx="174" cy="36" r="6" fill="#0284C7" />
              <circle cx="174" cy="36" r="3" fill="#0F172A" />
              <circle cx="172" cy="34" r="1.5" fill="#FFFFFF" />
            </g>

            {/* TIER 4: Purple/White Candy Cane & Frankenstein Monster Pop (22-32 candies) */}
            <g className="candy-tier candy-tier-4">
              {/* Purple & White Striped Candy Cane Right */}
              <path d="M 198 72 L 198 32 C 198 16, 218 16, 218 28" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
              <path d="M 198 72 L 198 32 C 198 16, 218 16, 218 28" fill="none" stroke="#7E22CE" strokeWidth="8" strokeDasharray="5 7" strokeLinecap="round" />
              {/* Frankenstein Monster Pop Upper Center */}
              <line x1="152" y1="52" x2="152" y2="32" stroke="#E2E8F0" strokeWidth="2.5" />
              <rect x="142" y="16" width="20" height="26" rx="4" fill="url(#frankGrad)" stroke="#15803D" strokeWidth="1.5" />
              <path d="M 142 22 L 142 16 C 142 14, 162 14, 162 16 L 162 22 L 158 20 L 154 23 L 150 19 L 146 22 Z" fill="#3E1A0E" />
              <circle cx="147" cy="25" r="2.5" fill="#FFFFFF" />
              <circle cx="147" cy="25" r="1.2" fill="#0F172A" />
              <circle cx="157" cy="25" r="2.5" fill="#FFFFFF" />
              <circle cx="157" cy="25" r="1.2" fill="#0F172A" />
              <path d="M 144 20 L 148 20 M 146 18 L 146 22" stroke="#1E1B4B" strokeWidth="1" />
              <path d="M 148 31 Q 152 35, 156 31" fill="none" stroke="#1E1B4B" strokeWidth="1.2" strokeLinecap="round" />
              {/* Orange Swirl Pop */}
              <circle cx="166" cy="56" r="9" fill="#FB923C" stroke="#C2410C" strokeWidth="1.2" />
              <path d="M 166 56 M 166 50 A 6 6 0 0 1 172 56 A 4 4 0 0 1 166 60 A 2 2 0 0 1 163 56" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
            </g>

            {/* TIER 5: Skull Pop, Purple Sprinkles Cake Pop, Bonbons & Grand Mountain (33+ candies) */}
            <g className="candy-tier candy-tier-5">
              {/* Cute White Skull Pop */}
              <line x1="188" y1="72" x2="188" y2="52" stroke="#E2E8F0" strokeWidth="2.5" />
              <path d="M 180 50 C 180 40, 198 40, 198 50 C 198 54, 195 56, 194 60 L 184 60 C 183 56, 180 54, 180 50 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.3" />
              <circle cx="185" cy="48" r="2.5" fill="#0F172A" />
              <circle cx="193" cy="48" r="2.5" fill="#0F172A" />
              <polygon points="189,52 188,54 190,54" fill="#0F172A" />
              <line x1="187" y1="57" x2="187" y2="60" stroke="#0F172A" strokeWidth="1" />
              <line x1="191" y1="57" x2="191" y2="60" stroke="#0F172A" strokeWidth="1" />
              {/* Purple Sprinkles Cake Pop */}
              <line x1="120" y1="46" x2="120" y2="34" stroke="#E2E8F0" strokeWidth="2" />
              <circle cx="120" cy="30" r="10" fill="#7E22CE" stroke="#581C87" strokeWidth="1.3" />
              <circle cx="118" cy="27" r="1.2" fill="#FBBF24" />
              <circle cx="123" cy="29" r="1.2" fill="#38BDF8" />
              <circle cx="119" cy="33" r="1.2" fill="#F472B6" />
              <circle cx="122" cy="33" r="1.2" fill="#4ADE80" />
              {/* Side Protruding Bonbons */}
              <path d="M 206 68 L 220 62 L 222 74 Z" fill="#1E1B4B" />
              <circle cx="204" cy="68" r="6" fill="#1E1B4B" stroke="#D97706" strokeWidth="1.5" />
              <path d="M 72 70 L 60 64 L 62 76 Z" fill="#9333EA" />
              <circle cx="74" cy="70" r="6" fill="#E11D48" stroke="#831843" strokeWidth="1.2" />
            </g>

            {/* 🎃 FRONT PUMPKIN BODY (Volumetric Carved Pumpkin Pail) */}
            <path
              d="M 44 80
                 C 18 108, 14 165, 52 192
                 C 74 206, 110 206, 140 206
                 C 170 206, 206 206, 228 192
                 C 266 165, 262 108, 236 80
                 C 214 74, 168 72, 140 72
                 C 112 72, 66 74, 44 80 Z"
              fill="url(#jackBodyGrad)"
              stroke="#7C2D12"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Vertical Pumpkin Lobe Rib Creases */}
            <path d="M 88 76 C 58 115, 60 172, 86 198" stroke="#C2410C" strokeWidth="4.5" fill="none" opacity="0.85" strokeLinecap="round" />
            <path d="M 120 74 C 108 120, 110 176, 122 205" stroke="#C2410C" strokeWidth="4.5" fill="none" opacity="0.85" strokeLinecap="round" />
            <path d="M 160 74 C 172 120, 170 176, 158 205" stroke="#C2410C" strokeWidth="4.5" fill="none" opacity="0.85" strokeLinecap="round" />
            <path d="M 192 76 C 222 115, 220 172, 194 198" stroke="#C2410C" strokeWidth="4.5" fill="none" opacity="0.85" strokeLinecap="round" />

            {/* Soft Lobe Top Crest Highlights */}
            <path d="M 52 88 C 66 82, 80 82, 86 86" stroke="#FED7AA" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75" />
            <path d="M 94 82 C 114 76, 130 76, 138 80" stroke="#FED7AA" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M 142 80 C 150 76, 166 76, 186 82" stroke="#FED7AA" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d="M 194 86 C 200 82, 214 82, 228 88" stroke="#FED7AA" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75" />

            {/* Front Bucket Rim Lip */}
            <path d="M 44 78 C 64 71, 216 71, 236 78 C 216 87, 64 87, 44 78 Z" fill="url(#jackRimGrad)" stroke="#9A3412" strokeWidth="2.5" />

            {/* Right Handle Hinge Ear / Rivet Tab */}
            <circle cx="225" cy="77" r="7" fill="#EA580C" stroke="#7C2D12" strokeWidth="2" />
            <circle cx="225" cy="77" r="3.5" fill="#1A0D08" />

            {/* 🎃 CARVED JACK-O'-LANTERN FACE (Sinister Arched Eyes, Nose & Toothy Grin) */}
            {/* Left Eye */}
            <path
              d="M 76 114 C 92 98, 124 104, 126 118 C 110 126, 92 126, 76 114 Z"
              fill="url(#jackFaceDepth)"
              stroke="#3E0C1C"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M 77 115 C 93 126, 110 126, 126 118" stroke="#FF9A3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Right Eye */}
            <path
              d="M 204 114 C 188 98, 156 104, 154 118 C 170 126, 188 126, 204 114 Z"
              fill="url(#jackFaceDepth)"
              stroke="#3E0C1C"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M 154 118 C 170 126, 187 126, 203 115" stroke="#FF9A3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Carved Triangular Nose */}
            <path
              d="M 140 123 C 143 122, 148 132, 151 140 C 145 144, 135 144, 129 140 C 132 132, 137 122, 140 123 Z"
              fill="url(#jackFaceDepth)"
              stroke="#3E0C1C"
              strokeWidth="1.5"
            />
            <path d="M 130 140 C 136 144, 144 144, 150 140" stroke="#FF9A3C" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Wicked Grinning Mouth with 2 Square Carved Bottom Teeth */}
            <path
              d="M 66 136 C 88 165, 112 172, 112 172 L 112 155 L 126 155 L 126 173 C 134 175, 146 175, 154 173 L 154 155 L 168 155 L 168 172 C 168 172, 192 165, 214 136 C 188 168, 92 168, 66 136 Z"
              fill="url(#jackFaceDepth)"
              stroke="#3E0C1C"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* 3D Carved Pumpkin Teeth & Bottom Lip Bevel */}
            <path d="M 112 172 L 112 155 L 126 155 L 126 173" stroke="#FF9A3C" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <path d="M 154 173 L 154 155 L 168 155 L 168 172" stroke="#FF9A3C" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <path d="M 68 137 C 88 166, 112 173, 112 173 M 126 173 C 135 175, 145 175, 154 173 M 168 172 C 168 172, 192 166, 212 137" stroke="#FF9A3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>

          {/* Carved Country Wooden Signboard with Golden Coin Badge on Pumpkin Front */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-gradient-to-b from-[#6D320A] via-[#4A1F06] to-[#2B0E02] border-2 border-amber-400 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.3)] flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-20">
            <span className="text-[13px] animate-bounce">🍬</span>
            <span
              ref={caughtDomRef}
              className="text-xs font-black font-mono text-amber-300 tracking-wide leading-tight filter drop-shadow-xs"
            >
              0 ชิ้น
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Candy Fill Tier CSS (Pure CSS Spring Transitions, 0 React Re-renders!) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .candy-tier {
              opacity: 0;
              transform-origin: 140px 140px;
              transform: translateY(28px) scale(0.68);
              transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out;
              pointer-events: none;
            }
            [data-fill-level="1"] .candy-tier-1,
            [data-fill-level="2"] .candy-tier-1,
            [data-fill-level="2"] .candy-tier-2,
            [data-fill-level="3"] .candy-tier-1,
            [data-fill-level="3"] .candy-tier-2,
            [data-fill-level="3"] .candy-tier-3,
            [data-fill-level="4"] .candy-tier-1,
            [data-fill-level="4"] .candy-tier-2,
            [data-fill-level="4"] .candy-tier-3,
            [data-fill-level="4"] .candy-tier-4,
            [data-fill-level="5"] .candy-tier-1,
            [data-fill-level="5"] .candy-tier-2,
            [data-fill-level="5"] .candy-tier-3,
            [data-fill-level="5"] .candy-tier-4,
            [data-fill-level="5"] .candy-tier-5 {
              opacity: 1 !important;
              transform: translateY(0) scale(1) !important;
            }
          `,
        }}
      />

      {/* TOP COUNTRY FRIENDS ARCADE HUD (Carved Barnwood Signboard) */}
      <header 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-2xl bg-gradient-to-b from-[#5C2B09] via-[#431B05] to-[#2B0E02] border-2 border-[#F59E0B] shadow-[0_12px_35px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.25)] text-white pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Game Title Badge */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-amber-600/40">
          <span className="text-xl animate-pulse filter drop-shadow-xs">🎃</span>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[11px] font-black text-amber-300 font-mono tracking-wide leading-none">
              CANDY HARVEST
            </span>
            <span className="text-[9px] font-bold text-amber-100/70 tracking-tight leading-tight">
              VOLCANO BLITZ
            </span>
          </div>
        </div>

        {/* 3D Golden Medallion Live Score */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-b from-[#FDE047] via-[#F59E0B] to-[#B45309] border border-[#FEF08A] shadow-md text-amber-950">
          <span className="text-sm filter drop-shadow-xs">⭐</span>
          <span
            ref={scoreDomRef}
            className="text-base sm:text-lg font-black font-mono tracking-tight text-amber-950 min-w-[28px] text-center filter drop-shadow-xs"
          >
            0
          </span>
        </div>

        {/* Ripe Country Apple / Berry 10-Second Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-b from-[#EF4444] via-[#DC2626] to-[#991B1B] border border-[#FCA5A5] shadow-md text-white">
          <span className="animate-spin text-sm" style={{ animationDuration: "3s" }}>⏳</span>
          <span
            ref={timerDomRef}
            className="text-base sm:text-lg font-black font-mono text-white min-w-[34px] text-center animate-pulse filter drop-shadow-xs"
          >
            10s
          </span>
        </div>

        {/* Combo Indicator */}
        <div
          ref={comboDomRef}
          style={{ display: "none" }}
          className="items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 border border-amber-300 text-white text-xs font-black animate-bounce font-mono shadow-md"
        >
          🔥 COMBO
        </div>

        {/* Tactile 3D "Burst More" Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerVolcanoBurst(48);
          }}
          disabled={isGameOver}
          className="hidden sm:flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-[#FF7A00] to-[#E65100] hover:brightness-110 active:translate-y-0.5 border-b-[3px] border-[#9A3412] active:border-b-0 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-40"
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
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:translate-y-0.5 ${
            showLeaderboard
              ? "bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-b-[3px] border-amber-800 shadow-md"
              : "bg-gradient-to-b from-[#3E1A05] to-[#250C01] hover:brightness-120 text-amber-300 border border-amber-500/50 border-b-[3px] border-[#180600]"
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
          className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#3E1A05] to-[#250C01] hover:brightness-120 border border-amber-500/40 flex items-center justify-center text-amber-200 hover:text-white transition-all cursor-pointer active:translate-y-0.5"
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
          className="w-8 h-8 rounded-xl bg-gradient-to-b from-rose-600 to-rose-800 hover:brightness-110 text-white flex items-center justify-center transition-all cursor-pointer border border-rose-400/50 active:translate-y-0.5"
          title="ออกจากมินิเกม (ESC)"
        >
          <X size={16} />
        </button>
      </header>

      {/* TOP 10 LEADERBOARD SIDE PANEL (Country Harvest Hall of Fame) */}
      {showLeaderboard && (
        <aside 
          className="absolute right-4 top-20 bottom-24 w-72 sm:w-80 z-40 pointer-events-auto flex flex-col rounded-3xl bg-gradient-to-b from-[#2E1204] via-[#1F0A02] to-[#120401] border-2 border-amber-500 shadow-[0_16px_45px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3.5 pb-2.5 border-b border-amber-600/30 flex items-center justify-between bg-gradient-to-r from-[#5C2B09] to-[#3E1B05]">
            <div className="flex items-center gap-2">
              <span className="text-xl filter drop-shadow-xs">🏆</span>
              <div>
                <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                  🌾 HARVEST HALL OF FAME
                </h3>
                <p className="text-[10px] text-amber-100/70 font-sans">
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
              className="text-amber-300 hover:text-white p-1 cursor-pointer transition-colors"
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
                      ? "bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/10 border border-amber-400/80 shadow-xs"
                      : isTop2
                      ? "bg-[#331808]/80 border border-slate-500/50"
                      : isTop3
                      ? "bg-[#281206]/80 border border-amber-700/50"
                      : "bg-[#1E0B02]/70 border border-white/5"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-xs shrink-0">
                    {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : (
                      <span className="text-amber-200/60 font-bold">{idx + 1}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-amber-100 truncate">
                        {item.playerName}
                      </span>
                      <span className="text-xs font-black font-mono text-amber-300 shrink-0">
                        {item.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-amber-200/60 mt-0.5 font-mono">
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

      {/* GAME OVER & CONGRATULATIONS CELEBRATION MODAL (Country Friends Harvest Marquee) */}
      {isGameOver && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Outer Unclipped Modal Wrapper */}
          <div className="relative max-w-md w-full pt-16">
            
            {/* Top Fierce Fiery-Eyed Jack-o'-Lantern Emblem (ฟักทองตาไฟดุดัน คมชัด 100% ไม่โดนตัดขอบเด็ดขาด) */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center filter drop-shadow-[0_10px_35px_rgba(255,102,0,0.95)] animate-bounce" 
              style={{ animationDuration: "2.4s" }}
            >
              <FiercePumpkinEmblem className="w-32 h-26 sm:w-36 sm:h-28" />
            </div>

            {/* Inner Content Card (Scrollable if screen is small, emblem never clipped) */}
            <div 
              className="relative w-full rounded-3xl bg-gradient-to-b from-[#3D1A06] via-[#2A1003] to-[#170701] border-[3px] border-[#F59E0B] pt-14 p-6 sm:p-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.4)] max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-[0.2em] font-mono">
                  🌾 CC HALLOWEEN HARVEST FESTIVAL 🌾
                </span>
                <h2 className="text-2xl font-black text-white mt-1 filter drop-shadow-xs">
                  🎉 หมดเวลา 10 วินาทีสุดมันส์!
                </h2>
                <p className="text-xs font-bold text-amber-200 mt-1">
                  {getPlayerTitle(finalScore)}
                </p>
              </div>

              {/* Score Highlight Plaque (Country Friends Golden Parchment Award Plaque) */}
              <div className="my-4 p-4 rounded-2xl bg-gradient-to-b from-[#FFFDF7] to-[#FEF3C7] border-2 border-[#D97706] text-[#451A03] shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_8px_20px_rgba(0,0,0,0.3)]">
                <span className="text-[10px] font-bold text-[#92400E] uppercase tracking-widest font-mono">
                  คะแนนรวมที่คุณทำได้
                </span>
                <div className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-[#EA580C] via-[#D97706] to-[#B45309] mt-1 filter drop-shadow-xs">
                  ⭐ {finalScore}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#D97706]/30 text-xs font-mono">
                  <div>
                    <span className="text-[#78350F] block text-[10px]">เก็บผลผลิตได้</span>
                    <span className="font-bold text-[#451A03] text-sm">🍬 {finalCandies} ชิ้น</span>
                  </div>
                  <div>
                    <span className="text-[#78350F] block text-[10px]">คอมโบสูงสุด</span>
                    <span className="font-bold text-[#EA580C] text-sm">🔥 x{finalMaxCombo}</span>
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
                  <span className="text-[10px] text-amber-200/60 font-mono">อัปเดตสด</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-[#1C0901] p-2 border border-amber-600/30 custom-scrollbar">
                  {leaderboard.slice(0, 10).map((entry, idx) => (
                    <div key={entry.id || idx} className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono font-bold text-[11px] text-amber-400 w-4">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                        </span>
                        <span className="text-amber-100 font-semibold truncate max-w-[140px]">
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
                <div className="my-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/30 via-orange-500/40 to-amber-500/30 border-2 border-amber-400 text-center shadow-[0_0_35px_rgba(245,158,11,0.55)] animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy size={22} className="text-amber-300 animate-bounce" />
                    <span className="text-lg font-black text-amber-200 font-mono tracking-wide filter drop-shadow-xs">
                      คุณคว้าอันดับที่ #{rankAchieved}!
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-1">
                    {rankAchieved === 1
                      ? "👑 สุดยอดแชมป์อันดับ 1 แห่งงานเทศกาล!"
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
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 hover:brightness-110 border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 text-slate-950 text-xs font-black shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
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
                /* Name Input & Tactile Submit Button to Return to Normal Screen */
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C0901] border-2 border-amber-400/70 focus:border-amber-300 focus:outline-none text-white text-sm font-semibold placeholder:text-amber-200/40 font-sans shadow-inner"
                    />
                  </div>

                  {/* Big Tactile 3D Button: Saves and exits immediately to normal page */}
                  <button
                    type="submit"
                    disabled={isSubmittingScore || !playerName.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-b from-[#FF7A00] via-[#FF6200] to-[#E65100] hover:brightness-110 border-b-4 border-[#9A3412] active:border-b-0 active:translate-y-1 text-white text-sm font-black shadow-[0_6px_22px_rgba(255,98,0,0.45)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Send size={16} />
                    <span>
                      {isSubmittingScore ? "กำลังบันทึก..." : hasSubmitted ? "✅ บันทึกแล้ว!" : "🏆 บันทึกคะแนน & ออกจากเกม"}
                    </span>
                  </button>
                </form>
              )}

              {/* Quick Action Footer Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-amber-600/30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#5C2B09] to-[#3E1B05] hover:brightness-120 border-b-3 border-[#2A1003] active:border-b-0 active:translate-y-0.5 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#2A1003]/80 hover:bg-rose-900/60 hover:text-rose-200 active:translate-y-0.5 text-amber-100/70 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border border-amber-600/20"
                >
                  <span>ออกจากเกม</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
