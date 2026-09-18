const fs = require('fs');

// The file might still have duplicates
let types = fs.readFileSync('src/types.ts', 'utf8');
const lines = types.split('\n');
const filtered = [];
let foundAvatarUrl = false;
for (let line of lines) {
  if (line.includes('avatarUrl?: string;')) {
    if (!foundAvatarUrl) {
      filtered.push(line);
      foundAvatarUrl = true;
    }
  } else {
    filtered.push(line);
  }
}
fs.writeFileSync('src/types.ts', filtered.join('\n'));

// Let's drop unused from data/mockData.bak.ts again since my first replacement maybe failed
let md = fs.readFileSync('src/data/mockData.bak.ts', 'utf8');
md = md.replace(/StoreBranch,\s*LoyaltyConfig/g, '');
fs.writeFileSync('src/data/mockData.bak.ts', md);
