import { NextRequest, NextResponse } from "next/server";
import { saveLineGroupId, getLineGroupIds, getLineQuotaStatus } from "@/utils/lineBotConfig";
import { queryLineAI, getProperCallerName } from "@/utils/lineAiService";
import { recordMessage, recordBotMessageId, isBotMessageId, recordBotActivity, getLastBotActivity } from "@/utils/lineMemoryService";

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

  // Anti-spam cooldown: ignore rapid identical triggers in the same group within 1.0 second
  if (groupId) {
    const now = Date.now();
    const lastTime = lastGroupReplyTime.get(groupId) || 0;
    if (now - lastTime < 1000) {
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
    // a) LINE @Mention specifically targeting the bot (@CC Report / @น้อง CC)
    const isMentioned = !!(event.message?.mention?.mentionees?.some((m: any) => m.isSelf === true));
    
    // b) Calling bot strictly by name (e.g. น้อง cc, @น้อง cc, น้องซีซี)
    const botTriggerRegex = /(?:^|[\s@])(น้อง[\s_]?cc|น้องซีซี|น้อง\s*cc)/i;
    const isNameCalled = botTriggerRegex.test(rawText) || lowerRaw.includes("น้อง cc") || lowerRaw.includes("น้องcc") || lowerRaw.includes("น้องซีซี");
    
    // c) Registration commands (allowed in groups and 1-on-1)
    const isRegistration = lowerRaw.includes("ลงทะเบียน noty") || lowerRaw.includes("ลงทะเบียน cc") || lowerRaw.includes("bind noty") || lowerRaw.includes("bind cc") || lowerRaw === "id" || lowerRaw === "เช็ค id";
    
    // d) LINE Quote Reply: Checked via persisted message IDs or active conversation window
    const quotedMessageId = event.message?.quotedMessageId;
    let isReplyingToBotMessage = false;
    if (quotedMessageId) {
      isReplyingToBotMessage = await isBotMessageId(quotedMessageId);
      if (!isReplyingToBotMessage && groupId) {
        // Fallback: If quoted message ID was not captured (e.g. serverless cold start), check if bot spoke within 15 minutes
        const lastActivity = await getLastBotActivity(groupId);
        if (lastActivity && (Date.now() - lastActivity.timestamp) < 15 * 60 * 1000) {
          isReplyingToBotMessage = true;
        }
      }
    }

    // e) Direct short answer/continuation within 3 minutes of bot speaking in group
    let isConversationContinuation = false;
    if (groupId && !quotedMessageId && !isNameCalled && !isMentioned) {
      const lastActivity = await getLastBotActivity(groupId);
      if (lastActivity && (Date.now() - lastActivity.timestamp) < 3 * 60 * 1000) {
        const isDirectAnswer = /^(kr\s*\/?\s*r|okr|ขอ\s*ลิงก์|ขอ\s*ลิ้งค์|ขอลบิงก์|ลิงก์|ลิ้งค์|ok|โอเค|ครับ|ค่ะ|ขอบคุณ|อันนี้คือ|ตรวจสอบ)/i.test(rawText.trim());
        if (isDirectAnswer) {
          isConversationContinuation = true;
        }
      }
    }

    // In group chats: bot MUST ONLY respond if explicitly called/invoked by name, @mention, direct reply, or active conversation!
    const isExplicitlyInvoked = isMentioned || isNameCalled || isRegistration || isReplyingToBotMessage || isConversationContinuation;

    if (isGroup && !isExplicitlyInvoked) {
      return; // 100% Silent - bot was not called!
    }

    // Clean the trigger word
    const queryText = rawText.replace(botTriggerRegex, "").replace(/@\S+/g, "").trim();
    const text = (queryText || rawText).toLowerCase();

    // 2. Stop / Mute commands: If someone tells the bot to be quiet, stop talking, or not answer, STAY 100% SILENT!
    const isMuteCommand = (
      text.includes("หยุด") ||
      text.includes("เงียบ") ||
      text.includes("พอแล้ว") ||
      text.includes("พักก่อน") ||
      text.includes("อย่าพึ่ง") ||
      text.includes("อย่าเพิ่ง") ||
      text.includes("ไม่ต้องตอบ") ||
      text.includes("ห้ามตอบ") ||
      text.includes("อย่าตอบ") ||
      text.includes("ห้ามตอบคำถามเอง") ||
      text.includes("ไม่ต้องพูด") ||
      text.includes("อย่าพึ่งตอบ") ||
      text.includes("อย่าเพิ่งตอบ") ||
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
      replyText = `ฮายค่าพี่! มีข้อมูลงานอะไรให้น้อง CC ช่วยเช็คแจ้งได้เลยค่า ✨`;
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
      replyText = `ยินดีค่าบ ✨`;
    }
    // 2.1 Group Registration Commands
    else if (lowerRaw.includes("ลงทะเบียน noty") || lowerRaw.includes("bind noty")) {
      if (groupId) {
        await saveLineGroupId("noty", groupId);
        replyText = `✅ [ลงทะเบียนสำเร็จ]\nผูกกลุ่มนี้เป็น "Creative step (NOTY)" เรียบร้อยค่า! น้อง CC จะคอยส่งแจ้งเตือนบรีฟใหม่และ Morning Brief ให้ตรงเวลานะคะ ✨`;
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
    // 2.2.1 Quota Status Query
    else if (text === "โควต้า" || text === "เช็คโควต้า" || text === "quota" || text.includes("โควต้า") || text.includes("quota")) {
      const q = await getLineQuotaStatus();
      replyText = `📊 [สรุปสถานะโควต้า LINE Messaging API ประจำเดือน] 🤖✨
• โควต้ารวมรายเดือน: ${q.total} ข้อความ
• ใช้งานไปแล้ว: ${q.used} ข้อความ
• โควต้าคงเหลือ: ${q.remaining} ข้อความ

👥 การคิดโควต้าตามจำนวนคนในกลุ่ม:
• กลุ่ม Creative step (NOTY): ${q.notyMembers} ท่าน (ส่ง 1 ครั้ง = คิด ${q.notyMembers} ข้อความ)
• กลุ่ม CC TEAM (ผู้บริหาร): ${q.execMembers} ท่าน (ส่ง 1 ครั้ง = คิด ${q.execMembers} ข้อความ)

💡 ระบบตัดการแจ้งเตือนจุกจิกออกแล้ว เพื่อสำรองโควต้าให้ Morning Brief และรายงานผู้บริหารสิ้นเดือนได้ครบถ้วน 100% ครับ!`;
    }
    // 2.3 Ask for Brief Link (Only when explicitly requesting the form/link)
    else if (
      text === "ขอบรีฟ" ||
      text === "ขอลิงก์" ||
      text === "ลิงก์" ||
      text === "ลิงก์บรีฟ" ||
      text === "แบบฟอร์ม" ||
      text === "ส่งงาน" ||
      text === "ขอแบบฟอร์ม" ||
      text.includes("ขอลิงก์บรีฟ") ||
      text.includes("ขอแบบฟอร์ม") ||
      text.includes("ลิงก์ส่งงาน") ||
      text.includes("ส่งงานที่ไหน") ||
      text.includes("ขอฟอร์ม")
    ) {
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://ccteam.vercel.app");
      replyText = `📝 [แบบฟอร์มส่งบรีฟงานทีม CC] ✨\n🔗 ยื่นงานใหม่: ${origin}/request\n🔍 เช็กสถานะงาน: ${origin}/track`;
    }
    // 2.4 Capability & Help Guide
    else if (
      text === "ช่วยอะไร" ||
      text === "ช่วยอะไรได้บ้าง" ||
      text === "เมนู" ||
      text === "คำสั่ง" ||
      text === "ฟังก์ชัน" ||
      text === "แนะนำตัว" ||
      text.includes("ทำอะไรได้บ้าง")
    ) {
      replyText = `🤖 น้อง CC ยินดีช่วยเหลือค่าบ ✨ พี่ๆ สามารถถามได้ทั้ง:\n• "วิเคราะห์งานค้าง / ใครงานค้างมากสุด"\n• "งานของ จ๊อบ / วา / พิม / โอ๊ต เป็นยังไงบ้าง"\n• "ขอรายละเอียดค่า R KR ต่างๆ"\n• "รายงานภาพรวมเดือนนี้"\n• "ขอบรีฟ" หรือเช็กสถานะงานได้ตลอดเลยค่า 🌸`;
    }
    // 2.5 Query AI Engine / Rule Engine for other questions
    else {
      const groupName = groupId === notyGroupId ? "Creative step (NOTY)" : (groupId === execGroupId ? "CC TEAM" : "General");
      const targetId = groupId || userId || "";
      const rawAskerName = await getUserDisplayName(lineToken, groupId, userId);
      const properAskerName = getProperCallerName(rawAskerName);
      
      if (targetId) {
        recordMessage(targetId, properAskerName || "พี่ในทีม", "user", rawText);
      }

      replyText = await queryLineAI(rawText, groupName, targetId, rawAskerName);

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
      const rawAskerName = await getUserDisplayName(lineToken, groupId, userId);
      if (rawAskerName) {
        const callerName = getProperCallerName(rawAskerName);
        finalMessage = `💬 [${callerName}]\n${replyText}`;
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
            if (groupId) recordBotActivity(groupId, finalMessage);
            try {
              const data = await replyRes.json().catch(() => ({}));
              if (data?.sentMessages && Array.isArray(data.sentMessages)) {
                data.sentMessages.forEach((m: any) => {
                  if (m?.id) recordBotMessageId(m.id, groupId, finalMessage);
                });
              }
            } catch (e) {}
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
            if (groupId) recordBotActivity(groupId, finalMessage);
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
