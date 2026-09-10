import React, { useState } from 'react';
import { 
  StoreBranch, 
  Member, 
  Transaction, 
  Voucher, 
  LoyaltyConfig 
} from '../types';
import { 
  TrendingUp, 
  Users, 
  Store, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Gift, 
  ShieldCheck, 
  Award, 
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface OverviewTabProps {
  stores: StoreBranch[];
  members: Member[];
  transactions: Transaction[];
  vouchers: Voucher[];
  loyaltyConfig: LoyaltyConfig;
  onNavigateToStores: () => void;
  onNavigateToMembers: () => void;
  onNavigateToVouchers: () => void;
  onOpenManualAdjust: () => void;
  onSelectStore: (store: StoreBranch) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stores,
  members,
  transactions,
  vouchers,
  loyaltyConfig,
  onNavigateToStores,
  onNavigateToMembers,
  onNavigateToVouchers,
  onOpenManualAdjust,
  onSelectStore,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Aggregate stats
  const totalRevenueToday = stores.reduce((acc, s) => acc + s.todayRevenue, 0);
  const totalTransactionsToday = stores.reduce((acc, s) => acc + s.todayTransactions, 0);
  const totalPointsIssuedToday = stores.reduce((acc, s) => acc + s.todayPointsIssued, 0);
  const activeStoresCount = stores.filter(s => s.status === 'ONLINE').length;
  
  const blueCount = members.filter(m => m.tier === 'BLUE').length;
  const silverCount = members.filter(m => m.tier === 'SILVER').length;
  const goldCount = members.filter(m => m.tier === 'GOLD').length;
  const platinumCount = members.filter(m => m.tier === 'PLATINUM').length;
  const diamondCount = members.filter(m => m.tier === 'DIAMOND').length;
  const blackCount = members.filter(m => m.tier === 'BLACK').length;

  const totalPointsInCirculation = members.reduce((acc, m) => acc + m.points, 0);

  // Top 5 Performing Stores
  const topStores = [...stores].sort((a, b) => b.todayRevenue - a.todayRevenue).slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
          <div className="h-5 w-44 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl border border-slate-800 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-slate-800 rounded-full" />
          <div className="h-8 w-72 bg-slate-800 rounded-xl" />
          <div className="h-4 w-96 bg-slate-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              </div>
              <div className="h-7 w-36 bg-slate-200 rounded-lg" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
            <div className="h-6 w-52 bg-slate-200 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-12 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Skeleton Trigger Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Live Data Synchronization Active (+40 Stores Connected)</span>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Simulate Skeleton Fetch / Refresh</span>
        </button>
      </div>
      {/* Welcome Banner with Quick Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Watch Club National Retail Network
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              Head Office Executive Portal
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Monitoring real-time loyalty transactions, branch performance, and member activity across <strong>+40 stores in Indonesia</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl text-left shadow-inner">
              <div className="text-[11px] font-medium text-slate-400">Total Branches</div>
              <div className="text-lg font-bold text-white flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                <span>{stores.length} Stores</span>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl text-left shadow-inner">
              <div className="text-[11px] font-medium text-slate-400">Total Loyalty Balance</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {totalPointsInCirculation.toLocaleString('id-ID')} Pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Sales Recorded</span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5 text-amber-300" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            Rp {(totalRevenueToday / 1000000).toFixed(1)} Jt
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{totalTransactionsToday} purchases logged today</span>
          </div>
        </div>

        {/* Card 2: Points Issued Today */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Points Issued Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tracking-tight">
            +{totalPointsIssuedToday.toLocaleString('id-ID')} Pts
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
            <span>Rate: 1 Pt per Rp {(loyaltyConfig.amountUnit).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Card 3: Active Members */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered Members</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {members.length.toLocaleString('id-ID')} Members
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{blackCount} Blk</span>
            <span>•</span>
            <span className="font-semibold text-amber-600">{goldCount} Gold</span>
            <span>•</span>
            <span className="text-slate-500">{blueCount} Blue</span>
          </div>
        </div>

        {/* Card 4: Store Health */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Store Network Health</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{activeStoresCount}/{stores.length}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-sans">
              100% Online
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>All terminals synced to cloud</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Store Performance & Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Top Performing Branches */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Top Performing Store Branches Today</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time revenue, customer throughput, and points generated per branch</p>
            </div>
            <button
              id="view-all-stores-transactions-btn"
              onClick={onNavigateToStores}
              title="Lihat seluruh transaksi dari 41 toko di Indonesia"
              className="text-xs font-semibold text-slate-900 hover:text-amber-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-amber-50 transition-all border border-transparent hover:border-amber-200"
            >
              <span>View All +40 Stores</span>
              <ChevronRight className="w-4 h-4 text-amber-600" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topStores.map((store, index) => {
              const maxRev = topStores[0]?.todayRevenue || 1;
              const percent = Math.min(100, Math.round((store.todayRevenue / maxRev) * 100));

              return (
                <div 
                  key={store.id}
                  id={`top-store-row-${store.id}`}
                  onClick={() => onSelectStore(store)}
                  title={`Klik untuk melihat seluruh transaksi cabang ${store.name}`}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 p-3 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                          {store.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md shrink-0">
                          {store.region}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>{store.todayTransactions} receipts</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">+{store.todayPointsIssued} Pts Issued</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-slate-900 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-12 sm:pl-0 flex flex-col items-end">
                    <div className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      Rp {store.todayRevenue.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-slate-400">Daily Volume</div>
                    <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mt-0.5">
                      Lihat Transaksi →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Loyalty Tier Breakdown & Quick Promos */}
        <div className="space-y-6">
          {/* Tier Distribution Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Tier Membership Distribution</span>
              </h3>
              <button 
                onClick={onNavigateToMembers}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {/* Black Tier */}
              <div className="p-3.5 rounded-2xl bg-black text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase text-slate-300">Black Tier</div>
                  <div className="text-[11px] text-slate-400">100,000+ Pts • 3.0x Multiplier</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{blackCount}</div>
                  <div className="text-[10px] text-slate-400">{Math.round((blackCount / (members.length || 1)) * 100)}% base</div>
                </div>
              </div>

              {/* Diamond Tier */}
              <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200/80 text-cyan-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase text-cyan-800">Diamond Tier</div>
                  <div className="text-[11px] text-cyan-700/80">50,000 - 99,999 Pts • 2.5x Multiplier</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-900">{diamondCount}</div>
                  <div className="text-[10px] text-cyan-700">{Math.round((diamondCount / (members.length || 1)) * 100)}% base</div>
                </div>
              </div>

              {/* Platinum Tier */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase text-slate-300">Platinum Tier</div>
                  <div className="text-[11px] text-slate-400">30,000 - 49,999 Pts • 2.0x Multiplier</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-300">{platinumCount}</div>
                  <div className="text-[10px] text-slate-400">{Math.round((platinumCount / (members.length || 1)) * 100)}% base</div>
                </div>
              </div>

              {/* Gold Tier */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase text-amber-800">Gold Tier</div>
                  <div className="text-[11px] text-amber-700/80">10,000 - 29,999 Pts • 1.5x Multiplier</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-900">{goldCount}</div>
                  <div className="text-[10px] text-amber-700">{Math.round((goldCount / (members.length || 1)) * 100)}% base</div>
                </div>
              </div>

              {/* Silver Tier */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase text-slate-600">Silver Tier</div>
                  <div className="text-[11px] text-slate-500">5,000 - 9,999 Pts • 1.0x Base Rate</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{silverCount}</div>
                  <div className="text-[10px] text-slate-500">{Math.round((silverCount / (members.length || 1)) * 100)}% base</div>
                </div>
              </div>

              {/* Blue Tier */}
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase text-blue-600">Blue Tier</div>
                  <div className="text-[11px] text-blue-500">0 - 4,999 Pts • Entry Level</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-900">{blueCount}</div>
                  <div className="text-[10px] text-blue-500">{Math.round((blueCount / (members.length || 1)) * 100)}% base</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Campaigns Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <span>Active National Vouchers</span>
              </h3>
              <button 
                onClick={onNavigateToVouchers}
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
              >
                All Vouchers ({vouchers.length})
              </button>
            </div>

            <div className="space-y-3">
              {vouchers.slice(0, 2).map((v) => (
                <div key={v.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {v.code}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {v.discountType === 'PERCENTAGE' ? `${v.discountValue}% OFF` : `Rp ${(v.discountValue).toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate">{v.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>Used: <strong>{v.totalUsed}</strong> / {v.maxUsageLimit}</span>
                    <span>Exp: {v.validUntil}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Transaction Ledger Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Nationwide Live Transaction Stream</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time receipt logs pushed from cashier terminals across all 40+ stores</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Synced
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 rounded-l-xl">Timestamp</th>
                <th className="py-3.5 px-4">Receipt No.</th>
                <th className="py-3.5 px-4">Store Branch</th>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">Points Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((trx) => {
                const isEarn = trx.type === 'EARN' || (trx.type === 'MANUAL_ADJUSTMENT' && trx.pointsDelta > 0);

                return (
                  <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">
                      {trx.timestamp}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono text-xs">
                      {trx.receiptNo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {trx.storeName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">
                      {trx.memberName}
                      <span className="block text-[11px] text-slate-400 font-normal">{trx.memberPhone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        trx.type === 'EARN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : trx.type === 'REDEEM'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : trx.type === 'MANUAL_ADJUSTMENT'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {trx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold font-mono text-sm ${
                      isEarn ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {trx.pointsDelta > 0 ? `+${trx.pointsDelta}` : trx.pointsDelta} Pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
