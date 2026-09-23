import fs from "fs";
import path from "path";

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

const MEMORY_FILE = path.join(process.cwd(), "src", "data", "line_chat_memory.json");

function loadMemory(): MemoryData {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read line memory file, creating new:", err);
  }
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

function saveMemory(data: MemoryData) {
  try {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write line memory file:", err);
  }
}

export function recordMessage(
  groupId: string,
  senderName: string,
  role: "user" | "assistant",
  text: string
) {
  const memory = loadMemory();
  if (!memory.groups[groupId]) {
    memory.groups[groupId] = [];
  }

  memory.groups[groupId].push({
    senderName,
    role,
    text,
    timestamp: Date.now(),
  });

  if (memory.groups[groupId].length > 20) {
    memory.groups[groupId] = memory.groups[groupId].slice(-20);
  }

  saveMemory(memory);
}

export function getRecentHistory(groupId: string, limit: number = 8): ChatMessage[] {
  const memory = loadMemory();
  const list = memory.groups[groupId] || [];
  return list.slice(-limit);
}

export function recordLearnedFact(fact: string, source: string = "chat") {
  const memory = loadMemory();
  if (!memory.learnedFacts.some((f) => f.fact.includes(fact) || fact.includes(f.fact))) {
    memory.learnedFacts.push({
      fact: fact.trim(),
      learnedAt: new Date().toISOString(),
      source,
    });
    if (memory.learnedFacts.length > 50) {
      memory.learnedFacts = memory.learnedFacts.slice(-50);
    }
    saveMemory(memory);
  }
}

export function getAllLearnedFacts(): string[] {
  const memory = loadMemory();
  return memory.learnedFacts.map((f) => `• ${f.fact}`);
}
