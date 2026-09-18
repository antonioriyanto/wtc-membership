import React, { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Member } from '../types';

interface ProfileUploaderProps {
  member: Member;
  onUpdate: (base64Image: string) => void;
}

export const ProfileUploader: React.FC<ProfileUploaderProps> = ({ member, onUpdate }) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Setup canvas
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 150;
        
        // Calculate cropping dimensions for 1:1 aspect ratio
        let size = Math.min(img.width, img.height);
        let startX = (img.width - size) / 2;
        let startY = (img.height - size) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
          
          // Compress to Base64 (0.6 quality = ~60%)
          const base64String = canvas.toDataURL('image/jpeg', 0.6);
          
          try {
            // Save to Firestore
            const memberRef = doc(db, 'members', member.id);
            await updateDoc(memberRef, {
              avatarUrl: base64String
            });
            
            // Update local state
            onUpdate(base64String);
          } catch (error) {
            console.error("Error saving profile image:", error);
            alert("Gagal menyimpan foto profil.");
          } finally {
            setIsCompressing(false);
          }
        } else {
          setIsCompressing(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsCompressing(false);
      alert("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name: string) => {
    if (!name) return 'WTC';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-extrabold text-slate-400 tracking-tighter">
              {getInitials(member.name)}
            </span>
          )}
        </div>
        
        <button 
          onClick={() => !isCompressing && fileInputRef.current?.click()}
          disabled={isCompressing}
          className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </button>
        
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
      </div>
      {isCompressing && <p className="text-[10px] text-slate-500 mt-2 animate-pulse">Memproses foto...</p>}
    </div>
  );
};
