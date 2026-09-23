const fs = require('fs');
const babel = require('@babel/parser');

let code = fs.readFileSync('src/app/dashboard/components/BriefDetailsModal.tsx', 'utf8');

// replace </div> from the bottom one by one and see which one fixes it!
let parts = code.split('</div>');
for (let i = parts.length - 2; i >= 0; i--) {
  let testCode = parts.slice(0, i + 1).join('</div>') + parts.slice(i + 1).join('</div>');
  try {
    babel.parse(testCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    console.log('Fixed by removing </div> number', i, 'which is near line:', testCode.substring(0, testCode.indexOf(parts[i])).split('\n').length);
    fs.writeFileSync('src/app/dashboard/components/BriefDetailsModal.tsx', testCode);
    process.exit(0);
  } catch(e) {
    // continue
  }
}
console.log('Could not fix by removing one </div>');
