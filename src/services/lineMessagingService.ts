/**
 * ============================================================================
 * LINE MESSAGING & FORMATTING SERVICE
 * ============================================================================
 * แยกส่วนการส่งข้อความ LINE Push API, การแบ่งข้อความยาวเกิน 5,000 ตัวอักษร (Auto-Chunking)
 * และการจัดรูปแบบชื่อ/วันที่/รหัสงาน ออกจาก API Route หลัก เพื่อให้เรียกใช้ซ้ำและดูแลรักษาง่าย
 */

import { recordBotMessageId, recordBotActivity } from "@/utils/lineMemoryService";
import { resolveTaskCode } from "@/utils/taskCodeService";

export function getBangkokNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
}

export function getBangkokDateStr(d: Date = getBangkokNow()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * แบ่งข้อความขนาดยาวออกเป็นก้อนย่อย (Chunks) ก้อนละไม่เกิน 4,000 ตัวอักษรตามย่อหน้า
 * เพื่อป้องกันข้อจำกัด 5,000 ตัวอักษรต่อ 1 บอลลูนของ LINE Messaging API
 */
export function splitTextIntoLineChunks(text: string, maxLen: number = 4000): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const paragraphs = text.split("\n\n");
  let currentChunk = "";

  for (const para of paragraphs) {
    if (!currentChunk) {
      if (para.length > maxLen) {
        const lines = para.split("\n");
        for (const line of lines) {
          if (!currentChunk) {
            currentChunk = line;
          } else if (currentChunk.length + line.length + 1 <= maxLen) {
            currentChunk += "\n" + line;
          } else {
            chunks.push(currentChunk);
            currentChunk = line;
          }
        }
      } else {
        currentChunk = para;
      }
    } else if (currentChunk.length + para.length + 2 <= maxLen) {
      currentChunk += "\n\n" + para;
    } else {
      chunks.push(currentChunk);
      currentChunk = para;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * ส่งข้อความไปยังกลุ่มหรือผู้ใช้ LINE OA พร้อมแบ่ง Batch อัตโนมัติ (สูงสุด 5 บอลลูนต่อ 1 Push Request)
 */
export async function pushLineMessage(targetId: string, text: string, mention?: any) {
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken || !targetId) {
    console.log(`[LINE PUSH SIMULATED (No Token/Target)]: To: ${targetId}\n${text}`);
    return { ok: true, simulated: true };
  }

  const sendRequest = async (payload: any) => {
    return await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify(payload),
    });
  };

  try {
    const chunks = splitTextIntoLineChunks(text, 4000);
    const batches: string[][] = [];
    for (let i = 0; i < chunks.length; i += 5) {
      batches.push(chunks.slice(i, i + 5));
    }

    let overallOk = true;
    let lastError: any = null;

    for (let bIndex = 0; bIndex < batches.length; bIndex++) {
      const batchChunks = batches[bIndex];
      const messageObjs = batchChunks.map((chunk, idx) => {
        const msg: any = { type: "text", text: chunk };
        if (
          bIndex === 0 &&
          idx === 0 &&
          mention &&
          Array.isArray(mention.mentionees) &&
          mention.mentionees.length > 0
        ) {
          msg.mention = mention;
        }
        return msg;
      });

      let res = await sendRequest({
        to: targetId,
        messages: messageObjs,
      });

      if (!res.ok && messageObjs.some((m: any) => m.mention)) {
        console.warn(`[LINE PUSH] Mention failed (${res.status}), retrying without mention object...`);
        const nonMentionObjs = batchChunks.map((chunk) => ({ type: "text", text: chunk }));
        res = await sendRequest({
          to: targetId,
          messages: nonMentionObjs,
        });
      }

      if (res.ok) {
        console.log(
          `[LINE PUSH SUCCESS] To: ${targetId} (Batch ${bIndex + 1}/${batches.length}, Bubbles: ${messageObjs.length})`
        );
        try {
          const resData = await res.json().catch(() => ({}));
          const promises: Promise<any>[] = [];
          if (resData?.sentMessages && Array.isArray(resData.sentMessages)) {
            resData.sentMessages.forEach((m: any) => {
              if (m?.id) promises.push(recordBotMessageId(m.id, targetId, text));
            });
          }
          promises.push(recordBotActivity(targetId, text));
          await Promise.allSettled(promises);
        } catch {}
      } else {
        const err = await res.json().catch(() => ({}));
        console.error(`[LINE PUSH FAILED] (Batch ${bIndex + 1})`, err);
        overallOk = false;
        lastError = err;
        break;
      }
    }

    if (overallOk) {
      return { ok: true };
    } else {
      return { ok: false, error: lastError };
    }
  } catch (err: any) {
    console.error(`[LINE PUSH NETWORK ERROR]`, err);
    return { ok: false, error: err.message };
  }
}

