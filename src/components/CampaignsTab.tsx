import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Users, 
  Sparkles, 
  Check, 
  X, 
  Ticket, 
  Tag, 
  Layers, 
  Eye, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle,
  BellRing
} from 'lucide-react';
import { Campaign, Voucher } from '../types';

interface CampaignsTabProps {
  campaigns: Campaign[];
  onAddCampaign: (campaign: Campaign) => void;
  onToggleCampaignStatus: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
  vouchers: Voucher[];
  isSkeletonLoading?: boolean;
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaigns,
  onAddCampaign,
  onToggleCampaignStatus,
  onDeleteCampaign,
  vouchers,
  isSkeletonLoading = false
}) => {
  if (isSkeletonLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for new campaign
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
  const [targetAudience, setTargetAudience] = useState<Campaign['targetAudience']>('ALL');
  const [voucherCode, setVoucherCode] = useState('');
  const [badgeText, setBadgeText] = useState('🔥 PROMO SPESIAL MEMBER');
  const [showAsPopupOnApp, setShowAsPopupOnApp] = useState(true);
  const [initialActive, setInitialActive] = useState(true);

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.headline && c.headline.toLowerCase().includes(search.toLowerCase())) ||
    c.content.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;
  const popupCount = campaigns.filter(c => c.status === 'ACTIVE' && c.showAsPopupOnApp).length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    const newCamp: Campaign = {
      id: 'CMP-' + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      headline: headline.trim() || name.trim(),
      type: 'POPUP_BANNER',
      status: initialActive ? 'ACTIVE' : 'DRAFT',
      targetAudience,
      content: content.trim(),
      badgeText: badgeText.trim() || '🔥 PROMO SPESIAL',
      voucherCode: voucherCode.trim() || '',
      bannerImage: bannerImage.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      showAsPopupOnApp,
      sentCount: initialActive ? 15420 : 0,
      openCount: initialActive ? 8420 : 0,
      clickCount: initialActive ? 3210 : 0
    };

    onAddCampaign(newCamp);
    setIsCreateModalOpen(false);

    // Reset form
    setName('');
    setHeadline('');
    setContent('');
    setBannerImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
    setVoucherCode('');
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900">Comms & Campaigns Hub</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {activeCount} Kampanye Aktif
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Kelola pengumuman promo & pop-up banner otomatis yang langsung muncul di aplikasi web member saat pelanggan membuka portal.
          </p>
        </div>

        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Buat Kampanye Baru
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Total Kampanye</div>
            <div className="text-2xl font-black text-slate-900">{campaigns.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tersimpan di sistem</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Pop-up Banner Aktif</div>
            <div className="text-2xl font-black text-emerald-600">{popupCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ditampilkan saat member buka web</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Voucher Siap Ditautkan</div>
            <div className="text-2xl font-black text-blue-600">
              {vouchers.filter(v => v.status === 'ACTIVE').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Voucher aktif untuk klaim promo</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari kampanye berdasarkan nama atau isi promo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors" 
          />
        </div>
      </div>

      {/* CAMPAIGNS LIST */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Kampanye & Headline</th>
                <th className="py-3.5 px-5">Target Audiens Tier</th>
                <th className="py-3.5 px-5">Voucher Ditautkan</th>
                <th className="py-3.5 px-5">Pop-up Web Member</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Megaphone className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">Belum ada kampanye ditemukan</p>
                    <p className="text-xs text-slate-400">Klik "Buat Kampanye Baru" untuk menambahkan promo banner.</p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(c => {
                  const isActive = c.status === 'ACTIVE';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Headline */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                        {c.headline && (
                          <div className="text-xs text-emerald-800 font-semibold mt-0.5">
                            "{c.headline}"
                          </div>
                        )}
                        <div className="text-slate-500 mt-1 line-clamp-1 max-w-md">
                          {c.content}
                        </div>
                      </td>

                      {/* Target Audience */}
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-bold uppercase tracking-wider">
                          {c.targetAudience === 'ALL' ? 'Semua Tier (All Members)' : `Khusus ${c.targetAudience}`}
                        </span>
                      </td>

                      {/* Voucher Linked */}
                      <td className="py-4 px-5">
                        {c.voucherCode ? (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono font-bold">
                            {c.voucherCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Tanpa voucher</span>
                        )}
                      </td>

                      {/* Push Pop On Member App */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          c.showAsPopupOnApp && isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          {c.showAsPopupOnApp && isActive ? 'Tayang di Web Member' : 'Non-aktif'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => onToggleCampaignStatus(c.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {c.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => onDeleteCampaign(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Kampanye"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Buat Kampanye & Banner Web Member</h4>
                  <p className="text-[11px] text-slate-500">Muncul otomatis saat member membuka web app</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Kampanye (Internal HO) *
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Promo Spesial Anniversary Watch Club 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Judul Pop-up Banner (Dilihat Pelanggan) *
                </label>
                <input 
                  type="text" 
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Contoh: Dapatkan Tambahan Diskon 20% Koleksi Eksklusif!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Isi Pesan Promosi *
                </label>
                <textarea 
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contoh: Berlaku khusus untuk member setia di seluruh gerai Watch Club Indonesia. Tunjukkan kode voucher di kasir saat pembayaran."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  URL Gambar Banner Pop-up (Rasio 3:4 JPG/PNG) *
                </label>
                <input 
                  type="text" 
                  required
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Gambar vertikal rasio 3:4 yang akan muncul sebagai pop-up utama saat customer login & latar belakang notifikasi.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Target Audiens Tier
                  </label>
                  <select 
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none"
                  >
                    <option value="ALL">Semua Member (All)</option>
                    <option value="BLUE">Khusus Blue</option>
                    <option value="SILVER">Khusus Silver</option>
                    <option value="GOLD">Khusus Gold</option>
                    <option value="PLATINUM">Khusus Platinum</option>
                    <option value="DIAMOND">Khusus Diamond</option>
                    <option value="BLACK">Khusus Black</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tautkan Kode Voucher
                  </label>
                  <select
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none"
                  >
                    <option value="">-- Tanpa Voucher --</option>
                    {vouchers.map(v => (
                      <option key={v.id} value={v.code}>
                        {v.code} ({v.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showAsPopupOnApp}
                    onChange={(e) => setShowAsPopupOnApp(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">
                    Tampilkan Push-Pop Banner saat member buka web app
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={initialActive}
                    onChange={(e) => setInitialActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">
                    Aktifkan kampanye sekarang juga
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Simpan & Luncurkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
