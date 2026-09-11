const fs = require('fs');
const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
if (!tsconfig.exclude) tsconfig.exclude = [];
if (!tsconfig.exclude.includes('dist')) tsconfig.exclude.push('dist');
fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
console.log('Fixed tsconfig');