/**
 * แปลงชื่อสมาชิกเป็นชื่อเรียกแบบสุภาพสำหรับรายงาน LINE
 */
export function formatMemberTag(name: string): string {
  if (!name || name === "ยังไม่ระบุผู้รับผิดชอบ" || name === "ยังไม่ระบุ" || name === "ยังไม่มีคนรับ") {
    return "ยังไม่ระบุ";
  }
  const cleanName = name.replace(/@/g, "").trim();
  if (cleanName.includes("วา") || cleanName.toLowerCase().includes("waweewa")) return "พี่วา";
  if (cleanName.includes("จ๊อบ") || cleanName.toLowerCase().includes("job")) return "พี่จ๊อบ";
  if (cleanName.includes("พิม") || cleanName.toLowerCase().includes("autcha")) return "พี่พิม";
  if (cleanName.includes("ก้อง") || cleanName.toLowerCase().includes("itsara")) return "พี่ก้อง";
  if (
    cleanName.includes("แก้ว") ||
    cleanName.toLowerCase().includes("kaewkor") ||
    cleanName.toLowerCase().includes("kyk")
  )
    return "พี่แก้วก่อ";
  if (
    cleanName.includes("เยียร์") ||
    cleanName.toLowerCase().includes("lalynn") ||
    cleanName.toLowerCase().includes("llp")
  )
    return "พี่เยียร์";
  if (
    cleanName.includes("ลูกอิน") ||
    cleanName.toLowerCase().includes("lee") ||
    cleanName.toLowerCase().includes("stk")
  )
    return "พี่ลูกอิน";
  if (cleanName.includes("นิน") || cleanName.toLowerCase().includes("matanin")) return "พี่นิน";
  if (
    cleanName.includes("โอ๊ต") ||
    cleanName.toLowerCase().includes("oat") ||
    cleanName.toLowerCase().includes("cnb")
  )
    return "พี่โอ๊ต";
  if (cleanName.includes("เอ็นจอย") || cleanName.includes("น้องจอย")) return "พี่เอ็นจอย";
  if (cleanName.includes("จอย") || cleanName.toLowerCase().includes("rati")) return "พี่จอย";
  if (
    cleanName.includes("ต้า") ||
    cleanName.toLowerCase().includes("ttar") ||
    cleanName.toLowerCase().includes("tty")
  )
    return "พี่ต้า";
  if (cleanName.includes("หนึ่ง")) return "พี่หนึ่ง";
  if (cleanName.includes("อ้วน") || cleanName.toLowerCase().includes("tanya")) return "อาจารย์อ้วน";
  if (cleanName.includes("กอล์ฟ") || cleanName.toLowerCase().includes("golf")) return "อาจารย์กอล์ฟ";
  if (cleanName.includes("บ่าว") || cleanName.toLowerCase().includes("suriyah")) return "อาจารย์บ่าว";
  if (cleanName.includes("วิน") || cleanName.toLowerCase().includes("win")) return "อาจารย์วิน";
  return cleanName;
}

/**
 * แปลงวันที่กำหนดส่งเป็นรูปแบบภาษาไทยอ่านง่าย (เช่น 10 พ.ย. 69)
 */
export function formatDeadlineThai(dateStr?: string | null): string {
  if (!dateStr) return "ไม่ระบุกำหนดส่ง";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.split("T")[0];
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = (d.getFullYear() + 543) % 100;
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr.split("T")[0];
  }
}

/**
 * ดึงรหัสงานมาตรฐานสำหรับแสดงในข้อความแจ้งเตือน
 */
export function getTaskCodeDisplay(brief: any, allBriefs?: any[]): string {
  if (brief?.details?.task_code) return brief.details.task_code;
  if (brief?.details?.idc_code && brief.details.idc_code.includes("70-")) return brief.details.idc_code;
  if (brief?.details?.rsp_code && brief.details.rsp_code.includes("70-")) return brief.details.rsp_code;
  return resolveTaskCode(brief, allBriefs);
}

/**
 * แปลงรหัสยูนิตเป็นชื่อยูนิตสำหรับแสดงผลในรายงาน
 */
export function formatUnit(unit: string): string {
  const u = (unit || "").toLowerCase();
  if (u.includes("creative") || u.includes("design")) return "Unit Design";
  if (u.includes("content")) return "Unit Content";
  if (u.includes("pr")) return "Unit PR";
  if (u.includes("internal")) return "Internal";
  return unit || "CC";
}
