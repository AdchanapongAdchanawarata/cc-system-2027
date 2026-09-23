const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

const oldCCStaff = `<h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <User size={12}/> CC Staff
                </h3>`;
const newCCStaff = `<h3 className="text-[12px] font-bold uppercase tracking-wider text-amber-500 mb-1.5 ml-1">
                  CC Staff
                </h3>`;

const oldOwner = `<h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={12}/> Owner
                </h3>`;
const newOwner = `<h3 className="text-[12px] font-bold uppercase tracking-wider text-amber-500 mb-1.5 ml-1">
                  Owner
                </h3>`;

content = content.replace(oldCCStaff, newCCStaff);
content = content.replace(oldOwner, newOwner);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Updated headers!");

