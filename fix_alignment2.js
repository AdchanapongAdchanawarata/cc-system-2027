const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Change py-[2px] to py-1 in Owner section to match CC Staff
content = content.replaceAll("px-2 py-[2px]", "px-2 py-1");

// Remove hardcoded h-[24px] to let it naturally stretch with py-1
content = content.replaceAll(" h-[24px]", "");

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Fixed vertical alignment heights!");

