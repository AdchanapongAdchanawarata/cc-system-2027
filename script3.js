const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");
let start = content.indexOf("{/* Very Top Bar */}");
let end = content.indexOf("<div className=\"flex-1 overflow-y-auto\">");
let text = content.substring(start, end);
fs.writeFileSync("old2.txt", text, "utf8");

