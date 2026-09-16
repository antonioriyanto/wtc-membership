const fs = require('fs');
let content = fs.readFileSync('src/components/LoyaltyRulesTab.tsx', 'utf8');

content = content.replace('checked={formData.enableStrictVoucherSingleUse}', 'checked={formData.enableStrictVoucherSingleUse || false}');
content = content.replace('checked={formData.enableWhatsAppNotifications}', 'checked={formData.enableWhatsAppNotifications || false}');

fs.writeFileSync('src/components/LoyaltyRulesTab.tsx', content);
