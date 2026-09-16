const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<Header[\s\S]*?onSelectTransaction=\{[\s\S]*?\}\}\s*\/>/;

const newHeader = `<Header 
                onSearch={() => {}}
                onOpenCreateVoucher={() => setIsCreateVoucherOpen(true)}
                onOpenManualAdjust={() => setIsPointAdjustOpen(true)}
                onRefreshData={handleRefreshData}
                isRefreshing={isRefreshingData}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                unreadNotificationsCount={unreadNotificationsCount}
                members={members}
                transactions={transactions}
                stores={stores}
                vouchers={vouchers}
                campaigns={campaigns}
                supportTickets={supportTickets}
                auditLogs={auditLogs}
                loyaltyConfig={loyaltyConfig}
                onSelectMember={(m) => setGlobalPreviewMember(m)}
                onSelectTransaction={(t) => {
                  const m = members.find(mem => mem.id === t.memberId);
                  if (m) setGlobalPreviewMember(m);
                }}
                onSelectTab={(tab) => setActiveTab(tab as any)}
              />`;

app = app.replace(regex, newHeader);
fs.writeFileSync('src/App.tsx', app);
