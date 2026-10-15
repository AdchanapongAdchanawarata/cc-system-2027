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
    id: "seed-1",
    playerName: "จ๊อบ AA",
    score: 520,
    candiesCaught: 24,
    maxCombo: 8,
    titleEarned: "🧙‍♂️ จอมเวทขนมหวานระดับปรมาจารย์",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "seed-2",
    playerName: "วา WK",
    score: 460,
    candiesCaught: 21,
    maxCombo: 7,
    titleEarned: "🧙‍♂️ จอมเวทขนมหวานระดับปรมาจารย์",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "seed-3",
    playerName: "ก้อง IK",
    score: 410,
    candiesCaught: 19,
    maxCombo: 6,
    titleEarned: "👻 นักล่าลูกอมทองคำ",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "seed-4",
    playerName: "เอิร์นวอย SLR",
    score: 360,
    candiesCaught: 17,
    maxCombo: 5,
    titleEarned: "👻 นักล่าลูกอมทองคำ",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "seed-5",
    playerName: "จอย RL",
    score: 310,
    candiesCaught: 15,
    maxCombo: 4,
    titleEarned: "🍬 นักสะสมขนมฮาโลวีน",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: "seed-6",
    playerName: "นิน MTN",
    score: 280,
    candiesCaught: 14,
    maxCombo: 4,
    titleEarned: "🍬 นักสะสมขนมฮาโลวีน",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(),
  },
  {
    id: "seed-7",
    playerName: "พิม AC",
    score: 250,
    candiesCaught: 12,
    maxCombo: 3,
    titleEarned: "🍬 นักสะสมขนมฮาโลวีน",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "seed-8",
    playerName: "เยียร์ LLP",
    score: 220,
    candiesCaught: 11,
    maxCombo: 3,
    titleEarned: "🍬 นักสะสมขนมฮาโลวีน",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
  },
  {
    id: "seed-9",
    playerName: "ลูกอิน STK",
    score: 190,
    candiesCaught: 9,
    maxCombo: 2,
    titleEarned: "🧁 ผู้เริ่มต้นชิมขนม",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: "seed-10",
    playerName: "โอ๊ต CNB",
    score: 160,
    candiesCaught: 8,
    maxCombo: 2,
    titleEarned: "🧁 ผู้เริ่มต้นชิมขนม",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 66).toISOString(),
  },
];

export function getPlayerTitle(score: number): string {
  if (score >= 600) return "🎃 ตำนานเจ้าแห่งภูเขาไฟฮาโลวีน";
  if (score >= 450) return "🧙‍♂️ จอมเวทขนมหวานระดับปรมาจารย์";
  if (score >= 320) return "👻 นักล่าลูกอมทองคำ";
  if (score >= 200) return "🍬 นักสะสมขนมฮาโลวีน";
  return "🧁 ผู้เริ่มต้นชิมขนม";
}

function getLocalCachedLeaderboard(): HalloweenScoreEntry[] {
  if (typeof window === "undefined") return INITIAL_SEED_SCORES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return INITIAL_SEED_SCORES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => b.score - a.score);
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
          const sorted = cloudList.sort((a: HalloweenScoreEntry, b: HalloweenScoreEntry) => b.score - a.score);
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
