const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

content = content.replaceAll("grid-cols-[35%_65%]", "grid-cols-[55%_45%]");
content = content.replaceAll("max-w-4xl", "max-w-5xl");
content = content.replaceAll("w-[68px]", "w-[64px]");

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Replaced using string literals!");

