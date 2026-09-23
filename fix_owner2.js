const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// We want to replace w-[72px] with w-auto pr-2 ONLY in the Owner section
const oldGridStart = content.indexOf("{/* Right Column: Owner */}");
const end = content.indexOf("{/* Description Section */}");

if (oldGridStart !== -1) {
    let ownerSection = content.substring(oldGridStart, end);
    ownerSection = ownerSection.replaceAll("w-[72px]", "w-auto pr-2");
    ownerSection = ownerSection.replace("Nickname", "Name");
    
    content = content.substring(0, oldGridStart) + ownerSection + content.substring(end);
    fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
    console.log("Owner section fixed!");
} else {
    console.log("Could not find owner section");
}

