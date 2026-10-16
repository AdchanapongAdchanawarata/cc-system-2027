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
// HAY DAY / SUPERCELL STYLE CUTE CHUBBY DEMON (ปีศาจน้อยแก้มป่องพ่นของขวัญสุดน่ารัก)
// Positioned cleanly BELOW the top score HUD bar!
// ============================================================================
function CuteHayDayDemon({
  isErupting = false,
  className = "w-38 h-36 sm:w-44 sm:h-40",
}: {
  isErupting?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 210"
      className={`${className} overflow-visible select-none`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Warm Sunshine & Magic Halo behind Cute Demon */}
        <radialGradient id="cuteDemonAura" cx="50%" cy="54%" r="52%">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.45" />
          <stop offset="80%" stopColor="#FB7185" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        {/* Plump Cute Coral-Strawberry Monster Body Gradient (Hay Day 3D Cartoon Shading) */}
        <radialGradient id="cuteDemonBody" cx="50%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FF9E80" />
          <stop offset="42%" stopColor="#FF6E40" />
          <stop offset="82%" stopColor="#E64A19" />
          <stop offset="100%" stopColor="#BF360C" />
        </radialGradient>

        {/* Soft Cream-Peach Face & Belly Patch */}
        <linearGradient id="cuteDemonBelly" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="100%" stopColor="#FFE0B2" />
        </linearGradient>

        {/* Cute Butterscotch-Cream Curved Horns */}
        <linearGradient id="cuteHornGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="55%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#FFFBEB" />
        </linearGradient>

        {/* Cute Pastel Bat Wings */}
        <linearGradient id="cuteWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>

        {/* Magical Rainbow-Gold Mouth Portal */}
        <radialGradient id="cuteMouthPortal" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="28%" stopColor="#FEF08A" />
          <stop offset="62%" stopColor="#38BDF8" />
          <stop offset="90%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#581C87" />
        </radialGradient>

        {/* Cute Straw Hat Brim Gradient */}
        <linearGradient id="strawHatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Warm Glowing Sunburst Aura */}
      <circle
        cx="120"
        cy="112"
        r={isErupting ? "102" : "90"}
        fill="url(#cuteDemonAura)"
        style={{ transition: "r 0.14s ease-out" }}
      />

      {/* Decorative Floating Stars around Cute Demon */}
      <circle cx="34" cy="54" r="5" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="206" cy="54" r="5" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="24" cy="138" r="4" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.5" />
      <circle cx="216" cy="138" r="4" fill="#F472B6" stroke="#9D174D" strokeWidth="1.5" />

      {/* CUTE LITTLE FLUTTERING WINGS (ปีกน้อยกระพือสองข้าง) */}
      <g
        style={{
          transform: isErupting ? "rotate(-12deg) scale(1.08)" : "rotate(0deg)",
          transformOrigin: "60px 110px",
          transition: "transform 0.12s ease-out",
        }}
      >
        <path
          d="M 52 96 C 18 72, 4 98, 14 126 C 24 118, 34 124, 40 134 C 46 124, 54 122, 58 116 Z"
          fill="url(#cuteWingGrad)"
          stroke="#4E2614"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
      </g>
      <g
        style={{
          transform: isErupting ? "rotate(12deg) scale(1.08)" : "rotate(0deg)",
          transformOrigin: "180px 110px",
          transition: "transform 0.12s ease-out",
        }}
      >
        <path
          d="M 188 96 C 222 72, 236 98, 226 126 C 216 118, 206 124, 200 134 C 194 124, 186 122, 182 116 Z"
          fill="url(#cuteWingGrad)"
          stroke="#4E2614"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
      </g>

      {/* CUTE CHUBBY ROUNDED HORNS (เขาน้อยสีครีมคาราเมลสุดน่ารัก) */}
      {/* Left Horn */}
      <path
        d="M 74 58 C 46 46, 36 20, 54 12 C 66 8, 76 26, 90 46 Z"
        fill="url(#cuteHornGrad)"
        stroke="#4E2614"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M 56 26 C 62 24, 68 28, 70 34" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 64 38 C 70 36, 76 40, 78 46" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

      {/* Right Horn */}
      <path
        d="M 166 58 C 194 46, 204 20, 186 12 C 174 8, 164 26, 150 46 Z"
        fill="url(#cuteHornGrad)"
        stroke="#4E2614"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M 184 26 C 178 24, 172 28, 170 34" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 176 38 C 170 36, 164 40, 162 46" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

      {/* CUTE HAY DAY MINI STRAW FARM HAT ON TOP OF HEAD (หมวกฟางชาวไร่ Hay Day) */}
      <ellipse cx="120" cy="42" rx="38" ry="10" fill="url(#strawHatGrad)" stroke="#4E2614" strokeWidth="3" />
      <path
        d="M 94 40 C 96 20, 144 20, 146 40 Z"
        fill="url(#strawHatGrad)"
        stroke="#4E2614"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Red Farm Hat Ribbon & Little Sunflower */}
      <path d="M 94 37 Q 120 43 146 37" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
      <circle cx="138" cy="35" r="7" fill="#FEF08A" stroke="#4E2614" strokeWidth="2" />
      <circle cx="138" cy="35" r="3" fill="#B45309" />

      {/* CUTE DROOPY MONSTER EARS */}
      <ellipse cx="52" cy="78" rx="16" ry="9" transform="rotate(-22 52 78)" fill="#FF7043" stroke="#4E2614" strokeWidth="3.2" />
      <ellipse cx="52" cy="79" rx="9" ry="4.5" transform="rotate(-22 52 79)" fill="#FFAB91" />
      <ellipse cx="188" cy="78" rx="16" ry="9" transform="rotate(22 188 78)" fill="#FF7043" stroke="#4E2614" strokeWidth="3.2" />
      <ellipse cx="188" cy="79" rx="9" ry="4.5" transform="rotate(22 188 79)" fill="#FFAB91" />

      {/* CHUBBY SQUISHY CHEEKS & BODY (แก้มยุ้ยกลมป๊อกสไตล์ Hay Day) */}
      <path
        d="M 52 92
           C 46 54, 194 54, 188 92
           C 204 124, 196 176, 158 190
           C 136 198, 104 198, 82 190
           C 44 176, 36 124, 52 92 Z"
        fill="url(#cuteDemonBody)"
        stroke="#4E2614"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Top 3D Glossy Highlight on Forehead */}
      <path
        d="M 86 58 Q 120 48 154 58"
        stroke="#FFF3E0"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* BIG SPARKLING KAWAII / SUPERCELL EYES (ตาแป๋วกลมโตเป็นประกาย) */}
      {/* Left Eye */}
      <circle cx="88" cy="90" r="17" fill="#FFFFFF" stroke="#4E2614" strokeWidth="3.5" />
      <circle cx="91" cy="90" r="11" fill="#2E1065" />
      <circle cx="91" cy="90" r="6" fill="#090214" />
      {/* Big Glossy Catchlights */}
      <circle cx="86" cy="84" r="5" fill="#FFFFFF" />
      <circle cx="95" cy="95" r="2.5" fill="#FFFFFF" />

      {/* Right Eye */}
      <circle cx="152" cy="90" r="17" fill="#FFFFFF" stroke="#4E2614" strokeWidth="3.5" />
      <circle cx="149" cy="90" r="11" fill="#2E1065" />
      <circle cx="149" cy="90" r="6" fill="#090214" />
      {/* Big Glossy Catchlights */}
      <circle cx="144" cy="84" r="5" fill="#FFFFFF" />
      <circle cx="153" cy="95" r="2.5" fill="#FFFFFF" />

      {/* Cheerful Arched Eyebrows */}
      <path d="M 72 68 Q 88 60 102 68" stroke="#4E2614" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 138 68 Q 152 60 168 68" stroke="#4E2614" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Cute Little Button Nose */}
      <ellipse cx="120" cy="100" rx="6.5" ry="4.5" fill="#FFCCBC" stroke="#4E2614" strokeWidth="2.5" />

      {/* ROSY PINK BLUSHED CHEEKS (แก้มชมพูระเรื่อน่ารัก) */}
      <ellipse cx="64" cy="110" rx="13" ry="8" fill="#FF4081" opacity="0.55" />
      <ellipse cx="176" cy="110" rx="13" ry="8" fill="#FF4081" opacity="0.55" />
      {/* Cute little cheek shine lines */}
      <path d="M 60 108 L 63 112 M 66 108 L 69 112" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <path d="M 172 108 L 175 112 M 178 108 L 181 112" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />

      {/* ================================================================= */}
      {/* CUTE WIDE OPEN MOUTH SPEWING GIFTS (ปากปีศาจน้อยอ้าพ่นของขวัญ)       */}
      {/* ================================================================= */}
      <g
        style={{
          transform: isErupting ? "translateY(5px) scale(1.08)" : "translateY(0px) scale(1)",
          transformOrigin: "120px 148px",
          transition: "transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Outer Happy Open Mouth Shape */}
        <path
          d="M 70 122
             Q 120 112, 170 122
             C 178 158, 156 186, 120 186
             C 84 186, 62 158, 70 122 Z"
          fill="#581C87"
          stroke="#4E2614"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Magical Rainbow-Gold Portal Vortex Inside Mouth */}
        <ellipse
          cx="120"
          cy="152"
          rx={isErupting ? "44" : "38"}
          ry={isErupting ? "27" : "22"}
          fill="url(#cuteMouthPortal)"
        />

        {/* Cute Gift Box Popping Out of Mouth */}
        <g transform={isErupting ? "translate(120, 150) scale(1.18)" : "translate(120, 152) scale(0.95)"}>
          <rect x="-13" y="-11" width="26" height="22" rx="5" fill="#FF3B5C" stroke="#4E2614" strokeWidth="2.5" />
          <rect x="-3" y="-11" width="6" height="22" fill="#FDE047" />
          <rect x="-13" y="-3" width="26" height="5" fill="#FDE047" />
        </g>

        {/* CUTE ROUNDED BABY FANGS (เขี้ยวจิ๋วมนๆ สุดน่ารัก) */}
        {/* Upper Cute Baby Fangs */}
        <path
          d="M 82 120 L 89 136 C 91 139, 95 139, 97 136 L 103 118 Z"
          fill="#FFFFFF"
          stroke="#4E2614"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M 137 118 L 143 136 C 145 139, 149 139, 151 136 L 158 120 Z"
          fill="#FFFFFF"
          stroke="#4E2614"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Lower Cute Baby Fangs */}
        <path
          d="M 88 177 L 94 164 C 96 161, 99 161, 101 164 L 106 181 Z"
          fill="#FFFFFF"
          stroke="#4E2614"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M 134 181 L 139 164 C 141 161, 144 161, 146 164 L 152 177 Z"
          fill="#FFFFFF"
          stroke="#4E2614"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>

      {/* Cute Chubby Little Hands on Cheeks */}
      <circle cx="52" cy="146" r="12" fill="#FF7043" stroke="#4E2614" strokeWidth="3.2" />
      <circle cx="188" cy="146" r="12" fill="#FF7043" stroke="#4E2614" strokeWidth="3.2" />
    </svg>
  );
}

