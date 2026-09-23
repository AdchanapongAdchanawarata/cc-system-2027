// src/utils/surveyTokens.ts
// ระบบสร้างและตรวจสอบ Token สำหรับแบบประเมินความพึงพอใจ (แบบไม่ระบุชื่อบุคคล)

const TOKEN_SALT = "CC_TEAM_SATISFACTION_SURVEY_SECRET_SALT_2027";

/**
 * Deterministic hash function that generates a consistent, irreversible 16-character hex token.
 * Works uniformly in both browser and Node.js environments without external dependencies.
 */
function createHashToken(input: string, prefix = "cc"): string {
  const combined = `${TOKEN_SALT}:${input}`;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c64e6d ^ 0;

  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${prefix}_${hex1}${hex2}`;
}

/**
 * Generate an obfuscated, unpredictable survey token for a member.
 * Example result: "ev_8f1a4e2b9c7d015a"
 */
export function generateMemberSurveyToken(assigneeId: string): string {
  if (!assigneeId) return "";
  return createHashToken(`member_${assigneeId}`, "ev");
}

/**
 * Generate an obfuscated survey token for a specific task / brief.
 */
export function generateTaskSurveyToken(briefId: string): string {
  if (!briefId) return "";
  return createHashToken(`task_${briefId}`, "tk");
}

/**
 * Resolve which member corresponds to the survey token.
 * Iterates through assignees and finds matching token without leaking identity to the client.
 */
export function resolveMemberFromToken<T extends { id: string }>(
  token: string,
  assignees: T[]
): T | null {
  if (!token || !Array.isArray(assignees)) return null;
  const cleanToken = token.trim();
  for (const assignee of assignees) {
    if (generateMemberSurveyToken(assignee.id) === cleanToken) {
      return assignee;
    }
  }
  return null;
}

/**
 * Get public URL for a member's anonymous satisfaction survey.
 */
export function getMemberSurveyUrl(assigneeId: string, origin?: string): string {
  const token = generateMemberSurveyToken(assigneeId);
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/survey?t=${token}`;
}

/**
 * Get public URL for a specific task survey.
 */
export function getTaskSurveyUrl(briefId: string, assigneeId?: string, origin?: string): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams();
  if (briefId) params.set("b", briefId);
  if (assigneeId) {
    params.set("t", generateMemberSurveyToken(assigneeId));
  }
  return `${base}/survey?${params.toString()}`;
}
