"use client";

import { createClient } from "@/utils/supabase/client";
import { logActivity, getCurrentActor } from "@/utils/auditLogger";

export interface HalloweenScoreEntry {
  id: string;
  playerName: string;
  score: number;
  candiesCaught: number;
  maxCombo: number;
  titleEarned: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = "cc_halloween_leaderboard_v1";
const SUPABASE_CONFIG_KEY = "CONFIG_HALLOWEEN_LEADERBOARD_JSON";

const INITIAL_SEED_SCORES: HalloweenScoreEntry[] = [
  {
    id: "spooky-1",
    playerName: "🎃 ราชาฟักทองฮาโลวีน",
    score: 850,
    candiesCaught: 38,
    maxCombo: 12,
    titleEarned: "🎃 ตำนานเจ้าแห่งภูเขาไฟฮาโลวีน",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-2",
    playerName: "🧙‍♀️ แม่มดน้อยลูกกวาด",
    score: 680,
    candiesCaught: 31,
    maxCombo: 10,
    titleEarned: "🧙‍♂️ จอมเวทขนมหวานระดับปรมาจารย์",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-3",
    playerName: "👻 ปีศาจน้อยแคสเปอร์",
    score: 540,
    candiesCaught: 25,
    maxCombo: 8,
    titleEarned: "👻 นักล่าลูกอมทองคำ",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-4",
    playerName: "🦇 แวมไพร์ดูดลูกอม",
    score: 460,
    candiesCaught: 21,
    maxCombo: 7,
    titleEarned: "👻 นักล่าลูกอมทองคำ",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-5",
    playerName: "🐱 แมวดำเจ้าเล่ห์",
    score: 380,
    candiesCaught: 18,
    maxCombo: 6,
    titleEarned: "🍬 นักสะสมขนมฮาโลวีน",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-6",
    playerName: "🕷️ แมงมุมทอสายรุ้ง",
    score: 310,
    candiesCaught: 15,
    maxCombo: 5,
    titleEarned: "🍬 นักสะสมขนมฮาโลวีน",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-7",
    playerName: "🧟 ซอมบี้หิวกระหายขนม",
    score: 260,
    candiesCaught: 13,
    maxCombo: 4,
    titleEarned: "🍬 นักสะสมขนมฮาโลวีน",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-8",
    playerName: "🦴 โครงกระดูกดุ๊กดิ๊ก",
    score: 210,
    candiesCaught: 11,
    maxCombo: 3,
    titleEarned: "🍬 นักสะสมขนมฮาโลวีน",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-9",
    playerName: "🐺 มนุษย์หมาป่าฟันหวาน",
    score: 180,
    candiesCaught: 9,
    maxCombo: 2,
    titleEarned: "🧁 ผู้เริ่มต้นชิมขนม",
    createdAt: new Date().toISOString(),
  },
  {
    id: "spooky-10",
    playerName: "🍬 มือใหม่หัดชิม",
    score: 140,
    candiesCaught: 7,
    maxCombo: 2,
    titleEarned: "🧁 ผู้เริ่มต้นชิมขนม",
    createdAt: new Date().toISOString(),
  },
];

export function getPlayerTitle(score: number): string {
  if (score >= 600) return "🎃 ตำนานเจ้าแห่งภูเขาไฟฮาโลวีน";
  if (score >= 450) return "🧙‍♂️ จอมเวทขนมหวานระดับปรมาจารย์";
  if (score >= 320) return "👻 นักล่าลูกอมทองคำ";
  if (score >= 200) return "🍬 นักสะสมขนมฮาโลวีน";
  return "🧁 ผู้เริ่มต้นชิมขนม";
}

const REMOVED_SCORE_IDS = new Set([
  "score-1792231049788-ao1x", // สเตป พริ้ว (60438)
  "score-1792230997564-2jgj", // ชิสุกะ ดอยคำ (58448)
  "score-1792132093307-ipvq", // ปีศาจแมวเลีย (57679)
  "score-1792122988669-f5jk", // ผู้เล่นนิรนาม (14706)
]);

function filterRemovedScores(list: HalloweenScoreEntry[]): HalloweenScoreEntry[] {
  return list.filter((entry) => !REMOVED_SCORE_IDS.has(entry.id));
}

function getLocalCachedLeaderboard(): HalloweenScoreEntry[] {
  if (typeof window === "undefined") return INITIAL_SEED_SCORES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return INITIAL_SEED_SCORES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return filterRemovedScores(parsed).sort((a, b) => b.score - a.score);
    }
  } catch (err) {
    console.warn("Failed to parse local cached halloween leaderboard:", err);
  }
  return INITIAL_SEED_SCORES;
}

