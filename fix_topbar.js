const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

const oldTopBar = `<span className="bg-slate-100 px-2 py-1 rounded tracking-widest uppercase">ID: {taskCode}</span>
          </div>`;

const newTopBar = `<span className="bg-slate-100 px-2 py-1 rounded tracking-widest uppercase mr-2">ID: {taskCode}</span>
            <CustomSelect 
              triggerClassName={\`w-32 font-bold uppercase tracking-wider text-[11px] px-2 py-1 rounded-full cursor-pointer border shadow-sm transition-colors bg-white \${
                brief.status === "pending" ? "text-[#f59e0b] border-[#fcd34d] hover:border-[#f59e0b]" :
                brief.status === "in_progress" ? "text-[#3b82f6] border-[#a5d8ff] hover:border-[#3b82f6]" :
                brief.status === "completed" ? "text-[#2b8a3e] border-[#8ce99a] hover:border-[#2b8a3e]" :
                "text-[#e03131] border-[#ffa8a8] hover:border-[#e03131]"
              }\`}
              dropdownClassName="w-32"
              value={brief.status}
              onChange={(val) => onUpdateField(brief.id, "status", val)}
              options={[
                { value: "pending", label: "PENDING", className: "font-bold hover:bg-slate-50 hover:text-[#f59e0b] text-slate-600" },
                { value: "in_progress", label: "IN PROGRESS", className: "font-bold hover:bg-slate-50 hover:text-[#3b82f6] text-slate-600" },
                { value: "completed", label: "COMPLETED", className: "font-bold hover:bg-slate-50 hover:text-[#2b8a3e] text-slate-600" },
                { value: "cancelled", label: "CANCELLED", className: "font-bold hover:bg-slate-50 hover:text-[#e03131] text-slate-600" }
              ]}
            />
          </div>`;

if (content.includes(oldTopBar)) {
    content = content.replace(oldTopBar, newTopBar);
    fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
    console.log("Top bar updated.");
} else {
    console.log("oldTopBar not found!");
}

