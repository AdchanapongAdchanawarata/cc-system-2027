const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Restore all Owner labels to a fixed width of 68px
content = content.replace(/className="w-auto pr-2 flex items-center gap-1 text-slate-400"/g, `className="w-[68px] flex items-center gap-1 text-slate-400"`);

// Reduce CC Staff labels from 72px to 68px to match and save space
content = content.replace(/className="w-\\[72px\\] flex items-center gap-1 text-slate-400"/g, `className="w-[68px] flex items-center gap-1 text-slate-400"`);

// Change the inner grids from 50/50 to 40/60
// Currently it is className="grid grid-cols-2 gap-x-2 gap-y-3"
content = content.replace(
  /className="grid grid-cols-2 gap-x-2 gap-y-3"/g,
  `className="grid grid-cols-[42%_58%] gap-x-2 gap-y-3"`
);

// Reduce Email text size slightly to ensure it fits perfectly
content = content.replace(
  /text-\\[11px\\] text-slate-700 hover:text-primary transition-colors px-1\\.5 py-1 break-all/g,
  `text-[10px] text-slate-700 hover:text-primary transition-colors px-1.5 py-1 break-all`
);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Alignment and grid ratio fixed!");

