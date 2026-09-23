const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

content = content.replaceAll("w-[64px]", "w-[72px]");

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Reverted label width to 72px!");

