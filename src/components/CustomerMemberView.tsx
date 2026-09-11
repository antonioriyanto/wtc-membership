import React, { useState, useMemo, useEffect } from 'react';
import { Member, Voucher, StoreBranch, Transaction, Campaign, SupportTicket } from '../types';
import { useCustomDialog } from './CustomDialogProvider';
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
  Building,
  HelpCircle,
  Megaphone,
  Sparkles,
  Check,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send
} from 'lucide-react';
import { WatchClubLogo } from './WatchClubLogo';

interface CustomerMemberViewProps {
  member: Member;
  vouchers: Voucher[];
  stores: StoreBranch[];
  transactions?: Transaction[];
  campaigns?: Campaign[];
  tickets?: SupportTicket[];
  onSubmitTicket?: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'> & { messageText: string }) => void;
  onBackToHO: () => void;
}

export const CustomerMemberView: React.FC<CustomerMemberViewProps> = ({
  member,
  vouchers,
  stores,
  transactions,
  campaigns,
  tickets,
  onSubmitTicket,
  onBackToHO,
}) => {
  const { showAlert } = useCustomDialog();
  const [activeTab, setActiveTab] = useState<'MEMBERSHIP' | 'REWARDS' | 'STORES' | 'PROFILE'>('MEMBERSHIP');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedVoucherForQr, setSelectedVoucherForQr] = useState<Voucher | null>(null);
  const [storeSearch, setStoreSearch] = useState('');

  // Support tickets & campaigns state
  const [activeCampaignModal, setActiveCampaignModal] = useState<Campaign | null>(null);
  const [hasShownCampaignOnLoad, setHasShownCampaignOnLoad] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalTab, setSupportModalTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  // Form states for submitting new ticket
  const [ticketCategory, setTicketCategory] = useState<SupportTicket['category']>('MISSING_POINTS');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketStore, setTicketStore] = useState(stores[0]?.name || 'Puri Jakarta');
  const [ticketReceipt, setTicketReceipt] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccessNotice, setTicketSuccessNotice] = useState<string | null>(null);

  // Push-pop campaign detection
  const activePromoCampaign = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return null;
    return campaigns.find(c => 
      c.status === 'ACTIVE' && 
      (c.targetAudience === 'ALL' || c.targetAudience === member.tier)
    ) || null;
  }, [campaigns, member.tier]);

  useEffect(() => {
    if (!hasShownCampaignOnLoad && activePromoCampaign && activePromoCampaign.showAsPopupOnApp) {
      setActiveCampaignModal(activePromoCampaign);
      setHasShownCampaignOnLoad(true);
    }
  }, [activePromoCampaign, hasShownCampaignOnLoad]);

  const myTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => t.memberId === member.id || t.memberPhone === member.phone);
  }, [tickets, member]);

  const hasUnresolvedTicket = useMemo(() => {
    return myTickets.some(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  }, [myTickets]);

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasUnresolvedTicket) {
      showAlert('Anda masih memiliki tiket kendala yang sedang berlangsung (Open / In Progress). Harap tunggu hingga tiket sebelumnya diselesaikan (Resolved) oleh Tim Support HO sebelum mengajukan tiket baru.', 'Tiket Aktif Ditemukan', 'warning');
      return;
    }
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    if (onSubmitTicket) {
      onSubmitTicket({
        source: 'MEMBER',
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        storeName: ticketStore,
        receiptNo: ticketReceipt.trim() || undefined,
        subject: ticketSubject.trim(),
        category: ticketCategory,
        status: 'OPEN',
        priority: 'HIGH',
        messageText: ticketMessage.trim()
      });
    }

    setTicketSuccessNotice('Tiket Anda berhasil dikirim ke Tim Support HO. Kami akan segera meninjau kendala Anda!');
    setTicketSubject('');
    setTicketReceipt('');
    setTicketMessage('');
    setTimeout(() => {
      setSupportModalTab('HISTORY');
    }, 1200);
  };

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
    if (!transactions || transactions.length === 0) return [];
    
    return transactions
      .filter(t => 
        (member?.id && t.memberId === member.id) || 
        (member?.phone && t.memberPhone === member.phone) || 
        (member?.name && t.memberName === member.name)
      )
      .map(t => {
        let storeDisplayName = 'Watch Club - Branch';
        if (t.type === 'REDEEM' || t.type === 'VOUCHER_DISCOUNT') {
          storeDisplayName = 'Voucher Redeemed';
        } else if (t.storeName) {
          storeDisplayName = t.storeName.startsWith('Watch Club') 
            ? t.storeName 
            : `Watch Club - ${t.storeName}`;
        }

        const txDate = t.timestamp 
          ? new Date(t.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '-';

        return {
          id: t.receiptNo || t.id,
          date: txDate,
          store: storeDisplayName,
          points: Math.abs(t.pointsDelta),
          type: t.pointsDelta >= 0 ? 'EARN' : 'REDEEM'
        };
      })
      .sort((a, b) => {
        // Sort by date descending assuming id/receiptNo gives chronological order or just rely on timestamp if available
        // To keep it simple, if they come from Firestore they are likely ordered, but let's reverse them to show newest first if they aren't.
        return 0; // The source array should be sorted.
      });
  }, [transactions, member]);

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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border border-slate-300 bg-slate-200 flex justify-center items-center font-bold text-slate-500 overflow-hidden shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {activeTab === 'MEMBERSHIP' && (
          <div className="animate-fadeIn pb-5">
            {/* ACTIVE CAMPAIGN PROMO STRIP (IF ANY) */}
            {activePromoCampaign && (
              <div 
                onClick={() => setActiveCampaignModal(activePromoCampaign)}
                className="mx-5 mt-2 p-3 rounded-2xl text-white shadow-md cursor-pointer hover:scale-[1.01] transition-transform flex items-center justify-between gap-3 border border-white/20 relative overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.9)), url(${activePromoCampaign.bannerImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                  <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      {activePromoCampaign.badgeText || 'PROMO KHUSUS MEMBER'}
                    </div>
                    <div className="text-xs font-bold truncate text-white">
                      {activePromoCampaign.headline || activePromoCampaign.name}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg shrink-0 transition-colors relative z-10">
                  Klaim Promo →
                </span>
              </div>
            )}

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
                  <div className={`w-full max-w-[110px] mb-1 ${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-900' : member.tier === 'GOLD' ? 'text-amber-950 font-bold' : 'text-white'}`}>
                    <WatchClubLogo variant={member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'dark' : member.tier === 'GOLD' ? 'dark' : 'white'} />
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
                      : `${((nextTierPoints || 0) - (member.points || 0)).toLocaleString('id-ID')} more points to ${
                          member.tier === 'DIAMOND' ? 'Black' :
                          member.tier === 'PLATINUM' ? 'Diamond' :
                          member.tier === 'GOLD' ? 'Platinum' :
                          member.tier === 'SILVER' ? 'Gold' : 'Silver'
                        } Level`
                    }
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Current Balance: {(member.points || 0).toLocaleString('id-ID')} Points</div>
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
                  {/* Photo Placeholder */}
                  <div className="w-full h-32 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                    <img 
                      src={store.image || 'https://images.unsplash.com/photo-1549429532-6804ff69b22b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'} 
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="text-[0.65rem] font-bold uppercase tracking-wider text-white/90 mb-0.5 shadow-sm">{store.region}</div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow-md">
                        {store.name}
                      </h3>
                      {store.distance !== undefined && (
                        <div className="flex items-center gap-1 text-[0.65rem] font-bold text-emerald-300 drop-shadow-md mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {store.distance < 1 
                              ? `${Math.round(store.distance * 1000)} METER DARI ANDA` 
                              : `${store.distance.toFixed(1)} KM DARI ANDA`}
                          </span>
                        </div>
                      )}
                      {store.distance !== undefined && (
                        <div className="flex items-center gap-1 text-[0.65rem] font-bold text-emerald-300 drop-shadow-md mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {store.distance < 1 
                              ? `${Math.round(store.distance * 1000)} METER DARI ANDA` 
                              : `${store.distance.toFixed(1)} KM DARI ANDA`}
                          </span>
                        </div>
                      )}
                      {store.distance !== undefined && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-white/90 drop-shadow-md mt-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>
                            {store.distance < 1 
                              ? `${Math.round(store.distance * 1000)} m dari Anda` 
                              : `${store.distance.toFixed(1)} km dari Anda`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    <div className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="font-semibold text-slate-800">{store.mallName}</div>
                      <div className="text-slate-500 mt-0.5 flex items-start gap-1">
                        <MapPin className="text-slate-400 w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{store.address || `${store.mallName}, Indonesia`}</span>
                      </div>
                    </div>
                    {store.whatsapp && (
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="text-[#25D366] w-4 h-4 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">WhatsApp:</span>
                        </div>
                        <a 
                          href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                        >
                          {store.whatsapp}
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

                {/* HELP & SUPPORT TICKET SHORTCUT IN PROFILE */}
                <div className="w-full max-w-[400px] mt-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setTicketSuccessNotice(null);
                      setIsSupportModalOpen(true);
                    }}
                    className="w-full p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">Pusat Bantuan & Komplain Poin</div>
                        <div className="text-[11px] text-slate-500">Ajukan keluhan atau cek status tiket Anda</div>
                      </div>
                    </div>
                    {myTickets.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                        {myTickets.length} Tiket
                      </span>
                    )}
                  </button>
                </div>

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

        {/* 1. PUSH-POP CAMPAIGN BANNER MODAL */}
        {activeCampaignModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-[10000] p-4 animate-fadeIn">
            <div className="bg-slate-900 rounded-3xl text-center shadow-2xl w-full max-w-sm overflow-hidden relative animate-scaleUp border border-slate-700">
              <button 
                onClick={() => setActiveCampaignModal(null)}
                className="absolute top-3.5 right-3.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors cursor-pointer z-20 backdrop-blur-sm shadow-md"
              >
                <X className="w-4 h-4" />
              </button>

              {/* 3:4 Banner Image Popup */}
              <div 
                className="relative w-full aspect-[3/4] bg-slate-950 overflow-hidden cursor-pointer group"
                onClick={() => {
                  setActiveCampaignModal(null);
                  setActiveTab('REWARDS');
                }}
              >
                <img 
                  src={activeCampaignModal.bannerImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'} 
                  alt={activeCampaignModal.headline || activeCampaignModal.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-amber-300 mb-2 w-max">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {activeCampaignModal.badgeText || 'PROMO SPESIAL'}
                  </div>
                  <h3 className="text-base font-black leading-tight text-white mb-3">
                    {activeCampaignModal.headline || activeCampaignModal.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCampaignModal(null);
                      setActiveTab('REWARDS');
                    }}
                    className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-lg text-xs"
                  >
                    Gunakan & Lihat Rewards
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CUSTOMER SUPPORT & TICKETS MODAL */}
        {isSupportModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex justify-center items-center z-[10000] p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden relative animate-scaleUp border border-slate-200 text-xs">
              {/* HEADER */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Pusat Bantuan & Tiket Member</h3>
                    <p className="text-[10px] text-slate-500">Terhubung langsung dengan Tim Support Head Office</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsSupportModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* TABS */}
              <div className="flex border-b border-slate-100 bg-slate-50/70">
                <button
                  onClick={() => setSupportModalTab('NEW')}
                  className={`flex-1 py-2.5 text-center font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                    supportModalTab === 'NEW' 
                      ? 'border-blue-600 text-blue-700 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Ajukan Tiket Baru
                </button>
                <button
                  onClick={() => setSupportModalTab('HISTORY')}
                  className={`flex-1 py-2.5 text-center font-bold text-xs border-b-2 transition-colors cursor-pointer relative ${
                    supportModalTab === 'HISTORY' 
                      ? 'border-blue-600 text-blue-700 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Riwayat Tiket Saya</span>
                  {myTickets.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
                      {myTickets.length}
                    </span>
                  )}
                </button>
              </div>

              {/* MODAL CONTENT */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {supportModalTab === 'NEW' ? (
                  <form onSubmit={handleCreateTicketSubmit} className="space-y-3">
                    {hasUnresolvedTicket && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Tiket Aktif Ditemukan:</strong> Anda memiliki tiket kendala yang belum diselesaikan (Resolved). Anda tidak dapat mengajukan tiket baru sampai tiket sebelumnya selesai. Cek <button type="button" onClick={() => setSupportModalTab('HISTORY')} className="underline font-bold text-blue-700 cursor-pointer">Riwayat Tiket Saya</button>.
                        </div>
                      </div>
                    )}
                    {ticketSuccessNotice && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{ticketSuccessNotice}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Kategori Masalah *
                      </label>
                      <select 
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none"
                      >
                        <option value="MISSING_POINTS">Poin Belanja Belum Masuk</option>
                        <option value="VOUCHER_CLAIM">Kendala Klaim / Scan Voucher</option>
                        <option value="DATA_CORRECTION">Koreksi Data / No. HP Akun</option>
                        <option value="GENERAL_INQUIRY">Pertanyaan Umum Loyalty</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Toko Tempat Transaksi
                      </label>
                      <select
                        value={ticketStore}
                        onChange={(e) => setTicketStore(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none"
                      >
                        {stores.map(s => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                          Judul Singkat Keluhan *
                        </label>
                        <input
                          type="text"
                          required
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="Contoh: Belanja kemarin poin belum bertambah"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                          Nomor Struk / Invoice (Opsional)
                        </label>
                        <input
                          type="text"
                          value={ticketReceipt}
                          onChange={(e) => setTicketReceipt(e.target.value)}
                          placeholder="Contoh: INV-20260820-PUR-001"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Rincian Keluhan / Pertanyaan *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Jelaskan detail belanja Anda, jam berapa, atau kendala voucher..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Tiket ke Support HO</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {myTickets.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-700">Belum ada riwayat tiket</p>
                        <p className="text-[11px] text-slate-400">Jika mengalami kendala poin atau voucher, klik tab "Ajukan Tiket Baru".</p>
                      </div>
                    ) : (
                      myTickets.map(t => (
                        <div key={t.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {t.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                              t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="font-bold text-slate-900">{t.subject}</div>

                          {t.storeName && (
                            <div className="text-[11px] text-slate-500">
                              Cabang: <strong>{t.storeName}</strong> {t.receiptNo ? `• Struk: ${t.receiptNo}` : ''}
                            </div>
                          )}

                          {/* POINT ADJUSTMENT HIGHLIGHT (IF APPLIED BY HO) */}
                          {t.adjustmentMade && (
                            <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-[11px] flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                HO menyalurkan {t.adjustmentMade.pointsDelta > 0 ? `+${t.adjustmentMade.pointsDelta}` : t.adjustmentMade.pointsDelta} Pts ({t.adjustmentMade.note})
                              </span>
                            </div>
                          )}

                          {/* RECENT MESSAGE */}
                          {t.messages.length > 0 && (
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
                              <div className="font-bold text-blue-600 mb-0.5">
                                {t.messages[t.messages.length - 1].sender === 'AGENT' ? (t.assignedTo || 'Tim Support HO') : 'Anda'}:
                              </div>
                              <p className="italic">"{t.messages[t.messages.length - 1].text}"</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
