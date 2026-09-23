const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Reset all labels to a placeholder so we can uniquely replace them
content = content.replaceAll("w-[68px]", "LABEL_WIDTH");

// Now we replace them one by one in order
// 1. Assignee
content = content.replace("LABEL_WIDTH", "w-[72px]");
// 2. Unit
content = content.replace("LABEL_WIDTH", "w-[64px]");
// 3. Deadline
content = content.replace("LABEL_WIDTH", "w-[72px]");
// 4. Priority
content = content.replace("LABEL_WIDTH", "w-[64px]");
// 5. Name
content = content.replace("LABEL_WIDTH", "w-[56px]");
// 6. Team
content = content.replace("LABEL_WIDTH", "w-[56px]");
// 7. Phone
content = content.replace("LABEL_WIDTH", "w-[56px]");
// 8. Email
content = content.replace("LABEL_WIDTH", "w-[56px]");

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Customized label widths!");

