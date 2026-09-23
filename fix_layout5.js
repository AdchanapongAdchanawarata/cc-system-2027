const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// 1. Change grid to 35% / 65% for BOTH cards
content = content.replace(
  /className="grid grid-cols-\\[42%_58%\\] gap-x-2 gap-y-3"/g,
  `className="grid grid-cols-[35%_65%] gap-x-2 gap-y-3"`
);

// 2. Put Phone and Email in white pill boxes
const phoneOriginal = `<span className="flex-1 min-w-0 font-medium text-[12px] text-slate-700 px-1.5 py-1 truncate">{brief.requester_phone || brief.details?.phone || "-"}</span>`;
const phoneBox = `<div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-sm flex items-center h-[26px]">
                    <span className="truncate text-slate-700 text-[11px] font-medium">{brief.requester_phone || brief.details?.phone || "-"}</span>
                  </div>`;
content = content.replace(phoneOriginal, phoneBox);

const emailOriginal = `<a href={\`mailto:\${brief.requester_email}\`} className="flex-1 min-w-0 font-medium text-[10px] text-slate-700 hover:text-primary transition-colors px-1.5 py-1 break-all">{brief.requester_email || "-"}</a>`;
const emailBox = `<div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-sm flex items-center h-[26px]">
                    <a href={\`mailto:\${brief.requester_email}\`} className="truncate text-slate-700 hover:text-primary transition-colors text-[11px] font-medium" title={brief.requester_email}>{brief.requester_email || "-"}</a>
                  </div>`;
content = content.replace(emailOriginal, emailBox);

// Wait, I might have modified emailOriginal slightly in a previous step, so let us just use regex to replace Phone and Email blocks.

