import { Avatar3DConfig } from "@/types/avatar3d";

/**
 * 16 Reference 2D Avatars directly created from the reference image (Anna Khramtsova style)
 * 2 rows x 8 columns matching media_1791509843313_cd988d73.png
 */
export const AVATAR_16_PRESETS: { id: string; name: string; description: string; config: Avatar3DConfig }[] = [
  // ROW 1
  {
    id: "r1_c1_bald_beard",
    name: "สกินเฮด",
    description: "ลุคเข้ม เท่ สกินเฮด เคราดกดำ เสื้อยืดลายขวางสีส้มอิฐ",
    config: {
      bgColor: "#F37135",
      skinTone: "#FFF8F2",
      hairStyle: "bald",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "fullBeard",
      facialHairColor: "#1A1A1A",
      glasses: "none",
      clothing: "stripedCrew",
      clothingColor: "#D84315",
      blush: false,
    },
  },
  {
    id: "r1_c2_bangs_blazer",
    name: "ผมประบ่า",
    description: "สาวหวาน ผมประบ่ามีหน้าม้า สวมเบลเซอร์สีชมพูมาดมั่น",
    config: {
      bgColor: "#E96C88",
      skinTone: "#FFF8F2",
      hairStyle: "bangsShoulder",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "blazerTop",
      clothingColor: "#E91E63",
      blush: true,
    },
  },
  {
    id: "r1_c3_curly_polo",
    name: "ผมหยิก",
    description: "หนุ่มผมหยิกฟูน่ารัก ยิ้มสดใส เสื้อคอปกโปโลสีเหลืองสดใส",
    config: {
      bgColor: "#FFCD38",
      skinTone: "#FFF8F2",
      hairStyle: "curlyMop",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "poloCollar",
      clothingColor: "#FFC107",
      blush: false,
    },
  },
  {
    id: "r1_c4_curly_glasses",
    name: "สาวแว่นกลม",
    description: "สาวแว่นกลมสุดคิวท์ ผมดัดลอนสั้น เสื้อคอกลมลึกสีส้ม",
    config: {
      bgColor: "#F37135",
      skinTone: "#FFF8F2",
      hairStyle: "curlyLobGlasses",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "round",
      glassesColor: "#1A1A1A",
      clothing: "scoopNeck",
      clothingColor: "#E65100",
      blush: true,
    },
  },
  {
    id: "r1_c5_spiky_henley",
    name: "ผมสั้นเซอร์",
    description: "หนุ่มลุคชิล ผมซอยสั้นมีเลเยอร์ เสื้อเฮนลีย์คอกระดุมสีฟ้า",
    config: {
      bgColor: "#38B8E8",
      skinTone: "#FFF8F2",
      hairStyle: "spikyMessy",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "buttonHenley",
      clothingColor: "#0288D1",
      blush: false,
    },
  },
  {
    id: "r1_c6_topbun_coral",
    name: "มวยผมบัน",
    description: "สาวแฟชั่น มวยผมบันสูงหยิกฟู เสื้อคอเต่าสีแดงคอรัล",
    config: {
      bgColor: "#EA533D",
      skinTone: "#FFF8F2",
      hairStyle: "topBun",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "turtleneck",
      clothingColor: "#C62828",
      blush: true,
    },
  },
  {
    id: "r1_c7_neatpart_mustache",
    name: "หนุ่มมีหนวด",
    description: "หนุ่มสุภาพบุรุษ ผมแสกข้างเรียบร้อย มีหนวดงาม เสื้อเชิ้ตส้ม",
    config: {
      bgColor: "#F37135",
      skinTone: "#FFF8F2",
      hairStyle: "sidePartNeat",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "neatMustache",
      facialHairColor: "#1A1A1A",
      glasses: "none",
      clothing: "buttonUpShirt",
      clothingColor: "#E65100",
      blush: false,
    },
  },
  {
    id: "r1_c8_bob_pink",
    name: "บ็อบหน้าม้า",
    description: "สาวผมบ็อบสั้นตรง หน้าม้าคลาสสิก เสื้อยืดชมพูสดใส",
    config: {
      bgColor: "#E96C88",
      skinTone: "#FFF8F2",
      hairStyle: "bobBangs",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "classicTee",
      clothingColor: "#E91E63",
      blush: true,
    },
  },

  // ROW 2
  {
    id: "r2_c1_headband_curly",
    name: "สาวคาดผม",
    description: "สาวเปรี้ยว คาดผมสีเหลือง ผมหยิกสั้น เสื้อคอวีลึก",
    config: {
      bgColor: "#FFCD38",
      skinTone: "#FFF8F2",
      hairStyle: "headbandCurly",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "vNeck",
      clothingColor: "#FFA000",
      blush: true,
    },
  },
  {
    id: "r2_c2_rect_glasses",
    name: "แว่นเหลี่ยม",
    description: "หนุ่มไอทีใส่แว่นกรอบเหลี่ยม ผมหวีเป๋ข้าง เสื้อเชิ้ตสีฟ้า",
    config: {
      bgColor: "#38B8E8",
      skinTone: "#FFF8F2",
      hairStyle: "sidePartPrep",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "square",
      glassesColor: "#1A1A1A",
      clothing: "buttonUpShirt",
      clothingColor: "#0288D1",
      blush: false,
    },
  },
  {
    id: "r2_c3_ponytail_glasses",
    name: "สาวโพนี่เทล",
    description: "สาวแอคทีฟ มัดผมหางม้าสูง แว่นตากลม น่ารักสดใส มั่นใจ",
    config: {
      bgColor: "#EA533D",
      skinTone: "#FFF8F2",
      hairStyle: "highPonytail",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "round",
      glassesColor: "#1A1A1A",
      clothing: "classicTee",
      clothingColor: "#C2185B",
      blush: true,
    },
  },
  {
    id: "r2_c4_striped_turtleneck",
    name: "คอเต่า",
    description: "สไตล์มินิมอลโมเดิร์น ผมแสกกลาง เสื้อคอเต่าลายทางตั้ง",
    config: {
      bgColor: "#E96C88",
      skinTone: "#FFF8F2",
      hairStyle: "middlePartSleek",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "stripedTurtle",
      clothingColor: "#E91E63",
      blush: false,
    },
  },
  {
    id: "r2_c5_long_straight",
    name: "สาวผมยาว",
    description: "สาวผมยาวสลวยสีดำ คอกลมกว้างสีส้ม เรียบง่ายแต่ดูดี",
    config: {
      bgColor: "#F37135",
      skinTone: "#FFF8F2",
      hairStyle: "longStraight",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "scoopNeck",
      clothingColor: "#E65100",
      blush: true,
    },
  },
  {
    id: "r2_c6_crew_blue",
    name: "สปอร์ตคัต",
    description: "หนุ่มมั่นใจ ผมสั้นครูว์คัต สะอาดตา เสื้อเชิ้ตสีฟ้าเปิดคอ",
    config: {
      bgColor: "#38B8E8",
      skinTone: "#FFF8F2",
      hairStyle: "crewBuzz",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "buttonUpShirt",
      clothingColor: "#0288D1",
      blush: false,
    },
  },
  {
    id: "r2_c7_pixie_earrings",
    name: "สาวพิกซี่",
    description: "สาวเปรี้ยวเฉี่ยว ทรงผมพิกซี่สั้น ต่างหูห่วงสีทอง เสื้อคอปาด",
    config: {
      bgColor: "#FFCD38",
      skinTone: "#FFF8F2",
      hairStyle: "pixieEarrings",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      accessories: "earrings",
      clothing: "scoopNeck",
      clothingColor: "#FFB300",
      blush: true,
    },
  },
  {
    id: "r2_c8_wavy_orange",
    name: "หนุ่มผมลอน",
    description: "หนุ่มอารมณ์ดี ผมดัดลอนมีวอลลุ่ม เสื้อยืดสีส้มอิฐ",
    config: {
      bgColor: "#EA533D",
      skinTone: "#FFF8F2",
      hairStyle: "wavyCrop",
      hairColor: "#1A1A1A",
      eyes: "dots",
      nose: "hook",
      mouth: "gentleCurve",
      facialHair: "none",
      glasses: "none",
      clothing: "classicTee",
      clothingColor: "#D84315",
      blush: false,
    },
  },
];

