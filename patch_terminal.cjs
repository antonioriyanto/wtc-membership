const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

content = content.replace("import { Member, Transaction, StoreBranch, Voucher } from '../types';", "import { Member, Transaction, StoreBranch, Voucher, LoyaltyConfig } from '../types';");

const targetInterface = `interface CashierTerminalViewProps {
  members: Member[];`;
const replaceInterface = `interface CashierTerminalViewProps {
  loyaltyConfig?: LoyaltyConfig;
  members: Member[];`;

content = content.replace(targetInterface, replaceInterface);

const targetComponent = `export const CashierTerminalView: React.FC<CashierTerminalViewProps> = ({
  members,`;
const replaceComponent = `export const CashierTerminalView: React.FC<CashierTerminalViewProps> = ({
  loyaltyConfig,
  members,`;

content = content.replace(targetComponent, replaceComponent);

fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
