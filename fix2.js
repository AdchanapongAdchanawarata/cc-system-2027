const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");
let start = content.indexOf("\"use client\";");
if (start > 0) content = content.substring(start);
content = content.replace("?./CustomSelect", "\"./CustomSelect");
fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");

