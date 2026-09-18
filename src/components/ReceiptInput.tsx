import React, { useState, useMemo } from 'react';
import { getStoreCode, PosType } from '../lib/storeMapping';

interface ReceiptInputProps {
  branchName: string;
  posType: PosType;
  onReceiptChange: (fullReceiptString: string) => void;
  disabled?: boolean;
}

export const ReceiptInput: React.FC<ReceiptInputProps> = ({ branchName, posType, onReceiptChange, disabled }) => {
  const [runningNumber, setRunningNumber] = useState('');

  // Hitung kode toko berdasarkan helper (Segmen 2)
  const storeCode = getStoreCode(branchName, posType) || 'UNKNOWN';

  // Hitung Year & Month saat ini untuk format YYMM (Segmen 3)
  const yymm = useMemo(() => {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}`;
  }, []);

  // Tangkap perubahan input agar hanya menerima angka, maksimal 5 karakter
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setRunningNumber(val);
    if (val.trim() !== '') {
      const padded = val.padStart(5, '0');
      const fullReceipt = `JL-INV/${storeCode}/${yymm}/${padded}`;
      onReceiptChange(fullReceipt);
    } else {
      onReceiptChange('');
    }
  };

  // Event Blur: Eksekusi Auto-Padding menjadi 5 digit dan tembak data ke parent
  const handleNumberBlur = () => {
    if (runningNumber.trim() !== '') {
      const padded = runningNumber.padStart(5, '0');
      setRunningNumber(padded);
      const fullReceipt = `JL-INV/${storeCode}/${yymm}/${padded}`;
      onReceiptChange(fullReceipt);
    } else {
      onReceiptChange('');
    }
  };

  return (
    <div className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <label className="block text-slate-700 dark:text-slate-300 font-semibold text-[0.85rem] mb-2">
        Nomor Struk (Auto-Format)
      </label>
      
      {/* UI Segmen Berjejer / Grouped Input */}
      <div className="flex w-full items-center bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-black focus-within:border-black transition-all">
        
        {/* Segmen 1: Prefix Statis */}
        <div className="px-3 py-2.5 bg-neutral-50 text-neutral-600 font-bold text-sm border-r border-gray-300 select-none flex-shrink-0">
          JL-INV
        </div>
        
        {/* Segmen 2: Kode Toko Dinamis */}
        <div className="px-3 py-2.5 bg-neutral-50 text-neutral-600 font-bold text-sm border-r border-gray-300 select-none flex-shrink-0">
          {storeCode}
        </div>
        
        {/* Segmen 3: Format YYMM Dinamis */}
        <div className="px-3 py-2.5 bg-neutral-50 text-neutral-600 font-bold text-sm border-r border-gray-300 select-none flex-shrink-0">
          {yymm}
        </div>
        
        {/* Segmen 4: Running Number (Input Interaktif) */}
        <input
          type="text"
          value={runningNumber}
          onChange={handleNumberChange}
          onBlur={handleNumberBlur}
          placeholder="00000"
          maxLength={5}
          disabled={disabled}
          className="flex-1 px-4 py-2.5 w-full outline-none text-sm font-bold text-gray-900 tracking-widest placeholder-gray-300 bg-transparent"
        />
        
      </div>
      <p className="mt-1.5 text-xs text-gray-500 font-medium">
        Cukup ketik digit terakhir struk. Sistem akan otomatis melengkapi formatnya (misal: ketik 255 otomatis jadi 00255).
      </p>
    </div>
  );
};
