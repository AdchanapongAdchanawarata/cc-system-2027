const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

content = content.replaceAll(
  `className="text-[12px] font-bold uppercase tracking-wider text-amber-500 mb-1.5 ml-1"`,
  `className="text-[14px] font-extrabold uppercase tracking-wider text-[#FF7A00] mb-1.5 ml-1"`
);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Updated headers to be larger and brand orange!");

