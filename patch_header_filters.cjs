const fs = require('fs');
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');

const regex = /const handleSearchChange[\s\S]*?className="absolute top-full mt-2 left-0 w-\[500px\] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-slideUp">/;

const newLogic = `const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
    if (val.trim().length > 1) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const sq = searchQuery.toLowerCase();

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(sq) || 
    (m.phone || '').includes(sq) || 
    (m.membershipId || '').toLowerCase().includes(sq)
  ).slice(0, 3);

  const filteredTransactions = transactions.filter(t => 
    (t.id || '').toLowerCase().includes(sq) || 
    (t.receiptNumber || '').toLowerCase().includes(sq) ||
    (t.memberName || '').toLowerCase().includes(sq)
  ).slice(0, 3);

  const filteredStores = stores.filter(s =>
    (s.name || '').toLowerCase().includes(sq) ||
    (s.branchCode || '').toLowerCase().includes(sq) ||
    (s.city || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  const filteredVouchers = vouchers.filter(v =>
    (v.code || '').toLowerCase().includes(sq) ||
    (v.title || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  const filteredCampaigns = campaigns.filter(c =>
    (c.title || '').toLowerCase().includes(sq) ||
    (c.status || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  const filteredSupportTickets = supportTickets.filter(st =>
    (st.id || '').toLowerCase().includes(sq) ||
    (st.subject || '').toLowerCase().includes(sq) ||
    (st.customerName || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  const filteredAuditLogs = auditLogs.filter(a =>
    (a.id || '').toLowerCase().includes(sq) ||
    (a.action || '').toLowerCase().includes(sq) ||
    (a.details || '').toLowerCase().includes(sq) ||
    (a.actorName || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  // Consider loyalty as matching if keyword is 'loyalty', 'point', 'rule'
  const matchLoyalty = ['loyalty', 'point', 'rule', 'tier'].some(kw => sq.includes(kw));

  const hasResults = filteredMembers.length > 0 || 
                     filteredTransactions.length > 0 || 
                     filteredStores.length > 0 ||
                     filteredVouchers.length > 0 ||
                     filteredCampaigns.length > 0 ||
                     filteredSupportTickets.length > 0 ||
                     filteredAuditLogs.length > 0 ||
                     matchLoyalty;

  return (
    <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-20">
      <div className="relative w-[500px] z-50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Global Omnisearch (Members, Vouchers, Stores, Logs...)"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => { if (searchQuery.length > 1) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm font-medium placeholder:font-normal"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">⌘</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">K</span>
          </div>
        </div>
        
        {/* Global Search Dropdown */}
        {showDropdown && (
          <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-slideUp">`;

header = header.replace(/const handleSearchChange[\s\S]*?className="absolute top-full mt-2 left-0 w-\[500px\] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-slideUp">/, newLogic);

fs.writeFileSync('src/components/Header.tsx', header);
