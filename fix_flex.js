const fs = require("fs");
let content = fs.readFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", "utf8");

// Assignee
content = content.replace(
  `<CustomSelect 
                      triggerClassName="flex-1`,
  `<div className="flex-1 min-w-0"><CustomSelect 
                      triggerClassName="w-full`
);

// Unit
content = content.replace(
  `<CustomSelect 
                      triggerClassName="flex-1`,
  `<div className="flex-1 min-w-0"><CustomSelect 
                      triggerClassName="w-full`
);

// Priority
content = content.replace(
  `<CustomSelect 
                      triggerClassName=\`flex-1`,
  `<div className="flex-1 min-w-0"><CustomSelect 
                      triggerClassName={\`w-full`
);

// Close the wrapper divs for those 3
content = content.replace(
  `]}
                    />`,
  `]}
                    /></div>`
);
content = content.replace(
  `]}
                    />`,
  `]}
                    /></div>`
);
content = content.replace(
  `]}
                    />`,
  `]}
                    /></div>`
);


fs.writeFileSync("src/app/dashboard/components/BriefDetailsModal.tsx", content, "utf8");
console.log("Wrapped CustomSelects in flex-1 min-w-0");

