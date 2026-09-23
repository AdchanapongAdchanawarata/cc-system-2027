const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Fix Thai strings first!
content = content.replace(/\?{5,}/g, "?????????? / ???????????????"); // catch ??????????
content = content.replace("??????????", "???????????");
content = content.replace("??????", "???????");
content = content.replace("?", "?");
// Just replace all known corrupted ones
content = content.replace(/<span className="font-medium">.*\(SLA\)<\/span>/g, `<span className="font-medium">??????????????? (SLA)</span>`);
content = content.replace(/<span className="font-medium">??.*?.*??.*<\/span>/g, `<span className="font-medium">?????????????</span>`);
content = content.replace(/<span className="font-medium">??.*??.*??.*<\/span>/g, `<span className="font-medium">???????????????</span>`);
content = content.replace(/<span className="font-medium">??.*?.*???.*??.*???<\/span>/g, `<span className="font-medium">????????????????????</span>`);
content = content.replace(/<span className="font-medium">??.*?.*??.*<\/span>/g, `<span className="font-medium">????????????????</span>`);
content = content.replace(/<span className="font-medium">.*?.*??.*<\/span>/g, `<span className="font-medium">??????????????????</span>`);
content = content.replace(/<span className="font-medium">???.*Value\)<\/span>/g, `<span className="font-medium">????????? (Value)</span>`);
content = content.replace(/<span className="text-emerald-600\/50 italic">.*????.*???<\/span>/g, `<span className="text-emerald-600/50 italic">???????????????</span>`);

// Map fix
const mapStart = content.indexOf("const THAI_FIELD_MAP: Record<string, string> = {");
const mapEnd = content.indexOf("};", mapStart) + 2;
if (mapStart !== -1) {
    content = content.substring(0, mapStart) + `const THAI_FIELD_MAP: Record<string, string> = {
  category: "?????????",
  type: "?????????",
  draft_date: "????????????????????",
  publish_date: "???????????????? / ???????",
  usage_date: "???????????????? (Usage Date)",
  event_datetime: "???????????????????????",
  objective: "?????????????????????",
  target_audience: "???????????????????",
  content_text: "??????? / ????????????????????",
  colors: "???????????????",
  must_haves: "??????????????????",
  must_not_haves: "????????????????? (???????????)",
  photo_source: "???????????????????",
  key_persons: "???????????????????????",
  location: "?????????????",
  details: "???????????????????",
};` + content.substring(mapEnd);
}

