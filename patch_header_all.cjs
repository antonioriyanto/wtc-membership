const fs = require('fs');

let header = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Update imports
const importRegex = /import \{ (.*?) \} from 'lucide-react';/;
header = header.replace(importRegex, "import { $1, Store, Gift, Megaphone, Ticket, ClipboardList, ShieldAlert, BadgePercent, MessageSquare } from 'lucide-react';");

// Update HeaderProps
const propsRegex = /interface HeaderProps \{[\s\S]*?\}/;
const newProps = `interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenCreateVoucher: () => void;
  onOpenManualAdjust: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  members?: any[];
  transactions?: any[];
  stores?: any[];
  vouchers?: any[];
  campaigns?: any[];
  supportTickets?: any[];
  auditLogs?: any[];
  loyaltyConfig?: any;
  onSelectMember?: (member: any) => void;
  onSelectTransaction?: (transaction: any) => void;
  onSelectTab?: (tab: string) => void;
}`;
header = header.replace(propsRegex, newProps);

// Update Header declaration and destructuring
const compDefRegex = /export const Header: React\.FC<HeaderProps> = \(\{[\s\S]*?\}\) => \{/;
const newCompDef = `export const Header: React.FC<HeaderProps> = ({
  onSearch, 
  onOpenCreateVoucher, 
  onOpenManualAdjust, 
  onRefreshData,
  isRefreshing = false,
  onOpenNotifications,
  unreadNotificationsCount,
  members = [],
  transactions = [],
  stores = [],
  vouchers = [],
  campaigns = [],
  supportTickets = [],
  auditLogs = [],
  loyaltyConfig,
  onSelectMember,
  onSelectTransaction,
  onSelectTab
}) => {`;
header = header.replace(compDefRegex, newCompDef);

fs.writeFileSync('src/components/Header.tsx', header);
