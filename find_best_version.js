const fs = require("fs");
const lines = fs.readFileSync("C:/Users/aaadc/.gemini/antigravity/brain/70a4b885-1b25-475d-9274-c0f5a3dfd5ef/.system_generated/logs/transcript_full.jsonl", "utf8").split("\n");

let bestCode = "";
for (let line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (let call of data.tool_calls) {
        if (call.name === "write_to_file" && call.args && call.args.TargetFile && call.args.TargetFile.includes("BriefDetailsModal.tsx")) {
           if (call.args.CodeContent && call.args.CodeContent.length > bestCode.length) {
             bestCode = call.args.CodeContent;
           }
        }
        if (call.name === "replace_file_content" && call.args && call.args.TargetFile && call.args.TargetFile.includes("BriefDetailsModal.tsx")) {
           // wait, replace_file_content doesnt have full code, but it has ReplacementContent.
        }
      }
    }
    // Check if view_file returned the full file!
    if (data.type === "TOOL_RESPONSE" && data.content && data.content.includes("BriefDetailsModal.tsx") && data.content.includes("Total Lines: 503")) {
       // wait, view_file returns line numbered output. We can parse it!
    }
  } catch(e) {}
}

if (bestCode) {
  console.log("Found best CodeContent length:", bestCode.length);
  fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", bestCode, "utf8");
} else {
  console.log("No best code found from write_to_file.");
}

