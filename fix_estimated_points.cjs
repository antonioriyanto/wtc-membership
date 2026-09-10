const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTab.tsx', 'utf-8');

const regex1 = /const pointsToGive = Math\.floor\(parsedAmount \/ 1000\);/g;
const replacement1 = `
  let multiplier = 1.0;
  if (activeMember) {
    if (activeMember.tier === 'BLACK') multiplier = 3.0;
    else if (activeMember.tier === 'DIAMOND') multiplier = 2.5;
    else if (activeMember.tier === 'PLATINUM') multiplier = 2.0;
    else if (activeMember.tier === 'GOLD') multiplier = 1.5;
  }
  const estimatedPoints = Math.floor(Math.floor(parsedAmount / 1000) * multiplier);
`;
content = content.replace(regex1, replacement1);

content = content.replace(/\{pointsToGive\}/g, '{estimatedPoints.toLocaleString(\'id-ID\')}');
content = content.replace(/pointsToGive <= 0/g, 'parsedAmount <= 0');

fs.writeFileSync('src/components/CashierTab.tsx', content, 'utf-8');
console.log('Fixed CashierTab.tsx estimated points');
