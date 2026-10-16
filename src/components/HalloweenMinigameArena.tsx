"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Volume2, VolumeX, X, RefreshCw, Send, Zap, Trophy, ChevronRight } from "lucide-react";
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

type GiftKind =
  | "gift_ruby"
  | "gift_arcane"
  | "gift_emerald"
  | "chest_gold"
  | "diamond_thunder"
  | "gift_pumpkin"
  | "star_power"
  | "candy_swirl"
  | "candy_bonbon";

interface GiftParticle {
  id: number;
  kind: GiftKind;
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
  scale: number;
}

interface FloatingScoreText {
  id: number;
  text: string;
  subText?: string;
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
  kind: "star" | "electric";
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

interface LightningSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isBranch?: boolean;
}

interface LightningBolt {
  id: number;
  segments: LightningSegment[];
  color: string;
  coreColor: string;
  opacity: number;
  width: number;
}

// ============================================================================
// AAA BOSS ART: THE DEMON KING MAW (หัวปีศาจอสูรฮาโลวีนอ้าปากพ่นของขวัญสายฟ้า)
// ============================================================================
function DemonKingMawBoss({
  isErupting = false,
  className = "w-40 h-38 sm:w-48 sm:h-44",
}: {
  isErupting?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 220 200"
      className={`${className} overflow-visible select-none`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Abyssal Storm Aura behind Demon */}
        <radialGradient id="demonAuraGrad" cx="50%" cy="52%" r="52%">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#EC4899" stopOpacity="0.55" />
          <stop offset="75%" stopColor="#3B82F6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#090214" stopOpacity="0" />
        </radialGradient>

        {/* Demon Horn Obsidian & Gold Gradient */}
        <linearGradient id="demonHornGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="40%" stopColor="#311042" />
          <stop offset="75%" stopColor="#701A75" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Demon Armored Head Gradient */}
        <radialGradient id="demonHeadGrad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="38%" stopColor="#DC2626" />
          <stop offset="72%" stopColor="#7F1D1D" />
          <stop offset="100%" stopColor="#2A082E" />
        </radialGradient>

        {/* Demon Side Armor Plates */}
        <linearGradient id="demonPlateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B91C1C" />
          <stop offset="55%" stopColor="#581C87" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        {/* Blazing Cyan-Gold Lightning Eye Gradient */}
        <linearGradient id="demonEyeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="80%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>

        {/* Deep Portal Vortex Inside Demon Mouth */}
        <radialGradient id="demonMawVortex" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="22%" stopColor="#38BDF8" />
          <stop offset="52%" stopColor="#9333EA" />
          <stop offset="82%" stopColor="#3B0764" />
          <stop offset="100%" stopColor="#090214" />
        </radialGradient>

        {/* Golden Rim & Fang Gradient */}
        <linearGradient id="demonFangGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Outer Pulsing Magic Circle & Storm Halo */}
      <circle
        cx="110"
        cy="105"
        r={isErupting ? "96" : "86"}
        fill="url(#demonAuraGrad)"
        style={{ transition: "r 0.12s ease-out" }}
      />
      <circle
        cx="110"
        cy="105"
        r="82"
        stroke="#38BDF8"
        strokeWidth="1.5"
        strokeDasharray="8 6"
        opacity="0.55"
      />
      <circle
        cx="110"
        cy="105"
        r="74"
        stroke="#F59E0B"
        strokeWidth="1.2"
        strokeDasharray="4 8"
        opacity="0.45"
      />

      {/* LEFT COLOSSAL CURVED DEMON HORN */}
      <path
        d="M 62 66 C 28 54, 8 28, 18 6 C 26 20, 46 32, 76 46 Z"
        fill="url(#demonHornGrad)"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Horn Ridge Lines */}
      <path d="M 52 56 C 36 46, 26 32, 24 18" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <path d="M 64 52 L 54 62 M 48 44 L 38 54 M 34 32 L 26 40" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />

      {/* RIGHT COLOSSAL CURVED DEMON HORN */}
      <path
        d="M 158 66 C 192 54, 212 28, 202 6 C 194 20, 174 32, 144 46 Z"
        fill="url(#demonHornGrad)"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M 168 56 C 184 46, 194 32, 196 18" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <path d="M 156 52 L 166 62 M 172 44 L 182 54 M 186 32 L 194 40" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />

      {/* Upper Bat-Wing Demon Ears */}
      <polygon points="48,78 14,68 38,98" fill="#4C1D95" stroke="#C084FC" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="172,78 206,68 182,98" fill="#4C1D95" stroke="#C084FC" strokeWidth="2" strokeLinejoin="round" />

      {/* Demon Crown & Armored Side Cheeks */}
      <ellipse cx="64" cy="106" rx="34" ry="46" fill="url(#demonPlateGrad)" stroke="#F59E0B" strokeWidth="2.5" />
      <ellipse cx="156" cy="106" rx="34" ry="46" fill="url(#demonPlateGrad)" stroke="#F59E0B" strokeWidth="2.5" />

      {/* Main Demon Skull Cranium */}
      <path
        d="M 46 84 C 46 42, 174 42, 174 84 C 186 116, 178 156, 152 172 C 130 184, 90 184, 68 172 C 42 156, 34 116, 46 84 Z"
        fill="url(#demonHeadGrad)"
        stroke="#FDE047"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Forehead Third-Eye Thunder Diamond Crest */}
      <polygon
        points="110,40 122,56 110,72 98,56"
        fill="url(#demonEyeGrad)"
        stroke="#1E1B4B"
        strokeWidth="2.5"
      />
      <polygon points="110,45 117,56 110,67 103,56" fill="#FFFFFF" opacity="0.85" />

      {/* Heavy Armored Demon Brow Ridge */}
      <path
        d="M 48 74 Q 82 92, 110 82 Q 138 92, 172 74"
        stroke="#2A082E"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 50 72 Q 82 90, 110 80 Q 138 90, 170 72"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* BLAZING LIGHTNING EYES */}
      {/* Left Eye Socket */}
      <polygon
        points="52,78 96,90 84,104 56,96"
        fill="url(#demonEyeGrad)"
        stroke="#1E1B4B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon points="74,85 78,99 72,99" fill="#090214" />
      <circle cx="68" cy="88" r="3" fill="#FFFFFF" />

      {/* Right Eye Socket */}
      <polygon
        points="168,78 124,90 136,104 164,96"
        fill="url(#demonEyeGrad)"
        stroke="#1E1B4B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon points="146,85 142,99 148,99" fill="#090214" />
      <circle cx="152" cy="88" r="3" fill="#FFFFFF" />

      {/* Demon Snout Nasal Cavities */}
      <polygon points="103,96 108,106 98,106" fill="#1E0521" stroke="#F59E0B" strokeWidth="1.5" />
      <polygon points="117,96 122,106 112,106" fill="#1E0521" stroke="#F59E0B" strokeWidth="1.5" />

      {/* ================================================================= */}
      {/* THE GAPING DEMON MAW (ปากปีศาจอ้ากว้างพ่นของขวัญและสายฟ้า)           */}
      {/* ================================================================= */}
      <g
        style={{
          transform: isErupting ? "translateY(7px) scale(1.06)" : "translateY(0px) scale(1)",
          transformOrigin: "110px 140px",
          transition: "transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Outer Jaw Rim */}
        <path
          d="M 48 118 Q 110 106, 172 118 C 180 152, 156 184, 110 186 C 64 184, 40 152, 48 118 Z"
          fill="#190426"
          stroke="#F59E0B"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Swirling Dimensional Portal Vortex inside the Demon's Throat */}
        <ellipse
          cx="110"
          cy="146"
          rx={isErupting ? "52" : "46"}
          ry={isErupting ? "30" : "24"}
          fill="url(#demonMawVortex)"
        />

        {/* Inner Lightning & Gift Energy Rings inside Mouth */}
        <ellipse
          cx="110"
          cy="146"
          rx="34"
          ry="16"
          stroke="#FEF08A"
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="none"
        />

        {/* Mini Gift Silhouette Emerging from Throat */}
        <g transform={isErupting ? "translate(110, 144) scale(1.18)" : "translate(110, 146) scale(0.95)"}>
          <rect x="-12" y="-10" width="24" height="20" rx="4" fill="#EF4444" stroke="#FEF08A" strokeWidth="2" />
          <line x1="0" y1="-10" x2="0" y2="10" stroke="#FDE047" strokeWidth="4" />
          <line x1="-12" y1="0" x2="12" y2="0" stroke="#FDE047" strokeWidth="4" />
        </g>

        {/* UPPER RAZOR FANGS (เขี้ยวบน) */}
        <polygon points="56,119 64,142 72,117" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="74,117 81,136 88,115" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="92,115 99,132 106,114" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="114,114 121,132 128,115" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="132,115 139,136 146,117" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="148,117 156,142 164,119" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />

        {/* LOWER RAZOR TUSKS & FANGS (เขี้ยวล่าง) */}
        <polygon points="60,168 68,144 76,174" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="82,176 89,156 96,180" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="104,181 110,160 116,181" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="124,180 131,156 138,176" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
        <polygon points="144,174 152,144 160,168" fill="url(#demonFangGrad)" stroke="#451A03" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

// ============================================================================
// GIFT & TREASURE CATALOG (ของขวัญและไอเทมที่พ่นออกจากปากปีศาจ)
// ============================================================================
const GIFT_CATALOG: Array<{
  kind: GiftKind;
  points: number;
  isRare: boolean;
  weight: number;
  label: string;
}> = [
  { kind: "gift_ruby", points: 30, isRare: false, weight: 28, label: "🎁" },
  { kind: "gift_arcane", points: 40, isRare: false, weight: 24, label: "🎁" },
  { kind: "gift_emerald", points: 35, isRare: false, weight: 22, label: "🎁" },
  { kind: "candy_swirl", points: 25, isRare: false, weight: 18, label: "🍭" },
  { kind: "candy_bonbon", points: 20, isRare: false, weight: 18, label: "🍬" },
  { kind: "gift_pumpkin", points: 65, isRare: true, weight: 14, label: "🎃" },
  { kind: "star_power", points: 75, isRare: true, weight: 12, label: "⭐" },
  { kind: "diamond_thunder", points: 95, isRare: true, weight: 10, label: "💎" },
  { kind: "chest_gold", points: 125, isRare: true, weight: 8, label: "👑" },
];

const ROUND_DURATION_SECONDS = 10;
const MAX_PARTICLES = 320;

// Helper to draw a 5-pointed star on a 2D canvas context
function drawStarPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

// Helper to draw rounded rectangle
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function HalloweenMinigameArena({
  isOpen,
  onClose,
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

  // Boss & Storm physical state
  const [isVolcanoErupting, setIsVolcanoErupting] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Final stats for game over modal
  const [finalScore, setFinalScore] = useState(0);
  const [finalCandies, setFinalCandies] = useState(0);
  const [finalMaxCombo, setFinalMaxCombo] = useState(0);
  const [rankAchieved, setAchievedRank] = useState<number | null>(null);
  const [closingCountdown, setClosingCountdown] = useState<number | null>(null);

  // Mutable refs for 60fps zero-lag updates
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
  const timerBarDomRef = useRef<HTMLDivElement | null>(null);
  const comboDomRef = useRef<HTMLDivElement | null>(null);
  const caughtDomRef = useRef<HTMLSpanElement | null>(null);
  const basketDomRef = useRef<HTMLDivElement | null>(null);

  // Canvas & Physics Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<GiftParticle[]>([]);
  const sparklesRef = useRef<CatchSparkle[]>([]);
  const shockwavesRef = useRef<VolcanoShockwave[]>([]);
  const floatingTextsRef = useRef<FloatingScoreText[]>([]);
  const lightningBoltsRef = useRef<LightningBolt[]>([]);
  const sheetLightningAlphaRef = useRef(0);
  const sheetLightningColorRef = useRef("#38BDF8");

  const animFrameIdRef = useRef<number | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveTimersRef = useRef<NodeJS.Timeout[]>([]);
  const geyserTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Basket coordinate tracker with spring bounce
  const basketPosRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
    targetX: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
    tilt: 0,
    targetTilt: 0,
    bounceScale: 1,
  });

  // Pre-rendered HD GPU Texture Sprites
  const giftSpriteMapRef = useRef<Map<GiftKind, HTMLCanvasElement>>(new Map());
  const starSparkleSpriteRef = useRef<HTMLCanvasElement | null>(null);
  const electricSparkleSpriteRef = useRef<HTMLCanvasElement | null>(null);

  // Audio Context Singleton
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);
  const lastCatchSoundTimeRef = useRef(0);

  // ============================================================================
  // SOUND ENGINE: THUNDER CRACK, DEMON ROAR, GIFT CHIME & FANFARE
  // ============================================================================
  const playSound = useCallback((type: "catch" | "rare" | "volcano" | "thunder" | "gameover") => {
    if (!soundEnabled) return;
    try {
      const now = Date.now();
      if ((type === "volcano" || type === "thunder") && now - lastSoundTimeRef.current < 75) return;
      if (type === "catch") {
        if (now - lastCatchSoundTimeRef.current < 42) return;
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
        // Crisp arcade gift-box pop + coin chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.085); // D6
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.095);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "rare") {
        // Legendary Treasure Fanfare Arpeggio
        const notes = [587.33, 880, 1174.66, 1567.98];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.038);
          gain.gain.setValueAtTime(0.24, ctx.currentTime + idx * 0.038);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.038 + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.038);
          osc.stop(ctx.currentTime + idx * 0.038 + 0.17);
        });
      } else if (type === "volcano" || type === "thunder") {
        // High-voltage lightning crack + Demon bass roar
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.34);
        gain.gain.setValueAtTime(0.32, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);

        // Electric zing harmonic
        const zapOsc = ctx.createOscillator();
        const zapGain = ctx.createGain();
        zapOsc.type = "square";
        zapOsc.frequency.setValueAtTime(1450, ctx.currentTime);
        zapOsc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.14);
        zapGain.gain.setValueAtTime(0.14, ctx.currentTime);
        zapGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        zapOsc.connect(zapGain);
        zapGain.connect(ctx.destination);
        zapOsc.start();
        zapOsc.stop(ctx.currentTime + 0.16);
      } else if (type === "gameover") {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.24);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
        });
      }
    } catch {
      // Ignore autoplay blocks
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

  // ============================================================================
  // AAA CUSTOM 2D VECTOR GAME SPRITE GENERATOR (80x80 HD Offscreen Textures)
  // ============================================================================
  const getGiftSprite = useCallback((kind: GiftKind): HTMLCanvasElement => {
    const existing = giftSpriteMapRef.current.get(kind);
    if (existing) return existing;

    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const drawGiftBox = (
      boxTop: string,
      boxBottom: string,
      borderCol: string,
      ribbonCol: string,
      ribbonHighlight: string,
      glowCol: string
    ) => {
      // Soft outer glow
      const aura = ctx.createRadialGradient(40, 42, 6, 40, 42, 36);
      aura.addColorStop(0, glowCol);
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 42, 36, 0, Math.PI * 2);
      ctx.fill();

      // Bow Loops at top
      ctx.save();
      ctx.fillStyle = ribbonCol;
      ctx.strokeStyle = "#1E1B4B";
      ctx.lineWidth = 2.2;
      // Left bow loop
      ctx.beginPath();
      ctx.ellipse(30, 20, 11, 6.5, -0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Right bow loop
      ctx.beginPath();
      ctx.ellipse(50, 20, 11, 6.5, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Center knot
      ctx.fillStyle = ribbonHighlight;
      ctx.beginPath();
      ctx.arc(40, 22, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Main Box Body (x: 18..62, y: 27..66)
      const bodyGrad = ctx.createLinearGradient(18, 27, 18, 66);
      bodyGrad.addColorStop(0, boxTop);
      bodyGrad.addColorStop(1, boxBottom);
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 2.6;
      drawRoundRect(ctx, 18, 27, 44, 39, 7);
      ctx.fill();
      ctx.stroke();

      // Vertical & Horizontal Ribbons
      ctx.fillStyle = ribbonCol;
      ctx.fillRect(35.5, 27, 9, 39);
      ctx.fillRect(18, 42, 44, 8.5);

      // Gift Box Lid Overhang (x: 15..65, y: 23..33)
      const lidGrad = ctx.createLinearGradient(15, 23, 15, 33);
      lidGrad.addColorStop(0, boxTop);
      lidGrad.addColorStop(1, boxBottom);
      ctx.fillStyle = lidGrad;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 2.5;
      drawRoundRect(ctx, 15, 23, 50, 10, 4.5);
      ctx.fill();
      ctx.stroke();

      // Lid Center Ribbon
      ctx.fillStyle = ribbonHighlight;
      ctx.fillRect(35.5, 23, 9, 10);

      // Glossy 3D Specular Highlight on top-left
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(20, 26);
      ctx.lineTo(31, 26);
      ctx.stroke();
    };

    if (kind === "gift_ruby") {
      drawGiftBox("#FF3B5C", "#B91C1C", "#450A0A", "#FACC15", "#FEF08A", "rgba(244, 63, 94, 0.45)");
    } else if (kind === "gift_arcane") {
      drawGiftBox("#A855F7", "#581C87", "#1E1B4B", "#38BDF8", "#BAE6FD", "rgba(168, 85, 247, 0.5)");
    } else if (kind === "gift_emerald") {
      drawGiftBox("#10B981", "#047857", "#064E3B", "#FBBF24", "#FEF08A", "rgba(16, 185, 129, 0.45)");
    } else if (kind === "chest_gold") {
      // Legendary Golden Treasure Chest + Crown Aura
      const aura = ctx.createRadialGradient(40, 40, 5, 40, 40, 38);
      aura.addColorStop(0, "rgba(250, 204, 21, 0.85)");
      aura.addColorStop(0.6, "rgba(245, 158, 11, 0.35)");
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 40, 38, 0, Math.PI * 2);
      ctx.fill();

      // Chest Base
      const chestGrad = ctx.createLinearGradient(14, 24, 14, 64);
      chestGrad.addColorStop(0, "#FEF08A");
      chestGrad.addColorStop(0.4, "#F59E0B");
      chestGrad.addColorStop(1, "#92400E");
      ctx.fillStyle = chestGrad;
      ctx.strokeStyle = "#451A03";
      ctx.lineWidth = 2.8;
      drawRoundRect(ctx, 15, 26, 50, 38, 8);
      ctx.fill();
      ctx.stroke();

      // Crimson Royal Inner Trim
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(19, 38, 42, 22);

      // Gold Bands & Lock Plate
      ctx.fillStyle = "#FDE047";
      ctx.fillRect(15, 36, 50, 6);
      ctx.fillRect(22, 26, 6, 38);
      ctx.fillRect(52, 26, 6, 38);

      // Center Ruby Gem Lock
      ctx.beginPath();
      ctx.arc(40, 40, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#38BDF8";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (kind === "diamond_thunder") {
      // Thunder Diamond Gem
      const aura = ctx.createRadialGradient(40, 40, 4, 40, 40, 36);
      aura.addColorStop(0, "rgba(56, 189, 248, 0.85)");
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 40, 36, 0, Math.PI * 2);
      ctx.fill();

      const gemGrad = ctx.createLinearGradient(20, 16, 60, 64);
      gemGrad.addColorStop(0, "#E0F2FE");
      gemGrad.addColorStop(0.35, "#38BDF8");
      gemGrad.addColorStop(0.75, "#0284C7");
      gemGrad.addColorStop(1, "#1E3A8A");

      ctx.fillStyle = gemGrad;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(28, 20);
      ctx.lineTo(52, 20);
      ctx.lineTo(64, 34);
      ctx.lineTo(40, 64);
      ctx.lineTo(16, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner facets
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(16, 34);
      ctx.lineTo(64, 34);
      ctx.moveTo(28, 20);
      ctx.lineTo(32, 34);
      ctx.lineTo(40, 64);
      ctx.moveTo(52, 20);
      ctx.lineTo(48, 34);
      ctx.lineTo(40, 64);
      ctx.stroke();
    } else if (kind === "gift_pumpkin") {
      // Golden Demon Jack-o'-Lantern Orb
      const aura = ctx.createRadialGradient(40, 42, 6, 40, 42, 36);
      aura.addColorStop(0, "rgba(255, 122, 0, 0.7)");
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 42, 36, 0, Math.PI * 2);
      ctx.fill();

      const pGrad = ctx.createRadialGradient(40, 34, 4, 40, 44, 26);
      pGrad.addColorStop(0, "#FDE047");
      pGrad.addColorStop(0.45, "#FF7A00");
      pGrad.addColorStop(1, "#B91C1C");
      ctx.fillStyle = pGrad;
      ctx.strokeStyle = "#451A03";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(40, 44, 24, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Crown Stem
      ctx.fillStyle = "#FACC15";
      ctx.beginPath();
      ctx.moveTo(32, 25);
      ctx.lineTo(35, 16);
      ctx.lineTo(40, 21);
      ctx.lineTo(45, 16);
      ctx.lineTo(48, 25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing Eyes & Grin
      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.moveTo(28, 38);
      ctx.lineTo(36, 41);
      ctx.lineTo(31, 45);
      ctx.closePath();
      ctx.moveTo(52, 38);
      ctx.lineTo(44, 41);
      ctx.lineTo(49, 45);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(40, 48, 10, 0.15, Math.PI - 0.15);
      ctx.fill();
    } else if (kind === "star_power") {
      // Plump 3D Golden Star
      const aura = ctx.createRadialGradient(40, 40, 4, 40, 40, 36);
      aura.addColorStop(0, "rgba(250, 204, 21, 0.8)");
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 40, 36, 0, Math.PI * 2);
      ctx.fill();

      const stGrad = ctx.createLinearGradient(40, 14, 40, 66);
      stGrad.addColorStop(0, "#FFFFFF");
      stGrad.addColorStop(0.3, "#FEF08A");
      stGrad.addColorStop(0.75, "#F59E0B");
      stGrad.addColorStop(1, "#B45309");
      ctx.fillStyle = stGrad;
      ctx.strokeStyle = "#78350F";
      ctx.lineWidth = 2.6;
      drawStarPath(ctx, 40, 40, 5, 25, 12);
      ctx.fill();
      ctx.stroke();
    } else if (kind === "candy_swirl") {
      // Glossy Swirl Lollipop
      ctx.strokeStyle = "#F8FAFC";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(40, 44);
      ctx.lineTo(54, 68);
      ctx.stroke();

      const popGrad = ctx.createRadialGradient(36, 32, 2, 38, 36, 20);
      popGrad.addColorStop(0, "#F472B6");
      popGrad.addColorStop(0.6, "#EC4899");
      popGrad.addColorStop(1, "#9D174D");
      ctx.fillStyle = popGrad;
      ctx.strokeStyle = "#500724";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(38, 36, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // White Swirl
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(38, 36, 12, 0, Math.PI * 1.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(38, 36, 6, Math.PI * 0.5, Math.PI * 1.9);
      ctx.stroke();
    } else if (kind === "candy_bonbon") {
      // Wrapped Neon Halloween Candy
      ctx.fillStyle = "#F59E0B";
      ctx.strokeStyle = "#451A03";
      ctx.lineWidth = 2.2;
      // Left wrapper wing
      ctx.beginPath();
      ctx.moveTo(25, 40);
      ctx.lineTo(12, 28);
      ctx.lineTo(14, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Right wrapper wing
      ctx.beginPath();
      ctx.moveTo(55, 40);
      ctx.lineTo(68, 28);
      ctx.lineTo(66, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center Candy Body
      const cGrad = ctx.createLinearGradient(24, 26, 56, 54);
      cGrad.addColorStop(0, "#C084FC");
      cGrad.addColorStop(0.5, "#9333EA");
      cGrad.addColorStop(1, "#581C87");
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(40, 40, 17, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Stripes
      ctx.strokeStyle = "#FDE047";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(34, 28);
      ctx.lineTo(30, 51);
      ctx.moveTo(46, 28);
      ctx.lineTo(42, 51);
      ctx.stroke();
    }

    giftSpriteMapRef.current.set(kind, canvas);
    return canvas;
  }, []);

  const getSparkleSprite = useCallback((kind: "star" | "electric"): HTMLCanvasElement => {
    if (kind === "star" && starSparkleSpriteRef.current) return starSparkleSpriteRef.current;
    if (kind === "electric" && electricSparkleSpriteRef.current) return electricSparkleSpriteRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = kind === "star" ? "#FDE047" : "#38BDF8";
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.quadraticCurveTo(16, 16, 30, 16);
      ctx.quadraticCurveTo(16, 16, 16, 30);
      ctx.quadraticCurveTo(16, 16, 2, 16);
      ctx.quadraticCurveTo(16, 16, 16, 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (kind === "star") starSparkleSpriteRef.current = canvas;
    else electricSparkleSpriteRef.current = canvas;
    return canvas;
  }, []);

  // ============================================================================
  // PROCEDURAL JAGGED LIGHTNING BOLT & SHEET LIGHTNING GENERATOR (ฟ้าผ่า & ฟ้าแลบ)
  // ============================================================================
  const spawnLightningStrike = useCallback((originX: number, originY: number, intensity: "normal" | "mega" = "normal") => {
    if (typeof window === "undefined") return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const palette = [
      { glow: "#38BDF8", core: "#FFFFFF", flash: "rgba(56, 189, 248, 0.28)" }, // Electric Cyan
      { glow: "#C084FC", core: "#FFFFFF", flash: "rgba(192, 132, 252, 0.26)" }, // Arcane Violet
      { glow: "#FACC15", core: "#FFFFFF", flash: "rgba(250, 204, 21, 0.24)" }, // Golden Thunder
    ];
    const chosen = palette[Math.floor(Math.random() * palette.length)];

    // Trigger screen-wide sheet lightning flash (ฟ้าแลบ)
    sheetLightningAlphaRef.current = intensity === "mega" ? 0.42 : 0.26;
    sheetLightningColorRef.current = chosen.glow;

    const boltCount = intensity === "mega" ? 3 : 2;

    for (let b = 0; b < boltCount; b++) {
      const segments: LightningSegment[] = [];
      // Strike either from Demon's Maw/Horns outward or from top storm clouds down
      const startX = b === 0 ? originX + (Math.random() - 0.5) * 60 : width * (0.1 + Math.random() * 0.8);
      const startY = b === 0 ? originY - 10 : 0;
      const endX = Math.max(40, Math.min(width - 40, startX + (Math.random() - 0.5) * (width * 0.55)));
      const endY = height * (0.48 + Math.random() * 0.42);

      const steps = 11;
      let currX = startX;
      let currY = startY;

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const targetX = startX + (endX - startX) * t;
        const targetY = startY + (endY - startY) * t;
        const jitter = s === steps ? 0 : (Math.random() - 0.5) * 68;
        const nextX = targetX + jitter;
        const nextY = targetY + (Math.random() - 0.5) * 14;

        segments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY, isBranch: false });

        // Forked secondary lightning branch
        if (s > 2 && s < steps - 1 && Math.random() < 0.48) {
          let bx = nextX;
          let by = nextY;
          const branchDir = Math.random() < 0.5 ? -1 : 1;
          for (let br = 0; br < 4; br++) {
            const nbx = bx + branchDir * (22 + Math.random() * 34);
            const nby = by + 28 + Math.random() * 26;
            segments.push({ x1: bx, y1: by, x2: nbx, y2: nby, isBranch: true });
            bx = nbx;
            by = nby;
          }
        }

        currX = nextX;
        currY = nextY;
      }

      lightningBoltsRef.current.push({
        id: Math.random(),
        segments,
        color: chosen.glow,
        coreColor: chosen.core,
        opacity: 1.0,
        width: intensity === "mega" ? 4.5 : 3.5,
      });
    }
  }, []);

  // ============================================================================
  // DEMON GIFT ERUPTION (ของขวัญพ่นทะลักออกจากปากปีศาจ + สายฟ้าฟาด!)
  // ============================================================================
  const triggerVolcanoBurst = useCallback((count = 32, withThunder = true) => {
    if (typeof window === "undefined") return;
    playSound(withThunder ? "thunder" : "volcano");

    setIsVolcanoErupting(true);
    setScreenShake(true);
    setTimeout(() => setIsVolcanoErupting(false), 260);
    setTimeout(() => setScreenShake(false), 140);

    const width = window.innerWidth;
    // Demon Boss Maw is anchored prominently at top-center of the arena
    const originX = width * 0.5;
    const originY = 148; // Exact mouth coordinate of the Demon Boss

    if (withThunder) {
      spawnLightningStrike(originX, originY, count >= 38 ? "mega" : "normal");
    }

    // Expanding Arcane & Lightning Shockwave rings from Demon's mouth
    shockwavesRef.current.push({
      id: Math.random(),
      x: originX,
      y: originY,
      radius: 14,
      maxRadius: Math.min(280, width * 0.42),
      opacity: 0.95,
      color: "#38BDF8",
    });
    shockwavesRef.current.push({
      id: Math.random(),
      x: originX,
      y: originY,
      radius: 8,
      maxRadius: Math.min(210, width * 0.32),
      opacity: 0.9,
      color: "#FACC15",
    });

    const totalWeight = GIFT_CATALOG.reduce((acc, c) => acc + c.weight, 0);
    const newItems: GiftParticle[] = [];

    for (let i = 0; i < count; i++) {
      let rand = Math.random() * totalWeight;
      let selected = GIFT_CATALOG[0];
      for (const t of GIFT_CATALOG) {
        if (rand < t.weight) {
          selected = t;
          break;
        }
        rand -= t.weight;
      }

      // Distribute gifts across the entire arena width from the Demon's open mouth
      const targetX = width * (0.05 + Math.random() * 0.9);
      const fallFrames = 24 + Math.random() * 14;
      const vx = (targetX - originX) / fallFrames;

      // Explosive fountain spewing out of the Demon's mouth
      const isFountainArc = Math.random() < 0.38;
      const vy = isFountainArc
        ? -(Math.random() * 6.5 + 1.5) // Shoots up/out from demon fangs before arcing down
        : Math.random() * 9.5 + 4.5;   // Blasts straight out of the demon throat

      newItems.push({
        id: Math.random() + Date.now(),
        kind: selected.kind,
        x: originX + (Math.random() - 0.5) * 38,
        y: originY + (Math.random() - 0.5) * 14,
        vx,
        vy,
        rotation: (Math.random() - 0.5) * 28,
        vRot: (Math.random() - 0.5) * 7.5,
        size: selected.isRare ? 68 : 60,
        points: selected.points,
        isRare: selected.isRare,
        settled: false,
        opacity: 1,
        bounceCount: 0,
        scale: 0.35, // Grows smoothly as it emerges from the Demon's mouth!
      });
    }

    // Crisp Starlight & Electric Sparks shooting from Demon's mouth (NO brown circles!)
    for (let sp = 0; sp < 16; sp++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 2.1;
      const spd = Math.random() * 13 + 5;
      sparklesRef.current.push({
        id: Math.random(),
        x: originX + (Math.random() - 0.5) * 24,
        y: originY,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 3.5,
        color: sp % 2 === 0 ? "#FDE047" : "#38BDF8",
        opacity: 1,
        kind: sp % 2 === 0 ? "star" : "electric",
      });
    }

    const current = particlesRef.current;
    if (current.length + newItems.length > MAX_PARTICLES) {
      particlesRef.current = [...current.slice(-(MAX_PARTICLES - newItems.length)), ...newItems];
    } else {
      particlesRef.current = [...current, ...newItems];
    }
  }, [playSound, spawnLightningStrike]);

  // Continuous stream of gifts spewing steadily from the Demon's mouth
  const triggerMiniGeyser = useCallback((count = 3) => {
    if (typeof window === "undefined" || !isPlayingRef.current) return;

    const width = window.innerWidth;
    const originX = width * 0.5;
    const originY = 148;

    const totalWeight = GIFT_CATALOG.reduce((acc, c) => acc + c.weight, 0);
    const newItems: GiftParticle[] = [];

    for (let i = 0; i < count; i++) {
      let rand = Math.random() * totalWeight;
      let selected = GIFT_CATALOG[0];
      for (const t of GIFT_CATALOG) {
        if (rand < t.weight) {
          selected = t;
          break;
        }
        rand -= t.weight;
      }

      const targetX = width * (0.08 + Math.random() * 0.84);
      const fallFrames = 26 + Math.random() * 10;
      const vx = (targetX - originX) / fallFrames;
      const vy = Math.random() * 6.5 + 4.5;

      newItems.push({
        id: Math.random() + Date.now(),
        kind: selected.kind,
        x: originX + (Math.random() - 0.5) * 26,
        y: originY + (Math.random() - 0.5) * 8,
        vx,
        vy,
        rotation: (Math.random() - 0.5) * 22,
        vRot: (Math.random() - 0.5) * 6,
        size: selected.isRare ? 66 : 58,
        points: selected.points,
        isRare: selected.isRare,
        settled: false,
        opacity: 1,
        bounceCount: 0,
        scale: 0.4,
      });
    }

    const current = particlesRef.current;
    if (current.length + newItems.length <= MAX_PARTICLES) {
      particlesRef.current = [...current, ...newItems];
    }
  }, []);

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
    if (timerBarDomRef.current) timerBarDomRef.current.style.width = "100%";
    if (caughtDomRef.current) caughtDomRef.current.innerText = "0 ชิ้น";
    if (comboDomRef.current) comboDomRef.current.style.display = "none";
    if (basketDomRef.current) basketDomRef.current.setAttribute("data-fill-level", "0");

    particlesRef.current = [];
    sparklesRef.current = [];
    shockwavesRef.current = [];
    floatingTextsRef.current = [];
    lightningBoltsRef.current = [];

    waveTimersRef.current.forEach(clearTimeout);
    waveTimersRef.current = [];
    if (geyserTimerRef.current) clearInterval(geyserTimerRef.current);

    const scheduleWave = (delayMs: number, count: number, withThunder = true) => {
      const t = setTimeout(() => {
        if (isPlayingRef.current) {
          triggerVolcanoBurst(count, withThunder);
        }
      }, delayMs);
      waveTimersRef.current.push(t);
    };

    // 10-Second Demon Gift & Lightning Eruption Schedule
    scheduleWave(40, 36, true);     // 0.04s - OPENING THUNDER GIFT ERUPTION!
    scheduleWave(750, 22, false);   // 0.75s - Gift fountain
    scheduleWave(1500, 28, true);   // 1.50s - Lightning strike + Gift wave
    scheduleWave(2300, 24, false);  // 2.30s - Demon barrage
    scheduleWave(3100, 32, true);   // 3.10s - High voltage burst
    scheduleWave(3900, 26, false);  // 3.90s - Treasure deluge
    scheduleWave(4700, 35, true);   // 4.70s - Mid-game Super Thunder!
    scheduleWave(5500, 28, false);  // 5.50s - Gift shower
    scheduleWave(6300, 34, true);   // 6.30s - Twin lightning wave
    scheduleWave(7100, 32, false);  // 7.10s - Rapid stream
    scheduleWave(7900, 38, true);   // 7.90s - Storm crescendo
    scheduleWave(8700, 42, true);   // 8.70s - Mega Thunder Deluge!
    scheduleWave(9250, 46, true);   // 9.25s - GRAND DEMON KING FINALE!

    geyserTimerRef.current = setInterval(() => {
      if (isPlayingRef.current && !isGameOverRef.current) {
        triggerMiniGeyser(3);
      }
    }, 270);

    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    roundTimerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      const remaining = Math.max(0, timeLeftRef.current);

      if (timerDomRef.current) {
        timerDomRef.current.innerText = `${remaining}s`;
      }
      if (timerBarDomRef.current) {
        timerBarDomRef.current.style.width = `${(remaining / ROUND_DURATION_SECONDS) * 100}%`;
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

  // Track Mouse, Touch & Keyboard for Basket Movement
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
      basketPosRef.current.targetTilt = Math.max(-14, Math.min(14, mouseDx * 0.42));
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

  // ============================================================================
  // 60FPS HARDWARE-ACCELERATED PHYSICS, LIGHTNING & RENDER LOOP
  // ============================================================================
  useEffect(() => {
    if (!isOpen) return;

    let isRunning = true;
    let lastTime = performance.now();

    const loop = () => {
      if (!isRunning) return;

      try {
        const now = performance.now();
        const dt = Math.min(2.0, Math.max(0.2, (now - lastTime) / 16.667));
        lastTime = now;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const gravity = 1.08;
        const floorY = height - 22;

        // Basket dimensions
        const basketW = Math.min(275, Math.max(200, width * 0.32));
        const basketH = Math.round(basketW * 0.75);
        const basketY = height - basketH - 12;
        const catchY = basketY + basketH * 0.38;

        // Smooth Basket Tracking + Elastic Catch Bounce
        const basket = basketPosRef.current;
        basket.x = basket.targetX;
        basket.tilt += (basket.targetTilt - basket.tilt) * 0.22;
        basket.targetTilt *= 0.85;
        basket.bounceScale += (1.0 - basket.bounceScale) * 0.25 * dt;

        if (basketDomRef.current) {
          basketDomRef.current.style.transform = `translate3d(${basket.x - basketW / 2}px, ${basketY}px, 0) rotate(${basket.tilt}deg) scale(${basket.bounceScale})`;
        }

        ctx.clearRect(0, 0, width, height);

        // 1. SHEET LIGHTNING ATMOSPHERIC FLASH (ฟ้าแลบสว่างวาบทั่วท้องฟ้า)
        if (sheetLightningAlphaRef.current > 0.005) {
          ctx.save();
          const flashGrad = ctx.createRadialGradient(
            width * 0.5,
            130,
            20,
            width * 0.5,
            height * 0.45,
            Math.max(width, height) * 0.85
          );
          flashGrad.addColorStop(0, "#FFFFFF");
          flashGrad.addColorStop(0.35, sheetLightningColorRef.current);
          flashGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
          ctx.globalAlpha = Math.max(0, sheetLightningAlphaRef.current);
          ctx.fillStyle = flashGrad;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();

          sheetLightningAlphaRef.current *= Math.pow(0.82, dt);
        }

        // 2. JAGGED LIGHTNING BOLTS RENDERING (สายฟ้าผ่าฟาดเปรี้ยงลงมาในจอ)
        const activeBolts: LightningBolt[] = [];
        for (let b = 0; b < lightningBoltsRef.current.length; b++) {
          const bolt = lightningBoltsRef.current[b];
          bolt.opacity -= 0.068 * dt;
          if (bolt.opacity > 0) {
            activeBolts.push(bolt);
            ctx.save();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            // Outer Electric Glow Pass
            ctx.globalAlpha = Math.max(0, bolt.opacity * 0.55);
            ctx.strokeStyle = bolt.color;
            ctx.lineWidth = bolt.width * 3.2;
            ctx.beginPath();
            for (let s = 0; s < bolt.segments.length; s++) {
              const seg = bolt.segments[s];
              ctx.moveTo(seg.x1, seg.y1);
              ctx.lineTo(seg.x2, seg.y2);
            }
            ctx.stroke();

            // Inner White-Hot Core Pass
            ctx.globalAlpha = Math.max(0, bolt.opacity);
            ctx.strokeStyle = bolt.coreColor;
            ctx.lineWidth = bolt.width * 0.9;
            ctx.beginPath();
            for (let s = 0; s < bolt.segments.length; s++) {
              const seg = bolt.segments[s];
              if (!seg.isBranch) {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
              }
            }
            ctx.stroke();
            ctx.restore();
          }
        }
        lightningBoltsRef.current = activeBolts;

        // 3. SHOCKWAVE RINGS FROM DEMON MAW
        const swRemaining: VolcanoShockwave[] = [];
        for (let sw = 0; sw < shockwavesRef.current.length; sw++) {
          const s = shockwavesRef.current[sw];
          s.radius += 8.5 * dt;
          s.opacity -= 0.048 * dt;

          if (s.opacity > 0 && s.radius < s.maxRadius) {
            swRemaining.push(s);
            ctx.save();
            ctx.globalAlpha = Math.max(0, s.opacity * 0.8);
            ctx.strokeStyle = s.color;
            ctx.lineWidth = Math.max(1.5, 4.5 * s.opacity);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
        shockwavesRef.current = swRemaining;

        // 4. GIFTS & TREASURES PHYSICS & RENDERING
        const particles = particlesRef.current;
        const remaining: GiftParticle[] = [];

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (!p.settled) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += gravity * dt;
            if (p.vy > 24) p.vy = 24;
            p.vx *= Math.pow(0.994, dt);
            p.rotation += p.vRot * dt;
            if (p.scale < 1.0) {
              p.scale = Math.min(1.0, p.scale + 0.085 * dt);
            }

            // Wall bouncing
            if (p.x <= 28) {
              p.x = 28;
              p.vx = Math.abs(p.vx) * 0.65;
            } else if (p.x >= width - 28) {
              p.x = width - 28;
              p.vx = -Math.abs(p.vx) * 0.65;
            }

            // Generous Basket Catch Zone
            const catchSpan = basketW * 0.54;
            const inBasketX = p.x >= basket.x - catchSpan && p.x <= basket.x + catchSpan;
            const inBasketY = p.y >= catchY - 48 && p.y <= catchY + 58;
            const isFalling = p.vy > -3;

            if (inBasketX && inBasketY && isFalling && isPlayingRef.current && !isGameOverRef.current) {
              // CAUGHT GIFT!
              playSound(p.isRare ? "rare" : "catch");
              basketPosRef.current.bounceScale = 1.08;

              // Burst Star & Electric Sparkles on Catch
              for (let s = 0; s < 7; s++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 2.5 + Math.random() * 5.5;
                sparklesRef.current.push({
                  id: Math.random(),
                  x: p.x,
                  y: catchY,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd - 2.5,
                  size: 3 + Math.random() * 3,
                  color: p.isRare ? "#FDE047" : "#38BDF8",
                  opacity: 1,
                  kind: s % 2 === 0 ? "star" : "electric",
                });
              }

              // Update Progressive Basket Fill Tiers (0 -> 1 -> 2 -> 3 -> 4 -> 5)
              const nextCount = candiesCaughtRef.current + 1;
              const fillLevel =
                nextCount >= 32 ? 5 :
                nextCount >= 22 ? 4 :
                nextCount >= 13 ? 3 :
                nextCount >= 6 ? 2 :
                nextCount >= 1 ? 1 : 0;
              if (basketDomRef.current && basketDomRef.current.getAttribute("data-fill-level") !== String(fillLevel)) {
                basketDomRef.current.setAttribute("data-fill-level", String(fillLevel));
              }

              // Combo & Score Calculation
              comboRef.current += 1;
              if (comboRef.current > maxComboRef.current) {
                maxComboRef.current = comboRef.current;
              }

              const multiplier = comboRef.current >= 10 ? 3.0 : comboRef.current >= 5 ? 2.2 : comboRef.current >= 3 ? 1.5 : 1.0;
              const pointsAwarded = Math.round(p.points * multiplier);
              scoreRef.current += pointsAwarded;
              candiesCaughtRef.current += 1;

              if (scoreDomRef.current) scoreDomRef.current.innerText = scoreRef.current.toLocaleString();
              if (caughtDomRef.current) caughtDomRef.current.innerText = `${candiesCaughtRef.current} ชิ้น`;
              if (comboDomRef.current) {
                if (comboRef.current >= 2) {
                  comboDomRef.current.innerText = comboRef.current >= 10
                    ? `⚡ FEVER x${comboRef.current}`
                    : `🔥 COMBO x${comboRef.current}`;
                  comboDomRef.current.style.display = "inline-flex";
                } else {
                  comboDomRef.current.style.display = "none";
                }
              }

              // Floating Score Text
              floatingTextsRef.current.push({
                id: Math.random(),
                text: `+${pointsAwarded}`,
                subText: p.isRare ? "🎁 RARE!" : comboRef.current >= 10 ? "⚡ FEVER!" : undefined,
                x: p.x,
                y: catchY - 18,
                opacity: 1,
                color: p.isRare ? "#FACC15" : comboRef.current >= 10 ? "#38BDF8" : "#4ADE80",
                scale: p.isRare ? 1.35 : 1.1,
              });

              continue;
            }

            // Floor Impact: Clean single bounce then rapid sparkle fade (No messy floor clutter!)
            if (p.y >= floorY - p.size * 0.4) {
              p.y = floorY - p.size * 0.4;
              p.vy = -p.vy * 0.38;
              p.vx *= 0.8;
              p.bounceCount += 1;

              if (p.bounceCount >= 1) {
                p.settled = true;
              }
            }
          } else {
            p.opacity -= 0.14 * dt;
            p.scale *= Math.pow(0.95, dt);
          }

          if (p.opacity > 0.02) {
            remaining.push(p);

            const sprite = getGiftSprite(p.kind);
            const drawSize = p.size * p.scale;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            ctx.restore();
          }
        }

        particlesRef.current = remaining;

        // 5. SPARKLES (Starlight & Electric Sparks - Zero muddy brown circles!)
        const starSp = getSparkleSprite("star");
        const elecSp = getSparkleSprite("electric");
        const sRemaining: CatchSparkle[] = [];
        for (let s = 0; s < sparklesRef.current.length; s++) {
          const sp = sparklesRef.current[s];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vy += 0.38 * dt;
          sp.vx *= Math.pow(0.96, dt);
          sp.opacity -= 0.052 * dt;

          if (sp.opacity > 0) {
            sRemaining.push(sp);
            ctx.globalAlpha = Math.max(0, sp.opacity);
            const tex = sp.kind === "star" ? starSp : elecSp;
            ctx.drawImage(tex, sp.x - 14, sp.y - 14, 28, 28);
          }
        }
        sparklesRef.current = sRemaining;

        // 6. FLOATING SCORE POPUPS
        const fRemaining: FloatingScoreText[] = [];
        if (floatingTextsRef.current.length > 0) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineJoin = "round";

          for (let j = 0; j < floatingTextsRef.current.length; j++) {
            const ft = floatingTextsRef.current[j];
            ft.y -= 3.4 * dt;
            ft.opacity -= 0.048 * dt;

            if (ft.opacity > 0) {
              fRemaining.push(ft);
              ctx.save();
              ctx.globalAlpha = Math.max(0, ft.opacity);
              ctx.font = `900 ${Math.round(22 * ft.scale)}px system-ui, -apple-system, sans-serif`;
              ctx.lineWidth = 4.5;
              ctx.strokeStyle = "#090214";
              ctx.strokeText(ft.text, ft.x, ft.y);
              ctx.fillStyle = ft.color;
              ctx.fillText(ft.text, ft.x, ft.y);

              if (ft.subText) {
                ctx.font = "900 12px system-ui, -apple-system, sans-serif";
                ctx.lineWidth = 3;
                ctx.strokeText(ft.subText, ft.x, ft.y - 20);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(ft.subText, ft.x, ft.y - 20);
              }
              ctx.restore();
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
        const basketW = Math.min(275, Math.max(200, w * 0.32));
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
  }, [isOpen, playSound, getGiftSprite, getSparkleSprite]);

  // Start game once upon opening
  useEffect(() => {
    if (!isOpen) return;
    startGame();
  }, [isOpen, startGame]);

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

      const nameKey = playerName.trim().toLowerCase();
      const rankIdx = updated.findIndex(
        (entry) =>
          entry.playerName.trim().toLowerCase() === nameKey &&
          entry.score === finalScore
      );
      const computedRank = rankIdx !== -1 ? rankIdx + 1 : 1;
      setAchievedRank(computedRank);

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
        transform: screenShake
          ? `translate3d(${(Math.random() - 0.5) * 8}px, ${(Math.random() - 0.5) * 8}px, 0)`
          : undefined,
        transition: "transform 0.05s ease-out",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ===================================================================== */}
      {/* AAA HAUNTED GOTHIC STORM CITADEL ENVIRONMENT (ฉากหลังระดับเกมชั้นนำ)   */}
      {/* ===================================================================== */}
      <div
        className="absolute inset-0 cursor-pointer overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 50% 18%, rgba(168, 85, 247, 0.34) 0%, rgba(59, 7, 100, 0.22) 38%, transparent 68%),
            radial-gradient(circle at 82% 22%, rgba(56, 189, 248, 0.16) 0%, transparent 45%),
            radial-gradient(circle at 18% 25%, rgba(236, 72, 153, 0.14) 0%, transparent 45%),
            linear-gradient(180deg, #070210 0%, #120624 38%, #1E0B36 72%, #090214 100%)
          `,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlayingRef.current && !isGameOverRef.current) {
            triggerVolcanoBurst(36, true);
          }
        }}
        title="แตะหน้าจอเพื่อผ่าสายฟ้าและพ่นของขวัญจากปากปีศาจเพิ่ม!"
      >
        {/* Giant Luminous Harvest Full Moon behind the Demon Boss */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-10 w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(circle, #FEF08A 0%, #F59E0B 35%, rgba(147, 51, 234, 0) 72%)",
          }}
        />

        {/* Panoramic Gothic Castle, Haunted Spires & Dead Trees Silhouette SVG */}
        <svg
          viewBox="0 0 1440 360"
          preserveAspectRatio="none"
          className="absolute bottom-0 inset-x-0 w-full h-56 sm:h-72 pointer-events-none opacity-85"
          fill="none"
        >
          {/* Distant Storm Mountains */}
          <path
            d="M0 360 L0 250 Q180 170 360 240 T720 220 T1080 245 T1440 210 L1440 360 Z"
            fill="#140626"
          />

          {/* Left Haunted Gothic Castle Citadel */}
          <path
            d="M40 260 L40 150 L55 110 L70 150 L70 180 L95 180 L95 95 L115 45 L135 95 L135 180 L160 180 L160 135 L175 100 L190 135 L190 260 Z"
            fill="#0D031A"
          />
          {/* Castle Glowing Windows */}
          <rect x="108" y="110" width="6" height="14" rx="3" fill="#FACC15" opacity="0.85" />
          <rect x="118" y="110" width="6" height="14" rx="3" fill="#FACC15" opacity="0.85" />
          <rect x="113" y="140" width="8" height="16" rx="4" fill="#38BDF8" opacity="0.75" />
          <rect x="52" y="160" width="6" height="12" rx="3" fill="#F59E0B" opacity="0.8" />
          <rect x="172" y="150" width="6" height="12" rx="3" fill="#F59E0B" opacity="0.8" />

          {/* Right Haunted Cathedral & Witch Spire */}
          <path
            d="M1230 260 L1230 160 L1248 115 L1265 160 L1265 190 L1295 190 L1295 85 L1318 28 L1340 85 L1340 190 L1365 190 L1365 140 L1382 95 L1400 140 L1400 260 Z"
            fill="#0D031A"
          />
          <rect x="1312" y="102" width="12" height="22" rx="6" fill="#FACC15" opacity="0.9" />
          <rect x="1312" y="138" width="12" height="18" rx="4" fill="#A855F7" opacity="0.8" />
          <rect x="1245" y="168" width="6" height="12" rx="3" fill="#38BDF8" opacity="0.8" />

          {/* Foreground Rolling Haunted Hills & Cobblestone Stage */}
          <path
            d="M0 360 L0 295 Q320 260 720 295 Q1120 260 1440 295 L1440 360 Z"
            fill="#090214"
          />
          {/* Glowing Arcane Track Line along the Floor */}
          <path
            d="M0 338 Q720 318 1440 338"
            stroke="#A855F7"
            strokeWidth="2.5"
            strokeDasharray="14 10"
            opacity="0.45"
          />
        </svg>

        {/* Top Storm Clouds & Electric Rim Glow */}
        <div
          className="absolute top-0 inset-x-0 h-28 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(9,2,20,0.95) 0%, rgba(30,11,54,0.55) 60%, transparent 100%)",
          }}
        />
      </div>

      {/* ===================================================================== */}
      {/* THE DEMON KING MAW BOSS SPAWNER (ปากปีศาจพ่นของขวัญสายฟ้า)            */}
      {/* ===================================================================== */}
      <div
        className="absolute left-1/2 top-[132px] sm:top-[142px] z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none pointer-events-auto transition-transform duration-100"
        style={{
          transform: `translate(-50%, -50%) ${
            isVolcanoErupting ? "scale(1.16)" : "scale(1)"
          }`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlayingRef.current && !isGameOverRef.current) {
            triggerVolcanoBurst(44, true);
          }
        }}
        title="แตะหัวปีศาจเพื่อผ่าสายฟ้าและพ่นของขวัญทะลัก!"
      >
        <DemonKingMawBoss
          isErupting={isVolcanoErupting}
          className="w-36 h-32 sm:w-46 sm:h-42 filter drop-shadow-[0_0_30px_rgba(168,85,247,0.85)]"
        />

        {/* Interactive Boss Callout Pill */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 text-cyan-200 text-[10px] font-black tracking-wide whitespace-nowrap shadow-[0_0_15px_rgba(56,189,248,0.6)] border border-cyan-400/80 pointer-events-none flex items-center gap-1">
          <Zap size={11} className="text-yellow-300 fill-yellow-300" />
          <span>แตะปีศาจพ่นของขวัญสายฟ้า!</span>
        </div>
      </div>

      {/* 60FPS Hardware-Accelerated Canvas (Lightning Bolts, Sheet Flash & HD Gifts) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-20"
      />

      {/* ===================================================================== */}
      {/* OVERFLOWING JACK-O'-LANTERN GIFT & CANDY BUCKET (ตะกร้ารับของขวัญ)    */}
      {/* ===================================================================== */}
      <div
        ref={basketDomRef}
        data-fill-level="0"
        className="fixed top-0 left-0 pointer-events-none z-30 will-change-transform"
      >
        <div className="relative w-full h-full">
          <svg viewBox="0 0 280 210" className="w-full h-full overflow-visible" fill="none">
            <defs>
              <linearGradient id="jackBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFA726" />
                <stop offset="22%" stopColor="#FF7A00" />
                <stop offset="68%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#9A3412" />
              </linearGradient>

              <linearGradient id="jackRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="45%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>

              <radialGradient id="jackInteriorGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1E0A18" />
                <stop offset="70%" stopColor="#12050D" />
                <stop offset="100%" stopColor="#080106" />
              </radialGradient>

              <linearGradient id="jackFaceDepth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#7C2D12" />
              </linearGradient>
            </defs>

            {/* Ambient Ground Glow under Basket */}
            <ellipse cx="140" cy="204" rx="102" ry="9" fill="rgba(168,85,247,0.38)" />

            {/* Handle */}
            <path
              d="M 224 76 C 265 88, 260 144, 235 158"
              stroke="#1A0D08"
              strokeWidth="13"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 224 76 C 263 88, 258 142, 235 156"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Deep Interior Cavity */}
            <ellipse cx="140" cy="74" rx="92" ry="20" fill="url(#jackInteriorGrad)" stroke="#5A1A06" strokeWidth="2" />

            {/* 🎁 DYNAMIC GIFT & TREAT OVERFLOW TIERS (เพิ่มขึ้นเรื่อยๆ ตามจำนวนที่รับได้) */}
            {/* TIER 1: Ruby Gift Box & Candy Corns (1-5 items) */}
            <g className="candy-tier candy-tier-1">
              {/* Ruby Red Gift Box Left */}
              <rect x="86" y="50" width="28" height="24" rx="4" fill="#EF4444" stroke="#450A0A" strokeWidth="2" transform="rotate(-10 100 62)" />
              <rect x="97" y="50" width="6" height="24" fill="#FACC15" transform="rotate(-10 100 62)" />
              <rect x="86" y="59" width="28" height="5" fill="#FACC15" transform="rotate(-10 100 62)" />
              {/* Emerald Gift Box Right */}
              <rect x="166" y="52" width="26" height="22" rx="4" fill="#10B981" stroke="#064E3B" strokeWidth="2" transform="rotate(12 179 63)" />
              <rect x="176" y="52" width="5" height="22" fill="#FDE047" transform="rotate(12 179 63)" />
              {/* Purple Spiral Candy */}
              <circle cx="140" cy="68" r="10" fill="#A855F7" stroke="#3B0764" strokeWidth="2" />
            </g>

            {/* TIER 2: Arcane Purple Gift Box & Swirl Lollipops (6-12 items) */}
            <g className="candy-tier candy-tier-2">
              {/* Arcane Mystery Box Center-Left */}
              <rect x="110" y="38" width="30" height="26" rx="4" fill="#9333EA" stroke="#1E1B4B" strokeWidth="2" transform="rotate(-5 125 51)" />
              <rect x="122" y="38" width="6" height="26" fill="#38BDF8" transform="rotate(-5 125 51)" />
              <rect x="110" y="48" width="30" height="5" fill="#38BDF8" transform="rotate(-5 125 51)" />
              {/* Swirl Lollipop */}
              <line x1="156" y1="74" x2="162" y2="42" stroke="#E2E8F0" strokeWidth="3" />
              <circle cx="162" cy="40" r="13" fill="#EC4899" stroke="#831843" strokeWidth="2" />
              <path d="M 162 31 A 9 9 0 0 1 171 40 A 6 6 0 0 1 162 46" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* TIER 3: Golden Treasure Chest & Thunder Diamond (13-21 items) */}
            <g className="candy-tier candy-tier-3">
              {/* Candy Cane Left */}
              <path d="M 74 74 L 74 34 C 74 16, 52 16, 52 30" fill="none" stroke="#FF7A00" strokeWidth="8.5" strokeLinecap="round" />
              <path d="M 74 74 L 74 34 C 74 16, 52 16, 52 30" fill="none" stroke="#1E1E1E" strokeWidth="8.5" strokeDasharray="5 7" strokeLinecap="round" />
              {/* Thunder Diamond Center-Right */}
              <polygon points="172,24 190,24 198,35 181,54 164,35" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
            </g>

            {/* TIER 4: Royal Golden Gift & Star Power (22-31 items) */}
            <g className="candy-tier candy-tier-4">
              {/* Golden Crown Gift Top Center */}
              <rect x="124" y="16" width="32" height="28" rx="5" fill="#F59E0B" stroke="#451A03" strokeWidth="2.2" />
              <rect x="137" y="16" width="6" height="28" fill="#EF4444" />
              <rect x="124" y="27" width="32" height="6" fill="#EF4444" />
              {/* Candy Cane Right */}
              <path d="M 202 72 L 202 32 C 202 16, 222 16, 222 28" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
              <path d="M 202 72 L 202 32 C 202 16, 222 16, 222 28" fill="none" stroke="#7E22CE" strokeWidth="8" strokeDasharray="5 7" strokeLinecap="round" />
            </g>

            {/* TIER 5: Overflowing Grand Jackpot Mountain (32+ items) */}
            <g className="candy-tier candy-tier-5">
              {/* Giant Golden Star & Gems */}
              <polygon points="102,10 107,22 120,22 110,30 114,42 102,34 90,42 94,30 84,22 97,22" fill="#FDE047" stroke="#78350F" strokeWidth="2" />
              <circle cx="188" cy="48" r="11" fill="#F43F5E" stroke="#881337" strokeWidth="2" />
              <circle cx="72" cy="56" r="10" fill="#38BDF8" stroke="#0C4A6E" strokeWidth="2" />
            </g>

            {/* FRONT PUMPKIN BUCKET BODY */}
            <path
              d="M 44 80
                 C 18 108, 14 165, 52 192
                 C 74 206, 110 206, 140 206
                 C 170 206, 206 206, 228 192
                 C 266 165, 262 108, 236 80
                 C 214 74, 168 72, 140 72
                 C 112 72, 66 74, 44 80 Z"
              fill="url(#jackBodyGrad)"
              stroke="#451A03"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Pumpkin Lobe Creases */}
            <path d="M 88 76 C 58 115, 60 172, 86 198" stroke="#9A3412" strokeWidth="4.5" fill="none" opacity="0.85" strokeLinecap="round" />
            <path d="M 120 74 C 108 120, 110 176, 122 205" stroke="#9A3412" strokeWidth="4.5" fill="none" opacity="0.85" strokeLinecap="round" />
            <path d="M 160 74 C 172 120, 170 176, 158 205" stroke="#9A3412" strokeWidth="4.5" fill="none" opacity="0.85" strokeLinecap="round" />
            <path d="M 192 76 C 222 115, 220 172, 194 198" stroke="#9A3412" strokeWidth="4.5" fill="none" opacity="0.85" strokeLinecap="round" />

            {/* Top Rim Lip */}
            <path d="M 44 78 C 64 71, 216 71, 236 78 C 216 87, 64 87, 44 78 Z" fill="url(#jackRimGrad)" stroke="#7C2D12" strokeWidth="2.5" />

            {/* Glowing Carved Eyes & Grin */}
            <path
              d="M 76 114 C 92 98, 124 104, 126 118 C 110 126, 92 126, 76 114 Z"
              fill="url(#jackFaceDepth)"
              stroke="#451A03"
              strokeWidth="2.5"
            />
            <path
              d="M 204 114 C 188 98, 156 104, 154 118 C 170 126, 188 126, 204 114 Z"
              fill="url(#jackFaceDepth)"
              stroke="#451A03"
              strokeWidth="2.5"
            />
            <path
              d="M 140 123 L 151 140 L 129 140 Z"
              fill="url(#jackFaceDepth)"
              stroke="#451A03"
              strokeWidth="2"
            />
            <path
              d="M 66 136 C 88 165, 112 172, 112 172 L 112 155 L 126 155 L 126 173 C 134 175, 146 175, 154 173 L 154 155 L 168 155 L 168 172 C 168 172, 192 165, 214 136 C 188 168, 92 168, 66 136 Z"
              fill="url(#jackFaceDepth)"
              stroke="#451A03"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>

          {/* Gift Counter Badge on Basket Front */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 border-2 border-amber-400 shadow-[0_4px_15px_rgba(0,0,0,0.85)] flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-20">
            <span className="text-[13px]">🎁</span>
            <span
              ref={caughtDomRef}
              className="text-xs font-black font-mono text-amber-300 tracking-wide leading-tight"
            >
              0 ชิ้น
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Fill Tier Spring CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .candy-tier {
              opacity: 0;
              transform-origin: 140px 140px;
              transform: translateY(28px) scale(0.68);
              transition: transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease-out;
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

      {/* ===================================================================== */}
      {/* AAA ESPORTS / ARCADE TOP HUD BAR                                      */}
      {/* ===================================================================== */}
      <header
        className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-2xl bg-gradient-to-b from-[#1E0B36]/95 via-[#120524]/95 to-[#090214]/95 border-2 border-amber-400/90 shadow-[0_12px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(168,85,247,0.45)] text-white pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Game Title */}
        <div className="flex items-center gap-2 pr-2.5 border-r border-purple-500/40">
          <span className="text-xl filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">😈</span>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 font-mono tracking-wider leading-none">
              DEMON GIFT BLITZ
            </span>
            <span className="text-[9px] font-bold text-purple-200/80 tracking-tight leading-tight mt-0.5">
              ศึกปีศาจพ่นของขวัญสายฟ้า
            </span>
          </div>
        </div>

        {/* Live Score Medallion */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-b from-[#FDE047] via-[#F59E0B] to-[#B45309] border border-[#FEF08A] shadow-md text-amber-950">
          <span className="text-sm">🎁</span>
          <span
            ref={scoreDomRef}
            className="text-base sm:text-lg font-black font-mono tracking-tight text-amber-950 min-w-[34px] text-center"
          >
            0
          </span>
        </div>

        {/* 10-Second Countdown Timer with Progress Bar */}
        <div className="relative overflow-hidden flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-b from-rose-600 via-red-600 to-red-900 border border-rose-300 shadow-md text-white">
          <div
            ref={timerBarDomRef}
            className="absolute left-0 bottom-0 h-1 bg-yellow-300 transition-all duration-300"
            style={{ width: "100%" }}
          />
          <span className="text-sm">⚡</span>
          <span
            ref={timerDomRef}
            className="text-base sm:text-lg font-black font-mono text-white min-w-[34px] text-center"
          >
            10s
          </span>
        </div>

        {/* Combo Indicator */}
        <div
          ref={comboDomRef}
          style={{ display: "none" }}
          className="items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 border border-cyan-200 text-white text-xs font-black animate-bounce font-mono shadow-[0_0_15px_rgba(56,189,248,0.6)]"
        >
          🔥 COMBO
        </div>

        {/* Thunder Gift Burst Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerVolcanoBurst(46, true);
          }}
          disabled={isGameOver}
          className="hidden sm:flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-700 hover:brightness-110 active:translate-y-0.5 border-b-[3px] border-indigo-950 text-white text-xs font-black shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all cursor-pointer disabled:opacity-40"
          title="ผ่าสายฟ้าและพ่นของขวัญเพิ่ม!"
        >
          <Zap size={13} className="fill-yellow-300 text-yellow-300" />
          <span>ผ่าสายฟ้า!</span>
        </button>

        {/* Top 10 Leaderboard Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowLeaderboard((v) => !v);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:translate-y-0.5 ${
            showLeaderboard
              ? "bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-b-[3px] border-amber-800 shadow-md"
              : "bg-purple-950/90 hover:bg-purple-900 text-amber-300 border border-amber-400/50"
          }`}
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
          className="w-8 h-8 rounded-xl bg-purple-950/90 hover:bg-purple-900 border border-purple-400/40 flex items-center justify-center text-purple-200 hover:text-white transition-all cursor-pointer"
          title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-8 h-8 rounded-xl bg-gradient-to-b from-rose-600 to-rose-800 hover:brightness-110 text-white flex items-center justify-center transition-all cursor-pointer border border-rose-400/50"
          title="ออกจากมินิเกม (ESC)"
        >
          <X size={16} />
        </button>
      </header>

      {/* TOP 10 LEADERBOARD DRAWER */}
      {showLeaderboard && (
        <aside
          className="absolute right-4 top-20 bottom-24 w-72 sm:w-80 z-40 pointer-events-auto flex flex-col rounded-3xl bg-gradient-to-b from-[#1E0B36] via-[#120524] to-[#090214] border-2 border-amber-400 shadow-[0_16px_45px_rgba(0,0,0,0.9)] overflow-hidden animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3.5 pb-2.5 border-b border-purple-500/30 flex items-center justify-between bg-gradient-to-r from-purple-950 to-indigo-950">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div>
                <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                  ⚡ DEMON BLITZ HALL OF FAME
                </h3>
                <p className="text-[10px] text-purple-200/70">
                  10 อันดับผู้พิชิตของขวัญปีศาจสูงสุด
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLeaderboard(false);
              }}
              className="text-amber-300 hover:text-white p-1 cursor-pointer"
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
                      ? "bg-gradient-to-r from-amber-500/30 via-purple-500/25 to-cyan-500/15 border border-amber-400/90"
                      : isTop2
                      ? "bg-purple-950/70 border border-slate-400/50"
                      : isTop3
                      ? "bg-purple-950/50 border border-amber-600/50"
                      : "bg-white/5 border border-white/5"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-xs shrink-0">
                    {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : (
                      <span className="text-purple-200/60 font-bold">{idx + 1}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">
                        {item.playerName}
                      </span>
                      <span className="text-xs font-black font-mono text-amber-300 shrink-0">
                        {item.score.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-purple-200/70 mt-0.5 font-mono">
                      <span className="truncate">{item.titleEarned || "นักล่าของขวัญ"}</span>
                      <span>🎁 {item.candiesCaught} ชิ้น</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* ===================================================================== */}
      {/* GAME OVER CELEBRATION MODAL                                           */}
      {/* ===================================================================== */}
      {isGameOver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative max-w-md w-full pt-20">
            {/* Top Boss Emblem */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center filter drop-shadow-[0_10px_35px_rgba(168,85,247,0.95)] animate-bounce"
              style={{ animationDuration: "2.4s" }}
            >
              <DemonKingMawBoss isErupting={true} className="w-34 h-30 sm:w-38 sm:h-34" />
            </div>

            <div
              className="relative w-full rounded-3xl bg-gradient-to-b from-[#240B42] via-[#150629] to-[#090214] border-[3px] border-amber-400 pt-14 p-6 sm:p-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_50px_rgba(168,85,247,0.45)] max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <span className="text-[11px] font-black text-cyan-300 uppercase tracking-[0.2em] font-mono">
                  ⚡ DEMON KING GIFT FESTIVAL ⚡
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  🎉 หมดเวลา 10 วินาทีสุดเดือด!
                </h2>
                <p className="text-xs font-bold text-amber-300 mt-1">
                  {getPlayerTitle(finalScore)}
                </p>
              </div>

              {/* Score Plaque */}
              <div className="my-4 p-4 rounded-2xl bg-gradient-to-b from-[#FFFDF7] to-[#FEF3C7] border-2 border-amber-500 text-[#451A03] shadow-lg">
                <span className="text-[10px] font-bold text-[#92400E] uppercase tracking-widest font-mono">
                  คะแนนรวมที่คุณทำได้
                </span>
                <div className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-[#EA580C] via-[#D97706] to-[#7C2D12] mt-1">
                  🎁 {finalScore.toLocaleString()}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-500/30 text-xs font-mono">
                  <div>
                    <span className="text-[#78350F] block text-[10px]">เก็บของขวัญได้</span>
                    <span className="font-bold text-[#451A03] text-sm">🎁 {finalCandies} ชิ้น</span>
                  </div>
                  <div>
                    <span className="text-[#78350F] block text-[10px]">คอมโบสายฟ้าสูงสุด</span>
                    <span className="font-bold text-[#EA580C] text-sm">⚡ x{finalMaxCombo}</span>
                  </div>
                </div>
              </div>

              {/* Top 10 Leaderboard Preview */}
              <div className="my-3 text-left">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1 font-mono">
                    <Trophy size={13} className="text-amber-400" />
                    <span>10 อันดับผู้นำสูงสุด (Top 10):</span>
                  </span>
                  <span className="text-[10px] text-purple-200/70 font-mono">อัปเดตสด</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-[#0D031A] p-2 border border-purple-500/30 custom-scrollbar">
                  {leaderboard.slice(0, 10).map((entry, idx) => (
                    <div key={entry.id || idx} className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-white/5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono font-bold text-[11px] text-amber-400 w-4">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                        </span>
                        <span className="text-white font-semibold truncate max-w-[140px]">
                          {entry.playerName}
                        </span>
                      </div>
                      <span className="font-mono font-black text-amber-300 text-xs shrink-0">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {rankAchieved !== null ? (
                <div className="my-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/30 via-purple-500/40 to-cyan-500/30 border-2 border-amber-400 text-center shadow-[0_0_35px_rgba(168,85,247,0.55)] animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy size={22} className="text-amber-300 animate-bounce" />
                    <span className="text-lg font-black text-amber-200 font-mono tracking-wide">
                      คุณคว้าอันดับที่ #{rankAchieved}!
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-1">
                    {rankAchieved === 1
                      ? "👑 สุดยอดแชมป์อันดับ 1 ผู้พิชิตของขวัญปีศาจ!"
                      : rankAchieved <= 3
                      ? "🥈 ยอดฝีมือระดับท็อป 3 แห่งสายฟ้า!"
                      : rankAchieved <= 10
                      ? "🔥 ติดทำเนียบ Top 10 Hall of Fame!"
                      : "👏 ยอดเยี่ยมมาก! ท้าชิงอันดับใหม่ได้เรื่อยๆ"}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 hover:brightness-110 border-b-4 border-amber-800 text-slate-950 text-xs font-black shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D031A] border-2 border-purple-400/70 focus:border-amber-300 focus:outline-none text-white text-sm font-semibold placeholder:text-purple-200/40 shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingScore || !playerName.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-b from-[#FF7A00] via-[#FF6200] to-[#E65100] hover:brightness-110 border-b-4 border-[#9A3412] text-white text-sm font-black shadow-[0_6px_22px_rgba(255,98,0,0.45)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Send size={16} />
                    <span>
                      {isSubmittingScore ? "กำลังบันทึก..." : hasSubmitted ? "✅ บันทึกแล้ว!" : "🏆 บันทึกคะแนน & ออกจากเกม"}
                    </span>
                  </button>
                </form>
              )}

              {/* Quick Action Footer */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-500/30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-b from-purple-700 to-indigo-900 hover:brightness-115 border-b-3 border-indigo-950 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>🕹️ เล่นอีกรอบ (10 วิ)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-rose-900/60 hover:text-rose-200 text-purple-100/80 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border border-white/10"
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
