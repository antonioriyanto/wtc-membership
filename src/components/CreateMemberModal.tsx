import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, User, Mail, Calendar, AlertCircle, Store, Mars, Venus } from 'lucide-react';
import { Member } from '../types';

export const OFFICIAL_STORES = [
  "23 Paskal Bandung",
  "23 Semarang",
  "AEON Sentul",
  "Alianyang Singkawang",
  "Ambarukmo Plaza Jogja",
  "Ayani Pontianak",
  "BIG Mall Samarinda",
  "Bogor Botani",
  "Cibinong City Mall",
  "Ciputra Semarang",
  "DP Mall Semarang",
  "Duta Mall 1 Banjarmasin",
  "Duta Mall 2 Banjarmasin",
  "E-Walk Balikpapan",
  "Gaia Pontianak",
  "Gorontalo",
  "Jayapura",
  "Jogja City Mall",
  "Kendari",
  "Kota Kasablanka Jakarta",
  "Level 21 Bali",
  "Mall Olympic Garden 1 Malang",
  "Mall Olympic Garden 2 Malang",
  "Manado Town Square",
  "Pakuwon Mall Yogya",
  "Palu",
  "Panakukang",
  "Paragon Semarang",
  "Penta City Balikpapan",
  "Puri Jakarta",
  "Singkawang Grand Mall",
  "Solo Baru",
  "Solo Square",
  "Summarecon Mall Bandung",
  "The Park Sawangan Depok",
  "The Park Solo",
  "TSM Bali",
  "TSM Bandung",
  "TSM Cibubur",
  "TSM Makassar"
];

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMember: (member: Partial<Member>) => Promise<void>;
  defaultStore?: string;
  isStoreLocked?: boolean;
  members?: Member[];
  stores?: {name: string, code: string}[];
  onExistingMember?: (member: Member) => void;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  isOpen, onClose, onCreateMember, defaultStore = 'Puri Jakarta', isStoreLocked = true, members, stores, onExistingMember
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Pria' | 'Wanita'>('Pria');
  const [registeredStore, setRegisteredStore] = useState(defaultStore);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect on phone change
  useEffect(() => {
    if (phone && members) {
      const cleanDigits = phone.replace(/[^0-9]/g, '');
      if (cleanDigits.length >= 4) {
        const existing = members.find(m => {
          const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
          return m.phone === phone || (mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));
        });
        
        if (existing && onExistingMember) {
          onExistingMember(existing);
        }
      }
    }
  }, [phone, members, onExistingMember]);

  // Otomatis sinkronisasi toko pendaftaran dengan profil akun toko yang sedang login
  useEffect(() => {
    if (defaultStore) {
      setRegisteredStore(defaultStore);
    }
  }, [defaultStore, isOpen]);

    const storeList = Array.from(new Set([
    defaultStore, 
    ...(stores ? stores.map(s => s.name) : OFFICIAL_STORES)
  ].filter(Boolean))).sort();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !phone.trim()) {
      setErrorMessage('Nama Lengkap dan Nomor Handphone wajib diisi.');
      return;
    }
    
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    if (members && cleanDigits.length >= 4) {
      const existing = members.find(m => {
        const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
        return m.phone === phone || (mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));
      });
      
      if (existing) {
        if (onExistingMember) {
          onExistingMember(existing);
          return;
        } else {
          setErrorMessage('Nomor handphone sudah terdaftar!');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
            let code = 'PUR';
      if (stores) {
        const found = stores.find(s => s.name.toLowerCase() === registeredStore.toLowerCase());
        if (found && found.code) code = found.code;
      } else {
        const storeCodeMap: Record<string, string> = {
        'level 21 bali': 'L2B',
        'trans studio bali': 'TSMB',
        'e-walk balikpapan': 'EWB',
        'penta city balikpapan': 'PCB',
        'tsm bandung': 'TSMBND',
        'summarecon mall bandung': 'SMB',
        '23 paskal bandung': '2PB',
        'duta mall 1 banjarmasin': 'DUT',
        'duta mall 2 banjarmasin': 'DM2',
        'cibinong city mall': 'CCM',
        'aeon sentul': 'AEO',
        'bogor botani': 'BOG',
        'tsm cibubur': 'TSMC',
        'the park sawangan depok': 'TPSD',
        'kota kasablanka jakarta': 'KKJ',
        'puri jakarta': 'PUR',
        'panakukang': 'PAN',
        'tsm makassar': 'TSM',
        'mall olympic garden 1 malang': 'MOG1',
        'mall olympic garden 2 malang': 'MOG2',
        'manado town square': 'MTS',
        'singkawang grand mall': 'SGM',
        'palu': 'PAL',
        'ayani pontianak': 'AYA',
        'gaia pontianak': 'GAI',
        'gorontalo': 'GOR',
        'jayapura': 'JAY',
        'kendari': 'KEN',
        'paragon semarang': 'PAR',
        'ciputra semarang': 'CIP',
        'dp mall semarang': 'DMS',
        '23 semarang': '23S',
        'alianyang singkawang': 'ALI',
        'solo square': 'SOLSQ',
        'solo baru': 'SOLB',
        'the park solo': 'TPS',
        'ambarukmo plaza jogja': 'AMB',
        'jogja city mall': 'JCM',
        'pakuwon mall yogya': 'PMY'
      };
      }
      
      const generatedMembershipId = `${code}${Math.floor(1000 + Math.random() * 9000)}`;

      await onCreateMember({
        membershipId: generatedMembershipId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || '',
        birthDate: birthDate ? new Date(birthDate).toISOString() : '',
        gender,
        registeredStore,
        lastStoreVisited: registeredStore,
        joinDate: new Date().toISOString(),
        points: 0,
        lifetimePoints: 0,
        totalSpend: 0,
        tier: 'BLUE',
        status: 'ACTIVE'
      });
      setName('');
      setPhone('');
      setEmail('');
      setBirthDate('');
      setGender('Pria');
      setRegisteredStore(defaultStore);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftarkan member. Silakan periksa kembali data Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Daftar Member Baru
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="Contoh: Andi Pratama"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor Handphone *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="08123456789"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email (Opsional)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="andi.pratama@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Lahir (Opsional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Toko Pendaftaran (Store) *
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              {isStoreLocked ? (
                <input
                  type="text"
                  value={registeredStore}
                  readOnly
                  disabled
                  tabIndex={-1}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-not-allowed font-medium select-none pointer-events-none"
                />
              ) : (
                <select
                  value={registeredStore}
                  onChange={(e) => setRegisteredStore(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {storeList.map((store) => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jenis Kelamin</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setGender('Pria')}
                className={`py-2.5 px-3 text-sm font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  gender === 'Pria'
                    ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-600 shadow-xs ring-1 ring-blue-300'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-blue-50/70 hover:text-blue-800 hover:border-blue-200'
                }`}
              >
                <Mars className={`w-4 h-4 ${gender === 'Pria' ? 'text-blue-700 dark:text-blue-300' : 'text-blue-400'}`} />
                <span>Pria</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('Wanita')}
                className={`py-2.5 px-3 text-sm font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  gender === 'Wanita'
                    ? 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/70 dark:text-pink-200 dark:border-pink-600 shadow-xs ring-1 ring-pink-300'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-pink-50/70 hover:text-pink-800 hover:border-pink-200'
                }`}
              >
                <Venus className={`w-4 h-4 ${gender === 'Wanita' ? 'text-pink-700 dark:text-pink-300' : 'text-pink-400'}`} />
                <span>Wanita</span>
              </button>
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Daftar Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
