"use client";

import React, { useState, useEffect, useRef } from "react";

interface AnimatedMascotLogoProps {
  className?: string;
  sizeClassName?: string;
  interactive?: boolean;
}

export type MascotMood = "normal" | "blink" | "wink" | "wow" | "happy";

export default function AnimatedMascotLogo({
  className = "",
  sizeClassName = "w-8 h-8 sm:w-[38px] sm:h-[38px] md:w-[44px] md:h-[44px]",
  interactive = true,
}: AnimatedMascotLogoProps) {
  // Current expression / mood:
  // - 'normal': signature round eyes, gentle curved smile
  // - 'blink': smooth natural eye blink
  // - 'wink': playful wink (ขยิบตาพร้อมเอียงหัว)
  // - 'wow': "ทำปากกลม ว้าว ตาโต" (excited wide eyes & round 'O' mouth)
  // - 'happy': cheerful grinning eyes (^ _ ^) with wide happy smile
  const [mood, setMood] = useState<MascotMood>("normal");

  // Dynamic look direction: distinct offsets inside viewBox (การมองสำรวจรอบทิศทาง)
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState<number>(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Distinct exploration sequence (ตาและปากเคลื่อนย้ายตำแหน่งชัดเจน เหมือนการมองสำรวจรอบทิศทาง)
  const explorationPositions = [
    { x: -13.0, y: -2.0, tilt: -5.0, desc: "look-left" },         // เหลียวมองซ้ายสุดอย่างชัดเจน
    { x: 0.0,   y: -11.0, tilt: 0.0,  desc: "look-up" },           // ชะเง้อมองขึ้นบนสำรวจ
    { x: 11.5,  y: -1.0,  tilt: 4.5,  desc: "look-right-text" },   // หันมองขวามาที่ตัวอักษร CC TEAM
    { x: 8.5,   y: 9.0,   tilt: 3.0,  desc: "look-down-right" },   // ก้มมองขวาล่าง
    { x: 0.0,   y: 0.0,   tilt: 0.0,  desc: "center" },            // กลับมาตรงกลาง
    { x: -10.5, y: 8.0,   tilt: -3.5, desc: "look-down-left" },    // ชำเลืองมองซ้ายล่าง
    { x: 9.0,   y: -7.0,  tilt: 3.5,  desc: "look-up-right" },     // มองบนขวา
    { x: 0.0,   y: 0.0,   tilt: 0.0,  desc: "center" },            // ตรงกลาง
  ];

  // Autonomous Lively Exploration Routine (Always active, never frozen)
  useEffect(() => {
    let loopTimeout: NodeJS.Timeout;
    let cancel = false;
    let stepIdx = 0;

    const runNextAction = () => {
      // Very active interval: 1.3s to 2.2s between expressive exploration steps
      const delay = 1300 + Math.random() * 900;

      loopTimeout = setTimeout(() => {
        if (cancel) return;
        if (isHovered) {
          runNextAction();
          return;
        }

        const rand = Math.random();

        // 1. Wow Action (20%): "ทำปากกลม ว้าว ตาโต"
        if (rand < 0.20) {
          setMood("wow");
          setLookOffset({ x: 2.0, y: -7.0 });
          setHeadTilt(2.0);
          setIsBouncing(true);

          setTimeout(() => {
            if (cancel) return;
            setIsBouncing(false);
            setMood("normal");
            runNextAction();
          }, 1100);
        }
        // 2. Happy Glee (20%): (^ _ ^) Cheerful Smile with head tilt
        else if (rand < 0.40) {
          setMood("happy");
          setLookOffset({ x: 5.0, y: -2.0 });
          setHeadTilt(4.0);
          setIsBouncing(true);

          setTimeout(() => {
            if (cancel) return;
            setIsBouncing(false);
            setMood("normal");
            runNextAction();
          }, 1000);
        }
        // 3. Playful Wink (18%): ขยิบตาพร้อมเอียงหัว
        else if (rand < 0.58) {
          setMood("wink");
          setLookOffset({ x: 8.0, y: -1.0 });
          setHeadTilt(5.0);

          setTimeout(() => {
            if (cancel) return;
            setMood("normal");
            runNextAction();
          }, 600);
        }
        // 4. Active Exploration around 8-directions with clear position shifts (42%)
        else {
          stepIdx = (stepIdx + 1) % explorationPositions.length;
          const pos = explorationPositions[stepIdx];
          
          // Clear position shift of eyes and mouth
          setLookOffset({ x: pos.x, y: pos.y });
          setHeadTilt(pos.tilt);
          setMood("blink");

          setTimeout(() => {
            if (cancel) return;
            setMood("normal");

            // 35% chance of quick double-blink
            if (Math.random() < 0.35) {
              setTimeout(() => {
                if (cancel) return;
                setMood("blink");
                setTimeout(() => {
                  if (cancel) return;
                  setMood("normal");
                  runNextAction();
                }, 110);
              }, 90);
            } else {
              runNextAction();
            }
          }, 130);
        }
      }, delay);
    };

    runNextAction();

    return () => {
      cancel = true;
      clearTimeout(loopTimeout);
    };
  }, [isHovered]);

  // Hover Interaction
  const handleMouseEnter = () => {
    setIsHovered(true);
    setLookOffset({ x: 5.0, y: -4.0 });
    setHeadTilt(4.0);
    setMood("happy");

    setTimeout(() => {
      setMood("wink");
      setTimeout(() => {
        setMood("wow");
        setTimeout(() => {
          setMood("normal");
        }, 500);
      }, 450);
    }, 600);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMood("normal");
    setLookOffset({ x: 0, y: 0 });
    setHeadTilt(0);
  };

  // Click Interaction
  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsBouncing(true);
    setMood("happy");
    setLookOffset({ x: 0, y: -6.0 });
    setHeadTilt(-5.0);

    setTimeout(() => {
      setMood("wink");
      setHeadTilt(5.0);
      setTimeout(() => {
        setMood("normal");
        setHeadTilt(0);
        setLookOffset({ x: 0, y: 0 });
        setIsBouncing(false);
      }, 400);
    }, 450);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none cursor-pointer group ${sizeClassName} ${className}`}
      title="ทักทายน้อง CC! (คลิกหรือเลื่อนเมาส์เพื่อเล่นกับน้อง)"
      aria-label="CC TEAM Mascot"
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full block overflow-visible transition-transform duration-300 ease-out ${
          isBouncing ? "scale-115 -rotate-3" : "group-hover:scale-108"
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. Yellow Head Circle: Flat, crisp, perfectly aligned (#FFD303) */}
        <circle
          cx="50"
          cy="50"
          r="49.5"
          fill="#FFD303"
        />

        {/* 2. Entire Face Group: Rotates and translates visibly to look around in all 8 directions */}
        <g
          style={{
            transform: `translate(${lookOffset.x}px, ${lookOffset.y}px) rotate(${headTilt}deg)`,
            transformOrigin: "50px 50px",
            transition: "transform 0.38s cubic-bezier(0.34, 1.45, 0.64, 1)",
          }}
        >
          {/* ================= EYES ================= */}

          {/* 2A. LEFT EYE */}
          {mood === "happy" ? (
            // Cheerful smiling curved eye arc (^ _ ^)
            <path
              d="M 46.5 34.0 Q 51.5 26.5 56.5 34.0"
              fill="none"
              stroke="#000000"
              strokeWidth="4.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            // Normal, Blink slit, or Wow wide round eye
            <ellipse
              cx="51.5"
              cy="31.5"
              rx={mood === "wow" ? 6.5 : 4.8}
              ry={mood === "blink" ? 0.4 : mood === "wow" ? 6.5 : 4.8}
              fill="#000000"
              style={{
                transformOrigin: "51.5px 31.5px",
                transition: "rx 0.18s ease-out, ry 0.12s ease-out",
              }}
            />
          )}

          {/* 2B. RIGHT EYE */}
          {mood === "happy" || mood === "wink" ? (
            // Curved winking / happy eye arc
            <path
              d="M 76.5 34.0 Q 81.5 26.5 86.5 34.0"
              fill="none"
              stroke="#000000"
              strokeWidth="4.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            // Normal, Blink slit, or Wow wide round eye
            <ellipse
              cx="81.5"
              cy="31.5"
              rx={mood === "wow" ? 6.5 : 4.8}
              ry={mood === "blink" ? 0.4 : mood === "wow" ? 6.5 : 4.8}
              fill="#000000"
              style={{
                transformOrigin: "81.5px 31.5px",
                transition: "rx 0.18s ease-out, ry 0.12s ease-out",
              }}
            />
          )}

          {/* ================= MOUTHS ================= */}

          {/* 3A. Normal Smile Line (round stroke caps, crisp vector) */}
          <path
            d="M 43.0 48.5 Q 65.0 61.0 87.0 48.5"
            fill="none"
            stroke="#000000"
            strokeWidth="4.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transformOrigin: "65px 52px",
              transform: mood === "wow" || mood === "happy" ? "scale(0.1)" : "scale(1)",
              opacity: mood === "wow" || mood === "happy" ? 0 : 1,
              transition: "all 0.18s cubic-bezier(0.34, 1.35, 0.64, 1)",
            }}
          />

          {/* 3B. Wow round 'O' mouth ("ทำปากกลม ว้าว") */}
          <ellipse
            cx="65.0"
            cy="53.5"
            rx="5.2"
            ry="7.0"
            fill="none"
            stroke="#000000"
            strokeWidth="4.6"
            strokeLinecap="round"
            style={{
              transformOrigin: "65px 53.5px",
              transform: mood === "wow" ? "scale(1)" : "scale(0.1)",
              opacity: mood === "wow" ? 1 : 0,
              transition: "all 0.18s cubic-bezier(0.34, 1.35, 0.64, 1)",
            }}
          />

          {/* 3C. Wide Happy Smile (^ _ ^) */}
          <path
            d="M 42.0 47.0 Q 65.0 63.5 88.0 47.0"
            fill="none"
            stroke="#000000"
            strokeWidth="5.0"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transformOrigin: "65px 54px",
              transform: mood === "happy" ? "scale(1)" : "scale(0.1)",
              opacity: mood === "happy" ? 1 : 0,
              transition: "all 0.18s cubic-bezier(0.34, 1.35, 0.64, 1)",
            }}
          />
        </g>
      </svg>
    </div>
  );
}
