const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// We want to replace the `w-16 flex items-center gap-1` with `w-20 flex items-center gap-1`
content = content.replace(/className="w-16 flex items-center gap-1 text-slate-400"/g, `className="w-20 flex items-center gap-1 text-slate-400"`);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Replaced all w-16 with w-20 for labels!");

