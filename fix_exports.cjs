const fs = require('fs');

function replaceExport(file, oldName, newName) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(new RegExp(`export const ${oldName}`, 'g'), `export const ${newName}`);
    fs.writeFileSync(file, content);
  }
}

replaceExport('src/components/CashierSidebar.tsx', 'Sidebar', 'CashierSidebar');
replaceExport('src/components/CashierHeader.tsx', 'Header', 'CashierHeader');
replaceExport('src/components/CashierMembersTab.tsx', 'MembersTab', 'CashierMembersTab');
replaceExport('src/components/CashierTransactionsTab.tsx', 'TransactionsTab', 'CashierTransactionsTab');
replaceExport('src/components/CashierSettingsTab.tsx', 'SettingsTab', 'CashierSettingsTab');

