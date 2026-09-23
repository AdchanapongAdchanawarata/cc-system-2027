const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

const phoneOriginal = `<span className="flex-1 min-w-0 font-medium text-[11px] text-slate-700 truncate">{brief.requester_phone || brief.details?.phone || "-"}</span>`;
const phoneInput = `<input 
                        type="text"
                        className="flex-1 min-w-0 text-[11px] text-slate-700 font-medium bg-transparent border-none focus:outline-none focus:ring-0 truncate w-full"
                        defaultValue={brief.requester_phone || brief.details?.phone || ""}
                        title="Press Enter or click away to save"
                        onBlur={(e) => {
                          const original = brief.requester_phone || brief.details?.phone || "";
                          if (e.target.value !== original) onUpdateField(brief.id, "requester_phone", e.target.value);
                        }}
                      />`;
content = content.replace(phoneOriginal, phoneInput);

const emailOriginal = `<a href={\`mailto:\${brief.requester_email}\`} className="flex-1 min-w-0 font-medium text-[11px] text-slate-700 hover:text-primary transition-colors truncate" title={brief.requester_email}>{brief.requester_email || "-"}</a>`;
const emailInput = `<input 
                        type="email"
                        className="flex-1 min-w-0 text-[11px] text-slate-700 font-medium bg-transparent border-none focus:outline-none focus:ring-0 truncate w-full"
                        defaultValue={brief.requester_email || ""}
                        title="Press Enter or click away to save"
                        onBlur={(e) => {
                          if (e.target.value !== (brief.requester_email || "")) onUpdateField(brief.id, "requester_email", e.target.value);
                        }}
                      />`;
content = content.replace(emailOriginal, emailInput);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Made phone and email editable!");

