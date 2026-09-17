const fs = require('fs');

// 1. Fix CashierSidebar
let sidebar = fs.readFileSync('src/components/CashierSidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  /import\s*\{\s*Monitor,\s*Users,\s*History,\s*Settings\s*\}\s*from\s*'lucide-react';/,
  "import {\n  Monitor,\n  Users,\n  History,\n  Settings,\n  MessageSquare\n} from 'lucide-react';"
);
fs.writeFileSync('src/components/CashierSidebar.tsx', sidebar);

// 2. Fix CashierTerminalView destructuring
let terminal = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');
terminal = terminal.replace(
  "  onSwitchPerspective,\n  stores\n}) => {",
  "  onSwitchPerspective,\n  stores,\n  supportTickets,\n  onSubmitTicket\n}) => {"
);
fs.writeFileSync('src/components/CashierTerminalView.tsx', terminal);
