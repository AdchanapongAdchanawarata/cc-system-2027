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
 * Canonical member key resolver: Maps any variant of a member name, email, or id to their official name key
 */
export function resolveCanonicalMemberKey(identifier?: string): string {
  if (!identifier) return "";
  const clean = identifier.trim().toLowerCase();

  if (
    clean.includes("จ๊อบ") ||
    clean.includes("adchanapong") ||
    clean.includes("อัจชนะพงษ์") ||
    clean.includes("job") ||
    clean === "18c2cc99-e677-43fd-bbaf-fcb83e23210e"
  ) {
    return "จ๊อบ AA";
  }
  if (
    clean.includes("วา") ||
    clean.includes("wasita") ||
    clean.includes("วาสิตา") ||
    clean.includes("wk") ||
    clean === "daca31a4-5efd-475e-80ee-b9f38dd381cb"
  ) {
    return "วา WK";
  }
  if (
    clean.includes("ก้อง") ||
    clean.includes("thanawut") ||
    clean.includes("kong") ||
    clean.includes("ธณาวุฒิ") ||
    clean === "fa87becd-45b3-4590-b381-ded430ce7975"
  ) {
    return "ก้อง IK";
  }
  if (
    clean.includes("โอ๊ต") ||
    clean.includes("cnb") ||
    clean === "e2c2672d-81c4-411d-89e9-bcbb6eb374f5"
  ) {
    return "โอ๊ต CNB";
  }
  if (
    clean.includes("เอ็นจอย") ||
    clean.includes("slr") ||
    clean === "a2cf6e47-fc1c-4c19-b080-fe4b57f4a66a"
  ) {
    return "เอ็นจอย SLR";
  }
  if (
    clean.includes("นิน") ||
    clean.includes("mtn") ||
    clean === "82faa669-a2b6-4497-88cf-8556a867176f"
  ) {
    return "นิน MTN";
  }
  if (
    clean.includes("จอย") ||
    clean.includes("rl") ||
    clean === "d99de87a-eb50-4383-a050-1f24a52b4620"
  ) {
    return "จอย RL";
  }
  if (
    clean.includes("พิม") ||
    clean.includes("ac") ||
    clean === "47adfbc2-8d0e-4dc7-87ad-98895be82026"
  ) {
    return "พิม AC";
  }
  if (
    clean.includes("เยียร์") ||
    clean.includes("llp") ||
    clean === "7800682c-8aed-45cf-ab31-45473fd16e3d"
  ) {
    return "เยียร์ LLP";
  }
  if (
    clean.includes("แก้ว") ||
    clean.includes("kyk") ||
    clean === "3ab19406-29cc-4430-b4bf-2cfe9a1c29b7"
  ) {
    return "แก้ว KYK";
  }
  if (
    clean.includes("ต้า") ||
    clean.includes("tty") ||
    clean === "6984154a-2975-4040-a557-aec9d090377f"
  ) {
    return "ต้า TTY";
  }
  if (
    clean.includes("ลูกอิน") ||
    clean.includes("stk") ||
    clean === "b04669b5-6e86-4629-9e66-57d464881653"
  ) {
    return "ลูกอิน STK";
  }
  if (
    clean.includes("อ.บ่าว") ||
    clean.includes("สุริยะ") ||
    clean.includes("suriyah") ||
    clean === "686a3b2e-c83a-48d8-a0c2-fd0dd8fc223a"
  ) {
    return "อ.บ่าว ST";
  }
  if (
    clean.includes("อ.วิน") ||
    clean.includes("วรพจน์") ||
    clean === "b42a9d02-89b8-4876-be17-91ae9e638401"
  ) {
    return "อ.วิน";
  }
  if (clean.includes("อ.อ้วน") || clean === "b90df01a-6595-4f7a-934b-aaaeffda1acd") {
    return "อ.อ้วน";
  }
  if (clean.includes("อ.กอล์ฟ") || clean === "75af9cf4-fb88-4a73-b931-2ed6ae2256dd") {
    return "อ.กอล์ฟ";
  }
  if (clean.includes("พี่หนึ่ง") || clean === "3536b2e1-4a69-47c4-a943-79409d8b741f") {
    return "พี่หนึ่ง";
  }
  if (clean.includes("เบล")) {
    return "เบล";
  }
  if (clean.includes("อาร์ต") || clean.includes("art")) {
    return "อาร์ต ART";
  }
  if (clean.includes("โบว์")) {
    return "โบว์";
  }
  if (clean.includes("นัท") || clean.includes("nut")) {
    return "นัท Nut";
  }
  if (clean.includes("ปู") || clean.includes("cp")) {
    return "ปู CP";
  }

  return identifier.trim();
}

const GLOBAL_AVATAR_KEY = "cc_custom_avatars";

