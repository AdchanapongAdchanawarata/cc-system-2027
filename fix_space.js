const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// 1. Change w-20 to w-[72px]
content = content.replace(/w-20/g, "w-[72px]");

// 2. Change gaps and padding in the Top Grid
// Outer grid
content = content.replace(
  `className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"`,
  `className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6"`
);

// Card padding
content = content.replace(
  /className="bg-slate-50\/80 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-3"/g,
  `className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col space-y-3"`
);

// Inner grid gap
content = content.replace(
  /className="grid grid-cols-2 gap-x-4 gap-y-3"/g,
  `className="grid grid-cols-2 gap-x-2 gap-y-3"`
);

// 3. Remove tracking-wider from Unit to save space
content = content.replace(
  `text-[10px] font-bold uppercase tracking-wider`,
  `text-[10px] font-bold uppercase`
);

// 4. Reduce CustomSelect padding from px-2 to px-1.5
content = content.replace(
  /rounded-full px-2 py-1/g,
  `rounded-full px-1.5 py-1`
);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Spaces optimized!");

