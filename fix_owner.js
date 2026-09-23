const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Change Nickname to Name
content = content.replace(
  `<User size={12} /> <span>Nickname</span>`,
  `<User size={12} /> <span>Name</span>`
);

// In the Owner section, replace w-[72px] with w-auto pr-1
const ownerStart = content.indexOf("{/* Owner Card */}");
const ownerEnd = content.indexOf("</div>", ownerStart + 1000); // just grab a chunk

let ownerSection = content.substring(ownerStart, ownerEnd);
ownerSection = ownerSection.replace(/w-\\[72px\\]/g, "w-auto pr-2");

content = content.substring(0, ownerStart) + ownerSection + content.substring(ownerEnd);
fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Owner section fixed!");