// ============================================================================
// GIFT & TREASURE CATALOG (ของขวัญและขนมหวานสไตล์ Hay Day)
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
// Exact Y coordinate of the Cute Demon's open mouth (positioned right below the score HUD bar)
const DEMON_MOUTH_Y = 172;

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
  const sheetLightningColorRef = useRef("#FEF08A");

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
  // SOUND ENGINE: CHEERFUL POP, MAGIC THUNDER, GIFT CHIME & FANFARE
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
        // Cheerful Hay Day pop + coin chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.085); // E6
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.095);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "rare") {
        // Joyful Harvest Treasure Arpeggio
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
        // Magical Sparkle Thunder + Cute Pop Boing
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.28, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.27);

        // Electric sparkle zing
        const zapOsc = ctx.createOscillator();
        const zapGain = ctx.createGain();
        zapOsc.type = "triangle";
        zapOsc.frequency.setValueAtTime(1560, ctx.currentTime);
        zapOsc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.14);
        zapGain.gain.setValueAtTime(0.15, ctx.currentTime);
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
  // HAY DAY STYLE 2D VECTOR GAME SPRITES (80x80 Plump Glossy Cartoon Sprites)
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
      // Warm cheerful outer glow
      const aura = ctx.createRadialGradient(40, 42, 6, 40, 42, 36);
      aura.addColorStop(0, glowCol);
      aura.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 42, 36, 0, Math.PI * 2);
      ctx.fill();

      // Plump Cartoon Bow Loops at top
      ctx.save();
      ctx.fillStyle = ribbonCol;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 2.6;
      // Left bow loop
      ctx.beginPath();
      ctx.ellipse(29, 20, 11.5, 7, -0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Right bow loop
      ctx.beginPath();
      ctx.ellipse(51, 20, 11.5, 7, 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Center knot
      ctx.fillStyle = ribbonHighlight;
      ctx.beginPath();
      ctx.arc(40, 22, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Main Chubby Box Body (x: 17..63, y: 27..66)
      const bodyGrad = ctx.createLinearGradient(17, 27, 17, 66);
      bodyGrad.addColorStop(0, boxTop);
      bodyGrad.addColorStop(1, boxBottom);
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 3;
      drawRoundRect(ctx, 17, 27, 46, 39, 9);
      ctx.fill();
      ctx.stroke();

      // Vertical & Horizontal Ribbons
      ctx.fillStyle = ribbonCol;
      ctx.fillRect(35, 27, 10, 39);
      ctx.fillRect(17, 42, 46, 9);

      // Gift Box Lid Overhang (x: 14..66, y: 23..34)
      const lidGrad = ctx.createLinearGradient(14, 23, 14, 34);
      lidGrad.addColorStop(0, boxTop);
      lidGrad.addColorStop(1, boxBottom);
      ctx.fillStyle = lidGrad;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 3;
      drawRoundRect(ctx, 14, 23, 52, 11, 5.5);
      ctx.fill();
      ctx.stroke();

      // Lid Center Ribbon
      ctx.fillStyle = ribbonHighlight;
      ctx.fillRect(35, 23, 10, 11);

      // Glossy Hay Day Cartoon Specular Highlight
      ctx.strokeStyle = "rgba(255,255,255,0.88)";
      ctx.lineWidth = 2.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(20, 27);
      ctx.lineTo(31, 27);
      ctx.stroke();
    };

    if (kind === "gift_ruby") {
      drawGiftBox("#FF5252", "#D32F2F", "#4E2614", "#FFD54F", "#FFF9C4", "rgba(255, 82, 82, 0.45)");
    } else if (kind === "gift_arcane") {
      drawGiftBox("#BA68C8", "#7B1FA2", "#4E2614", "#4FC3F7", "#E1F5FE", "rgba(186, 104, 200, 0.5)");
    } else if (kind === "gift_emerald") {
      drawGiftBox("#66BB6A", "#2E7D32", "#4E2614", "#FFD54F", "#FFF9C4", "rgba(102, 187, 106, 0.45)");
    } else if (kind === "chest_gold") {
      // Hay Day Golden Farm Barn Chest
      const aura = ctx.createRadialGradient(40, 40, 5, 40, 40, 38);
      aura.addColorStop(0, "rgba(255, 238, 88, 0.9)");
      aura.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 40, 38, 0, Math.PI * 2);
      ctx.fill();

      const chestGrad = ctx.createLinearGradient(14, 24, 14, 64);
      chestGrad.addColorStop(0, "#FFF59D");
      chestGrad.addColorStop(0.45, "#FFB300");
      chestGrad.addColorStop(1, "#D84315");
      ctx.fillStyle = chestGrad;
      ctx.strokeStyle = "#4E2614";
      ctx.lineWidth = 3;
      drawRoundRect(ctx, 15, 26, 50, 38, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#E53935";
      ctx.fillRect(19, 38, 42, 22);

      ctx.fillStyle = "#FFEE58";
      ctx.fillRect(15, 36, 50, 6);
      ctx.fillRect(22, 26, 6, 38);
      ctx.fillRect(52, 26, 6, 38);

      ctx.beginPath();
      ctx.arc(40, 40, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = "#29B6F6";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.2;
      ctx.stroke();
    } else if (kind === "diamond_thunder") {
      // Hay Day Sky Diamond
      const aura = ctx.createRadialGradient(40, 40, 4, 40, 40, 36);
      aura.addColorStop(0, "rgba(79, 195, 247, 0.85)");
      aura.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 40, 36, 0, Math.PI * 2);
      ctx.fill();

      const gemGrad = ctx.createLinearGradient(20, 16, 60, 64);
      gemGrad.addColorStop(0, "#E1F5FE");
      gemGrad.addColorStop(0.4, "#29B6F6");
      gemGrad.addColorStop(1, "#0277BD");

      ctx.fillStyle = gemGrad;
      ctx.strokeStyle = "#4E2614";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(28, 20);
      ctx.lineTo(52, 20);
      ctx.lineTo(64, 34);
      ctx.lineTo(40, 64);
      ctx.lineTo(16, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 34);
      ctx.lineTo(62, 34);
      ctx.stroke();
    } else if (kind === "gift_pumpkin") {
      // Cute Smiling Hay Day Harvest Pumpkin
      const aura = ctx.createRadialGradient(40, 42, 6, 40, 42, 36);
      aura.addColorStop(0, "rgba(255, 167, 38, 0.75)");
      aura.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 42, 36, 0, Math.PI * 2);
      ctx.fill();

      const pGrad = ctx.createRadialGradient(40, 34, 4, 40, 44, 26);
      pGrad.addColorStop(0, "#FFF176");
      pGrad.addColorStop(0.5, "#FFA726");
      pGrad.addColorStop(1, "#EF6C00");
      ctx.fillStyle = pGrad;
      ctx.strokeStyle = "#4E2614";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(40, 44, 24, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cute Green Leaf Stem
      ctx.fillStyle = "#66BB6A";
      ctx.beginPath();
      ctx.ellipse(40, 22, 6, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cute Happy Eyes & Smile
      ctx.fillStyle = "#4E2614";
      ctx.beginPath();
      ctx.arc(32, 41, 3, 0, Math.PI * 2);
      ctx.arc(48, 41, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFF59D";
      ctx.beginPath();
      ctx.arc(40, 47, 9, 0.1, Math.PI - 0.1);
      ctx.fill();
      ctx.stroke();
    } else if (kind === "star_power") {
      // Plump Hay Day Experience Star
      const aura = ctx.createRadialGradient(40, 40, 4, 40, 40, 36);
      aura.addColorStop(0, "rgba(255, 241, 118, 0.85)");
      aura.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 40, 36, 0, Math.PI * 2);
      ctx.fill();

      const stGrad = ctx.createLinearGradient(40, 14, 40, 66);
      stGrad.addColorStop(0, "#FFFDE7");
      stGrad.addColorStop(0.35, "#FFEE58");
      stGrad.addColorStop(1, "#FFA000");
      ctx.fillStyle = stGrad;
      ctx.strokeStyle = "#4E2614";
      ctx.lineWidth = 2.8;
      drawStarPath(ctx, 40, 40, 5, 25, 13);
      ctx.fill();
      ctx.stroke();
    } else if (kind === "candy_swirl") {
      // Pink Farm Fair Lollipop
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(40, 44);
      ctx.lineTo(54, 68);
      ctx.stroke();

      const popGrad = ctx.createRadialGradient(36, 32, 2, 38, 36, 20);
      popGrad.addColorStop(0, "#F8BBD0");
      popGrad.addColorStop(0.55, "#F06292");
      popGrad.addColorStop(1, "#D81B60");
      ctx.fillStyle = popGrad;
      ctx.strokeStyle = "#4E2614";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(38, 36, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(38, 36, 12, 0, Math.PI * 1.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(38, 36, 6, Math.PI * 0.5, Math.PI * 1.9);
      ctx.stroke();
    } else if (kind === "candy_bonbon") {
      // Sweet Honey Bonbon
      ctx.fillStyle = "#FFCA28";
      ctx.strokeStyle = "#4E2614";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(25, 40);
      ctx.lineTo(12, 28);
      ctx.lineTo(14, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(55, 40);
      ctx.lineTo(68, 28);
      ctx.lineTo(66, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const cGrad = ctx.createLinearGradient(24, 26, 56, 54);
      cGrad.addColorStop(0, "#FF80AB");
      cGrad.addColorStop(0.5, "#EC407A");
      cGrad.addColorStop(1, "#AD1457");
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(40, 40, 17, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#FFF59D";
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
      ctx.fillStyle = kind === "star" ? "#FFEE58" : "#4FC3F7";
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
  // CHEERFUL CARTOON LIGHTNING BOLT & SKY FLASH GENERATOR (ฟ้าผ่า & ฟ้าแลบสดใส)
  // ============================================================================
  const spawnLightningStrike = useCallback((originX: number, originY: number, intensity: "normal" | "mega" = "normal") => {
    if (typeof window === "undefined") return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const palette = [
      { glow: "#FACC15", core: "#FFFFFF" }, // Sunshine Gold Lightning
      { glow: "#38BDF8", core: "#FFFFFF" }, // Sky Blue Magic Lightning
      { glow: "#F472B6", core: "#FFFFFF" }, // Cotton Candy Pink Lightning
    ];
    const chosen = palette[Math.floor(Math.random() * palette.length)];

    // Trigger warm cheerful sky flash (ฟ้าแลบ)
    sheetLightningAlphaRef.current = intensity === "mega" ? 0.36 : 0.22;
    sheetLightningColorRef.current = chosen.glow;

    const boltCount = intensity === "mega" ? 3 : 2;

    for (let b = 0; b < boltCount; b++) {
      const segments: LightningSegment[] = [];
      const startX = b === 0 ? originX + (Math.random() - 0.5) * 50 : width * (0.12 + Math.random() * 0.76);
      const startY = b === 0 ? originY : 55;
      const endX = Math.max(40, Math.min(width - 40, startX + (Math.random() - 0.5) * (width * 0.5)));
      const endY = height * (0.45 + Math.random() * 0.38);

      const steps = 10;
      let currX = startX;
      let currY = startY;

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const targetX = startX + (endX - startX) * t;
        const targetY = startY + (endY - startY) * t;
        const jitter = s === steps ? 0 : (Math.random() - 0.5) * 60;
        const nextX = targetX + jitter;
        const nextY = targetY + (Math.random() - 0.5) * 12;

        segments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY, isBranch: false });

        if (s > 2 && s < steps - 1 && Math.random() < 0.45) {
          let bx = nextX;
          let by = nextY;
          const branchDir = Math.random() < 0.5 ? -1 : 1;
          for (let br = 0; br < 3; br++) {
            const nbx = bx + branchDir * (20 + Math.random() * 30);
            const nby = by + 26 + Math.random() * 24;
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
  // CUTE DEMON GIFT ERUPTION (ของขวัญพ่นจากปากปีศาจน้อยใต้แถบสกอร์ + ฟ้าผ่า!)
  // ============================================================================
  const triggerVolcanoBurst = useCallback((count = 32, withThunder = true) => {
    if (typeof window === "undefined") return;
    playSound(withThunder ? "thunder" : "volcano");

    setIsVolcanoErupting(true);
    setScreenShake(true);
    setTimeout(() => setIsVolcanoErupting(false), 260);
    setTimeout(() => setScreenShake(false), 120);

    const width = window.innerWidth;
    const originX = width * 0.5;
    // Exact mouth coordinate of the Cute Demon positioned below the score HUD bar!
    const originY = DEMON_MOUTH_Y;

    if (withThunder) {
      spawnLightningStrike(originX, originY, count >= 38 ? "mega" : "normal");
    }

    // Expanding Rainbow-Gold Shockwave rings from the Cute Demon's mouth
    shockwavesRef.current.push({
      id: Math.random(),
      x: originX,
      y: originY,
      radius: 14,
      maxRadius: Math.min(260, width * 0.4),
      opacity: 0.9,
      color: "#FACC15",
    });
    shockwavesRef.current.push({
      id: Math.random(),
      x: originX,
      y: originY,
      radius: 8,
      maxRadius: Math.min(195, width * 0.3),
      opacity: 0.85,
      color: "#38BDF8",
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

      const targetX = width * (0.05 + Math.random() * 0.9);
      const fallFrames = 24 + Math.random() * 14;
      const vx = (targetX - originX) / fallFrames;

      const isFountainArc = Math.random() < 0.36;
      const vy = isFountainArc
        ? -(Math.random() * 5.8 + 1.2)
        : Math.random() * 9.0 + 4.2;

      newItems.push({
        id: Math.random() + Date.now(),
        kind: selected.kind,
        x: originX + (Math.random() - 0.5) * 34,
        y: originY + (Math.random() - 0.5) * 12,
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
        scale: 0.35,
      });
    }

    for (let sp = 0; sp < 14; sp++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 2.1;
      const spd = Math.random() * 12 + 4.5;
      sparklesRef.current.push({
        id: Math.random(),
        x: originX + (Math.random() - 0.5) * 22,
        y: originY,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 3.5,
        color: sp % 2 === 0 ? "#FFEE58" : "#4FC3F7",
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

  // Continuous stream of gifts spewing steadily from the Cute Demon's mouth
  const triggerMiniGeyser = useCallback((count = 3) => {
    if (typeof window === "undefined" || !isPlayingRef.current) return;

    const width = window.innerWidth;
    const originX = width * 0.5;
    const originY = DEMON_MOUTH_Y;

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
      const vy = Math.random() * 6.2 + 4.2;

      newItems.push({
        id: Math.random() + Date.now(),
        kind: selected.kind,
        x: originX + (Math.random() - 0.5) * 24,
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

    // 10-Second Cute Demon Gift & Lightning Eruption Schedule
    scheduleWave(40, 36, true);
    scheduleWave(750, 22, false);
    scheduleWave(1500, 28, true);
    scheduleWave(2300, 24, false);
    scheduleWave(3100, 32, true);
    scheduleWave(3900, 26, false);
    scheduleWave(4700, 35, true);
    scheduleWave(5500, 28, false);
    scheduleWave(6300, 34, true);
    scheduleWave(7100, 32, false);
    scheduleWave(7900, 38, true);
    scheduleWave(8700, 42, true);
    scheduleWave(9250, 46, true);

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
        const gravity = 1.05;
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

        // 1. SHEET LIGHTNING ATMOSPHERIC FLASH (ฟ้าแลบสว่างสดใสทั่วจอ)
        if (sheetLightningAlphaRef.current > 0.005) {
          ctx.save();
          const flashGrad = ctx.createRadialGradient(
            width * 0.5,
            DEMON_MOUTH_Y,
            20,
            width * 0.5,
            height * 0.45,
            Math.max(width, height) * 0.85
          );
          flashGrad.addColorStop(0, "#FFFFFF");
          flashGrad.addColorStop(0.35, sheetLightningColorRef.current);
          flashGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.globalAlpha = Math.max(0, sheetLightningAlphaRef.current);
          ctx.fillStyle = flashGrad;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();

          sheetLightningAlphaRef.current *= Math.pow(0.82, dt);
        }

        // 2. JAGGED LIGHTNING BOLTS RENDERING (สายฟ้าผ่าฟาดเปรี้ยงในจอ)
        const activeBolts: LightningBolt[] = [];
        for (let b = 0; b < lightningBoltsRef.current.length; b++) {
          const bolt = lightningBoltsRef.current[b];
          bolt.opacity -= 0.068 * dt;
          if (bolt.opacity > 0) {
            activeBolts.push(bolt);
            ctx.save();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            // Outer Glow Pass
            ctx.globalAlpha = Math.max(0, bolt.opacity * 0.65);
            ctx.strokeStyle = bolt.color;
            ctx.lineWidth = bolt.width * 3.2;
            ctx.beginPath();
            for (let s = 0; s < bolt.segments.length; s++) {
              const seg = bolt.segments[s];
              ctx.moveTo(seg.x1, seg.y1);
              ctx.lineTo(seg.x2, seg.y2);
            }
            ctx.stroke();

            // Inner White Core Pass
            ctx.globalAlpha = Math.max(0, bolt.opacity);
            ctx.strokeStyle = bolt.coreColor;
            ctx.lineWidth = bolt.width * 1.1;
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

        // 3. SHOCKWAVE RINGS FROM DEMON MOUTH
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
                  color: p.isRare ? "#FFEE58" : "#4FC3F7",
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
                    ? `🌈 FEVER x${comboRef.current}`
                    : `🌟 COMBO x${comboRef.current}`;
                  comboDomRef.current.style.display = "inline-flex";
                } else {
                  comboDomRef.current.style.display = "none";
                }
              }

              // Floating Score Text (Hay Day Cartoon Style)
              floatingTextsRef.current.push({
                id: Math.random(),
                text: `+${pointsAwarded}`,
                subText: p.isRare ? "🎁 RARE!" : comboRef.current >= 10 ? "🌈 FEVER!" : undefined,
                x: p.x,
                y: catchY - 18,
                opacity: 1,
                color: p.isRare ? "#FFEE58" : comboRef.current >= 10 ? "#FF80AB" : "#76FF03",
                scale: p.isRare ? 1.35 : 1.15,
              });

              continue;
            }

            // Floor Impact: Clean single bounce then rapid fade
            if (p.y >= floorY - p.size * 0.4) {
              p.y = floorY - p.size * 0.4;
              p.vy = -p.vy * 0.35;
              p.vx *= 0.8;
              p.bounceCount += 1;

              if (p.bounceCount >= 1) {
                p.settled = true;
              }
            }
          } else {
            p.opacity -= 0.16 * dt;
            p.scale *= Math.pow(0.93, dt);
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

        // 5. SPARKLES
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
              ctx.font = `900 ${Math.round(23 * ft.scale)}px system-ui, -apple-system, sans-serif`;
              ctx.lineWidth = 5;
              ctx.strokeStyle = "#4E2614";
              ctx.strokeText(ft.text, ft.x, ft.y);
              ctx.fillStyle = ft.color;
              ctx.fillText(ft.text, ft.x, ft.y);

              if (ft.subText) {
                ctx.font = "900 12px system-ui, -apple-system, sans-serif";
                ctx.lineWidth = 3.5;
                ctx.strokeText(ft.subText, ft.x, ft.y - 21);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(ft.subText, ft.x, ft.y - 21);
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
          ? `translate3d(${(Math.random() - 0.5) * 6}px, ${(Math.random() - 0.5) * 6}px, 0)`
          : undefined,
        transition: "transform 0.05s ease-out",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ===================================================================== */}
      {/* CUTE & COZY HAY DAY AUTUMN HARVEST FARM ENVIRONMENT (ฉากฟาร์มสไตล์ Hay Day) */}
      {/* ===================================================================== */}
      <div
        className="absolute inset-0 cursor-pointer overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 50% 22%, rgba(254, 240, 138, 0.75) 0%, rgba(251, 146, 60, 0.35) 38%, transparent 70%),
            linear-gradient(180deg, #38BDF8 0%, #818CF8 24%, #F472B6 50%, #FB923C 74%, #FDE047 100%)
          `,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlayingRef.current && !isGameOverRef.current) {
            triggerVolcanoBurst(36, true);
          }
        }}
        title="แตะหน้าจอเพื่อผ่าสายฟ้าและให้ปีศาจน้อยพ่นของขวัญเพิ่ม!"
      >
        {/* Warm Golden Sunburst / Harvest Glow behind the Cute Demon */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-14 w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full pointer-events-none opacity-65"
          style={{
            background: "radial-gradient(circle, #FFFBEB 0%, #FDE047 38%, rgba(251, 146, 60, 0) 72%)",
          }}
        />

        {/* Fluffy Puffy Hay Day Cartoon Clouds */}
        <svg
          viewBox="0 0 1440 260"
          className="absolute top-6 inset-x-0 w-full h-44 sm:h-56 pointer-events-none opacity-90"
          fill="none"
        >
          {/* Left Fluffy Cloud */}
          <g fill="#FFFDF7" opacity="0.92">
            <circle cx="170" cy="110" r="36" />
            <circle cx="215" cy="95" r="46" />
            <circle cx="265" cy="112" r="34" />
            <rect x="165" y="106" width="105" height="40" rx="20" />
          </g>
          {/* Right Fluffy Cloud */}
          <g fill="#FFFDF7" opacity="0.92">
            <circle cx="1140" cy="95" r="34" />
            <circle cx="1185" cy="80" r="44" />
            <circle cx="1235" cy="98" r="32" />
            <rect x="1135" y="92" width="105" height="38" rx="19" />
          </g>
          {/* Left-Center Pastel Peach Cloud */}
          <g fill="#FFF1F2" opacity="0.75">
            <circle cx="430" cy="155" r="26" />
            <circle cx="465" cy="144" r="34" />
            <circle cx="502" cy="156" r="25" />
          </g>
          {/* Right-Center Pastel Peach Cloud */}
          <g fill="#FFF1F2" opacity="0.75">
            <circle cx="940" cy="150" r="26" />
            <circle cx="975" cy="138" r="34" />
            <circle cx="1012" cy="152" r="25" />
          </g>

          {/* Festive Hay Day Bunting Flags (ธงราวงานเทศกาลฟาร์ม) */}
          <path d="M 0 35 Q 240 95 480 25" stroke="#78350F" strokeWidth="2.5" fill="none" opacity="0.55" />
          <polygon points="80,52 100,56 88,78" fill="#EF4444" />
          <polygon points="145,62 165,65 153,88" fill="#FACC15" />
          <polygon points="210,68 230,68 220,92" fill="#22C55E" />
          <polygon points="275,66 295,64 286,88" fill="#38BDF8" />
          <polygon points="340,58 360,54 352,78" fill="#EC4899" />

          <path d="M 1440 35 Q 1200 95 960 25" stroke="#78350F" strokeWidth="2.5" fill="none" opacity="0.55" />
          <polygon points="1360,52 1340,56 1352,78" fill="#EF4444" />
          <polygon points="1295,62 1275,65 1287,88" fill="#FACC15" />
          <polygon points="1230,68 1210,68 1220,92" fill="#22C55E" />
          <polygon points="1165,66 1145,64 1154,88" fill="#38BDF8" />
          <polygon points="1100,58 1080,54 1088,78" fill="#EC4899" />
        </svg>

        {/* Panoramic Hay Day Farm Hills, Red Wooden Barn, Windmill, Trees & Fences */}
        <svg
          viewBox="0 0 1440 380"
          preserveAspectRatio="none"
          className="absolute bottom-0 inset-x-0 w-full h-60 sm:h-80 pointer-events-none"
          fill="none"
        >
          {/* Distant Golden-Green Harvest Hills */}
          <path
            d="M0 380 L0 235 Q240 165 520 225 T1020 210 T1440 220 L1440 380 Z"
            fill="#84CC16"
          />
          {/* Midground Lush Emerald Farm Meadows */}
          <path
            d="M0 380 L0 268 Q340 215 720 265 Q1100 215 1440 265 L1440 380 Z"
            fill="#22C55E"
          />

          {/* LEFT SIDE: CLASSIC HAY DAY RED WOODEN BARN & WINDMILL */}
          {/* Silo Tower */}
          <rect x="44" y="135" width="36" height="115" rx="6" fill="#FEF3C7" stroke="#4E2614" strokeWidth="3.5" />
          <path d="M40 138 C40 112, 84 112, 84 138 Z" fill="#EF4444" stroke="#4E2614" strokeWidth="3.5" />
          <line x1="44" y1="165" x2="80" y2="165" stroke="#D97706" strokeWidth="3" />
          <line x1="44" y1="195" x2="80" y2="195" stroke="#D97706" strokeWidth="3" />

          {/* Red Wooden Barn */}
          <polygon points="75,165 135,120 195,165 195,255 75,255" fill="#EF4444" stroke="#4E2614" strokeWidth="4" strokeLinejoin="round" />
          {/* Gambit Roof White Trim */}
          <polyline points="68,168 100,132 135,112 170,132 202,168" stroke="#FFFDF7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Barn Hayloft Window */}
          <rect x="121" y="142" width="28" height="26" rx="4" fill="#FEF08A" stroke="#4E2614" strokeWidth="3" />
          {/* Barn White X-Door */}
          <rect x="108" y="188" width="54" height="62" fill="#B91C1C" stroke="#FFFDF7" strokeWidth="4" />
          <line x1="108" y1="188" x2="162" y2="250" stroke="#FFFDF7" strokeWidth="4" />
          <line x1="162" y1="188" x2="108" y2="250" stroke="#FFFDF7" strokeWidth="4" />

          {/* Cute Farm Windmill */}
          <polygon points="228,255 240,165 256,165 268,255" fill="#D97706" stroke="#4E2614" strokeWidth="3.2" />
          <line x1="212" y1="138" x2="284" y2="192" stroke="#FFFDF7" strokeWidth="5" strokeLinecap="round" />
          <line x1="284" y1="138" x2="212" y2="192" stroke="#FFFDF7" strokeWidth="5" strokeLinecap="round" />
          <circle cx="248" cy="165" r="8" fill="#EF4444" stroke="#4E2614" strokeWidth="2.5" />

          {/* Golden Hay Bales & Smiling Farm Pumpkins Left */}
          <ellipse cx="295" cy="252" rx="22" ry="14" fill="#FACC15" stroke="#78350F" strokeWidth="3" />
          <ellipse cx="206" cy="256" rx="15" ry="12" fill="#FF7A00" stroke="#4E2614" strokeWidth="2.5" />

          {/* RIGHT SIDE: COZY AUTUMN TREES, WHITE WOODEN FENCE & FARMHOUSE */}
          {/* White Wooden Farm Fence */}
          <g stroke="#4E2614" strokeWidth="2.5" fill="#FFFDF7">
            <rect x="1120" y="232" width="10" height="32" rx="3" />
            <rect x="1150" y="232" width="10" height="32" rx="3" />
            <rect x="1180" y="232" width="10" height="32" rx="3" />
            <rect x="1210" y="232" width="10" height="32" rx="3" />
            <rect x="1115" y="240" width="110" height="6" rx="2" />
            <rect x="1115" y="252" width="110" height="6" rx="2" />
          </g>

          {/* Cozy Hay Day Yellow Farmhouse Right */}
          <rect x="1250" y="168" width="105" height="86" fill="#FEF08A" stroke="#4E2614" strokeWidth="4" />
          <polygon points="1238,172 1302,122 1368,172" fill="#F97316" stroke="#4E2614" strokeWidth="4" strokeLinejoin="round" />
          <rect x="1272" y="190" width="24" height="24" rx="4" fill="#38BDF8" stroke="#FFFDF7" strokeWidth="3.5" />
          <rect x="1312" y="190" width="24" height="24" rx="4" fill="#38BDF8" stroke="#FFFDF7" strokeWidth="3.5" />

          {/* Plump Cartoon Autumn & Apple Trees */}
          <rect x="1382" y="195" width="16" height="60" rx="4" fill="#78350F" stroke="#4E2614" strokeWidth="3" />
          <circle cx="1390" cy="172" r="36" fill="#FB923C" stroke="#4E2614" strokeWidth="3.5" />
          <circle cx="1372" cy="182" r="24" fill="#FACC15" />
          <circle cx="1406" cy="180" r="22" fill="#EF4444" />

          {/* Foreground Lush Farm Grass & Warm Dirt Path */}
          <path
            d="M0 380 L0 302 Q360 278 720 302 Q1080 278 1440 302 L1440 380 Z"
            fill="#16A34A"
          />
          {/* Warm Hay Day Dirt Road Track at the Bottom */}
          <path
            d="M0 380 L0 332 Q720 316 1440 332 L1440 380 Z"
            fill="#FDE68A"
            stroke="#D97706"
            strokeWidth="4"
          />
          {/* Cute Dashed Stepping Stones along the Farm Track */}
          <path
            d="M0 356 Q720 340 1440 356"
            stroke="#D97706"
            strokeWidth="3"
            strokeDasharray="16 12"
            opacity="0.55"
          />
        </svg>
      </div>

      {/* ===================================================================== */}
      {/* CUTE HAY DAY DEMON SPAWNER — POSITIONED CLEANLY BELOW THE SCORE BAR!  */}
      {/* ===================================================================== */}
      <div
        className="absolute left-1/2 top-[70px] sm:top-[76px] z-30 cursor-pointer select-none pointer-events-auto transition-transform duration-100"
        style={{
          transform: `translateX(-50%) ${
            isVolcanoErupting ? "scale(1.12)" : "scale(1)"
          }`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlayingRef.current && !isGameOverRef.current) {
            triggerVolcanoBurst(44, true);
          }
        }}
        title="แตะปีศาจน้อยเพื่อผ่าสายฟ้าและพ่นของขวัญทะลัก!"
      >
        <CuteHayDayDemon
          isErupting={isVolcanoErupting}
          className="w-36 h-34 sm:w-44 sm:h-40 filter drop-shadow-[0_8px_18px_rgba(78,38,20,0.35)]"
        />

        {/* Cute Hay Day Wooden Ribbon Callout Pill */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-b from-[#FEF08A] to-[#F59E0B] text-[#4E2614] text-[10px] font-black tracking-wide whitespace-nowrap shadow-[0_4px_10px_rgba(78,38,20,0.3)] border-2 border-[#4E2614] pointer-events-none flex items-center gap-1">
          <Zap size={11} className="text-[#EF4444] fill-[#EF4444]" />
          <span>แตะปีศาจน้อยพ่นของขวัญ!</span>
        </div>
      </div>

      {/* 60FPS Hardware-Accelerated Canvas (Lightning Bolts, Sky Flash & HD Gifts) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-20"
      />

      {/* ===================================================================== */}
      {/* OVERFLOWING HAY DAY HARVEST PUMPKIN BUCKET (ตะกร้าฟักทองรับของขวัญ)   */}
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
                <stop offset="0%" stopColor="#FFB74D" />
                <stop offset="28%" stopColor="#FF8F00" />
                <stop offset="72%" stopColor="#EF6C00" />
                <stop offset="100%" stopColor="#BF360C" />
              </linearGradient>

              <linearGradient id="jackRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF176" />
                <stop offset="50%" stopColor="#FFA000" />
                <stop offset="100%" stopColor="#E65100" />
              </linearGradient>

              <radialGradient id="jackInteriorGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5D2E0C" />
                <stop offset="100%" stopColor="#3E1E04" />
              </radialGradient>

              <linearGradient id="jackFaceDepth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF9C4" />
                <stop offset="55%" stopColor="#FFD54F" />
                <stop offset="100%" stopColor="#FF8F00" />
              </linearGradient>
            </defs>

            {/* Warm Ground Shadow under Basket */}
            <ellipse cx="140" cy="204" rx="100" ry="9" fill="rgba(78,38,20,0.32)" />

            {/* Handle */}
            <path
              d="M 224 76 C 265 88, 260 144, 235 158"
              stroke="#4E2614"
              strokeWidth="13"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 224 76 C 263 88, 258 142, 235 156"
              stroke="#FFB300"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Interior Cavity */}
            <ellipse cx="140" cy="74" rx="92" ry="20" fill="url(#jackInteriorGrad)" stroke="#4E2614" strokeWidth="2.5" />

            {/* 🎁 DYNAMIC GIFT & TREAT OVERFLOW TIERS */}
            {/* TIER 1: Ruby & Emerald Gift Boxes (1-5 items) */}
            <g className="candy-tier candy-tier-1">
              <rect x="86" y="50" width="28" height="24" rx="5" fill="#FF5252" stroke="#4E2614" strokeWidth="2.2" transform="rotate(-10 100 62)" />
              <rect x="97" y="50" width="6" height="24" fill="#FFD54F" transform="rotate(-10 100 62)" />
              <rect x="86" y="59" width="28" height="5" fill="#FFD54F" transform="rotate(-10 100 62)" />
              <rect x="166" y="52" width="26" height="22" rx="5" fill="#66BB6A" stroke="#4E2614" strokeWidth="2.2" transform="rotate(12 179 63)" />
              <rect x="176" y="52" width="5" height="22" fill="#FFF176" transform="rotate(12 179 63)" />
              <circle cx="140" cy="68" r="10" fill="#BA68C8" stroke="#4E2614" strokeWidth="2.2" />
            </g>

            {/* TIER 2: Purple Gift Box & Pink Lollipop (6-12 items) */}
            <g className="candy-tier candy-tier-2">
              <rect x="110" y="38" width="30" height="26" rx="5" fill="#AB47BC" stroke="#4E2614" strokeWidth="2.2" transform="rotate(-5 125 51)" />
              <rect x="122" y="38" width="6" height="26" fill="#4FC3F7" transform="rotate(-5 125 51)" />
              <rect x="110" y="48" width="30" height="5" fill="#4FC3F7" transform="rotate(-5 125 51)" />
              <line x1="156" y1="74" x2="162" y2="42" stroke="#FFFFFF" strokeWidth="3.5" />
              <circle cx="162" cy="40" r="13" fill="#F06292" stroke="#4E2614" strokeWidth="2.2" />
              <path d="M 162 31 A 9 9 0 0 1 171 40 A 6 6 0 0 1 162 46" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* TIER 3: Candy Cane & Sky Diamond (13-21 items) */}
            <g className="candy-tier candy-tier-3">
              <path d="M 74 74 L 74 34 C 74 16, 52 16, 52 30" fill="none" stroke="#FF7043" strokeWidth="8.5" strokeLinecap="round" />
              <path d="M 74 74 L 74 34 C 74 16, 52 16, 52 30" fill="none" stroke="#FFFDF7" strokeWidth="8.5" strokeDasharray="5 7" strokeLinecap="round" />
              <polygon points="172,24 190,24 198,35 181,54 164,35" fill="#29B6F6" stroke="#4E2614" strokeWidth="2.2" />
            </g>

            {/* TIER 4: Golden Gift & Candy Cane (22-31 items) */}
            <g className="candy-tier candy-tier-4">
              <rect x="124" y="16" width="32" height="28" rx="5" fill="#FFB300" stroke="#4E2614" strokeWidth="2.5" />
              <rect x="137" y="16" width="6" height="28" fill="#FF5252" />
              <rect x="124" y="27" width="32" height="6" fill="#FF5252" />
              <path d="M 202 72 L 202 32 C 202 16, 222 16, 222 28" fill="none" stroke="#FFFDF7" strokeWidth="8" strokeLinecap="round" />
              <path d="M 202 72 L 202 32 C 202 16, 222 16, 222 28" fill="none" stroke="#AB47BC" strokeWidth="8" strokeDasharray="5 7" strokeLinecap="round" />
            </g>

            {/* TIER 5: Overflowing Grand Harvest Star Mountain (32+ items) */}
            <g className="candy-tier candy-tier-5">
              <polygon points="102,10 107,22 120,22 110,30 114,42 102,34 90,42 94,30 84,22 97,22" fill="#FFEE58" stroke="#4E2614" strokeWidth="2.2" />
              <circle cx="188" cy="48" r="11" fill="#FF5252" stroke="#4E2614" strokeWidth="2.2" />
              <circle cx="72" cy="56" r="10" fill="#29B6F6" stroke="#4E2614" strokeWidth="2.2" />
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
              stroke="#4E2614"
              strokeWidth="4.2"
              strokeLinejoin="round"
            />

            {/* Pumpkin Lobe Creases */}
            <path d="M 88 76 C 58 115, 60 172, 86 198" stroke="#BF360C" strokeWidth="4" fill="none" opacity="0.75" strokeLinecap="round" />
            <path d="M 120 74 C 108 120, 110 176, 122 205" stroke="#BF360C" strokeWidth="4" fill="none" opacity="0.75" strokeLinecap="round" />
            <path d="M 160 74 C 172 120, 170 176, 158 205" stroke="#BF360C" strokeWidth="4" fill="none" opacity="0.75" strokeLinecap="round" />
            <path d="M 192 76 C 222 115, 220 172, 194 198" stroke="#BF360C" strokeWidth="4" fill="none" opacity="0.75" strokeLinecap="round" />

            {/* Top Rim Lip */}
            <path d="M 44 78 C 64 71, 216 71, 236 78 C 216 87, 64 87, 44 78 Z" fill="url(#jackRimGrad)" stroke="#4E2614" strokeWidth="3" />

            {/* Cute Rosy Blushed Cheeks on the Pumpkin Basket */}
            <ellipse cx="62" cy="136" rx="12" ry="7" fill="#FF4081" opacity="0.45" />
            <ellipse cx="218" cy="136" rx="12" ry="7" fill="#FF4081" opacity="0.45" />

            {/* Cheerful Carved Face */}
            <path
              d="M 76 114 C 92 98, 124 104, 126 118 C 110 126, 92 126, 76 114 Z"
              fill="url(#jackFaceDepth)"
              stroke="#4E2614"
              strokeWidth="2.8"
            />
            <path
              d="M 204 114 C 188 98, 156 104, 154 118 C 170 126, 188 126, 204 114 Z"
              fill="url(#jackFaceDepth)"
              stroke="#4E2614"
              strokeWidth="2.8"
            />
            <path
              d="M 140 123 L 151 140 L 129 140 Z"
              fill="url(#jackFaceDepth)"
              stroke="#4E2614"
              strokeWidth="2.5"
            />
            <path
              d="M 66 136 C 88 165, 112 172, 112 172 L 112 155 L 126 155 L 126 173 C 134 175, 146 175, 154 173 L 154 155 L 168 155 L 168 172 C 168 172, 192 165, 214 136 C 188 168, 92 168, 66 136 Z"
              fill="url(#jackFaceDepth)"
              stroke="#4E2614"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
          </svg>

          {/* Hay Day Wooden Gift Counter Badge on Basket Front */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-b from-[#FFFDF7] to-[#FDE68A] border-2 border-[#4E2614] shadow-[0_4px_12px_rgba(78,38,20,0.4)] flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-20">
            <span className="text-[13px]">🎁</span>
            <span
              ref={caughtDomRef}
              className="text-xs font-black font-mono text-[#4E2614] tracking-wide leading-tight"
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
      {/* HAY DAY WOODEN & GOLDEN RIBBON TOP SCORE HUD BAR                      */}
      {/* ===================================================================== */}
      <header
        className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-b from-[#FFFDF7] via-[#FEF3C7] to-[#FDE68A] border-[3px] border-[#78350F] shadow-[0_8px_0_#5C2808,0_12px_24px_rgba(78,38,20,0.35)] text-[#4E2614] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Game Title */}
        <div className="flex items-center gap-2 pr-2.5 border-r-2 border-[#D97706]/35">
          <span className="text-xl filter drop-shadow-xs">👹</span>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[11px] font-black text-[#B45309] font-mono tracking-wider leading-none">
              HAPPY DEMON FARM
            </span>
            <span className="text-[9.5px] font-extrabold text-[#78350F] tracking-tight leading-tight mt-0.5">
              ปีศาจน้อยพ่นของขวัญหรรษา
            </span>
          </div>
        </div>

        {/* Live Score Medallion */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-b from-[#FFE082] via-[#FFB300] to-[#FB8C00] border-2 border-[#78350F] shadow-[0_3px_0_#78350F] text-[#4E2614]">
          <span className="text-sm">🎁</span>
          <span
            ref={scoreDomRef}
            className="text-base sm:text-lg font-black font-mono tracking-tight text-[#4E2614] min-w-[34px] text-center"
          >
            0
          </span>
        </div>

        {/* 10-Second Countdown Timer with Progress Bar */}
        <div className="relative overflow-hidden flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-b from-[#FF7043] via-[#F4511E] to-[#D84315] border-2 border-[#4E2614] shadow-[0_3px_0_#4E2614] text-white">
          <div
            ref={timerBarDomRef}
            className="absolute left-0 bottom-0 h-1 bg-[#FFEE58] transition-all duration-300"
            style={{ width: "100%" }}
          />
          <span className="text-sm">⏰</span>
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
          className="items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-b from-[#66BB6A] to-[#2E7D32] border-2 border-[#4E2614] shadow-[0_3px_0_#4E2614] text-white text-xs font-black animate-bounce font-mono"
        >
          🌟 COMBO
        </div>

        {/* Thunder Gift Burst Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerVolcanoBurst(46, true);
          }}
          disabled={isGameOver}
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] hover:brightness-105 active:translate-y-0.5 border-2 border-[#4E2614] shadow-[0_3px_0_#4E2614] text-white text-xs font-black transition-all cursor-pointer disabled:opacity-40"
          title="ผ่าสายฟ้าและพ่นของขวัญเพิ่ม!"
        >
          <Zap size={13} className="fill-[#FFEE58] text-[#FFEE58]" />
          <span>พ่นของขวัญ!</span>
        </button>

        {/* Top 10 Leaderboard Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowLeaderboard((v) => !v);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:translate-y-0.5 border-2 border-[#4E2614] shadow-[0_3px_0_#4E2614] ${
            showLeaderboard
              ? "bg-gradient-to-b from-[#FFEE58] to-[#FBC02D] text-[#4E2614]"
              : "bg-gradient-to-b from-[#FFFDF7] to-[#FFE082] hover:brightness-105 text-[#78350F]"
          }`}
        >
          <Trophy size={13} className="text-[#D97706]" />
          <span>10 อันดับ</span>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSoundEnabled((v) => !v);
          }}
          className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#FFFDF7] to-[#FFE082] hover:brightness-105 border-2 border-[#4E2614] shadow-[0_3px_0_#4E2614] flex items-center justify-center text-[#78350F] transition-all cursor-pointer"
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
          className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#FF5252] to-[#D32F2F] hover:brightness-105 text-white flex items-center justify-center transition-all cursor-pointer border-2 border-[#4E2614] shadow-[0_3px_0_#4E2614]"
          title="ออกจากมินิเกม (ESC)"
        >
          <X size={16} />
        </button>
      </header>

      {/* TOP 10 LEADERBOARD DRAWER (Hay Day Wooden Board Style) */}
      {showLeaderboard && (
        <aside
          className="absolute right-4 top-20 bottom-24 w-72 sm:w-80 z-40 pointer-events-auto flex flex-col rounded-3xl bg-gradient-to-b from-[#FFFDF7] via-[#FEF3C7] to-[#FDE68A] border-[3px] border-[#78350F] shadow-[0_10px_0_#5C2808,0_16px_36px_rgba(78,38,20,0.4)] overflow-hidden animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3.5 pb-2.5 border-b-2 border-[#D97706]/40 flex items-center justify-between bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                  🌻 ป้ายจัดอันดับฟาร์มหรรษา
                </h3>
                <p className="text-[10px] text-[#FEF3C7]">
                  10 อันดับผู้รับของขวัญสูงสุด
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLeaderboard(false);
              }}
              className="text-white hover:text-[#FEF08A] p-1 cursor-pointer"
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
                  className={`p-2 rounded-2xl flex items-center gap-2 border-2 ${
                    isTop1
                      ? "bg-gradient-to-r from-[#FFEE58] to-[#FFE082] border-[#D97706] shadow-xs"
                      : isTop2
                      ? "bg-white/90 border-[#CBD5E1]"
                      : isTop3
                      ? "bg-white/80 border-[#FCD34D]"
                      : "bg-white/60 border-[#FDE68A]"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-xs shrink-0">
                    {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : (
                      <span className="text-[#78350F] font-bold">{idx + 1}.</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-[#4E2614] truncate">
                        {item.playerName}
                      </span>
                      <span className="text-xs font-black font-mono text-[#D84315] shrink-0">
                        {item.score.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#78350F] mt-0.5 font-mono">
                      <span className="truncate">{item.titleEarned || "ขวัญใจชาวไร่"}</span>
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
      {/* GAME OVER CELEBRATION MODAL (Hay Day Cozy Wooden Board Style)         */}
      {/* ===================================================================== */}
      {isGameOver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative max-w-md w-full pt-20">
            {/* Top Cute Demon Mascot */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(78,38,20,0.45)] animate-bounce"
              style={{ animationDuration: "2.4s" }}
            >
              <CuteHayDayDemon isErupting={true} className="w-34 h-30 sm:w-38 sm:h-34" />
            </div>

            <div
              className="relative w-full rounded-3xl bg-gradient-to-b from-[#FFFDF7] via-[#FEF3C7] to-[#FDE68A] border-[4px] border-[#78350F] pt-14 p-6 sm:p-7 text-center shadow-[0_12px_0_#5C2808,0_25px_50px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto custom-scrollbar text-[#4E2614]"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <span className="text-[11px] font-black text-[#D97706] uppercase tracking-[0.15em] font-mono">
                  🌻 HAPPY HARVEST GIFT FESTIVAL 🌻
                </span>
                <h2 className="text-2xl font-black text-[#4E2614] mt-1">
                  🎉 หมดเวลา 10 วินาทีหรรษา!
                </h2>
                <p className="text-xs font-extrabold text-[#D84315] mt-1">
                  {getPlayerTitle(finalScore)}
                </p>
              </div>

              {/* Score Plaque */}
              <div className="my-4 p-4 rounded-2xl bg-white border-2 border-[#D97706] text-[#4E2614] shadow-inner">
                <span className="text-[10px] font-bold text-[#92400E] uppercase tracking-widest font-mono">
                  คะแนนรวมที่คุณทำได้
                </span>
                <div className="text-4xl font-black font-mono text-[#EA580C] mt-1">
                  🎁 {finalScore.toLocaleString()}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#FDE68A] text-xs font-mono">
                  <div>
                    <span className="text-[#78350F] block text-[10px]">เก็บของขวัญได้</span>
                    <span className="font-black text-[#4E2614] text-sm">🎁 {finalCandies} ชิ้น</span>
                  </div>
                  <div>
                    <span className="text-[#78350F] block text-[10px]">คอมโบสูงสุด</span>
                    <span className="font-black text-[#16A34A] text-sm">🌟 x{finalMaxCombo}</span>
                  </div>
                </div>
              </div>

              {/* Top 10 Leaderboard Preview */}
              <div className="my-3 text-left">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-black text-[#78350F] flex items-center gap-1 font-mono">
                    <Trophy size={13} className="text-[#D97706]" />
                    <span>10 อันดับผู้นำสูงสุด (Top 10):</span>
                  </span>
                  <span className="text-[10px] text-[#92400E] font-mono">อัปเดตสด</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-white/85 p-2 border-2 border-[#F59E0B] custom-scrollbar">
                  {leaderboard.slice(0, 10).map((entry, idx) => (
                    <div key={entry.id || idx} className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-[#FEF3C7]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono font-bold text-[11px] text-[#D97706] w-4">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                        </span>
                        <span className="text-[#4E2614] font-bold truncate max-w-[140px]">
                          {entry.playerName}
                        </span>
                      </div>
                      <span className="font-mono font-black text-[#EA580C] text-xs shrink-0">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {rankAchieved !== null ? (
                <div className="my-3.5 p-4 rounded-2xl bg-gradient-to-r from-[#FFEE58] via-[#FFE082] to-[#FFCA28] border-2 border-[#78350F] text-center shadow-md animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy size={22} className="text-[#D84315] animate-bounce" />
                    <span className="text-lg font-black text-[#4E2614] font-mono tracking-wide">
                      คุณคว้าอันดับที่ #{rankAchieved}!
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#78350F] mt-1">
                    {rankAchieved === 1
                      ? "👑 สุดยอดแชมป์อันดับ 1 ขวัญใจฟาร์มปีศาจน้อย!"
                      : rankAchieved <= 3
                      ? "🥈 ยอดฝีมือระดับท็อป 3 แห่งฟาร์มหรรษา!"
                      : rankAchieved <= 10
                      ? "🌻 ติดทำเนียบ Top 10 ประจำฟาร์ม!"
                      : "👏 ยอดเยี่ยมมาก! ท้าชิงอันดับใหม่ได้เรื่อยๆ"}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#66BB6A] to-[#2E7D32] hover:brightness-105 border-2 border-[#4E2614] shadow-[0_4px_0_#1B5E20] text-white text-xs font-black cursor-pointer transition-all flex items-center gap-1.5"
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
                    <label className="text-xs font-extrabold text-[#78350F] block mb-1">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D97706] focus:border-[#16A34A] focus:outline-none text-[#4E2614] text-sm font-bold placeholder:text-[#92400E]/45 shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingScore || !playerName.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-b from-[#66BB6A] via-[#43A047] to-[#2E7D32] hover:brightness-105 border-2 border-[#4E2614] shadow-[0_5px_0_#1B5E20] text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Send size={16} />
                    <span>
                      {isSubmittingScore ? "กำลังบันทึก..." : hasSubmitted ? "✅ บันทึกแล้ว!" : "🏆 บันทึกคะแนน & ออกจากเกม"}
                    </span>
                  </button>
                </form>
              )}

              {/* Quick Action Footer */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#D97706]/30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#FFEE58] to-[#FBC02D] hover:brightness-105 border-2 border-[#4E2614] shadow-[0_3px_0_#78350F] text-[#4E2614] text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-[#78350F] text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer border-2 border-[#D97706]"
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
