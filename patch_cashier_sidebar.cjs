const fs = require('fs');
let content = fs.readFileSync('src/components/CashierSidebar.tsx', 'utf8');

content = content.replace(
  "Settings\\n} from 'lucide-react';",
  "Settings,\n  MessageSquare\n} from 'lucide-react';"
);

content = content.replace(
  "{ id: 'settings', label: 'Settings', icon: Settings }",
  "{ id: 'tickets', label: 'Tiket Bantuan', icon: MessageSquare },\n    { id: 'settings', label: 'Settings', icon: Settings }"
);

fs.writeFileSync('src/components/CashierSidebar.tsx', content);
