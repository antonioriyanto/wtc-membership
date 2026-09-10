const fs = require('fs');
try { fs.renameSync('src/components/Sidebar.tsx', 'src/components/CashierSidebar.tsx'); } catch(e) {}
try { fs.renameSync('src/components/Header.tsx', 'src/components/CashierHeader.tsx'); } catch(e) {}
try { fs.renameSync('src/components/MembersTab.tsx', 'src/components/CashierMembersTab.tsx'); } catch(e) {}
try { fs.renameSync('src/components/TransactionsTab.tsx', 'src/components/CashierTransactionsTab.tsx'); } catch(e) {}
try { fs.renameSync('src/components/SettingsTab.tsx', 'src/components/CashierSettingsTab.tsx'); } catch(e) {}

['src/components/CashierSidebar.tsx', 'src/components/CashierHeader.tsx', 'src/components/CashierMembersTab.tsx', 'src/components/CashierTransactionsTab.tsx', 'src/components/CashierSettingsTab.tsx'].forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/TabType/g, 'CashierTabType');
    fs.writeFileSync(file, content);
  }
});
