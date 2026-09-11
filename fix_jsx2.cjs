const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// Just remove all {store.distance !== undefined && ...} blocks, then add one back.
const blockRegex = /\{store\.distance !== undefined && \([\s\S]*?<\/div>\s*\)\}/g;

const match = content.match(blockRegex);
if (match) {
  content = content.replace(blockRegex, '');
  
  // Add it back after </h3>
  content = content.replace(/(<\/h3>)/, `$1\n                      {store.distance !== undefined && (
                        <div className="flex items-center gap-1 text-[0.7rem] font-bold text-emerald-300 drop-shadow-md mt-1 bg-black/40 w-fit px-2 py-0.5 rounded-full backdrop-blur-sm">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {store.distance < 1 
                              ? \`\${Math.round(store.distance * 1000)} M DARI ANDA\` 
                              : \`\${store.distance.toFixed(1)} KM DARI ANDA\`}
                          </span>
                        </div>
                      )}`);
  fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
  console.log('Fixed multiple distance blocks');
}
