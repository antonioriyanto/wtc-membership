const { readFileSync } = require('fs');
const rules = readFileSync('firestore.rules', 'utf8');
console.log(rules);
