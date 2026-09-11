const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTab.tsx', 'utf-8');

const search = `  useEffect(() => {
    if (autoSelectMemberId && members.length > 0) {
      const found = members.find(m => m.id === autoSelectMemberId);
      if (found) {
        setActiveMember(found);
      }
    }
  }, [autoSelectMemberId, members]);`;

const replace = `  useEffect(() => {
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
  }, [autoSelectMemberId]);
`;

content = content.replace(search, replace);
fs.writeFileSync('src/components/CashierTab.tsx', content);
console.log('Fixed CashierTab auto-select');
