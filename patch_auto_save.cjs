const fs = require('fs');
let content = fs.readFileSync('src/components/LoyaltyRulesTab.tsx', 'utf8');

const target = `  const handleChange = (field: keyof LoyaltyConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsSaved(false);
  };`;

const replacement = `  const handleChange = (field: keyof LoyaltyConfig, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Auto-save for toggles for better UX
      if (typeof value === 'boolean') {
        if (typeof onSaveConfig === 'function') onSaveConfig(next);
        if (typeof setConfig === 'function') setConfig(next);
        setIsSaved(true);
      }
      return next;
    });
    if (typeof value !== 'boolean') {
      setIsSaved(false);
    }
  };`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/LoyaltyRulesTab.tsx', content);
