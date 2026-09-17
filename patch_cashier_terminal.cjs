const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

// Add import
if (!content.includes('CashierSupportTicketsTab')) {
  content = content.replace(
    "import { CashierSidebar } from './CashierSidebar';",
    "import { CashierSidebar } from './CashierSidebar';\nimport { CashierSupportTicketsTab } from './CashierSupportTicketsTab';"
  );
}

// Add props
content = content.replace(
  "vouchers: Voucher[];\n  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;",
  "vouchers: Voucher[];\n  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;\n  supportTickets?: any[];\n  setSupportTickets?: any;"
);

content = content.replace(
  "setVouchers,\n  stores,",
  "setVouchers,\n  supportTickets = [],\n  setSupportTickets,\n  stores,"
);

// Add tab content
const target = `{activeTab === 'settings' && (`;
const replacement = `{activeTab === 'tickets' && (
            <CashierSupportTicketsTab
              currentStore={currentStore}
              cashierName={cashierName}
              supportTickets={supportTickets}
              onSubmitTicket={async (ticket) => {
                const ticketId = 'TCK-' + Date.now().toString().slice(-6);
                const created = {
                  id: ticketId,
                  ...ticket,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  messages: [{
                    id: 'msg_' + Date.now(),
                    sender: 'CASHIER',
                    text: ticket.messageText,
                    timestamp: new Date().toISOString()
                  }]
                };
                if (setSupportTickets) {
                  setSupportTickets((prev: any) => [created, ...prev]);
                }
              }}
            />
          )}
          
          {activeTab === 'settings' && (`

content = content.replace(target, replacement);

fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
