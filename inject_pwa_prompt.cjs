const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

if (!content.includes('PwaInstallPrompt')) {
  // Add import
  content = content.replace(
    /import \{[\s\S]*?\} from 'lucide-react';/,
    match => match + "\nimport { PwaInstallPrompt } from './PwaInstallPrompt';"
  );
  
  // Add component before closing main div
  content = content.replace(
    /\{\/\* Bottom Navigation \*\/\}/,
    `<PwaInstallPrompt />\n\n      {/* Bottom Navigation */}`
  );

  fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
  console.log("PWA prompt injected");
}
