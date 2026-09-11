const fs = require('fs');
let content = fs.readFileSync('src/components/CreateMemberModal.tsx', 'utf-8');

// Add stores to props
content = content.replace("members?: Member[];", "members?: Member[];\n  stores?: {name: string, code: string}[];");
content = content.replace("members, onExistingMember", "members, stores, onExistingMember");

// Use stores for storeList
const newStoreList = `  const storeList = Array.from(new Set([
    defaultStore, 
    ...(stores ? stores.map(s => s.name) : OFFICIAL_STORES)
  ].filter(Boolean))).sort();`;
content = content.replace(/const storeList = Array\.from\(new Set\(\[defaultStore, \.\.\.OFFICIAL_STORES\]\.filter\(Boolean\)\)\);/g, newStoreList);

// When creating member, try to use store code
const storeCodeMapping = `      let code = 'PUR';
      if (stores) {
        const found = stores.find(s => s.name.toLowerCase() === registeredStore.toLowerCase());
        if (found && found.code) code = found.code;
      } else {
        const storeCodeMap: Record<string, string> = {`;

content = content.replace("const storeCodeMap: Record<string, string> = {", storeCodeMapping);

content = content.replace("const code = storeCodeMap[registeredStore.toLowerCase()] || 'PUR';", "}\n      if (!code) { code = storeCodeMap[registeredStore.toLowerCase()] || 'PUR'; }");


fs.writeFileSync('src/components/CreateMemberModal.tsx', content);
console.log('Fixed CreateMemberModal stores props');