// Alias for backwards compatibility
export const AVATAR_20_PRESETS = AVATAR_16_PRESETS;

/**
 * Default avatar mapping for CC Team members
 */
export const MEMBER_DEFAULT_AVATARS: Record<string, string> = {
  "จ๊อบ AA": "r1_c3_curly_polo",
  "เบล": "r1_c2_bangs_blazer",
  "อาร์ต ART": "r1_c5_spiky_henley",
  "โบว์": "r1_c8_bob_pink",
  "นัท Nut": "r2_c2_rect_glasses",
  "พิม PIM": "r2_c5_long_straight",
  "ปู CP": "r2_c7_pixie_earrings",
  "โอ๊ต CNB": "r2_c6_crew_blue",
  "เอ็นจอย SLR": "r1_c4_curly_glasses",
  "แก้ว KYK": "r1_c6_topbun_coral",
  "ต้า TTY": "r1_c1_bald_beard",
  "อ.บ่าว ST": "r1_c7_neatpart_mustache",
  "อ.วิน": "r2_c2_rect_glasses",
  "อ.อ้วน": "r1_c1_bald_beard",
  "อ.กอล์ฟ": "r2_c8_wavy_orange",
  "พี่หนึ่ง": "r2_c6_crew_blue",
};

/**
 * Get avatar config for a member (from localStorage cache, metadata, or preset fallback)
 */
export function getMemberAvatarConfig(memberNameOrId?: string): Avatar3DConfig {
  if (!memberNameOrId) return AVATAR_16_PRESETS[0].config;

  const key = memberNameOrId.trim();

  // 1. Try local storage cache
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`cc_avatar_${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
  }

  // 2. Try match in member default avatars
  const presetId = MEMBER_DEFAULT_AVATARS[key];
  if (presetId) {
    const found = AVATAR_16_PRESETS.find((p) => p.id === presetId);
    if (found) return found.config;
  }

  // 3. Fallback based on deterministic hash of name
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_16_PRESETS.length;
  return AVATAR_16_PRESETS[index].config;
}

/**
 * Save avatar config for a member to localStorage
 */
export function saveMemberAvatarConfigLocally(memberNameOrId: string, config: Avatar3DConfig) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`cc_avatar_${memberNameOrId.trim()}`, JSON.stringify(config));
      // Dispatch storage event so all components reactively update
      window.dispatchEvent(
        new CustomEvent("cc_avatar_updated", {
          detail: { member: memberNameOrId.trim(), config },
        })
      );
    } catch (e) {
      console.warn("Failed to save avatar to localStorage:", e);
    }
  }
}
