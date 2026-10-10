"use client";

import React, { useId } from "react";
import {
  Avatar3DConfig,
  Avatar2DHairStyle,
  Avatar2DEyes,
  Avatar2DNose,
  Avatar2DMouth,
  Avatar2DFacialHair,
  Avatar2DGlasses,
  Avatar2DClothing,
  Avatar2DAccessories,
} from "@/types/avatar3d";

// Fallback normalizer for older 3D config values
export function normalizeConfig(config?: Partial<Avatar3DConfig>): Avatar3DConfig {
  const hairMap: Record<string, Avatar2DHairStyle> = {
    crop: "crewBuzz",
    sidePart: "sidePartNeat",
    blondePart: "sidePartPrep",
    topknot: "topBun",
    bob: "bobBangs",
    longWavy: "bangsShoulder",
    dreadlocks: "highPonytail",
    dreadlocksLong: "highPonytail",
    wolfCut: "sideBraid",
    highPonytail: "highPonytail",
    sideBraid: "sideBraid",
    buzz: "crewBuzz",
    seniorSide: "sidePartNeat",
    seniorBun: "topBun",
    bald: "bald",
    hijab: "hijabWrap",
  };

  const eyesMap: Record<string, Avatar2DEyes> = {
    sparkle: "sparkleEye",
    happyArc: "smilingArc",
    gentle: "dashes",
    wink: "winking",
  };

  const noseMap: Record<string, Avatar2DNose> = {
    button: "buttonRound",
    petite: "curve",
    rounded: "hook",
    wide: "wideTriangle",
  };

  const mouthMap: Record<string, Avatar2DMouth> = {
    bigSmile: "wideSmile",
    gentleSmile: "gentleCurve",
    content: "straight",
  };

  const beardMap: Record<string, Avatar2DFacialHair> = {
    mustache: "neatMustache",
  };

  const rawHair = config?.hairStyle || (config?.headwear === "hijab" ? "hijabWrap" : "bangsShoulder");
  const rawEyes = config?.eyes || "dots";
  const rawNose = config?.nose || "hook";
  const rawMouth = config?.mouth || "gentleCurve";
  const rawBeard = config?.facialHair || "none";
  const rawGlasses = config?.glasses || "none";
  const rawClothing = config?.clothing || "classicTee";
  const rawAcc = config?.accessories || (config?.headwear === "headband" ? "headband" : "none");

  return {
    bgColor: config?.bgColor || "#F37135",
    skinTone: config?.skinTone || "#FFF8F2",
    hairStyle: hairMap[rawHair] || (rawHair as Avatar2DHairStyle) || "bangsShoulder",
    hairColor: config?.hairColor || "#1E1E1E",
    eyes: eyesMap[rawEyes] || (rawEyes as Avatar2DEyes) || "dots",
    nose: noseMap[rawNose] || (rawNose as Avatar2DNose) || "hook",
    mouth: mouthMap[rawMouth] || (rawMouth as Avatar2DMouth) || "gentleCurve",
    facialHair: beardMap[rawBeard] || (rawBeard as Avatar2DFacialHair) || "none",
    facialHairColor: config?.facialHairColor || config?.hairColor || "#1E1E1E",
    glasses: (rawGlasses as Avatar2DGlasses) || "none",
    glassesColor: config?.glassesColor || "#1E1E1E",
    headwear: config?.headwear,
    clothing: (rawClothing as Avatar2DClothing) || "classicTee",
    clothingColor: config?.clothingColor || "#E65100",
    secondaryClothingColor: config?.secondaryClothingColor,
    accessories: (rawAcc as Avatar2DAccessories) || "none",
    blush: config?.blush !== undefined ? config.blush : true,
  };
}

export interface Avatar2DRendererProps {
  config: Avatar3DConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
  showBorder?: boolean;
  animate?: boolean;
  cheeky?: boolean; // Playful cheeky animation mode (gimmick)
}

