import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export interface ChatMessage {
  senderName: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface MemoryData {
  groups: Record<string, ChatMessage[]>;
  learnedFacts: { fact: string; learnedAt: string; source: string }[];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const MEMORY_FILE = path.join(process.cwd(), "src", "data", "line_chat_memory.json");

// In-memory cache
let inMemoryData: MemoryData | null = null;
const botSentMessageIds = new Set<string>();
const lastBotActivityByGroup = new Map<string, { timestamp: number; text: string }>();

function getDefaultMemory(): MemoryData {
  return {
    groups: {},
    learnedFacts: [
      {
        fact: "ทีมสร้างสรรค์และการสื่อสาร (Creative and Communication - CC) ประจำอยู่ที่อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (STeP)",
        learnedAt: new Date().toISOString(),
        source: "system",
      },
      {
        fact: "พี่พิม (พิม AC) ทำหน้าที่ดูแลงานด้าน Creative Design และงานระบบหลายโปรเจกต์ เช่น บูธ TGS 2027 และถ่ายภาพผู้บริหาร",
        learnedAt: new Date().toISOString(),
        source: "system",
      },
      {
        fact: "คุณ job เป็นหนึ่งในพี่คนสำคัญของทีมที่คอยประสานงานและดูแลความเรียบร้อยของทีม CC",
        learnedAt: new Date().toISOString(),
        source: "chat",
      },
    ],
  };
}

// Load memory from in-memory cache, filesystem, or Supabase
export async function loadMemoryAsync(): Promise<MemoryData> {
  if (inMemoryData) return inMemoryData;

  // 1. Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("okr_settings")
        .select("target_value")
        .eq("description", "CONFIG_LINE_CHAT_MEMORY")
        .maybeSingle();

      if (data?.target_value) {
        const parsed = JSON.parse(data.target_value);
        if (parsed && typeof parsed === "object") {
          inMemoryData = parsed;
          return inMemoryData!;
        }
      }
    } catch (err) {
      console.warn("[LINE MEMORY] Failed to load from Supabase:", err);
    }
  }

  // 2. Try Local File
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
      inMemoryData = JSON.parse(raw);
      return inMemoryData!;
    }
  } catch (err) {
    console.warn("[LINE MEMORY] Failed to read local file:", err);
  }

  inMemoryData = getDefaultMemory();
  return inMemoryData;
}

export function loadMemorySync(): MemoryData {
  if (inMemoryData) return inMemoryData;
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
      inMemoryData = JSON.parse(raw);
      return inMemoryData!;
    }
  } catch (err) {}
  inMemoryData = getDefaultMemory();
  return inMemoryData;
}

// Save memory asynchronously to Supabase and filesystem
async function saveMemoryAsync(data: MemoryData) {
  inMemoryData = data;

  // 1. Save to Supabase (Background)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = JSON.stringify(data);
      const { data: existing } = await supabase
        .from("okr_settings")
        .select("id")
        .eq("description", "CONFIG_LINE_CHAT_MEMORY")
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from("okr_settings")
          .update({ target_value: payload })
          .eq("id", existing.id);
      } else {
        await supabase.from("okr_settings").insert({
          type: "KR",
          description: "CONFIG_LINE_CHAT_MEMORY",
          target_value: payload,
          is_active: true,
        });
      }
    } catch (err) {
      console.warn("[LINE MEMORY] Failed to sync to Supabase:", err);
    }
  }

  // 2. Save to local file if writable
  try {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {}
}

export function recordMessage(
  groupId: string,
  senderName: string,
  role: "user" | "assistant",
  text: string
) {
  const memory = loadMemorySync();
  if (!memory.groups[groupId]) {
    memory.groups[groupId] = [];
  }

  memory.groups[groupId].push({
    senderName,
    role,
    text,
    timestamp: Date.now(),
  });

  if (memory.groups[groupId].length > 30) {
    memory.groups[groupId] = memory.groups[groupId].slice(-30);
  }

  if (role === "assistant") {
    recordBotActivity(groupId, text);
  }

  saveMemoryAsync(memory).catch(() => {});
}

export function getRecentHistory(groupId: string, limit: number = 8): ChatMessage[] {
  const memory = loadMemorySync();
  const list = memory.groups[groupId] || [];
  return list.slice(-limit);
}

export function recordLearnedFact(fact: string, source: string = "chat") {
  const memory = loadMemorySync();
  if (!memory.learnedFacts.some((f) => f.fact.includes(fact) || fact.includes(f.fact))) {
    memory.learnedFacts.push({
      fact: fact.trim(),
      learnedAt: new Date().toISOString(),
      source,
    });
    if (memory.learnedFacts.length > 50) {
      memory.learnedFacts = memory.learnedFacts.slice(-50);
    }
    saveMemoryAsync(memory).catch(() => {});
  }
}

