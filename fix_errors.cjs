const fs = require('fs');

// 1. Fix CashierSidebar
let sidebar = fs.readFileSync('src/components/CashierSidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  "import {\n  Monitor,\n  Users,\n  History,\n  Settings\n} from 'lucide-react';",
  "import {\n  Monitor,\n  Users,\n  History,\n  Settings,\n  MessageSquare\n} from 'lucide-react';"
);
fs.writeFileSync('src/components/CashierSidebar.tsx', sidebar);

// 2. Fix CashierTerminalView
let terminal = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');
terminal = terminal.replace(
  "  onSwitchPerspective: (view: 'HO' | 'CASHIER' | 'MEMBER') => void;\n}",
  "  onSwitchPerspective: (view: 'HO' | 'CASHIER' | 'MEMBER') => void;\n  supportTickets?: any[];\n  onSubmitTicket?: (ticket: any) => Promise<void>;\n}"
);
terminal = terminal.replace(
  "  onSwitchPerspective\n}) => {",
  "  onSwitchPerspective,\n  supportTickets,\n  onSubmitTicket\n}) => {"
);
fs.writeFileSync('src/components/CashierTerminalView.tsx', terminal);

// 3. Fix syncFirestore.ts
let sync = fs.readFileSync('src/lib/syncFirestore.ts', 'utf8');
sync = sync.replace(
  "data = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));",
  "data = data.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));"
);
fs.writeFileSync('src/lib/syncFirestore.ts', sync);
