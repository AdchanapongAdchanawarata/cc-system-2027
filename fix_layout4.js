const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

const oldGridStart = content.indexOf("{/* Top Grid (Metadata) */}");
const oldGridEnd = content.indexOf("{/* Description Section */}");
const newGrid = `{/* Top Grid (Metadata) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Left Column: CC Staff */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <User size={12}/> CC Staff
                </h3>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="flex items-center text-[12px]">
                    <div className="w-20 flex items-center gap-1 text-slate-400">
                      <User size={12} /> <span>Assignee</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CustomSelect 
                        triggerClassName="w-full text-slate-700 font-medium bg-white border border-slate-200 rounded-full px-2 py-1 shadow-sm hover:border-slate-300 transition-colors truncate"
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
                  </div>

                  <div className="flex items-center text-[12px]">
                    <div className="w-20 flex items-center gap-1 text-slate-400">
                      <Tag size={12} /> <span>Unit</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CustomSelect 
                        triggerClassName="w-full bg-[#00a884] text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-[#009272] shadow-sm hover:border-white transition-colors truncate"
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
                  </div>

                  <div className="flex items-center text-[12px]">
                    <div className="w-20 flex items-center gap-1 text-slate-400">
                      <Target size={12} className="text-red-500" /> <span>Deadline</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <DatePicker
                          className="w-full text-slate-700 font-medium bg-white border border-slate-200 rounded-full px-2 py-1 cursor-pointer focus:outline-none focus:border-primary shadow-sm hover:border-slate-300 transition-colors text-center text-[11px]"
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

                  <div className="flex items-center text-[12px]">
                    <div className="w-20 flex items-center gap-1 text-slate-400">
                      <Target size={12} /> <span>Priority</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CustomSelect 
                        triggerClassName={\`w-full font-medium bg-white border rounded-full px-2 py-1 shadow-sm transition-colors text-[11px] \${
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
              </div>

              {/* Right Column: Owner */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={12}/> Owner
                </h3>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="flex items-center text-[12px]">
                    <div className="w-20 flex items-center gap-1 text-slate-400">
                      <User size={12} /> <span>Nickname</span>
                    </div>
                    <input 
                      type="text"
                      className="flex-1 min-w-0 text-[12px] text-slate-700 font-medium bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded px-1.5 py-1 -ml-1.5 focus:outline-none focus:border-primary truncate w-full"
                      defaultValue={brief.coordinator_nickname || brief.requester_name || brief.requester_email?.split("@")[0]}
                      title="Press Enter or click away to save"
                      onBlur={(e) => {
                        if (e.target.value !== brief.coordinator_nickname) onUpdateField(brief.id, "coordinator_nickname", e.target.value);
                      }}
                    />
                  </div>

                  <div className="flex items-center text-[12px]">
                    <div className="w-20 flex items-center gap-1 text-slate-400">
                      <Users size={12} /> <span>Team</span>
                    </div>
                    <input 
                      type="text"
                      className="flex-1 min-w-0 text-[12px] text-slate-700 font-medium bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded px-1.5 py-1 -ml-1.5 focus:outline-none focus:border-primary truncate w-full"
                      defaultValue={brief.decision_maker || brief.details?.team || "-"}
                      title="Press Enter or click away to save"
                      onBlur={(e) => {
                        if (e.target.value !== brief.decision_maker) onUpdateField(brief.id, "decision_maker", e.target.value);
                      }}
                    />
                  </div>

                  <div className="flex items-center text-[12px]">
                    <div className="w-20 flex items-center gap-1 text-slate-400">
                      <Phone size={12} /> <span>Phone</span>
                    </div>
                    <span className="flex-1 min-w-0 font-medium text-[12px] text-slate-700 px-1.5 py-1 truncate">{brief.requester_phone || brief.details?.phone || "-"}</span>
                  </div>

                  <div className="flex items-center text-[12px]">
                    <div className="w-20 flex items-center gap-1 text-slate-400">
                      <Mail size={12} /> <span>Email</span>
                    </div>
                    <a href={\`mailto:\${brief.requester_email}\`} className="flex-1 min-w-0 font-medium text-[11px] text-slate-700 hover:text-primary transition-colors px-1.5 py-1 truncate">{brief.requester_email || "-"}</a>
                  </div>
                </div>
              </div>
            </div>
            `;

if (oldGridStart !== -1 && oldGridEnd !== -1) {
    content = content.substring(0, oldGridStart) + newGrid + content.substring(oldGridEnd);
    fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
    console.log("Updated layout to EXACT equal width grid!");
} else {
    console.log("Grid not found");
}

