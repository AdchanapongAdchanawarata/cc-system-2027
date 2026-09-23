const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Remove truncate from Email
content = content.replace(
  `px-1.5 py-1 truncate">{brief.requester_email`,
  `px-1.5 py-1 break-all">{brief.requester_email`
);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Email truncate removed!");

