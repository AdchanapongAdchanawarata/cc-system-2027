const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/AssignmentsView.tsx", "utf8");

content = content.replace(
  `<span className="text-[#ff7a00] font-bold mr-1">{getTaskCode(brief.unit, brief.id)}</span>`,
  `<span className={\`font-bold mr-1 \${brief.unit?.toLowerCase() === "creative" ? "text-[#FF7A00]" : brief.unit?.toLowerCase() === "content" ? "text-[#E1306C]" : brief.unit?.toLowerCase() === "pr" ? "text-[#1877F2]" : brief.unit?.toLowerCase() === "internal" ? "text-black" : "text-[#00a884]"}\`}>{getTaskCode(brief.unit, brief.id)}</span>`
);

fs.writeFileSync("src/app/dashboard/components/AssignmentsView.tsx", content, "utf8");
console.log("Updated ID color in Kanban Board!");