export function getAllLearnedFacts(): string[] {
  const memory = loadMemorySync();
  return memory.learnedFacts.map((f) => `• ${f.fact}`);
}

// -------------------------------------------------------------
// BOT SENT MESSAGE ID PERSISTENCE (Handles Multi-Instance Serverless)
// -------------------------------------------------------------

export function recordBotActivity(groupId: string, text: string) {
  if (!groupId) return;
  lastBotActivityByGroup.set(groupId, { timestamp: Date.now(), text });

  // Sync to Supabase in background
  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        const { data: existing } = await supabase
          .from("okr_settings")
          .select("id, target_value")
          .eq("description", "CONFIG_LINE_BOT_MESSAGES")
          .maybeSingle();

        let currentObj: any = { ids: [], lastActivity: {} };
        if (existing?.target_value) {
          try {
            currentObj = JSON.parse(existing.target_value);
          } catch {}
        }
        if (!currentObj.lastActivity) currentObj.lastActivity = {};
        currentObj.lastActivity[groupId] = { timestamp: Date.now(), text: (text || "").slice(0, 200) };

        const payload = JSON.stringify(currentObj);
        if (existing?.id) {
          await supabase.from("okr_settings").update({ target_value: payload }).eq("id", existing.id);
        } else {
          await supabase.from("okr_settings").insert({
            type: "KR",
            description: "CONFIG_LINE_BOT_MESSAGES",
            target_value: payload,
            is_active: true,
          });
        }
      } catch (err) {
        console.warn("[BOT ACTIVITY] Sync error:", err);
      }
    })();
  }
}

export async function getLastBotActivity(groupId: string): Promise<{ timestamp: number; text: string } | null> {
  if (!groupId) return null;
  // 1. In-memory
  const mem = lastBotActivityByGroup.get(groupId);
  if (mem) return mem;

  // 2. Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("okr_settings")
        .select("target_value")
        .eq("description", "CONFIG_LINE_BOT_MESSAGES")
        .maybeSingle();

      if (data?.target_value) {
        const parsed = JSON.parse(data.target_value);
        if (parsed.lastActivity && parsed.lastActivity[groupId]) {
          lastBotActivityByGroup.set(groupId, parsed.lastActivity[groupId]);
          return parsed.lastActivity[groupId];
        }
      }
    } catch {}
  }
  return null;
}

export function recordBotMessageId(id: string, groupId?: string, text?: string) {
  if (!id) return;
  botSentMessageIds.add(id);

  if (groupId && text) {
    recordBotActivity(groupId, text);
  }

  // Persist to Supabase
  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        const { data: existing } = await supabase
          .from("okr_settings")
          .select("id, target_value")
          .eq("description", "CONFIG_LINE_BOT_MESSAGES")
          .maybeSingle();

        let currentObj: any = { ids: [], lastActivity: {} };
        if (existing?.target_value) {
          try {
            currentObj = JSON.parse(existing.target_value);
          } catch {}
        }
        if (!Array.isArray(currentObj.ids)) currentObj.ids = [];
        if (!currentObj.ids.includes(id)) {
          currentObj.ids.push(id);
          if (currentObj.ids.length > 500) {
            currentObj.ids = currentObj.ids.slice(-500);
          }
        }
        if (groupId && text) {
          if (!currentObj.lastActivity) currentObj.lastActivity = {};
          currentObj.lastActivity[groupId] = { timestamp: Date.now(), text: text.slice(0, 200) };
        }

        const payload = JSON.stringify(currentObj);
        if (existing?.id) {
          await supabase.from("okr_settings").update({ target_value: payload }).eq("id", existing.id);
        } else {
          await supabase.from("okr_settings").insert({
            type: "KR",
            description: "CONFIG_LINE_BOT_MESSAGES",
            target_value: payload,
            is_active: true,
          });
        }
      } catch (err) {
        console.warn("[BOT MSG ID] Sync error:", err);
      }
    })();
  }
}

export async function isBotMessageId(id: string): Promise<boolean> {
  if (!id) return false;
  // 1. In memory
  if (botSentMessageIds.has(id)) return true;

  // 2. Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("okr_settings")
        .select("target_value")
        .eq("description", "CONFIG_LINE_BOT_MESSAGES")
        .maybeSingle();

      if (data?.target_value) {
        const parsed = JSON.parse(data.target_value);
        if (Array.isArray(parsed.ids) && parsed.ids.includes(id)) {
          botSentMessageIds.add(id);
          return true;
        }
      }
    } catch {}
  }
  return false;
}
