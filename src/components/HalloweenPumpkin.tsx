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

  useEffect(() => {
    const handleOpenGame = () => {
      const rect = pumpkinRef.current?.getBoundingClientRect();
      const originX = rect ? rect.left + rect.width / 2 : window.innerWidth * 0.8;
      const originY = rect ? rect.top + rect.height * 0.4 : window.innerHeight * 0.65;
      setOriginCoord({ x: originX, y: originY });
      setIsArenaOpen(true);
    };
    window.addEventListener("open-halloween-game", handleOpenGame);
    return () => window.removeEventListener("open-halloween-game", handleOpenGame);
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
    <>
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

      {/* Organic Hand-Drawn Comic "Trick or Treat! 🕹️ CLICK TO PLAY!" Speech Bubble */}
      <div 
        onClick={handlePumpkinClick}
        className="absolute -top-7 sm:-top-9 md:-top-11 left-[84%] sm:left-[88%] md:left-[92%] z-30 pointer-events-auto cursor-pointer bubble-side-float w-[88px] sm:w-[102px] md:w-[116px] aspect-[352/278] filter drop-shadow-[0_3px_8px_rgba(0,0,0,0.14)] hover:scale-105 transition-transform"
        title="Click to play!"
      >
        <svg viewBox="0 35 352 278" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="comicBubbleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFFDF7" />
            </linearGradient>
          </defs>
          <path
            d="M 144.0,44.4 C 142.8,44.6 141.3,44.8 140.0,45.0 C 138.7,45.1 137.3,45.0 136.0,45.1 C 134.7,45.2 133.3,45.6 132.0,45.8 C 130.7,46.0 129.3,46.0 128.0,46.2 C 126.7,46.4 125.3,46.7 124.0,46.9 C 122.7,47.2 121.3,47.4 120.0,47.6 C 118.7,47.9 117.3,48.3 116.0,48.6 C 114.7,48.9 113.3,49.1 112.0,49.4 C 110.7,49.7 109.3,50.0 108.0,50.4 C 106.7,50.8 105.3,51.2 104.0,51.6 C 102.7,52.0 101.3,52.3 100.0,52.7 C 98.7,53.1 97.3,53.5 96.0,54.0 C 94.7,54.5 93.3,55.1 92.0,55.6 C 90.7,56.1 89.3,56.7 88.0,57.2 C 86.7,57.7 85.3,58.2 84.0,58.8 C 82.7,59.4 81.3,60.1 80.0,60.8 C 78.7,61.4 77.3,62.1 76.0,62.8 C 74.7,63.4 73.3,64.0 72.0,64.8 C 70.7,65.5 69.3,66.2 68.0,67.0 C 66.7,67.8 65.3,68.8 64.0,69.7 C 62.7,70.6 61.3,71.4 60.0,72.3 C 58.7,73.3 57.3,74.2 56.0,75.2 C 54.7,76.2 53.3,77.3 52.0,78.4 C 50.7,79.5 49.3,80.7 48.0,82.0 C 46.7,83.3 45.3,84.7 44.0,86.0 C 42.7,87.3 41.3,88.7 40.1,90.0 C 38.9,91.3 37.9,92.7 36.8,94.0 C 35.7,95.3 34.7,96.7 33.7,98.0 C 32.7,99.3 31.9,100.7 31.0,102.0 C 30.2,103.3 29.4,104.7 28.6,106.0 C 27.8,107.3 27.0,108.7 26.3,110.0 C 25.6,111.3 25.0,112.7 24.4,114.0 C 23.8,115.3 23.3,116.7 22.8,118.0 C 22.3,119.3 21.8,120.7 21.3,122.0 C 20.9,123.3 20.4,124.7 20.0,126.0 C 19.6,127.3 19.2,128.7 18.9,130.0 C 18.6,131.3 18.3,132.7 18.1,134.0 C 17.8,135.3 17.6,136.7 17.4,138.0 C 17.2,139.3 17.1,140.7 17.0,142.0 C 16.9,143.3 17.0,144.7 17.0,146.0 C 17.0,147.3 17.0,148.7 17.0,150.0 C 17.0,151.3 17.0,152.7 17.0,154.0 C 17.0,155.3 16.9,156.7 17.0,158.0 C 17.1,159.3 17.4,160.7 17.6,162.0 C 17.8,163.3 18.0,164.7 18.2,166.0 C 18.5,167.3 18.8,168.7 19.1,170.0 C 19.5,171.3 19.9,172.7 20.3,174.0 C 20.8,175.3 21.2,176.7 21.7,178.0 C 22.2,179.3 22.7,180.7 23.3,182.0 C 23.9,183.3 24.6,184.7 25.3,186.0 C 25.9,187.3 26.6,188.7 27.3,190.0 C 27.9,191.3 28.6,192.7 29.4,194.0 C 30.2,195.3 31.2,196.7 32.1,198.0 C 33.1,199.3 34.1,200.7 35.0,202.0 C 35.9,203.3 36.8,204.7 37.6,206.0 C 38.4,207.3 39.1,208.7 39.8,210.0 C 40.5,211.3 41.3,212.7 41.9,214.0 C 42.6,215.3 43.2,216.7 43.7,218.0 C 44.3,219.3 44.9,220.7 45.3,222.0 C 45.7,223.3 46.0,224.7 46.4,226.0 C 46.7,227.3 47.1,228.7 47.4,230.0 C 47.6,231.3 47.9,232.7 48.0,234.0 C 48.1,235.3 48.0,236.7 48.0,238.0 C 48.0,239.3 48.0,240.7 48.0,242.0 C 48.0,243.3 48.1,244.7 48.0,246.0 C 47.9,247.3 47.6,248.7 47.4,250.0 C 47.2,251.3 46.9,252.7 46.6,254.0 C 46.2,255.3 45.8,256.7 45.3,258.0 C 44.9,259.3 44.3,260.7 43.8,262.0 C 43.3,263.3 42.8,264.7 42.1,266.0 C 41.4,267.3 40.6,268.7 39.8,270.0 C 39.0,271.3 38.2,272.7 37.3,274.0 C 36.4,275.3 35.4,276.7 34.4,278.0 C 33.3,279.3 32.1,280.7 31.0,282.0 C 29.8,283.3 28.6,284.7 27.4,285.9 C 26.2,287.1 25.2,288.1 24.0,289.2 C 22.7,290.4 21.3,291.7 20.0,292.9 C 18.7,294.0 17.3,295.1 16.0,296.1 C 14.7,297.1 13.3,298.1 12.0,299.0 C 10.7,299.9 9.0,300.8 8.1,301.6 C 7.1,302.3 6.0,303.0 6.2,303.5 C 6.3,304.0 7.9,304.1 9.0,304.4 C 10.2,304.6 11.7,304.9 13.0,305.0 C 14.3,305.1 15.7,305.0 17.0,305.0 C 18.3,305.0 19.7,305.0 21.0,305.0 C 22.3,305.0 23.7,305.0 25.0,305.0 C 26.3,305.0 27.7,305.1 29.0,305.0 C 30.3,304.9 31.7,304.8 33.0,304.6 C 34.3,304.4 35.7,304.1 37.0,303.8 C 38.3,303.5 39.7,303.2 41.0,302.9 C 42.3,302.5 43.7,302.1 45.0,301.7 C 46.3,301.2 47.7,300.7 49.0,300.2 C 50.3,299.6 51.7,298.9 53.0,298.2 C 54.3,297.6 55.7,297.0 57.0,296.2 C 58.3,295.5 59.7,294.8 61.0,294.0 C 62.3,293.2 63.7,292.2 65.0,291.3 C 66.3,290.4 67.7,289.6 69.0,288.6 C 70.3,287.6 71.7,286.5 73.0,285.4 C 74.3,284.3 75.7,283.1 77.0,282.0 C 78.3,280.9 79.7,279.8 81.0,278.6 C 82.3,277.4 83.7,276.3 85.0,275.0 C 86.3,273.7 87.7,272.3 89.0,271.0 C 90.3,269.7 91.7,268.3 93.0,267.0 C 94.3,265.7 95.7,264.3 97.0,263.0 C 98.3,261.7 99.7,260.3 101.0,259.0 C 102.3,257.7 103.7,256.3 105.0,255.0 C 106.3,253.7 107.7,252.3 109.0,251.0 C 110.3,249.8 111.7,248.7 113.0,247.7 C 114.3,246.8 115.7,246.0 117.0,245.3 C 118.3,244.6 119.7,243.9 121.0,243.5 C 122.3,243.1 123.7,243.1 125.0,243.0 C 126.3,242.9 127.7,243.0 129.0,243.0 C 130.3,243.0 131.7,243.0 133.0,243.0 C 134.3,243.0 135.7,243.0 137.0,243.0 C 138.3,243.0 139.7,243.0 141.0,243.0 C 142.3,243.0 143.7,243.1 145.0,243.2 C 146.3,243.4 147.7,243.8 149.0,243.9 C 150.3,244.0 151.7,243.9 153.0,244.0 C 154.3,244.1 155.7,244.1 157.0,244.2 C 158.3,244.4 159.7,244.8 161.0,244.9 C 162.3,245.0 163.7,244.9 165.0,245.0 C 166.3,245.1 167.7,245.1 169.0,245.2 C 170.3,245.4 171.7,245.8 173.0,245.9 C 174.3,246.0 175.7,245.9 177.0,246.0 C 178.3,246.1 179.7,246.1 181.0,246.2 C 182.3,246.4 183.7,246.8 185.0,246.9 C 186.3,247.0 187.7,247.0 189.0,247.0 C 190.3,247.0 191.7,246.9 193.0,247.0 C 194.3,247.1 195.7,247.4 197.0,247.6 C 198.3,247.8 199.7,247.9 201.0,248.0 C 202.3,248.1 203.7,248.0 205.0,248.0 C 206.3,248.0 207.7,248.0 209.0,248.0 C 210.3,248.0 211.7,248.0 213.0,248.0 C 214.3,248.0 215.7,248.0 217.0,248.0 C 218.3,248.0 219.7,248.0 221.0,248.0 C 222.3,248.0 223.7,248.0 225.0,248.0 C 226.3,248.0 227.7,248.0 229.0,248.0 C 230.3,248.0 231.7,248.0 233.0,248.0 C 234.3,248.0 235.7,248.0 237.0,248.0 C 238.3,248.0 239.7,248.0 241.0,248.0 C 242.3,248.0 243.7,248.0 245.0,248.0 C 246.3,248.0 247.7,248.0 249.0,247.9 C 250.3,247.8 251.7,247.4 253.0,247.2 C 254.3,247.1 255.7,247.1 257.0,247.0 C 258.3,246.9 259.7,246.8 261.0,246.6 C 262.3,246.4 263.7,246.2 265.0,246.0 C 266.3,245.8 267.7,245.6 269.0,245.4 C 270.3,245.2 271.7,245.0 273.0,244.8 C 274.3,244.5 275.7,244.2 277.0,243.9 C 278.3,243.6 279.7,243.3 281.0,243.0 C 282.3,242.7 283.7,242.4 285.0,242.0 C 286.3,241.6 287.7,241.3 289.0,240.9 C 290.3,240.5 291.7,240.1 293.0,239.6 C 294.3,239.1 295.7,238.5 297.0,238.0 C 298.3,237.5 299.7,236.9 301.0,236.4 C 302.3,235.8 303.7,235.4 305.0,234.7 C 306.3,234.1 307.7,233.4 309.0,232.6 C 310.3,231.8 311.7,231.0 313.0,230.2 C 314.3,229.4 315.7,228.5 317.0,227.6 C 318.3,226.7 319.7,225.7 321.0,224.6 C 322.3,223.5 323.7,222.3 325.0,221.0 C 326.3,219.7 327.7,218.3 328.9,217.0 C 330.1,215.7 331.1,214.3 332.1,213.0 C 333.1,211.7 334.1,210.3 335.0,209.0 C 335.8,207.7 336.5,206.3 337.2,205.0 C 338.0,203.7 338.6,202.3 339.2,201.0 C 339.9,199.7 340.4,198.3 341.0,197.0 C 341.5,195.7 342.1,194.3 342.5,193.0 C 343.0,191.7 343.3,190.3 343.6,189.0 C 344.0,187.7 344.3,186.3 344.6,185.0 C 344.9,183.7 345.2,182.3 345.4,181.0 C 345.6,179.7 345.8,178.3 346.0,177.0 C 346.1,175.7 346.2,174.3 346.4,173.0 C 346.6,171.7 346.9,170.3 347.0,169.0 C 347.1,167.7 347.0,166.3 347.0,165.0 C 347.0,163.7 347.1,162.3 347.0,161.0 C 346.9,159.7 346.8,158.3 346.6,157.0 C 346.4,155.7 346.2,154.3 346.0,153.0 C 345.9,151.7 345.8,150.3 345.6,149.0 C 345.4,147.7 345.1,146.3 344.8,145.0 C 344.5,143.7 344.2,142.3 343.9,141.0 C 343.5,139.7 343.1,138.3 342.7,137.0 C 342.2,135.7 341.8,134.3 341.3,133.0 C 340.8,131.7 340.3,130.3 339.7,129.0 C 339.2,127.7 338.6,126.3 338.0,125.0 C 337.4,123.7 336.9,122.3 336.2,121.0 C 335.5,119.7 334.6,118.3 333.8,117.0 C 333.0,115.7 332.2,114.3 331.3,113.0 C 330.5,111.7 329.6,110.3 328.7,109.0 C 327.7,107.7 326.8,106.3 325.8,105.0 C 324.7,103.7 323.5,102.3 322.4,101.0 C 321.3,99.7 320.2,98.3 319.0,97.0 C 317.7,95.7 316.3,94.3 315.0,93.0 C 313.7,91.7 312.3,90.6 311.0,89.4 C 309.7,88.2 308.3,87.2 307.0,86.1 C 305.7,85.0 304.3,83.9 303.0,82.9 C 301.7,81.9 300.3,80.9 299.0,80.0 C 297.7,79.1 296.3,78.2 295.0,77.3 C 293.7,76.5 292.3,75.6 291.0,74.8 C 289.7,74.0 288.3,73.2 287.0,72.4 C 285.7,71.6 284.3,70.9 283.0,70.3 C 281.7,69.6 280.3,68.9 279.0,68.2 C 277.7,67.6 276.3,66.9 275.0,66.3 C 273.7,65.6 272.3,65.0 271.0,64.4 C 269.7,63.8 268.3,63.3 267.0,62.8 C 265.7,62.3 264.3,61.7 263.0,61.2 C 261.7,60.7 260.3,60.2 259.0,59.7 C 257.7,59.2 256.3,58.8 255.0,58.3 C 253.7,57.9 252.3,57.4 251.0,57.0 C 249.7,56.6 248.3,56.1 247.0,55.7 C 245.7,55.2 244.3,54.8 243.0,54.4 C 241.7,54.0 240.3,53.7 239.0,53.4 C 237.7,53.0 236.3,52.7 235.0,52.4 C 233.7,52.0 232.3,51.7 231.0,51.4 C 229.7,51.1 228.3,50.9 227.0,50.6 C 225.7,50.3 224.3,49.9 223.0,49.6 C 221.7,49.4 220.3,49.2 219.0,48.9 C 217.7,48.7 216.3,48.4 215.0,48.2 C 213.7,48.0 212.3,47.8 211.0,47.6 C 209.7,47.4 208.3,47.2 207.0,47.0 C 205.7,46.8 204.3,46.6 203.0,46.4 C 201.7,46.2 200.3,46.1 199.0,46.0 C 197.7,45.9 196.3,45.8 195.0,45.6 C 193.7,45.4 192.3,45.1 191.0,45.0 C 189.7,44.9 188.3,45.1 187.0,45.0 C 185.7,44.9 184.3,44.8 183.0,44.6 C 181.7,44.4 180.3,44.1 179.0,44.0 C 177.7,43.9 176.3,44.0 175.0,44.0 C 173.7,44.0 172.3,44.0 171.0,44.0 C 169.7,44.0 168.3,44.0 167.0,44.0 C 165.7,44.0 164.3,44.0 163.0,44.0 C 161.7,44.0 160.3,44.0 159.0,44.0 C 157.7,44.0 156.3,44.0 155.0,44.0 C 153.7,44.0 152.3,44.0 151.0,44.0 C 149.7,44.0 148.2,44.0 147.0,44.0 C 145.8,44.1 145.2,44.2 144.0,44.4 Z"
            fill="url(#comicBubbleGrad)"
            stroke="#000000"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* Text inside the comic balloon body */}
        <div className="absolute top-[8%] left-[6%] right-[5%] h-[64%] flex flex-col items-center justify-center text-center select-none pointer-events-none px-1">
          <span className="text-[8.5px] sm:text-[9.5px] md:text-[11px] font-black text-slate-950 leading-tight tracking-tight whitespace-nowrap">
            Trick or Treat! 🎃
          </span>
          <span className="text-[6px] sm:text-[7px] md:text-[8px] font-black text-amber-700 uppercase tracking-wider font-mono mt-0.5 whitespace-nowrap">
            🕹️ CLICK TO PLAY!
          </span>
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
    </div>

    {/* IN-SITU FULL-WORKSPACE HALLOWEEN MINIGAME ARENA & LEADERBOARD (Rendered outside pumpkin div so portal clicks never bubble to handlePumpkinClick) */}
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
  </>
);
}
