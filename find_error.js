const fs = require('fs');
const babel = require('@babel/parser');
let code = fs.readFileSync('src/app/dashboard/components/BriefDetailsModal.tsx', 'utf8');

let lines = code.split('\n');
// We will try parsing the lines up to N, adding a few closing tags to see if it parses.
// Wait, a better way is just to let Babel tell us if there is an unterminated string.
try {
  babel.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
} catch (e) {
  console.log(e);
}
