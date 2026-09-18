import React, { useState } from 'react';
import { LoyaltyConfig } from '../types';
import { 
  Award, 
  Settings2, 
  Sparkles, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Calculator,
  HelpCircle,
  CheckCircle,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { TierBadge } from '../utils/tierBadge';

interface LoyaltyRulesTabProps {
  config: LoyaltyConfig;
  setConfig?: (newConfig: LoyaltyConfig) => void;
  onSaveConfig?: (newConfig: LoyaltyConfig) => void;
  isSkeletonLoading?: boolean;
}

export const LoyaltyRulesTab: React.FC<LoyaltyRulesTabProps> = ({
  config,
  setConfig,
  onSaveConfig,
  isSkeletonLoading = false
}) => {
  if (isSkeletonLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }
  const [formData, setFormData] = useState<LoyaltyConfig>({ ...config });
  const [testSpend, setTestSpend] = useState<number>(1254000);
  const [testTier, setTestTier] = useState<'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM'>('BLUE');
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (config) {
      setFormData(prev => ({ ...prev, ...config }));
    }
  }, [config]);

  const handleChange = (field: keyof LoyaltyConfig, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Auto-save for toggles for better UX
      if (typeof value === 'boolean') {
        if (typeof onSaveConfig === 'function') onSaveConfig(next);
        if (typeof setConfig === 'function') setConfig(next);
        try {
          localStorage.setItem('wtc_loyalty_config', JSON.stringify(next));
          window.dispatchEvent(new CustomEvent('wtc_loyalty_config_updated', { detail: next }));
        } catch {}
        setIsSaved(true);
      }
      return next;
    });
    if (typeof value !== 'boolean') {
      setIsSaved(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedConfig = {
      ...formData,
      amountUnit: Number(formData.amountUnit) > 0 ? Number(formData.amountUnit) : 10000,
      pointsPerAmount: Number(formData.pointsPerAmount) > 0 ? Number(formData.pointsPerAmount) : 1,
      goldMultiplier: Number(formData.goldMultiplier) > 0 ? Number(formData.goldMultiplier) : 1.25,
      platinumMultiplier: Number(formData.platinumMultiplier) > 0 ? Number(formData.platinumMultiplier) : 1.75,
    };
    if (onSaveConfig) onSaveConfig(sanitizedConfig);
    if (setConfig) setConfig(sanitizedConfig);
    try {
      localStorage.setItem('wtc_loyalty_config', JSON.stringify(sanitizedConfig));
      window.dispatchEvent(new CustomEvent('wtc_loyalty_config_updated', { detail: sanitizedConfig }));
    } catch {}
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  // Test Points Calculation
  const unit = Number(formData.amountUnit) > 0 ? Number(formData.amountUnit) : 10000;
  const perAmount = Number(formData.pointsPerAmount) > 0 ? Number(formData.pointsPerAmount) : 1;
  const basePoints = Math.floor(testSpend / unit) * perAmount;
  let multiplier = 1.0;
  if (testTier === 'GOLD') multiplier = Number(formData.goldMultiplier) || 1.25;
  if (testTier === 'PLATINUM') multiplier = Number(formData.platinumMultiplier) || 1.75;
  const calculatedPoints = Math.floor(basePoints * multiplier);

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Loyalty & Tier Multiplier Engine</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centrally control point earning algorithms, VIP thresholds, and nationwide automated promotions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save & Deploy Rules</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-fadeIn text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Loyalty rules successfully deployed across all 40+ cashier terminals!</span>
        </div>
      )}

      {/* Grid: Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Tier Multipliers & Base Earning */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Base Ratio */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Base Point Earning Ratio</h3>
                <p className="text-xs text-slate-500">How many points are awarded per Indonesian Rupiah transaction value</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Transaction Unit (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={formData.amountUnit || 0}
                    onChange={(e) => handleChange('amountUnit', parseInt(e.target.value) || 10000)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Standard: Rp 10.000 per base point</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Points Issued Per Unit
                </label>
                <input
                  type="number"
                  value={formData.pointsPerAmount || 0}
                  onChange={(e) => handleChange('pointsPerAmount', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">E.g., 1 Pt per Rp 10.000 spent</p>
              </div>
            </div>
          </div>

          {/* Card 2: Tier Thresholds & Multipliers */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Member Tiers & VIP Point Multipliers</h3>
                <p className="text-xs text-slate-500">Configure point thresholds and earning multipliers across all 4 member tiers (Blue, Silver, Gold, Platinum)</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Blue Rule */}
              <div className="p-4 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #4375A6 0%, #30466E 25%, #222649 50%, #17182C 75%, #101010 100%)' }}>
                <div>
                  <TierBadge tier="BLUE" size="md" />
                  <div className="text-xs text-white/70 mt-1">Starting level for all new registered shoppers (Entry Tier)</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-semibold text-white">
                    0 - {((formData.silverThreshold || 5000) - 1).toLocaleString('id-ID')} Pts
                  </div>
                  <div className="text-xs font-bold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                    1.0x Rate
                  </div>
                </div>
              </div>

              {/* Silver Rule */}
              <div className="p-4 rounded-2xl border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #F8F4F3 0%, #A3A3A3 25%, #FCFCFC 50%, #909090 75%, #F4F0F1 100%)' }}>
                <div>
                  <TierBadge tier="SILVER" size="md" />
                  <div className="text-xs text-slate-700 mt-1">Regular shoppers with introductory spending</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-slate-800">Min. Points:</div>
                  <input
                    type="number"
                    value={formData.silverThreshold ?? 5000}
                    onChange={(e) => handleChange('silverThreshold', parseInt(e.target.value) || 5000)}
                    className="w-24 px-3 py-1.5 bg-white/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 backdrop-blur-sm"
                  />
                  <div className="text-xs font-bold text-slate-900 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                    1.0x Rate
                  </div>
                </div>
              </div>

              {/* Gold Rule */}
              <div className="p-4 rounded-2xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #EEC944 0%, #FAE56F 25%, #DDAF1D 50%, #FFFA8A 75%, #B96F15 100%)' }}>
                <div>
                  <TierBadge tier="GOLD" size="md" />
                  <div className="text-xs text-amber-900/80 mt-1">Frequent watch collectors and repeat buyers</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-amber-900">Min. Points:</div>
                  <input
                    type="number"
                    value={formData.goldThreshold || 0}
                    onChange={(e) => handleChange('goldThreshold', parseInt(e.target.value) || 500)}
                    className="w-24 px-3 py-1.5 bg-white/80 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 backdrop-blur-sm"
                  />
                  <div className="text-xs font-semibold text-amber-900">Multiplier:</div>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.goldMultiplier || 0}
                    onChange={(e) => handleChange('goldMultiplier', parseFloat(e.target.value) || 1.25)}
                    className="w-20 px-3 py-1.5 bg-white/80 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Platinum Rule */}
              <div className="p-4 rounded-2xl border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #ECF1F7 0%, #A7B8CA 25%, #E2E7ED 50%, #A7B8CA 75%, #F8F7FC 100%)' }}>
                <div>
                  <TierBadge tier="PLATINUM" size="md" />
                  <div className="text-xs text-slate-600 mt-1">Prestige club members (Top Tier VIP)</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-slate-800">Min. Points:</div>
                  <input
                    type="number"
                    value={formData.platinumThreshold || 0}
                    onChange={(e) => handleChange('platinumThreshold', parseInt(e.target.value) || 30000)}
                    className="w-24 px-3 py-1.5 bg-white/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 backdrop-blur-sm"
                  />
                  <div className="text-xs font-semibold text-slate-800">Multiplier:</div>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.platinumMultiplier || 0}
                    onChange={(e) => handleChange('platinumMultiplier', parseFloat(e.target.value) || 2.0)}
                    className="w-20 px-3 py-1.5 bg-white/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Anti-Fraud & Security Policy */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Security & Operational Automation</h3>
                <p className="text-xs text-slate-500">Nationwide validation protocols to prevent double redemption fraud</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900">Atomic Single-Use Voucher Lock</div>
                  <div className="text-[11px] text-slate-500">Immediately locks promo QR upon first scan across all 40+ stores</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableStrictVoucherSingleUse || false}
                  onChange={(e) => handleChange('enableStrictVoucherSingleUse', e.target.checked)}
                  className="w-5 h-5 accent-slate-900 mt-1 cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900">Automated WhatsApp Receipt Push</div>
                  <div className="text-[11px] text-slate-500">Send WhatsApp notification to customer after points are added by cashier</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableWhatsAppNotifications || false}
                  onChange={(e) => handleChange('enableWhatsAppNotifications', e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 mt-1 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Calculator Sandbox */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-base">Live Calculation Simulator</h3>
            </div>
            
            <p className="text-xs text-slate-400">
              Verify how your configured multipliers and spending ratios will calculate on the cashier terminals in real time.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Simulation Transaction Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="100000"
                    value={testSpend}
                    onChange={(e) => setTestSpend(parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-bold text-amber-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Customer Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BLUE', 'SILVER', 'GOLD', 'PLATINUM'] as const).map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setTestTier(tier)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        testTier === tier 
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 mt-4">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Base Calculation:</span>
                  <span>{basePoints} Pts</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tier Multiplier:</span>
                  <span className="text-amber-300 font-bold">{multiplier}x</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between items-center text-sm font-bold text-white">
                  <span>Total Awarded:</span>
                  <span className="text-lg font-mono text-emerald-400">+{calculatedPoints} Pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
