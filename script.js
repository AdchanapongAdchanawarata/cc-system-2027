const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

const statusLabelIdx = content.indexOf("<span>Status</span>");
const statusBlockStart = content.lastIndexOf("<div className=\"flex items-center text-sm\">", statusLabelIdx);
const statusBlockEnd = content.indexOf("/>\n                  </div>", statusBlockStart) + "/>\n                  </div>".length;
const statusBlock = content.substring(statusBlockStart, statusBlockEnd);

const newStatus = statusBlock
  .replace("w-36 font-bold uppercase tracking-wider text-[13px] px-3 py-1.5", "w-32 font-bold uppercase tracking-wider text-[11px] px-2 py-1")
  .replace("<div className=\"w-32 flex items-center gap-2 text-slate-400\">\n                      <CheckCircle2 size={16} /> <span>Status</span>\n                    </div>\n                    ", "");

content = content.replace("<span className=\"bg-slate-100 px-2 py-1 rounded tracking-widest uppercase\">ID: {taskCode}</span>", "<span className=\"bg-slate-100 px-2 py-1 rounded tracking-widest uppercase mr-2\">ID: {taskCode}</span>\n              " + newStatus);

const getField = (label) => {
  const lblIdx = content.indexOf(`<span>${label}</span>`);
  if (lblIdx === -1) return "";
  const start = content.lastIndexOf("<div className=\"flex items-center text-sm\">", lblIdx);
  let endStr = "/>\n                  </div>";
  if (label === "Deadline") {
     endStr = "</div>\n                  </div>";
  } else if (label === "Team") {
     endStr = "/>\n                </div>";
  }
  const end = content.indexOf(endStr, start) + endStr.length;
  return content.substring(start, end);
};

const assignee = getField("Assignee");
const unit = getField("Unit");
const deadline = getField("Deadline");
const priority = getField("Priority");
const team = getField("Team");

const nicknameRow = `
                  <div className="flex items-center text-sm">
                    <div className="w-32 flex items-center gap-2 text-slate-400">
                      <User size={16} /> <span>Nickname</span>
                    </div>
                    <input 
                      type="text"
                      className="text-[13px] text-slate-700 font-medium truncate max-w-[200px] bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded px-1 -ml-1 focus:outline-none focus:border-primary"
                      defaultValue={brief.coordinator_nickname || brief.requester_name || brief.requester_email?.split("@")[0]}
                      title="Press Enter or click away to save"
                      onBlur={(e) => {
                        if (e.target.value !== brief.coordinator_nickname) onUpdateField(brief.id, "coordinator_nickname", e.target.value);
                      }}
                    />
                  </div>`;

const phoneRow = `
                  <div className="flex items-center text-sm">
                    <div className="w-32 flex items-center gap-2 text-slate-400">
                      <Phone size={16} /> <span>Phone</span>
                    </div>
                    <span className="font-medium text-slate-700">{brief.requester_phone || brief.details?.phone || "-"}</span>
                  </div>`;

const emailRow = `
                  <div className="flex items-center text-sm">
                    <div className="w-32 flex items-center gap-2 text-slate-400">
                      <Mail size={16} /> <span>Email</span>
                    </div>
                    <a href={\`mailto:\${brief.requester_email}\`} className="font-medium text-slate-700 hover:text-primary transition-colors">{brief.requester_email || "-"}</a>
                  </div>`;

const newGrid = `
            {/* Top Grid (Metadata) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-10">
              
              {/* Left Column: CC Staff */}
              <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
                  CC Staff
                </h3>
                ${assignee}
                ${unit}
                ${deadline}
                ${priority}
              </div>

              {/* Right Column: Owner */}
              <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
                  Owner
                </h3>
                ${nicknameRow}
                ${team}
                ${phoneRow}
                ${emailRow}
              </div>

            </div>
`;

const oldGridStart = content.indexOf("{/* Top Grid (Metadata) */}");
const contactPillEnd = content.indexOf("{/* Description Section */}");
if (oldGridStart !== -1 && contactPillEnd !== -1) {
  content = content.substring(0, oldGridStart) + newGrid + "            " + content.substring(contactPillEnd);
}

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content);
console.log("File rewritten successfully.");

