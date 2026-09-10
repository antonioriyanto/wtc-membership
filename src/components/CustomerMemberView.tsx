import React, { useState, useMemo } from 'react';
import { Member, Voucher, StoreBranch, Transaction } from '../types';
import { 
  CreditCard, 
  Award, 
  MapPin, 
  User, 
  ArrowLeft, 
  ChevronRight, 
  X, 
  Percent,
  Wrench,
  Gift,
  ArrowUp,
  Ticket,
  Search,
  MessageCircle,
  Camera,
  LogOut,
  Building
} from 'lucide-react';
import { WatchClubLogo } from './WatchClubLogo';

interface CustomerMemberViewProps {
  member: Member;
  vouchers: Voucher[];
  stores: StoreBranch[];
  transactions?: Transaction[];
  onBackToHO: () => void;
}

export const CustomerMemberView: React.FC<CustomerMemberViewProps> = ({
  member,
  vouchers,
  stores,
  transactions,
  onBackToHO,
}) => {
  const [activeTab, setActiveTab] = useState<'MEMBERSHIP' | 'REWARDS' | 'STORES' | 'PROFILE'>('MEMBERSHIP');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedVoucherForQr, setSelectedVoucherForQr] = useState<Voucher | null>(null);
  const [storeSearch, setStoreSearch] = useState('');

  let nextTierPoints = 5000;
  if (member.points >= 100000 || member.tier === 'BLACK') nextTierPoints = 100000; // maxed out
  else if (member.points >= 50000 || member.tier === 'DIAMOND') nextTierPoints = 100000;
  else if (member.points >= 30000 || member.tier === 'PLATINUM') nextTierPoints = 50000;
  else if (member.points >= 10000 || member.tier === 'GOLD') nextTierPoints = 30000;
  else if (member.points >= 5000 || member.tier === 'SILVER') nextTierPoints = 10000;

  const progressPercent = Math.min(100, (member.points / nextTierPoints) * 100);

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.mallName.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.city.toLowerCase().includes(storeSearch.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(storeSearch.toLowerCase()))
  );

  // Map transactions using provided store dataset
  const memberTransactions = useMemo(() => {
    // 1. If we have matched transactions from props
    if (transactions && transactions.length > 0) {
      const matched = transactions.filter(
        t => (member?.id && t.memberId === member.id) || 
             (member?.phone && t.memberPhone === member.phone) ||
             (member?.name && t.memberName === member.name)
      );
      if (matched.length > 0) {
        return matched.map(t => {
          let storeDisplayName = 'Watch Club - Puri Jakarta';
          if (t.type === 'REDEEM' || t.type === 'VOUCHER_DISCOUNT') {
            storeDisplayName = 'Voucher Redeemed';
          } else if (t.storeName) {
            storeDisplayName = t.storeName.startsWith('Watch Club') 
              ? t.storeName 
              : `Watch Club - ${t.storeName}`;
          }

          const txDate = t.timestamp 
            ? new Date(t.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '20 Aug 2026';

          return {
            id: t.receiptNo || t.id,
            date: txDate,
            store: storeDisplayName,
            points: Math.abs(t.pointsDelta),
            type: t.pointsDelta >= 0 ? 'EARN' : 'REDEEM'
          };
        });
      }
    }

    // 2. Default transaction history mapped strictly to provided stores
    const availableStores = stores.length > 0 ? stores : [
      { name: 'Puri Jakarta' },
      { name: 'Kota Kasablanka Jakarta' },
      { name: '23 Paskal Bandung' },
      { name: 'Paragon Semarang' },
      { name: 'Solo Baru' },
      { name: 'Level 21 Bali' }
    ];

    const getStoreName = (idx: number, fallback: string) => {
      const found = availableStores[idx % availableStores.length];
      const rawName = found ? found.name : fallback;
      return rawName.startsWith('Watch Club') ? rawName : `Watch Club - ${rawName}`;
    };

    return [
      { id: 'INV-00121', date: '20 Aug 2026', store: getStoreName(0, 'Puri Jakarta'), points: 120, type: 'EARN' },
      { id: 'VOUCHER-POS', date: '20 Aug 2026', store: 'Voucher Redeemed', points: 50, type: 'REDEEM' },
      { id: 'INV-00119', date: '19 Aug 2026', store: getStoreName(1, 'Kota Kasablanka Jakarta'), points: 85, type: 'EARN' },
      { id: 'INV-00080', date: '10 Aug 2026', store: getStoreName(2, '23 Paskal Bandung'), points: 300, type: 'EARN' },
      { id: 'INV-00045', date: '02 Aug 2026', store: getStoreName(3, 'Paragon Semarang'), points: 150, type: 'EARN' },
      { id: 'INV-00012', date: '15 Jul 2026', store: getStoreName(4, 'Level 21 Bali'), points: 50, type: 'EARN' },
    ];
  }, [transactions, member, stores]);

  const navItems = [
    { id: 'MEMBERSHIP', label: 'Membership', icon: CreditCard },
    { id: 'REWARDS', label: 'Rewards', icon: Award },
    { id: 'STORES', label: 'Stores', icon: MapPin },
    { id: 'PROFILE', label: 'Profile', icon: User }
  ] as const;

  return (
    <div className="w-full h-full bg-slate-900 overflow-y-auto">
      <div className="w-full max-w-[480px] min-h-screen mx-auto bg-slate-50 text-slate-900 pb-[100px] relative shadow-2xl">
        
        <header className="flex justify-between items-center p-5 bg-slate-50/90 backdrop-blur-md sticky top-0 z-50">
          <button onClick={onBackToHO} className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-[110px] text-slate-900 flex justify-center">
            <WatchClubLogo />
          </div>
          <div className="w-10 h-10 rounded-full border border-slate-300 bg-slate-200 flex justify-center items-center font-bold text-slate-500 overflow-hidden shrink-0">
            {member.name.charAt(0).toUpperCase()}
          </div>
        </header>

        {activeTab === 'MEMBERSHIP' && (
          <div className="animate-fadeIn pb-5">
            <section className="px-5 pt-4 pb-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Hello <span className="capitalize">{member.name.split(' ')[0]}</span>! Welcome to the Club!
              </h2>
            </section>

            <section className="px-5 mt-2.5">
              <div 
                className={`rounded-[10px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden grid grid-cols-[1.3fr_0.7fr] p-6 aspect-[2/1] cursor-pointer hover:scale-[1.02] transition-transform ${
                  member.tier === 'BLUE' || member.tier === 'GOLD' ? 'text-white' : member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-900' : 'text-white bg-[radial-gradient(circle_at_top_left,#1e293b,#0f172a)]'
                }`}
                style={
                  member.tier === 'BLUE' ? {
                    background: 'linear-gradient(135deg, #4375A6 0%, #30466E 25%, #222649 50%, #17182C 75%, #101010 100%)'
                  } : member.tier === 'SILVER' ? {
                    background: 'linear-gradient(135deg, #F8F4F3 0%, #A3A3A3 25%, #FCFCFC 50%, #909090 75%, #F4F0F1 100%)'
                  } : member.tier === 'GOLD' ? {
                    background: 'linear-gradient(135deg, #EEC944 0%, #FAE56F 25%, #DDAF1D 50%, #FFFA8A 75%, #B96F15 100%)'
                  } : member.tier === 'PLATINUM' ? {
                    background: 'linear-gradient(135deg, #ECF1F7 0%, #A7B8CA 25%, #E2E7ED 50%, #A7B8CA 75%, #F8F7FC 100%)'
                  } : member.tier === 'DIAMOND' ? {
                    background: 'linear-gradient(135deg, #F9FFFF 0%, #FFFFFF 12.5%, #CCD7E7 25%, #FDE2CA 30.61%, #B9C9DD 38.27%, #E7F7E0 50%, #FFFFFF 62.29%, #FEEBF0 70.02%, #DCE4EE 75%, #B9C9DD 85.2%, #FFFFFF 100%)'
                  } : undefined
                }
                onClick={() => {
                  setSelectedVoucherForQr(null);
                  setIsQrModalOpen(true);
                }}
              >
                <div className="flex flex-col justify-between h-full">
                  <div className={`text-[0.65rem] sm:text-xs tracking-widest font-bold uppercase ${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-700' : member.tier === 'GOLD' ? 'text-amber-950 font-extrabold' : 'text-slate-300'}`}>{member.tier} MEMBER</div>
                  <div className={`text-xl sm:text-2xl font-bold tracking-wide uppercase mt-auto mb-0 leading-none ${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-900' : member.tier === 'GOLD' ? 'text-amber-950' : 'text-slate-100'}`}>{member.name}</div>
                  <div className={`text-xs sm:text-sm tracking-[3px] font-semibold mt-1 whitespace-nowrap ${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-700' : member.tier === 'GOLD' ? 'text-amber-900 font-bold' : 'text-slate-300'}`}>{member.membershipId}</div>
                </div>
                <div className="flex flex-col justify-between items-end text-right h-full">
                  <div className={`w-full max-w-[110px] mb-1 ${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'brightness-0 contrast-200' : member.tier === 'GOLD' ? 'text-amber-950 font-bold' : 'text-white'}`}>
                    <WatchClubLogo />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 w-full mt-auto">
                    <div className="w-[60px] sm:w-[70px] h-[60px] sm:h-[70px] bg-white rounded-[4px] p-1 flex justify-center items-center shadow-lg transition-transform hover:scale-105">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(member.membershipId)}`} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div className={`text-[0.55rem] sm:text-[0.65rem] font-semibold uppercase tracking-wider ${member.tier === 'SILVER' || member.tier === 'PLATINUM' ? 'text-slate-700' : member.tier === 'GOLD' ? 'text-amber-950 font-bold' : 'text-slate-300'}`}>Tap for QR</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white m-5 p-5 rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
              <div className="flex justify-between items-end mb-3">
                <div><span className="font-bold text-sm text-slate-900">{member.tier} Level</span></div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-900">
                    {member.tier === 'BLACK' 
                      ? 'Top Tier Reached'
                      : `${(nextTierPoints - member.points).toLocaleString('id-ID')} more points to ${
                          member.tier === 'DIAMOND' ? 'Black' :
                          member.tier === 'PLATINUM' ? 'Diamond' :
                          member.tier === 'GOLD' ? 'Platinum' :
                          member.tier === 'SILVER' ? 'Gold' : 'Silver'
                        } Level`
                    }
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Current Balance: {member.points.toLocaleString('id-ID')} Points</div>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </section>

            <section className="m-5">
              <h2 className="text-base font-bold mb-4 pl-1 text-slate-900">Your {member.tier} Level Benefits</h2>
              <ul className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] px-5 py-2.5 border border-slate-100">
                <li className="flex items-center py-4 border-b border-slate-100 last:border-0">
                  <div className="text-lg text-slate-500 mr-4 w-6 text-center"><Percent className="w-5 h-5 mx-auto" /></div>
                  <div className="flex-grow">
                    <div className="font-semibold text-sm text-slate-900">Additional 10% Discount</div>
                    <div className="text-xs text-slate-500 mt-0.5">Valid store-wide</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </li>
                <li className="flex items-center py-4 border-b border-slate-100 last:border-0">
                  <div className="text-lg text-slate-500 mr-4 w-6 text-center"><Wrench className="w-5 h-5 mx-auto" /></div>
                  <div className="flex-grow">
                    <div className="font-semibold text-sm text-slate-900">Watch Services Discount</div>
                    <div className="text-xs text-slate-500 mt-0.5">10% off repairs</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </li>
                <li className="flex items-center py-4 border-b border-slate-100 last:border-0">
                  <div className="text-lg text-slate-500 mr-4 w-6 text-center"><Gift className="w-5 h-5 mx-auto" /></div>
                  <div className="flex-grow">
                    <div className="font-semibold text-sm text-slate-900">Watch Club Sticker Pack</div>
                    <div className="text-xs text-slate-500 mt-0.5">Free quarterly design</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </li>
              </ul>
            </section>

            <section className="m-5">
              <div className="flex justify-between items-center mb-4 pl-1">
                <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
              </div>
              <div className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] mb-4 relative overflow-hidden border border-slate-100">
                <div className="px-5 pt-2.5 pb-0">
                  {memberTransactions.slice(0, 2).map((trx, idx) => (
                    <div key={idx} className="flex items-center py-4 border-b border-slate-100 last:border-0">
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex justify-center items-center mr-4 text-base ${trx.type === 'EARN' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                        {trx.type === 'EARN' ? <ArrowUp className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                      </div>
                      <div className="flex-grow min-w-0 pr-2">
                        <div className="font-semibold text-sm text-slate-900 truncate">{trx.store}</div>
                        <div className="text-xs text-slate-500 mt-1 truncate">{trx.date} • {trx.id}</div>
                      </div>
                      <div className={`font-bold text-sm shrink-0 whitespace-nowrap ${trx.type === 'EARN' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trx.type === 'EARN' ? '+' : '-'}{(trx.points || 0).toLocaleString('id-ID')} Pts
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative -mt-7 pt-10 px-5 pb-5 bg-gradient-to-b from-transparent via-white/95 to-white z-10 rounded-b-[24px]">
                  <button 
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-full font-semibold text-sm cursor-pointer transition-colors hover:bg-slate-200 shadow-sm"
                  >
                    Show More History
                  </button>
                </div>
              </div>
            </section>

            <section className="m-5">
              <h2 className="text-base font-bold mb-4 pl-1 text-slate-900">Your Active Vouchers</h2>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-2.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {vouchers.map((v, i) => (
                  <div key={v.id} className="flex-[0_0_calc(100%-40px)] max-w-[400px] bg-slate-900 text-white rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] snap-start flex flex-col justify-between relative overflow-hidden min-h-[220px]" style={{
                    backgroundImage: v.imagePath ? `url('${v.imagePath}')` : 'linear-gradient(to bottom right, #fef08a, #c7d2fe)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    <div className="absolute inset-0 bg-black/40 z-0"></div>
                    <div className="relative z-10 h-full flex flex-col">
                    <div className="text-xs font-bold tracking-wider mb-1 text-white/90 uppercase drop-shadow-md">{v.subtitle}</div>
                    <div className="text-5xl font-bold leading-none mb-1 tracking-tight text-white drop-shadow-md">
                      {v.discountType === 'PERCENTAGE' ? `${v.discountValue}% OFF` : `Rp ${(v.discountValue/1000)}K`}
                    </div>
                    <div className="text-base font-semibold mb-1 text-white drop-shadow-md">{v.title}</div>
                    <div className="text-xs text-white/80 mb-6 font-medium drop-shadow-md">Valid until {v.validUntil}</div>
                    
                    <div className="flex flex-col items-start gap-2.5 relative mt-auto z-10">
                      <button 
                        onClick={() => {
                          setSelectedVoucherForQr(v);
                          setIsQrModalOpen(true);
                        }}
                        className="bg-white text-slate-900 border-none py-3 px-6 rounded-full text-sm font-semibold cursor-pointer transition-transform hover:scale-105 shadow-lg"
                      >
                        Use Now
                      </button>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'REWARDS' && (
          <div className="animate-fadeIn pb-5">
            <div className="px-5 pt-5 pb-2.5">
              <h1 className="text-2xl font-bold text-slate-900">My Rewards</h1>
              <p className="text-sm text-slate-500 mt-1">Your active vouchers and collected points</p>
            </div>

            <section className="m-5">
              <div className="flex flex-col gap-6">
                {vouchers.map(v => (
                  <div key={v.id} className="w-full bg-slate-900 rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden min-h-[220px]" style={{
                    backgroundImage: v.imagePath ? `url('${v.imagePath}')` : 'linear-gradient(to bottom right, #0f172a, #1e293b)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    <div className="absolute inset-0 bg-black/50 z-0"></div>
                    
                    <div className="relative z-20 h-full flex flex-col">
                      <div className="text-xs font-bold tracking-wider mb-1 text-slate-300 uppercase">{v.subtitle}</div>
                      <div className="text-[3.5rem] font-bold leading-none mb-1 tracking-[-2px] text-white">
                        {v.discountType === 'PERCENTAGE' ? `${v.discountValue}% OFF` : `Rp ${(v.discountValue/1000)}K`}
                      </div>
                      <div className="text-lg font-medium mb-1 text-white">{v.title}</div>
                      <div className="text-sm text-slate-400 mb-6 font-medium">Valid until {v.validUntil}</div>
                      
                      <div className="flex flex-col items-start gap-3 mt-auto">
                        <button 
                          onClick={() => {
                            setSelectedVoucherForQr(v);
                            setIsQrModalOpen(true);
                          }}
                          className="bg-slate-800 text-white border border-white/10 py-2.5 px-6 rounded-full text-sm font-semibold cursor-pointer transition-colors hover:bg-slate-950 hover:border-slate-500 self-start shadow-md"
                        >
                          Use Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'STORES' && (
          <div className="animate-fadeIn pb-5">
            <div className="px-5 pt-5 pb-2.5">
              <h1 className="text-2xl font-bold text-slate-900">Our Stores</h1>
              <p className="text-sm text-slate-500 mt-1 mb-4">Official Watch Club store locations across Indonesia</p>
              
              <div className="relative w-full">
                <Search className="absolute left-[18px] top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  placeholder="Search store name, mall, or city..." 
                  className="w-full py-3 pr-5 pl-11 rounded-full border border-slate-200 bg-white text-[0.95rem] text-slate-900 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] transition-all focus:outline-none focus:border-slate-400 focus:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 px-5 py-2.5 pb-5">
              {filteredStores.map((store, idx) => (
                <div key={store.id} className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5 border border-slate-100">
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{store.region}</div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {store.name.startsWith('Watch Club') ? store.name : `Watch Club - ${store.name}`}
                        </h3>
                      </div>
                      <span className="text-[0.65rem] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider shrink-0 border border-slate-200">
                        {store.code}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="font-semibold text-slate-800">{store.mallName}</div>
                      <div className="text-slate-500 mt-0.5">{store.city}</div>
                    </div>

                    <div className="flex items-start gap-2.5 text-[0.8rem] text-slate-500 leading-relaxed font-medium">
                      <MapPin className="text-slate-700 w-4 h-4 mt-0.5 shrink-0" />
                      <span>{store.address || `${store.mallName}, Indonesia`}</span>
                    </div>

                    {store.whatsapp && (
                      <div className="flex items-center gap-2 pt-1 mt-1 border-t border-slate-100">
                        <MessageCircle className="text-[#25D366] w-4 h-4 shrink-0" />
                        <a 
                          href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-semibold text-[#25D366] hover:underline"
                        >
                          WhatsApp: {store.whatsapp}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'PROFILE' && (
          <div className="animate-fadeIn pb-5">
            <div className="px-5 pt-5 pb-2.5 text-center">
              <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your account information</p>
            </div>

            <section className="px-5 pt-2.5 pb-[30px]">
              <div className="bg-white rounded-[20px] shadow-sm p-6 sm:p-8 flex flex-col items-center border border-slate-200/80">
                
                <div className="relative mb-6">
                  <div className="w-[80px] h-[80px] rounded-full bg-slate-900 text-white flex justify-center items-center text-2xl font-bold shadow-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="w-full max-w-[400px] mb-6 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                    <div className="text-[0.65rem] uppercase tracking-wider font-bold text-slate-400">Home Store</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">{member.registeredStore || 'Puri Jakarta'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                    <div className="text-[0.65rem] uppercase tracking-wider font-bold text-slate-400">Tier</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{member.tier}</div>
                  </div>
                </div>

                <form className="w-full max-w-[400px] space-y-4 text-left" onSubmit={e => e.preventDefault()}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                    <input type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium" value={member.name} readOnly disabled />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                    <input type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium" value={member.phone} readOnly disabled />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input type="email" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-900 text-sm font-medium" placeholder="Enter your email" defaultValue={member.email || ''} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Address</label>
                    <textarea className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-900 text-sm font-medium resize-y min-h-[70px]" placeholder="Enter your full address" defaultValue={member.address || ''}></textarea>
                  </div>

                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer mt-2">
                    Save Changes
                  </button>
                </form>

                <button type="button" onClick={onBackToHO} className="w-full max-w-[400px] bg-white hover:bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl text-sm font-semibold transition-colors mt-3 flex justify-center items-center gap-2 cursor-pointer">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </section>
          </div>
        )}

        <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[400px] bg-white/85 backdrop-blur-md rounded-[40px] flex justify-around items-center p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-[1000] border border-slate-200/50">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 w-[60px] transition-colors bg-transparent border-none cursor-pointer ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <div className={`w-10 h-10 rounded-full flex justify-center items-center text-[1.2rem] transition-colors ${isActive ? 'bg-slate-900 text-white shadow-sm' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[0.65rem] font-semibold text-center leading-[1.1]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {isHistoryModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-fadeIn">
            <div className="bg-white rounded-[24px] text-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] w-full max-w-[420px] p-[25px_20px] relative animate-scaleUp">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="absolute top-4 right-4 bg-slate-100 border-none w-[30px] h-[30px] rounded-full cursor-pointer text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 flex justify-center items-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="mb-4 text-center">
                <h3 className="mb-1 text-lg font-bold text-slate-900">All Transactions</h3>
                <p className="text-[0.85rem] text-slate-500 font-medium">Your complete transaction history</p>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto text-left pr-2 mt-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {memberTransactions.map((trx, idx) => (
                  <div key={idx} className="flex items-center py-4 border-b border-slate-100 last:border-0 transition-colors">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex justify-center items-center mr-4 text-base ${trx.type === 'EARN' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                      {trx.type === 'EARN' ? <ArrowUp className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                    </div>
                    <div className="flex-grow min-w-0 pr-2">
                      <div className="font-semibold text-[0.9rem] text-slate-900 truncate">{trx.store}</div>
                      <div className="text-[0.75rem] text-slate-500 mt-1 truncate">{trx.date} • {trx.id}</div>
                    </div>
                    <div className={`font-bold text-[0.95rem] shrink-0 whitespace-nowrap ${trx.type === 'EARN' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {trx.type === 'EARN' ? '+' : '-'}{(trx.points || 0).toLocaleString('id-ID')} Pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isQrModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-fadeIn">
            <div className="bg-white rounded-[24px] text-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] w-[90%] max-w-[340px] p-7 relative animate-scaleUp">
              <button 
                onClick={() => {
                  setIsQrModalOpen(false);
                  setSelectedVoucherForQr(null);
                }}
                className="absolute top-4 right-4 bg-slate-100 border-none w-[30px] h-[30px] rounded-full cursor-pointer text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 flex justify-center items-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="mb-6 text-center">
                <h3 className="mb-2 text-lg font-bold text-slate-900">{selectedVoucherForQr ? 'Scan to Redeem' : 'Cashier Scan'}</h3>
                <p className="text-[0.85rem] text-slate-500 font-medium">{selectedVoucherForQr ? 'Show this code to the cashier' : 'Present this QR code at checkout'}</p>
              </div>
              
              <div className="w-[200px] h-[200px] mx-auto mb-5 bg-white rounded-2xl flex justify-center items-center p-3 shadow-inner border border-slate-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    selectedVoucherForQr ? selectedVoucherForQr.code : member.membershipId
                  )}`} 
                  alt="QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="font-bold text-slate-900 m-0">
                {selectedVoucherForQr ? 'Code:' : 'ID:'} <span className="font-mono ml-1 text-slate-700 tracking-wide">{selectedVoucherForQr ? selectedVoucherForQr.code : member.membershipId}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