export async function fetchHalloweenLeaderboard(): Promise<HalloweenScoreEntry[]> {
  const localList = getLocalCachedLeaderboard();

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("okr_settings")
      .select("id, description, target_value")
      .eq("description", SUPABASE_CONFIG_KEY)
      .maybeSingle();

    if (!error && data && data.target_value) {
      try {
        const cloudList = JSON.parse(data.target_value);
        if (Array.isArray(cloudList) && cloudList.length > 0) {
          const sorted = filterRemovedScores(cloudList).sort(
            (a: HalloweenScoreEntry, b: HalloweenScoreEntry) => b.score - a.score
          );
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
          }
          return sorted;
        }
      } catch (e) {
        console.warn("Error parsing cloud halloween leaderboard:", e);
      }
    }

    // If cloud is empty, upload seed
    if (localList && localList.length > 0) {
      await saveLeaderboardToCloud(localList);
    }
  } catch (err) {
    console.warn("Error fetching cloud halloween leaderboard:", err);
  }

  return localList;
}

async function saveLeaderboardToCloud(list: HalloweenScoreEntry[]) {
  try {
    const supabase = createClient();
    const jsonStr = JSON.stringify(list);

    const { data: existing } = await supabase
      .from("okr_settings")
      .select("id")
      .eq("description", SUPABASE_CONFIG_KEY)
      .maybeSingle();

    if (existing && existing.id) {
      await supabase
        .from("okr_settings")
        .update({
          target_value: jsonStr,
          is_active: true,
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("okr_settings")
        .insert([
          {
            type: "KR",
            description: SUPABASE_CONFIG_KEY,
            target_value: jsonStr,
            is_active: true,
          },
        ]);
    }
  } catch (err) {
    console.warn("Failed to save leaderboard to Supabase cloud:", err);
  }
}

export async function submitHalloweenScore(params: {
  playerName: string;
  score: number;
  candiesCaught: number;
  maxCombo: number;
}): Promise<HalloweenScoreEntry[]> {
  const currentLeaderboard = await fetchHalloweenLeaderboard();

  const newEntry: HalloweenScoreEntry = {
    id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    playerName: params.playerName.trim() || "นิรนามผู้กล้า",
    score: params.score,
    candiesCaught: params.candiesCaught,
    maxCombo: params.maxCombo,
    titleEarned: getPlayerTitle(params.score),
    createdAt: new Date().toISOString(),
  };

  const updated = [...currentLeaderboard, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // Keep top 20

  // 1. Save locally
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("cc_halloween_last_player_name", newEntry.playerName);
  }

  // 2. Persist to cloud
  await saveLeaderboardToCloud(updated);

  // 3. Log to audit trail
  try {
    const actor = getCurrentActor();
    await logActivity({
      action: "HALLOWEEN_MINIGAME_SCORE" as any,
      actor_name: newEntry.playerName,
      actor_email: actor.email,
      actor_role: actor.role,
      details: {
        score: newEntry.score,
        candiesCaught: newEntry.candiesCaught,
        maxCombo: newEntry.maxCombo,
        titleEarned: newEntry.titleEarned,
      },
    });
  } catch (err) {
    console.warn("Failed to log halloween activity:", err);
  }

  return updated;
}
