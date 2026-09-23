import { History } from 'lucide-react';
import React, { useState } from 'react';
import { 
  MessageSquare, AlertCircle, CheckCircle2, 
  Send, HelpCircle, Store, Tag, PlusCircle
} from 'lucide-react';
import { SupportTicket, StoreBranch } from '../types';

interface CashierSupportTicketsTabProps {
  currentStore: StoreBranch;
  cashierName: string;
  supportTickets: SupportTicket[];
  onSubmitTicket: (ticket: any) => Promise<void>;
}

export const CashierSupportTicketsTab: React.FC<CashierSupportTicketsTabProps> = ({
  currentStore,
  cashierName,
  supportTickets,
  onSubmitTicket
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<SupportTicket['category']>('CASHIER_HARDWARE');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketReceipt, setTicketReceipt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  // Filter tickets for this store
  const myTickets = supportTickets
    .filter(t => t.storeName === currentStore.name && t.source === 'CASHIER')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const hasUnresolvedTicket = myTickets.some(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasUnresolvedTicket) {
      alert('Anda masih memiliki tiket yang belum diselesaikan oleh Head Office. Harap tunggu atau balas tiket tersebut.');
      return;
    }
    
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitTicket({
        source: 'CASHIER',
        storeName: currentStore.name,
        cashierName: cashierName,
        receiptNo: ticketReceipt.trim() || '',
        subject: ticketSubject.trim(),
        category: ticketCategory,
        status: 'OPEN',
        priority: 'HIGH',
        messageText: ticketMessage.trim()
      });
      
      setSuccessNotice('Tiket berhasil dikirim ke Head Office!');
      setTicketSubject('');
      setTicketMessage('');
      setTicketReceipt('');
      
      setTimeout(() => {
        setSuccessNotice('');
        setActiveTab('HISTORY');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengirim tiket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-emerald-600" />
          Pusat Bantuan Kasir & Toko
        </h1>
        <p className="text-slate-500 font-medium mt-1">Ajukan keluhan atau laporkan kendala sistem langsung ke Tim Support Head Office.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* TABS */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`flex-1 py-4 text-center font-bold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'NEW' 
                ? 'border-emerald-600 text-emerald-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Ajukan Tiket Baru
            </div>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-4 text-center font-bold text-sm border-b-2 transition-colors cursor-pointer flex justify-center items-center gap-2 ${
              activeTab === 'HISTORY' 
                ? 'border-emerald-600 text-emerald-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Tiket Cabang</span>
            {myTickets.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono">
                {myTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 md:p-8">
          {activeTab === 'NEW' ? (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
              {hasUnresolvedTicket && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm font-semibold flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Tiket Aktif Ditemukan:</strong> Cabang Anda memiliki tiket kendala yang belum diselesaikan (Resolved). Anda tidak dapat mengajukan tiket baru sampai tiket sebelumnya ditutup. Cek di <button type="button" onClick={() => setActiveTab('HISTORY')} className="underline font-bold text-emerald-700 cursor-pointer">Riwayat Tiket Cabang</button>.
                  </div>
                </div>
              )}
              
              {successNotice && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-sm flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{successNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">Kategori Kendala *</label>
                  <select 
                    value={ticketCategory || 'MISSING_POINTS'}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-emerald-500 transition-colors"
                  >
                    <option value="MISSING_POINTS">Kesalahan Input Poin Transaksi</option>
                    <option value="VOUCHER_CLAIM">Kendala Redeem Voucher</option>
                    <option value="DATA_CORRECTION">Koreksi Data Member Salah Ketik</option>
                    <option value="CASHIER_HARDWARE">Kendala Scanner / Sistem Error</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">No. Struk (Opsional)</label>
                  <input
                    type="text"
                    value={ticketReceipt || ''}
                    onChange={(e) => setTicketReceipt(e.target.value)}
                    placeholder="Contoh: INV-2026-001"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">Judul Singkat *</label>
                <input
                  type="text"
                  required
                  value={ticketSubject || ''}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Contoh: Salah scan voucher diskon tapi poin sudah terpotong"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">Rincian Keluhan / Kendala *</label>
                <textarea
                  required
                  rows={4}
                  value={ticketMessage || ''}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Jelaskan detail kendala Anda, nama member yang terkait, atau error yang muncul di layar..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || hasUnresolvedTicket}
                className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Tiket ke Head Office</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {myTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-bold text-slate-700 text-lg">Belum ada riwayat tiket</p>
                  <p className="text-sm text-slate-500 mt-1">Jika mengalami kendala di toko, klik tab "Ajukan Tiket Baru".</p>
                </div>
              ) : (
                myTickets.map(t => (
                  <div key={t.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                          {t.id}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(t.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="font-bold text-slate-900 text-lg leading-tight">{t.subject}</div>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> {t.storeName} ({t.cashierName})</span>
                      <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {t.category.replace('_', ' ')}</span>
                      {t.receiptNo && <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 rounded-md text-slate-700 font-mono">Struk: {t.receiptNo}</span>}
                    </div>

                    {t.messages && t.messages.length > 0 && (
                      <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-100/50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-600">
                          Riwayat Pesan
                        </div>
                        <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                          {t.messages.map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'CASHIER' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                msg.sender === 'CASHIER' 
                                  ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' 
                                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
                              }`}>
                                <div className="text-[10px] font-bold opacity-60 mb-0.5">
                                  {msg.sender === 'CASHIER' ? 'Anda (Kasir)' : 'Head Office'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <div>{msg.content || msg.text}</div>
                              </div>
                            </div>
                          ))}
                        </div>
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
  );
};
