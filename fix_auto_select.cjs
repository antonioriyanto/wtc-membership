const fs = require('fs');

// Fix CashierPOSView.tsx
let posView = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');
posView = posView.replace("setAutoSelectMemberId(member.id);", "setAutoSelectMemberId(member.id + '|' + Date.now());");
fs.writeFileSync('src/components/CashierPOSView.tsx', posView);

// Fix CashierTab.tsx
let tab = fs.readFileSync('src/components/CashierTab.tsx', 'utf-8');
const oldEffect = `  useEffect(() => {
    if (autoSelectMemberId && members.length > 0) {
      const found = members.find(m => m.id === autoSelectMemberId);
      if (found) {
        setActiveMember(found);
      }
    }
  }, [autoSelectMemberId, members]);

  // Ensure activeMember is updated immediately when autoSelectMemberId changes
  useEffect(() => {
    if (autoSelectMemberId) {
       const found = members.find(m => m.id === autoSelectMemberId);
       if (found && (!activeMember || activeMember.id !== found.id)) {
          setActiveMember(found);
       }
    }
  }, [autoSelectMemberId]);`;

const newEffect = `  useEffect(() => {
    if (autoSelectMemberId && members.length > 0) {
      const actualId = autoSelectMemberId.split('|')[0];
      const found = members.find(m => m.id === actualId);
      if (found) {
        setActiveMember(found);
      }
    }
  }, [autoSelectMemberId, members]);`;

tab = tab.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/CashierTab.tsx', tab);
console.log('Fixed autoSelect trigger');
