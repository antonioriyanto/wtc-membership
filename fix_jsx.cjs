const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// The duplicate block is:
const dup = `{store.distance !== undefined && (
                        <div className="flex items-center gap-1 text-[0.65rem] font-bold text-emerald-300 drop-shadow-md mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {store.distance < 1 
                              ? \`\${Math.round(store.distance * 1000)} METER DARI ANDA\` 
                              : \`\${store.distance.toFixed(1)} KM DARI ANDA\`}
                          </span>
                        </div>
                      )}`;

// We can just replace all three instances with a single one.
// Let's use a regex to replace multiple consecutive identical or similar blocks.
const regex = /\{store\.distance !== undefined && \([\s\S]*?\}\)[\s\S]*?\{store\.distance !== undefined && \([\s\S]*?\}\)[\s\S]*?\{store\.distance !== undefined && \([\s\S]*?\}\)/;

const replacement = `{store.distance !== undefined && (
                        <div className="flex items-center gap-1 text-[0.7rem] font-bold text-emerald-300 drop-shadow-md mt-1 bg-black/30 w-fit px-1.5 py-0.5 rounded backdrop-blur-sm">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {store.distance < 1 
                              ? \`\${Math.round(store.distance * 1000)} M DARI ANDA\` 
                              : \`\${store.distance.toFixed(1)} KM DARI ANDA\`}
                          </span>
                        </div>
                      )}`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
  console.log('Duplicate JSX fixed');
} else {
  console.log('Regex did not match');
}
