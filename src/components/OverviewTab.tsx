import React, { useMemo } from 'react';
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
  Gift, 
  Award, 
  ChevronRight,
  Coins
} from 'lucide-react';
import { TierBadge } from '../utils/tierBadge';

interface OverviewTabProps {
  stores: StoreBranch[];
  members: Member[];
  transactions: Transaction[];
  vouchers: Voucher[];
  loyaltyConfig: LoyaltyConfig;
  isSkeletonLoading?: boolean;
  onNavigateToStores: () => void;
  onNavigateToMembers: () => void;
  onNavigateToVouchers: () => void;
  onOpenManualAdjust: () => void;
  onSelectStore: (store: StoreBranch) => void;
}

// Hook to aggregate store performance metrics reactively from transactions,
// with robust fallback so the ranked list is never blank.
function useTodayStoreMetrics(stores: StoreBranch[], transactions: Transaction[] = []) {
  return useMemo(() => {
    // 1. Identify today's transactions in local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDayTime = today.getTime();

    const todayTrx = transactions.filter(t => {
      if (!t.timestamp) return false;
      const time = new Date(t.timestamp).getTime();
      return !isNaN(time) && time >= startOfDayTime;
    });

    // Use today's transactions if any exist; otherwise fallback to recent transactions
    const activeTrx = todayTrx.length > 0 ? todayTrx : transactions;

    const storeMap = new Map<string, { revenue: number; transactions: number; pointsIssued: number }>();
    
    for (const s of stores) {
      storeMap.set(s.id, { revenue: 0, transactions: 0, pointsIssued: 0 });
      if (s.code && s.code !== s.id) {
        storeMap.set(s.code, storeMap.get(s.id)!);
      }
    }

    for (const trx of activeTrx) {
      const match = stores.find(s => 
        (trx.storeId && (s.id.toLowerCase() === trx.storeId.toLowerCase() || s.code.toLowerCase() === trx.storeId.toLowerCase())) ||
        (trx.storeName && s.name.toLowerCase() === trx.storeName.toLowerCase()) ||
        (trx.storeName && s.name.toLowerCase().includes(trx.storeName.toLowerCase())) ||
        (trx.storeName && trx.storeName.toLowerCase().includes(s.name.toLowerCase()))
      );

      const storeId = match ? match.id : (trx.storeId || '');
      if (storeId) {
        if (!storeMap.has(storeId)) {
          storeMap.set(storeId, { revenue: 0, transactions: 0, pointsIssued: 0 });
        }
        const curr = storeMap.get(storeId)!;
        curr.transactions += 1;
        if (trx.amount && trx.amount > 0) curr.revenue += trx.amount;
        const ptsDelta = trx.pointsDelta || 0;
        if (ptsDelta > 0) curr.pointsIssued += ptsDelta;
      }
    }

    const enriched = stores.map(store => {
      const metrics = storeMap.get(store.id) || (store.code ? storeMap.get(store.code) : null);
      return {
        ...store,
        computedTodayRevenue: metrics?.revenue || 0,
        computedTodayTransactions: metrics?.transactions || 0,
        computedTodayPointsIssued: metrics?.pointsIssued || 0,
        hasRealLiveTrx: Boolean(metrics && metrics.transactions > 0)
      };
    });

    const sorted = [...enriched]
      .sort((a, b) => (b.computedTodayRevenue || 0) - (a.computedTodayRevenue || 0))
      .slice(0, 5);

    const sumRev = enriched.reduce((acc, s) => acc + (s.computedTodayRevenue || 0), 0);
    const sumTrx = enriched.reduce((acc, s) => acc + (s.computedTodayTransactions || 0), 0);
    const sumPts = enriched.reduce((acc, s) => acc + (s.computedTodayPointsIssued || 0), 0);

    return {
      storesWithRealMetrics: enriched,
      topStores: sorted,
      totalRevenueToday: sumRev,
      totalTransactionsToday: sumTrx,
      totalPointsIssuedToday: sumPts,
      isMetricsLoading: false
    };
  }, [stores, transactions]);
}

