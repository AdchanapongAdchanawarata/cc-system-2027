const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/components/BriefDetailsModal.tsx', 'utf8');

// We'll write a simple regex to match tags and find the early closure
let depth = 0;
let lines = code.split('\n');
let insideReturn = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('return (')) {
    insideReturn = true;
    continue;
  }
  if (!insideReturn) continue;

  let opens = (line.match(/<[A-Za-z]+[^>]*(?<!\/)>/g) || []).length;
  let closes = (line.match(/<\/[A-Za-z]+>/g) || []).length;
  
  // ignore self closing like <X size={18} />
  
  depth += opens;
  depth -= closes;
  if (depth === 0 && opens === 0 && closes > 0) {
    console.log('Main div closed at line', i + 1);
    console.log(lines[i-1]);
    console.log(lines[i]);
    console.log(lines[i+1]);
    break;
  }
}
