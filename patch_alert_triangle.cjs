const fs = require('fs');
let content = fs.readFileSync('src/components/MemberPreviewModal.tsx', 'utf8');

content = content.replace(
  "import { \n  X, ",
  "import { \n  X, \n  AlertTriangle, "
);

fs.writeFileSync('src/components/MemberPreviewModal.tsx', content);