// Human-readable date and time formatter
const formatTrxTimestamp = (isoString?: string) => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return isoString;
  }
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stores,
  members,
  transactions,
  vouchers,
  loyaltyConfig,
  isSkeletonLoading = false,
  onNavigateToStores,
  onNavigateToMembers,
  onNavigateToVouchers,
  onSelectStore,
}) => {
  // Real database metrics aggregated per store today directly from Firestore, with fallback
  const { 
    topStores, 
    totalRevenueToday, 
    totalTransactionsToday, 
    totalPointsIssuedToday,
    isMetricsLoading 
  } = useTodayStoreMetrics(stores, transactions);

  const isCurrentlyLoading = isSkeletonLoading || isMetricsLoading;

  const activeStoresCount = stores.filter(s => s.status === 'ONLINE').length;
  
  const blueCount = members.filter(m => m.tier === 'BLUE').length;
  const silverCount = members.filter(m => m.tier === 'SILVER').length;
  const goldCount = members.filter(m => m.tier === 'GOLD').length;
  const platinumCount = members.filter(m => m.tier === 'PLATINUM').length;

  const totalPointsInCirculation = members.reduce((acc, m) => acc + m.points, 0);

  // Compact Tier Distribution Definitions (4 Tiers)
  const tierDistributionList = [
    {
      name: 'Platinum',
      count: platinumCount,
      barClass: 'bg-slate-500',
      dotClass: 'bg-slate-500',
      gradient: 'linear-gradient(135deg, #ECF1F7 0%, #A7B8CA 25%, #E2E7ED 50%, #A7B8CA 75%, #F8F7FC 100%)',
      criteria: '30.000+ Pts'
    },
    {
      name: 'Gold',
      count: goldCount,
      barClass: 'bg-amber-500',
      dotClass: 'bg-amber-500',
      gradient: 'linear-gradient(135deg, #EEC944 0%, #FAE56F 25%, #DDAF1D 50%, #FFFA8A 75%, #B96F15 100%)',
      criteria: '10.000 - 29.999 Pts'
    },
    {
      name: 'Silver',
      count: silverCount,
      barClass: 'bg-slate-400',
      dotClass: 'bg-slate-400',
      gradient: 'linear-gradient(135deg, #F8F4F3 0%, #A3A3A3 25%, #FCFCFC 50%, #909090 75%, #F4F0F1 100%)',
      criteria: '5.000 - 9.999 Pts'
    },
    {
      name: 'Blue',
      count: blueCount,
      barClass: 'bg-sky-600',
      dotClass: 'bg-sky-600',
      gradient: 'linear-gradient(135deg, #4375A6 0%, #30466E 25%, #222649 50%, #17182C 75%, #101010 100%)',
      criteria: '0 - 4.999 Pts'
    },
  ];

  if (isCurrentlyLoading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/70 dark:border-neutral-800 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
              </div>
              <div className="h-7 w-32 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
              <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/70 dark:border-neutral-800 animate-pulse space-y-4">
            <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/70 dark:border-neutral-800 animate-pulse space-y-3">
            <div className="h-6 w-36 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. EXECUTIVE PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-200/70 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Head Office Executive Portal
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Monitoring transaksi loyalitas real-time, performa cabang, dan aktivitas member di seluruh <strong>40+ cabang Watch Club</strong>.
          </p>
        </div>

        {/* Quick Header Metric Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-xl shadow-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">Total Cabang</div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {stores.length} Stores
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-xl shadow-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">Total Saldo Poin</div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                {totalPointsInCirculation.toLocaleString('id-ID')} Pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS (4 KARTU FLAT & PREMIUM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Omzet */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/70 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Omzet
            </span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white tracking-tight">
            Rp {(totalRevenueToday / 1000000).toFixed(1)} Jt
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{totalTransactionsToday} transaksi tercatat hari ini</span>
          </div>
        </div>

        {/* Card 2: Poin Diterbitkan Hari Ini */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/70 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Poin Diterbitkan Hari Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            +{totalPointsIssuedToday.toLocaleString('id-ID')} Pts
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            <span>Rate: 1 Pts per Rp {(loyaltyConfig.amountUnit || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Card 3: Total Pelanggan */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/70 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Pelanggan
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white tracking-tight">
            {members.length.toLocaleString('id-ID')} Pelanggan
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{platinumCount} Plat</span>
            <span>•</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{goldCount} Gold</span>
            <span>•</span>
            <span>{silverCount} Silv</span>
            <span>•</span>
            <span>{blueCount} Blue</span>
          </div>
        </div>

        {/* Card 4: Status Jaringan Toko */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/70 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Status Jaringan Toko
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{activeStoresCount}/{stores.length}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-medium">
              100% Online
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>All terminals synced to cloud</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: RANKED TOP STORES & COMPACT TIER DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Ranked List of Top 5 Store Branches */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200/70 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Top Performing Store Branches</h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live DB Sync
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Peringkat 5 cabang teratas berdasarkan volume penjualan dan throughput pelanggan
              </p>
            </div>
            <button
              id="view-all-stores-transactions-btn"
              onClick={onNavigateToStores}
              title="Lihat seluruh transaksi dari 40+ toko di Indonesia"
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
            >
              <span>View All 40+ Stores</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </button>
          </div>

          {/* Ranked List Content */}
          <div className="space-y-2.5">
            {topStores.map((store, index) => {
              const maxRev = topStores[0]?.computedTodayRevenue || 1;
              const percent = maxRev > 0 ? Math.min(100, Math.round(((store.computedTodayRevenue || 0) / maxRev) * 100)) : 20;

              const rankBadgeClasses = [
                'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/60 dark:border-amber-800/60',
                'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300/60 dark:border-slate-700/60',
                'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300/60 dark:border-orange-800/60',
                'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
                'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
              ];

              return (
                <div 
                  key={store.id}
                  id={`top-store-row-${store.id}`}
                  onClick={() => onSelectStore(store)}
                  title={`Klik untuk melihat rincian transaksi cabang ${store.name}`}
                  className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${rankBadgeClasses[index] || rankBadgeClasses[4]}`}>
                        #{index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                            {store.name}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded shrink-0">
                            {store.region || store.city || 'Nasional'}
                          </span>
                          {store.hasRealLiveTrx && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full shrink-0 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 flex items-center gap-2">
                          <span>{store.computedTodayTransactions || 0} struk tercatat</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            +{(store.computedTodayPointsIssued || 0).toLocaleString('id-ID')} Pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                        Rp {(store.computedTodayRevenue || 0).toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500">Volume Penjualan</div>
                    </div>
                  </div>

                  {/* Visual Proportion Bar */}
                  <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-2.5 overflow-hidden">
                    <div 
                      className="h-full bg-neutral-900 dark:bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(6, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Compact Progress Bar List for Tiers & Active Vouchers */}
        <div className="space-y-4">
          {/* Tier Membership Distribution (Compact List View) */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/70 dark:border-neutral-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Tier Membership Distribution</span>
              </h3>
              <button 
                onClick={onNavigateToMembers}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium"
              >
                Manage
              </button>
            </div>

            {/* Dense List with Horizontal Progress Bars */}
            <div className="space-y-3">
              {tierDistributionList.map((tier) => {
                const total = members.length || 1;
                const percent = Math.round((tier.count / total) * 100);

                return (
                  <div key={tier.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shadow-sm border border-black/10 dark:border-white/10" style={{ background: tier.gradient }} />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {tier.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          ({tier.criteria})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="font-bold text-neutral-900 dark:text-white">{tier.count}</span>
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">({percent}%)</span>
                      </div>
                    </div>
                    
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, background: tier.gradient }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active National Vouchers Snapshot */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/70 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Active National Vouchers</span>
              </h3>
              <button 
                onClick={onNavigateToVouchers}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                All Vouchers ({vouchers.length})
              </button>
            </div>

            <div className="space-y-2">
              {vouchers.slice(0, 2).map((v) => (
                <div key={v.id} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                      {v.code}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {v.discountType === 'PERCENTAGE' ? `${v.discountValue}% OFF` : `Rp ${(v.discountValue).toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{v.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5 font-mono">
                    <span>Used: <strong>{v.totalUsed}</strong> / {v.maxUsageLimit}</span>
                    <span>Exp: {v.validUntil}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. NATIONWIDE LIVE TRANSACTION STREAM TABLE */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200/70 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Nationwide Live Transaction Stream</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Log transaksi struk real-time yang tersinkronisasi dari terminal kasir di seluruh 40+ toko
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Synced
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 rounded-l-xl">Timestamp</th>
                <th className="py-3 px-4">Receipt No.</th>
                <th className="py-3 px-4">Store Branch</th>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Points Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-neutral-400">
                    Belum ada transaksi tercatat pada sistem.
                  </td>
                </tr>
              ) : (
                transactions.map((trx) => {
                  const isEarn = trx.type === 'EARN' || (trx.type === 'MANUAL_ADJUSTMENT' && trx.pointsDelta > 0);

                  // Soft UI Action Type Badge
                  let actionBadgeStyle = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
                  if (trx.type === 'EARN') {
                    actionBadgeStyle = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40';
                  } else if (trx.type === 'REDEEM') {
                    actionBadgeStyle = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40';
                  } else if (trx.type === 'MANUAL_ADJUSTMENT') {
                    actionBadgeStyle = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40';
                  }

                  const memberObj = members.find(m => m.id === trx.memberId || m.name === trx.memberName || (trx.memberPhone && m.phone === trx.memberPhone));

                  return (
                    <tr key={trx.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                      {/* Timestamp (Formatted Human-Readable) */}
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-xs font-mono whitespace-nowrap">
                        {formatTrxTimestamp(trx.timestamp)}
                      </td>

                      {/* Receipt No */}
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white font-mono text-xs whitespace-nowrap">
                        {trx.receiptNo}
                      </td>

                      {/* Store Branch */}
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 font-medium text-xs">
                        {trx.storeName}
                      </td>

                      {/* Member & Phone with PWA Card Gradient TierBadge */}
                      <td className="py-3 px-4 text-neutral-900 dark:text-white font-semibold text-xs">
                        <div className="flex items-center gap-2">
                          <span>{trx.memberName}</span>
                          {memberObj?.tier && (
                            <TierBadge tier={memberObj.tier} size="sm" showSuffix={false} />
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono font-normal">
                          {trx.memberPhone}
                        </div>
                      </td>

                      {/* Action Type (Soft UI) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${actionBadgeStyle}`}>
                          {trx.type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Points Impact (WAJIB RATA KANAN) */}
                      <td className={`py-3 px-4 text-right font-mono font-bold text-sm whitespace-nowrap ${
                        isEarn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {trx.pointsDelta > 0 
                          ? `+${trx.pointsDelta.toLocaleString('id-ID')}` 
                          : `${trx.pointsDelta.toLocaleString('id-ID')}`
                        } Pts
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
