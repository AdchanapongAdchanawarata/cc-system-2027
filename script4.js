const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Remove all text before import { useState }
let stateIdx = content.indexOf("import { useState }");
content = "\"use client\";\n\n" + content.substring(stateIdx);
content = content.replace("?./CustomSelect\"", "\"./CustomSelect\"");
fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");

