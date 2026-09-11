const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('const handleDeleteCampaign = ')) {
    const fn = `
  const handleDeleteCampaign = (id: string) => {
    setCampaigns(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem('wtc_campaigns', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  `;
    content = content.replace("const handleUpdateTicket", fn + "\n  const handleUpdateTicket");
    fs.writeFileSync('src/App.tsx', content);
    console.log('Added handleDeleteCampaign');
}
