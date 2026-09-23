const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// 1. Restore 50/50 grid
content = content.replace(
  /className="grid grid-cols-\\[35%_65%\\] gap-x-2 gap-y-3"/g,
  `className="grid grid-cols-2 gap-x-2 gap-y-3"`
);

// 2. Change max-w-4xl to max-w-5xl
content = content.replace(/max-w-4xl/g, "max-w-5xl");

// 3. Change w-[68px] to w-[64px] to make the gap slightly smaller
content = content.replace(/w-\\[68px\\]/g, "w-[64px]");

// 4. Change DatePicker width back to full so it fills the 50% correctly
// wait, DatePicker input is already w-full.

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Restored 50/50 balance and increased modal width!");

