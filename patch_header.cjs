const fs = require('fs');

let header = fs.readFileSync('src/components/Header.tsx', 'utf8');

// We need to add `members` and `transactions` and callbacks to HeaderProps
const headerProps = `interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenCreateVoucher: () => void;
  onOpenManualAdjust: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  members?: any[];
  transactions?: any[];
  onSelectMember?: (member: any) => void;
  onSelectTransaction?: (transaction: any) => void;
}`;
header = header.replace(/interface HeaderProps \{[\s\S]*?\}/, headerProps);

// Add missing imports
if (!header.includes("User") || !header.includes("Receipt as ReceiptIcon")) {
  header = header.replace("import { Search, Plus, RefreshCcw, Bell } from 'lucide-react';", "import { Search, Plus, RefreshCcw, Bell, User, Receipt as ReceiptIcon } from 'lucide-react';");
}

const componentDefRegex = /export const Header: React\.FC<HeaderProps> = \(\{[\s\S]*?\}\) => \{/;
const newComponentDef = `export const Header: React.FC<HeaderProps> = ({
  onSearch, 
  onOpenCreateVoucher, 
  onOpenManualAdjust, 
  onRefreshData,
  isRefreshing = false,
  onOpenNotifications,
  unreadNotificationsCount,
  members = [],
  transactions = [],
  onSelectMember,
  onSelectTransaction
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
    if (val.trim().length > 1) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.phone || '').includes(searchQuery) || 
    (m.membershipId || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const filteredTransactions = transactions.filter(t => 
    (t.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.receiptNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.memberName || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);`;

header = header.replace(componentDefRegex, newComponentDef);

// Find the input element and wrap it in a container for the dropdown
const inputBlockRegex = /<div className="relative w-96">[\s\S]*?<\/div>/;

const newInputBlock = `<div className="relative w-96 z-50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Global Search (ID, Name, Phone)..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => { if (searchQuery.length > 1) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-sm"
          />
        </div>
        
        {/* Global Search Dropdown */}
        {showDropdown && (
          <div className="absolute top-full mt-2 left-0 w-[500px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-slideUp">
            {filteredMembers.length === 0 && filteredTransactions.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {filteredMembers.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Members
                    </div>
                    {filteredMembers.map(m => (
                      <div 
                        key={m.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectMember) onSelectMember(m);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-slate-900">{m.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{m.tier}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 pl-6">
                          <span className="text-xs font-medium text-slate-500">{m.membershipId}</span>
                          <span className="text-xs font-medium text-slate-500">{m.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {filteredTransactions.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Transactions
                    </div>
                    {filteredTransactions.map(t => (
                      <div 
                        key={t.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectTransaction) onSelectTransaction(t);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ReceiptIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-slate-900">{t.receiptNumber || t.id.slice(0,8)}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">{(t.pointsDelta || 0) > 0 ? '+' : ''}{t.pointsDelta || 0} Pts</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 pl-6">
                          <span className="text-xs font-medium text-slate-500">{t.memberName || 'Unknown Member'}</span>
                          <span className="text-xs font-medium text-slate-400">Rp {(t.amount || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>`;

header = header.replace(inputBlockRegex, newInputBlock);
fs.writeFileSync('src/components/Header.tsx', header);
