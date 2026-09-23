const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Change grid to 55% / 45% for BOTH cards so Assignee/Deadline are larger than Unit/Priority, and alignment is preserved.
content = content.replace(
  /className="grid grid-cols-2 gap-x-2 gap-y-3"/g,
  `className="grid grid-cols-[55%_45%] gap-x-2 gap-y-3"`
);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Updated to 55/45 ratio!");

