const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// 1. Center Name input
content = content.replace(
  `className="flex-1 min-w-0 text-[11px] text-slate-700 font-medium bg-transparent border-none focus:outline-none focus:ring-0 truncate w-full"`,
  `className="flex-1 min-w-0 text-[11px] text-slate-700 font-medium bg-transparent border-none focus:outline-none focus:ring-0 truncate w-full text-center"`
);

// 2. Center Phone input
content = content.replace(
  `className="flex-1 min-w-0 text-[11px] text-slate-700 font-medium bg-transparent border-none focus:outline-none focus:ring-0 truncate w-full"`,
  `className="flex-1 min-w-0 text-[11px] text-slate-700 font-medium bg-transparent border-none focus:outline-none focus:ring-0 truncate w-full text-center"`
);

// 3. Center Email input
content = content.replace(
  `className="flex-1 min-w-0 text-[11px] text-slate-700 font-medium bg-transparent border-none focus:outline-none focus:ring-0 truncate w-full"`,
  `className="flex-1 min-w-0 text-[11px] text-slate-700 font-medium bg-transparent border-none focus:outline-none focus:ring-0 truncate w-full text-center"`
);

// 4. Center Team Select and enlarge text
const oldRenderValue = `renderValue={(val) => {
                          const team = TEAMS.find(t => t.abbr === val);
                          if (!team) return <span>{val}</span>;
                          return (
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold">{team.abbr}</span>
                              <span className="text-[9px] text-slate-400 font-normal truncate">{team.th}</span>
                            </div>
                          );
                        }}`;
const newRenderValue = `renderValue={(val) => {
                          const team = TEAMS.find(t => t.abbr === val);
                          if (!team) return <span className="w-full text-center block">{val}</span>;
                          return (
                            <div className="flex items-center justify-center gap-1.5 w-full truncate">
                              <span className="font-bold">{team.abbr}</span>
                              <span className="text-[10px] text-slate-500 font-normal truncate">{team.th}</span>
                            </div>
                          );
                        }}`;
content = content.replace(oldRenderValue, newRenderValue);

// Increase dropdown list text size
content = content.replace(
  `<span className="text-[10px] text-slate-500">{team.th}</span>`,
  `<span className="text-[11px] text-slate-500">{team.th}</span>`
);

fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Applied center alignment and increased text size!");