export function getGlobalAvatarCache(): Record<string, Avatar3DConfig> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GLOBAL_AVATAR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

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
  "พิม AC": "r2_c5_long_straight",
  "ปู CP": "r2_c7_pixie_earrings",
  "โอ๊ต CNB": "r2_c6_crew_blue",
  "เอ็นจอย SLR": "r1_c4_curly_glasses",
  "แก้ว KYK": "r1_c6_topbun_coral",
  "ต้า TTY": "r1_c1_bald_beard",
  "นิน MTN": "r2_c2_rect_glasses",
  "จอย RL": "r1_c8_bob_pink",
  "เยียร์ LLP": "r2_c7_pixie_earrings",
  "ลูกอิน STK": "r1_c2_bangs_blazer",
  "ก้อง IK": "r2_c8_wavy_orange",
  "ก้อง": "r2_c8_wavy_orange",
  "วา WK": "r1_c2_bangs_blazer",
  "อ.บ่าว ST": "r1_c7_neatpart_mustache",
  "อ.วิน": "r2_c2_rect_glasses",
  "อ.อ้วน": "r1_c1_bald_beard",
  "อ.กอล์ฟ": "r2_c8_wavy_orange",
  "พี่หนึ่ง": "r2_c6_crew_blue",
};

/**
 * Get avatar config for a member (from localStorage cache, global cache, or preset fallback)
 */
export function getMemberAvatarConfig(memberNameOrId?: string): Avatar3DConfig {
  if (!memberNameOrId) return AVATAR_16_PRESETS[0].config;

  const key = memberNameOrId.trim();
  const canonical = resolveCanonicalMemberKey(key);

  // 1. Try local storage cache (individual keys and global dictionary)
  if (typeof window !== "undefined") {
    try {
      // 1.1 Try individual key
      let stored = localStorage.getItem(`cc_avatar_${key}`);
      if (stored) return JSON.parse(stored);

      // 1.2 Try canonical key
      if (canonical && canonical !== key) {
        stored = localStorage.getItem(`cc_avatar_${canonical}`);
        if (stored) return JSON.parse(stored);
      }

      // 1.3 Try global dictionary cache
      const globalCache = getGlobalAvatarCache();
      if (globalCache[key]) return globalCache[key];
      if (canonical && globalCache[canonical]) return globalCache[canonical];
    } catch {
      // fallback
    }
  }

  // 2. Try match in member default avatars
  const presetId = MEMBER_DEFAULT_AVATARS[canonical] || MEMBER_DEFAULT_AVATARS[key];
  if (presetId) {
    const found = AVATAR_16_PRESETS.find((p) => p.id === presetId);
    if (found) return found.config;
  }

  // 3. Fallback based on deterministic hash of canonical or key
  const hashSource = canonical || key;
  let hash = 0;
  for (let i = 0; i < hashSource.length; i++) {
    hash = (hash << 5) - hash + hashSource.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_16_PRESETS.length;
  return AVATAR_16_PRESETS[index].config;
}

/**
 * Save avatar config for a member to localStorage and global cache
 */
export function saveMemberAvatarConfigLocally(memberNameOrId: string, config: Avatar3DConfig) {
  if (typeof window !== "undefined") {
    try {
      const key = memberNameOrId.trim();
      const canonical = resolveCanonicalMemberKey(key);

      const keysToSave = Array.from(new Set([key, canonical].filter(Boolean)));
      keysToSave.forEach((k) => {
        localStorage.setItem(`cc_avatar_${k}`, JSON.stringify(config));
      });

      const globalCache = getGlobalAvatarCache();
      keysToSave.forEach((k) => {
        globalCache[k] = config;
      });
      localStorage.setItem(GLOBAL_AVATAR_KEY, JSON.stringify(globalCache));

      // Dispatch storage event so all components reactively update
      window.dispatchEvent(
        new CustomEvent("cc_avatar_updated", {
          detail: { member: key, canonicalKey: canonical, config, all: true },
        })
      );
    } catch (e) {
      console.warn("Failed to save avatar to localStorage:", e);
    }
  }
}

/**
 * Sync avatar configurations from Supabase assignees table into localStorage and global cache
 */
export function syncAvatarsFromAssignees(assignees: any[]) {
  if (!Array.isArray(assignees) || typeof window === "undefined") return;
  try {
    let changed = false;
    const globalCache = getGlobalAvatarCache();

    assignees.forEach((a) => {
      const name = a.name?.trim();
      const id = a.id?.trim();
      const rawUnit = a.unit || "";
      if (rawUnit.includes("|")) {
        const parts = rawUnit.split("|");
        if (parts[2]) {
          try {
            const meta = JSON.parse(decodeURIComponent(parts[2]));
            if (meta.avatarConfig && typeof meta.avatarConfig === "object" && meta.avatarConfig.skinTone) {
              const cfg = meta.avatarConfig as Avatar3DConfig;
              const canonical = resolveCanonicalMemberKey(name || id);

              const keysToSync = Array.from(new Set([name, id, canonical].filter(Boolean)));
              keysToSync.forEach((k) => {
                if (k) {
                  globalCache[k] = cfg;
                  localStorage.setItem(`cc_avatar_${k}`, JSON.stringify(cfg));
                }
              });
              changed = true;
            }
          } catch {
            // ignore JSON parse error in individual unit string
          }
        }
      }
    });

    if (changed) {
      localStorage.setItem(GLOBAL_AVATAR_KEY, JSON.stringify(globalCache));
      window.dispatchEvent(
        new CustomEvent("cc_avatar_updated", {
          detail: { all: true },
        })
      );
    }
  } catch (err) {
    console.warn("Failed to sync avatars from assignees:", err);
  }
}
