const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Change Label Width to 68px for the perfect middle ground
content = content.replaceAll("w-[72px]", "w-[68px]");

// Change Owner Grid to 35/65
// First, find the owner grid.
const ownerIndex = content.indexOf("{/* Right Column: Owner */}");
const beforeOwner = content.substring(0, ownerIndex);
const ownerPart = content.substring(ownerIndex);

// Replace ONLY in the owner part
const newOwnerPart = ownerPart.replace("grid-cols-[55%_45%]", "grid-cols-[35%_65%]");

content = beforeOwner + newOwnerPart;

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Updated Owner to 35/65 and label width to 68px!");