export const Avatar2DRenderer: React.FC<Avatar2DRendererProps> = ({
  config: rawConfig,
  size = 40,
  className = "",
  onClick,
  showBorder = false,
  animate = true, // Enabled by default for natural life
  cheeky = false, // Cheeky wobble / wink for preview gimmick
}) => {
  const uniqueId = useId().replace(/:/g, "_");
  const config = normalizeConfig(rawConfig);

  const {
    bgColor,
    skinTone,
    hairStyle,
    hairColor,
    eyes,
    nose,
    mouth,
    facialHair,
    facialHairColor,
    glasses,
    glassesColor = "#1E1E1E",
    clothing,
    clothingColor,
    accessories,
    blush,
  } = config;

  const strokeColor = "#1A1A1A";
  const strokeWidth = 2.4;

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : ""
      } ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className={`w-full h-full overflow-hidden rounded-full ${
          showBorder ? "ring-2 ring-white/90 shadow-sm" : ""
        }`}
      >
        <defs>
          <clipPath id={`circle_clip_${uniqueId}`}>
            <circle cx="100" cy="100" r="100" />
          </clipPath>
          <clipPath id={`shirt_clip_${uniqueId}`}>
            <path d="M 18,205 C 22,158 68,148 86,146 L 114,146 C 132,148 178,158 182,205 Z" />
          </clipPath>

          {/* Micro-Animation Styles: Blinking, subtle gaze shift, gentle smiling, and playful cheeky animations */}
          <style>{`
            @keyframes blink_${uniqueId} {
              0%, 94%, 98%, 100% { transform: scaleY(1); }
              96% { transform: scaleY(0.08); }
            }
            @keyframes glance_${uniqueId} {
              0%, 35% { transform: translateX(0); }
              40%, 65% { transform: translateX(-1.6px); }
              70%, 90% { transform: translateX(1.6px); }
              95%, 100% { transform: translateX(0); }
            }
            @keyframes smile_${uniqueId} {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05) translateY(-0.5px); }
            }
            @keyframes cheeky_wiggle_${uniqueId} {
              0% { transform: rotate(0deg) scale(1); }
              15% { transform: rotate(-7deg) scale(1.04); }
              35% { transform: rotate(8deg) scale(1.06); }
              55% { transform: rotate(-5deg) scale(1.03); }
              75% { transform: rotate(4deg) scale(1.04); }
              100% { transform: rotate(0deg) scale(1); }
            }
            @keyframes cheeky_wink_${uniqueId} {
              0%, 15%, 85%, 100% { transform: scaleY(1); }
              30%, 68% { transform: scaleY(0.08); }
            }
            @keyframes cheeky_mouth_${uniqueId} {
              0%, 100% { transform: scale(1); }
              35%, 75% { transform: scale(1.18) translateY(-1px) rotate(-3deg); }
            }

            .anim-eyes-${uniqueId} {
              transform-origin: 100px 78px;
              animation: ${animate ? `blink_${uniqueId} 4.2s infinite ease-in-out` : "none"};
            }
            .anim-pupils-${uniqueId} {
              animation: ${animate ? `glance_${uniqueId} 7s infinite ease-in-out` : "none"};
            }
            .anim-mouth-${uniqueId} {
              transform-origin: 100px 108px;
              animation: ${cheeky ? `cheeky_mouth_${uniqueId} 2.6s infinite ease-in-out` : (animate ? `smile_${uniqueId} 5s infinite ease-in-out` : "none")};
            }
            .anim-cheeky-head-${uniqueId} {
              transform-origin: 100px 100px;
              animation: ${cheeky ? `cheeky_wiggle_${uniqueId} 2.6s infinite ease-in-out` : "none"};
            }
            .anim-cheeky-wink-${uniqueId} {
              transform-origin: 115px 78px;
              animation: ${cheeky ? `cheeky_wink_${uniqueId} 2.6s infinite ease-in-out` : "none"};
            }
          `}</style>
        </defs>

        {/* Clipped Avatar Content */}
        <g clipPath={`url(#circle_clip_${uniqueId})`}>
          {/* Flat Vibrant Background */}
          <circle cx="100" cy="100" r="100" fill={bgColor} />

          {/* Group with optional cheeky wiggle animation */}
          <g className={cheeky ? `anim-cheeky-head-${uniqueId}` : ""}>

          {/* 
            PROPORTIONS:
            - Head Center: cy=78 (elevated to reveal abundant clothing & shoulders below)
            - Chin: y=124
            - Neck: y=118 to 148
            - Shoulders & Chest: y=148 to 200 (52px of prominent clothing, collar, details)
          */}

          {/* 1. BACK HAIR (Under head/neck for long styles) */}
          {hairStyle === "bangsShoulder" && (
            <path
              d="M 58,90 C 50,115 54,145 52,165 C 68,165 74,135 78,125 L 122,125 C 126,135 132,165 148,165 C 146,145 150,115 142,90 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "longStraight" && (
            <path
              d="M 56,85 C 48,115 48,150 46,175 C 64,175 70,145 76,125 L 124,125 C 130,145 136,175 154,175 C 152,150 152,115 144,85 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "highPonytail" && (
            <g fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round">
              <path d="M 116,36 C 136,16 160,26 168,58 C 172,92 160,130 144,152 C 138,136 145,102 142,76 C 138,54 126,44 116,36 Z" />
              <ellipse cx="118" cy="35" rx="5.5" ry="3.5" transform="rotate(-25 118 35)" fill="#F37135" stroke={strokeColor} strokeWidth={strokeWidth} />
            </g>
          )}

          {hairStyle === "sideBraid" && (
            <g fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round">
              <path d="M 126,92 C 138,102 148,116 146,132 C 134,128 128,114 124,104 Z" />
              <path d="M 128,112 C 142,122 148,138 144,152 C 132,148 128,132 126,120 Z" />
              <path d="M 130,136 C 142,144 144,158 140,172 C 130,168 128,152 128,142 Z" />
              <rect x="131" y="170" width="7" height="4" rx="1.5" fill="#F37135" />
              <path d="M 133,174 C 135,182 134,186 136,188 C 132,186 131,182 131,174 Z" />
            </g>
          )}

          {hairStyle === "curlyLobGlasses" && (
            <path
              d="M 52,90 C 44,110 48,135 54,148 C 65,148 72,135 76,125 L 124,125 C 128,135 135,148 146,148 C 152,135 156,110 148,90 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "topBun" && (
            <g>
              <ellipse cx="100" cy="18" rx="19" ry="18" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidth} />
              <path d="M 91,16 Q 100,10 109,16 M 93,22 Q 100,26 107,22" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            </g>
          )}

          {hairStyle === "twinBuns" && (
            <g fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidth}>
              <circle cx="68" cy="24" r="17" />
              <circle cx="132" cy="24" r="17" />
            </g>
          )}

          {hairStyle === "sidePonytail" && (
            <path
              d="M 132,54 C 158,46 172,66 166,102 C 156,108 146,84 136,72 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}

          {hairStyle === "afroPuff" && (
            <circle cx="100" cy="38" r="42" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidth} />
          )}

          {/* 2. NECK (Seamlessly extends down behind clothing without any bottom stroke!) */}
          <path
            d="M 86,118 L 86,180 L 114,180 L 114,118 Z"
            fill={skinTone}
          />
          {/* Neck side borders only (stops at neckline: y=134 for turtlenecks, y=146 for all others) */}
          {clothing === "turtleneck" || clothing === "stripedTurtle" ? (
            <>
              <line x1="86" y1="118" x2="86" y2="134" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
              <line x1="114" y1="118" x2="114" y2="134" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            </>
          ) : (
            <>
              <line x1="86" y1="118" x2="86" y2="146" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
              <line x1="114" y1="118" x2="114" y2="146" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            </>
          )}
          {/* Chin shadow */}
          <path
            d="M 86,118 Q 100,128 114,118 L 114,125 Q 100,135 86,125 Z"
            fill="rgba(0,0,0,0.06)"
          />

          {/* 3. CLOTHING (Shoulders, Torso & Collars - Smooth, realistic, and continuous!) */}
          <g>
            {/* Base Body/Shirt Silhouette */}
            <path
              d={(() => {
                if (clothing === "scoopNeck") {
                  return "M 18,205 C 22,158 68,148 86,146 C 86,170 114,170 114,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "vNeck") {
                  return "M 18,205 C 22,158 68,148 86,146 L 100,168 L 114,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "turtleneck" || clothing === "stripedTurtle") {
                  return "M 18,205 C 22,158 68,148 84,146 L 116,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "hoodie" || clothing === "dinoHoodie") {
                  return "M 18,205 C 22,158 68,148 82,146 Q 100,164 118,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "poloCollar" || clothing === "buttonUpShirt" || clothing === "denimJacket") {
                  return "M 18,205 C 22,158 68,148 86,146 L 100,160 L 114,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "suitAndTie") {
                  return "M 18,205 C 22,158 68,148 86,146 L 100,188 L 114,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "blazerTop") {
                  return "M 18,205 C 22,158 68,148 86,146 L 100,186 L 114,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "sweaterVest") {
                  return "M 18,205 C 22,158 68,148 86,146 L 100,174 L 114,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "labCoat") {
                  return "M 18,205 C 22,158 68,148 86,146 L 100,170 L 114,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "hawaiianShirt") {
                  return "M 18,205 C 22,158 68,148 86,146 L 100,164 L 114,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "wizardRobe") {
                  return "M 18,205 C 22,158 68,148 84,146 L 100,172 L 116,146 C 132,148 178,158 182,205 Z";
                }
                if (clothing === "yukataKimono") {
                  return "M 18,205 C 22,158 68,148 82,146 L 100,170 L 118,146 C 132,148 178,158 182,205 Z";
                }
                // Default crew curve (classicTee, stripedCrew, buttonHenley, overallsCute, superheroCape, etc.)
                return "M 18,205 C 22,158 68,148 86,146 Q 100,154 114,146 C 132,148 178,158 182,205 Z";
              })()}
              fill={clothing === "labCoat" ? "#FFFFFF" : clothingColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />

            {/* Crew Neck Collar Trim (for classicTee, stripedCrew, buttonHenley) */}
            {(clothing === "classicTee" || clothing === "stripedCrew" || clothing === "buttonHenley") && (
              <path d="M 86,146 Q 100,154 114,146" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            )}

            {/* V-Neck Collar Trim */}
            {clothing === "vNeck" && (
              <path d="M 86,146 L 100,168 L 114,146" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Scoop Neck Trim */}
            {clothing === "scoopNeck" && (
              <path d="M 86,146 C 86,170 114,170 114,146" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            )}

            {/* Specific Clothing Necklines & Styles */}
            {clothing === "stripedCrew" && (
              <g clipPath={`url(#shirt_clip_${uniqueId})`}>
                <path d="M 0,166 Q 100,164 200,166" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
                <path d="M 0,179 Q 100,177 200,179" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
                <path d="M 0,192 Q 100,190 200,192" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
              </g>
            )}

            {clothing === "stripedTurtle" && (
              <g>
                <rect x="83" y="132" width="34" height="17" rx="5" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                <line x1="90" y1="132" x2="90" y2="149" stroke={strokeColor} strokeWidth="1.8" />
                <line x1="97" y1="132" x2="97" y2="149" stroke={strokeColor} strokeWidth="1.8" />
                <line x1="103" y1="132" x2="103" y2="149" stroke={strokeColor} strokeWidth="1.8" />
                <line x1="110" y1="132" x2="110" y2="149" stroke={strokeColor} strokeWidth="1.8" />
                <g clipPath={`url(#shirt_clip_${uniqueId})`}>
                  <line x1="56" y1="158" x2="56" y2="205" stroke={strokeColor} strokeWidth="2" />
                  <line x1="76" y1="151" x2="76" y2="205" stroke={strokeColor} strokeWidth="2" />
                  <line x1="96" y1="149" x2="96" y2="205" stroke={strokeColor} strokeWidth="2" />
                  <line x1="104" y1="149" x2="104" y2="205" stroke={strokeColor} strokeWidth="2" />
                  <line x1="124" y1="151" x2="124" y2="205" stroke={strokeColor} strokeWidth="2" />
                  <line x1="144" y1="158" x2="144" y2="205" stroke={strokeColor} strokeWidth="2" />
                </g>
              </g>
            )}

            {clothing === "turtleneck" && (
              <g>
                <rect x="83" y="132" width="34" height="17" rx="5" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                <line x1="84" y1="140" x2="116" y2="140" stroke={strokeColor} strokeWidth="1.4" opacity="0.4" />
              </g>
            )}

            {clothing === "blazerTop" && (
              <g>
                <path d="M 86,146 Q 100,158 114,146 L 116,205 L 84,205 Z" fill="#FFFFFF" stroke="none" />
                <path d="M 86,146 Q 100,158 114,146" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 86,146 L 80,172 L 96,182 L 80,205" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <path d="M 114,146 L 120,172 L 104,182 L 120,205" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
              </g>
            )}

            {clothing === "suitAndTie" && (
              <g>
                {/* White Dress Shirt filling chest seamlessly */}
                <path d="M 86,146 L 100,154 L 114,146 L 116,205 L 84,205 Z" fill="#FFFFFF" stroke="none" />
                
                {/* Collar Wings framing neck seamlessly */}
                <path d="M 86,146 L 98,156 L 91,156 L 82,148 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M 114,146 L 102,156 L 109,156 L 118,148 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.6" strokeLinejoin="round" />
                
                {/* Red Necktie: knot and blade */}
                <polygon points="96,154 104,154 102,163 98,163" fill="#D32F2F" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" />
                <polygon points="98,163 102,163 105,196 100,205 95,196" fill="#D32F2F" stroke={strokeColor} strokeWidth="1.6" strokeLinejoin="round" />
                
                {/* Suit Lapels starting right at neck corners */}
                <path d="M 86,146 L 78,172 L 96,184 L 78,205" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <path d="M 114,146 L 122,172 L 104,184 L 122,205" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
              </g>
            )}

            {clothing === "poloCollar" && (
              <g>
                {/* Folded Collar Wings matching clothingColor */}
                <path d="M 86,146 L 100,160 L 80,162 L 74,148 Z" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <path d="M 114,146 L 100,160 L 120,162 L 126,148 Z" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                {/* Button Placket */}
                <line x1="100" y1="160" x2="100" y2="190" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                <circle cx="100" cy="169" r="1.8" fill={strokeColor} />
                <circle cx="100" cy="181" r="1.8" fill={strokeColor} />
              </g>
            )}

            {clothing === "buttonUpShirt" && (
              <g>
                <path d="M 86,146 L 100,162 L 78,163 L 74,148 Z" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <path d="M 114,146 L 100,162 L 122,163 L 126,148 Z" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <line x1="100" y1="162" x2="100" y2="205" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                <circle cx="100" cy="172" r="1.6" fill={strokeColor} />
                <circle cx="100" cy="186" r="1.6" fill={strokeColor} />
                <circle cx="100" cy="198" r="1.6" fill={strokeColor} />
              </g>
            )}

            {clothing === "denimJacket" && (
              <g>
                <path d="M 86,146 L 100,160 L 80,162 L 74,148 Z" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <path d="M 114,146 L 100,160 L 120,162 L 126,148 Z" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <line x1="100" y1="160" x2="100" y2="205" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                <rect x="52" y="168" width="20" height="15" rx="2" fill="none" stroke={strokeColor} strokeWidth="1.6" />
                <rect x="128" y="168" width="20" height="15" rx="2" fill="none" stroke={strokeColor} strokeWidth="1.6" />
              </g>
            )}

            {clothing === "hawaiianShirt" && (
              <g>
                <path d="M 86,146 L 76,156 L 86,162 L 100,166" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <path d="M 114,146 L 124,156 L 114,162 L 100,166" fill={clothingColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                <line x1="100" y1="166" x2="100" y2="205" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                <circle cx="62" cy="172" r="3.5" fill="#FFF" opacity="0.65" />
                <circle cx="138" cy="172" r="3.5" fill="#FFF" opacity="0.65" />
                <circle cx="82" cy="190" r="3.5" fill="#FFF" opacity="0.65" />
                <circle cx="118" cy="190" r="3.5" fill="#FFF" opacity="0.65" />
              </g>
            )}

            {clothing === "sweaterVest" && (
              <g>
                {/* White Inner Shirt */}
                <path d="M 86,146 L 100,174 L 114,146 L 116,205 L 84,205 Z" fill="#FFFFFF" stroke="none" />
                {/* Shirt Collar Wings */}
                <path d="M 86,146 L 98,158 L 90,158 L 80,148 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M 114,146 L 102,158 L 110,158 L 120,148 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.8" strokeLinejoin="round" />
                {/* Sweater Vest V-neck Rim */}
                <path d="M 86,146 L 100,174 L 114,146" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}

            {clothing === "labCoat" && (
              <g>
                {/* Inner Crew-neck Shirt */}
                <path d="M 86,146 Q 100,156 114,146 L 114,175 L 86,175 Z" fill="#1E293B" stroke="none" />
                <path d="M 86,146 Q 100,156 114,146" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
                {/* Lab Coat Lapels */}
                <path d="M 86,146 L 82,170 L 98,178 L 98,205" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
                <path d="M 114,146 L 118,170 L 102,178 L 102,205" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
                {/* Stethoscope gracefully wrapping around neck */}
                <path d="M 84,144 C 84,170 94,176 100,176 C 106,176 116,170 116,144" fill="none" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="100" y1="176" x2="100" y2="186" stroke="#334155" strokeWidth="2.4" />
                <circle cx="100" cy="188" r="3.6" fill="#94A3B8" stroke="#334155" strokeWidth="1.6" />
              </g>
            )}

            {clothing === "buttonHenley" && (
              <g>
                <rect x="97" y="152" width="6" height="22" rx="1" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
                <circle cx="100" cy="158" r="1.2" fill={strokeColor} />
                <circle cx="100" cy="168" r="1.2" fill={strokeColor} />
              </g>
            )}

            {clothing === "hoodie" && (
              <g>
                <path d="M 82,146 Q 100,164 118,146" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                <line x1="94" y1="158" x2="94" y2="180" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
                <line x1="106" y1="158" x2="106" y2="180" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="94" cy="180" r="1.2" fill={strokeColor} />
                <circle cx="106" cy="180" r="1.2" fill={strokeColor} />
              </g>
            )}

            {clothing === "superheroCape" && (
              <g>
                <path d="M 36,160 L 12,205 L 188,205 L 164,160 Z" fill="#E53935" stroke={strokeColor} strokeWidth={strokeWidth} />
                <polygon points="100,162 114,176 100,190 86,176" fill="#FFD54F" stroke={strokeColor} strokeWidth="1.8" />
                <path d="M 95,176 L 100,168 L 105,176 L 100,184 Z" fill="#E53935" />
                <circle cx="82" cy="154" r="3.2" fill="#FFD54F" stroke={strokeColor} strokeWidth="1.4" />
                <circle cx="118" cy="154" r="3.2" fill="#FFD54F" stroke={strokeColor} strokeWidth="1.4" />
              </g>
            )}

            {clothing === "wizardRobe" && (
              <g>
                <path d="M 84,146 L 100,172 L 116,146" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 100,174 L 100,205" stroke="#FFD54F" strokeWidth="2.5" />
                <circle cx="68" cy="180" r="2.5" fill="#FFD54F" />
                <circle cx="132" cy="180" r="2.5" fill="#FFD54F" />
                <circle cx="82" cy="194" r="2" fill="#FFD54F" />
                <circle cx="118" cy="194" r="2" fill="#FFD54F" />
              </g>
            )}

            {clothing === "yukataKimono" && (
              <g>
                <path d="M 82,146 L 120,186" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                <path d="M 118,146 L 96,170" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                <rect x="52" y="186" width="96" height="19" fill="#FF7043" stroke={strokeColor} strokeWidth="1.8" />
                <line x1="52" y1="195" x2="148" y2="195" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.8" />
              </g>
            )}

            {clothing === "dinoHoodie" && (
              <g>
                <path d="M 82,146 Q 100,164 118,146" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                <polygon points="56,152 46,142 64,148" fill="#4CAF50" stroke={strokeColor} strokeWidth="1.6" />
                <polygon points="74,148 68,136 82,145" fill="#4CAF50" stroke={strokeColor} strokeWidth="1.6" />
                <polygon points="126,148 132,136 118,145" fill="#4CAF50" stroke={strokeColor} strokeWidth="1.6" />
                <polygon points="144,152 154,142 136,148" fill="#4CAF50" stroke={strokeColor} strokeWidth="1.6" />
                <path d="M 84,170 Q 100,162 116,170 L 118,205 L 82,205 Z" fill="#FFF9C4" stroke={strokeColor} strokeWidth="1.6" />
              </g>
            )}

            {clothing === "overallsCute" && (
              <g>
                <path d="M 86,146 Q 100,154 114,146" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
                <path d="M 72,168 L 128,168 L 132,205 L 68,205 Z" fill="#1976D2" stroke={strokeColor} strokeWidth="1.8" />
                <rect x="70" y="146" width="12" height="24" rx="2" fill="#1976D2" stroke={strokeColor} strokeWidth="1.8" />
                <rect x="118" y="146" width="12" height="24" rx="2" fill="#1976D2" stroke={strokeColor} strokeWidth="1.8" />
                <circle cx="76" cy="168" r="2.2" fill="#FFD54F" stroke={strokeColor} strokeWidth="1.2" />
                <circle cx="124" cy="168" r="2.2" fill="#FFD54F" stroke={strokeColor} strokeWidth="1.2" />
                <rect x="88" y="178" width="24" height="18" rx="3" fill="none" stroke={strokeColor} strokeWidth="1.5" />
              </g>
            )}
          </g>

          {/* 4. EARS */}
          {hairStyle !== "hijabWrap" && (
            <g>
              <path d="M 70,76 C 60,76 60,98 70,98" fill={skinTone} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
              <path d="M 68,83 C 64,85 64,89 68,91" fill="none" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
              <path d="M 130,76 C 140,76 140,98 130,98" fill={skinTone} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
              <path d="M 132,83 C 136,85 136,89 132,91" fill="none" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />

              {(accessories === "earrings" || hairStyle === "pixieEarrings") && (
                <g>
                  <circle cx="62" cy="100" r="4.5" fill="#FFD13B" stroke={strokeColor} strokeWidth="1.8" />
                  <circle cx="138" cy="100" r="4.5" fill="#FFD13B" stroke={strokeColor} strokeWidth="1.8" />
                </g>
              )}
            </g>
          )}

          {/* 5. HEAD / FACE BASE (cy=78, chin=124) */}
          <path
            d="M 69,76 C 69,42 131,42 131,76 C 131,108 119,126 100,126 C 81,126 69,108 69,76 Z"
            fill={skinTone}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* HIJAB (Full wrap covering head and neck) */}
          {hairStyle === "hijabWrap" && (
            <g>
              <path
                d="M 50,80 C 48,32 152,32 150,80 C 150,115 160,175 145,188 C 130,175 70,175 55,188 C 40,175 50,115 50,80 Z"
                fill={hairColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <ellipse cx="100" cy="78" rx="24" ry="32" fill={skinTone} stroke={strokeColor} strokeWidth={strokeWidth} />
            </g>
          )}

          {/* CHEEK BLUSH */}
          {blush && (
            <g>
              <ellipse cx="78" cy="98" rx="6" ry="3.5" fill="#FF6B6B" opacity="0.34" />
              <ellipse cx="122" cy="98" rx="6" ry="3.5" fill="#FF6B6B" opacity="0.34" />
            </g>
          )}

          {/* EYEBROWS */}
          <g>
            <path d="M 78,68 Q 85,65 92,68" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M 108,68 Q 115,65 122,68" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </g>

          {/* 6. EYES (With natural blink & gaze shift animations!) */}
          <g className={`anim-eyes-${uniqueId}`}>
            <g className={`anim-pupils-${uniqueId}`}>
              {eyes === "dots" && (
                <>
                  <circle cx="85" cy="78" r="2.8" fill={strokeColor} />
                  <circle cx="115" cy="78" r="2.8" fill={strokeColor} />
                </>
              )}

              {eyes === "smilingArc" && (
                <>
                  <path d="M 80,78 Q 85,73 90,78" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <path d="M 110,78 Q 115,73 120,78" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </>
              )}

              {eyes === "dashes" && (
                <>
                  <line x1="81" y1="78" x2="89" y2="78" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
                  <line x1="111" y1="78" x2="119" y2="78" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
                </>
              )}

              {eyes === "roundOpen" && (
                <>
                  <ellipse cx="85" cy="78" rx="4.5" ry="5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.8" />
                  <circle cx="85" cy="78" r="2.5" fill={strokeColor} />
                  <ellipse cx="115" cy="78" rx="4.5" ry="5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.8" />
                  <circle cx="115" cy="78" r="2.5" fill={strokeColor} />
                </>
              )}

              {eyes === "sparkleEye" && (
                <>
                  <circle cx="85" cy="78" r="3.4" fill={strokeColor} />
                  <circle cx="84" cy="77" r="1.1" fill="#FFFFFF" />
                  <circle cx="115" cy="78" r="3.4" fill={strokeColor} />
                  <circle cx="114" cy="77" r="1.1" fill="#FFFFFF" />
                </>
              )}

              {eyes === "sleepyChill" && (
                <>
                  <path d="M 80,77 Q 85,81 90,77" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <path d="M 110,77 Q 115,81 120,77" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </>
              )}

              {eyes === "fierceCat" && (
                <>
                  <path d="M 80,79 Q 86,76 92,77 L 94,75" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <circle cx="86" cy="78" r="2.2" fill={strokeColor} />
                  <path d="M 120,79 Q 114,76 108,77 L 106,75" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <circle cx="114" cy="78" r="2.2" fill={strokeColor} />
                </>
              )}

              {eyes === "winking" && (
                <>
                  <circle cx="85" cy="78" r="2.8" fill={strokeColor} />
                  <path d="M 110,78 Q 115,73 120,78" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </>
              )}

              {eyes === "heartEyes" && (
                <g fill="#FF4081" stroke={strokeColor} strokeWidth="1.4">
                  <path d="M 85,74 C 81,70 77,74 77,78 C 77,83 85,88 85,88 C 85,88 93,83 93,78 C 93,74 89,70 85,74 Z" />
                  <path d="M 115,74 C 111,70 107,74 107,78 C 107,83 115,88 115,88 C 115,88 123,83 123,78 C 123,74 119,70 115,74 Z" />
                </g>
              )}

              {eyes === "starEyes" && (
                <g fill="#FFD700" stroke={strokeColor} strokeWidth="1.4">
                  <path d="M 85,71 Q 85,78 92,78 Q 85,78 85,85 Q 85,78 78,78 Q 85,78 85,71 Z" />
                  <circle cx="85" cy="78" r="1.5" fill="#FFFFFF" stroke="none" />
                  <path d="M 115,71 Q 115,78 122,78 Q 115,78 115,85 Q 115,78 108,78 Q 115,78 115,71 Z" />
                  <circle cx="115" cy="78" r="1.5" fill="#FFFFFF" stroke="none" />
                </g>
              )}

              {eyes === "dizzySpiral" && (
                <g fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round">
                  <path d="M 85,78 A 2,2 0 0,1 87,80 A 4,4 0 0,1 83,82 A 6,6 0 0,1 81,75 A 8,8 0 0,1 90,75" />
                  <path d="M 115,78 A 2,2 0 0,1 117,80 A 4,4 0 0,1 113,82 A 6,6 0 0,1 111,75 A 8,8 0 0,1 120,75" />
                </g>
              )}
            </g>
          </g>

          {/* 7. NOSE */}
          <g>
            {nose === "hook" && (
              <path d="M 98,74 L 98,90 Q 98,93 104,92" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            )}
            {nose === "curve" && (
              <path d="M 99,75 Q 104,84 98,90" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            )}
            {nose === "straight" && (
              <path d="M 99,74 L 99,90 L 103,90" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}
            {nose === "buttonRound" && (
              <path d="M 96,87 Q 100,91 104,87" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            )}
            {nose === "wideTriangle" && (
              <path d="M 96,90 Q 100,88 104,90" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
            )}
            {nose === "dot" && (
              <circle cx="100" cy="90" r="1.8" fill={strokeColor} />
            )}
          </g>

          {/* 8. MOUTH (With gentle smile breathing animation!) */}
          {/* 8. FACIAL HAIR (BEARD & JAW) - Placed under mouth so beard never overlaps the mouth */}
          {facialHair === "fullBeard" && (
            <path
              d="M 68,90 C 65,114 70,148 100,148 C 130,148 135,114 132,90 C 126,108 116,121 100,121 C 84,121 74,108 68,90 Z"
              fill={facialHairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {facialHair === "chinStrap" && (
            <path
              d="M 69,94 C 72,118 82,126 100,126 C 118,126 128,118 131,94 L 127,94 C 124,114 115,122 100,122 C 85,122 76,114 73,94 Z"
              fill={facialHairColor}
            />
          )}

          {facialHair === "vanDyke" && (
            <g fill={facialHairColor} stroke={strokeColor} strokeWidth="1.5">
              <path d="M 91,99 Q 100,97 109,99 Q 100,102 91,99 Z" />
              <path d="M 95,118 L 105,118 L 100,128 Z" />
            </g>
          )}

          {facialHair === "goatee" && (
            <path d="M 94,118 C 94,128 106,128 106,118 Z" fill={facialHairColor} stroke={strokeColor} strokeWidth="1.8" />
          )}

          {facialHair === "stubble" && (
            <g opacity="0.6">
              <circle cx="85" cy="116" r="0.9" fill={strokeColor} />
              <circle cx="90" cy="120" r="0.9" fill={strokeColor} />
              <circle cx="95" cy="123" r="0.9" fill={strokeColor} />
              <circle cx="100" cy="125" r="0.9" fill={strokeColor} />
              <circle cx="105" cy="123" r="0.9" fill={strokeColor} />
              <circle cx="110" cy="120" r="0.9" fill={strokeColor} />
              <circle cx="115" cy="116" r="0.9" fill={strokeColor} />
            </g>
          )}

          {/* 9. MOUTH - Layered on top so mouth is always 100% visible and unclipped */}
          <g className={`anim-mouth-${uniqueId}`}>
            {mouth === "gentleCurve" && (
              <path d="M 93,106 Q 100,112 107,106" stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" fill="none" />
            )}

            {mouth === "wideSmile" && (
              <path d="M 91,104 Q 100,115 109,104 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
            )}

            {mouth === "smirk" && (
              <path d="M 94,107 Q 101,109 108,104" stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" fill="none" />
            )}

            {mouth === "laughing" && (
              <path d="M 90,103 Q 100,116 110,103 Z" fill="#D32F2F" stroke={strokeColor} strokeWidth="2.2" />
            )}

            {mouth === "surprisedO" && (
              <ellipse cx="100" cy="107" rx="4.5" ry="6" fill="#D32F2F" stroke={strokeColor} strokeWidth="2" />
            )}

            {mouth === "tongueOut" && (
              <g>
                <path d="M 92,105 Q 100,111 108,105" stroke={strokeColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M 98,107 C 98,115 104,115 104,107 Z" fill="#FF5252" stroke={strokeColor} strokeWidth="1.5" />
              </g>
            )}

            {mouth === "openGrin" && (
              <g>
                <path d="M 91,103 Q 100,116 109,103 Q 100,107 91,103 Z" fill="#D84315" stroke={strokeColor} strokeWidth="2.2" />
                <path d="M 93,105 Q 100,107 107,105" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            )}

            {mouth === "straight" && (
              <line x1="93" y1="107" x2="107" y2="107" stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" />
            )}

            {mouth === "catMouth" && (
              <path
                d="M 93,106 Q 96,111 100,107 Q 104,111 107,106"
                stroke={strokeColor}
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {mouth === "bubbleGum" && (
              <g>
                <path d="M 93,106 Q 100,111 107,106" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="106" cy="104" r="11" fill="#FF80AB" stroke={strokeColor} strokeWidth="2" />
                <path d="M 102,97 Q 108,96 112,100" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            )}

            {mouth === "vampireFangs" && (
              <g>
                <path d="M 91,104 Q 100,115 109,104 Z" fill="#D32F2F" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
                <polygon points="94,104 96,110 98,104" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1" />
                <polygon points="102,104 104,110 106,104" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1" />
              </g>
            )}
          </g>

          {/* MUSTACHES (Sits above the mouth) */}
          {facialHair === "neatMustache" && (
            <path
              d="M 91,100 Q 96,97 100,99 Q 104,97 109,100 Q 104,102 100,101 Q 96,102 91,100 Z"
              fill={facialHairColor}
              stroke={strokeColor}
              strokeWidth="1.8"
            />
          )}

          {facialHair === "handlebar" && (
            <path
              d="M 87,98 Q 94,101 100,99 Q 106,101 113,98 Q 115,95 113,93 Q 107,96 100,97 Q 93,96 87,93 Z"
              fill={facialHairColor}
              stroke={strokeColor}
              strokeWidth="1.8"
            />
          )}

          {/* MASK ACCESSORY */}
          {accessories === "faceMask" && (
            <path
              d="M 74,90 C 72,112 84,122 100,122 C 116,122 128,112 126,90 C 116,86 84,86 74,90 Z"
              fill="#FFFFFF"
              stroke={strokeColor}
              strokeWidth="2"
            />
          )}

          {/* 10. GLASSES */}
          {glasses === "round" && (
            <g>
              <circle cx="84" cy="77" r="14" fill="none" stroke={glassesColor} strokeWidth="2.5" />
              <circle cx="116" cy="77" r="14" fill="none" stroke={glassesColor} strokeWidth="2.5" />
              <path d="M 98,75 Q 100,73 102,75" fill="none" stroke={glassesColor} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="70" y1="77" x2="63" y2="78" stroke={glassesColor} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="130" y1="77" x2="137" y2="78" stroke={glassesColor} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {glasses === "square" && (
            <g>
              <rect x="71" y="67" width="24" height="20" rx="4" fill="none" stroke={glassesColor} strokeWidth="2.5" />
              <rect x="105" y="67" width="24" height="20" rx="4" fill="none" stroke={glassesColor} strokeWidth="2.5" />
              <line x1="95" y1="75" x2="105" y2="75" stroke={glassesColor} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="71" y1="74" x2="64" y2="76" stroke={glassesColor} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="129" y1="74" x2="136" y2="76" stroke={glassesColor} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {glasses === "aviator" && (
            <g fill="none" stroke={glassesColor} strokeWidth="2.2">
              <path d="M 72,69 L 96,69 C 96,85 88,89 72,85 Z" />
              <path d="M 128,69 L 104,69 C 104,85 112,89 128,85 Z" />
              <line x1="74" y1="66" x2="126" y2="66" strokeWidth="2" />
              <line x1="96" y1="71" x2="104" y2="71" strokeWidth="2" />
            </g>
          )}

          {glasses === "catEye" && (
            <g fill="none" stroke={glassesColor} strokeWidth="2.4">
              <path d="M 68,67 Q 84,69 96,75 Q 88,87 74,81 Z" />
              <path d="M 132,67 Q 116,69 104,75 Q 112,87 126,81 Z" />
              <line x1="96" y1="74" x2="104" y2="74" />
            </g>
          )}

          {glasses === "halfRim" && (
            <g stroke={glassesColor} strokeWidth="2.6" fill="none">
              <path d="M 72,69 L 96,69" strokeLinecap="round" />
              <path d="M 104,69 L 128,69" strokeLinecap="round" />
              <rect x="73" y="69" width="22" height="16" rx="2" strokeWidth="1.2" stroke="#9E9E9E" />
              <rect x="105" y="69" width="22" height="16" rx="2" strokeWidth="1.2" stroke="#9E9E9E" />
              <line x1="96" y1="72" x2="104" y2="72" strokeWidth="2" />
            </g>
          )}

          {glasses === "sunglasses" && (
            <g>
              <path d="M 68,69 C 75,68 96,68 96,79 C 96,87 88,89 72,87 Z" fill="#212121" stroke={strokeColor} strokeWidth="2.2" />
              <path d="M 132,69 C 125,68 104,68 104,79 C 104,87 112,89 128,87 Z" fill="#212121" stroke={strokeColor} strokeWidth="2.2" />
              <line x1="96" y1="72" x2="104" y2="72" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {glasses === "pixelThug" && (
            <g fill="#1A1A1A" stroke="#1A1A1A">
              <rect x="68" y="70" width="28" height="13" />
              <rect x="64" y="67" width="6" height="5" />
              <rect x="71" y="72" width="3" height="3" fill="#FFFFFF" stroke="none" />
              <rect x="74" y="75" width="3" height="3" fill="#FFFFFF" stroke="none" />
              <rect x="96" y="72" width="8" height="4" />
              <rect x="104" y="70" width="28" height="13" />
              <rect x="130" y="67" width="6" height="5" />
              <rect x="107" y="72" width="3" height="3" fill="#FFFFFF" stroke="none" />
              <rect x="110" y="75" width="3" height="3" fill="#FFFFFF" stroke="none" />
            </g>
          )}

          {glasses === "heartPink" && (
            <g fill="rgba(255, 64, 129, 0.45)" stroke="#FF4081" strokeWidth="2.4" strokeLinejoin="round">
              <path d="M 84,70 C 80,64 71,67 71,74 C 71,83 84,90 84,90 C 84,90 97,83 97,74 C 97,67 88,64 84,70 Z" />
              <path d="M 116,70 C 112,64 103,67 103,74 C 103,83 116,90 116,90 C 116,90 129,83 129,74 C 129,67 120,64 116,70 Z" />
              <path d="M 97,73 Q 100,70 103,73" fill="none" stroke="#FF4081" strokeWidth="2.2" />
              <line x1="71" y1="73" x2="64" y2="75" stroke="#FF4081" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="129" y1="73" x2="136" y2="75" stroke="#FF4081" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {glasses === "starGoggles" && (
            <g fill="rgba(255, 215, 0, 0.5)" stroke="#FFA000" strokeWidth="2.2" strokeLinejoin="round">
              <polygon points="84,65 87,73 95,74 89,80 91,88 84,83 77,88 79,80 73,74 81,73" />
              <polygon points="116,65 119,73 127,74 121,80 123,88 116,83 109,88 111,80 105,74 113,73" />
              <line x1="95" y1="75" x2="105" y2="75" stroke="#FFA000" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="74" y1="75" x2="64" y2="77" stroke="#FFA000" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="126" y1="75" x2="136" y2="77" stroke="#FFA000" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {glasses === "cyberVisor" && (
            <g>
              <polygon
                points="65,71 135,71 130,87 70,87"
                fill="rgba(0, 229, 255, 0.75)"
                stroke="#00E5FF"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <line x1="68" y1="78" x2="132" y2="78" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.9" />
              <circle cx="73" cy="78" r="1.5" fill="#FFFFFF" />
              <circle cx="127" cy="78" r="1.5" fill="#FFFFFF" />
            </g>
          )}

          {glasses === "swirlHypno" && (
            <g>
              <circle cx="84" cy="77" r="14" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.6" />
              <circle cx="116" cy="77" r="14" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.6" />
              <path d="M 98,75 Q 100,73 102,75" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="70" y1="77" x2="63" y2="78" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="130" y1="77" x2="137" y2="78" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
              <path
                d="M 84,77 A 2,2 0 0,1 86,79 A 4,4 0 0,1 81,81 A 7,7 0 0,1 78,73 A 10,10 0 0,1 92,72"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M 116,77 A 2,2 0 0,1 118,79 A 4,4 0 0,1 113,81 A 7,7 0 0,1 110,73 A 10,10 0 0,1 124,72"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {glasses === "monocle" && (
            <g>
              <circle cx="116" cy="77" r="14" fill="rgba(255, 224, 130, 0.25)" stroke="#FFA000" strokeWidth="2.6" />
              <circle cx="116" cy="77" r="11" fill="none" stroke="#FFD54F" strokeWidth="1" opacity="0.6" />
              <path d="M 128,84 Q 134,102 124,124" fill="none" stroke="#FFA000" strokeWidth="1.8" strokeDasharray="3,2" />
            </g>
          )}

          {/* 11. FRONT HAIR - COMPLETE FOR ALL 25 STYLES! */}
          {hairStyle === "bald" && null}

          {hairStyle === "bangsShoulder" && (
            <path
              d="M 66,78 C 64,44 76,30 100,30 C 124,30 136,44 134,78 C 132,65 124,61 116,67 C 108,57 98,55 90,65 C 84,59 72,63 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "curlyMop" && (
            <path
              d="M 66,78 C 58,72 60,60 66,54 C 62,46 70,36 80,34 C 86,26 96,24 102,28 C 110,24 120,28 124,34 C 134,36 140,46 136,56 C 142,64 140,74 134,79 C 130,64 120,54 100,54 C 80,54 70,64 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "curlyLobGlasses" && (
            <path
              d="M 64,84 C 56,68 62,46 80,36 C 92,30 112,30 124,38 C 138,46 144,66 136,84 C 128,68 118,58 100,56 C 82,58 72,68 64,84 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "spikyMessy" && (
            <path
              d="M 68,74 C 64,58 72,40 82,34 L 92,22 L 96,32 L 108,20 L 112,32 L 126,26 L 128,38 C 136,48 136,64 132,76 C 126,60 116,54 100,56 C 84,54 74,60 68,74 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "topBun" && (
            <path
              d="M 66,78 C 60,69 64,57 72,49 C 70,41 78,33 88,31 C 94,27 106,27 112,31 C 122,33 130,41 128,49 C 136,57 138,69 134,78 C 128,65 118,57 100,57 C 82,57 72,65 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "twinBuns" && (
            <path
              d="M 66,78 C 64,48 76,34 100,34 C 124,34 136,48 134,78 C 128,62 118,56 100,58 C 82,56 72,62 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "sidePonytail" && (
            <path
              d="M 66,78 C 64,48 76,34 100,34 C 124,34 136,48 134,78 C 128,60 114,54 96,56 C 80,58 72,66 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "afroPuff" && (
            <path
              d="M 68,76 C 68,54 82,44 100,44 C 118,44 132,54 132,76 C 128,62 118,56 100,56 C 82,56 72,62 68,76 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}

          {hairStyle === "undercutPompadour" && (
            <path
              d="M 68,72 C 66,52 74,26 98,20 C 124,14 136,40 132,72 C 126,56 114,50 98,52 C 82,54 74,60 68,72 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}

          {hairStyle === "koreanCurtain" && (
            <path
              d="M 66,78 C 64,50 78,34 100,34 C 122,34 136,50 134,78 C 128,62 118,58 108,68 C 102,60 92,58 84,70 C 76,60 68,66 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}

          {hairStyle === "highPonytail" && (
            <path
              d="M 66,78 C 64,48 76,32 100,32 C 124,32 136,46 134,78 C 128,54 116,48 100,48 C 84,48 74,54 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}

          {hairStyle === "sideBraid" && (
            <path
              d="M 66,78 C 64,48 76,34 100,34 C 124,34 136,48 134,78 C 128,56 114,48 94,52 C 80,55 72,64 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}

          {hairStyle === "sidePartNeat" && (
            <path
              d="M 68,76 C 66,50 80,34 102,32 C 124,32 134,44 132,76 C 126,56 110,50 94,52 C 82,54 74,62 68,76 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "bobBangs" && (
            <path
              d="M 65,92 C 62,64 66,34 100,34 C 134,34 138,64 135,92 C 132,76 130,60 124,62 L 76,62 C 70,60 68,76 65,92 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "headbandCurly" && (
            <g>
              <path
                d="M 64,78 C 56,64 60,44 76,34 C 88,26 112,26 124,34 C 140,44 144,64 136,78 C 130,66 120,56 100,56 C 80,56 70,66 64,78 Z"
                fill={hairColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
              />
              <path d="M 66,70 C 76,60 124,60 134,70 L 133,76 C 123,66 77,66 67,76 Z" fill="#FFD13B" stroke={strokeColor} strokeWidth="1.8" />
            </g>
          )}

          {hairStyle === "sidePartPrep" && (
            <path
              d="M 68,74 C 66,48 80,32 104,30 C 126,30 134,42 132,74 C 128,54 114,48 96,50 C 80,52 72,60 68,74 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "middlePartSleek" && (
            <path
              d="M 66,82 C 64,48 78,34 100,34 C 122,34 136,48 134,82 C 130,66 122,58 100,66 C 78,58 70,66 66,82 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "longStraight" && (
            <path
              d="M 66,78 C 64,46 76,32 100,32 C 124,32 136,46 134,78 C 130,60 120,54 100,56 C 80,54 70,60 66,78 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "crewBuzz" && (
            <path
              d="M 68,72 C 68,50 82,40 100,40 C 118,40 132,50 132,72 C 128,58 118,52 100,52 C 82,52 72,58 68,72 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "pixieEarrings" && (
            <path
              d="M 68,74 C 66,50 78,32 98,30 L 108,20 L 112,32 C 126,36 134,50 132,74 C 126,60 116,52 100,54 C 82,52 74,60 68,74 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "wavyCrop" && (
            <path
              d="M 68,76 C 64,56 74,36 92,32 C 104,28 122,30 130,42 C 136,52 134,66 132,76 C 126,60 114,54 98,56 C 82,54 74,62 68,76 Z"
              fill={hairColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          )}

          {hairStyle === "beanieKnit" && (
            <g>
              <path d="M 64,68 C 62,34 76,18 100,18 C 124,18 138,34 136,68 Z" fill={hairColor} stroke={strokeColor} strokeWidth={strokeWidth} />
              <rect x="62" y="62" width="76" height="12" rx="3" fill="#D32F2F" stroke={strokeColor} strokeWidth="1.8" />
            </g>
          )}

          {hairStyle === "capBaseball" && (
            <g>
              <path d="M 66,66 C 64,38 78,28 100,28 C 122,28 136,38 134,66 Z" fill="#0288D1" stroke={strokeColor} strokeWidth={strokeWidth} />
              <path d="M 64,66 Q 100,60 148,64 Q 100,74 64,66 Z" fill="#01579B" stroke={strokeColor} strokeWidth="2" />
            </g>
          )}

          {/* 12. EXTRA PROPS */}
          {accessories === "headphone" && (
            <g>
              <path d="M 60,78 C 60,24 140,24 140,78" fill="none" stroke="#212121" strokeWidth="4" />
              <rect x="54" y="72" width="10" height="22" rx="4" fill="#E53935" stroke={strokeColor} strokeWidth="1.8" />
              <rect x="136" y="72" width="10" height="22" rx="4" fill="#E53935" stroke={strokeColor} strokeWidth="1.8" />
            </g>
          )}

          {accessories === "partyHat" && (
            <g>
              <polygon points="100,4 86,40 114,40" fill="#FFB300" stroke={strokeColor} strokeWidth="2" />
              <circle cx="100" cy="2" r="4" fill="#E91E63" />
              <line x1="90" y1="28" x2="110" y2="28" stroke="#E91E63" strokeWidth="2" />
            </g>
          )}

          {accessories === "necklace" && (
            <path d="M 86,146 Q 100,164 114,146" fill="none" stroke="#FFD13B" strokeWidth="2.2" strokeLinecap="round" />
          )}

          {accessories === "flowerEar" && (
            <g transform="translate(62, 76)">
              {/* 5 Distinct Petals (Frangipani / Plumeria Flower) */}
              {[0, 72, 144, 216, 288].map((deg) => (
                <path
                  key={deg}
                  d="M 0,0 C -5,-7 -6,-13 0,-16 C 6,-13 5,-7 0,0 Z"
                  transform={`rotate(${deg})`}
                  fill="#FF4081"
                  stroke={strokeColor}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              ))}
              {/* Golden Yellow Pistil & Core */}
              <circle cx="0" cy="0" r="4.8" fill="#FFEB3B" stroke={strokeColor} strokeWidth="1.4" />
              <circle cx="0" cy="0" r="2" fill="#FFA000" />
            </g>
          )}

          {accessories === "catEars" && (
            <g>
              <path d="M 64,52 C 74,32 126,32 136,52" fill="none" stroke={strokeColor} strokeWidth="2.2" />
              <path d="M 68,46 L 56,18 L 84,34 Z" fill="#212121" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
              <polygon points="68,42 60,24 78,35" fill="#FF80AB" />
              <path d="M 132,46 L 144,18 L 116,34 Z" fill="#212121" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
              <polygon points="132,42 140,24 122,35" fill="#FF80AB" />
            </g>
          )}

          {accessories === "bunnyEars" && (
            <g>
              <path d="M 66,50 C 76,32 124,32 134,50" fill="none" stroke={strokeColor} strokeWidth="2.2" />
              <path d="M 74,38 C 66,16 68,-6 78,-8 C 88,-6 86,16 82,38 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 75,34 C 70,18 71,2 78,0 C 84,2 83,18 80,34 Z" fill="#FF80AB" />
              <path d="M 118,38 C 114,16 112,-6 122,-8 C 132,-6 134,16 126,38 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 120,34 C 117,18 116,2 122,0 C 129,2 130,18 125,34 Z" fill="#FF80AB" />
            </g>
          )}

          {accessories === "devilHorns" && (
            <g>
              <path d="M 76,42 C 68,30 64,16 74,10 C 78,18 84,30 84,40 Z" fill="#D32F2F" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 124,42 C 132,30 136,16 126,10 C 122,18 116,30 116,40 Z" fill="#D32F2F" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
            </g>
          )}

          {accessories === "angelHalo" && (
            <g>
              <ellipse cx="100" cy="18" rx="28" ry="8" fill="rgba(255, 215, 0, 0.15)" stroke="#FFD700" strokeWidth="3.5" />
              <ellipse cx="100" cy="18" rx="22" ry="5.5" fill="none" stroke="#FFF9C4" strokeWidth="1.5" />
            </g>
          )}

          {accessories === "crownKing" && (
            <g>
              <polygon
                points="74,40 74,22 87,30 100,16 113,30 126,22 126,40"
                fill="#FFC107"
                stroke={strokeColor}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <circle cx="74" cy="20" r="2.8" fill="#E53935" stroke={strokeColor} strokeWidth="1" />
              <circle cx="100" cy="14" r="3.2" fill="#1E88E5" stroke={strokeColor} strokeWidth="1" />
              <circle cx="126" cy="20" r="2.8" fill="#E53935" stroke={strokeColor} strokeWidth="1" />
              <circle cx="100" cy="32" r="2.2" fill="#43A047" />
            </g>
          )}

          {accessories === "witchHat" && (
            <g>
              <path d="M 72,36 Q 96,14 116,-4 Q 106,12 128,36 Z" fill="#311B92" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 74,34 Q 100,32 126,34 L 128,38 Q 100,36 72,38 Z" fill="#FFB300" stroke={strokeColor} strokeWidth="1.2" />
              <rect x="96" y="32" width="8" height="6" rx="1" fill="#FFD54F" stroke={strokeColor} strokeWidth="1.2" />
              <ellipse cx="100" cy="38" rx="42" ry="11" fill="#4527A0" stroke={strokeColor} strokeWidth="2.2" />
            </g>
          )}

          {accessories === "sproutLeaf" && (
            <g>
              <path d="M 100,36 Q 100,24 100,20" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 100,22 C 90,16 86,24 98,25 Z" fill="#66BB6A" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 100,20 C 110,14 114,22 102,23 Z" fill="#81C784" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" />
            </g>
          )}

          {accessories === "pirateEyepatch" && (
            <g>
              <line x1="62" y1="62" x2="138" y2="88" stroke="#212121" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="85" cy="78" rx="11" ry="10" fill="#212121" stroke={strokeColor} strokeWidth="2" />
              <circle cx="85" cy="78" r="2.2" fill="#FFFFFF" />
            </g>
          )}

          {accessories === "magicSparkle" && (
            <g fill="#FFD700" stroke={strokeColor} strokeWidth="1.2">
              <path d="M 54,34 Q 54,40 60,40 Q 54,40 54,46 Q 54,40 48,40 Q 54,40 54,34 Z" />
              <circle cx="54" cy="40" r="1" fill="#FFFFFF" stroke="none" />
              <path d="M 144,38 Q 144,44 150,44 Q 144,44 144,50 Q 144,44 138,44 Q 144,44 144,38 Z" />
              <circle cx="144" cy="44" r="1" fill="#FFFFFF" stroke="none" />
              <path d="M 100,12 Q 100,16 104,16 Q 100,16 100,20 Q 100,16 96,16 Q 100,16 100,12 Z" />
              <circle cx="68" cy="24" r="1.8" fill="#FF80AB" stroke="none" />
              <circle cx="132" cy="24" r="1.8" fill="#00E5FF" stroke="none" />
            </g>
          )}

          </g>
        </g>
      </svg>
    </div>
  );
};

/**
 * AvatarItemThumbnail
 * Standalone visual item preview for the dress-up game circular buttons!
 */
interface AvatarItemThumbnailProps {
  category: "hair" | "eyes" | "nose" | "mouth" | "facialHair" | "glasses" | "clothing" | "accessories";
  itemId: string;
  itemColor?: string;
  size?: number;
}

export const AvatarItemThumbnail: React.FC<AvatarItemThumbnailProps> = ({
  category,
  itemId,
  itemColor = "#1E1E1E",
  size = 48,
}) => {
  const strokeColor = "#1A1A1A";

  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center select-none">
      <svg viewBox="0 0 100 100" width={size} height={size} className="w-full h-full">
        {/* HAIR PREVIEWS */}
        {category === "hair" && (
          <g>
            <path
              d="M 34,48 C 34,26 66,26 66,48 C 66,66 60,78 50,78 C 40,78 34,66 34,48 Z"
              fill="#F5F5F7"
              stroke="#E0E0E0"
              strokeWidth="1.5"
            />
            {itemId === "bald" && null}
            {itemId === "bangsShoulder" && (
              <g>
                <path d="M 28,58 C 24,72 26,88 24,96 C 34,96 38,82 40,72 L 60,72 C 62,82 66,96 76,96 C 74,88 76,72 72,58 Z" fill={itemColor} />
                <path d="M 33,50 C 32,32 38,24 50,24 C 62,24 68,32 67,50 C 66,42 62,40 58,44 C 54,38 48,38 45,43 C 42,40 36,42 33,50 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
              </g>
            )}
            {itemId === "curlyMop" && (
              <path
                d="M 33,50 C 28,46 30,38 34,36 C 31,30 36,24 42,24 C 45,20 52,18 56,22 C 61,19 66,22 68,26 C 74,27 76,33 74,38 C 77,42 76,48 72,50 C 70,42 64,36 50,36 C 36,36 34,42 33,50 Z"
                fill={itemColor}
                stroke={strokeColor}
                strokeWidth="1.6"
              />
            )}
            {itemId === "curlyLobGlasses" && (
              <path
                d="M 32,54 C 26,46 30,34 40,28 C 46,24 56,24 62,28 C 70,33 74,45 68,54 C 64,44 58,38 50,38 C 42,38 36,44 32,54 Z"
                fill={itemColor}
                stroke={strokeColor}
                strokeWidth="1.6"
              />
            )}
            {itemId === "spikyMessy" && (
              <path
                d="M 34,48 C 32,38 36,28 42,26 L 47,18 L 49,24 L 56,16 L 58,24 L 66,20 L 66,28 C 70,34 70,44 68,50 C 64,40 58,36 50,38 C 42,36 36,40 34,48 Z"
                fill={itemColor}
                stroke={strokeColor}
                strokeWidth="1.6"
              />
            )}
            {itemId === "topBun" && (
              <g>
                <circle cx="50" cy="16" r="10" fill={itemColor} stroke={strokeColor} strokeWidth="1.5" />
                <path d="M 33,50 C 30,44 32,38 36,34 C 35,29 40,26 45,24 C 48,22 54,22 57,24 C 62,25 66,29 65,34 C 69,38 70,44 67,50 C 64,42 58,38 50,38 C 42,38 36,42 33,50 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
              </g>
            )}
            {itemId === "undercutPompadour" && (
              <path d="M 34,44 C 33,32 38,18 50,16 C 62,18 67,32 66,44 C 63,34 57,30 48,32 C 40,33 36,38 34,44 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "koreanCurtain" && (
              <path d="M 33,48 C 32,32 39,24 50,24 C 61,24 68,32 67,48 C 64,38 59,36 54,42 C 50,37 46,36 41,43 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "afroPuff" && (
              <circle cx="50" cy="28" r="22" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "twinBuns" && (
              <g fill={itemColor} stroke={strokeColor} strokeWidth="1.6">
                <circle cx="34" cy="22" r="9" />
                <circle cx="66" cy="22" r="9" />
                <path d="M 34,46 C 34,34 40,26 50,26 C 60,26 66,34 66,46 Z" />
              </g>
            )}
            {itemId === "sidePonytail" && (
              <g fill={itemColor} stroke={strokeColor} strokeWidth="1.6">
                <path d="M 34,46 C 34,34 40,26 50,26 C 60,26 66,34 66,46 Z" />
                <path d="M 64,36 C 76,32 84,42 82,58 C 76,60 72,50 66,44 Z" />
              </g>
            )}
            {itemId === "highPonytail" && (
              <g fill={itemColor} stroke={strokeColor} strokeWidth="1.6">
                <path d="M 34,44 C 34,30 40,24 50,24 C 60,24 66,30 66,44 Z" />
                <path d="M 58,26 C 68,16 80,22 84,38 C 86,52 80,68 72,78 C 70,68 74,52 72,40 C 70,30 64,26 58,26 Z" />
                <circle cx="58" cy="26" r="3.5" fill="#E65100" stroke={strokeColor} strokeWidth="1.2" />
              </g>
            )}
            {itemId === "sideBraid" && (
              <g fill={itemColor} stroke={strokeColor} strokeWidth="1.6">
                <path d="M 34,44 C 34,30 40,24 50,24 C 60,24 66,30 66,44 C 60,34 52,30 44,32 C 38,34 35,38 34,44 Z" />
                <ellipse cx="66" cy="50" rx="5" ry="7" transform="rotate(20 66 50)" />
                <ellipse cx="68" cy="62" rx="4.5" ry="6.5" transform="rotate(15 68 62)" />
                <ellipse cx="69" cy="73" rx="4" ry="6" transform="rotate(10 69 73)" />
                <rect x="67" y="79" width="4.5" height="3" rx="1" fill="#E65100" stroke={strokeColor} strokeWidth="1.2" />
                <path d="M 68,82 C 69,88 68,90 69,92 C 67,90 66,88 66,82 Z" />
              </g>
            )}
            {itemId === "beanieKnit" && (
              <g>
                <path d="M 32,46 C 30,26 40,16 50,16 C 60,16 70,26 68,46 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
                <rect x="30" y="42" width="40" height="8" rx="2" fill="#D32F2F" stroke={strokeColor} strokeWidth="1.2" />
              </g>
            )}
            {itemId === "capBaseball" && (
              <g>
                <path d="M 33,44 C 32,28 40,22 50,22 C 60,22 68,28 67,44 Z" fill="#0288D1" stroke={strokeColor} strokeWidth="1.6" />
                <path d="M 32,44 Q 50,40 76,42 Q 50,48 32,44 Z" fill="#01579B" stroke={strokeColor} strokeWidth="1.4" />
              </g>
            )}
            {itemId === "sidePartNeat" && (
              <path d="M 34,48 C 33,34 40,24 51,24 C 62,24 67,30 66,48 C 63,38 55,34 47,36 C 41,36 37,40 34,48 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "bobBangs" && (
              <path d="M 32,56 C 30,42 32,25 50,25 C 68,25 70,42 68,56 C 66,48 64,40 62,40 L 38,40 C 36,40 34,48 32,56 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "headbandCurly" && (
              <g>
                <path d="M 32,50 C 28,42 30,30 38,25 C 44,21 56,21 62,25 C 70,30 72,40 68,50 C 64,44 58,38 50,38 C 42,38 36,44 32,50 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
                <path d="M 33,45 C 38,40 62,40 67,45 L 66,48 C 61,43 39,43 34,48 Z" fill="#FFD13B" stroke={strokeColor} strokeWidth="1.2" />
              </g>
            )}
            {itemId === "sidePartPrep" && (
              <path d="M 34,46 C 33,32 40,24 52,23 C 63,23 67,29 66,46 C 64,36 57,32 48,34 C 40,35 36,39 34,46 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "hijabWrap" && (
              <path d="M 28,52 C 26,24 74,24 72,52 C 72,70 78,92 72,96 C 64,90 36,90 28,96 C 22,92 28,70 28,52 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "middlePartSleek" && (
              <path d="M 33,52 C 32,34 39,26 50,26 C 61,26 68,34 67,52 C 65,42 61,38 50,42 C 39,38 35,42 33,52 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "longStraight" && (
              <g>
                <path d="M 28,54 C 24,70 24,86 23,96 C 32,96 35,82 38,70 L 62,70 C 65,82 68,96 77,96 C 76,86 76,70 72,54 Z" fill={itemColor} />
                <path d="M 33,50 C 32,32 38,24 50,24 C 62,24 68,32 67,50 C 65,40 60,36 50,38 C 40,36 35,40 33,50 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
              </g>
            )}
            {itemId === "crewBuzz" && (
              <path d="M 34,44 C 34,34 41,28 50,28 C 59,28 66,34 66,44 C 64,37 59,34 50,34 C 41,34 36,37 34,44 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "pixieEarrings" && (
              <g>
                <path d="M 34,46 C 33,34 39,24 49,23 L 54,18 L 56,24 C 63,26 67,34 66,46 C 63,38 58,34 50,35 C 41,34 37,38 34,46 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
                <circle cx="30" cy="58" r="3" fill="#FFD13B" stroke={strokeColor} strokeWidth="1.2" />
                <circle cx="70" cy="58" r="3" fill="#FFD13B" stroke={strokeColor} strokeWidth="1.2" />
              </g>
            )}
            {itemId === "wavyCrop" && (
              <path d="M 34,47 C 32,36 37,26 46,24 C 52,22 61,23 65,29 C 68,34 67,42 66,47 C 63,38 57,35 49,36 C 41,35 37,39 34,47 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
          </g>
        )}

        {/* EYES PREVIEWS */}
        {category === "eyes" && (
          <g>
            <path d="M 28,40 Q 36,36 44,40" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M 56,40 Q 64,36 72,40" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            {itemId === "dots" && (
              <>
                <circle cx="36" cy="54" r="4.2" fill={strokeColor} />
                <circle cx="64" cy="54" r="4.2" fill={strokeColor} />
              </>
            )}
            {itemId === "smilingArc" && (
              <>
                <path d="M 28,54 Q 36,46 44,54" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 56,54 Q 64,46 72,54" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none" />
              </>
            )}
            {itemId === "dashes" && (
              <>
                <line x1="28" y1="54" x2="44" y2="54" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                <line x1="56" y1="54" x2="72" y2="54" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
              </>
            )}
            {itemId === "roundOpen" && (
              <>
                <ellipse cx="36" cy="54" rx="7" ry="8" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.2" />
                <circle cx="36" cy="54" r="3.6" fill={strokeColor} />
                <ellipse cx="64" cy="54" rx="7" ry="8" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.2" />
                <circle cx="64" cy="54" r="3.6" fill={strokeColor} />
              </>
            )}
            {itemId === "sparkleEye" && (
              <>
                <circle cx="36" cy="54" r="5" fill={strokeColor} />
                <circle cx="34" cy="52" r="1.8" fill="#FFFFFF" />
                <circle cx="64" cy="54" r="5" fill={strokeColor} />
                <circle cx="62" cy="52" r="1.8" fill="#FFFFFF" />
              </>
            )}
            {itemId === "sleepyChill" && (
              <>
                <path d="M 28,52 Q 36,58 44,52" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 56,52 Q 64,58 72,52" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none" />
              </>
            )}
            {itemId === "fierceCat" && (
              <>
                <path d="M 28,55 Q 36,50 46,51 L 49,47" stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <circle cx="37" cy="53" r="3.2" fill={strokeColor} />
                <path d="M 72,55 Q 64,50 54,51 L 51,47" stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <circle cx="63" cy="53" r="3.2" fill={strokeColor} />
              </>
            )}
            {itemId === "winking" && (
              <>
                <circle cx="36" cy="54" r="4.2" fill={strokeColor} />
                <path d="M 56,54 Q 64,46 72,54" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none" />
              </>
            )}
            {itemId === "heartEyes" && (
              <g fill="#FF4081" stroke={strokeColor} strokeWidth="1.8">
                <path d="M 36,48 C 30,42 24,48 24,54 C 24,62 36,70 36,70 C 36,70 48,62 48,54 C 48,48 42,42 36,48 Z" />
                <path d="M 64,48 C 58,42 52,48 52,54 C 52,62 64,70 64,70 C 64,70 76,62 76,54 C 76,48 70,42 64,48 Z" />
              </g>
            )}
            {itemId === "starEyes" && (
              <g fill="#FFD700" stroke={strokeColor} strokeWidth="1.6">
                <path d="M 36,42 Q 36,54 48,54 Q 36,54 36,66 Q 36,54 24,54 Q 36,54 36,42 Z" />
                <circle cx="36" cy="54" r="2.2" fill="#FFFFFF" stroke="none" />
                <path d="M 64,42 Q 64,54 76,54 Q 64,54 64,66 Q 64,54 52,54 Q 64,54 64,42 Z" />
                <circle cx="64" cy="54" r="2.2" fill="#FFFFFF" stroke="none" />
              </g>
            )}
            {itemId === "dizzySpiral" && (
              <g fill="none" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round">
                <path d="M 36,54 A 3,3 0 0,1 39,57 A 6,6 0 0,1 33,60 A 9,9 0 0,1 30,50 A 12,12 0 0,1 44,50" />
                <path d="M 64,54 A 3,3 0 0,1 67,57 A 6,6 0 0,1 61,60 A 9,9 0 0,1 58,50 A 12,12 0 0,1 72,50" />
              </g>
            )}
          </g>
        )}

        {/* NOSE PREVIEWS */}
        {category === "nose" && (
          <g>
            {itemId === "hook" && (
              <path d="M 47,30 L 47,65 Q 47,72 58,70" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            )}
            {itemId === "curve" && (
              <path d="M 48,32 Q 58,54 48,68" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            )}
            {itemId === "straight" && (
              <path d="M 47,30 L 47,68 L 56,68" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}
            {itemId === "buttonRound" && (
              <path d="M 42,54 Q 50,66 58,54" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            )}
            {itemId === "wideTriangle" && (
              <path d="M 40,64 Q 50,56 60,64" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" fill="none" />
            )}
            {itemId === "dot" && (
              <circle cx="50" cy="55" r="4.5" fill={strokeColor} />
            )}
          </g>
        )}

        {/* MOUTH PREVIEWS */}
        {category === "mouth" && (
          <g>
            {itemId === "gentleCurve" && (
              <path d="M 32,50 Q 50,68 68,50" stroke={strokeColor} strokeWidth="3.8" strokeLinecap="round" fill="none" />
            )}
            {itemId === "wideSmile" && (
              <path d="M 28,46 Q 50,72 72,46 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3.2" strokeLinejoin="round" />
            )}
            {itemId === "smirk" && (
              <path d="M 34,54 Q 50,60 66,46" stroke={strokeColor} strokeWidth="3.8" strokeLinecap="round" fill="none" />
            )}
            {itemId === "laughing" && (
              <path d="M 28,46 Q 50,78 72,46 Z" fill="#D32F2F" stroke={strokeColor} strokeWidth="3" />
            )}
            {itemId === "surprisedO" && (
              <ellipse cx="50" cy="52" rx="9" ry="12" fill="#D32F2F" stroke={strokeColor} strokeWidth="3" />
            )}
            {itemId === "tongueOut" && (
              <g>
                <path d="M 32,48 Q 50,58 68,48" stroke={strokeColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M 45,52 C 45,68 55,68 55,52 Z" fill="#FF5252" stroke={strokeColor} strokeWidth="2" />
              </g>
            )}
            {itemId === "openGrin" && (
              <g>
                <path d="M 28,46 Q 50,74 72,46 Q 50,54 28,46 Z" fill="#D84315" stroke={strokeColor} strokeWidth="3" />
                <path d="M 32,50 Q 50,56 68,50" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}
            {itemId === "straight" && (
              <line x1="32" y1="52" x2="68" y2="52" stroke={strokeColor} strokeWidth="3.8" strokeLinecap="round" />
            )}
            {itemId === "catMouth" && (
              <path
                d="M 32,50 Q 41,60 50,52 Q 59,60 68,50"
                stroke={strokeColor}
                strokeWidth="3.8"
                strokeLinecap="round"
                fill="none"
              />
            )}
            {itemId === "bubbleGum" && (
              <g>
                <path d="M 32,52 Q 46,60 60,52" stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <circle cx="62" cy="48" r="18" fill="#FF80AB" stroke={strokeColor} strokeWidth="2.5" />
                <path d="M 54,38 Q 66,36 72,44" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </g>
            )}
            {itemId === "vampireFangs" && (
              <g>
                <path d="M 28,46 Q 50,72 72,46 Z" fill="#D32F2F" stroke={strokeColor} strokeWidth="3.2" strokeLinejoin="round" />
                <polygon points="36,46 40,56 44,46" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.2" />
                <polygon points="56,46 60,56 64,46" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.2" />
              </g>
            )}
          </g>
        )}

        {/* FACIAL HAIR PREVIEWS */}
        {category === "facialHair" && (
          <g>
            <path d="M 30,30 C 30,70 40,86 50,86 C 60,86 70,70 70,30" fill="#F5F5F7" stroke="#E0E0E0" strokeWidth="1.5" />
            {itemId === "none" && (
              <path d="M 42,50 Q 50,56 58,50" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" fill="none" />
            )}
            {itemId === "neatMustache" && (
              <path d="M 34,46 Q 42,40 50,44 Q 58,40 66,46 Q 58,50 50,48 Q 42,50 34,46 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.8" />
            )}
            {itemId === "handlebar" && (
              <path d="M 28,46 Q 38,50 50,46 Q 62,50 72,46 Q 74,40 70,36 Q 60,42 50,43 Q 40,42 30,36 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
            )}
            {itemId === "fullBeard" && (
              <path d="M 30,30 C 28,52 32,88 50,88 C 68,88 72,52 70,30 C 64,42 58,58 50,58 C 42,58 36,42 30,30 Z" fill={itemColor} stroke={strokeColor} strokeWidth="2" />
            )}
            {itemId === "chinStrap" && (
              <path d="M 30,30 C 34,70 42,84 50,84 C 58,84 66,70 70,30 L 66,30 C 62,64 56,76 50,76 C 44,76 38,64 34,30 Z" fill={itemColor} />
            )}
            {itemId === "vanDyke" && (
              <g fill={itemColor} stroke={strokeColor} strokeWidth="1.5">
                <path d="M 34,44 Q 50,40 66,44 Q 50,50 34,44 Z" />
                <path d="M 44,58 L 56,58 L 50,76 Z" />
              </g>
            )}
            {itemId === "goatee" && (
              <path d="M 44,58 C 44,74 56,74 56,58 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.8" />
            )}
            {itemId === "stubble" && (
              <g opacity="0.7">
                <circle cx="42" cy="62" r="1.5" fill={strokeColor} />
                <circle cx="46" cy="68" r="1.5" fill={strokeColor} />
                <circle cx="50" cy="72" r="1.5" fill={strokeColor} />
                <circle cx="54" cy="68" r="1.5" fill={strokeColor} />
                <circle cx="58" cy="62" r="1.5" fill={strokeColor} />
              </g>
            )}
          </g>
        )}

        {/* GLASSES PREVIEWS */}
        {category === "glasses" && (
          <g>
            {itemId === "none" && (
              <text x="50" y="55" textAnchor="middle" fontSize="12" fill="#9E9E9E" fontWeight="bold">NONE</text>
            )}
            {itemId === "round" && (
              <g>
                <circle cx="34" cy="50" r="18" fill="none" stroke={itemColor} strokeWidth="3" />
                <circle cx="66" cy="50" r="18" fill="none" stroke={itemColor} strokeWidth="3" />
                <line x1="52" y1="50" x2="48" y2="50" stroke={itemColor} strokeWidth="3" strokeLinecap="round" />
                <line x1="16" y1="50" x2="8" y2="50" stroke={itemColor} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="84" y1="50" x2="92" y2="50" stroke={itemColor} strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
            {itemId === "square" && (
              <g>
                <rect x="18" y="38" width="28" height="24" rx="4" fill="none" stroke={itemColor} strokeWidth="3" />
                <rect x="54" y="38" width="28" height="24" rx="4" fill="none" stroke={itemColor} strokeWidth="3" />
                <line x1="46" y1="48" x2="54" y2="48" stroke={itemColor} strokeWidth="3" strokeLinecap="round" />
                <line x1="18" y1="46" x2="10" y2="48" stroke={itemColor} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="82" y1="46" x2="90" y2="48" stroke={itemColor} strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
            {itemId === "aviator" && (
              <g fill="none" stroke={itemColor} strokeWidth="2.5">
                <path d="M 20,40 L 46,40 C 46,58 38,64 20,58 Z" />
                <path d="M 80,40 L 54,40 C 54,58 62,64 80,58 Z" />
                <line x1="22" y1="36" x2="78" y2="36" strokeWidth="2" />
                <line x1="46" y1="42" x2="54" y2="42" strokeWidth="2" />
              </g>
            )}
            {itemId === "catEye" && (
              <g fill="none" stroke={itemColor} strokeWidth="2.8">
                <path d="M 16,36 Q 34,38 46,46 Q 36,60 22,54 Z" />
                <path d="M 84,36 Q 66,38 54,46 Q 64,60 78,54 Z" />
                <line x1="46" y1="44" x2="54" y2="44" strokeWidth="2.5" />
              </g>
            )}
            {itemId === "halfRim" && (
              <g stroke={itemColor} strokeWidth="3.2" fill="none">
                <line x1="18" y1="40" x2="46" y2="40" strokeLinecap="round" />
                <line x1="54" y1="40" x2="82" y2="40" strokeLinecap="round" />
                <rect x="20" y="40" width="24" height="18" rx="3" strokeWidth="1.5" stroke="#9E9E9E" />
                <rect x="56" y="40" width="24" height="18" rx="3" strokeWidth="1.5" stroke="#9E9E9E" />
                <line x1="46" y1="44" x2="54" y2="44" strokeWidth="2.5" />
              </g>
            )}
            {itemId === "sunglasses" && (
              <g>
                <path d="M 18,40 C 26,38 46,38 46,52 C 46,62 36,64 22,60 Z" fill="#212121" stroke={strokeColor} strokeWidth="2.5" />
                <path d="M 82,40 C 74,38 54,38 54,52 C 54,62 64,64 78,60 Z" fill="#212121" stroke={strokeColor} strokeWidth="2.5" />
                <line x1="46" y1="44" x2="54" y2="44" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
            {itemId === "pixelThug" && (
              <g fill="#1A1A1A" stroke="#1A1A1A">
                <rect x="14" y="42" width="34" height="16" />
                <rect x="10" y="38" width="8" height="6" />
                <rect x="18" y="44" width="4" height="4" fill="#FFFFFF" stroke="none" />
                <rect x="22" y="48" width="4" height="4" fill="#FFFFFF" stroke="none" />
                <rect x="48" y="44" width="6" height="5" />
                <rect x="54" y="42" width="34" height="16" />
                <rect x="84" y="38" width="8" height="6" />
                <rect x="58" y="44" width="4" height="4" fill="#FFFFFF" stroke="none" />
                <rect x="62" y="48" width="4" height="4" fill="#FFFFFF" stroke="none" />
              </g>
            )}
            {itemId === "heartPink" && (
              <g fill="rgba(255, 64, 129, 0.45)" stroke="#FF4081" strokeWidth="2.8" strokeLinejoin="round">
                <path d="M 34,40 C 28,32 16,36 16,46 C 16,58 34,68 34,68 C 34,68 52,58 52,46 C 52,36 40,32 34,40 Z" />
                <path d="M 66,40 C 60,32 48,36 48,46 C 48,58 66,68 66,68 C 66,68 84,58 84,46 C 84,36 72,32 66,40 Z" />
                <line x1="48" y1="46" x2="52" y2="46" stroke="#FF4081" strokeWidth="2.5" />
              </g>
            )}
            {itemId === "starGoggles" && (
              <g fill="rgba(255, 215, 0, 0.55)" stroke="#FFA000" strokeWidth="2.5" strokeLinejoin="round">
                <polygon points="34,32 38,42 48,44 40,51 43,62 34,56 25,62 28,51 20,44 30,42" />
                <polygon points="66,32 70,42 80,44 72,51 75,62 66,56 57,62 60,51 52,44 62,42" />
                <line x1="46" y1="46" x2="54" y2="46" stroke="#FFA000" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
            {itemId === "cyberVisor" && (
              <g>
                <polygon points="12,38 88,38 82,62 18,62" fill="rgba(0, 229, 255, 0.75)" stroke="#00E5FF" strokeWidth="3" strokeLinejoin="round" />
                <line x1="16" y1="50" x2="84" y2="50" stroke="#FFFFFF" strokeWidth="2" opacity="0.9" />
                <circle cx="22" cy="50" r="2" fill="#FFFFFF" />
                <circle cx="78" cy="50" r="2" fill="#FFFFFF" />
              </g>
            )}
            {itemId === "swirlHypno" && (
              <g>
                <circle cx="34" cy="50" r="18" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3" />
                <circle cx="66" cy="50" r="18" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3" />
                <line x1="52" y1="50" x2="48" y2="50" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                <path d="M 34,50 A 3,3 0 0,1 37,53 A 6,6 0 0,1 30,55 A 10,10 0 0,1 26,45 A 14,14 0 0,1 44,44" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 66,50 A 3,3 0 0,1 69,53 A 6,6 0 0,1 62,55 A 10,10 0 0,1 58,45 A 14,14 0 0,1 76,44" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
              </g>
            )}
            {itemId === "monocle" && (
              <g>
                <circle cx="58" cy="48" r="18" fill="rgba(255, 224, 130, 0.3)" stroke="#FFA000" strokeWidth="3" />
                <circle cx="58" cy="48" r="14" fill="none" stroke="#FFD54F" strokeWidth="1.4" opacity="0.6" />
                <path d="M 72,56 Q 80,74 68,90" fill="none" stroke="#FFA000" strokeWidth="2" strokeDasharray="3,2" />
              </g>
            )}
          </g>
        )}

        {/* CLOTHING PREVIEWS */}
        {category === "clothing" && (
          <g>
            <defs>
              <clipPath id={`thumb_shirt_clip_${itemId}`}>
                <path d="M 15,92 C 18,58 35,46 44,44 Q 50,50 56,44 C 65,46 82,58 85,92 Z" />
              </clipPath>
            </defs>
            <path
              d={
                itemId === "scoopNeck"
                  ? "M 15,92 C 18,58 35,46 44,44 C 44,56 56,56 56,44 C 65,46 82,58 85,92 Z"
                  : itemId === "vNeck"
                  ? "M 15,92 C 18,58 35,46 44,44 L 50,58 L 56,44 C 65,46 82,58 85,92 Z"
                  : itemId === "turtleneck" || itemId === "stripedTurtle"
                  ? "M 15,92 C 18,58 35,46 43,44 L 57,44 C 65,46 82,58 85,92 Z"
                  : "M 15,92 C 18,58 35,46 44,44 Q 50,50 56,44 C 65,46 82,58 85,92 Z"
              }
              fill={itemColor}
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {itemId === "stripedCrew" && (
              <g clipPath={`url(#thumb_shirt_clip_${itemId})`}>
                <line x1="0" y1="65" x2="100" y2="65" stroke={strokeColor} strokeWidth="2" />
                <line x1="0" y1="78" x2="100" y2="78" stroke={strokeColor} strokeWidth="2" />
              </g>
            )}
            {itemId === "stripedTurtle" && (
              <>
                <rect x="42" y="32" width="16" height="13" rx="2" fill={itemColor} stroke={strokeColor} strokeWidth="1.8" />
                <line x1="47" y1="32" x2="47" y2="45" stroke={strokeColor} strokeWidth="1.5" />
                <line x1="53" y1="32" x2="53" y2="45" stroke={strokeColor} strokeWidth="1.5" />
                <line x1="32" y1="56" x2="32" y2="92" stroke={strokeColor} strokeWidth="1.8" />
                <line x1="44" y1="45" x2="44" y2="92" stroke={strokeColor} strokeWidth="1.8" />
                <line x1="56" y1="45" x2="56" y2="92" stroke={strokeColor} strokeWidth="1.8" />
                <line x1="68" y1="56" x2="68" y2="92" stroke={strokeColor} strokeWidth="1.8" />
              </>
            )}
            {itemId === "turtleneck" && (
              <rect x="42" y="32" width="16" height="13" rx="2" fill={itemColor} stroke={strokeColor} strokeWidth="1.8" />
            )}
            {itemId === "blazerTop" && (
              <>
                <path d="M 44,44 Q 50,50 56,44 L 56,92 L 44,92 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.8" />
                <path d="M 34,50 L 44,70 L 30,92" stroke={strokeColor} strokeWidth="2" fill="none" />
                <path d="M 66,50 L 56,70 L 70,92" stroke={strokeColor} strokeWidth="2" fill="none" />
              </>
            )}
            {itemId === "suitAndTie" && (
              <>
                <path d="M 44,44 L 50,56 L 56,44 L 56,92 L 44,92 Z" fill="#FFFFFF" stroke="none" />
                <path d="M 44,44 L 49,52 L 43,51 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.2" />
                <path d="M 56,44 L 51,52 L 57,51 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.2" />
                <polygon points="48,52 52,52 51,57 49,57" fill="#D32F2F" stroke={strokeColor} strokeWidth="0.8" />
                <polygon points="49,57 51,57 52,78 50,84 48,78" fill="#D32F2F" stroke={strokeColor} strokeWidth="1" />
                <path d="M 34,48 L 44,68 L 30,92" stroke={strokeColor} strokeWidth="2" fill="none" />
                <path d="M 66,48 L 56,68 L 70,92" stroke={strokeColor} strokeWidth="2" fill="none" />
              </>
            )}
            {itemId === "denimJacket" && (
              <>
                <path d="M 44,44 L 50,54 L 38,56 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
                <path d="M 56,44 L 50,54 L 62,56 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.6" />
                <line x1="50" y1="54" x2="50" y2="92" stroke={strokeColor} strokeWidth="2" />
                <rect x="26" y="66" width="12" height="10" rx="1.5" fill="none" stroke={strokeColor} strokeWidth="1.4" />
                <rect x="62" y="66" width="12" height="10" rx="1.5" fill="none" stroke={strokeColor} strokeWidth="1.4" />
              </>
            )}
            {itemId === "hawaiianShirt" && (
              <>
                <path d="M 42,44 L 50,58 L 58,44" fill="none" stroke={strokeColor} strokeWidth="2" />
                <line x1="50" y1="58" x2="50" y2="92" stroke={strokeColor} strokeWidth="1.8" />
                <circle cx="34" cy="72" r="2.5" fill="#FFF" opacity="0.6" />
                <circle cx="66" cy="72" r="2.5" fill="#FFF" opacity="0.6" />
              </>
            )}
            {itemId === "sweaterVest" && (
              <>
                <path d="M 42,44 L 50,60 L 58,44 L 58,92 L 42,92 Z" fill="#FFF" stroke="none" />
                <path d="M 42,44 L 50,60 L 58,44" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
                <path d="M 44,44 L 50,50 L 40,50 Z" fill="#FFF" stroke={strokeColor} strokeWidth="1.4" />
                <path d="M 56,44 L 50,50 L 60,50 Z" fill="#FFF" stroke={strokeColor} strokeWidth="1.4" />
              </>
            )}
            {itemId === "labCoat" && (
              <>
                <path d="M 42,44 L 50,60 L 58,44" fill="none" stroke={strokeColor} strokeWidth="2" />
                <line x1="50" y1="60" x2="50" y2="92" stroke={strokeColor} strokeWidth="2" />
                <path d="M 40,50 C 40,68 60,68 60,50" fill="none" stroke="#374151" strokeWidth="2" />
                <circle cx="50" cy="74" r="2.5" fill="#9CA3AF" />
              </>
            )}
            {itemId === "poloCollar" && (
              <>
                <path d="M 44,44 L 50,54 L 38,54 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.8" />
                <path d="M 56,44 L 50,54 L 62,54 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.8" />
                <line x1="50" y1="54" x2="50" y2="76" stroke={strokeColor} strokeWidth="2" />
                <circle cx="50" cy="62" r="1.4" fill={strokeColor} />
                <circle cx="50" cy="70" r="1.4" fill={strokeColor} />
              </>
            )}
            {itemId === "buttonUpShirt" && (
              <>
                <path d="M 44,44 L 50,56 L 36,58 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.8" />
                <path d="M 56,44 L 50,56 L 64,58 Z" fill={itemColor} stroke={strokeColor} strokeWidth="1.8" />
                <line x1="50" y1="56" x2="50" y2="92" stroke={strokeColor} strokeWidth="2" />
                <circle cx="50" cy="66" r="1.4" fill={strokeColor} />
                <circle cx="50" cy="78" r="1.4" fill={strokeColor} />
              </>
            )}
            {itemId === "buttonHenley" && (
              <>
                <path d="M 44,44 Q 50,48 56,44" stroke={strokeColor} strokeWidth="2" fill="none" />
                <rect x="47" y="47" width="6" height="18" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
                <circle cx="50" cy="53" r="1.2" fill={strokeColor} />
                <circle cx="50" cy="60" r="1.2" fill={strokeColor} />
              </>
            )}
            {itemId === "hoodie" && (
              <>
                <path d="M 40,44 Q 50,56 60,44" stroke={strokeColor} strokeWidth="2.2" fill="none" />
                <line x1="47" y1="50" x2="47" y2="68" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
                <line x1="53" y1="50" x2="53" y2="68" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
              </>
            )}
            {itemId === "superheroCape" && (
              <>
                <path d="M 22,50 L 10,92 L 90,92 L 78,50 Z" fill="#E53935" stroke={strokeColor} strokeWidth="1.8" />
                <polygon points="50,54 58,64 50,74 42,64" fill="#FFD54F" stroke={strokeColor} strokeWidth="1.4" />
                <circle cx="38" cy="50" r="2.2" fill="#FFD54F" stroke={strokeColor} strokeWidth="1" />
                <circle cx="62" cy="50" r="2.2" fill="#FFD54F" stroke={strokeColor} strokeWidth="1" />
              </>
            )}
            {itemId === "wizardRobe" && (
              <>
                <path d="M 42,44 L 50,60 L 58,44" fill="none" stroke={strokeColor} strokeWidth="2" />
                <line x1="50" y1="60" x2="50" y2="92" stroke="#FFD54F" strokeWidth="2.2" />
                <circle cx="34" cy="72" r="2" fill="#FFD54F" />
                <circle cx="66" cy="72" r="2" fill="#FFD54F" />
                <circle cx="42" cy="82" r="1.6" fill="#FFD54F" />
                <circle cx="58" cy="82" r="1.6" fill="#FFD54F" />
              </>
            )}
            {itemId === "yukataKimono" && (
              <>
                <path d="M 40,44 L 60,68" stroke={strokeColor} strokeWidth="2" fill="none" />
                <path d="M 60,44 L 42,65" stroke={strokeColor} strokeWidth="2" fill="none" />
                <rect x="25" y="72" width="50" height="15" fill="#FF7043" stroke={strokeColor} strokeWidth="1.6" />
                <line x1="25" y1="79" x2="75" y2="79" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
              </>
            )}
            {itemId === "dinoHoodie" && (
              <>
                <path d="M 40,44 Q 50,56 60,44" stroke={strokeColor} strokeWidth="2.2" fill="none" />
                <polygon points="28,52 20,44 32,48" fill="#4CAF50" stroke={strokeColor} strokeWidth="1.4" />
                <polygon points="72,52 80,44 68,48" fill="#4CAF50" stroke={strokeColor} strokeWidth="1.4" />
                <path d="M 42,62 Q 50,56 58,62 L 60,92 L 40,92 Z" fill="#FFF9C4" stroke={strokeColor} strokeWidth="1.4" />
              </>
            )}
            {itemId === "overallsCute" && (
              <>
                <path d="M 44,44 Q 50,50 56,44" stroke={strokeColor} strokeWidth="2" fill="none" />
                <path d="M 36,60 L 64,60 L 68,92 L 32,92 Z" fill="#1976D2" stroke={strokeColor} strokeWidth="1.8" />
                <rect x="34" y="44" width="8" height="18" fill="#1976D2" stroke={strokeColor} strokeWidth="1.4" />
                <rect x="58" y="44" width="8" height="18" fill="#1976D2" stroke={strokeColor} strokeWidth="1.4" />
                <circle cx="38" cy="60" r="1.8" fill="#FFD54F" stroke={strokeColor} strokeWidth="1" />
                <circle cx="62" cy="60" r="1.8" fill="#FFD54F" stroke={strokeColor} strokeWidth="1" />
              </>
            )}
          </g>
        )}

        {/* ACCESSORIES PREVIEWS */}
        {category === "accessories" && (
          <g>
            {itemId === "none" && (
              <text x="50" y="55" textAnchor="middle" fontSize="12" fill="#9E9E9E" fontWeight="bold">NONE</text>
            )}
            {itemId === "headband" && (
              <path d="M 24,56 C 36,44 64,44 76,56 L 74,64 C 62,52 38,52 26,64 Z" fill="#FFD13B" stroke={strokeColor} strokeWidth="2.2" />
            )}
            {itemId === "earrings" && (
              <g>
                <circle cx="34" cy="50" r="8" fill="#FFD13B" stroke={strokeColor} strokeWidth="2.5" />
                <circle cx="66" cy="50" r="8" fill="#FFD13B" stroke={strokeColor} strokeWidth="2.5" />
              </g>
            )}
            {itemId === "necklace" && (
              <path d="M 28,42 Q 50,72 72,42" fill="none" stroke="#FFD13B" strokeWidth="3" strokeLinecap="round" />
            )}
            {itemId === "headphone" && (
              <g>
                <path d="M 26,50 C 26,26 74,26 74,50" fill="none" stroke="#212121" strokeWidth="3.5" />
                <rect x="20" y="44" width="8" height="16" rx="3" fill="#E53935" stroke={strokeColor} strokeWidth="1.5" />
                <rect x="72" y="44" width="8" height="16" rx="3" fill="#E53935" stroke={strokeColor} strokeWidth="1.5" />
              </g>
            )}
            {itemId === "faceMask" && (
              <path d="M 30,48 C 28,68 40,78 50,78 C 60,78 72,68 70,48 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2" />
            )}
            {itemId === "flowerEar" && (
              <g transform="translate(50, 50)">
                {[0, 72, 144, 216, 288].map((deg) => (
                  <path
                    key={deg}
                    d="M 0,0 C -7,-10 -8,-20 0,-24 C 8,-20 7,-10 0,0 Z"
                    transform={`rotate(${deg})`}
                    fill="#FF4081"
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                ))}
                <circle cx="0" cy="0" r="7" fill="#FFEB3B" stroke={strokeColor} strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#FFA000" />
              </g>
            )}
            {itemId === "partyHat" && (
              <g>
                <polygon points="50,20 34,70 66,70" fill="#FFB300" stroke={strokeColor} strokeWidth="2.5" />
                <circle cx="50" cy="18" r="5" fill="#E91E63" />
                <line x1="40" y1="52" x2="60" y2="52" stroke="#E91E63" strokeWidth="2.5" />
              </g>
            )}
            {itemId === "catEars" && (
              <g>
                <path d="M 24,62 C 34,44 66,44 76,62" fill="none" stroke={strokeColor} strokeWidth="2.5" />
                <path d="M 28,54 L 18,24 L 46,40 Z" fill="#212121" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
                <polygon points="28,50 22,30 38,42" fill="#FF80AB" />
                <path d="M 72,54 L 82,24 L 54,40 Z" fill="#212121" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
                <polygon points="72,50 78,30 62,42" fill="#FF80AB" />
              </g>
            )}
            {itemId === "bunnyEars" && (
              <g>
                <path d="M 28,62 C 38,48 62,48 72,62" fill="none" stroke={strokeColor} strokeWidth="2.5" />
                <path d="M 34,50 C 26,22 28,4 38,2 C 48,4 46,22 42,50 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M 35,46 C 30,26 31,10 38,8 C 44,10 43,26 40,46 Z" fill="#FF80AB" />
                <path d="M 66,50 C 58,22 60,4 70,2 C 80,4 78,22 74,50 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M 67,46 C 62,26 63,10 70,8 C 76,10 75,26 72,46 Z" fill="#FF80AB" />
              </g>
            )}
            {itemId === "devilHorns" && (
              <g>
                <path d="M 32,56 C 22,42 18,24 30,18 C 36,28 42,42 42,54 Z" fill="#D32F2F" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M 68,56 C 78,42 82,24 70,18 C 64,28 58,42 58,54 Z" fill="#D32F2F" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
              </g>
            )}
            {itemId === "angelHalo" && (
              <g>
                <ellipse cx="50" cy="50" rx="34" ry="12" fill="rgba(255, 215, 0, 0.2)" stroke="#FFD700" strokeWidth="4" />
                <ellipse cx="50" cy="50" rx="26" ry="8" fill="none" stroke="#FFF9C4" strokeWidth="2" />
              </g>
            )}
            {itemId === "crownKing" && (
              <g>
                <polygon points="20,68 20,38 35,50 50,28 65,50 80,38 80,68" fill="#FFC107" stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />
                <circle cx="20" cy="36" r="3.5" fill="#E53935" stroke={strokeColor} strokeWidth="1.2" />
                <circle cx="50" cy="26" r="4" fill="#1E88E5" stroke={strokeColor} strokeWidth="1.2" />
                <circle cx="80" cy="36" r="3.5" fill="#E53935" stroke={strokeColor} strokeWidth="1.2" />
                <circle cx="50" cy="56" r="3" fill="#43A047" />
              </g>
            )}
            {itemId === "witchHat" && (
              <g>
                <path d="M 30,56 Q 52,28 72,12 Q 62,30 76,56 Z" fill="#311B92" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
                <rect x="44" y="52" width="12" height="7" rx="1.5" fill="#FFD54F" stroke={strokeColor} strokeWidth="1.4" />
                <ellipse cx="50" cy="58" rx="38" ry="11" fill="#4527A0" stroke={strokeColor} strokeWidth="2.4" />
              </g>
            )}
            {itemId === "sproutLeaf" && (
              <g>
                <path d="M 50,68 Q 50,48 50,42" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 50,44 C 36,34 32,48 48,50 Z" fill="#66BB6A" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
                <path d="M 50,42 C 64,32 68,46 52,48 Z" fill="#81C784" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
              </g>
            )}
            {itemId === "pirateEyepatch" && (
              <g>
                <line x1="16" y1="36" x2="84" y2="64" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
                <ellipse cx="50" cy="52" rx="16" ry="15" fill="#212121" stroke={strokeColor} strokeWidth="2.5" />
                <circle cx="50" cy="52" r="3.5" fill="#FFFFFF" />
              </g>
            )}
            {itemId === "magicSparkle" && (
              <g fill="#FFD700" stroke={strokeColor} strokeWidth="1.5">
                <path d="M 28,34 Q 28,44 38,44 Q 28,44 28,54 Q 28,44 18,44 Q 28,44 28,34 Z" />
                <circle cx="28" cy="44" r="1.5" fill="#FFFFFF" stroke="none" />
                <path d="M 72,40 Q 72,50 82,50 Q 72,50 72,60 Q 72,50 62,50 Q 72,50 72,40 Z" />
                <circle cx="72" cy="50" r="1.5" fill="#FFFFFF" stroke="none" />
                <path d="M 50,16 Q 50,22 56,22 Q 50,22 50,28 Q 50,22 44,22 Q 50,22 50,16 Z" />
                <circle cx="36" cy="22" r="2.5" fill="#FF80AB" stroke="none" />
                <circle cx="64" cy="22" r="2.5" fill="#00E5FF" stroke="none" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
