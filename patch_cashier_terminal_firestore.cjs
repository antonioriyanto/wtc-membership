const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

const target = `vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
  supportTickets?: any[];
  setSupportTickets?: any;`;
  
const replacement = `vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
  supportTickets?: any[];
  setSupportTickets?: any;
  onSubmitTicket?: (ticket: any) => Promise<void>;`;

content = content.replace(target, replacement);

content = content.replace(
  "setSupportTickets,\n  stores,",
  "setSupportTickets,\n  onSubmitTicket,\n  stores,"
);

const oldSubmit = `              onSubmitTicket={async (ticket) => {
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
              }}`;
              
const newSubmit = `              onSubmitTicket={async (ticket) => {
                if (onSubmitTicket) {
                  await onSubmitTicket(ticket);
                } else {
                  console.warn('onSubmitTicket not provided from App.tsx');
                }
              }}`;

content = content.replace(oldSubmit, newSubmit);
fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
