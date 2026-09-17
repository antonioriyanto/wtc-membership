const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

const regex = /<nav className="fixed bottom-5 left-1\/2 -translate-x-1\/2 w-\[calc\(100\%-40px\)\] max-w-\[400px\][^"]+"/g;
content = content.replace(regex, '<nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[400px] bg-white/70 backdrop-blur-lg border border-black/5 dark:bg-black/40 dark:backdrop-blur-lg dark:border-white/10 rounded-[40px] flex justify-around items-center p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-none z-[1000]"');

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
