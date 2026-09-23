const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// 1. Remove the two gray badges
content = content.replace(`<span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"><CheckCircle2 size={14}/> Task</span>`, "");
content = content.replace(`<span className="bg-slate-100 px-2 py-1 rounded tracking-widest uppercase">ID: {taskCode}</span>`, "");

// 2. Make status badge larger
const oldStatusCode = `triggerClassName={\`w-32 font-bold uppercase tracking-wider text-[11px] px-2 py-1 rounded-full cursor-pointer border shadow-sm transition-colors bg-white \${`;
const newStatusCode = `triggerClassName={\`w-40 font-black uppercase tracking-widest text-[13px] px-3 py-1.5 rounded-full cursor-pointer border-2 shadow-sm transition-colors bg-white text-center \${`;

content = content.replace(oldStatusCode, newStatusCode);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Updated status badge!");

