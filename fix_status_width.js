const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

content = content.replaceAll(
  `triggerClassName={\`w-40 font-black uppercase tracking-widest text-[13px] px-3 py-1.5 rounded-full cursor-pointer border-2 shadow-sm transition-colors bg-white text-center \${`,
  `triggerClassName={\`w-48 font-black uppercase tracking-widest text-[13px] px-3 py-1.5 rounded-full cursor-pointer border-2 shadow-sm transition-colors bg-white text-center \${`
);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Updated status width to w-48!");