// Layout replacement
const oldGridStart = content.indexOf("{/* Top Grid (Metadata) */}");
const oldGridEnd = content.indexOf("{/* Description Section */}");
const newGrid = `{/* Top Grid (Metadata) */}
            <div className="flex flex-col gap-4 mb-6">
              
              {/* CC Staff Card */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <User size={12}/> CC Staff
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div className="flex items-center text-[13px]">
                    <div className="w-20 flex items-center gap-1.5 text-slate-400">
                      <User size={14} /> <span>Assignee</span>
                    </div>
                    <CustomSelect 
                      triggerClassName="flex-1 max-w-[140px] text-slate-700 font-medium bg-white border border-slate-200 rounded-full px-2.5 py-1 text-[12px] shadow-sm hover:border-slate-300 transition-colors"
                      dropdownClassName="w-48 text-[12px]"
                      placeholder="Empty"
                      value={brief.assignee_id || ""}
                      onChange={(val) => onUpdateField(brief.id, "assignee_id", val)}
                      options={[
                        { value: "", label: "Empty" },
                        ...assignees.map(a => ({ value: a.id, label: a.name }))
                      ]}
                    />
                  </div>

                  <div className="flex items-center text-[13px]">
                    <div className="w-20 flex items-center gap-1.5 text-slate-400">
                      <Tag size={14} /> <span>Unit</span>
                    </div>
                    <CustomSelect 
                      triggerClassName="flex-1 max-w-[140px] bg-[#00a884] text-white px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer border border-[#009272] shadow-sm hover:border-white transition-colors"
                      dropdownClassName="w-32 text-[12px]"
                      value={brief.unit}
                      onChange={(val) => onUpdateField(brief.id, "unit", val as any)}
                      options={[
                        { value: "creative", label: "CREATIVE" },
                        { value: "content", label: "CONTENT" },
                        { value: "pr", label: "PR" },
                        { value: "internal", label: "INTERNAL" }
                      ]}
                    />
                  </div>

                  <div className="flex items-center text-[13px]">
                    <div className="w-20 flex items-center gap-1.5 text-slate-400">
                      <Target size={14} className="text-red-500" /> <span>Deadline</span>
                    </div>
                    <div className="flex-1 max-w-[140px]">
                        <DatePicker
                          className="w-full text-slate-700 font-medium bg-white border border-slate-200 rounded-full px-2.5 py-1 text-[12px] cursor-pointer focus:outline-none focus:border-primary shadow-sm hover:border-slate-300 transition-colors text-center"
                          selected={(() => {
                            const dateStr = brief.deadline || brief.details?.usage_date || brief.details?.publish_date;
                            return dateStr ? new Date(dateStr) : null;
                          })()}
                          onChange={(date: Date | null) => {
                            if (date) {
                              const tzOffset = date.getTimezoneOffset() * 60000;
                              const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().split("T")[0];
                              onUpdateField(brief.id, "deadline", localISOTime);
                            } else {
                              onUpdateField(brief.id, "deadline", null);
                            }
                          }}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select date"
                        />
                    </div>
                  </div>

                  <div className="flex items-center text-[13px]">
                    <div className="w-20 flex items-center gap-1.5 text-slate-400">
                      <Target size={14} /> <span>Priority</span>
                    </div>
                    <CustomSelect 
                      triggerClassName={\`flex-1 max-w-[140px] font-medium bg-white border rounded-full px-2.5 py-1 text-[12px] shadow-sm transition-colors \${
                        brief.priority === "High" ? "text-[#e03131] border-[#ffa8a8] hover:border-[#e03131]" :
                        brief.priority === "Low" ? "text-[#495057] border-[#ced4da] hover:border-[#495057]" :
                        "text-[#8b5cf6] border-[#c4b5fd] hover:border-[#8b5cf6]"
                      }\`}
                      dropdownClassName="w-32 text-[12px]"
                      value={brief.priority || "Medium"}
                      onChange={(val) => onUpdateField(brief.id, "priority", val)}
                      options={[
                        { value: "High", label: "High", className: "font-medium hover:bg-slate-50 hover:text-[#e03131] text-slate-600" },
                        { value: "Medium", label: "Medium", className: "font-medium hover:bg-slate-50 hover:text-[#8b5cf6] text-slate-600" },
                        { value: "Low", label: "Low", className: "font-medium hover:bg-slate-50 hover:text-[#495057] text-slate-600" }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Card */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={12}/> Owner
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div className="flex items-center text-[13px]">
                    <div className="w-20 flex items-center gap-1.5 text-slate-400">
                      <User size={14} /> <span>Nickname</span>
                    </div>
                    <input 
                      type="text"
                      className="flex-1 text-[12px] text-slate-700 font-medium truncate max-w-[160px] bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded px-1.5 focus:outline-none focus:border-primary"
                      defaultValue={brief.coordinator_nickname || brief.requester_name || brief.requester_email?.split("@")[0]}
                      title="Press Enter or click away to save"
                      onBlur={(e) => {
                        if (e.target.value !== brief.coordinator_nickname) onUpdateField(brief.id, "coordinator_nickname", e.target.value);
                      }}
                    />
                  </div>

                  <div className="flex items-center text-[13px]">
                    <div className="w-20 flex items-center gap-1.5 text-slate-400">
                      <Users size={14} /> <span>Team</span>
                    </div>
                    <input 
                      type="text"
                      className="flex-1 text-[12px] text-slate-700 font-medium truncate max-w-[160px] bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded px-1.5 focus:outline-none focus:border-primary"
                      defaultValue={brief.decision_maker || brief.details?.team || "-"}
                      title="Press Enter or click away to save"
                      onBlur={(e) => {
                        if (e.target.value !== brief.decision_maker) onUpdateField(brief.id, "decision_maker", e.target.value);
                      }}
                    />
                  </div>

                  <div className="flex items-center text-[13px]">
                    <div className="w-20 flex items-center gap-1.5 text-slate-400">
                      <Phone size={14} /> <span>Phone</span>
                    </div>
                    <span className="flex-1 font-medium text-[12px] text-slate-700 px-1.5">{brief.requester_phone || brief.details?.phone || "-"}</span>
                  </div>

                  <div className="flex items-center text-[13px]">
                    <div className="w-20 flex items-center gap-1.5 text-slate-400">
                      <Mail size={14} /> <span>Email</span>
                    </div>
                    <a href={\`mailto:\${brief.requester_email}\`} className="flex-1 font-medium text-[12px] text-slate-700 hover:text-primary transition-colors px-1.5 truncate max-w-[160px]">{brief.requester_email || "-"}</a>
                  </div>
                </div>
              </div>
            </div>
            `;

if (oldGridStart !== -1 && oldGridEnd !== -1) {
    content = content.substring(0, oldGridStart) + newGrid + content.substring(oldGridEnd);
    fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
    console.log("Updated layout to super compact!");
} else {
    console.log("Grid not found");
}

