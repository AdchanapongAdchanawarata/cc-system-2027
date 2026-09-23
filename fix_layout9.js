const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Change 35%_65% to 55%_45%
content = content.replace(/grid-cols-\\[35%_65%\\]/g, "grid-cols-[55%_45%]");

// Change max-w-4xl to max-w-5xl
content = content.replace(/max-w-4xl/g, "max-w-5xl");

// Change w-[68px] to w-[64px]
content = content.replace(/w-\\[68px\\]/g, "w-[64px]");

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Successfully changed layout!");

