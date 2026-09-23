import { NextRequest, NextResponse } from "next/server";
import { saveLineGroupId, getLineGroupIds } from "@/utils/lineBotConfig";
import { queryLineAI } from "@/utils/lineAiService";
import { recordMessage } from "@/utils/lineMemoryService";

// Helper to fetch user's LINE display name
async function getUserDisplayName(lineToken: string, groupId?: string, userId?: string): Promise<string> {
  if (!userId || !lineToken) return "";
  try {
    const url = groupId
      ? `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`
      : `https://api.line.me/v2/bot/profile/${userId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${lineToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.displayName || "";
    }
  } catch (err) {
    console.warn("Could not fetch user profile:", err);
  }
  return "";
}

export async function GET() {
  return NextResponse.json({ status: "LINE Webhook endpoint is active" });
}

// Cooldown map to prevent back-to-back spamming in the same group (2.5s window)
const lastGroupReplyTime = new Map<string, number>();

async function handleLineEvent(
  event: any,
  lineToken: string,
  notyGroupId: string,
  execGroupId: string
) {
  const source = event.source;
  const replyToken = event.replyToken;

  console.log("[LINE WEBHOOK EVENT]", JSON.stringify(event, null, 2));

  const groupId = source?.groupId || source?.roomId;
  const userId = source?.userId;

  if (!lineToken) return;

  // Anti-spam cooldown: ignore triggers in the same group within 2.5 seconds
  if (groupId) {
    const now = Date.now();
    const lastTime = lastGroupReplyTime.get(groupId) || 0;
    if (now - lastTime < 2500) {
      console.log("[LINE COOLDOWN] Skipping rapid trigger in group to prevent clutter");
      return;
    }
  }

  let replyText = "";

  // 1. Join Event (When bot is added to a group)
  if (event.type === "join") {
    replyText = `สวัสดีค่าพี่ๆ! 🤖 น้อง CC น้องเล็ก Gen Z มารายงานตัวแล้วค่าา 💖✨\n\n📌 Group ID: ${groupId}\n• ถ้ากลุ่มนี้คือ "Creative step (NOTY)": พิมพ์ "ลงทะเบียน noty"\n• ถ้ากลุ่มนี้คือ "CC TEAM": พิมพ์ "ลงทะเบียน cc"`;
  } 
  // 2. Message Event
  else if (event.type === "message" && event.message?.type === "text") {
    const isGroup = !!groupId;
    const rawText = (event.message.text || "").trim();
    const lowerRaw = rawText.toLowerCase();

    // 1. Check if bot is explicitly called/invoked:
    // In GROUP CHATS, น้อง CC must NEVER chime in unless explicitly called or @mentioned!
    // a) LINE @Mention (@CC Report / @น้อง CC)
    const isMentioned = !!(event.message?.mention?.mentionees?.some((m: any) => m.isSelf === true));
    // b) Calling bot explicitly by name (e.g. น้อง cc, @น้อง cc, cc, น้องซีซี)
    const botTriggerRegex = /น้อง[\s_]?cc|@น้อง[\s_]?cc|@cc|^cc\b|น้องซีซี|น้อง\s*cc/i;
    const isNameCalled = botTriggerRegex.test(rawText);
    // c) Registration commands (allowed in groups and 1-on-1)
    const isRegistration = lowerRaw.includes("ลงทะเบียน") || lowerRaw.includes("bind") || lowerRaw === "id" || lowerRaw === "เช็ค id";

    // Strict invocation check: In groups, bot wakes up if mentioned, called by name, or running registration/ID commands
    const isExplicitlyInvoked = isMentioned || isNameCalled || isRegistration;

    // In group chats: 100% STRICT SILENCE if nobody explicitly called the bot!
    // Never reply just because a user swiped to quote/reply to another user or an old message!
    if (isGroup && !isExplicitlyInvoked) {
      return;
    }

    // Clean the trigger word
    const queryText = rawText.replace(botTriggerRegex, "").replace(/@\S+/g, "").trim();
    const text = (queryText || rawText).toLowerCase();

    // 2. Stop / Mute commands: If someone tells the bot to be quiet or stop talking, STAY 100% SILENT!
    const isMuteCommand = (
      text.includes("หยุด") ||
      text.includes("เงียบ") ||
      text.includes("พอแล้ว") ||
      text.includes("พักก่อน") ||
      text.includes("อย่าพึ่ง") ||
      text.includes("อย่าเพิ่ง") ||
      text.includes("ไม่ต้องตอบ") ||
      text.includes("ห้ามตอบ") ||
      text.includes("stop") ||
      text.includes("quiet") ||
      text.includes("shut up")
    );

    if (isMuteCommand) {
      console.log("[LINE BOT MUTED/STOPPED BY USER]");
      return;
    }

    // If user just called/mentioned "น้อง CC" without any query
    if (isGroup && !queryText && !isRegistration) {
      replyText = `ฮายค่าพี่! มีอะไรให้น้อง CC ช่วยบอกได้เลยน้าา ✨🌸`;
    }
    // 3. Ending words & quick receipts: STAY SILENT to let the chat rest!
    else if (
      text.startsWith("555") || text === "โอเค" || text === "เค" || text === "รับทราบ" ||
      text === "ok" || text === "เยี่ยม" || text === "สุดยอด" || text === "thx"
    ) {
      return; // Do not bump the chat!
    }
    else if (
      text === "ขอบคุณ" || text === "ขอบคุณครับ" || text === "ขอบคุณค่ะ" || text === "ขอบใจ" ||
      text === "แต๊งกิ้ว" || text === "thank" || text === "thanks"
    ) {
      replyText = `ยินดีค่าบ 💖`;
    }
    // 2.1 Group Registration Commands
    else if (lowerRaw.includes("ลงทะเบียน noty") || lowerRaw.includes("bind noty")) {
      if (groupId) {
        await saveLineGroupId("noty", groupId);
        replyText = `✅ [ลงทะเบียนสำเร็จ]\nผูกกลุ่มนี้เป็น "Creative step (NOTY)" เรียบร้อยค่า! น้อง CC จะคอยส่งแจ้งเตือนบรีฟใหม่และ Morning Brief ให้ตรงเวลาน้าา 🌸`;
      } else {
        replyText = `⚠️ คำสั่งนี้ใช้สำหรับลงทะเบียนใน "กลุ่ม LINE" เท่านั้นค่า`;
      }
    } else if (lowerRaw.includes("ลงทะเบียน cc") || lowerRaw.includes("bind cc")) {
      if (groupId) {
        await saveLineGroupId("exec", groupId);
        replyText = `✅ [ลงทะเบียนสำเร็จ]\nผูกกลุ่มนี้เป็น "CC TEAM" เรียบร้อยค่า! พร้อมจัดส่งรายงานประจำเดือนให้ท่านผู้บริหารและพี่ๆ ทุกคนค่า 📈`;
      } else {
        replyText = `⚠️ คำสั่งนี้ใช้สำหรับลงทะเบียนใน "กลุ่ม LINE" เท่านั้นค่า`;
      }
    }
    // 2.2 ID Query
    else if (text === "id" || text === "รหัส" || text === "group id") {
      const groupRole = groupId === notyGroupId ? "Creative step (NOTY)" : (groupId === execGroupId ? "CC TEAM" : "ยังไม่ได้ผูกกลุ่ม");
      replyText = `📌 ข้อมูล ID ระบบ LINE:\n• Group ID: ${groupId || "ไม่ใช่แชทกลุ่ม"}\n• บทบาทกลุ่ม: ${groupRole}`;
    }
    // 2.3 Ask for Brief Link (Compact & Non-cluttering)
    else if (text.includes("บรีฟ") || text.includes("ขอลิงก์") || text.includes("ฟอร์ม") || text.includes("ส่งงาน") || text.includes("brief")) {
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://cc-insights.step.cmu.ac.th");
      replyText = `📝 [แบบฟอร์มส่งบรีฟงานทีม CC] 💖✨\n🔗 ยื่นงานใหม่: ${origin}/request\n🔍 เช็กสถานะงาน: ${origin}/track\nส่งกำลังใจให้พี่ๆ ทุกคนค่าา อย่าลืมพักสายตาด้วยน้า 🧋`;
    }
    // 2.4 Capability & Help Guide
    else if (text.includes("ฟังก์ชัน") || text.includes("แนะนำตัว") || text.includes("ช่วยอะไร") || text.includes("เมนู") || text.includes("คำสั่ง")) {
      replyText = `🤖 น้อง CC ช่วยอะไรได้บ้าง:\n• "ขอบรีฟ" (ขอลิงก์ส่งงาน)\n• "งานด่วน" / "งานวันนี้" (เช็คเดดไลน์)\n• "งานค้าง" / "ความผิดปกติ" (ตรวจระบบ)\n• หรือชวนคุยเล่น คิดไอเดีย สุขภาพ ได้หมดเลยค่าา ✨🌸`;
    }
    // 2.5 Query AI Engine / Rule Engine for other questions
    else {
      const groupName = groupId === notyGroupId ? "Creative step (NOTY)" : (groupId === execGroupId ? "CC TEAM" : "General");
      const targetId = groupId || userId || "";
      const askerName = await getUserDisplayName(lineToken, groupId, userId);
      
      if (targetId) {
        recordMessage(targetId, askerName || "พี่ในทีม", "user", rawText);
      }

      replyText = await queryLineAI(rawText, groupName, targetId, askerName);

      if (targetId && replyText) {
        recordMessage(targetId, "น้อง CC", "assistant", replyText);
      }
    }
  }

  // Send reply message with user mention in groups (Compact header)
  if (replyText) {
    if (groupId) {
      lastGroupReplyTime.set(groupId, Date.now());
    }

    let finalMessage = replyText;
    if (event.type === "message" && groupId) {
      const askerName = await getUserDisplayName(lineToken, groupId, userId);
      if (askerName) {
        finalMessage = `💬 [คุณ ${askerName}]\n${replyText}`;
      }
    }

    try {
      let sent = false;
      if (replyToken) {
        const replyRes = await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lineToken}`,
          },
          body: JSON.stringify({
            replyToken,
            messages: [{ type: "text", text: finalMessage }],
          }),
        });

        if (replyRes.ok) {
          sent = true;
          console.log("[LINE REPLY SUCCESS]");
        } else {
          const errText = await replyRes.text();
          console.warn(`[LINE REPLY FAILED status=${replyRes.status}]: ${errText}. Falling back to Push API!`);
        }
      }

      // Fallback to push message directly to group/user if reply was not sent or failed
      if (!sent) {
        const targetId = groupId || userId;
        if (targetId) {
          const pushRes = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${lineToken}`,
            },
            body: JSON.stringify({
              to: targetId,
              messages: [{ type: "text", text: finalMessage }],
            }),
          });
          console.log(`[LINE PUSH FALLBACK] Status: ${pushRes.status}`);
        }
      }
    } catch (err) {
      console.error("[LINE SEND ERROR]", err);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
    const { notyGroupId, execGroupId } = await getLineGroupIds();

    for (const event of events) {
      await handleLineEvent(event, lineToken, notyGroupId, execGroupId).catch(err => {
        console.error("[EVENT PROCESSING ERROR]", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[LINE WEBHOOK ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
