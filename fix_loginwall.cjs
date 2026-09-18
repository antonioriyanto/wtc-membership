const fs = require('fs');

let l = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');

// The file currently has a garbage `const handleLogin` at the top because of the previous bad replace.
// Let's drop everything before the actual return statement of the component and rewrite the top manually.
// Wait, I can just find the `<div className="w-full max-w-md mx-auto">` which is the start of the JSX return.
const jsxStart = l.indexOf('return (');

const importsAndTop = `import React, { useState } from 'react';
import { User, KeyRound, ShieldCheck, Eye, EyeOff, Lock, ChevronDown, LogIn } from 'lucide-react';
import { hashStringSHA256, STORE_PIN_HASHES, setOfflineMode } from '../lib/authHelper';

export const STORE_ACCOUNTS = [
  { name: '23 Paskal Bandung', username: '23PSC' },
  { name: '23 Semarang', username: '23SMG' },
  { name: 'AEON Sentul', username: 'AMSC' },
  { name: 'Alianyang Singkawang', username: 'ALIAN' },
  { name: 'Ambarukmo Plaza Jogja', username: 'AMB' },
  { name: 'Ayani Pontianak', username: 'AYANI' },
  { name: 'BIG Mall Samarinda', username: 'BIG' },
  { name: 'Bogor Botani', username: 'BOS' },
  { name: 'Cibinong City Mall', username: 'CCM' },
  { name: 'Ciputra Semarang', username: 'CL' },
  { name: 'DP Mall Semarang', username: 'DPM' },
  { name: 'Duta Mall 1 Banjarmasin', username: 'DTM1' },
  { name: 'Duta Mall 2 Banjarmasin', username: 'DTM2' },
  { name: 'E-Walk Balikpapan', username: 'EWALK' },
  { name: 'Gaia Pontianak', username: 'GAIA' },
  { name: 'Gorontalo', username: 'GTLO' },
  { name: 'Jayapura', username: 'JYP' },
  { name: 'Jogja City Mall', username: 'JCM' },
  { name: 'Kendari', username: 'KDI' },
  { name: 'Kota Kasablanka Jakarta', username: 'KOKAS' },
  { name: 'Level 21 Bali', username: 'LVL21' },
  { name: 'Mall Olympic Garden 1 Malang', username: 'MOG1' },
  { name: 'Mall Olympic Garden 2 Malang', username: 'MOG2' },
  { name: 'Manado Town Square', username: 'MANTS' },
  { name: 'Pakuwon Mall Yogya', username: 'PMJ' },
  { name: 'Palu', username: 'PALU' },
  { name: 'Panakukang', username: 'KUKA' },
  { name: 'Paragon Semarang', username: 'PRG' },
  { name: 'Penta City Balikpapan', username: 'PENTA' },
  { name: 'Puri Jakarta', username: 'PIM' },
  { name: 'Singkawang Grand Mall', username: 'SGM' },
  { name: 'Solo Baru', username: 'SOBAR' },
  { name: 'Solo Square', username: 'SQ' },
  { name: 'Summarecon Mall Bandung', username: 'SMB' },
  { name: 'The Park Sawangan Depok', username: 'SWG' },
  { name: 'The Park Solo', username: 'PARK' },
  { name: 'TSM Bali', username: 'BALI' },
  { name: 'TSM Bandung', username: 'TSM' },
  { name: 'TSM Cibubur', username: 'CBB' },
  { name: 'TSM Makassar', username: 'FINE' }
];

interface LoginWallProps {
  onLoginSuccess: (role: 'HO_ADMIN' | 'CASHIER' | 'CUSTOMER', storeId?: string) => void;
  title?: string;
  subtitle?: string;
  isHO?: boolean;
  storeId?: string;
  showStoreQuickSelect?: boolean;
}

export const LoginWall: React.FC<LoginWallProps> = ({ 
  onLoginSuccess, 
  title = "Selamat Datang", 
  subtitle = "Silakan login untuk melanjutkan",
  isHO = false,
  storeId,
  showStoreQuickSelect = false
}) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

  const filteredStores = STORE_ACCOUNTS.filter(s => 
    s.name.toLowerCase().includes(username.toLowerCase()) || 
    s.username.toLowerCase().includes(username.toLowerCase())
  );

  const selectedStoreObj = STORE_ACCOUNTS.find(s => s.username.toUpperCase() === username.toUpperCase());

  const loginMock = (role: 'HO_ADMIN' | 'CASHIER' | 'CUSTOMER', stId?: string) => {
    // Helper function: if login is successful, redirect dynamically
    onLoginSuccess(role, stId);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const u = username.trim().toUpperCase();
    const p = pin.trim();

    if (!u || !p) {
      setError('Mohon lengkapi ID Toko dan PIN');
      setIsLoading(false);
      return;
    }

    let isHOUser = false;
    if (u === 'ADMIN' || u === 'HO' || u === 'ADMINWTC') {
      isHOUser = true;
    } else {
      const isStoreAccount = STORE_ACCOUNTS.some(s => s.username.toUpperCase() === u);
      if (!isStoreAccount && !showStoreQuickSelect) {
         setError('Akun ini adalah akun Kasir Toko. Silakan masuk melalui portal kasir.');
         setIsLoading(false);
         return;
      } else if (!isStoreAccount) {
         setError('Login ID (Username) toko tidak ditemukan.');
         setIsLoading(false);
         return;
      }
    }

    try {
      const type = isHOUser ? 'HO' : 'CASHIER';
      const currentStoreId = storeId || u;
      
      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username: u, pin: p, type, storeId: currentStoreId })
      });
      
      const rawText = await response.text();
      const isIntercepted = rawText.includes('<!doctype html>') || rawText.includes('<html') || rawText.includes('Action required');
      
      if (!response.ok || isIntercepted) {
        throw new Error('Network Issue or Proxy Interception');
      }

      const result = JSON.parse(rawText);
      if (result.success) {
        setOfflineMode(false);
        
        let finalStoreId = currentStoreId;
        if (!isHOUser && showStoreQuickSelect) {
           const foundStore = STORE_ACCOUNTS.find(s => s.username.toUpperCase() === u);
           if (foundStore) {
             finalStoreId = foundStore.username;
           }
        }
        
        loginMock(result.role, finalStoreId);
      } else {
        setError(result.error || 'Gagal masuk');
      }
    } catch (err) {
      console.warn('Peladen utama tidak dapat dijangkau. Beralih ke verifikasi kriptografi lokal (Secure Offline Mode)...');
      
      try {
        const hashedInputPin = await hashStringSHA256(p);
        const targetStoreId = isHOUser ? 'HO' : (storeId || u);
        
        const validHashForStore = STORE_PIN_HASHES[targetStoreId];
        
        if (validHashForStore && validHashForStore === hashedInputPin) {
          setOfflineMode(true);
          const role = isHOUser ? 'HO_ADMIN' : 'CASHIER';
          
          let finalStoreId = targetStoreId;
          if (!isHOUser && showStoreQuickSelect) {
             const foundStore = STORE_ACCOUNTS.find(s => s.username.toUpperCase() === u);
             if (foundStore) finalStoreId = foundStore.username;
          }
          
          loginMock(role, finalStoreId);
        } else {
          setError('Kredensial tidak valid (Verifikasi Luring Gagal)');
        }
      } catch (hashErr) {
        setError('Terjadi kesalahan sistem saat memverifikasi keamanan (Kriptografi Gagal).');
      }
    } finally {
      setIsLoading(false);
    }
  };

  `;

fs.writeFileSync('src/components/LoginWall.tsx', importsAndTop + l.substring(jsxStart));
