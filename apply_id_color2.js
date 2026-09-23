const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

content = content.replace(
  `<span className="text-[#ff7a00] mr-3 mt-1 shrink-0">{taskCode}</span>`,
  `<span className={\`mr-3 mt-1 shrink-0 transition-colors \${brief.unit?.toLowerCase() === "creative" ? "text-[#FF7A00]" : brief.unit?.toLowerCase() === "content" ? "text-[#E1306C]" : brief.unit?.toLowerCase() === "pr" ? "text-[#1877F2]" : brief.unit?.toLowerCase() === "internal" ? "text-black" : "text-[#00a884]"}\`}>{taskCode}</span>`
);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Updated ID color in Modal!");

